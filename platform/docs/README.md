# 台股分析平台

本平台提供台股相關的查詢與分析功能，採前後端分離架構：

- **前端**：Next.js（App Router）+ Ant Design，負責頁面呈現與圖表視覺化
- **後端**：FastAPI，負責串接 [FinMind](https://finmindtrade.com/) 資料源、進行運算後以 REST API 回傳結果

目前平台上線兩項功能，皆歸屬於「台股分析」模組（`tw-stock`）：

| 功能 | 前端路徑 | 說明 |
|---|---|---|
| 股價走勢查詢 | `/tw-stock/trend` | 查詢多檔股票在指定區間的收盤價走勢，並可切換為漲跌幅比較 |
| 投資組合分析 | `/tw-stock/portfolio` | 以 Monte Carlo 模擬計算多檔股票組合的效率前緣（Efficient Frontier） |

側邊選單設定於 `frontend/lib/config/navConfig.ts`，是站內導覽與麵包屑的唯一資料來源。

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
   │  app/stock_info.py      （股票代號/名稱搜尋，讀取本地 CSV 快取）
   ▼
FinMind API（外部資料源，需 API Token）
```

前端與後端的連線設定於 `frontend/.env.local` 的 `API_BASE_URL`，預設指向 `http://127.0.0.1:8088`。

---

## 功能一：股價走勢查詢

**前端頁面**：`frontend/app/tw-stock/trend/page.js`

### 使用流程

1. 使用者於「股票」欄位輸入代號或中文名稱關鍵字（例如 `2330` 或 `台積`），前端會以 300ms 防抖（debounce）呼叫股票搜尋 API，並可多選。
2. 選擇查詢日期區間（預設為「最近一個月」，且不可選未來日期）。
3. 按下「查詢」後，前端呼叫股價歷史 API 取得資料，並依日期排序後繪圖。
4. 圖表右上角可切換兩種顯示模式：
   - **收盤價走勢**：直接顯示各股票收盤價（TWD）
   - **漲幅比較**：以查詢區間第一天的收盤價為基準，換算成漲跌幅（%），方便比較不同價位股票的相對表現

圖表使用 `@ant-design/plots` 的 `Line` 元件，X 軸為日期、以顏色區分股票，並支援下方時間軸縮放（slider）。

### 對應的後端 API

| Method | Path | 說明 |
|---|---|---|
| `GET` | `/api/v1/tw/stocks/search` | 依代號或中文名稱模糊搜尋股票，供下拉選單自動完成使用 |
| `GET` | `/api/v1/tw/history/stock/price` | 查詢多檔股票在指定區間的每日開高低收與成交量 |

**`GET /api/v1/tw/stocks/search`**

| 參數 | 類型 | 必填 | 說明 |
|---|---|---|---|
| `q` | string | 是（空字串回傳 `[]`） | 搜尋字串，比對股票代號或中文名稱 |
| `limit` | int | 否（預設 20，上限 50） | 最多回傳筆數 |

此 API 不即時呼叫 FinMind，而是讀取本地快取檔 `api/tw-stocks/data/tw_stock_info.csv`（欄位：`stock_id`、`stock_name`、`industry_category`、`type`），因此回應快且不會消耗 FinMind API 額度。若要更新此快取（例如有新上市股票），可執行：

```
.venv\Scripts\python.exe -m scripts.update_stock_info
```

**`GET /api/v1/tw/history/stock/price`**

| 參數 | 類型 | 必填 | 說明 |
|---|---|---|---|
| `id` | string | 是 | 逗號分隔的股票代號，如 `0050,2308` |
| `start` | date | 是 | 查詢起始日（含） |
| `end` | date | 是 | 查詢結束日（含），需晚於或等於 `start` |

回傳資料為各股票每日的 `open`、`max`、`min`、`close`、`trading_volume`，實際資料透過 `app/finmind_client.py` 呼叫 FinMind 的 `taiwan_stock_daily`。

前端對應的 Server Action：`getTwStockPrices` / `searchTwStocks`（於 `frontend/actions/actions.js`）。

---

## 功能二：投資組合分析

**前端頁面**：`frontend/app/tw-stock/portfolio/page.js`

### 使用流程

1. 使用者搜尋並選擇「至少 2 檔」股票（沿用與走勢查詢相同的搜尋元件與防抖邏輯）。
2. 選擇查詢日期區間（預設「最近一個月」）。
3. 按下「計算效率前緣」後，前端呼叫效率前緣 API。
4. 結果以散佈圖（Scatter）呈現：
   - X 軸：年化波動率（annual_volatility）
   - Y 軸：年化報酬率（annual_return）
   - 顏色：Sharpe Ratio
   - 一般模擬組合以圓點顯示，**最大 Sharpe 組合**與**最小波動組合**則以較大的菱形標出，方便使用者快速找出最佳配置
   - 滑鼠移至任一點可看到該組合的年化報酬、年化波動、Sharpe Ratio，以及各成分股的權重百分比

### 對應的後端 API

**`GET /api/v1/tw/portfolio/efficient-frontier`**

| 參數 | 類型 | 必填 | 說明 |
|---|---|---|---|
| `id` | string | 是（至少 2 檔） | 逗號分隔的股票代號 |
| `start` | date | 是 | 起始日 |
| `end` | date | 是 | 結束日 |
| `num_portfolios` | int | 否（預設 3000，範圍 100–20000） | 隨機模擬的投資組合數量 |

### 運算邏輯（`app/portfolio.py`）

1. 透過 `fetch_close_prices` 取得所有股票在區間內的每日收盤價，並轉為以日期為索引、股票代號為欄位的表格（pivot）。
2. 計算每日報酬率（`pct_change`），若區間內資料不足以計算報酬率則回傳 400 錯誤。
3. 以 NumPy 產生 `num_portfolios` 組隨機權重（每組權重總和為 1，模擬不同資金配置）。
4. 依 Markowitz 均異數模型計算每組權重對應的：
   - **年化報酬率** = 權重 · 平均日報酬 × 252（一年交易日數）
   - **年化波動率** = √(權重 · 共變異數矩陣 · 權重 × 252)
   - **Sharpe Ratio** = 年化報酬 / 年化波動（未扣除無風險利率）
5. 從所有模擬組合中找出：
   - `max_sharpe`：Sharpe Ratio 最高的組合
   - `min_volatility`：年化波動率最低的組合

這是一個 Monte Carlo 模擬法，並非解析解，因此點的分布密度與 `num_portfolios` 大小有關；數值越大，前緣曲線越平滑但運算時間也越長。

### 取樣策略優化（已實作）

單純「均勻隨機取樣」的缺點是產生的組合大多集中在報酬/風險都平庸的區域，Sharpe Ratio 表現差的組合佔了絕大多數運算量，卻對繪製效率前緣沒有幫助。`simulate_efficient_frontier` 已改用「篩選＋繁衍」的兩階段取樣策略取代單純隨機取樣，讓運算資源集中在有效前緣附近，流程如下：

1. **初始取樣**（`_random_weights` + `_portfolio_stats`）：隨機產生 `num_portfolios` 組投資組合，計算其年化報酬、年化波動與 Sharpe Ratio。
2. **listA（低波動組）**：從全部組合中，取年化波動率最低的前 `5% × num_portfolios` 筆（`LOW_VOL_SEED_FRACTION`）。
3. **listB（高 Sharpe 組）**：從「排除 listA 後」的剩餘組合中，取 Sharpe Ratio 最高的前 `20% × num_portfolios` 筆（`HIGH_SHARPE_SEED_FRACTION`，與 listA 不重複）。
4. **listC（種子組合）**：`listA ∪ listB`（`_select_seed_indices`），共 `25% × num_portfolios` 筆，做為後續繁衍的種子（seed）。
5. **listD（繁衍組合）**（`_breed_weights`）：從 listC 中重複隨機取兩個組合 `p1`、`p2`，以 `(p1.weights + p2.weights) / 2` 作為基礎權重，再加上小幅隨機噪聲（標準差見 `BREED_NOISE_STD`），並裁剪負值後重新正規化使權重總和為 1，產生 `75% × num_portfolios` 筆新組合。
6. **回傳結果**：最終回傳 `listC + listD`，總數仍為 `num_portfolios`，但組合已集中在低波動與高 Sharpe 的區域附近，而非均勻分布在整個權重空間。

概念上類似遺傳演算法（genetic algorithm）中的「篩選（selection）＋交配（crossover）＋突變（mutation）」，用少量迭代取代大量無效的均勻隨機取樣。以合成測試資料驗證，相同 `num_portfolios` 下，新策略的平均 Sharpe Ratio 與最佳（max）Sharpe Ratio 皆優於舊版均勻隨機取樣，最小波動率則維持相近水準。

前端對應的 Server Action：`getEfficientFrontier`（於 `frontend/actions/actions.js`）。

---

## API 總覽

Base path：`/api/v1/tw`（另有 `/health` 健康檢查，不含此 prefix）

| Method | Path | 功能 |
|---|---|---|
| `GET` | `/api/v1/tw/stocks/search` | 股票代號/名稱搜尋 |
| `GET` | `/api/v1/tw/history/stock/price` | 股價走勢查詢 |
| `GET` | `/api/v1/tw/portfolio/efficient-frontier` | 投資組合效率前緣分析 |
| `GET` | `/health` | 服務存活檢查 |

後端啟動後可於 `http://127.0.0.1:8088/docs`（Swagger UI）互動測試上述 API，詳細參數與範例回應請參考 `api/tw-stocks/README.md`。

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
│   │   ├── page.js                     # 平台首頁
│   │   └── tw-stock/
│   │       ├── layout.jsx
│   │       ├── trend/page.js            # 股價走勢查詢頁
│   │       └── portfolio/page.js        # 投資組合分析頁
│   ├── actions/actions.js               # 呼叫後端 API 的 Server Actions
│   └── lib/config/navConfig.ts          # 側邊選單／導覽設定
└── api/
    └── tw-stocks/
        ├── app/
        │   ├── main.py                  # FastAPI 進入點
        │   ├── routers/stocks.py        # API 路由定義
        │   ├── finmind_client.py        # FinMind 資料存取
        │   ├── portfolio.py             # 效率前緣運算邏輯
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
