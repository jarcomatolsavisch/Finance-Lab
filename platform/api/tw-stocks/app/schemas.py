from datetime import date
from typing import Annotated, Any, Literal, Union

from pydantic import BaseModel, Field, field_validator, model_validator


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


class MAParams(BaseModel):
    M: list[int] = Field(..., min_length=1, max_length=3, description="MA periods, one line each")

    @field_validator("M")
    @classmethod
    def check_positive(cls, value: list[int]) -> list[int]:
        if any(m <= 0 for m in value):
            raise ValueError("M periods must all be > 0")
        return value


class MACDParams(BaseModel):
    M: int = Field(..., gt=0, description="Fast EMA period")
    N: int = Field(..., gt=0, description="Slow EMA period")
    K: int = Field(..., gt=0, description="Signal EMA period")

    @model_validator(mode="after")
    def check_fast_lt_slow(self) -> "MACDParams":
        if self.M >= self.N:
            raise ValueError("M (fast) must be less than N (slow)")
        return self


class BollParams(BaseModel):
    M: int = Field(..., gt=0, description="Rolling period for the middle band")
    std: list[float] = Field(..., min_length=1, max_length=3, description="Std-dev multipliers, one band each")

    @field_validator("std")
    @classmethod
    def check_positive(cls, value: list[float]) -> list[float]:
        if any(s <= 0 for s in value):
            raise ValueError("std multipliers must all be > 0")
        return value


class MAIndicatorRequest(BaseModel):
    type: Literal["MA"]
    params: MAParams


class MACDIndicatorRequest(BaseModel):
    type: Literal["MACD"]
    params: MACDParams


class BollIndicatorRequest(BaseModel):
    type: Literal["BOLL"]
    params: BollParams


IndicatorRequest = Annotated[
    Union[MAIndicatorRequest, MACDIndicatorRequest, BollIndicatorRequest],
    Field(discriminator="type"),
]


class TechnicalIndicatorsRequest(BaseModel):
    stock_id: str
    start: date
    end: date
    indicators: list[IndicatorRequest] = Field(default_factory=list)

    @field_validator("indicators")
    @classmethod
    def check_unique_types(cls, value: list) -> list:
        types = [indicator.type for indicator in value]
        if len(types) != len(set(types)):
            raise ValueError("each indicator type (MA/MACD/BOLL) may appear at most once")
        return value


class TechnicalIndicatorsResponse(BaseModel):
    stock_id: str
    start: date
    end: date
    columns: list[str]
    data: list[dict[str, Any]]
