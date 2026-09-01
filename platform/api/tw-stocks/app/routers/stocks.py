from datetime import date

from fastapi import APIRouter, HTTPException, Query

from app.finmind_client import fetch_stock_prices
from app.portfolio import simulate_efficient_frontier
from app.schemas import (
    EfficientFrontierResponse,
    StockInfo,
    StockPrice,
    StockPricesResponse,
)
from app.stock_info import search_stock_info

router = APIRouter(prefix="/api/v1/tw", tags=["tw-stocks"])


@router.get("/stocks/search", response_model=list[StockInfo])
def search_stocks(
    q: str = Query("", description="Search text - matches stock id or Chinese name"),
    limit: int = Query(20, ge=1, le=50),
) -> list[StockInfo]:
    if not q.strip():
        return []
    return [StockInfo(**row) for row in search_stock_info(q.strip(), limit)]


@router.get("/history/stock/price", response_model=StockPricesResponse)
def get_stocks(
    id: str = Query(..., description="Comma-separated stock ids, e.g. 0050,2308"),
    start: date = Query(..., description="Start date, e.g. 2026-01-01"),
    end: date = Query(..., description="End date, e.g. 2026-03-01"),
) -> StockPricesResponse:
    stock_ids = [s.strip() for s in id.split(",") if s.strip()]
    if not stock_ids:
        raise HTTPException(status_code=400, detail="id must contain at least one stock id")
    if start > end:
        raise HTTPException(status_code=400, detail="start must be on or before end")

    df = fetch_stock_prices(stock_ids, start, end)

    records = [
        StockPrice(
            stock_id=row.stock_id,
            date=row.date,
            open=row.open,
            max=row.max,
            min=row.min,
            close=row.close,
            trading_volume=row.Trading_Volume,
        )
        for row in df.itertuples(index=False)
    ]

    return StockPricesResponse(start=start, end=end, ids=stock_ids, data=records)


@router.get("/portfolio/efficient-frontier", response_model=EfficientFrontierResponse)
def get_efficient_frontier(
    id: str = Query(..., description="Comma-separated stock ids, e.g. 0050,2308"),
    start: date = Query(..., description="Start date, e.g. 2026-01-01"),
    end: date = Query(..., description="End date, e.g. 2026-03-01"),
    num_portfolios: int = Query(3000, ge=100, le=20000),
) -> EfficientFrontierResponse:
    stock_ids = [s.strip() for s in id.split(",") if s.strip()]
    print(f"Fetching efficient frontier for stocks: {stock_ids}, from {start} to {end}, with {num_portfolios} portfolios.")
    if len(stock_ids) < 2:
        raise HTTPException(status_code=400, detail="id must contain at least 2 stock ids")
    if start > end:
        raise HTTPException(status_code=400, detail="start must be on or before end")

    try:
        result = simulate_efficient_frontier(stock_ids, start, end, num_portfolios)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc

    return EfficientFrontierResponse(start=start, end=end, ids=stock_ids, **result)
