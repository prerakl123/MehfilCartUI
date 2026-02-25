'use client';

import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';
import { useToast } from '@/components/ui/Toast';
import RestaurantSelector from '@/components/admin/RestaurantSelector';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import sharedStyles from '../shared.module.css';
import { useAuthStore } from '@/store/authStore';

export default function SessionsPage() {
    const toast = useToast();
    const { role, restaurantId: authRestaurantId } = useAuthStore();
    const [restaurantId, setLocalRestaurantId] = useState(authRestaurantId);

    useEffect(() => {
        if (authRestaurantId && role !== 'SUPER_ADMIN') {
            setLocalRestaurantId(authRestaurantId);
        }
    }, [authRestaurantId, role]);

    const [sessions, setSessions] = useState([]);
    const [loading, setLoading] = useState(false);

    const fetchSessions = useCallback(async (rId) => {
        if (!rId) {
            setSessions([]);
            return;
        }
        setLoading(true);
        try {
            const data = await api.get(`/admin/sessions/${rId}`);
            setSessions(data);
        } catch (err) {
            toast.error('Failed to load sessions');
        } finally {
            setLoading(false);
        }
    }, [toast]);

    useEffect(() => {
        fetchSessions(restaurantId);

        // Polling every 15s for live updates
        const interval = setInterval(() => {
            if (restaurantId) fetchSessions(restaurantId);
        }, 15000);
        return () => clearInterval(interval);
    }, [restaurantId, fetchSessions]);

    const formatTime = (isoString) => {
        if (!isoString) return '--';
        return new Date(isoString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    const getStatusVariant = (status) => {
        switch (status) {
            case 'ACTIVE': return 'success';
            case 'SUBMITTED': return 'primary';
            case 'PAYMENT_PENDING': return 'warning';
            case 'CLOSED': return 'neutral';
            default: return 'neutral';
        }
    };

    return (
        <div className={sharedStyles.page}>
            <div className={sharedStyles.header}>
                <div>
                    <h1 className={sharedStyles.title}>Live Sessions</h1>
                    <p className={sharedStyles.subtitle}>Monitor active dining sessions</p>
                </div>
                <div className={sharedStyles.toolbar}>
                    <RestaurantSelector className={sharedStyles.select} onSelect={setLocalRestaurantId} />
                    {restaurantId && (
                        <Button variant="secondary" onClick={() => fetchSessions(restaurantId)}>
                            ↻ Refresh
                        </Button>
                    )}
                </div>
            </div>

            {!restaurantId ? (
                <div className={sharedStyles.emptyState}>
                    Please select a restaurant to view sessions.
                </div>
            ) : loading && sessions.length === 0 ? (
                <div className={sharedStyles.loading}>Loading sessions...</div>
            ) : sessions.length === 0 ? (
                <div className={sharedStyles.emptyState}>
                    <div className={sharedStyles.emptyIcon}>⏱️</div>
                    <div className={sharedStyles.emptyTitle}>No active sessions</div>
                    <p>When customers scan a table QR code, their session will appear here.</p>
                </div>
            ) : (
                <div className={sharedStyles.list}>
                    {sessions.map(session => (
                        <div key={session.id} className={sharedStyles.listItem}>
                            <div className={sharedStyles.listItemInfo}>
                                <div className={sharedStyles.listItemName} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                                    Table {session.table_id.substring(0, 4)}...
                                    {session.host_name && <span style={{ fontWeight: 'normal', color: 'var(--color-text-secondary)' }}>• Host: {session.host_name}</span>}
                                </div>
                                <div className={sharedStyles.listItemMeta}>
                                    Started: {formatTime(session.created_at)}
                                    {session.total_amount > 0 && ` • Total: ₹${session.total_amount}`}
                                </div>
                            </div>
                            <div className={sharedStyles.listItemActions}>
                                {!session.allow_additions && <Badge variant="warning">Locked</Badge>}
                                <Badge variant={getStatusVariant(session.status)}>
                                    {session.status}
                                </Badge>
                                <Button size="sm" variant="ghost">View Details</Button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
