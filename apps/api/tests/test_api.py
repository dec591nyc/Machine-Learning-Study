from fastapi.testclient import TestClient

import app.main as main_module
from app.main import app
from app.schemas import AiAskResponse


client = TestClient(app)


def test_health() -> None:
    response = client.get("/api/health")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"


def test_recommendation_is_explainable() -> None:
    response = client.post(
        "/api/recommendations",
        json={
            "task": "classification",
            "data_type": "tabular",
            "sample_size": "medium",
            "explainability": "high",
            "class_imbalance": True,
            "latency_sensitive": False,
        },
    )
    payload = response.json()
    assert response.status_code == 200
    assert payload["baseline"] == "邏輯回歸"
    assert payload["reasons"]
    assert payload["risks"]


def test_tree_experiment_is_bounded_and_repeatable() -> None:
    request = {"model": "decision-tree", "seed": 42, "primary": 5, "secondary": 4}
    first = client.post("/api/experiments", json=request)
    second = client.post("/api/experiments", json=request)
    assert first.status_code == 200
    assert first.json()["metrics"] == second.json()["metrics"]
    assert first.json()["parameters"]["max_depth"] == 5


def test_all_supported_experiments() -> None:
    models = ["ridge", "logistic", "decision-tree", "svm", "knn", "kmeans"]
    for model in models:
        response = client.post(
            "/api/experiments",
            json={"model": model, "seed": 7, "primary": 3, "secondary": 0.6},
        )
        assert response.status_code == 200, response.text
        assert response.json()["explanation"]


def test_ai_health_does_not_expose_key() -> None:
    response = client.get("/api/ai/health")
    assert response.status_code == 200
    assert "api_key" not in response.text.lower()
    assert set(response.json()) == {"status", "configured", "model"}


def test_ai_ask_uses_context(monkeypatch) -> None:
    captured = {}

    def fake_ask(request, settings):
        captured["request"] = request
        return AiAskResponse(answer="降低深度後再比較驗證分數。", model="test-model")

    monkeypatch.setattr(main_module, "ask_gemini", fake_ask)
    response = client.post(
        "/api/ai/ask",
        json={
            "question": "下一步應該調整什麼？",
            "context": {
                "page": "parameter-lab",
                "model": "decision-tree",
                "parameters": {"max_depth": 8},
                "metrics": {"validation_accuracy": 0.82},
                "diagnostic_codes": ["possible_overfitting"],
            },
            "history": [],
        },
    )
    assert response.status_code == 200
    assert response.json()["model"] == "test-model"
    assert captured["request"].context.model == "decision-tree"
