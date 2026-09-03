# 台股分析平台 — 基礎架構

本平台採前後端分離架構：

- **前端**：Next.js（App Router）+ Ant Design，負責頁面呈現與圖表視覺化
- **後端**：FastAPI，負責串接 [FinMind](https://finmindtrade.com/) 資料源、進行運算後以 REST API 回傳結果

平台提供的功能說明請參考 [FunctionSpec.md](./FunctionSpec.md)。

---

## 系統架構

```
使用者瀏覽器
   │
   ▼
Next.js 前端 (frontend, port 8089)
   │  Server Actions (frontend/actions/actions.js)
   │  透過 fetch 呼叫後端 API_BASE_URL
   ▼
FastAPI 後端 (api/tw-stocks, port 8088)
   │  app/routers/stocks.py  （API 路由）
   │  app/finmind_client.py  （FinMind 資料存取，含登入快取）
   │  app/portfolio.py       （效率前緣運算邏輯）
   │  app/technical.py       （技術指標運算邏輯：MA／MACD／Bollinger Bands）
   │  app/stock_info.py      （股票代號/名稱搜尋，讀取本地 CSV 快取）
   ▼
FinMind API（外部資料源，需 API Token）
```

前端與後端的連線設定於 `frontend/.env.local` 的 `API_BASE_URL`，預設指向 `http://127.0.0.1:8088`。

---

## 技術棧

**前端（`platform/frontend`）**
- Next.js 14（App Router）＋ React 18
- Ant Design 5（`antd`、`@ant-design/icons`）＋ `@ant-design/plots`（圖表）
- Server Actions 直接向後端發送請求（不經過前端自身的 API route）
- dayjs 處理日期

**後端（`platform/api/tw-stocks`）**
- FastAPI ＋ Uvicorn
- pandas / NumPy 進行資料處理與 Monte Carlo 模擬
- `finmind`（FinMind SDK）串接台股資料，需於 `.env` 設定 `FINMIND_APIKEY`
- pydantic-settings 管理環境變數設定

---

## 專案目錄結構（節選）

```
platform/
├── frontend/
│   ├── app/
│   │   ├── page.js                             # 平台首頁
│   │   ├── stock/                              # 模組 1：個股分析
│   │   │   ├── trend/page.js                   # 1.1 股價走勢
│   │   │   ├── valuation/page.js               # 1.2 估值比較（規劃中，佔位頁面）
│   │   │   ├── fundamental/page.js             # 1.3 基本面分析（規劃中，佔位頁面）
│   │   │   └── technical/page.js               # 1.4 技術面分析（已上線，MVP）
│   │   └── portfolio/                          # 模組 2：投資組合分析
│   │       └── efficient-frontier/page.js      # 2.1 效率前緣分析（Efficient Frontier）
│   ├── components/
│   │   ├── common/ComingSoon.jsx               # 規劃中功能的共用佔位頁面元件
│   │   └── technical/                          # 1.4 技術面分析的 UI 元件
│   │       ├── ChartSettingsDrawer.jsx         # 右側設定 Drawer（基礎圖表＋指標清單）
│   │       ├── IndicatorCard.jsx               # 單一指標實例的參數卡片
│   │       └── TechnicalChart.jsx              # Price／Volume／MACD 三個 Chart Pane
│   ├── lib/technical/indicators.js             # 指標預設參數、驗證與後端請求格式轉換
│   ├── actions/actions.js                      # 呼叫後端 API 的 Server Actions
│   └── lib/config/navConfig.ts                 # 側邊選單／導覽設定（模組結構的唯一資料來源）
└── api/
    └── tw-stocks/
        ├── app/
        │   ├── main.py                  # FastAPI 進入點
        │   ├── routers/stocks.py        # API 路由定義
        │   ├── finmind_client.py        # FinMind 資料存取
        │   ├── portfolio.py             # 效率前緣運算邏輯
        │   ├── technical.py             # 技術指標運算邏輯（MA／MACD／Bollinger Bands）
        │   ├── stock_info.py            # 股票搜尋（讀本地 CSV）
        │   └── schemas.py               # Pydantic 資料模型
        ├── data/tw_stock_info.csv       # 股票代號/名稱快取
        └── scripts/update_stock_info.py # 更新股票快取的腳本
```

---

## 本地啟動方式

**後端**（於 `api/tw-stocks`，需先設定 `.env` 內的 `FINMIND_APIKEY`）：

```
.venv\Scripts\python.exe -m uvicorn app.main:app --reload --port 8088
```

**前端**（於 `frontend`）：

```
npm run dev
```

前端開發伺服器執行於 `http://127.0.0.1:8089`，並透過 `frontend/.env.local` 中的 `API_BASE_URL` 連接到後端的 `http://127.0.0.1:8088`。
