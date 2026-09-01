from fastapi import FastAPI

from app.routers import stocks

app = FastAPI(title="TW Stocks API", version="0.1.0")

app.include_router(stocks.router)


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}
