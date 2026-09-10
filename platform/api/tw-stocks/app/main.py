import logging

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse

from app.errors import AppError
from app.routers import stocks

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="TW Stocks API", version="0.1.0")

app.include_router(stocks.router)


def _error_response(status_code: int, code: str, message: str) -> JSONResponse:
    return JSONResponse(status_code=status_code, content={"error": {"code": code, "message": message}})


@app.exception_handler(AppError)
def handle_app_error(request: Request, exc: AppError) -> JSONResponse:
    logger.warning("AppError on %s %s: [%s] %s", request.method, request.url.path, exc.code, exc.message)
    return _error_response(exc.status_code, exc.code, exc.message)


@app.exception_handler(Exception)
def handle_unexpected_error(request: Request, exc: Exception) -> JSONResponse:
    # Anything that reaches here is a bug or an unhandled upstream failure - log the full
    # traceback (visible in Render logs) and surface the exception type/message in the
    # response too, since the client has no other way to see server-side logs.
    logger.exception("Unhandled error on %s %s", request.method, request.url.path)
    message = f"{type(exc).__name__}: {exc}"
    return _error_response(500, "ERR_500", message)


@app.exception_handler(RequestValidationError)
def handle_validation_error(request: Request, exc: RequestValidationError) -> JSONResponse:
    errors = exc.errors()
    # A plain `raise ValueError(...)` inside a pydantic validator is reported with
    # type "value_error" - that's a business-rule violation (ERR_002), not a
    # shape/type mismatch (ERR_003). Pydantic prefixes those messages with
    # "Value error, "; strip it so this matches the same wording the validator raised.
    is_value_error = bool(errors) and all(e["type"] == "value_error" for e in errors)
    messages = [e["msg"].removeprefix("Value error, ") for e in errors]
    message = "; ".join(messages) if messages else "Invalid request"

    if is_value_error:
        return _error_response(400, "ERR_002", message)
    return _error_response(422, "ERR_003", message)


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}
