'use server';

const HOST = process.env.API_BASE_URL;

// Example server action — replace with real endpoints for the new domain.
// GET /api/v1/example
export const getExampleData = async () => {
  try {
    const res = await fetch(`${HOST}/api/v1/example`, { cache: 'no-store' });
    return await res.json();
  } catch (e) {
    console.error('getExampleData error:', e);
    return null;
  }
};

// GET /api/v1/tw/history/stock/price?id=0050,2308&start=2026-01-01&end=2026-03-01
export const getTwStockPrices = async (ids, start, end) => {
  const params = new URLSearchParams({ id: ids.join(','), start, end });

  try {
    const res = await fetch(`${HOST}/api/v1/tw/history/stock/price?${params.toString()}`, {
      cache: 'no-store',
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      return { error: err.detail || `Request failed with status ${res.status}` };
    }
    return await res.json();
  } catch (e) {
    console.error('getTwStockPrices error:', e);
    return { error: 'Failed to reach TW Stocks API' };
  }
};

// GET /api/v1/tw/portfolio/efficient-frontier?id=0050,2308&start=2026-01-01&end=2026-03-01
export const getEfficientFrontier = async (ids, start, end) => {
  const params = new URLSearchParams({ id: ids.join(','), start, end });

  try {
    const res = await fetch(`${HOST}/api/v1/tw/portfolio/efficient-frontier?${params.toString()}`, {
      cache: 'no-store',
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      return { error: err.detail || `Request failed with status ${res.status}` };
    }
    return await res.json();
  } catch (e) {
    console.error('getEfficientFrontier error:', e);
    return { error: 'Failed to reach TW Stocks API' };
  }
};

// POST /api/v1/tw/stock/technical/indicators
export const getTechnicalIndicators = async (stockId, start, end, indicators) => {
  try {
    const res = await fetch(`${HOST}/api/v1/tw/stock/technical/indicators`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ stock_id: stockId, start, end, indicators }),
      cache: 'no-store',
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      return { error: err.detail || `Request failed with status ${res.status}` };
    }
    return await res.json();
  } catch (e) {
    console.error('getTechnicalIndicators error:', e);
    return { error: 'Failed to reach TW Stocks API' };
  }
};

// GET /api/v1/tw/stocks/search?q=...
export const searchTwStocks = async q => {
  const params = new URLSearchParams({ q });

  try {
    const res = await fetch(`${HOST}/api/v1/tw/stocks/search?${params.toString()}`, {
      cache: 'no-store',
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      return { error: err.detail || `Request failed with status ${res.status}` };
    }
    return await res.json();
  } catch (e) {
    console.error('searchTwStocks error:', e);
    return { error: 'Failed to reach TW Stocks API' };
  }
};
