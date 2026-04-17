/**
 * Auth store -- Zustand store for authentication state.
 * Manages tokens, user info, role, restaurant context, and auth lifecycle.
 *
 * Exports:
 *   useAuthStore  -- React hook for component usage
 *   getAuthStore  -- Direct store accessor for use outside React (e.g. api.js)
 */

import { create } from 'zustand';
import { api } from '@/lib/api';

export const useAuthStore = create((set, get) => ({
    // State
    user: null,
    role: null,
    restaurantId: null, // The restaurant this admin/staff manages (null for SUPER_ADMIN)
    isAuthenticated: false,
    profileIncomplete: false,
    isLoading: true,

    /** Initialize from localStorage on app load. */
    initialize: () => {
        if (typeof window === 'undefined') return;
        const token = localStorage.getItem('access_token');
        const user = localStorage.getItem('user');
        const role = localStorage.getItem('role');
        const restaurantId = localStorage.getItem('restaurant_id');

        if (token && user) {
            set({
                user: JSON.parse(user),
                role,
                restaurantId: restaurantId || null,
                isAuthenticated: true,
                profileIncomplete: localStorage.getItem('profile_incomplete') === 'true',
                isLoading: false,
            });
        } else {
            set({ isLoading: false });
        }
    },

    /** Request OTP for phone number. */
    requestOTP: async (phone) => {
        return api.post('/auth/request-otp', { phone });
    },

    /** Verify OTP and store tokens/user info. */
    verifyOTP: async (phone, otp) => {
        const data = await api.post('/auth/verify-otp', { phone, otp });

        localStorage.setItem('access_token', data.access_token);
        localStorage.setItem('user', JSON.stringify({
            id: data.user_id,
            display_name: data.display_name,
        }));
        localStorage.setItem('role', data.role || '');
        if (data.restaurant_id) {
            localStorage.setItem('restaurant_id', data.restaurant_id);
        }
        if (data.profile_incomplete) {
            localStorage.setItem('profile_incomplete', 'true');
        } else {
            localStorage.removeItem('profile_incomplete');
        }

        set({
            user: { id: data.user_id, display_name: data.display_name },
            role: data.role,
            restaurantId: data.restaurant_id || null,
            isAuthenticated: true,
            profileIncomplete: data.profile_incomplete || false,
        });

        return data;
    },

    /** Set the active restaurant context (for SUPER_ADMIN switching between restaurants). */
    setRestaurantId: (id) => {
        if (id) {
            localStorage.setItem('restaurant_id', id);
        } else {
            localStorage.removeItem('restaurant_id');
        }
        set({ restaurantId: id });
    },

    /** Logout and clear all stored data. */
    logout: async () => {
        try {
            await api.post('/auth/logout');
        } catch (e) {
            // Silently fail -- logging out regardless
        }
        localStorage.removeItem('access_token');
        localStorage.removeItem('user');
        localStorage.removeItem('role');
        localStorage.removeItem('restaurant_id');
        localStorage.removeItem('profile_incomplete');
        set({ user: null, role: null, restaurantId: null, isAuthenticated: false, profileIncomplete: false });
    },

    /**
     * Force logout without calling the backend -- used when the refresh token
     * itself is expired or invalid. Clears local state and redirects to /login.
     */
    forceLogout: () => {
        localStorage.removeItem('access_token');
        localStorage.removeItem('user');
        localStorage.removeItem('role');
        localStorage.removeItem('restaurant_id');
        localStorage.removeItem('profile_incomplete');
        set({ user: null, role: null, restaurantId: null, isAuthenticated: false, profileIncomplete: false });
        if (typeof window !== 'undefined') {
            window.location.replace('/login');
        }
    },
}));

/** Direct store accessor for use outside React components (e.g. the API client). */
export const getAuthStore = () => useAuthStore.getState();
