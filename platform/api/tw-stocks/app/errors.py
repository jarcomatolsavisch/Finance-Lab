"""Errors reported via the standard {"error": {"code", "message"}} envelope.

See platform/api/docs/01_API_FORMAT.md for the response format and error code catalog.
"""


class AppError(Exception):
    code: str
    status_code: int

    def __init__(self, message: str):
        super().__init__(message)
        self.message = message


class NotFoundError(AppError):
    """ERR_001 - the request is valid but refers to something that doesn't exist / has no data."""

    code = "ERR_001"
    status_code = 404


class InvalidValueError(AppError):
    """ERR_002 - the request is well-typed but a value violates a business rule."""

    code = "ERR_002"
    status_code = 400


class UpstreamError(AppError):
    """ERR_004 - a dependency (e.g. FinMind) failed while fulfilling the request."""

    code = "ERR_004"
    status_code = 502
