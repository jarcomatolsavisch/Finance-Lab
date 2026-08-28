"""Monte Carlo simulation of random-weight portfolios to plot the efficient frontier.

Fetches daily close prices for STOCK_IDS via FinMind, simulates NUM_PORTFOLIOS random-weight
combinations, computes each portfolio's annualized return / volatility / Sharpe ratio, and
plots the resulting efficient frontier (see lab/build-portfolio-sample.py for the reference
methodology this follows).
"""

import datetime
import os

import matplotlib.pyplot as plt
import numpy as np
import pandas as pd
from dotenv import load_dotenv
from FinMind.data import DataLoader

STOCK_IDS = ["0050", "2308", "2317", "2330", "2357", "2382"]
START_DATE = "2026-01-01"
END_DATE = datetime.date.today().isoformat()

NUM_PORTFOLIOS = 10000
TRADING_DAYS_PER_YEAR = 252
RISK_FREE_RATE = 0.0


def get_api_key() -> str:
    load_dotenv()
    api_key = os.getenv("FINMIND_APIKEY")
    if not api_key:
        raise RuntimeError("FINMIND_APIKEY not found in lab/.env")
    return api_key


def check_login(loader: DataLoader) -> None:
    ok = loader.login_by_token(api_token=get_api_key())
    if not ok:
        raise RuntimeError("FinMind login failed - check FINMIND_APIKEY in lab/.env")
    print("FinMind API key is valid, login succeeded.")


def fetch_close_prices(loader: DataLoader, stock_ids: list[str], start: str, end: str) -> pd.DataFrame:
    frames = []
    for stock_id in stock_ids:
        df = loader.taiwan_stock_daily(stock_id=stock_id, start_date=start, end_date=end)
        frames.append(df[["date", "stock_id", "close"]])
    combined = pd.concat(frames, ignore_index=True)
    return combined.pivot(index="date", columns="stock_id", values="close").sort_index()


def simulate_portfolios(daily_returns: pd.DataFrame, num_portfolios: int) -> pd.DataFrame:
    tickers = daily_returns.columns.tolist()
    mean_returns = daily_returns.mean().values
    cov_matrix = daily_returns.cov().values

    results = np.zeros((3, num_portfolios))
    weight_records = np.zeros((num_portfolios, len(tickers)))

    for i in range(num_portfolios):
        weights = np.random.random(len(tickers))
        weights /= weights.sum()
        weight_records[i] = weights

        portfolio_return = np.sum(weights * mean_returns) * TRADING_DAYS_PER_YEAR
        portfolio_stddev = np.sqrt(weights @ cov_matrix @ weights) * np.sqrt(TRADING_DAYS_PER_YEAR)
        sharpe_ratio = (portfolio_return - RISK_FREE_RATE) / portfolio_stddev

        results[0, i] = portfolio_return
        results[1, i] = portfolio_stddev
        results[2, i] = sharpe_ratio

    results_df = pd.DataFrame(results.T, columns=["Return", "Volatility", "Sharpe Ratio"])
    for idx, ticker in enumerate(tickers):
        results_df[ticker] = weight_records[:, idx]
    return results_df


def report_portfolio(label: str, portfolio: pd.Series, tickers: list[str]) -> None:
    print(f"\n{label}:")
    print(
        f"  Return (annualized): {portfolio['Return']:.4f}  "
        f"Volatility (annualized): {portfolio['Volatility']:.4f}  "
        f"Sharpe Ratio: {portfolio['Sharpe Ratio']:.4f}"
    )
    for ticker in tickers:
        print(f"  {ticker}: {portfolio[ticker]:.4f}")


def plot_efficient_frontier(results_df: pd.DataFrame) -> None:
    max_sharpe = results_df.iloc[results_df["Sharpe Ratio"].idxmax()]
    min_vol = results_df.iloc[results_df["Volatility"].idxmin()]

    plt.figure(figsize=(10, 7))
    plt.scatter(
        results_df["Volatility"],
        results_df["Return"],
        c=results_df["Sharpe Ratio"],
        cmap="plasma",
        marker="o",
        s=10,
        alpha=0.3,
    )
    plt.colorbar(label="Sharpe Ratio")
    plt.scatter(
        max_sharpe["Volatility"], max_sharpe["Return"], marker="*", color="r", s=300, label="Max Sharpe Ratio"
    )
    plt.scatter(min_vol["Volatility"], min_vol["Return"], marker="*", color="b", s=300, label="Min Volatility")

    plt.title(f"Efficient Frontier ({START_DATE} ~ {END_DATE})")
    plt.xlabel("Volatility (Annualized)")
    plt.ylabel("Return (Annualized)")
    plt.xlim(left=0, right=results_df["Volatility"].max() * 1.1)
    plt.ylim(bottom=0, top=results_df["Return"].max() * 1.1)
    plt.legend()
    plt.tight_layout()

    out_path = os.path.join(os.path.dirname(__file__), "efficient_frontier.png")
    plt.savefig(out_path, dpi=150)
    print(f"\nSaved chart to {out_path}")

    plt.show()


def main() -> None:
    loader = DataLoader()
    check_login(loader)

    prices = fetch_close_prices(loader, STOCK_IDS, START_DATE, END_DATE)
    daily_returns = prices.pct_change().dropna()
    tickers = daily_returns.columns.tolist()

    results_df = simulate_portfolios(daily_returns, NUM_PORTFOLIOS)

    max_sharpe = results_df.iloc[results_df["Sharpe Ratio"].idxmax()]
    min_vol = results_df.iloc[results_df["Volatility"].idxmin()]
    report_portfolio("Max Sharpe Ratio portfolio", max_sharpe, tickers)
    report_portfolio("Min Volatility portfolio", min_vol, tickers)

    plot_efficient_frontier(results_df)


if __name__ == "__main__":
    main()
