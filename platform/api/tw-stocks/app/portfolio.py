from datetime import date

import numpy as np
import pandas as pd

from app.errors import InvalidValueError
from app.finmind_client import get_loader

TRADING_DAYS_PER_YEAR = 252

# Seeding: fraction of the initial random sample kept as low-volatility / high-Sharpe seeds.
LOW_VOL_SEED_FRACTION = 0.05
HIGH_SHARPE_SEED_FRACTION = 0.20
# Mutation noise (std dev) applied to bred child weights before re-normalizing.
BREED_NOISE_STD = 0.05


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


def _random_weights(rng: np.random.Generator, n_portfolios: int, n_assets: int) -> np.ndarray:
    weights = rng.random((n_portfolios, n_assets))
    weights /= weights.sum(axis=1, keepdims=True)
    return weights


def _portfolio_stats(
    weights: np.ndarray, mean_returns: np.ndarray, cov_matrix: np.ndarray
) -> tuple[np.ndarray, np.ndarray, np.ndarray]:
    returns = weights @ mean_returns * TRADING_DAYS_PER_YEAR
    variances = np.einsum("ij,jk,ik->i", weights, cov_matrix, weights)
    volatility = np.sqrt(variances * TRADING_DAYS_PER_YEAR)
    sharpe = returns / volatility
    return returns, volatility, sharpe


def _breed_weights(rng: np.random.Generator, seed_weights: np.ndarray, n_children: int) -> np.ndarray:
    n_seeds = seed_weights.shape[0]
    parent_a = seed_weights[rng.integers(0, n_seeds, n_children)]
    parent_b = seed_weights[rng.integers(0, n_seeds, n_children)]

    children = (parent_a + parent_b) / 2
    children += rng.normal(scale=BREED_NOISE_STD, size=children.shape)
    children = np.clip(children, 0, None)

    row_sums = np.clip(children.sum(axis=1, keepdims=True), 1e-12, None)
    return children / row_sums


def _select_seed_indices(volatility: np.ndarray, sharpe: np.ndarray, num_portfolios: int) -> np.ndarray:
    n_low_vol = max(1, round(LOW_VOL_SEED_FRACTION * num_portfolios))
    n_high_sharpe = max(1, round(HIGH_SHARPE_SEED_FRACTION * num_portfolios))

    low_vol_idx = np.argsort(volatility)[:n_low_vol]

    remaining_idx = np.setdiff1d(np.arange(num_portfolios), low_vol_idx, assume_unique=True)
    high_sharpe_idx = remaining_idx[np.argsort(sharpe[remaining_idx])[::-1][:n_high_sharpe]]

    return np.concatenate([low_vol_idx, high_sharpe_idx])


def simulate_efficient_frontier(
    stock_ids: list[str], start: date, end: date, num_portfolios: int
) -> dict:
    prices = fetch_close_prices(stock_ids, start, end)
    daily_returns = prices.pct_change().dropna()
    if daily_returns.empty:
        raise InvalidValueError("Not enough price data in the given date range to compute returns")

    tickers = daily_returns.columns.tolist()
    mean_returns = daily_returns.mean().values
    cov_matrix = daily_returns.cov().values
    rng = np.random.default_rng()

    # Stage 1: broad uniform-random sample of the weight space.
    weights = _random_weights(rng, num_portfolios, len(tickers))
    _, volatility, sharpe = _portfolio_stats(weights, mean_returns, cov_matrix)

    # Stage 2: keep the lowest-volatility and highest-Sharpe portfolios as seeds.
    seed_idx = _select_seed_indices(volatility, sharpe, num_portfolios)
    seed_weights = weights[seed_idx]

    # Stage 3: breed the remaining budget from seed pairs (average + noise) so
    # sampling density concentrates near the frontier instead of spreading uniformly.
    n_children = num_portfolios - seed_idx.size
    child_weights = _breed_weights(rng, seed_weights, n_children)

    final_weights = np.vstack([seed_weights, child_weights])
    final_returns, final_volatility, final_sharpe = _portfolio_stats(
        final_weights, mean_returns, cov_matrix
    )

    portfolios = [
        {
            "annual_return": float(final_returns[i]),
            "annual_volatility": float(final_volatility[i]),
            "sharpe_ratio": float(final_sharpe[i]),
            "weights": {ticker: float(final_weights[i, j]) for j, ticker in enumerate(tickers)},
        }
        for i in range(final_weights.shape[0])
    ]

    return {
        "portfolios": portfolios,
        "max_sharpe": portfolios[int(np.argmax(final_sharpe))],
        "min_volatility": portfolios[int(np.argmin(final_volatility))],
    }
