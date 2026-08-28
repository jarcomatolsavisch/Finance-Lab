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
