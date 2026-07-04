/**
 * Frontend-only configuration constants.
 * Server-side config (OTP rules, JWT expiry, rate limits) lives in the backend.
 */

export const APP_CONFIG = Object.freeze({
    APP_NAME: 'MehfilCart',
    APP_TAGLINE: 'Order Together, Dine Together',

    // API endpoint -- relative by default so requests go through the Next.js
    // rewrite proxy (see next.config.mjs) and stay same-origin, keeping the
    // refresh_token cookie first-party. Override only if bypassing the proxy.
    API_BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL || '/api/v1',
    // WebSockets can't go through the rewrite proxy, so this always points
    // directly at the backend. The connection authenticates via ?token=, not
    // the cookie, so it's unaffected by the cross-site cookie restriction.
    SOCKET_URL: process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:8000',

    // Map rendering (MapLibre GL). Only the tile STYLE needs a key in the
    // browser; geocoding goes through our backend so its key stays server-side.
    // Swap providers later by changing MAP_STYLE_URL (and the backend provider).
    MAP_STYLE_URL: process.env.NEXT_PUBLIC_MAP_STYLE_URL
        || (process.env.NEXT_PUBLIC_MAPTILER_KEY
            ? `https://api.maptiler.com/maps/streets-v2/style.json?key=${process.env.NEXT_PUBLIC_MAPTILER_KEY}`
            : ''),
    // Default map view when a restaurant has no location yet (centroid of India).
    MAP_DEFAULT_CENTER: { longitude: 78.9629, latitude: 20.5937 },
    MAP_DEFAULT_ZOOM: 4,
    MAP_PIN_ZOOM: 15,

    // UI-only constants
    OTP_LENGTH: 6,                   // For input field rendering (length of OTP input boxes)
    SEARCH_DEBOUNCE_MS: 300,         // Debounce delay for menu search input
    TOAST_DURATION_MS: 4000,         // How long toast notifications stay visible
    RECONNECT_INTERVAL_MS: 3000,     // WebSocket reconnection interval

    // Breakpoints (match globals.css)
    BREAKPOINT_MOBILE: 480,
    BREAKPOINT_TABLET: 768,
    BREAKPOINT_DESKTOP: 1024,
});
