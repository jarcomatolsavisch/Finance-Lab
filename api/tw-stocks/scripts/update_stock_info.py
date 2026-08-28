"""Regenerate data/tw_stock_info.csv from FinMind's TaiwanStockInfo dataset.

Run from the project root (api/tw-stocks):
    .venv\\Scripts\\python.exe -m scripts.update_stock_info
"""

from pathlib import Path

from app.finmind_client import get_loader

OUT_PATH = Path(__file__).resolve().parent.parent / "data" / "tw_stock_info.csv"


def main() -> None:
    df = get_loader().taiwan_stock_info()
    df = df.sort_values("date").drop_duplicates(subset="stock_id", keep="last")
    df = df[["stock_id", "stock_name", "industry_category", "type"]].sort_values("stock_id")
    OUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    df.to_csv(OUT_PATH, index=False)
    print(f"Wrote {len(df)} rows to {OUT_PATH}")


if __name__ == "__main__":
    main()
