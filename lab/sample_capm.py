import numpy as np
import pandas as pd
import yfinance as yf
from scipy.stats import linregress

# 1. Configuration
ticker = "AAPL"          # Target Stock
market_ticker = "^GSPC"  # S&P 500 Index Benchmark
risk_free_rate = 0.04    # Annualized Risk Free Rate (4%)
daily_rf = risk_free_rate / 252 # De-annualize for daily metrics

# 2. Fetch 3 Years of Historical Daily Data
print("Fetching market data...")
data = yf.download([ticker, market_ticker], start="2023-01-01", end="2026-01-01")["Adj Close"]

# 3. Calculate Daily Returns
returns = data.pct_change().dropna()

# 4. Calculate Stock Beta via Linear Regression (Covariance/Variance)
# Beta is the slope of the asset excess returns vs market excess returns
stock_excess = returns[ticker] - daily_rf
market_excess = returns[market_ticker] - daily_rf

slope, intercept, r_value, p_value, std_err = linregress(market_excess, stock_excess)
beta = slope
alpha = intercept * 252 # Annualized Jensen's Alpha

# 5. Estimate Historical Annual Market Return 
annual_market_return = (1 + returns[market_ticker].mean()) ** 252 - 1

# 6. Apply CAPM 
expected_return = risk_free_rate + beta * (annual_market_return - risk_free_rate)

# Output Results
print("\n--- CAPM Analysis Results ---")
print(f"Calculated Beta (𝛽) for {ticker}: {beta:.2f}")
print(f"Annualized Market Return: {annual_market_return:.2%}")
print(f"CAPM Required/Expected Return: {expected_return:.2%}")
print(f"Jensen's Alpha (𝛂): {alpha:.2%}") 
print(f"Interpretation: {'Undervalued (Buy)' if alpha > 0 else 'Overvalued (Sell/Avoid)'}")
