/**
 * useCart hook
 * Manages cart state by calling the backend /cart endpoints for a given session.
 */

import { useState, useCallback, useEffect } from 'react';
import { api } from '@/lib/api';
import { useSocket } from './useSocket';

export function useCart(sessionId) {
    const [cart, setCart] = useState({ items: [], total: 0 });
    const [loading, setLoading] = useState(false);

    // USP: Real-time WebSocket connection
    const { connected, lastMessage, sendMessage } = useSocket();

    useEffect(() => {
        if (lastMessage?.event === 'cart:updated') {
            console.log("WebSocket Cart Update Received:", lastMessage.data);
            setCart(lastMessage.data);
        }
    }, [lastMessage]);

    // Automatically join the session room for real-time collaboration updates
    useEffect(() => {
        if (connected && sessionId) {
            sendMessage('join:session', { session_id: sessionId });
        }
        return () => {
            if (connected && sessionId) {
                sendMessage('leave:session', { session_id: sessionId });
            }
        };
    }, [connected, sessionId, sendMessage]);

    const fetchCart = useCallback(async () => {
        if (!sessionId) return;
        setLoading(true);
        try {
            const data = await api.get(`/cart/${sessionId}`);
            setCart(data);
        } catch (err) {
            console.error('Failed to fetch cart:', err);
        } finally {
            setLoading(false);
        }
    }, [sessionId]);

    const addItem = async (menuItemId, quantity = 1, customizations = {}, notes = '') => {
        if (!sessionId) return null;
        try {
            const data = await api.post(`/cart/${sessionId}/items`, {
                menu_item_id: menuItemId,
                quantity,
                customizations,
                notes,
            });
            setCart(data);
            return data;
        } catch (err) {
            console.error('Failed to add item to cart:', err);
            throw err;
        }
    };

    const updateItem = async (cartItemId, quantity) => {
        if (!sessionId) return null;
        try {
            const data = await api.patch(`/cart/${sessionId}/items/${cartItemId}`, { quantity });
            setCart(data);
            return data;
        } catch (err) {
            console.error('Failed to update cart item:', err);
            throw err;
        }
    };

    const removeItem = async (cartItemId) => {
        if (!sessionId) return null;
        try {
            const data = await api.delete(`/cart/${sessionId}/items/${cartItemId}`);
            setCart(data);
            return data;
        } catch (err) {
            console.error('Failed to remove cart item:', err);
            throw err;
        }
    };

    const clearCart = async () => {
        if (!sessionId) return null;
        try {
            await api.delete(`/cart/${sessionId}`);
            setCart({ items: [], total: 0 });
        } catch (err) {
            console.error('Failed to clear cart:', err);
            throw err;
        }
    };

    return {
        cart,
        loading,
        fetchCart,
        addItem,
        updateItem,
        removeItem,
        clearCart,
    };
}
