# 投資與量化交易學習計畫（12 週 / 3 個月）

> 定位：你已具備 CFA 級金融知識與 Python / 軟體開發能力，本計畫**不重複基礎金融概念**，直接進入「分析 → 策略設計 → 回測 → 實戰」。
> 節奏：每週約 **10 小時**（理論 1.5h／工具操作 1.5h／Python・Backtrader 實作 4h／投資練習 1.5h／作業與產出整理 1.5h，可自行微調）。
> 特別之處：你正在自建「台股分析平台」（`/stock/technical` 已上線 MACD／RSI／Bollinger／Volume／Price-MA 圖表，`/stock/valuation`、`/stock/fundamental` 為佔位頁面）。本計畫會刻意讓部分作業「反哺」這個平台——用你正在學的東西，去驗證、修正、擴充你自己寫的程式碼，這比單純寫 Notebook 更紮實。

---

## 一、學習目標

3 個月後，你應該能夠：

1. 不依賴指標，純用 K 線結構、Price Action、量價關係判讀個股狀態，並能用 SMA/EMA/MACD/RSI/BB/ATR/ADX/OBV 建立可量化的進出場條件。
2. 用 Python + pandas + Backtrader 從零建立一個「有交易成本、有滑價、有部位管理」的回測系統，並能正確計算 CAGR/Sharpe/Sortino/MDD/Win Rate，同時**主動辨識**回測中的 look-ahead bias、survivorship bias、overfitting、data leakage，並用 walk-forward testing 驗證策略穩健性。
3. 用財務三表、成長性、獲利能力、估值倍數與 DCF，快速判斷一家公司的品質與合理價格區間，並理解 Moat／管理層／產業結構如何影響估值假設。
4. 把「選股（Fundamental+Valuation）× 擇時（Technical）× 風控（Risk Management）」整合成一個可回測、有明確規則的策略。
5. 用 Feature Engineering + Logistic Regression / Random Forest / XGBoost/LightGBM 建立預測模型，並用時間序列切分（非隨機切分）與 walk-forward CV 避免過擬合。
6. 用 LLM 輔助新聞/財報摘要、Sentiment 打分與 Investment Thesis 撰寫，同時清楚知道 AI 的角色是「加速研究」而不是「做決策」。
7. 產出一個端到端的 **Quant Investment Research Project**（見第七節），且理解它與你正在打造的台股分析平台之間可以互相延伸。

---

## 二、工具清單

| 類別 | 工具 | 用途 |
|---|---|---|
| 圖表/看盤 | TradingView（Free/Pro 皆可） | K 線結構、指標疊圖、畫線練習、公開策略 idea 參考 |
| 基本面/估值 | Investing.com | 財務三表、Ratios、Peers 比較、Analyst Fair Value |
| 資料來源 | `yfinance`（美股/ETF）、FinMind（台股，你平台已在用）、Tiingo/Alpha Vantage（備援） | 取得 OHLCV、財報數據 |
| Python 核心 | `pandas`, `numpy`, `matplotlib`/`plotly`, `mplfinance`, `jupyter` | 資料處理與視覺化 |
| 技術指標 | `pandas-ta` 或 `ta` | 驗證手刻公式、快速計算 |
| 回測框架 | `backtrader`（主）、可選 `vectorbt`（進階/向量化速度） | Event-driven backtest |
| 績效分析 | `quantstats` | 一鍵產出策略報告（Sharpe/Sortino/MDD/月報酬熱力圖…） |
| 機器學習 | `scikit-learn`, `xgboost`, `lightgbm`, `shap` | 特徵工程、建模、可解釋性 |
| 消息面/AI | Claude（或其他 LLM）API、新聞 RSS / 既有新聞 API | 摘要、Sentiment、Thesis 生成輔助 |
| 版本控制 | Git（你已在用） | 每週產出建議都進版控，方便追蹤成長 |

---

## 三、教材清單（挑重點章節讀，不用整本啃完）

- 技術分析：John Murphy《Technical Analysis of the Financial Markets》（Trend/S&R/Volume 章節）；TradingView 官方 Help Center 的指標說明。
- 量化交易：Ernest Chan《Quantitative Trading》；Backtrader 官方文件（Cerebro/Strategy/Indicator/Analyzer/Sizer）。
- 回測方法論與偏誤：Marcos López de Prado《Advances in Financial Machine Learning》第 1、7、11–13 章（overfitting、backtest 統計陷阱、cross-validation in finance）。
- 基本面/估值：CFA Level II/III 的 Equity Valuation 讀本（你已學過，用來查表即可）；Aswath Damodaran 的 Valuation 課程/部落格（DCF 與 relative valuation 實戰）。
- 機器學習：Georgia Tech「Machine Learning for Trading」（Coursera/edX，可選看）；scikit-learn 官方 `TimeSeriesSplit` 文件。
- 消息面/NLP：Loughran-McDonald 財務情緒字典（了解 lexicon-based sentiment 的基礎，對照 LLM-based 方法的差異）。

---

## 四、12 週 Roadmap

### 第 1 週｜K 線、Price Action、Trend、Support/Resistance

**學習目標**：不靠指標，純粹用 K 棒與結構判讀多空與位置；建好本計畫的開發環境。

**理論**：K 棒解讀（實體/影線、吞噬、Pin Bar、Inside Bar）；Price Action 結構（Higher High/Higher Low、Break of Structure）；Support/Resistance（前高前低、整數關卡）；趨勢的三態（上升/下降/區間）。

**工具操作**：TradingView 練習畫趨勢線、水平線、Fibonacci retracement；建立 5–10 檔觀察股清單（可含你平台上關注的台股）。

**Python/Backtrader 實作**：
- 建立環境：`venv`/`uv` + `pandas numpy matplotlib mplfinance yfinance jupyter`。
- 用 `yfinance` 或你平台的 FinMind pipeline 抓 OHLCV，用 `mplfinance` 畫 K 線圖。
- 寫 `find_swing_highs_lows(df, window)`：用 rolling window 比較法自動標出 Swing High/Low，疊圖比對你手動畫的結構是否一致。

**投資練習**：每天收盤後 10 分鐘，對 5 檔觀察股用 TradingView 標註「延續 or 反轉」，開始寫 Investment Journal（見第六節模板）第 1 篇。

**作業**：對 5 檔股票各寫一段「目前趨勢結構」：處於 Uptrend/Downtrend/Range？最近的關鍵 S/R 在哪？

**最終產出**：`swing_high_low_detector.ipynb`（含自動偵測 function）＋ 5 檔股票 Price Action 分析筆記。

---

### 第 2 週｜Volume、SMA/EMA、MACD

**學習目標**：理解均線的 lag 特性與用途、MACD 動能判讀、量價確認邏輯。

**理論**：SMA vs EMA 計算與差異；MACD = EMA12−EMA26，Signal=EMA9(MACD)，Histogram；量價關係（價漲量增 vs 價漲量縮，量能背離）。

**工具操作**：TradingView 疊加 SMA20/50/200、EMA12/26、MACD、Volume；找 3 個歷史黃金/死亡交叉案例，回看後續走勢。

**Python/Backtrader 實作**：
- 手刻 SMA/EMA/MACD 公式（不用套件），再用 `pandas-ta` 驗證數值一致。
- **對照你自己平台的 `MACDChart.jsx` 與後端計算邏輯**：把後端算出的值 export 出來，跟你這週手刻的結果比對，這是很好的除錯機會，也能確認你平台上線功能算法正確。

**投資練習**：對 5 檔觀察股疊加 MA+MACD+Volume，記錄「是否出現交叉訊號、量能是否驗證」。

**作業**：挑一次歷史黃金交叉，人工估算「若當天進場，30 天後結果如何」。

**最終產出**：`ma_macd_volume_analysis.ipynb`（含手刻公式 vs `pandas-ta` 驗證表）。

---

### 第 3 週｜RSI、Bollinger Bands、ATR、ADX、OBV＋技術面 Screener

**學習目標**：掌握震盪指標（RSI）、波動指標（BB/ATR）、趨勢強度（ADX）、量能確認（OBV），並整合成可程式化的篩選條件。

**理論**：RSI 計算與背離（divergence）陷阱；Bollinger Bands（均值回歸 vs 突破兩種解讀、%B、Bandwidth）；ATR 作為波動衡量與停損距離基準；ADX 判斷趨勢強度（不判斷方向）；OBV 用累積量能驗證趨勢。

**工具操作**：TradingView 疊加 RSI/BB/ATR/ADX/OBV，找出至少 2 個背離案例。

**Python/Backtrader 實作**：
- 用 `pandas-ta` 寫 `compute_indicators(df)`，一次算出所有指標並回傳完整 DataFrame。
- **對照你平台的 `RSIChart.jsx` / `BollingerChart.jsx`**，確保邏輯一致；若有餘力，把 ATR/ADX/OBV 也實作進你平台的技術面模組（延伸你正在做的功能）。
- 寫一個簡易 Screener：對一組股票（如 0050 成分股）套用「RSI<30 且觸及 BB 下軌且 ADX>25」等條件，輸出符合清單。

**投資練習**：跑一次 Screener，把結果和手動看 TradingView 的判讀比對，確認程式正確性。

**作業**：對 Screener 選出的 3 檔股票寫技術面觀點（entry idea + invalidation 條件）。

**最終產出**：`technical_screener.py` ＋「本週技術面觀察清單」（3 檔標的的技術理由與失效條件）。

---

### 第 4 週｜Vectorized Backtest 基礎

**學習目標**：理解回測的核心流程與最容易犯錯的地方（look-ahead bias），先用 vectorized 方式建立直覺，之後才進 event-driven 框架。

**理論**：回測流程 signal → position → returns → equity curve；vectorized backtest（快、易 debug）vs event-driven backtest（真實但複雜）的取捨；為什麼 `position` 必須用 `shift(1)`（避免用「今天才知道」的訊號去交易「今天」的報酬）。

**工具操作**：（本週以 Jupyter 為主，暫停 TradingView）

**Python/Backtrader 實作**：
- 純 pandas 刻一個 MA crossover 策略：`signal = (fast_ma > slow_ma)`，`position = signal.shift(1)`，`strategy_returns = position * daily_returns`。
- 畫 equity curve 對比 Buy & Hold。
- 刻意示範「忘記 shift(1)」會讓績效異常變好——親手體會一次 look-ahead bias 長什麼樣子。

**投資練習**：用此策略回測你 5 檔觀察股過去 2–3 年表現，跟實際 Buy & Hold 比較。

**作業**：改參數（10/50 vs 20/100 MA），觀察結果對參數的敏感度，思考這是否是 curve-fitting 的前兆。

**最終產出**：`vectorized_backtest_ma_crossover.ipynb`（含 equity curve、參數敏感度表、一段「錯誤示範」的對照）。

---

### 第 5 週｜Backtrader：Entry/Exit、Position Sizing、Transaction Cost、Slippage

**學習目標**：用 event-driven 框架建立更貼近真實交易的回測，理解部位管理與成本對績效的影響。

**理論**：event-driven backtest 的優勢（真實模擬訂單執行、多資產、broker 模擬）；Position Sizing 方法（Fixed Fractional、Fixed Dollar、ATR-based volatility sizing、Kelly 概念簡介）；Transaction Cost 與 Slippage 為何會讓「紙上策略」與「真實績效」產生落差。

**工具操作**：安裝 `backtrader`，讀官方文件熟悉 `Cerebro`/`Strategy`/`Indicator`/`Sizer`/`Analyzer` 架構。

**Python/Backtrader 實作**：
- 把第 4 週的 MA crossover 用 Backtrader 重寫（`Strategy` class + `next()`）。
- 加入手續費（`cerebro.broker.setcommission`）與滑價（`cerebro.broker.set_slippage_perc`）。
- 寫一個自訂 `Sizer`，實作 ATR-based position sizing。
- 比較「含成本」vs「不含成本」的績效差異，量化成本對長期複利的侵蝕。

**投資練習**：把台股真實交易成本（賣出證交稅 0.3% + 手續費約 0.1425%×2，可打折）代入 commission 設定，讓回測更貼近你實際會發生的情況。

**作業**：用 Fixed vs ATR-based sizing 重跑同一策略，比較 Max Drawdown 差異。

**最終產出**：`backtrader_ma_strategy.py` ＋ 成本敏感度分析表（不同 commission/slippage 假設下的績效變化）。

---

### 第 6 週｜績效指標、四大回測陷阱、Walk-forward Testing

**學習目標**：正確計算並解讀績效指標，並學會主動檢查自己的回測是否「作弊」。

**理論**：CAGR、Sharpe（年化方式與 risk-free rate 的選取）、Sortino（只罰下方波動）、Max Drawdown / Calmar、Win Rate vs Payoff Ratio、Profit Factor；四大陷阱：**Look-ahead Bias**（用了未來才會知道的資訊）、**Survivorship Bias**（用「現在」的成分股回測「過去」）、**Overfitting**（參數/規則過度貼合歷史）、**Data Leakage**（如財報數字沒有對齊「公佈日」而對齊「財報期間」）；**Walk-forward Testing**：滾動視窗 in-sample 找參數、下一段 out-of-sample 驗證。

**工具操作**：（可選）用 `quantstats` 產出 HTML 策略報告。

**Python/Backtrader 實作**：
- 寫 `performance_report(returns)`，輸出上述所有指標。
- 把第 5 週策略接上 `quantstats.reports.html()` 產出完整報告。
- 實作簡易 walk-forward：每 2 年 in-sample 找最佳參數 → 下半年 out-of-sample 測試，觀察績效衰減幅度。

**投資練習**：若你有過去實際交易記錄，算出自己的 Win Rate/Payoff Ratio，跟策略數字比較。

**作業**：對第 5 週策略程式碼逐項自我審查，寫一份「Look-ahead / Survivorship / Data Leakage 檢查清單」勾選結果。

**最終產出**：`performance_report.py` ＋ `walk_forward_ma_strategy.ipynb` ＋ 策略體檢報告（含四大 bias checklist）。

---

### 第 7 週｜基本面分析：財務三表、成長性、獲利能力、負債

**學習目標**：快速從財報判斷公司品質與成長真實性（跳過基礎知識，直接進判斷力訓練）。

**理論**：財務三表勾稽關係（Net Income → CFO 調整項、CapEx → FCF）；Revenue/EPS/FCF Growth 的品質判斷（有機成長 vs 併購灌水 vs 庫藏股墊高 EPS）；ROE 杜邦分解（Margin × Turnover × Leverage）；ROIC vs WACC（價值創造判斷）；Margin 趨勢反映競爭力變化；Debt（Net Debt/EBITDA、利息覆蓋率）。

**工具操作**：Investing.com — 練習閱讀 Income Statement / Balance Sheet / Cash Flow 頁面、Ratios 頁面、Peers 比較功能。

**Python/Backtrader 實作**：
- 用 FinMind（你平台已在用的資料源）抓 3–5 檔台股財務三表。
- 用 pandas 算出 ROE 杜邦分解、ROIC、FCF、Margin 趨勢，畫 3 年趨勢圖。
- **為你平台的 `/stock/fundamental`（目前是 ComingSoon 佔位頁）寫第一版資料 pipeline 草稿**：`get_fundamentals(stock_id) -> DataFrame`，直接把這週的分析邏輯往你的產品方向靠。

**投資練習**：選 3 檔你感興趣的公司，用 Investing.com + 自己算的數據寫「財務體質健診」一頁報告。

**作業**：找一檔「EPS 成長但 FCF 沒跟上」的公司，分析可能原因（存貨/應收帳款增加？庫藏股？）。

**最終產出**：`fundamental_analysis.ipynb` ＋ 3 份公司財務體質健診報告。

---

### 第 8 週｜估值方法與商業模式分析

**學習目標**：掌握 Relative Valuation 與 DCF 的操作與陷阱，並能結合 Moat/管理層/產業結構判斷估值假設是否合理。

**理論**：Relative Valuation（P/E, P/B, EV/EBITDA, FCF Yield）的適用情境與陷阱（週期股用 P/E 易失真）；DCF 核心：FCFF/FCFE、Terminal Value（Gordon Growth）、WACC 估算——**敏感度分析比單一「精準」估值更重要**；Business Quality/Moat（定價權、網路效應、轉換成本）、Management（資本配置紀錄）、Industry（生命週期、競爭格局）如何轉化為估值假設（growth rate、margin 假設、WACC 的風險溢酬）。

**工具操作**：Investing.com 的 Fair Value/Analyst Estimates、Peers 估值比較表。

**Python/Backtrader 實作**：
- 寫 DCF calculator function：輸入 FCF/Growth/WACC/Terminal Growth，輸出 Intrinsic Value + 用 DataFrame 呈現不同 WACC×Growth 組合的敏感度表。
- 寫 Relative Valuation Screener：對一組股票算 P/E, P/B, EV/EBITDA, FCF Yield 並在產業內排名（percentile rank）。
- 延續第 7 週平台草稿，補上 `/stock/valuation` 頁面的資料 pipeline：`get_valuation_metrics(stock_id)`。

**投資練習**：對第 7 週選的 3 檔公司做 DCF + Relative Valuation，寫出你認為的合理價格區間，並記錄「若現在買進，等於相信了哪些假設」。

**作業**：對 DCF 做敏感度分析（WACC ±1%、Terminal Growth ±0.5%），體會 DCF「precisely wrong」的本質。

**最終產出**：`dcf_calculator.py` ＋ `relative_valuation_screener.ipynb` ＋ 3 份公司估值報告（含價格區間與關鍵假設）。

---

### 第 9 週｜整合：Fundamental + Technical + Valuation + Risk Management

**學習目標**：把「選股」與「擇時」與「風控」整合成一個有明確規則、可回測的策略——這是 Final Project 的核心骨架。

**理論**：用 Fundamental+Valuation 建立「品質/估值過濾」的選股池，用 Technical 決定「進出場時機」，避免「基本面好但股價已反應」或「技術面差但硬要進場」的矛盾；Risk Management：ATR-based 停損、單筆風險占資金比例上限、產業集中度限制、相關性控制。

**工具操作**：把前 8 週在 TradingView / Investing.com 的操作習慣，整理成一份固定的「每週選股 SOP」文件。

**Python/Backtrader 實作**：
- 策略邏輯：Universe 篩選（如 ROE>15% 且 FCF Yield 高於產業中位數）→ Technical timing（如站上 SMA50 且 RSI 回升過 50 進場）→ Position Sizing（ATR-based）→ Stop Loss（ATR 倍數）。
- 用 Backtrader 實作此複合策略（多資產 `Cerebro`，可用自訂 Indicator 做定期 fundamental filter 的 rebalance）。
- 沿用第 6 週的 `performance_report` 產出完整績效報告。

**投資練習**：把策略選出的股票清單，跟你這幾週純人工分析的結論比對，找出不一致之處並理解原因。

**作業**：對整合策略做 walk-forward 驗證，記錄 in-sample/out-of-sample 差異與可能原因。

**最終產出**：`integrated_strategy.py`（可執行的 Backtrader 策略）＋ 策略說明書（選股邏輯＋進出場規則＋風控規則＋回測績效）——**此檔案將直接成為 Final Project 骨架**。

---

### 第 10 週｜Machine Learning：Feature Engineering + Logistic Regression

**學習目標**：把技術面與基本面資訊轉為可供模型使用的特徵，並用最簡單的分類模型建立 baseline，同時建立正確的時間序列驗證習慣。

**理論**：監督式學習在選股的三種框架——預測方向（分類）、預測數值（迴歸）、預測相對大盤的 Outperformance（排名/分類）；Feature Engineering：技術面（momentum、volatility、RSI…）＋ 基本面（ROE、估值 percentile…）；Label 設計（未來 N 日 return 正負／相對大盤強弱）；**再次強調 Data Leakage**：基本面特徵必須對齊「財報公佈日」而非「財報期間」。

**工具操作**：熟悉 scikit-learn 文件，尤其 `TimeSeriesSplit`。

**Python/Backtrader 實作**：
- 建 Feature Pipeline：合併第 3 週技術指標＋第 7/8 週基本面比率成一個 feature matrix。
- 建 Label：`future_return_20d > 0` 或 `future_return_20d > 大盤同期`。
- 用 `TimeSeriesSplit`（**絕不用預設隨機 split**）訓練 Logistic Regression，畫 Confusion Matrix 與 ROC-AUC。

**投資練習**：用訓練好的模型對目前股票池打分，跟你人工判斷比較差異，記錄哪裡一致、哪裡不一致。

**作業**：嘗試不同 label 定義（5/20/60 日），觀察準確率變化，理解 predict horizon 的取捨。

**最終產出**：`ml_feature_pipeline.ipynb` ＋ `logistic_regression_baseline.ipynb`（含 time-series split 方法與結果解讀）。

---

### 第 11 週｜Random Forest、XGBoost/LightGBM、Walk-forward CV、防止 Overfitting

**學習目標**：用樹模型提升預測力，並用更嚴謹的驗證方式確認模型是否真的有用（而非過擬合的假象）。

**理論**：樹模型優勢（非線性、特徵重要性、較不需標準化）；Gradient Boosting 原理簡介；Walk-forward Cross-Validation（比單一 train/test split 更嚴謹）；用 `feature_importances_`/SHAP 理解模型而非迷信黑箱數字；過擬合徵兆（train 準確率遠高於 test、特徵太多樣本太少）與應對（正則化、減少特徵、增加樣本、ensemble）。

**工具操作**：（本週純程式，無外部工具）

**Python/Backtrader 實作**：
- 自寫 rolling walk-forward CV（或用 `TimeSeriesSplit` 擴充）。
- 訓練 Random Forest 與 LightGBM，與第 10 週 Logistic Regression 比較 out-of-sample 表現（**複雜模型不一定更好**）。
- 用 SHAP 分析特徵重要性，結果要「講得出道理」，不能只信任數字。
- 把模型分數接回 Backtrader：作為第 9 週整合策略的選股排名因子之一，重新回測。

**投資練習**：比較「純規則策略」(第 9 週) vs「規則+ML 評分」策略的績效差異，思考 ML 到底加了什麼價值。

**作業**：寫一頁「這個模型我信任到什麼程度」的反思，列出可能讓它在真實市場失效的情境（如 regime change、特徵在樣本外分布位移）。

**最終產出**：`ml_tree_models_walkforward.ipynb` ＋ `ml_enhanced_strategy.py` ＋ 模型可信度評估報告。

---

### 第 12 週｜News、Sentiment、LLM 輔助研究 ＋ Final Project 收尾

**學習目標**：學會用 LLM 加速研究流程而不取代判斷，並完成 Final Project 的第一個端到端版本。

**理論**：消息面對股價的短中期影響（earnings surprise、guidance、產業新聞）；Sentiment Analysis 基本方法（lexicon-based vs LLM-based 的差異）；LLM 在投資研究的定位——加速摘要、加速閱讀、生成初稿，**不做最終買賣決策**；如何寫 Investment Thesis（核心論點、催化劑、風險、估值支撐、時間軸），以及使用 AI 時的責任界線（AI 產出永遠需要你自己驗證與承擔判斷責任）。

**工具操作**：用 LLM 實際操作——貼一份財報/法說會逐字稿，請它產出結構化摘要（Revenue/Guidance/管理層語氣重點）；練習用 LLM 做 Sentiment 打分，並**自己抽樣驗證**判斷是否合理，不盲信。

**Python/Backtrader 實作**：
- 寫簡易 News/Sentiment Pipeline：抓新聞標題（RSS 或既有 API）→ 用 LLM API 做 Sentiment 分類 → 輸出 Sentiment Score 時間序列。
- 把 Sentiment Score 當作額外 feature 加進第 11 週的 ML pipeline，測試是否提升預測力（**誠實記錄結果**，即使沒有顯著提升，這也是重要結論）。
- 整合本季所有模組，完成 Final Project 骨架：`Data → Fundamental → Technical → Sentiment → ML Score → Portfolio Construction → Risk Management → Backtest → Report`。

**投資練習**：用 LLM 協助撰寫一份完整 Investment Thesis（針對你追蹤最久的一檔股票），並自己審查 AI 是否有幻覺（hallucination）或過度樂觀傾向。

**作業**：完成 Final Project 第一版 end-to-end pipeline，即使簡陋也要能跑通。

**最終產出**：`news_sentiment_pipeline.py` ＋ `investment_thesis_with_llm.md` ＋ **Final Project v1**（完整可執行的 repo/notebook）。

---

## 五、Weekly Checklist（每週複製使用）

```markdown
## Week N Checklist — [日期區間]

### 學習
- [ ] 理論閱讀/筆記完成
- [ ] TradingView / Investing.com 工具操作完成
- [ ] Python/Backtrader 實作完成並可執行（無報錯）
- [ ] 產出結果與預期一致（若不一致，已寫下原因）

### 投資練習
- [ ] 本週觀察股/策略已記錄於 Investment Journal
- [ ] 作業已完成並存檔

### 自我檢查（回測相關週次額外檢查）
- [ ] 是否有 look-ahead bias（用了未來才知道的資訊）？
- [ ] 是否有 survivorship bias（用現在的股票池回測過去）？
- [ ] 參數是否過度貼合歷史（overfitting）？
- [ ] 基本面資料是否對齊「公佈日」而非「財報期間」（data leakage）？

### 最終產出
- [ ] 檔案已存放於指定資料夾並命名清楚
- [ ] 已 commit 到 git（若適用）
- [ ] 一句話總結本週最大收穫：__________
```

---

## 六、Investment Journal Template

建議用 Markdown 逐日/逐週紀錄，累積 12 週後你會有一份完整的「決策軌跡」，比任何回測報告更能反映你自己的行為模式。

```markdown
## [日期] — [股票代號/名稱]

**當前結構**：Uptrend / Downtrend / Range（附一句話理由）

**技術面**：
- 關鍵 S/R：
- 指標訊號（MA/MACD/RSI/BB/ATR/ADX/OBV）：
- 量能是否確認：

**基本面/估值**（若本週有分析）：
- ROE / ROIC / Margin 趨勢：
- 估值區間（DCF / Relative）：
- 與目前股價的落差：

**消息面**：
- 近期新聞/財報重點：
- Sentiment 傾向：

**決策**：
- 動作：Watch / Enter / Exit / Hold / No Action
- 理由（用一句話講清楚「為什麼是現在」）：
- Invalidation 條件（什麼情況會證明我錯了）：

**風控**：
- 停損位置：
- 部位大小（% of capital）：

**事後檢討**（1–2 週後回填）：
- 結果：
- 判斷對/錯的關鍵是什麼：
- 下次要調整的地方：
```

---

## 七、Final Project：Quant Investment Research Project

### 目標

把 12 週學到的六大模組整合成一個**端到端、可重複執行**的研究系統，輸出的不只是程式碼，而是「一份你敢拿去做真實投資決策參考的研究報告」。

### 系統架構

```
[Market Data Layer]
   FinMind / yfinance → 本地 cache（避免重複呼叫、避免額度耗盡）
        │
        ▼
[Fundamental Layer]           [Technical Layer]
  財務三表、成長性、             K線結構、SMA/EMA/MACD/
  ROE/ROIC、估值倍數、DCF        RSI/BB/ATR/ADX/OBV
        │                            │
        └───────────┬────────────────┘
                     ▼
            [Feature Store]
     合併 Fundamental + Technical + Sentiment 特徵
     （嚴格對齊資料可得時間點，避免 leakage）
                     │
                     ▼
         [ML / Scoring Layer]
   Logistic Regression → Random Forest → XGBoost/LightGBM
   Walk-forward CV，輸出每檔股票的排序分數
                     │
                     ▼
      [Sentiment / News Layer]（輔助特徵，非主力）
        LLM 摘要 + Sentiment Score
                     │
                     ▼
      [Portfolio Construction]
  依 Score 排名選股 + 產業/相關性限制 + Position Sizing（ATR-based）
                     │
                     ▼
        [Risk Management]
     停損規則、單筆風險上限、最大回撤觸發降槓桿
                     │
                     ▼
        [Backtest Engine]（Backtrader）
   含 Transaction Cost / Slippage，輸出 CAGR/Sharpe/Sortino/MDD/Win Rate
                     │
                     ▼
        [Report Layer]
   Notebook / HTML 報告 + LLM 協助生成 Investment Thesis 摘要
```

### 交付物清單

1. **資料層**：一個可重跑的 data pipeline（含 cache），至少覆蓋 20–50 檔標的、3–5 年歷史。
2. **策略規格書**（1 份 Markdown）：選股邏輯、進出場規則、風控規則、關鍵假設，寫得讓「未來的你」半年後還看得懂。
3. **回測報告**：含完整績效指標、walk-forward out-of-sample 結果、四大 bias 自我檢查清單（照第五節 checklist 格式）。
4. **ML 模型文件**：feature list、模型選擇理由、feature importance/SHAP 解讀、模型可信度評估。
5. **Sentiment/News 模組**：Sentiment pipeline + 效果驗證（有沒有提升預測力，誠實記錄，即使結論是「沒有」）。
6. **一份完整 Investment Thesis 範例**（LLM 輔助撰寫，你親自審查修正）。
7. **（延伸，選做）平台整合**：把 Fundamental/Valuation pipeline 接進你自己台股平台的 `/stock/fundamental`、`/stock/valuation` 頁面，讓這個 Final Project 不只是 Notebook，而是你產品的一部分。

### 評估標準（自我檢核）

- 這個策略的每一條規則，你都能解釋「為什麼」，而不是「因為回測結果好看」。
- 拿掉任何一個模組（例如 ML score），策略邏輯依然講得通——ML 是加分項，不是唯一支柱。
- Out-of-sample 績效沒有「離奇地好」；如果好到不可思議，先懷疑是不是哪裡漏資料或有 look-ahead。
- 你可以在不看程式碼的情況下，口頭跟別人講清楚整個系統的資料流與決策邏輯。

---

## 八、3 個月後的進階學習方向

完成本計畫後，建議依興趣挑 1–2 條深入，而不是全部平行推進：

- **組合層級進階**：Black-Litterman、Risk Parity、多因子模型（Fama-French 延伸、風格因子）、與你已上線的 Efficient Frontier 模組整合成完整資產配置系統。
- **回測框架升級**：`vectorbt`（大規模參數掃描、速度優化）或 QuantConnect/Lean（更接近機構級 event-driven 引擎、支援多資產類別）。
- **更嚴謹的統計驗證**：Deflated Sharpe Ratio、Probability of Backtest Overfitting（PBO）、Monte Carlo permutation test——專門對付「策略是不是純粹運氣好」的問題。
- **時間序列深度學習（審慎）**：LSTM/Transformer 用於價格預測前，先讀懂為何金融時間序列的低訊噪比讓深度學習容易「學到雜訊」；建議先在小規模、有明確 baseline 對照下實驗。
- **另類資料（Alternative Data）**：Google Trends、產業供應鏈數據、選擇權未平倉量（Put/Call Ratio）等作為額外訊號來源。
- **實盤/模擬交易串接**：串接券商 API（如 Interactive Brokers、國內券商 API）做 paper trading，把 Backtrader 策略接上真實（或模擬）下單流程，體驗滑價與執行風險與回測假設的落差。
- **選擇權與衍生品基礎**：若對風險管理或收益增強策略有興趣，可延伸學習 Covered Call、Protective Put、波動率交易的基礎概念。
- **持續整合到你的台股平台**：把 12 週學到的技術面/基本面/估值/回測模組陸續轉為平台的正式功能（尤其是目前還是 ComingSoon 的 `/stock/valuation`、`/stock/fundamental`），讓學習成果變成長期可用的工具，而不是一次性的 Notebook。
- **社群與同儕檢驗**：把策略邏輯拿去 Quant 社群（如 QuantConnect Forum、r/algotrading、本地量化讀書會）接受質疑與挑戰，外部視角往往比自己反覆回測更容易發現盲點。
