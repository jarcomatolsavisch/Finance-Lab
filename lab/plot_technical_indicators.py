"""Plot technical indicators for stock 0050 from lab/data/price_0050.csv.

Chart 1: Price (line) + Candlestick (open/high/low/close) + MA30 / MA90
Chart 2: Trading Volume (histogram)
Chart 3: MACD + Signal line, and MACD histogram
Chart 4: Price (line) + Bollinger Bands (1.5 std)
"""

import os

import matplotlib.pyplot as plt
import pandas as pd

STOCK_ID = "2357"
MA_SHORT = 30
MA_LONG = 90
MACD_FAST = 12
MACD_SLOW = 26
MACD_SIGNAL = 9
BOLLINGER_PERIOD = 20
BOLLINGER_STD = 1.5
BOLLINGER_STD_WIDE = 2

UP_COLOR = "#ef5350"  # close >= open
DOWN_COLOR = "#26a69a"  # close < open


def load_prices() -> pd.DataFrame:
    csv_path = os.path.join(os.path.dirname(__file__), "data", f"price_{STOCK_ID}.csv")
    df = pd.read_csv(csv_path)
    df["date"] = pd.to_datetime(df["date"])
    return df.sort_values("date").reset_index(drop=True)


def add_indicators(df: pd.DataFrame) -> pd.DataFrame:
    df["ma_short"] = df["close"].rolling(MA_SHORT).mean()
    df["ma_long"] = df["close"].rolling(MA_LONG).mean()

    ema_fast = df["close"].ewm(span=MACD_FAST, adjust=False).mean()
    ema_slow = df["close"].ewm(span=MACD_SLOW, adjust=False).mean()
    df["macd"] = ema_fast - ema_slow
    df["signal"] = df["macd"].ewm(span=MACD_SIGNAL, adjust=False).mean()
    df["histogram"] = df["macd"] - df["signal"]

    bb_mid = df["close"].rolling(BOLLINGER_PERIOD).mean()
    bb_std = df["close"].rolling(BOLLINGER_PERIOD).std()
    df["bb_mid"] = bb_mid
    df["bb_upper"] = bb_mid + BOLLINGER_STD * bb_std
    df["bb_lower"] = bb_mid - BOLLINGER_STD * bb_std
    df["bb_upper_wide"] = bb_mid + BOLLINGER_STD_WIDE * bb_std
    df["bb_lower_wide"] = bb_mid - BOLLINGER_STD_WIDE * bb_std
    return df


def plot_price_panel(ax, df: pd.DataFrame) -> None:
    up = df["close"] >= df["open"]
    colors = up.map({True: UP_COLOR, False: DOWN_COLOR})

    ax.vlines(df["date"], df["min"], df["max"], color=colors, linewidth=1)
    ax.bar(
        df["date"],
        (df["close"] - df["open"]).abs().clip(lower=0.01),
        bottom=df[["open", "close"]].min(axis=1),
        width=pd.Timedelta(hours=16),
        color=colors,
    )

    ax.plot(df["date"], df["close"], color="#1f77b4", linewidth=0.8, alpha=0.6, label="Close (line)")
    ax.plot(df["date"], df["ma_short"], color="#ff9800", linewidth=1.2, label=f"MA{MA_SHORT}")
    ax.plot(df["date"], df["ma_long"], color="#9c27b0", linewidth=1.2, label=f"MA{MA_LONG}")

    ax.set_ylabel("Price (TWD)")
    ax.set_title(f"{STOCK_ID} Price / Candlestick / MA{MA_SHORT} / MA{MA_LONG}")
    ax.legend(loc="upper left")
    ax.grid(True, alpha=0.3)


def plot_volume_panel(ax, df: pd.DataFrame) -> None:
    up = df["close"] >= df["open"]
    colors = up.map({True: UP_COLOR, False: DOWN_COLOR})

    ax.bar(df["date"], df["Trading_Volume"], width=pd.Timedelta(hours=16), color=colors)
    ax.set_ylabel("Volume")
    ax.set_title("Trading Volume")
    ax.grid(True, alpha=0.3)


def plot_macd_panel(ax, df: pd.DataFrame) -> None:
    hist_colors = (df["histogram"] >= 0).map({True: UP_COLOR, False: DOWN_COLOR})

    ax.bar(df["date"], df["histogram"], width=pd.Timedelta(hours=16), color=hist_colors, alpha=0.6, label="Histogram")
    ax.plot(df["date"], df["macd"], color="#1f77b4", linewidth=1.2, label="MACD")
    ax.plot(df["date"], df["signal"], color="#ff9800", linewidth=1.2, label="Signal")

    ax.axhline(0, color="black", linewidth=0.5)
    ax.set_ylabel("MACD")
    ax.set_xlabel("Date")
    ax.set_title(f"MACD ({MACD_FAST}/{MACD_SLOW}/{MACD_SIGNAL}) & Signal Line / Histogram")
    ax.legend(loc="upper left")
    ax.grid(True, alpha=0.3)


def plot_bollinger_panel(ax, df: pd.DataFrame) -> None:
    ax.fill_between(
        df["date"],
        df["bb_lower_wide"],
        df["bb_upper_wide"],
        color="green",
        alpha=0.08,
        label=f"Bollinger ({BOLLINGER_STD_WIDE}σ)",
    )
    ax.plot(df["date"], df["bb_upper_wide"], color="green", linewidth=0.6, alpha=0.3)
    ax.plot(df["date"], df["bb_lower_wide"], color="green", linewidth=0.6, alpha=0.3)

    ax.fill_between(
        df["date"], df["bb_lower"], df["bb_upper"], color="green", alpha=0.2, label=f"Bollinger ({BOLLINGER_STD}σ)"
    )
    ax.plot(df["date"], df["bb_upper"], color="green", linewidth=0.8, alpha=0.6)
    ax.plot(df["date"], df["bb_lower"], color="green", linewidth=0.8, alpha=0.6)

    ax.plot(df["date"], df["close"], color="#1f77b4", linewidth=1, label="Close (line)")

    ax.set_ylabel("Price (TWD)")
    ax.set_xlabel("Date")
    ax.set_title(
        f"Price / Bollinger Bands (period={BOLLINGER_PERIOD}, {BOLLINGER_STD}σ / {BOLLINGER_STD_WIDE}σ)"
    )
    ax.legend(loc="upper left")
    ax.grid(True, alpha=0.3)


def main() -> None:
    df = add_indicators(load_prices())

    fig, (ax1, ax2, ax3, ax4) = plt.subplots(
        4, 1, figsize=(14, 15), sharex=True, gridspec_kw={"height_ratios": [3, 1, 1.5, 2]}
    )

    plot_price_panel(ax1, df)
    plot_volume_panel(ax2, df)
    plot_macd_panel(ax3, df)
    plot_bollinger_panel(ax4, df)

    fig.tight_layout()
    out_path = os.path.join(os.path.dirname(__file__), f"technical_indicators_{STOCK_ID}.png")
    fig.savefig(out_path, dpi=150)
    print(f"Saved chart to {out_path}")
    plt.show()


if __name__ == "__main__":
    main()
