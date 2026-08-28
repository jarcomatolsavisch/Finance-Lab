"""Plot Taiwan stock closing prices (2026-01-01 to today) using the FinMind API."""

import datetime
import os

import matplotlib.pyplot as plt
import pandas as pd
from dotenv import load_dotenv
from FinMind.data import DataLoader

STOCK_IDS = ["0050", "2308", "2317", "2330", "2357", "2382"]
START_DATE = "2026-01-01"
END_DATE = datetime.date.today().isoformat()


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


def fetch_prices(loader: DataLoader) -> pd.DataFrame:
    frames = []
    for stock_id in STOCK_IDS:
        df = loader.taiwan_stock_daily(
            stock_id=stock_id, start_date=START_DATE, end_date=END_DATE
        )
        frames.append(df)
    return pd.concat(frames, ignore_index=True)


def plot_prices(df: pd.DataFrame) -> None:
    df["date"] = pd.to_datetime(df["date"])

    plt.figure(figsize=(12, 6))
    for stock_id, group in df.groupby("stock_id"):
        group = group.sort_values("date")
        plt.plot(group["date"], group["close"], label=stock_id)

    plt.title(f"Taiwan Stock Closing Prices ({START_DATE} ~ {END_DATE})")
    plt.xlabel("Date")
    plt.ylabel("Close Price (TWD)")
    plt.legend(title="Stock ID")
    plt.grid(True, alpha=0.3)
    plt.tight_layout()

    out_path = os.path.join(os.path.dirname(__file__), "stock_prices_2026.png")
    plt.savefig(out_path, dpi=150)
    print(f"Saved chart to {out_path}")
    plt.show()


def main() -> None:
    loader = DataLoader()
    check_login(loader)
    df = fetch_prices(loader)
    plot_prices(df)


if __name__ == "__main__":
    main()
