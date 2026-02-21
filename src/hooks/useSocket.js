/**
 * useSocket hook
 * Connects to the FastAPI native WebSocket endpoint using the auth token.
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import { useAuthStore } from '@/store/authStore';

export function useSocket() {
    const { isAuthenticated } = useAuthStore();
    const ws = useRef(null);
    const [connected, setConnected] = useState(false);
    const [lastMessage, setLastMessage] = useState(null);

    const connect = useCallback(() => {
        if (!isAuthenticated) return;

        const token = localStorage.getItem('access_token');
        if (!token) return;

        // Use standard WebSocket, not socket.io
        const wsUrl = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8000/ws';
        const socket = new WebSocket(`${wsUrl}?token=${token}`);

        socket.onopen = () => {
            console.log('WebSocket Connected');
            setConnected(true);
        };

        socket.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                console.log('WebSocket Message:', data);
                setLastMessage(data);
            } catch (err) {
                console.error('WebSocket Message parse error:', err);
            }
        };

        socket.onclose = () => {
            console.log('WebSocket Disconnected. Reconnecting in 5s...');
            setConnected(false);
            setTimeout(connect, 5000); // Auto-reconnect
        };

        socket.onerror = (error) => {
            console.error('WebSocket Error:', error);
            socket.close(); // Trigger auto-reconnect
        };

        ws.current = socket;
    }, [isAuthenticated]);

    useEffect(() => {
        connect();
        return () => {
            if (ws.current) {
                ws.current.close();
            }
        };
    }, [connect]);

    const sendMessage = useCallback((type, payload) => {
        if (ws.current && ws.current.readyState === WebSocket.OPEN) {
            ws.current.send(JSON.stringify({ type, payload }));
        } else {
            console.error('WebSocket not connected');
        }
    }, []);

    return { connected, lastMessage, sendMessage };
}
