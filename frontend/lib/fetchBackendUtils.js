'use server';

import { headers } from 'next/headers';

export const queryRequest = async (method, url, body, responseType = 'json') => {
  try {
    let response;

    const requestHeaders = headers();
    const token = requestHeaders.get('X-Auth-Token'); // Get token from custom header

    const fetchHeaders = {
      'Content-Type': 'application/json',
    };

    // Add Authorization header with Bearer token if token is available
    if (token) {
      fetchHeaders['Authorization'] = `Bearer ${token}`;
    }

    if (method === 'GET') {
      response = await fetch(url, {
        method: 'GET',
        headers: fetchHeaders,
        cache: 'no-store',
      });
    } else if (method === 'POST' || method === 'PUT') {
      response = await fetch(url, {
        method,
        headers: fetchHeaders,
        body: JSON.stringify(body),
      });
    } else if (method === 'POST' || method === 'PUT' || method === 'DELETE') {
      response = await fetch(url, {
        method: 'DELETE',
      });
    } else {
      throw new Error('Unsupported HTTP method');
    }

    // 讀取狀態碼與 JSON payload
    const status = response.status;

    if (responseType === 'csv') {
      const blob = await response.blob();
      return { status, payload: blob };
    } else {
      const { payload } = await response.json();
      return { status, payload };
    }
  } catch (error) {
    console.error(`Request failed: ${error}`);
    return { status: 500, payload: { error: 'Internal request error' } };
  }
};

// 將json object轉換成GET query string
export const toQueryString = params => {
  return Object.entries(params)
    .filter(([key, value]) => value)
    .map(([key, value]) => (Array.isArray(value) ? `${key}=${value.join(',')}` : `${key}=${value}`))
    .join('&');
};