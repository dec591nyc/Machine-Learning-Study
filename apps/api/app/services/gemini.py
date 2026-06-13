from __future__ import annotations

import json

import httpx

from app.config import Settings
from app.schemas import AiAskRequest, AiAskResponse


SYSTEM_INSTRUCTION = """你是 Industry ML Workbench 的機器學習實務助理。
只能回答機器學習模型、參數、指標、實驗診斷與業界落地相關問題。
使用繁體中文，先直接回答，再提出一個具體可操作的下一步。
以使用者目前頁面 context 為準，不得捏造資料、企業案例或模型結果。
若資訊不足，明確指出缺少什麼。不要提供任意程式碼執行或規避安全限制的方法。
回答控制在 350 個中文字以內，使用短段落或簡短條列。"""


class GeminiServiceError(RuntimeError):
    pass


class GeminiNotConfiguredError(GeminiServiceError):
    pass


def _extract_text(payload: dict) -> str:
    candidates = payload.get("candidates") or []
    if not candidates:
        raise GeminiServiceError("Gemini 未回傳可用答案。")
    parts = candidates[0].get("content", {}).get("parts", [])
    text = "\n".join(part.get("text", "") for part in parts if part.get("text")).strip()
    if not text:
        raise GeminiServiceError("Gemini 回傳了空白答案。")
    return text


def ask_gemini(request: AiAskRequest, settings: Settings) -> AiAskResponse:
    if not settings.gemini_configured:
        raise GeminiNotConfiguredError("尚未設定 GEMINI_API_KEY。")

    context_json = json.dumps(request.context.model_dump(), ensure_ascii=False, separators=(",", ":"))
    contents = [
        {
            "role": message.role,
            "parts": [{"text": message.content}],
        }
        for message in request.history[-6:]
    ]
    contents.append(
        {
            "role": "user",
            "parts": [
                {
                    "text": f"目前頁面 context：{context_json}\n\n使用者問題：{request.question}"
                }
            ],
        }
    )
    url = (
        "https://generativelanguage.googleapis.com/v1beta/models/"
        f"{settings.gemini_model}:generateContent"
    )
    try:
        response = httpx.post(
            url,
            headers={"x-goog-api-key": settings.gemini_api_key},
            json={
                "system_instruction": {"parts": [{"text": SYSTEM_INSTRUCTION}]},
                "contents": contents,
                "generationConfig": {"maxOutputTokens": 700},
            },
            timeout=35,
        )
        response.raise_for_status()
    except httpx.TimeoutException as exc:
        raise GeminiServiceError("Gemini 回應逾時，請稍後再試。") from exc
    except httpx.HTTPStatusError as exc:
        status = exc.response.status_code
        if status in {401, 403}:
            message = "Gemini API Key 無效或沒有模型權限。"
        elif status == 429:
            message = "Gemini 免費額度或速率限制已達上限，請稍後再試。"
        else:
            message = f"Gemini 服務暫時無法使用（HTTP {status}）。"
        raise GeminiServiceError(message) from exc
    except httpx.RequestError as exc:
        raise GeminiServiceError("無法連線至 Gemini 服務。") from exc

    return AiAskResponse(answer=_extract_text(response.json()), model=settings.gemini_model)
