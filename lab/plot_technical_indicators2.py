"""Plot technical indicators driven by lab/sample-body-tech.json.

Unlike plot_technical_indicators.py (hardcoded stock/params), this script builds its
DataFrame purely from the JSON request-body config: stock_id/start/end select the price
data, and `indicators` decides which columns get computed and their dynamic names:

- MA:   params.M is a list of up to 3 periods -> columns MA_<period> (e.g. MA_30, MA_90)
- MACD: params.{M,N,K} are scalars (fast/slow/signal), not embedded in column names ->
        columns MACD_DIF, MACD_SIGNAL, MACD_HISTOGRAM
- BOLL: params.M is the scalar rolling period, params.std is a list of up to 3 multipliers ->
        columns BOLL_MID, BOLL_UPPER_<std>, BOLL_LOWER_<std> (e.g. BOLL_UPPER_1p5, BOLL_UPPER_2p0)
- VOL:  params.M is a list of up to 3 periods -> moving averages of volume, columns VOL_<period>
        (e.g. VOL_5, VOL_10)
- RSI:  params.M is a list of up to 3 periods -> columns RSI_<period> (e.g. RSI_12, RSI_24)

Base OHLCV columns keep the same names as lab/data/price_<stock_id>.csv, upper-cased. The
TRADING_VOLUME column is renamed to VOL.

Renders one panel per indicator type present in the config, plus Price and Volume.
"""

import json
import os

import matplotlib.pyplot as plt
import pandas as pd

CONFIG_PATH = os.path.join(os.path.dirname(__file__), "sample-body-tech.json")

UP_COLOR = "#ef5350"  # close >= open
DOWN_COLOR = "#26a69a"  # close < open
MA_COLORS = ["#ff9800", "#9c27b0", "#3f51b5"]
VOL_MA_COLORS = ["#ff9800", "#3f51b5", "#9c27b0"]
RSI_COLORS = ["#1f77b4", "#ff9800", "#9c27b0"]


def load_config() -> dict:
    with open(CONFIG_PATH, encoding="utf-8") as f:
        return json.load(f)


def load_prices(stock_id: str, start: str, end: str) -> pd.DataFrame:
    csv_path = os.path.join(os.path.dirname(__file__), "data", f"price_{stock_id}.csv")
    df = pd.read_csv(csv_path)
    df.columns = [c.upper() for c in df.columns]
    df = df.rename(columns={"TRADING_VOLUME": "VOL"})
    df["DATE"] = pd.to_datetime(df["DATE"])
    df = df[(df["DATE"] >= start) & (df["DATE"] <= end)]
    return df.sort_values("DATE").reset_index(drop=True)


def std_suffix(std: float) -> str:
    return f"{std:.1f}".replace(".", "p")


ROUND_DECIMALS = 4


def add_ma(df: pd.DataFrame, params: dict) -> list:
    periods = params["M"][:3]
    for m in periods:
        df[f"MA_{m}"] = df["CLOSE"].rolling(m).mean().round(ROUND_DECIMALS)
    return periods


def add_macd(df: pd.DataFrame, params: dict) -> None:
    fast, slow, signal = params["M"], params["N"], params["K"]
    ema_fast = df["CLOSE"].ewm(span=fast, adjust=False).mean()
    ema_slow = df["CLOSE"].ewm(span=slow, adjust=False).mean()
    macd_dif = ema_fast - ema_slow
    macd_signal = macd_dif.ewm(span=signal, adjust=False).mean()

    df["MACD_DIF"] = macd_dif.round(ROUND_DECIMALS)
    df["MACD_SIGNAL"] = macd_signal.round(ROUND_DECIMALS)
    df["MACD_HISTOGRAM"] = (macd_dif - macd_signal).round(ROUND_DECIMALS)


def add_boll(df: pd.DataFrame, params: dict) -> list:
    period = params["M"]
    stds = params["std"][:3]
    mid = df["CLOSE"].rolling(period).mean()
    std_roll = df["CLOSE"].rolling(period).std()
    df["BOLL_MID"] = mid.round(ROUND_DECIMALS)

    suffixes = []
    for std in stds:
        suffix = std_suffix(std)
        df[f"BOLL_UPPER_{suffix}"] = (mid + std * std_roll).round(ROUND_DECIMALS)
        df[f"BOLL_LOWER_{suffix}"] = (mid - std * std_roll).round(ROUND_DECIMALS)
        suffixes.append((std, suffix))
    return suffixes


def add_vol(df: pd.DataFrame, params: dict) -> list:
    periods = params["M"][:3]
    for m in periods:
        df[f"VOL_{m}"] = df["VOL"].rolling(m).mean().round(ROUND_DECIMALS)
    return periods


def add_rsi(df: pd.DataFrame, params: dict) -> list:
    periods = params["M"][:3]
    delta = df["CLOSE"].diff()
    gain = delta.clip(lower=0)
    loss = -delta.clip(upper=0)
    for m in periods:
        avg_gain = gain.ewm(alpha=1 / m, adjust=False).mean()
        avg_loss = loss.ewm(alpha=1 / m, adjust=False).mean()
        rs = avg_gain / avg_loss
        df[f"RSI_{m}"] = (100 - (100 / (1 + rs))).round(ROUND_DECIMALS)
    return periods


def build_dataframe(config: dict):
    df = load_prices(config["stock_id"], config["start"], config["end"])

    ma_periods = []
    boll_bands = []
    vol_periods = []
    rsi_periods = []
    has_macd = False

    for indicator in config["indicators"]:
        itype, params = indicator["type"], indicator["params"]
        if itype == "MA":
            ma_periods = add_ma(df, params)
        elif itype == "MACD":
            add_macd(df, params)
            has_macd = True
        elif itype == "BOLL":
            boll_bands = add_boll(df, params)
        elif itype == "VOL":
            vol_periods = add_vol(df, params)
        elif itype == "RSI":
            rsi_periods = add_rsi(df, params)
        else:
            raise ValueError(f"Unsupported indicator type: {itype}")

    return df, ma_periods, has_macd, boll_bands, vol_periods, rsi_periods


def plot_price_panel(ax, df: pd.DataFrame, ma_periods: list, stock_id: str) -> None:
    up = df["CLOSE"] >= df["OPEN"]
    colors = up.map({True: UP_COLOR, False: DOWN_COLOR})

    ax.vlines(df["DATE"], df["MIN"], df["MAX"], color=colors, linewidth=1)
    ax.bar(
        df["DATE"],
        (df["CLOSE"] - df["OPEN"]).abs().clip(lower=0.01),
        bottom=df[["OPEN", "CLOSE"]].min(axis=1),
        width=pd.Timedelta(hours=16),
        color=colors,
    )
    ax.plot(df["DATE"], df["CLOSE"], color="#1f77b4", linewidth=0.8, alpha=0.6, label="Close (line)")

    for i, m in enumerate(ma_periods):
        ax.plot(df["DATE"], df[f"MA_{m}"], color=MA_COLORS[i % len(MA_COLORS)], linewidth=1.2, label=f"MA{m}")

    ax.set_ylabel("Price (TWD)")
    ma_title = "/".join(f"MA{m}" for m in ma_periods)
    ax.set_title(f"{stock_id} Price / Candlestick" + (f" / {ma_title}" if ma_title else ""))
    ax.legend(loc="upper left")
    ax.grid(True, alpha=0.3)


def plot_volume_panel(ax, df: pd.DataFrame, vol_periods: list) -> None:
    up = df["CLOSE"] >= df["OPEN"]
    colors = up.map({True: UP_COLOR, False: DOWN_COLOR})

    ax.bar(df["DATE"], df["VOL"], width=pd.Timedelta(hours=16), color=colors, label="Volume")

    for i, m in enumerate(vol_periods):
        ax.plot(df["DATE"], df[f"VOL_{m}"], color=VOL_MA_COLORS[i % len(VOL_MA_COLORS)], linewidth=1.2, label=f"VOL MA{m}")

    ax.set_ylabel("Volume")
    vol_title = "/".join(f"MA{m}" for m in vol_periods)
    ax.set_title("Trading Volume" + (f" / {vol_title}" if vol_title else ""))
    if vol_periods:
        ax.legend(loc="upper left")
    ax.grid(True, alpha=0.3)


def plot_macd_panel(ax, df: pd.DataFrame) -> None:
    hist_colors = (df["MACD_HISTOGRAM"] >= 0).map({True: UP_COLOR, False: DOWN_COLOR})

    ax.bar(
        df["DATE"], df["MACD_HISTOGRAM"], width=pd.Timedelta(hours=16), color=hist_colors, alpha=0.6, label="Histogram"
    )
    ax.plot(df["DATE"], df["MACD_DIF"], color="#1f77b4", linewidth=1.2, label="MACD")
    ax.plot(df["DATE"], df["MACD_SIGNAL"], color="#ff9800", linewidth=1.2, label="Signal")

    ax.axhline(0, color="black", linewidth=0.5)
    ax.set_ylabel("MACD")
    ax.set_title("MACD & Signal Line / Histogram")
    ax.legend(loc="upper left")
    ax.grid(True, alpha=0.3)


def plot_bollinger_panel(ax, df: pd.DataFrame, boll_bands: list) -> None:
    # Widest std drawn first (furthest back), narrowest drawn last (most opaque, on top).
    ordered = sorted(boll_bands, key=lambda pair: pair[0], reverse=True)
    for i, (std, suffix) in enumerate(ordered):
        alpha = 0.08 + 0.12 * (i + 1)
        ax.fill_between(
            df["DATE"],
            df[f"BOLL_LOWER_{suffix}"],
            df[f"BOLL_UPPER_{suffix}"],
            color="green",
            alpha=alpha,
            label=f"Bollinger ({std}σ)",
        )
        ax.plot(df["DATE"], df[f"BOLL_UPPER_{suffix}"], color="green", linewidth=0.6, alpha=min(alpha + 0.3, 1))
        ax.plot(df["DATE"], df[f"BOLL_LOWER_{suffix}"], color="green", linewidth=0.6, alpha=min(alpha + 0.3, 1))

    ax.plot(df["DATE"], df["CLOSE"], color="#1f77b4", linewidth=1, label="Close (line)")

    ax.set_ylabel("Price (TWD)")
    ax.set_title("Price / Bollinger Bands")
    ax.legend(loc="upper left")
    ax.grid(True, alpha=0.3)


def plot_rsi_panel(ax, df: pd.DataFrame, rsi_periods: list) -> None:
    for i, m in enumerate(rsi_periods):
        ax.plot(df["DATE"], df[f"RSI_{m}"], color=RSI_COLORS[i % len(RSI_COLORS)], linewidth=1.2, label=f"RSI{m}")

    ax.axhline(70, color="black", linewidth=0.5, linestyle="--", alpha=0.5)
    ax.axhline(30, color="black", linewidth=0.5, linestyle="--", alpha=0.5)
    ax.set_ylim(0, 100)
    ax.set_ylabel("RSI")
    ax.set_title("/".join(f"RSI{m}" for m in rsi_periods))
    ax.legend(loc="upper left")
    ax.grid(True, alpha=0.3)


PANEL_HEIGHT_RATIOS = {"price": 3, "volume": 1, "macd": 1.5, "boll": 2, "rsi": 1.5}


def main() -> None:
    config = load_config()
    df, ma_periods, has_macd, boll_bands, vol_periods, rsi_periods = build_dataframe(config)

    data_path = os.path.join(os.path.dirname(__file__), "data", f"technical_{config['stock_id']}.csv")
    df.to_csv(data_path, index=False)
    print(f"Saved dataframe to {data_path}")

    panels = ["price", "volume"]
    if has_macd:
        panels.append("macd")
    if boll_bands:
        panels.append("boll")
    if rsi_periods:
        panels.append("rsi")

    fig, axes = plt.subplots(
        len(panels),
        1,
        figsize=(14, 3.5 * len(panels)),
        sharex=True,
        gridspec_kw={"height_ratios": [PANEL_HEIGHT_RATIOS[p] for p in panels]},
    )
    axes = axes if len(panels) > 1 else [axes]

    for ax, panel in zip(axes, panels):
        if panel == "price":
            plot_price_panel(ax, df, ma_periods, config["stock_id"])
        elif panel == "volume":
            plot_volume_panel(ax, df, vol_periods)
        elif panel == "macd":
            plot_macd_panel(ax, df)
        elif panel == "boll":
            plot_bollinger_panel(ax, df, boll_bands)
        elif panel == "rsi":
            plot_rsi_panel(ax, df, rsi_periods)

    axes[-1].set_xlabel("Date")
    fig.tight_layout()

    out_path = os.path.join(os.path.dirname(__file__), f"technical_indicators2_{config['stock_id']}.png")
    fig.savefig(out_path, dpi=150)
    print(f"Saved chart to {out_path}")
    plt.show()


if __name__ == "__main__":
    main()
