/**
 * useAuth hook -- abstracts auth operations for components.
 * Wraps the Zustand authStore for ergonomic access.
 */

import { useAuthStore } from '@/store/authStore';

export function useAuth() {
    const {
        user, role, restaurantId, isAuthenticated, isLoading,
        requestOTP, verifyOTP, logout, setRestaurantId,
    } = useAuthStore();

    return {
        user,
        role,
        restaurantId,
        isAuthenticated,
        isLoading,

        /** Request OTP for phone number. */
        requestOtp: async (phone) => requestOTP(phone),

        /** Verify OTP and obtain JWT tokens. */
        verifyOtp: async (phone, otp) => verifyOTP(phone, otp),

        /** Logout and invalidate tokens. */
        logout: async () => logout(),

        /** Set the active restaurant context. */
        setRestaurantId,
    };
}
