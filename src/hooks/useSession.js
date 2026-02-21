/**
 * useSession hook
 * Connects to backend session management endpoints.
 */

import { useState, useCallback } from 'react';
import { api } from '@/lib/api';

export function useSession() {
    const [sessionData, setSessionData] = useState(null);
    const [loading, setLoading] = useState(false);

    /** Create a new session (Host) */
    const createSession = async (tableId) => {
        try {
            const data = await api.post('/sessions', { table_id: tableId });
            setSessionData(data);
            return data;
        } catch (err) {
            console.error('Failed to create session:', err);
            throw err;
        }
    };

    /** Get session details */
    const fetchSession = useCallback(async (sessionId) => {
        if (!sessionId) return null;
        setLoading(true);
        try {
            const data = await api.get(`/sessions/${sessionId}`);
            setSessionData(data);
            return data;
        } catch (err) {
            console.error('Failed to fetch session:', err);
            throw err;
            // Optionally, handle specific status codes (e.g., 404 session closed)
        } finally {
            setLoading(false);
        }
    }, []);

    /** Request to join a session (Guest) */
    const joinSession = async (sessionId) => {
        try {
            return await api.post(`/sessions/${sessionId}/join`);
        } catch (err) {
            console.error('Failed to join session:', err);
            throw err;
        }
    };

    /** Approve/Reject a member (Host) */
    const handleMember = async (sessionId, memberId, action) => {
        try {
            await api.patch(`/sessions/${sessionId}/members/${memberId}`, { action });
            // Refresh session details to show new member status
            await fetchSession(sessionId);
        } catch (err) {
            console.error(`Failed to ${action} member:`, err);
            throw err;
        }
    };

    /** Update session (toggle additions or lock) */
    const updateSession = async (sessionId, updateData) => {
        try {
            const data = await api.patch(`/sessions/${sessionId}`, updateData);
            setSessionData(data);
            return data;
        } catch (err) {
            console.error('Failed to update session:', err);
            throw err;
        }
    };

    /** Close session */
    const closeSession = async (sessionId) => {
        try {
            await api.delete(`/sessions/${sessionId}`);
            setSessionData(null);
        } catch (err) {
            console.error('Failed to close session:', err);
            throw err;
        }
    };

    return {
        sessionData,
        loading,
        createSession,
        fetchSession,
        joinSession,
        handleMember,
        updateSession,
        closeSession,
    };
}
