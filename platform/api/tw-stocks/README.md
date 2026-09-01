# TW Stocks API

FastAPI service that serves Taiwan stock daily prices via [FinMind](https://finmindtrade.com/).

## Setup

1. Create a virtual environment and install dependencies:

   ```
   python -m venv .venv
   .venv\Scripts\python.exe -m pip install -r requirements.txt
   ```

2. Set your FinMind API key. Copy `.env.example` to `.env` and fill it in:

   ```
   copy .env.example .env
   ```

   ```
   FINMIND_APIKEY=your_finmind_token_here
   ```

## Run

```
.venv\Scripts\python.exe -m uvicorn app.main:app --reload --port 8088
```

The API is now available at `http://127.0.0.1:8088`.

> Note: the frontend's `tw-stock/trend` page expects the backend at
> `http://127.0.0.1:8088` (see `frontend/.env.local`), and the frontend dev server itself
> runs on port 8089.

## Try it in Swagger

Open `http://127.0.0.1:8088/docs` in your browser. This gives an interactive UI where you can
expand an endpoint, click **Try it out**, fill in the params, and execute the request directly.

(A ReDoc view is also available at `/redoc`, and the raw OpenAPI schema at `/openapi.json`.)

## Endpoints

### `GET /api/v1/tw/history/stock/price`

Query params:

| Param | Type | Required | Example | Description |
|---|---|---|---|---|
| `id` | string | yes | `0050,2308` | Comma-separated stock ids |
| `start` | date | yes | `2026-01-01` | Start date (inclusive) |
| `end` | date | yes | `2026-03-01` | End date (inclusive) |

Example:

```
GET /api/v1/tw/history/stock/price?id=0050,2308&start=2026-01-01&end=2026-03-01
```

```json
{
  "start": "2026-01-01",
  "end": "2026-03-01",
  "ids": ["0050", "2308"],
  "data": [
    {
      "stock_id": "0050",
      "date": "2026-01-02",
      "open": 66.0,
      "max": 67.0,
      "min": 65.8,
      "close": 66.95,
      "trading_volume": 81135717
    }
  ]
}
```

### `GET /api/v1/tw/stocks/search`

Search Taiwan-listed stocks by id or Chinese name. Backed by a static snapshot at
`data/tw_stock_info.csv` (not a live FinMind call), so it's fast and doesn't burn API quota.

| Param | Type | Required | Example | Description |
|---|---|---|---|---|
| `q` | string | yes (empty returns `[]`) | `台積` or `2330` | Search text, matched against stock id or name |
| `limit` | int | no (default 20, max 50) | `10` | Max results |

Example:

```
GET /api/v1/tw/stocks/search?q=台積
```

```json
[
  { "stock_id": "2330", "stock_name": "台積電", "industry_category": "電子工業", "type": "twse" }
]
```

To refresh the static list from FinMind (e.g. after new listings):

```
.venv\Scripts\python.exe -m scripts.update_stock_info
```

### `GET /api/v1/tw/portfolio/efficient-frontier`

Monte Carlo simulation of random-weight portfolios for the given stocks, for plotting an
efficient frontier. See `lab/plot_efficient_frontier.py` for the reference methodology.

| Param | Type | Required | Example | Description |
|---|---|---|---|---|
| `id` | string | yes (min 2 ids) | `0050,2308,2330` | Comma-separated stock ids |
| `start` | date | yes | `2026-01-01` | Start date (inclusive) |
| `end` | date | yes | `2026-08-28` | End date (inclusive) |
| `num_portfolios` | int | no (default 3000, 100-20000) | `5000` | Number of random portfolios to simulate |

Example:

```
GET /api/v1/tw/portfolio/efficient-frontier?id=0050,2308,2330&start=2026-01-01&end=2026-08-28
```

```json
{
  "start": "2026-01-01",
  "end": "2026-08-28",
  "ids": ["0050", "2308", "2330"],
  "portfolios": [
    { "annual_return": 0.72, "annual_volatility": 0.33, "sharpe_ratio": 2.18, "weights": { "0050": 0.4, "2308": 0.3, "2330": 0.3 } }
  ],
  "max_sharpe": { "annual_return": 0.85, "annual_volatility": 0.35, "sharpe_ratio": 2.42, "weights": { "...": 0.0 } },
  "min_volatility": { "annual_return": 0.80, "annual_volatility": 0.33, "sharpe_ratio": 2.40, "weights": { "...": 0.0 } }
}
```

### `GET /health`

Basic liveness check, returns `{"status": "ok"}`.
