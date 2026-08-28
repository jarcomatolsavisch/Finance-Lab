from datetime import date

import numpy as np
import pandas as pd

from app.finmind_client import get_loader

TRADING_DAYS_PER_YEAR = 252


def fetch_close_prices(stock_ids: list[str], start: date, end: date) -> pd.DataFrame:
    loader = get_loader()
    frames = []
    for stock_id in stock_ids:
        df = loader.taiwan_stock_daily(
            stock_id=stock_id, start_date=start.isoformat(), end_date=end.isoformat()
        )
        frames.append(df[["date", "stock_id", "close"]])
    combined = pd.concat(frames, ignore_index=True)
    return combined.pivot(index="date", columns="stock_id", values="close").sort_index()


def simulate_efficient_frontier(
    stock_ids: list[str], start: date, end: date, num_portfolios: int
) -> dict:
    prices = fetch_close_prices(stock_ids, start, end)
    daily_returns = prices.pct_change().dropna()
    if daily_returns.empty:
        raise ValueError("Not enough price data in the given date range to compute returns")

    tickers = daily_returns.columns.tolist()
    mean_returns = daily_returns.mean().values
    cov_matrix = daily_returns.cov().values

    weights = np.random.default_rng().random((num_portfolios, len(tickers)))
    weights /= weights.sum(axis=1, keepdims=True)

    returns = weights @ mean_returns * TRADING_DAYS_PER_YEAR
    variances = np.einsum("ij,jk,ik->i", weights, cov_matrix, weights)
    volatility = np.sqrt(variances * TRADING_DAYS_PER_YEAR)
    sharpe = returns / volatility

    portfolios = [
        {
            "annual_return": float(returns[i]),
            "annual_volatility": float(volatility[i]),
            "sharpe_ratio": float(sharpe[i]),
            "weights": {ticker: float(weights[i, j]) for j, ticker in enumerate(tickers)},
        }
        for i in range(num_portfolios)
    ]

    return {
        "portfolios": portfolios,
        "max_sharpe": portfolios[int(np.argmax(sharpe))],
        "min_volatility": portfolios[int(np.argmin(volatility))],
    }
