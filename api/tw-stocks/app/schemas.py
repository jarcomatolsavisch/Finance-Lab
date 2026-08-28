from datetime import date

from pydantic import BaseModel


class StockPrice(BaseModel):
    stock_id: str
    date: date
    open: float
    max: float
    min: float
    close: float
    trading_volume: int


class StockPricesResponse(BaseModel):
    start: date
    end: date
    ids: list[str]
    data: list[StockPrice]


class StockInfo(BaseModel):
    stock_id: str
    stock_name: str
    industry_category: str
    type: str


class PortfolioPoint(BaseModel):
    annual_return: float
    annual_volatility: float
    sharpe_ratio: float
    weights: dict[str, float]


class EfficientFrontierResponse(BaseModel):
    start: date
    end: date
    ids: list[str]
    portfolios: list[PortfolioPoint]
    max_sharpe: PortfolioPoint
    min_volatility: PortfolioPoint
