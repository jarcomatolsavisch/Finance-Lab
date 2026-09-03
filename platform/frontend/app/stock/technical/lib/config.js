// Config model for the technical-analysis Drawer: the four fixed chart types
// (Price/MA, Volume, MACD, Bollinger Bands), their default params, and the
// comma-separated-number-list parsing shared by Price/MA's M and Bollinger's std.
// See platform/docs/TechAnalysisSpec.md sections 6-9, 13.

export const CHART_TYPES = [
  { key: 'priceMA', label: 'Price/MA' },
  { key: 'volume', label: 'Volume' },
  { key: 'macd', label: 'MACD' },
  { key: 'boll', label: 'Bollinger Bands' },
];

export const PRICE_MA_M_CONSTRAINTS = { min: 2, max: 90, minCount: 0, maxCount: 3, integer: true, maxDecimals: 0 };
export const BOLL_STD_CONSTRAINTS = { min: 0.5, max: 3.0, minCount: 1, maxCount: 3, integer: false, maxDecimals: 1 };
export const MACD_MN_CONSTRAINTS = { min: 2, max: 90 };
export const MACD_K_CONSTRAINTS = { min: 2, max: 50 };
export const BOLL_M_CONSTRAINTS = { min: 2, max: 90 };

const DEFAULT_CHARTS = {
  priceMA: { enabled: true, M: [20] },
  volume: { enabled: true },
  macd: { enabled: true, M: 12, N: 26, K: 9 },
  boll: { enabled: true, M: 20, std: [2] },
};

export const createDefaultConfig = () => ({ charts: cloneCharts(DEFAULT_CHARTS) });

function cloneCharts(charts) {
  return Object.fromEntries(
    Object.entries(charts).map(([key, value]) => [
      key,
      { ...value, ...(Array.isArray(value.M) ? { M: [...value.M] } : {}), ...(Array.isArray(value.std) ? { std: [...value.std] } : {}) },
    ])
  );
}

export const cloneConfig = config => ({ charts: cloneCharts(config.charts) });

export const getDefaultChartParams = key => cloneCharts(DEFAULT_CHARTS)[key];

// Parses a comma-separated number list (e.g. "10,30") against range/count constraints.
// Returns { values } on success, or { error } with a user-facing message on failure.
export const parseNumberList = (text, { min, max, minCount = 0, maxCount = Infinity, integer = true, maxDecimals = 0 }) => {
  const trimmed = (text ?? '').trim();

  if (!trimmed) {
    return minCount > 0 ? { error: `請輸入至少 ${minCount} 個數字` } : { values: [] };
  }

  const parts = trimmed.split(',').map(p => p.trim()).filter(p => p !== '');
  const values = [];
  const seen = new Set();

  for (const part of parts) {
    const num = Number(part);
    if (Number.isNaN(num)) return { error: '請輸入以逗號分隔的數字' };
    if (integer && !Number.isInteger(num)) return { error: '請輸入整數' };
    const decimals = (part.split('.')[1] || '').length;
    if (decimals > maxDecimals) return { error: `最多 ${maxDecimals} 位小數` };
    if (num < min || num > max) return { error: `數值需在 ${min} ~ ${max} 之間` };
    if (!seen.has(num)) {
      seen.add(num);
      values.push(num);
    }
  }

  if (values.length < minCount) return { error: `請輸入至少 ${minCount} 個數字` };
  if (values.length > maxCount) return { error: `最多 ${maxCount} 個數字` };
  return { values };
};

export const formatNumberList = values => (values || []).join(',');
