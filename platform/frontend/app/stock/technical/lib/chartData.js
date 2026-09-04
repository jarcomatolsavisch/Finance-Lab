// Builds the indicator request list for POST /api/v1/tw/stock/technical/indicators from a
// charts config. The endpoint's response already returns `data` as row-objects (columns
// as-is, e.g. DATE/OPEN/CLOSE/MA_20/...), sorted by DATE ascending, so chart components use
// `response.data` directly — no transform needed on the frontend.

const normalizeList = arr => [...new Set(arr || [])].sort((a, b) => a - b);

// One request per currently-enabled chart type that needs indicator computation, using its
// current params.
export const buildIndicatorRequests = charts => {
  const requests = [];

  if (charts.priceMA.enabled) {
    const M = normalizeList(charts.priceMA.M);
    if (M.length > 0) requests.push({ type: 'MA', params: { M } });
  }

  if (charts.volume.enabled) {
    const M = normalizeList(charts.volume.M);
    if (M.length > 0) requests.push({ type: 'VOL', params: { M } });
  }

  if (charts.macd.enabled) {
    const { M, N, K } = charts.macd;
    requests.push({ type: 'MACD', params: { M, N, K } });
  }

  if (charts.boll.enabled) {
    const { M } = charts.boll;
    const std = normalizeList(charts.boll.std);
    requests.push({ type: 'BOLL', params: { M, std } });
  }

  if (charts.rsi.enabled) {
    const M = normalizeList(charts.rsi.M);
    if (M.length > 0) requests.push({ type: 'RSI', params: { M } });
  }

  return requests;
};

// Matches backend's `_std_suffix`: 1.5 -> "1p5", 2 -> "2p0".
export const bollStdSuffix = std => std.toFixed(1).replace('.', 'p');
