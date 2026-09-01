import datetime
import os

import matplotlib.pyplot as plt
import numpy as np
import pandas as pd
from dotenv import load_dotenv
from FinMind.data import DataLoader
from scipy.stats import linregress

# 1. Configuration
TICKER = "3581"         # Target Stock 
MARKET_TICKER = "0050"  # Yuanta/P-shares Taiwan Top 50 ETF Benchmark
RISK_FREE_RATE = 0.0191  # Annualized Risk Free Rate (Taiwan ~1.5%)
DAILY_RF = RISK_FREE_RATE / 252  # De-annualize for daily metrics
PERIOD_YEAR = 1  # How many years of historical daily data to fetch
END_DATE = datetime.date.today().isoformat()
START_DATE = (datetime.date.today() - datetime.timedelta(days=365 * PERIOD_YEAR)).isoformat()


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


def fetch_close_prices(loader: DataLoader, stock_id: str, start: str, end: str) -> pd.Series:
    df = loader.taiwan_stock_daily(stock_id=stock_id, start_date=start, end_date=end)
    df["date"] = pd.to_datetime(df["date"])
    return df.set_index("date")["close"].rename(stock_id)


def main() -> None:
    loader = DataLoader()
    check_login(loader)

    # 2. Fetch Historical Daily Data
    print("Fetching market data from FinMind...")
    stock_close = fetch_close_prices(loader, TICKER, START_DATE, END_DATE)
    market_close = fetch_close_prices(loader, MARKET_TICKER, START_DATE, END_DATE)
    data = pd.concat([stock_close, market_close], axis=1).dropna()

    # 3. Calculate Daily Returns
    returns = data.pct_change().dropna()

    # 4. Calculate Stock Beta via Linear Regression (Covariance/Variance)
    # Beta is the slope of the asset excess returns vs market excess returns
    stock_excess = returns[TICKER] - DAILY_RF
    market_excess = returns[MARKET_TICKER] - DAILY_RF

    slope, intercept, r_value, p_value, std_err = linregress(market_excess, stock_excess)
    beta = slope
    alpha = intercept * 252  # Annualized Jensen's Alpha

    # 5. Estimate Historical Annual Market & Stock Return
    annual_market_return = (1 + returns[MARKET_TICKER].mean()) ** 252 - 1
    annual_stock_return = (1 + returns[TICKER].mean()) ** 252 - 1

    # 6. Apply CAPM
    expected_return = RISK_FREE_RATE + beta * (annual_market_return - RISK_FREE_RATE)

    # Output Results
    print("\n--- CAPM Analysis Results ---")
    print(f"Calculated Beta (𝛽) for {TICKER}: {beta:.2f}")
    print(f"Annualized Market Return: {annual_market_return:.2%}")
    print(f"Annualized Actual Return for {TICKER}: {annual_stock_return:.2%}")
    print(f"CAPM Required/Expected Return: {expected_return:.2%}")
    print(f"Jensen's Alpha (𝛂): {alpha:.2%}")
    print(f"Interpretation: {'Undervalued (Buy)' if alpha > 0 else 'Overvalued (Sell/Avoid)'}")

    # 7. Plot the Security Market Line (SML)
    beta_range = np.linspace(0, max(2.0, beta * 1.3), 100)
    sml_returns = RISK_FREE_RATE + beta_range * (annual_market_return - RISK_FREE_RATE)

    plt.figure(figsize=(9, 6))
    plt.plot(beta_range, sml_returns, color="steelblue", label="Security Market Line (SML)")
    plt.scatter(0, RISK_FREE_RATE, color="gray", zorder=5, label="Risk-Free Rate")
    plt.scatter(1, annual_market_return, color="black", zorder=5, label=f"Market ({MARKET_TICKER})")
    plt.scatter(beta, expected_return, color="orange", zorder=5, label=f"{TICKER} (CAPM Expected)")
    plt.scatter(beta, annual_stock_return, color="red", marker="D", zorder=5, label=f"{TICKER} (Actual)")
    plt.annotate(
        TICKER,
        (beta, annual_stock_return),
        textcoords="offset points",
        xytext=(8, -4),
    )

    plt.title(f"Security Market Line - {TICKER} vs {MARKET_TICKER}")
    plt.xlabel("Beta (𝛽)")
    plt.ylabel("Annualized Expected Return")
    plt.axhline(0, color="lightgray", linewidth=0.8)
    plt.legend()
    plt.grid(alpha=0.3)
    plt.tight_layout()

    out_path = os.path.join(os.path.dirname(__file__), "sml_plot.png")
    plt.savefig(out_path, dpi=150)
    print(f"\nSaved chart to {out_path}")
    plt.show()


if __name__ == "__main__":
    main()
