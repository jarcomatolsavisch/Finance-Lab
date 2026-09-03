# API Response Format

This document defines the general response conventions shared by all `platform/api/*` services, with a focus on how errors are reported. It is not endpoint-specific; individual endpoints (e.g. `api/tw-stocks`) document their own request/response payloads elsewhere and should conform to the rules below.

## Success response

A successful response returns the resource body directly — there is no `{ "data": ... }` wrapper. The HTTP status code is `200 OK` (or `201 Created` where applicable). Shape and fields are defined per-endpoint.

## Error response

Every error response, regardless of endpoint, uses the same envelope:

```json
{
  "error": {
    "code": "ERR_002",
    "message": "start must be on or before end"
  }
}
```

| Field | Type | Description |
|---|---|---|
| `error.code` | string | One of the error codes below. Stable, machine-readable — clients should switch on this, not on `message`. |
| `error.message` | string | Human-readable description of what went wrong. May change wording over time; not meant to be parsed. |

The HTTP status code still carries the usual broad category (4xx client error, 5xx server error); `error.code` narrows that down to the specific reason, so a client can distinguish e.g. "this stock has no data" from "the date range is backwards" even though both might otherwise show up as a 4xx.

## Error code catalog

| Code | HTTP status | Meaning | Typical cause |
|---|---|---|---|
| `ERR_001` | 404 | Entity not found | The request is well-formed and passes validation, but refers to something that doesn't exist or has no data (e.g. a stock id with no price data in the given range). |
| `ERR_002` | 400 | Invalid request value | The request is well-typed (right fields, right JSON types), but a value violates a business rule — a constraint between fields or against domain logic (e.g. `start` after `end`, a MACD fast period ≥ its slow period). |
| `ERR_003` | 422 | Invalid request format | The request body itself doesn't match the expected schema — missing required field, wrong JSON type, an enum/discriminator value that isn't recognized, or malformed JSON. |

**How to tell `ERR_002` apart from `ERR_003`**: `ERR_003` is about *shape* — could this even be parsed into the expected type? `ERR_002` is about *meaning* — it parsed fine, but the values don't make sense together. A quick test: if the same violation exists regardless of what the field values are (e.g. the field is simply missing, or a string was sent where a number belongs), it's `ERR_003`. If it depends on the specific values chosen (e.g. these two numbers happen to be in the wrong order), it's `ERR_002`.

## Worked example: `POST /api/v1/tw/stock/technical/indicators`

See [`FunctionSpec.md`](../../docs/FunctionSpec.md) for the full request/response contract. The cases below walk through each error code against this endpoint.

### Success

```http
POST /api/v1/tw/stock/technical/indicators
```
```json
{
  "stock_id": "2357",
  "start": "2024-01-01",
  "end": "2026-09-02",
  "indicators": [{ "type": "MA", "params": { "M": [30, 90] } }]
}
```
→ `200 OK`, body is the `{stock_id, start, end, columns, data}` table described in FunctionSpec.md.

### `ERR_001` — entity not found

A `stock_id` that FinMind has no price data for in the given range (e.g. a delisted or mistyped id):

```json
{ "stock_id": "9999999", "start": "2024-01-01", "end": "2024-01-31", "indicators": [] }
```
→ `404 Not Found`
```json
{ "error": { "code": "ERR_001", "message": "No price data found for stock 9999999 in the given date range" } }
```

### `ERR_002` — invalid request value

The request is fully well-typed, but the values conflict — `start` after `end`:

```json
{ "stock_id": "2357", "start": "2026-09-02", "end": "2024-01-01", "indicators": [] }
```
→ `400 Bad Request`
```json
{ "error": { "code": "ERR_002", "message": "start must be on or before end" } }
```

Same code, different field — a MACD fast period that isn't shorter than its slow period:

```json
{ "indicators": [{ "type": "MACD", "params": { "M": 30, "N": 20, "K": 9 } }] }
```
→ `400 Bad Request`
```json
{ "error": { "code": "ERR_002", "message": "M (fast) must be less than N (slow)" } }
```

Or the same `type` listed twice:

```json
{ "indicators": [{ "type": "MA", "params": { "M": [10] } }, { "type": "MA", "params": { "M": [20] } }] }
```
→ `400 Bad Request`
```json
{ "error": { "code": "ERR_002", "message": "each indicator type (MA/MACD/BOLL) may appear at most once" } }
```

### `ERR_003` — invalid request format

A required field is missing (`stock_id`), or the wrong JSON type is used (`M` sent as a string instead of an array of numbers), or an indicator `type` outside `MA`/`MACD`/`BOLL` is used:

```json
{ "start": "2024-01-01", "end": "2024-01-31", "indicators": [{ "type": "MA", "params": { "M": "30" } }] }
```
→ `422 Unprocessable Entity`
```json
{
  "error": {
    "code": "ERR_003",
    "message": "stock_id: field required; indicators.0.params.M: input should be a valid list"
  }
}
```

## Current implementation status

`app/routers/stocks.py` does **not** yet emit this envelope. Today:

- Business-rule failures (`start > end`, "no price data found") are raised as `HTTPException(status_code=400, detail="<message>")`, which FastAPI serializes as `{"detail": "<message>"}` — no `code` field, and "not found" cases are returned as 400 rather than 404.
- Schema/type failures (missing fields, wrong types, the `fast < slow` / "one indicator per type" pydantic validators) fall through to FastAPI's default `RequestValidationError` handling: `422` with `{"detail": [{"type", "loc", "msg", "input", "ctx"}, ...]}` — again no `code` field, and value-rule violations (which this document classifies as `ERR_002`) currently come back with the same shape as true format errors (`ERR_003`).

Adopting this document as-is requires a global exception-handling layer (a FastAPI exception handler for `HTTPException` and `RequestValidationError`, plus a way to tag which pydantic validators represent `ERR_002` vs. `ERR_003`) that hasn't been implemented yet.
