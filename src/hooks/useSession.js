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

    /** Get user's active session */
    const getMyActiveSession = async () => {
        try {
            const data = await api.get('/sessions/my/active');
            return data;
        } catch (err) {
            if (err.status !== 404) {
               console.error('Failed to get active session:', err);
            }
            throw err;
        }
    };

    /** Get active session by table */
    const getActiveSessionForTable = async (tableId) => {
        try {
            const data = await api.get(`/sessions/table/${tableId}/active`);
            return data;
        } catch (err) {
            console.error('Failed to query session for table:', err);
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

    /** Leave session */
    const leaveSession = async (sessionId) => {
        try {
            await api.post(`/sessions/${sessionId}/leave`);
            setSessionData(null);
        } catch (err) {
            console.error('Failed to leave session:', err);
            throw err;
        }
    };

    /** Transfer host */
    const transferHostToMember = async (sessionId, newHostId) => {
        try {
            const data = await api.post(`/sessions/${sessionId}/transfer-host`, { new_host_id: newHostId });
            setSessionData(data);
            return data;
        } catch (err) {
            console.error('Failed to transfer host:', err);
            throw err;
        }
    };

    return {
        sessionData,
        loading,
        createSession,
        getMyActiveSession,
        getActiveSessionForTable,
        fetchSession,
        joinSession,
        handleMember,
        updateSession,
        closeSession,
        leaveSession,
        transferHostToMember,
    };
}
