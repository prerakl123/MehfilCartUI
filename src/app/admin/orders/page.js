'use client';

import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';
import { useToast } from '@/components/ui/Toast';
import RestaurantSelector from '@/components/admin/RestaurantSelector';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import { useAuthStore } from '@/store/authStore';
import { RefreshCcw, X, Clock, AlertCircle, ChefHat, Play, CheckCircle2, CopyCheck } from 'lucide-react';

const STATUS_FLOW = {
    RECEIVED: { next: 'PREPARING', label: 'Start Preparing', icon: Play },
    PREPARING: { next: 'READY', label: 'Mark Ready', icon: CheckCircle2 },
    READY: { next: 'SERVED', label: 'Mark Served', icon: CopyCheck },
};

export default function OrdersPage() {
    const toast = useToast();
    const { role, restaurantId: authRestaurantId } = useAuthStore();
    const [restaurantId, setLocalRestaurantId] = useState(authRestaurantId);

    useEffect(() => {
        if (authRestaurantId && role !== 'SUPER_ADMIN') {
            setLocalRestaurantId(authRestaurantId);
        }
    }, [authRestaurantId, role]);

    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(false);
    const [refreshing, setRefreshing] = useState(false);

    // Auto-polling interval
    useEffect(() => {
        if (!restaurantId) return;

        fetchOrders(restaurantId);

        const interval = setInterval(() => {
            fetchOrders(restaurantId, true); // true indicates silent refresh
        }, 15000); // 15s polling

        return () => clearInterval(interval);
    }, [restaurantId]);

    const fetchOrders = useCallback(async (rId, silent = false) => {
        if (!rId) {
            setOrders([]);
            return;
        }
        if (!silent) setLoading(true);
        if (silent) setRefreshing(true);

        try {
            const data = await api.get(`/admin/orders/${rId}`);
            setOrders(data);
        } catch (err) {
            toast.error('Failed to load live orders');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [toast]);

    const updateStatus = async (orderId, newStatus) => {
        try {
            await api.patch(`/orders/${orderId}/status`, { status: newStatus });
            toast.success(`Order marked as ${newStatus.toLowerCase()}`);
            fetchOrders(restaurantId, true);
        } catch (err) {
            toast.error('Failed to update order status');
        }
    };

    const cancelOrder = async (orderId) => {
        const reason = prompt("Enter cancellation reason:");
        if (!reason) return;

        try {
            await api.post(`/orders/${orderId}/cancel`, { reason });
            toast.success('Order cancelled');
            fetchOrders(restaurantId, true);
        } catch (err) {
            toast.error(err.message || 'Failed to cancel order');
        }
    };

    // Filter into columns
    const columns = [
        { id: 'RECEIVED', title: 'New Orders', color: 'bg-primary/10 border-primary/20 text-primary', icon: AlertCircle },
        { id: 'PREPARING', title: 'Preparing', color: 'bg-warning/10 border-warning/20 text-warning-dark', icon: ChefHat },
        { id: 'READY', title: 'Ready to Serve', color: 'bg-success/10 border-success/20 text-success-dark', icon: CheckCircle2 }
    ];

    const getOrdersByStatus = (status) => {
        return orders.filter(o => o.status === status);
    };

    const formatTime = (isoString) => {
        return new Date(isoString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    return (
        <div className="flex h-[calc(100vh-theme(spacing.16)-theme(spacing.8))] flex-col gap-6 overflow-hidden pb-4">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between shrink-0">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-foreground">Live Orders</h1>
                    <p className="text-sm text-muted-foreground mt-1">Kitchen Display System (KDS)</p>
                </div>
                <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
                    <RestaurantSelector className="w-full sm:w-[250px]" onSelect={setLocalRestaurantId} />
                    {restaurantId && (
                        <Button
                            variant="secondary"
                            className="w-full sm:w-auto"
                            onClick={() => fetchOrders(restaurantId)}
                            disabled={loading || refreshing}
                        >
                            <RefreshCcw className={`mr-2 h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
                            Refresh
                        </Button>
                    )}
                </div>
            </div>

            {!restaurantId ? (
                <div className="flex h-full flex-col items-center justify-center rounded-xl border border-dashed border-border bg-card/50 px-4 text-center">
                    <div className="rounded-full bg-secondary p-4 mb-4">
                        <AlertCircle className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <h3 className="text-lg font-medium text-foreground mb-1">Select a Restaurant</h3>
                    <p className="text-sm text-muted-foreground max-w-sm">Please select a restaurant from the dropdown above to view live kitchen orders.</p>
                </div>
            ) : loading && orders.length === 0 ? (
                <div className="flex h-full flex-col items-center justify-center gap-4">
                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
                    <p className="text-sm font-medium text-muted-foreground">Loading orders...</p>
                </div>
            ) : (
                <div className="flex h-full gap-6 overflow-x-auto pb-4 snap-x">
                    {columns.map(col => {
                        const colOrders = getOrdersByStatus(col.id);
                        const ColIcon = col.icon;

                        return (
                            <div key={col.id} className="flex h-full min-w-[320px] max-w-[400px] flex-1 flex-col rounded-xl border border-border bg-secondary/30 snap-center shrink-0">
                                <div className={`flex items-center justify-between rounded-t-xl border-b p-4 ${col.color}`}>
                                    <div className="flex items-center gap-2 font-semibold">
                                        <ColIcon className="h-5 w-5" />
                                        {col.title}
                                    </div>
                                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-background/50 text-xs font-bold font-mono shadow-sm">
                                        {colOrders.length}
                                    </span>
                                </div>

                                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                                    {colOrders.length === 0 && (
                                        <div className="flex h-32 flex-col items-center justify-center text-center text-sm font-medium italic text-muted-foreground bg-card/50 rounded-lg border border-dashed border-border/50">
                                            No {col.title.toLowerCase()}
                                        </div>
                                    )}

                                    {colOrders.map(order => (
                                        <div key={order.id} className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4 shadow-sm transition-shadow hover:shadow-md">
                                            <div className="flex items-center justify-between border-b border-border pb-3">
                                                <div className="flex items-center gap-2">
                                                    <span className="font-mono text-lg font-bold text-foreground">
                                                        #{order.id.split('-')[0]}
                                                    </span>
                                                    {order.table_label && (
                                                        <Badge variant="secondary" className="text-xs">
                                                            {order.table_label}
                                                        </Badge>
                                                    )}
                                                </div>
                                                <div className="flex items-center text-xs font-medium text-muted-foreground bg-secondary px-2 py-1 rounded-md">
                                                    <Clock className="mr-1 h-3 w-3" />
                                                    {formatTime(order.submitted_at)}
                                                </div>
                                            </div>

                                            <div className="flex flex-col gap-2 py-1">
                                                {order.items.map(item => (
                                                    <div key={item.id} className="flex flex-col">
                                                        <div className="flex items-start justify-between text-sm font-medium text-foreground">
                                                            <span className="flex items-start gap-2">
                                                                <span className="font-bold text-primary">{item.quantity}x</span>
                                                                <span className="line-clamp-2 leading-tight">{item.menu_item_name}</span>
                                                            </span>
                                                        </div>
                                                        {item.notes && (
                                                            <span className="ml-6 mt-0.5 text-xs italic text-destructive flex items-center gap-1">
                                                                <AlertCircle className="h-3 w-3" />
                                                                Note: {item.notes}
                                                            </span>
                                                        )}
                                                    </div>
                                                ))}

                                                {order.special_notes && (
                                                    <div className="mt-2 flex items-start gap-2 rounded-md bg-warning/10 p-2 text-xs font-medium text-warning-dark border border-warning/20">
                                                        <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                                                        <p className="leading-snug">{order.special_notes}</p>
                                                    </div>
                                                )}
                                            </div>

                                            <div className="mt-1 flex items-center justify-between border-t border-border pt-3">
                                                <div className="font-mono text-sm font-semibold text-foreground">
                                                    ₹{order.total_amount}
                                                </div>

                                                <div className="flex items-center gap-2">
                                                    {order.status === 'RECEIVED' && (
                                                        <Button
                                                            size="sm"
                                                            variant="ghost"
                                                            className="h-8 w-8 p-0 text-destructive hover:bg-destructive/10 hover:text-destructive"
                                                            onClick={(e) => { e.stopPropagation(); cancelOrder(order.id); }}
                                                            title="Cancel Order"
                                                        >
                                                            <X className="h-4 w-4" />
                                                        </Button>
                                                    )}
                                                    {STATUS_FLOW[order.status] && (() => {
                                                        const FlowAction = STATUS_FLOW[order.status];
                                                        const ActionIcon = FlowAction.icon;

                                                        // Determine button variant based on status
                                                        const btnVariant =
                                                            order.status === 'RECEIVED' ? 'default' :
                                                                order.status === 'PREPARING' ? 'warning' : 'success';

                                                        return (
                                                            <Button
                                                                size="sm"
                                                                className={`h-8 px-3 ${btnVariant === 'warning' ? 'bg-warning text-warning-foreground hover:bg-warning/90' :
                                                                        btnVariant === 'success' ? 'bg-success text-success-foreground hover:bg-success/90' : ''
                                                                    }`}
                                                                onClick={(e) => { e.stopPropagation(); updateStatus(order.id, FlowAction.next); }}
                                                            >
                                                                <ActionIcon className="mr-1.5 h-3.5 w-3.5" />
                                                                {FlowAction.label}
                                                            </Button>
                                                        )
                                                    })()}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
