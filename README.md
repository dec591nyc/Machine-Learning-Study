# Industry ML Workbench

可互動機器學習網站，採用 Next.js 前端與 FastAPI 後端，並由 Gemini 提供依目前模型、參數與實驗結果回答的 AI 助理。

## 檢視網站

在專案根目錄執行：

```powershell
npm run dev
```

啟動後開啟：

- 網站：[http://localhost:3000](http://localhost:3000)
- FastAPI 文件：[http://localhost:8001/docs](http://localhost:8001/docs)

如果是第一次在新環境執行，先安裝依賴：

```powershell
npm --prefix apps/web install
python -m pip install -r apps/api/requirements.txt
```

AI 助理需要在專案根目錄的 `.env.local` 設定：

```dotenv
GEMINI_API_KEY=你的金鑰
GEMINI_MODEL=gemini-2.5-flash
ALLOWED_ORIGINS=http://localhost:3000
```

API Key 只由 FastAPI 讀取，不可放進 `NEXT_PUBLIC_*` 前端環境變數。

## 雲端部署

### Railway 後端

1. 建立 Railway 服務並連接此 GitHub repository。
2. 將服務的 Root Directory 設為 `apps/api`。
3. 設定 Variables：`GEMINI_API_KEY`、`GEMINI_MODEL=gemini-2.5-flash`、`ALLOWED_ORIGINS=https://你的前端網域`。
4. Railway 會依 `apps/api/railway.json` 啟動 FastAPI；部署後建立 Public Domain。

### Vercel 前端

1. 匯入同一個 repository，Root Directory 設為 `apps/web`。
2. 新增伺服器端環境變數 `API_ORIGIN=https://你的Railway網域`。
3. 重新部署。Next.js 會把 `/api/*` 請求轉送至 Railway，瀏覽器不會取得 Gemini API Key。

## 主要內容

- `apps/web`：網站頁面、元件與深橘色 UI。
- `apps/api`：模型選擇、六種參數實驗與 Gemini AI 助理 API。
- `infographic`：Task 1 資訊圖表。
- `study-guide`、`output/pdf`：Task 2 教材與 PDF。
- `docs/task-3-development-plan.md`：Task 3 開發計畫。

`node_modules`、`.next`、`__pycache__` 都是安裝或執行時產生的檔案，已由 `.gitignore` 排除，不是專案交付內容。
