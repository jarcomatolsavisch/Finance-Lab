from functools import lru_cache
from pathlib import Path

import pandas as pd

DATA_PATH = Path(__file__).resolve().parent.parent / "data" / "tw_stock_info.csv"


@lru_cache
def get_stock_info_df() -> pd.DataFrame:
    return pd.read_csv(DATA_PATH, dtype=str)


def search_stock_info(query: str, limit: int = 20) -> list[dict]:
    df = get_stock_info_df()
    q = query.lower()
    mask = df["stock_id"].str.lower().str.contains(q, regex=False) | df[
        "stock_name"
    ].str.lower().str.contains(q, regex=False)
    return df[mask].sort_values("stock_id").head(limit).to_dict("records")
