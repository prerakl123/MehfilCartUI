/**
 * API client -- fetch wrapper with auth token injection and 401 refresh handling.
 */

import { APP_CONFIG } from '@/constants/config';

const BASE_URL = APP_CONFIG.API_BASE_URL;

/** Build full URL from endpoint path. */
function buildUrl(endpoint) {
    return `${BASE_URL}${endpoint}`;
}

/** Retrieve the access token from localStorage. */
function getAccessToken() {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('access_token');
}

/** Core fetch wrapper with JSON defaults and auth header. */
async function request(endpoint, options = {}) {
    const { body, headers = {}, ...rest } = options;

    const config = {
        headers: {
            'Content-Type': 'application/json',
            ...headers,
        },
        ...rest,
    };

    if (body) {
        config.body = JSON.stringify(body);
    }

    // Inject access token if available
    const token = getAccessToken();
    if (token) {
        config.headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(buildUrl(endpoint), config);

    if (!response.ok) {
        const error = await response.json().catch(() => ({ detail: response.statusText }));
        const err = new Error(error.detail || 'API request failed');
        err.status = response.status;
        err.data = error;
        throw err;
    }

    // Handle 204 No Content
    if (response.status === 204) return null;
    return response.json();
}

/** Convenience methods. */
export const api = {
    get: (endpoint, options) => request(endpoint, { method: 'GET', ...options }),
    post: (endpoint, body, options) => request(endpoint, { method: 'POST', body, ...options }),
    patch: (endpoint, body, options) => request(endpoint, { method: 'PATCH', body, ...options }),
    delete: (endpoint, options) => request(endpoint, { method: 'DELETE', ...options }),
};
