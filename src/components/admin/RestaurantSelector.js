'use client';

/**
 * RestaurantSelector -- dropdown to pick the active restaurant context.
 * SUPER_ADMIN sees all restaurants; RESTAURANT_ADMIN auto-selects their own.
 */

import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';

export default function RestaurantSelector({ onSelect, className = '' }) {
    const { role, restaurantId, setRestaurantId } = useAuthStore();
    const [restaurants, setRestaurants] = useState([]);
    const [loading, setLoading] = useState(false);

    const isSuperAdmin = role === 'SUPER_ADMIN';

    /** Fetch all restaurants for the dropdown (SUPER_ADMIN only). */
    const fetchRestaurants = useCallback(async () => {
        if (!isSuperAdmin) return;
        setLoading(true);
        try {
            const data = await api.get('/admin/restaurants');
            setRestaurants(data);
            // Auto-select first restaurant if none is selected
            if (!restaurantId && data.length > 0) {
                setRestaurantId(data[0].id);
                onSelect?.(data[0].id);
            } else if (restaurantId) {
                onSelect?.(restaurantId);
            }
        } catch (err) {
            console.error('Failed to load restaurants:', err);
        } finally {
            setLoading(false);
        }
    }, [isSuperAdmin, restaurantId, setRestaurantId, onSelect]);

    useEffect(() => {
        if (isSuperAdmin) {
            fetchRestaurants();
        } else if (restaurantId) {
            // RESTAURANT_ADMIN already has their restaurant_id from auth
            onSelect?.(restaurantId);
        }
    }, [isSuperAdmin, restaurantId, fetchRestaurants, onSelect]);

    const handleChange = (e) => {
        const id = e.target.value;
        setRestaurantId(id || null);
        onSelect?.(id || null);
    };

    // Non-super-admin users don't need the selector
    if (!isSuperAdmin) return null;

    return (
        <select
            className={className}
            value={restaurantId || ''}
            onChange={handleChange}
            disabled={loading}
        >
            <option value="">
                {loading ? 'Loading...' : '-- Select Restaurant --'}
            </option>
            {restaurants.map((r) => (
                <option key={r.id} value={r.id}>
                    {r.name}
                </option>
            ))}
        </select>
    );
}
