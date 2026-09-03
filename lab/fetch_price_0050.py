"""Fetch Taiwan stock 0050 daily prices (2026-01-01 to today) from FinMind and save to CSV."""

import datetime
import os

import pandas as pd
from dotenv import load_dotenv
from FinMind.data import DataLoader

STOCK_ID = "2357"
START_DATE = "2024-01-01"
END_DATE = datetime.date.today().isoformat()


def get_api_key() -> str:
    load_dotenv()
    api_key = os.getenv("FINMIND_APIKEY")
    if not api_key:
        raise RuntimeError("FINMIND_APIKEY not found in lab/.env")
    return api_key


def fetch_prices() -> pd.DataFrame:
    loader = DataLoader()
    ok = loader.login_by_token(api_token=get_api_key())
    if not ok:
        raise RuntimeError("FinMind login failed - check FINMIND_APIKEY in lab/.env")
    return loader.taiwan_stock_daily(stock_id=STOCK_ID, start_date=START_DATE, end_date=END_DATE)


def main() -> None:
    df = fetch_prices()
    out_path = os.path.join(os.path.dirname(__file__), "data", f"price_{STOCK_ID}.csv")
    df.to_csv(out_path, index=False)
    print(f"Saved {len(df)} rows to {out_path}")


if __name__ == "__main__":
    main()
