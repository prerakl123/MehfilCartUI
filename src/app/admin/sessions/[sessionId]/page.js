'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import { api } from '@/lib/api';
import { useToast } from '@/components/ui/Toast';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import {
    ArrowLeft, RefreshCcw, Timer, Lock, AlertCircle,
    PlayCircle, RotateCcw, XCircle, UserPlus, UserCheck, UserX, LogOut,
    ShoppingBag, ChefHat, Bell, CheckCircle2,
} from 'lucide-react';

const EVENT_META = {
    SESSION_CREATED: { icon: PlayCircle, color: 'text-primary bg-primary/10' },
    SESSION_STATUS_CHANGED: { icon: RotateCcw, color: 'text-warning bg-warning/10' },
    SESSION_CLOSED: { icon: XCircle, color: 'text-muted-foreground bg-secondary' },
    MEMBER_JOIN_REQUESTED: { icon: UserPlus, color: 'text-primary bg-primary/10' },
    MEMBER_APPROVED: { icon: UserCheck, color: 'text-success bg-success/10' },
    MEMBER_REJECTED: { icon: UserX, color: 'text-destructive bg-destructive/10' },
    MEMBER_LEFT: { icon: LogOut, color: 'text-muted-foreground bg-secondary' },
    ORDER_SUBMITTED: { icon: ShoppingBag, color: 'text-primary bg-primary/10' },
    ORDER_STATUS_CHANGED: { icon: ChefHat, color: 'text-warning bg-warning/10' },
    ORDER_CANCELLED: { icon: XCircle, color: 'text-destructive bg-destructive/10' },
    SERVICE_ACTION_REQUESTED: { icon: Bell, color: 'text-warning bg-warning/10' },
    SERVICE_ACTION_CLAIMED: { icon: CheckCircle2, color: 'text-primary bg-primary/10' },
    SERVICE_ACTION_COMPLETED: { icon: CheckCircle2, color: 'text-success bg-success/10' },
};

function describeEvent(event) {
    const p = event.payload || {};
    const shortOrderId = p.order_id ? p.order_id.split('-')[0] : null;
    switch (event.event_type) {
        case 'SESSION_CREATED':
            return 'Session started';
        case 'SESSION_STATUS_CHANGED':
            return `Status changed from ${p.from_status} to ${p.to_status}`;
        case 'SESSION_CLOSED':
            return p.reason ? `Session closed — ${p.reason}` : 'Session closed';
        case 'MEMBER_JOIN_REQUESTED':
            return `${p.display_name || 'A guest'} requested to join`;
        case 'MEMBER_APPROVED':
            return 'Join request approved';
        case 'MEMBER_REJECTED':
            return 'Join request rejected';
        case 'MEMBER_LEFT':
            return 'Left the session';
        case 'ORDER_SUBMITTED':
            return `Order #${shortOrderId} submitted (${p.item_count} item${p.item_count === 1 ? '' : 's'}, ₹${p.total_amount})`;
        case 'ORDER_STATUS_CHANGED':
            return `Order #${shortOrderId} ${p.from_status} → ${p.to_status}${p.reason ? ` (${p.reason})` : ''}`;
        case 'ORDER_CANCELLED':
            return `Order #${shortOrderId} cancelled — ${p.reason}`;
        case 'SERVICE_ACTION_REQUESTED':
            return `Requested ${p.action_type?.replaceAll('_', ' ').toLowerCase()}`;
        case 'SERVICE_ACTION_CLAIMED':
            return `Claimed ${p.action_type?.replaceAll('_', ' ').toLowerCase()} request`;
        case 'SERVICE_ACTION_COMPLETED':
            return `Completed ${p.action_type?.replaceAll('_', ' ').toLowerCase()} request`;
        default:
            return event.event_type.replaceAll('_', ' ');
    }
}

const getStatusVariant = (status) => {
    switch (status) {
        case 'ACTIVE': return 'success';
        case 'SUBMITTED': return 'primary';
        case 'PAYMENT_PENDING': return 'warning';
        case 'CLOSED': return 'neutral';
        default: return 'neutral';
    }
};

const getOrderStatusVariant = (status) => {
    switch (status) {
        case 'RECEIVED': return 'primary';
        case 'PREPARING': return 'warning';
        case 'READY': return 'warning';
        case 'SERVED': return 'success';
        case 'COMPLETED': return 'success';
        case 'CANCELLED': return 'error';
        default: return 'neutral';
    }
};

function SessionDetailContent() {
    const router = useRouter();
    const toast = useToast();
    const { sessionId } = useParams();
    const searchParams = useSearchParams();
    const restaurantId = searchParams.get('restaurantId');

    const [session, setSession] = useState(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const fetchDetail = useCallback(async (silent = false) => {
        if (!restaurantId || !sessionId) return;
        if (!silent) setLoading(true);
        if (silent) setRefreshing(true);

        try {
            const data = await api.get(`/admin/sessions/${restaurantId}/${sessionId}`);
            setSession(data);
        } catch (err) {
            toast.error(err.message || 'Failed to load session details');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [restaurantId, sessionId, toast]);

    useEffect(() => {
        fetchDetail();
    }, [fetchDetail]);

    const formatTime = (isoString) => {
        if (!isoString) return '--';
        return new Date(isoString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    };

    if (!restaurantId) {
        return (
            <div className="flex h-[400px] flex-col items-center justify-center rounded-xl border border-dashed border-border bg-card/50 px-4 text-center">
                <AlertCircle className="mb-4 h-8 w-8 text-muted-foreground" />
                <h3 className="mb-1 text-lg font-medium text-foreground">Missing restaurant context</h3>
                <p className="text-sm text-muted-foreground">Go back to Sessions and open this session from there.</p>
                <Button variant="secondary" className="mt-4" onClick={() => router.push('/admin/sessions')}>
                    Back to Sessions
                </Button>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="flex h-[400px] flex-col items-center justify-center gap-4">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
                <p className="text-sm font-medium text-muted-foreground">Loading session…</p>
            </div>
        );
    }

    if (!session) return null;

    const totalAmount = session.orders.reduce((sum, o) => sum + Number(o.total_amount || 0), 0);
    const host = session.members.find((m) => m.role === 'HOST');

    return (
        <div className="flex flex-col gap-6">
            <div className="flex items-center justify-between">
                <Button variant="ghost" size="sm" onClick={() => router.push('/admin/sessions')}>
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to Sessions
                </Button>
                <Button variant="secondary" size="sm" onClick={() => fetchDetail(true)} disabled={refreshing}>
                    <RefreshCcw className={`mr-2 h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
                    Refresh
                </Button>
            </div>

            {/* Session header */}
            <div className="rounded-xl border border-border bg-card p-5 shadow-sm sm:p-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="flex items-start gap-4">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                            <Timer className="h-6 w-6" />
                        </div>
                        <div className="flex flex-col gap-1">
                            <h1 className="text-2xl font-bold tracking-tight text-foreground">
                                {session.table_label || `Table ${session.table_id.substring(0, 4)}...`}
                            </h1>
                            <p className="text-sm text-muted-foreground">
                                Host: <span className="font-medium text-foreground">{host?.display_name || 'Unknown'}</span>
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <Badge variant={getStatusVariant(session.status)} className="px-2.5 py-1">
                            {session.status}
                        </Badge>
                        {!session.allow_additions && (
                            <Badge variant="warning" className="flex items-center gap-1 px-2.5 py-1">
                                <Lock className="h-3 w-3" /> Locked
                            </Badge>
                        )}
                    </div>
                </div>

                <div className="mt-5 grid grid-cols-2 gap-4 border-t border-border pt-5 sm:grid-cols-4">
                    <div>
                        <p className="text-xs font-medium text-muted-foreground">Started</p>
                        <p className="text-sm font-semibold text-foreground">{formatTime(session.started_at)}</p>
                    </div>
                    <div>
                        <p className="text-xs font-medium text-muted-foreground">Closed</p>
                        <p className="text-sm font-semibold text-foreground">{formatTime(session.closed_at)}</p>
                    </div>
                    <div>
                        <p className="text-xs font-medium text-muted-foreground">Members</p>
                        <p className="text-sm font-semibold text-foreground">{session.members.length}</p>
                    </div>
                    <div>
                        <p className="text-xs font-medium text-muted-foreground">Total</p>
                        <p className="text-sm font-semibold text-foreground">₹{totalAmount.toFixed(2)}</p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                {/* Orders */}
                <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
                    <h2 className="mb-4 text-lg font-semibold text-foreground">Orders ({session.orders.length})</h2>
                    {session.orders.length === 0 ? (
                        <p className="text-sm italic text-muted-foreground">No orders were placed in this session.</p>
                    ) : (
                        <div className="flex flex-col gap-3">
                            {session.orders.map((order) => (
                                <div key={order.id} className="flex items-center justify-between rounded-lg border border-border p-3">
                                    <div>
                                        <p className="font-mono text-sm font-semibold text-foreground">#{order.id.split('-')[0]}</p>
                                        <p className="text-xs text-muted-foreground">{order.items.length} item{order.items.length === 1 ? '' : 's'} · ₹{order.total_amount}</p>
                                    </div>
                                    <Badge variant={getOrderStatusVariant(order.status)}>{order.status}</Badge>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Timeline */}
                <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
                    <h2 className="mb-4 text-lg font-semibold text-foreground">Timeline</h2>
                    {session.events.length === 0 ? (
                        <p className="text-sm italic text-muted-foreground">No events recorded for this session yet.</p>
                    ) : (
                        <ol className="flex flex-col gap-4">
                            {session.events.map((event) => {
                                const meta = EVENT_META[event.event_type] || { icon: AlertCircle, color: 'text-muted-foreground bg-secondary' };
                                const EventIcon = meta.icon;
                                return (
                                    <li key={event.id} className="flex gap-3">
                                        <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${meta.color}`}>
                                            <EventIcon className="h-4 w-4" />
                                        </div>
                                        <div className="flex flex-1 flex-col gap-0.5 pt-1">
                                            <p className="text-sm font-medium text-foreground">{describeEvent(event)}</p>
                                            <p className="text-xs text-muted-foreground">
                                                {formatTime(event.created_at)}
                                                {event.actor_name && <> · {event.actor_name}</>}
                                            </p>
                                        </div>
                                    </li>
                                );
                            })}
                        </ol>
                    )}
                </div>
            </div>
        </div>
    );
}

export default function SessionDetailPage() {
    return (
        <Suspense fallback={
            <div className="flex h-[400px] flex-col items-center justify-center gap-4">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
            </div>
        }>
            <SessionDetailContent />
        </Suspense>
    );
}
