# 台股分析平台 — 功能規格

本平台提供台股相關的查詢與分析功能，規劃為以下兩大模組：

| 模組 | 子功能 | 狀態 | 前端路徑 |
|---|---|---|---|
| 1. 個股分析 | 1.1 股價走勢 | 已上線 | `/stock/trend` |
| 1. 個股分析 | 1.2 估值比較 | 規劃中（佔位頁面） | `/stock/valuation` |
| 1. 個股分析 | 1.3 基本面分析 | 規劃中（佔位頁面） | `/stock/fundamental` |
| 1. 個股分析 | 1.4 技術面分析 | 已上線（MVP） | `/stock/technical` |
| 2. 投資組合分析 | 2.1 效率前緣分析（Efficient Frontier） | 已上線 | `/portfolio/efficient-frontier` |

導覽選單（`frontend/lib/config/navConfig.ts`）與 `frontend/app` 目錄已依此兩大模組重新組織。「規劃中」的子功能目前僅有導覽入口與「功能規劃中」佔位頁面（`components/common/ComingSoon.jsx`），尚未實作實際的資料查詢與運算邏輯。

前後端如何啟動、系統架構與目錄結構請參考 [Infrastructure.md](./Infrastructure.md)。

---

## 1. 個股分析

針對單一或多檔股票，提供價格走勢、估值與基本面的比較分析。

### 1.1 股價走勢（已上線）

**前端頁面**：`frontend/app/stock/trend/page.js`

#### 使用流程

1. 使用者於「股票」欄位輸入代號或中文名稱關鍵字（例如 `2330` 或 `台積`），前端會以 300ms 防抖（debounce）呼叫股票搜尋 API，並可多選。
2. 選擇查詢日期區間（預設為「最近一個月」，且不可選未來日期）。
3. 按下「查詢」後，前端呼叫股價歷史 API 取得資料，並依日期排序後繪圖。
4. 圖表右上角可切換兩種顯示模式：
   - **股價走勢**（收盤價）：直接顯示各股票收盤價（TWD）
   - **累積報酬**（漲幅比較）：以查詢區間第一天的收盤價為基準，換算成漲跌幅（%），方便比較不同價位股票的相對表現

圖表使用 `@ant-design/plots` 的 `Line` 元件，X 軸為日期、以顏色區分股票，並支援下方時間軸縮放（slider）。

#### 對應的後端 API

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

### 1.2 估值比較（規劃中）

規劃提供多檔股票的估值指標並排比較，例如：

- 本益比（P/E）
- 股價淨值比（P/B）
- 企業價值倍數（EV/EBITDA）

### 1.3 基本面分析（規劃中）

規劃提供的基本面指標：

- 營收（Revenue）
- 每股盈餘（EPS）
- 毛利率／營益率（Margin）
- 股東權益報酬率（ROE）
- 投入資本回報率（ROIC）

### 1.4 技術面分析（已上線，MVP）

完整 User Flow / UI 設計請見 [TechAnalysisSpec.md](./TechAnalysisSpec.md)；本節記錄實際實作的 MVP 範圍與行為。

**前端頁面**：`frontend/app/stock/technical/page.js`（Drawer：`components/ChartSettingsDrawer.jsx` 與 `components/panels/*.jsx`；圖表：`components/charts/*.jsx`；請求／資料處理：`lib/chartData.js`；Draft/Applied 設定模型：`lib/config.js`；皆位於 `app/stock/technical/` 之下）

#### 核心概念

- 單一台股的技術指標圖表分析工具，而非多個獨立指標頁面。
- Chart 是主要操作畫面；右側 Drawer 是「圖表設定中心」，使用者透過 Drawer 決定要顯示哪些 Chart、以及每個 Chart 的參數。
- 提供**固定四種 Chart 類型**：Price/MA、Volume、MACD、Bollinger Bands，各自對應獨立 Pane 與獨立控制面板（並非可任意新增/刪除的指標卡片；同一類型內的多條同類線改以參數陣列表示，如 MA 週期 `M=[10,30]`）。
- **市場資料（Price/MA 的價格部分、Volume）** 與 **技術指標（MA、MACD、Bollinger Bands 的指標計算部分）** 在資訊架構上分開，但透過同一個 API 取得：Step 3「查詢」以空的 `indicators` 送出、只取得基礎行情；Drawer 套用則帶上目前所有已勾選的指標。**不做快取、不合併新舊回應**——查詢或套用任一次觸發的請求，回應都會整批取代目前的圖表資料。
- 設定採「先草稿、後套用」：Drawer 內的所有調整（勾選/取消勾選 Chart、修改參數）只更動前端 Draft 狀態，按下「套用」才驗證並送出後端請求、重繪圖表；按「取消」則捨棄 Draft，圖表維持原本設定。

#### 使用流程

1. **選股**：頁面頂部搜尋並選擇單一股票（一次僅能分析一檔）。
2. **選擇時間區間**：Date Range Picker，**預設區間為「一年前」至「今日」**，不可選未來日期。
3. **查詢**：點擊「查詢」，向後端請求該股票的價格與成交量資料；請求內容依當下的 `appliedConfig`（初次查詢即為預設設定）決定，預設會一併帶上 Price/MA 的 `MA_20`。
4. **顯示預設圖表**：查詢完成後預設顯示 **Price/MA**（K 線＋一條 `MA_20`）與 **Volume** 兩個 Pane；MACD 與 Bollinger Bands 預設不顯示。
5. **開啟圖表設定**：點擊圖表右上角「技術分析設定 ⚙」，開啟右側 Drawer。
6. **Chart 多選器**：Drawer 頂部為四選多的多選器（Price/MA、Volume、MACD、Bollinger Bands），預設勾選 Price/MA、Volume。勾選/取消勾選會即時建立/移除對應的控制面板（僅更動 Draft，不影響主畫面）。
7. **調整各面板參數**：每個已勾選的 Chart 對應一個固定的控制面板，新增時自動帶入預設參數；各面板有各自的參數與驗證規則（詳見 [TechAnalysisSpec.md](./TechAnalysisSpec.md) 第 7、8 節）。
8. **套用**：驗證參數 →「套用」本身是同步操作：`appliedConfig = draftConfig` 後立即關閉 Drawer，不等待後端回應 → `appliedConfig` 的變動觸發一次新的請求，內容為當下所有已勾選 Chart 的完整指標參數 → 圖表區域顯示 Loading（圖表維持原狀不消失）→ 取得回應後整批**取代**圖表資料。若請求失敗，於圖表區域顯示錯誤訊息「技術指標資料取得失敗，請稍後再試。」（Drawer 此時已關閉，不會因請求失敗重新開啟）。

**資料請求規則（無快取）**：本功能不維護資料快取，也不嘗試合併新舊回應。只要股票、時間區間或 `appliedConfig` 任一改變（查詢或套用），就送出一次新的請求，並用回應整批取代圖表資料——即使某個指標的參數沒有變動，只要有其他指標同時改變導致需要重新套用，仍會一併重新請求，沒有「這個指標之前已經取過可以跳過」的判斷。詳細規則與範例見 [TechAnalysisSpec.md](./TechAnalysisSpec.md) 第 9 節。

#### 圖表結構

- 所有已顯示的 Chart Pane 共用同一個日期 X 軸、Zoom 與 Crosshair（時間位置同步），但不同資料類型各自獨立 Y 軸。
- **Price/MA Pane**：K 線／收盤價線，疊加 0～3 條 MA 線。
- **Volume Pane**：成交量長條圖，無可調參數。
- **MACD Pane**：啟用後建立獨立 Pane，顯示 MACD Line、Signal Line、Histogram（未來 RSI/KD 等 Oscillator 指標亦採獨立 Pane 的模式）。
- **Bollinger Bands Pane**：與 Price/MA **各自獨立**的 Pane，同樣有自己的 K 線／收盤價線設定，疊加上／中／下三條軌道（可與 Price/MA 的價格外觀選擇不同）。

#### 各 Chart 使用的資料欄位

| Chart | 使用欄位（見下方 API 回應每列物件的 key） |
|---|---|
| Price/MA | `DATE` + （K 線：`OPEN,MAX,MIN,CLOSE`／收盤價：`CLOSE`） + 各 `M` 對應的 `MA_<M>` |
| Volume | `DATE`, `TRADING_VOLUME` |
| MACD | `DATE`, `MACD_DIF`, `MACD_SIGNAL`, `MACD_HISTOGRAM` |
| Bollinger Bands | `DATE` + （K 線／收盤價，同 Price/MA） + `BOLL_MID` + 各 `std` 對應的 `BOLL_UPPER_<std>`／`BOLL_LOWER_<std>` |

#### MVP 範圍

| Chart 類型 | 內容 | 預設是否顯示 | 預設參數 |
|---|---|---|---|
| Price/MA | K 線／收盤價線 + 0～3 條 MA（Overlay） | 顯示 | 價格外觀 = K 線；`M = [20]`（預設顯示 20 日均線） |
| Volume | 成交量長條圖（無參數） | 顯示 | — |
| MACD | 獨立 Pane，同時顯示 MACD Line／Signal Line／Histogram | 不顯示 | `M=12, N=26, K=9` |
| Bollinger Bands | 獨立 Pane，K 線／收盤價線 + 上／中／下軌（1～3 組 std） | 不顯示 | 價格外觀 = K 線；`M=20, std=[2]` |

核心互動：Chart 多選器（開關四種固定 Chart）、編輯各面板參數、取消／套用、套用時一律重新請求 API（無快取）、Loading（查詢或套用期間顯示）、參數驗證、錯誤處理。

**參數驗證規則**：Price/MA `M`：0～3 個整數，each ∈ [2,90]。MACD `M,N`：整數 ∈ [2,90] 且 `M<N`；`K`：整數，建議範圍 [2,50]（業界慣例訊號線週期多為個位數到十位數，標準值 9，上限保留寬鬆空間但避免與 M/N 同尺度）。Bollinger `M`：整數 ∈ [2,90]；`std`：1～3 個數字，each ∈ [0.5,3.0]，最多一位小數。

**未來擴充**（不影響上述架構，僅需新增一個固定 Chart 選項＋獨立 Pane＋控制面板）：RSI、KD、EMA、ATR、Stochastic、OBV。

#### 對應的後端 API

**`POST /api/v1/tw/stock/technical/indicators`**

> **回應格式修改中**：請求格式（`stock_id`/`start`/`end`/`indicators`）已實作於 `app/schemas.py`／`app/technical.py`，與本節一致。以下針對**回應格式**規劃一項修改：`data` 由「列陣列」（每列是依 `columns` 順序排列的純陣列）改為「列物件陣列」（每列直接是一個以欄位名為 key 的物件），讓前端可直接使用每一列，不需再對照 `columns` 做轉換；`columns` 欄位維持保留（仍列出欄位名稱與順序，供需要欄位清單時參考），**尚待更新程式碼（`app/technical.py`、前端 `lib/chartData.js`）以符合本節格式**。

| 參數 | 類型 | 必填 | 說明 |
|---|---|---|---|
| `stock_id` | string | 是 | 單一股票代號 |
| `start` | date | 是 | 起始日 |
| `end` | date | 是 | 結束日 |
| `indicators` | array | 否（預設 `[]`） | 指標設定陣列。**同一種 `type` 最多只能出現一筆**（`MA`／`MACD`／`BOLL` 各至多一筆），每筆為 `{type, params}` |

`params` 依 `type` 決定形狀：

| `type` | `params` | 說明 |
|---|---|---|
| `MA` | `{ M: number[] }` | `M` 為週期陣列，**最多 3 個**，每個週期各產生一條 MA 線（例：`M: [30, 90]` → `MA_30`、`MA_90` 兩條線） |
| `MACD` | `{ M, N, K }` | 皆為單一數值（純量）：`M` 為快線週期、`N` 為慢線週期、`K` 為訊號線週期；一次請求只產生一組 MACD／Signal／Histogram，參數本身不會出現在回應欄位名稱中 |
| `BOLL` | `{ M, std: number[] }` | `M` 為單一數值的移動平均週期（純量）；`std` 為標準差倍數陣列，**最多 3 個**，每個倍數各產生一條上／下軌帶（中軌只需計算一次，不受 `std` 影響） |

範例請求體（見 [`lab/sample-body-tech.json`](../../lab/sample-body-tech.json)）：

```json
{
  "stock_id": "2357",
  "start": "2024-01-01",
  "end": "2026-09-02",
  "indicators": [
    { "type": "MA", "params": { "M": [30, 90] } },
    { "type": "MACD", "params": { "M": 12, "N": 26, "K": 9 } },
    { "type": "BOLL", "params": { "M": 20, "std": [1.5, 2] } }
  ]
}
```

回應為單一寬表格，不再依指標類型分別巢狀回傳，對應 `lab/plot_technical_indicators2.py` 產出的合併 DataFrame（範例見 [`lab/data/technical_2357.csv`](../../lab/data/technical_2357.csv)）。`columns` 為欄位名稱陣列（保留，列出欄位名稱與順序）；`data` 為**列物件陣列**，每一列是一個物件，key 為欄位名稱（與 `columns` 內容相同，但物件本身即可直接使用，不需要再對照 `columns` 的索引位置做轉換）：

```json
{
  "stock_id": "2357",
  "start": "2024-01-01",
  "end": "2026-09-02",
  "columns": [
    "DATE", "STOCK_ID", "TRADING_VOLUME", "TRADING_MONEY", "OPEN", "MAX", "MIN", "CLOSE", "SPREAD", "TRADING_TURNOVER",
    "MA_30", "MA_90",
    "MACD_DIF", "MACD_SIGNAL", "MACD_HISTOGRAM",
    "BOLL_MID", "BOLL_UPPER_1p5", "BOLL_LOWER_1p5", "BOLL_UPPER_2p0", "BOLL_LOWER_2p0"
  ],
  "data": [
    {
      "DATE": "2024-01-02", "STOCK_ID": "2357", "TRADING_VOLUME": 5266565, "TRADING_MONEY": 2560400762,
      "OPEN": 494.0, "MAX": 498.0, "MIN": 479.0, "CLOSE": 485.0, "SPREAD": -4.5, "TRADING_TURNOVER": 13134,
      "MA_30": null, "MA_90": null,
      "MACD_DIF": 0.0, "MACD_SIGNAL": 0.0, "MACD_HISTOGRAM": 0.0,
      "BOLL_MID": null, "BOLL_UPPER_1p5": null, "BOLL_LOWER_1p5": null, "BOLL_UPPER_2p0": null, "BOLL_LOWER_2p0": null
    },
    {
      "DATE": "2026-09-01", "STOCK_ID": "2357", "TRADING_VOLUME": 5653878, "TRADING_MONEY": 5675970931,
      "OPEN": 1000.0, "MAX": 1025.0, "MIN": 987.0, "CLOSE": 1010.0, "SPREAD": 11.0, "TRADING_TURNOVER": 11236,
      "MA_30": 866.2667, "MA_90": 763.9667,
      "MACD_DIF": 53.6754, "MACD_SIGNAL": 49.2218, "MACD_HISTOGRAM": 4.4536,
      "BOLL_MID": 914.15, "BOLL_UPPER_1p5": 1009.3364, "BOLL_LOWER_1p5": 818.9636, "BOLL_UPPER_2p0": 1041.0653, "BOLL_LOWER_2p0": 787.2347
    }
  ]
}
```

每個列物件都含有 `columns` 列出的**全部**欄位（即使值為 `null`）——欄位集合在每列間保持一致，只有值是否為 `null` 不同（見下方說明）。

欄位命名規則（前 10 欄為基礎行情欄位，維持 `app/finmind_client.py` 原始欄位名稱、僅轉大寫；其後依請求中出現的指標依序附加）：

| `type` | 欄位命名 |
|---|---|
| （基礎行情） | `DATE`、`STOCK_ID`、`TRADING_VOLUME`、`TRADING_MONEY`、`OPEN`、`MAX`、`MIN`、`CLOSE`、`SPREAD`、`TRADING_TURNOVER` |
| `MA` | 每個週期一欄：`MA_<M>`（例：`MA_30`、`MA_90`） |
| `MACD` | 固定三欄：`MACD_DIF`、`MACD_SIGNAL`、`MACD_HISTOGRAM`（`M`/`N`/`K` 僅用於計算，不出現在欄位名） |
| `BOLL` | 中軌固定一欄 `BOLL_MID`；每個 `std` 倍數各兩欄：`BOLL_UPPER_<std>`、`BOLL_LOWER_<std>`（小數點以 `p` 表示，例：`1.5` → `1p5`、`2` → `2p0`） |

`data` 中每列對應一個交易日；每個指標欄位在其滾動視窗尚無足夠資料的前幾列為 `null`（對應 pandas 的 `NaN`），**不會**如舊版那樣省略該列 —— 所有指標欄位共用同一組列（交易日），只有欄位值是否為 `null` 的差異。所有指標數值皆四捨五入至小數點後 4 位。

#### 運算邏輯（`app/technical.py`，待依新格式調整）

1. 透過 `fetch_stock_prices` 取得單一股票在區間內的每日價量資料（沿用 `app/finmind_client.py`），欄位轉為大寫做為表格基礎欄位。
2. **MA**：對 `params.M` 陣列中每個週期各自計算移動平均（`close.rolling(M).mean()`），寫入對應的 `MA_<M>` 欄位。
3. **BOLL**：以 `params.M` 週期的移動平均為中軌 `BOLL_MID`（只計算一次），對 `params.std` 陣列中每個倍數各自計算中軌 ± `std × rolling_std`，寫入 `BOLL_UPPER_<std>`／`BOLL_LOWER_<std>`。
4. **MACD**：以收盤價的指數移動平均（EMA）計算，`MACD_DIF = EMA(M) - EMA(N)`，`MACD_SIGNAL = EMA(MACD_DIF, K)`，`MACD_HISTOGRAM = MACD_DIF - MACD_SIGNAL`。
5. 所有欄位合併回同一張表格（不做 `dropna`），每個欄位四捨五入至小數點後 4 位，再序列化為 `columns`（欄位名稱陣列）與 `data`（列物件陣列，每列以 `to_dict(orient="records")` 之類的方式產生、並將 `NaN` 轉為 `null`）回傳。

前端對應的 Server Action：`getTechnicalIndicators`（於 `frontend/actions/actions.js`，僅轉發 JSON，不受回應格式調整影響）；實際依 `data` 形狀組出圖表資料的邏輯在 `lib/chartData.js`，待依新格式調整。

#### 已知限制

- Price/MA、Volume、MACD、Bollinger Bands 四個 Pane 各自為獨立的 `@ant-design/plots` 圖表實例（`Mix`/`Column`），僅共用相同的日期範圍，**尚未實作**跨 Pane 的同步 Crosshair 與同步 Zoom（TechAnalysisSpec.md 第 3 節所述的進階同步行為，留待後續優化）。
- 目前僅支援單一股票、單一時間區間的技術分析；不支援多股票疊圖比較。

---

## 2. 投資組合分析

以多檔股票的歷史報酬，模擬並找出最佳資金配置。

### 2.1 效率前緣分析（Efficient Frontier，已上線）

**前端頁面**：`frontend/app/portfolio/efficient-frontier/page.js`

#### 使用流程

1. 使用者搜尋並選擇「至少 2 檔」股票（沿用與股價走勢相同的搜尋元件與防抖邏輯）。
2. 選擇查詢日期區間（預設「最近一個月」）。
3. 按下「計算效率前緣」後，前端呼叫效率前緣 API。
4. 結果以散佈圖（Scatter）呈現：
   - X 軸：年化波動率（annual_volatility）
   - Y 軸：年化報酬率（annual_return）
   - 顏色：Sharpe Ratio
   - 一般模擬組合以圓點顯示，**最大 Sharpe 組合**與**最小波動組合**則以較大的菱形標出，方便使用者快速找出最佳配置
   - 滑鼠移至任一點可看到該組合的年化報酬、年化波動、Sharpe Ratio，以及各成分股的權重百分比

#### 對應的後端 API

**`GET /api/v1/tw/portfolio/efficient-frontier`**

| 參數 | 類型 | 必填 | 說明 |
|---|---|---|---|
| `id` | string | 是（至少 2 檔） | 逗號分隔的股票代號 |
| `start` | date | 是 | 起始日 |
| `end` | date | 是 | 結束日 |
| `num_portfolios` | int | 否（預設 3000，範圍 100–20000） | 隨機模擬的投資組合數量 |

#### 運算邏輯（`app/portfolio.py`）

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

#### 取樣策略優化（已實作）

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
| `POST` | `/api/v1/tw/stock/technical/indicators` | 技術指標計算（MA／MACD／Bollinger Bands） |
| `GET` | `/api/v1/tw/portfolio/efficient-frontier` | 投資組合效率前緣分析 |
| `GET` | `/health` | 服務存活檢查 |

後端啟動後可於 `http://127.0.0.1:8088/docs`（Swagger UI）互動測試上述 API，詳細參數與範例回應請參考 `api/tw-stocks/README.md`。
