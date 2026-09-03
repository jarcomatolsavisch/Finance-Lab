# 台股技術指標分析平台 — User Flow & UI Specification

> **v2（本版）**：技術指標圖表改為「四種固定 Chart 類型」架構（Price/MA、Volume、MACD、Bollinger Bands），使用者透過 Drawer 頂部的「Chart 多選器」決定顯示哪些 Chart，每種 Chart 類型對應**固定一個**設定面板（而非可任意新增/刪除的 Indicator Card）。同一 Chart 類型內若需要多條同類線（例如多條 MA），以「參數陣列」（如 `M = 10,30`）表示，而非建立多個獨立卡片。
>
> 舊版（v1，可於 Git 歷史查閱）採「Indicator Card 可自由新增/刪除、同指標可有多個 Instance」的設計；v2 取代 v1 的 Drawer 結構與 State Model（第 5～14 節），但延續 v1 的核心原則：Chart First、Draft Before Apply、Base Chart 與 Indicator 資訊架構分離。

## 1. 功能目標

建立一個「單一台股技術分析」功能。

使用者可以：

1. 選擇單一台股與分析時間區間，查詢價格與成交量
2. 透過 Drawer 選擇要顯示哪些 Chart（Price/MA、Volume、MACD、Bollinger Bands）
3. 針對每個已選的 Chart 調整其參數
4. 一次套用設定，向 Backend 取得資料並重新 Render Chart

核心 UX 原則：

> Chart 是主要操作畫面，右側 Drawer 是 Chart Configuration Center。

使用者透過右側 Drawer 決定：
- 要顯示哪些 Chart（四選多）
- 每個 Chart 使用什麼參數

---

# 2. Main User Flow

## Step 1 — 選擇股票

頁面頂部提供台股搜尋功能。

例如：

```
Stock:
[ 2330 台積電 ▼ ]
```

使用者一次只能分析一檔股票。

## Step 2 — 選擇時間區間

提供 Date Range Picker。**預設區間為「一年前」至「今日」**（例如今日為 2026/09/02，預設即為 `2025/09/02 → 2026/09/02`），且不可選未來日期。使用者可自行調整為其他區間。

## Step 3 — 查詢

使用者點擊：

```
[ 查詢 ]
```

系統向 Backend 請求該股票在區間內的資料，內容由當下的 `appliedConfig`（初次查詢即為預設設定）決定——預設會一併請求 Price/MA 的 `MA_20`（見第 7.1 節），因此第一次查詢的回應就含有 20 日均線，不需要額外開啟 Drawer 套用。之後的技術指標異動由 Drawer 的「套用」觸發重新請求（見第 9 節），機制與這裡完全相同。

## Step 4 — 顯示 Default Chart

查詢完成後，預設顯示**全部四種** Chart，皆帶入各自的預設參數：

- **Price/MA**（K 線圖；預設疊加一條 `MA_20`，見第 7.1 節）
- **Volume**
- **MACD**（`M=12, N=26, K=9`，見第 7.3 節）
- **Bollinger Bands**（`M=20, std=[2]`，見第 7.4 節）

使用者可於 Drawer 依需要取消勾選任一 Chart。

Chart Layout（預設）：

```
┌─────────────────────────────┐
│ Price/MA                    │
│                             │
│ Candlestick                 │
│                             │
├─────────────────────────────┤
│ Volume                      │
│ █ ███ ██ █████ ███          │
├─────────────────────────────┤
│ MACD                        │
│ ...                         │
├─────────────────────────────┤
│ Bollinger Bands              │
│ Candlestick + Bands          │
└─────────────────────────────┘
```

---

# 3. 四種 Chart 類型

本功能提供**固定四種** Chart 類型，使用者以 Drawer 頂部的多選器決定要顯示哪些。**不支援新增/刪除任意數量的指標實例**——每種類型最多同時存在一份設定，但該設定可透過參數陣列同時畫出多條同類線（見各面板說明）。

| Chart 類型 | Pane | Y 軸 Scale | 內容 |
|---|---|---|---|
| **Price/MA** | 獨立 Pane（Base Chart） | 價格 | K 線圖，疊加 0～3 條 MA 線 |
| **Volume** | 獨立 Pane（Base Chart） | 成交量 | 成交量長條圖 |
| **MACD** | 獨立 Pane（Indicator） | 獨立量級 | MACD Line／Signal Line／Histogram |
| **Bollinger Bands** | 獨立 Pane（Indicator） | 價格 | K 線圖，疊加上／中／下軌 |

所有已顯示的 Pane 皆：

- 共用同一個日期 X 軸
- 共用 Zoom
- 共用 Crosshair（時間位置同步）

> **設計決定**：Price/MA 與 Bollinger Bands 是兩個**各自獨立**的 Pane，而非像 v1 那樣把 MA 與 Bollinger Bands 都疊加在同一個 Price Pane 上。兩者都固定以 K 線圖顯示價格（不再提供收盤價線的切換選項），彼此互不影響。此決定使四種 Chart 類型在 UI 上完全對等、獨立開關，簡化多選器與面板的心智模型；代價是同時開啟兩者時，價格會重複顯示兩次（且外觀相同）。若不希望有此重複，之後可考慮改回 v1 的疊加設計，但需另行確認。

未來如需擴充 RSI／KD 等 Oscillator 指標，比照 MACD 的模式：新增一個固定的 Chart 類型選項＋對應獨立 Pane＋對應控制面板。

---

# 4. Chart Settings Entry

Chart 右上角提供：

```
[ 技術分析設定 ⚙ ]
```

點擊後從右側開啟 Drawer。

---

# 5. Right Drawer Structure

Drawer 結構由上到下：

1. **Chart 多選器**（決定顯示哪些 Chart／建立哪些控制面板）
2. **對應的控制面板**（依多選器勾選順序或固定順序排列，見第 6 節）
3. Footer：取消／套用

UI Concept：

```
┌────── 技術分析設定 ──────┐
│                           │
│ 顯示的 Chart               │
│ ☑ Price/MA  ☑ Volume     │
│ ☑ MACD      ☑ Bollinger  │
│                           │
│ ───────────────────────   │
│                           │
│ ▼ Price/MA                │
│   MA 週期（逗號分隔，最多3個）│
│   [ 10,30 ]               │
│                           │
│ ▼ Volume                  │
│   （無參數）                │
│                           │
│ ───────────────────────   │
│                           │
│ [取消]            [套用] │
│                           │
└───────────────────────────┘
```

---

# 6. Chart 多選器（Chart Type Selector）

固定於 Drawer 最上方，為一個「四選多」的多選元件（例如 `Checkbox.Group`），選項固定為：

```
Price/MA ｜ Volume ｜ MACD ｜ Bollinger Bands
```

- **預設勾選**：全部四種（`Price/MA`、`Volume`、`MACD`、`Bollinger Bands`）。
- 勾選某個 Chart → 立即在多選器下方**建立**對應的控制面板，並帶入該類型的**預設參數**（見第 7 節）。
- 取消勾選某個 Chart → 立即**移除**對應的控制面板。
- 這些變動只更新 `draftConfig`（面板的顯示/隱藏、Drawer 內容），**不會**立即影響主畫面的 Chart，也不會觸發 Backend 請求；必須等使用者按下「套用」才會反映到主畫面（見第 9 節「Draft Before Apply」）。
- 若使用者取消勾選後又重新勾選同一個 Chart（在同一次開啟 Drawer 期間），控制面板恢復為**上次的 Draft 參數**（不重置為預設值），避免使用者因手滑取消勾選而遺失剛剛調整好的參數。

---

# 7. 各 Chart 控制面板

## 7.1 Price/MA 面板

```
┌──────────────────────┐
│ Price/MA              │
│                      │
│ MA 週期（逗號分隔）      │
│ [ 10,30 ]             │
└──────────────────────┘
```

價格固定以 K 線圖顯示（不提供收盤價線切換）。

- **MA 週期（`M`）**：逗號分隔的數字列表，例如 `10,30`。
  - 最多 **3** 個數值。
  - 每個數值範圍 **2 ～ 90**（整數）。
  - 允許 **0 個**數值（清空＝不疊加任何 MA 線，僅顯示價格）。
  - 每個週期各畫一條 MA 線（對應 API 回應的 `MA_<M>` 欄位）。
  - 預設值：`M = [20]`（預設顯示一條 20 日均線）。

## 7.2 Volume 面板

```
┌──────────────────────┐
│ Volume                │
│                      │
│ （無可調整參數）        │
└──────────────────────┘
```

- 無任何參數，面板內容留空（可顯示一行說明文字，例如「此圖表無可調整參數」）。
- 唯一的作用就是「是否顯示 Volume Pane」，由 Chart 多選器的勾選狀態決定。

## 7.3 MACD 面板

```
┌──────────────────────┐
│ MACD                  │
│                      │
│ 快線週期 M   [ 12 ]    │
│ 慢線週期 N   [ 26 ]    │
│ 訊號週期 K   [  9 ]    │
└──────────────────────┘
```

- **M（快線週期）**、**N（慢線週期）**：整數，範圍 **2 ～ 90**，且 **M < N**。
- **K（訊號線週期）**：整數，建議範圍 **2 ～ 50**。
  - 理由：業界慣例的訊號線週期以個位數到十位數為主（標準值 `9`；常見的短週期變體如 `5`），即使在日內交易等快速反應的用法中也很少超過 20；上限設為 50 已足夠寬鬆，同時避免使用者輸入遠超過 M/N 尺度、對訊號線而言沒有實務意義的數值（例如 K=90）。此建議可依實際驗證結果再調整。
- 預設值：`M=12, N=26, K=9`。
- 套用後系統自動顯示 MACD Line／Signal Line／Histogram 三條資料，使用者不需分別開關。

## 7.4 Bollinger Bands 面板

```
┌──────────────────────┐
│ Bollinger Bands        │
│                      │
│ MA 週期 M    [ 20 ]    │
│                      │
│ 標準差倍數（逗號分隔）    │
│ [ 1.5,2 ]              │
└──────────────────────┘
```

價格固定以 K 線圖顯示，與 Price/MA 面板相同（不提供收盤價線切換）。

- **M（移動平均週期）**：單一整數，範圍 **2 ～ 90**。對應中軌 `BOLL_MID`。
- **標準差倍數（`std`）**：逗號分隔的數字列表，例如 `1.5,2`。
  - 最多 **3** 個數值，至少 **1** 個（Bollinger Bands 圖表的核心即上下軌，不允許清空）。
  - 每個數值範圍 **0.5 ～ 3.0**，最多一位小數。
  - 每個倍數各畫一組上／下軌（對應 `BOLL_UPPER_<std>`／`BOLL_LOWER_<std>`）；中軌只計算一次，不受 `std` 個數影響。
  - 預設值：`M = 20, std = [2]`。

---

# 8. 參數驗證規則（彙總）

| Chart | 參數 | 規則 |
|---|---|---|
| Price/MA | `M` | 0～3 個整數，each ∈ [2, 90] |
| Volume | — | 無 |
| MACD | `M`, `N` | 整數 ∈ [2, 90]，且 `M < N` |
| MACD | `K` | 整數 ∈ [2, 50]（建議值，見 7.3） |
| Bollinger Bands | `M` | 整數 ∈ [2, 90] |
| Bollinger Bands | `std` | 1～3 個數字，each ∈ [0.5, 3.0]，最多一位小數 |

驗證規則：

- 逗號分隔輸入（`M`／`std`）：trim 空白、去除重複值後再驗證個數與範圍。
- Validation failed → 不觸發「套用」的後續動作（不 disable 整個 Drawer），直接在對應輸入框下方顯示錯誤訊息；其餘已通過驗證的面板不受影響。
- 只要目前**已勾選**的 Chart 全數通過驗證，「套用」才可點擊；未勾選的面板即使有殘留的無效草稿值，也不阻擋套用（因為未勾選＝不會被送出）。

---

# 9. Apply Behavior 與資料請求規則

## 9.1 Draft Before Apply

Drawer 內所有操作（勾選/取消勾選 Chart、修改任何面板參數）都只更新 `draftConfig`，**不會**立即送出 Backend 請求或更新主畫面 Chart。

## 9.2 套用（Apply）流程

1. Validate `draftConfig`（見第 8 節）。
2. `appliedConfig = draftConfig`，**立即關閉 Drawer**——套用本身是同步操作，不等待 Backend 回應。
3. `appliedConfig` 的變動會觸發「9.3 資料請求規則」重新抓取資料並重繪 Chart；請求失敗時的處理見第 12 節（此時 Drawer 已經關閉）。

## 9.3 資料請求規則（無快取、整批取代）

本功能**不維護資料快取，也不嘗試合併新舊回應**。只要 `stock`、`dateRange`、`appliedConfig` 任一改變（無論是 Step 3 查詢，還是 Drawer 套用），就送出一次新的請求，並用回應**整批取代**目前的 `chartData`（不與請求前的 `chartData` 合併）。

請求內容：對 `appliedConfig` 中**每一個已勾選**、且需要指標運算的 Chart 類型，各組出一筆 `{type, params}`，一次送出：

| Chart | 是否出現在請求中 |
|---|---|
| Price/MA | 若已勾選且 `M` 非空 → `{ type: "MA", params: { M } }` |
| Volume | 從不出現（無指標運算） |
| MACD | 若已勾選 → `{ type: "MACD", params: { M, N, K } }` |
| Bollinger Bands | 若已勾選 → `{ type: "BOLL", params: { M, std } }` |

未勾選的 Chart 類型不出現在請求中。Volume 的顯示與否本身不影響請求內容（純顯示層面的選項，不需要指標運算）。

換言之：
- 勾選/取消勾選 Chart、調整參數 → 只更新 `draftConfig`，不觸發請求。
- 按下「套用」→ `appliedConfig` 改變 → 觸發一次請求，內容為**當下所有已勾選 Chart 的完整參數**——即使某個 Chart 的參數沒有變動，只要有其他 Chart 同時改變導致需要重新套用，仍會一併重新請求。
- **沒有**「這個指標之前已經取過、可以跳過」的判斷；每次套用都視為全新查詢，回應整批取代 `chartData`。

**範例**：使用者原先套用過 `Price/MA(M=[10,30])`；之後在 Drawer 新增 MACD（Price/MA 的 `M` 維持不變）→ 按套用：送出 `[{ type: "MA", params: { M: [10, 30] } }, { type: "MACD", params: { M: 12, N: 26, K: 9 } }]`——MA 的參數雖然沒有變動，仍一併重新計算並回傳；回應整批取代 `chartData`。

---

# 10. Cancel Behavior

按「取消」：捨棄本次開啟 Drawer 期間的所有 `draftConfig` 變動，Chart 維持原本 `appliedConfig`。

```
appliedConfig
    ↓
開啟 Drawer → Clone → draftConfig
    ↓
使用者編輯（勾選/取消勾選 Chart、調整參數）
    ↓
取消 → 捨棄 draftConfig
套用 → appliedConfig = draftConfig → 立即關閉 Drawer → 觸發第 9.3 節的資料請求 → 整批取代 chartData
```

---

# 11. Loading State

`stock`、`dateRange` 或 `appliedConfig` 任一改變都會觸發第 9.3 節的資料請求，此時：

- Chart 區域顯示 Loading（例如疊加 Spinner），保留目前 Chart 內容、不清空，避免請求過程中畫面閃爍或消失
- 觸發來源的按鈕維持忙碌樣式（例如查詢按鈕的 loading 狀態）
- 「套用」本身是同步的（見 9.2）：點擊後立即關閉 Drawer，Loading 呈現在 Drawer 之外的主 Chart 區域，而不是 Drawer 的按鈕上——因為觸發請求時 Drawer 已經不在畫面上了

---

# 12. Error Handling

Backend 請求失敗：

- Drawer 已於「套用」當下關閉，**不會**因請求失敗重新開啟
- 於主畫面（Chart 區域上方）顯示錯誤訊息：「技術指標資料取得失敗，請稍後再試。」
- `chartData` 清空（沒有部分資料可以回退），使用者需重新查詢，或重新開啟 Drawer 送出一次套用來重試

---

# 13. State Model

```js
stock          // 目前選擇的股票代號
dateRange      // { start, end }，預設 [今日往前一年, 今日]

appliedConfig  // 目前 Chart 實際顯示的設定（已套用）
draftConfig    // Drawer 編輯中的設定（未套用）

chartData      // 最近一次請求的回應資料（見 FunctionSpec.md 1.4）；每次請求整批取代，不快取、不合併

loading
error
```

`appliedConfig` / `draftConfig` 結構（兩者形狀相同）：

```js
{
  charts: {
    priceMA: {
      enabled: true,
      M: [20]                   // 0~3 個整數，預設顯示一條 20 日均線；價格固定為 K 線圖
    },
    volume: {
      enabled: true
    },
    macd: {
      enabled: true,
      M: 12,
      N: 26,
      K: 9
    },
    boll: {
      enabled: true,
      M: 20,
      std: [2]                  // 1~3 個數字；價格固定為 K 線圖
    }
  }
}
```

---

# 14. 各 Chart 對應的資料欄位

Backend 回應格式為單一寬表格（`columns` 為欄位名稱陣列，`data` 為列物件陣列、每列以欄位名為 key，詳見 `FunctionSpec.md` 1.4 節），欄位命名規則已於該文件定義。以下整理每個 Chart 應**從回應中挑選哪些欄位**來繪圖：

| Chart | 使用欄位 | 說明 |
|---|---|---|
| **Price/MA** | `DATE`, `OPEN`, `MAX`, `MIN`, `CLOSE`（K 線圖，固定）；疊加線：draft `M` 列表中每個 `m` 對應一條 `MA_<m>` | `MA_<m>` 為 `null` 的前導區段（rolling window 尚未足夠）不畫線／視為資料缺失 |
| **Volume** | `DATE`, `TRADING_VOLUME` | 可選：以 `CLOSE` 與 `OPEN`（或前一日 `CLOSE`）比較決定長條顏色（漲／跌） |
| **MACD** | `DATE`, `MACD_DIF`, `MACD_SIGNAL`, `MACD_HISTOGRAM` | `MACD_DIF`/`MACD_SIGNAL` 畫線，`MACD_HISTOGRAM` 畫柱狀圖，三者共用同一個獨立 Y 軸 |
| **Bollinger Bands** | `DATE`, `OPEN`, `MAX`, `MIN`, `CLOSE`（K 線圖，固定，同 Price/MA）；疊加：`BOLL_MID`，以及 draft `std` 列表中每個 `s` 對應 `BOLL_UPPER_<s>` / `BOLL_LOWER_<s>` | 上下軌通常以區間填色（band area）呈現，中軌畫單線 |

> 欄位名稱中的 `std` 小數點以 `p` 表示（例：`1.5` → `BOLL_UPPER_1p5`），前端在組欄位名時需比照 `FunctionSpec.md` 1.4 節的規則轉換。

---

# 15. Recommended Component Architecture

```
TechnicalAnalysisPage
├── StockSearch
├── DateRangePicker            // 預設一年前 ~ 今日
├── SearchButton
│
├── ChartToolbar
│   └── ChartSettingsButton
│
├── TechnicalChart
│   ├── PriceMAPane            // Price/MA
│   ├── VolumePane             // Volume
│   ├── MACDPane               // 僅 enabled 時渲染
│   └── BollingerPane          // 僅 enabled 時渲染
│
└── ChartSettingsDrawer
    ├── ChartTypeSelector      // 四選多，控制下方面板的建立/移除
    ├── PriceMAPanel
    ├── VolumePanel
    ├── MACDPanel
    ├── BollingerPanel
    └── DrawerFooter
        ├── CancelButton
        └── ApplyButton
```

---

# 16. UI / UX Principles

## Principle 1 — Fixed Chart Types, Not Freeform Indicators

本功能只有四種固定的 Chart 類型，使用者以勾選方式開關，而非自由新增/刪除任意數量的指標實例。同一類型內若要畫多條線（如多條 MA），以參數陣列表示。此設計讓 UI 狀態機更單純：任何時刻，每種 Chart 類型最多只有「開／關＋一組參數」。

## Principle 2 — Chart First

Chart 是主要內容，Configuration Drawer 是輔助操作。Drawer 關閉後應盡可能提供最大的 Chart Viewing Area。

## Principle 3 — Draft Before Apply

所有設定修改（勾選/取消勾選 Chart、調整參數）先只存在 `draftConfig`。使用者完成多個設定後一次「套用」，避免頻繁 Backend Request。

## Principle 4 — Separate Market Data and Indicators

Base Chart（Price/MA 的價格部分、Volume）與 Technical Indicator（MA、MACD、Bollinger Bands 的指標計算部分）在資訊架構上分開，但透過同一個 API 取得：Step 3「查詢」以空的 `indicators` 送出、只取得基礎行情；Drawer 套用則帶上目前所有已勾選的指標。無論哪次觸發，回應都是完整、整批取代的資料（見第 9.3 節），不做部分快取或合併。

## Principle 5 — Simplicity Over Caching

不維護請求快取，也不做部分合併。任何足以影響圖表內容的狀態改變（股票、時間區間、`appliedConfig`）都視為「重新查詢一次」，用最新回應整批取代 `chartData`——沒有「這筆資料是否已經取過」的判斷。這犧牲了一些可避免的重複運算（例如未變動的指標也會隨其他指標一起重新計算），換取更簡單、更不容易出錯的資料流：任何時刻只有一個真相來源（最近一次回應），不需要推理快取是否過期或如何與舊資料合併。

## Principle 6 — Extensible Chart Architecture

未來新增 RSI/KD 等指標時，比照 MACD：在 Chart 多選器新增一個固定選項＋新增一個獨立 Pane＋新增一個固定的控制面板，不需更動整體 User Flow 或 Drawer 的兩層結構（多選器＋面板）。

---

# 17. MVP Scope

第一版需要支援：

### Chart 類型（固定四種）

- Price/MA（K 線／收盤價 + 0～3 條 MA）
- Volume
- MACD（Line／Signal／Histogram）
- Bollinger Bands（K 線／收盤價 + 上中下軌，1～3 組 std）

### Core Interaction

- Chart 多選器（開關四種 Chart）
- 各面板參數編輯與驗證（見第 8 節）
- 取消／套用
- 套用時依第 9.3 節規則一律重新請求 API（無快取、整批取代）
- Loading（查詢或套用期間顯示）
- 錯誤處理

---

# 18. Final UX Flow Summary

```
Stock Selection
      ↓
Date Range（預設一年前～今日）
      ↓
查詢 → 依預設 appliedConfig 送出請求（含 MA_20）→ 整批取代 chartData
      ↓
顯示預設 Chart：Price/MA（含 MA_20）+ Volume
      ↓
開啟 Chart Settings Drawer
      ↓
Chart 多選器：勾選/取消勾選 Price/MA、Volume、MACD、Bollinger Bands
      ↓
對應控制面板自動建立/移除，帶入預設參數
      ↓
編輯各面板參數（Draft）
      ↓
點擊套用
      ↓
Validate → appliedConfig = draftConfig → 立即關閉 Drawer
      ↓
appliedConfig 的變動觸發第 9.3 節的資料請求（帶上目前所有已勾選 Chart 的完整參數）
      ↓
Loading → Request Backend → 整批取代 chartData（不快取、不合併）
      ↓
重繪 Chart
```

---

# 19. Key Product Concept

The feature should be designed around:

> One configurable technical-analysis chart with a fixed set of chart types (Price/MA, Volume, MACD, Bollinger Bands), rather than an open-ended list of user-created indicator instances.

And:

> There is no cache and no partial merge. Every change to the stock, date range, or applied configuration triggers exactly one fresh backend request for whatever's currently enabled, and that response wholesale replaces the chart's data — nothing is preserved from the previous response, and there's no "is this already covered" check to reason about.

The Right Drawer acts as the centralized configuration interface for the entire chart, structured as a chart-type selector followed by one fixed panel per selected type.

This architecture should remain extensible so additional chart types such as RSI or KD can be added later by following the same pattern (selector option + independent pane + fixed panel) without redesigning the overall User Flow.
