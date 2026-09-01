from datetime import date
from functools import lru_cache

import pandas as pd
from FinMind.data import DataLoader

from app.config import get_settings


@lru_cache
def get_loader() -> DataLoader:
    loader = DataLoader()
    ok = loader.login_by_token(api_token=get_settings().finmind_apikey)
    if not ok:
        raise RuntimeError("FinMind login failed - check FINMIND_APIKEY")
    return loader


def fetch_stock_prices(stock_ids: list[str], start: date, end: date) -> pd.DataFrame:
    loader = get_loader()
    frames = [
        loader.taiwan_stock_daily(
            stock_id=stock_id,
            start_date=start.isoformat(),
            end_date=end.isoformat(),
        )
        for stock_id in stock_ids
    ]
    return pd.concat(frames, ignore_index=True) if frames else pd.DataFrame()
