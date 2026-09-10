import logging
from datetime import date
from functools import lru_cache

import pandas as pd
from FinMind.data import DataLoader

from app.config import get_settings
from app.errors import UpstreamError

logger = logging.getLogger(__name__)

REQUIRED_COLUMNS = ["stock_id", "date", "open", "max", "min", "close", "Trading_Volume"]


@lru_cache
def get_loader() -> DataLoader:
    loader = DataLoader()
    try:
        ok = loader.login_by_token(api_token=get_settings().finmind_apikey)
    except Exception as exc:
        logger.exception("FinMind login request failed")
        raise UpstreamError(f"FinMind login request failed: {exc}") from exc
    if not ok:
        raise UpstreamError("FinMind login rejected - check FINMIND_APIKEY")
    return loader


def fetch_stock_prices(stock_ids: list[str], start: date, end: date) -> pd.DataFrame:
    loader = get_loader()
    frames = []
    for stock_id in stock_ids:
        try:
            frame = loader.taiwan_stock_daily(
                stock_id=stock_id,
                start_date=start.isoformat(),
                end_date=end.isoformat(),
            )
        except Exception as exc:
            logger.exception(
                "FinMind taiwan_stock_daily failed for stock_id=%s start=%s end=%s",
                stock_id,
                start,
                end,
            )
            raise UpstreamError(
                f"FinMind request failed for stock_id={stock_id}: {exc}"
            ) from exc

        missing_columns = [col for col in REQUIRED_COLUMNS if col not in frame.columns]
        if not frame.empty and missing_columns:
            logger.error(
                "FinMind returned unexpected columns for stock_id=%s: got=%s missing=%s",
                stock_id,
                list(frame.columns),
                missing_columns,
            )
            raise UpstreamError(
                f"FinMind returned an unexpected response shape for stock_id={stock_id} "
                f"(missing columns: {missing_columns})"
            )

        frames.append(frame)

    return pd.concat(frames, ignore_index=True) if frames else pd.DataFrame()
