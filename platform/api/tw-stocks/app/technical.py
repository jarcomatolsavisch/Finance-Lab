from datetime import date

import pandas as pd

from app.errors import NotFoundError
from app.finmind_client import fetch_stock_prices

ROUND_DECIMALS = 4

# FinMind's raw columns keep their original casing; upper-case them all so the
# response table matches lab/plot_technical_indicators2.py's column naming.
_BASE_COLUMN_RENAME = {
    "Trading_Volume": "TRADING_VOLUME",
    "Trading_money": "TRADING_MONEY",
    "Trading_turnover": "TRADING_TURNOVER",
}


def _fetch_base_dataframe(stock_id: str, start: date, end: date) -> pd.DataFrame:
    df = fetch_stock_prices([stock_id], start, end)
    if df.empty:
        raise NotFoundError(f"No price data found for stock {stock_id} in the given date range")

    df = df.sort_values("date").reset_index(drop=True)
    df.columns = [_BASE_COLUMN_RENAME.get(c, c).upper() for c in df.columns]
    return df


def _std_suffix(std: float) -> str:
    return f"{std:.1f}".replace(".", "p")


def _add_ma(df: pd.DataFrame, params) -> None:
    for m in params.M:
        df[f"MA_{m}"] = df["CLOSE"].rolling(m).mean().round(ROUND_DECIMALS)


def _add_macd(df: pd.DataFrame, params) -> None:
    ema_fast = df["CLOSE"].ewm(span=params.M, adjust=False).mean()
    ema_slow = df["CLOSE"].ewm(span=params.N, adjust=False).mean()
    macd_dif = ema_fast - ema_slow
    macd_signal = macd_dif.ewm(span=params.K, adjust=False).mean()

    df["MACD_DIF"] = macd_dif.round(ROUND_DECIMALS)
    df["MACD_SIGNAL"] = macd_signal.round(ROUND_DECIMALS)
    df["MACD_HISTOGRAM"] = (macd_dif - macd_signal).round(ROUND_DECIMALS)


def _add_boll(df: pd.DataFrame, params) -> None:
    mid = df["CLOSE"].rolling(params.M).mean()
    std_roll = df["CLOSE"].rolling(params.M).std()
    df["BOLL_MID"] = mid.round(ROUND_DECIMALS)

    for std in params.std:
        suffix = _std_suffix(std)
        df[f"BOLL_UPPER_{suffix}"] = (mid + std * std_roll).round(ROUND_DECIMALS)
        df[f"BOLL_LOWER_{suffix}"] = (mid - std * std_roll).round(ROUND_DECIMALS)


def _add_vol(df: pd.DataFrame, params) -> None:
    for m in params.M:
        df[f"VOL_{m}"] = df["TRADING_VOLUME"].rolling(m).mean().round(ROUND_DECIMALS)


def _add_rsi(df: pd.DataFrame, params) -> None:
    delta = df["CLOSE"].diff()
    gain = delta.clip(lower=0)
    loss = -delta.clip(upper=0)

    for m in params.M:
        avg_gain = gain.ewm(alpha=1 / m, adjust=False).mean()
        avg_loss = loss.ewm(alpha=1 / m, adjust=False).mean()
        rs = avg_gain / avg_loss
        df[f"RSI_{m}"] = (100 - (100 / (1 + rs))).round(ROUND_DECIMALS)


_INDICATOR_BUILDERS = {"MA": _add_ma, "MACD": _add_macd, "BOLL": _add_boll, "VOL": _add_vol, "RSI": _add_rsi}


def build_technical_table(stock_id: str, start: date, end: date, indicators: list) -> pd.DataFrame:
    df = _fetch_base_dataframe(stock_id, start, end)

    for indicator in indicators:
        _INDICATOR_BUILDERS[indicator.type](df, indicator.params)

    return df


def dataframe_to_table(df: pd.DataFrame) -> tuple[list[str], list[dict]]:
    columns = df.columns.tolist()
    data = df.where(pd.notnull(df), None).to_dict(orient="records")
    return columns, data
