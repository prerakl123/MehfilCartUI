'use client';

import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';
import { useToast } from '@/components/ui/Toast';
import RestaurantSelector from '@/components/admin/RestaurantSelector';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import { useAuthStore } from '@/store/authStore';
import { RefreshCcw, Timer, AlertCircle, ChevronRight, Lock } from 'lucide-react';

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
    const [refreshing, setRefreshing] = useState(false);

    const fetchSessions = useCallback(async (rId, silent = false) => {
        if (!rId || rId === 'global') {
            setSessions([]);
            return;
        }
        if (!silent) setLoading(true);
        if (silent) setRefreshing(true);

        try {
            const data = await api.get(`/admin/sessions/${rId}`);
            setSessions(data);
        } catch (err) {
            toast.error('Failed to load sessions');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [toast]);

    useEffect(() => {
        fetchSessions(restaurantId);

        // Polling every 15s for live updates
        const interval = setInterval(() => {
            if (restaurantId) fetchSessions(restaurantId, true);
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
        <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-foreground">Live Sessions</h1>
                    <p className="text-sm text-muted-foreground mt-1">Monitor active dining sessions</p>
                </div>
                <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
                    <RestaurantSelector className="w-full sm:w-[250px]" onSelect={setLocalRestaurantId} />
                    {restaurantId && (
                        <Button
                            variant="secondary"
                            className="w-full sm:w-auto"
                            onClick={() => fetchSessions(restaurantId)}
                            disabled={loading || refreshing}
                        >
                            <RefreshCcw className={`mr-2 h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
                            Refresh
                        </Button>
                    )}
                </div>
            </div>

            {!restaurantId || restaurantId === 'global' ? (
                <div className="flex h-[400px] flex-col items-center justify-center rounded-xl border border-dashed border-border bg-card/50 px-4 text-center">
                    <div className="rounded-full bg-secondary p-4 mb-4">
                        <AlertCircle className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <h3 className="text-lg font-medium text-foreground mb-1">Select a Restaurant</h3>
                    <p className="text-sm text-muted-foreground max-w-sm">Please select a restaurant from the dropdown above to view active sessions.</p>
                </div>
            ) : loading && sessions.length === 0 ? (
                <div className="flex h-[400px] flex-col items-center justify-center gap-4">
                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
                    <p className="text-sm font-medium text-muted-foreground">Loading sessions...</p>
                </div>
            ) : sessions.length === 0 ? (
                <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-card py-24 px-4 text-center">
                    <div className="rounded-full bg-primary/10 p-4 mb-4">
                        <Timer className="h-10 w-10 text-primary" />
                    </div>
                    <h3 className="text-xl font-semibold text-foreground mb-2">No active sessions</h3>
                    <p className="max-w-sm text-sm text-muted-foreground">
                        When customers scan a table QR code, their session will appear here in real-time.
                    </p>
                </div>
            ) : (
                <div className="flex flex-col gap-4">
                    {sessions.map(session => (
                        <div key={session.id} className="group flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-xl border border-border bg-card p-4 sm:p-5 shadow-sm transition-all hover:border-primary/50 hover:shadow-md">
                            <div className="flex items-start gap-4">
                                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                                    <Timer className="h-6 w-6" />
                                </div>
                                <div className="flex flex-col gap-1">
                                    <div className="flex items-center gap-2">
                                        <h3 className="text-lg font-semibold tracking-tight text-foreground transition-colors group-hover:text-primary">
                                            Table {session.table_id.substring(0, 4)}...
                                        </h3>
                                        {session.host_name && (
                                            <span className="text-sm font-medium text-muted-foreground">
                                                • Host: <span className="text-foreground">{session.host_name}</span>
                                            </span>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                        <span>Started: {formatTime(session.created_at)}</span>
                                        {session.total_amount > 0 && (
                                            <>
                                                <span className="h-1 w-1 rounded-full bg-border"></span>
                                                <span className="font-medium text-foreground">Total: ₹{session.total_amount}</span>
                                            </>
                                        )}
                                        {!session.allow_additions && (
                                            <>
                                                <span className="h-1 w-1 rounded-full bg-border"></span>
                                                <span className="flex items-center gap-1 text-warning-dark">
                                                    <Lock className="h-3 w-3" /> Locked
                                                </span>
                                            </>
                                        )}
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center gap-3 self-end sm:self-auto ml-[60px] sm:ml-0 border-t border-border sm:border-0 pt-4 sm:pt-0 mt-2 sm:mt-0 w-full sm:w-auto justify-between sm:justify-end">
                                <Badge variant={getStatusVariant(session.status)} className="px-2.5 py-1">
                                    {session.status}
                                </Badge>
                                <Button size="sm" variant="ghost" className="h-9 px-3 hover:bg-primary/10 hover:text-primary">
                                    View Details
                                    <ChevronRight className="ml-1 h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
