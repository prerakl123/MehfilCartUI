'use client';

import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';
import { useToast } from '@/components/ui/Toast';
import RestaurantSelector from '@/components/admin/RestaurantSelector';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Modal from '@/components/ui/Modal';
import sharedStyles from '../shared.module.css';

const STATUS_FLOW = {
    RECEIVED: { next: 'PREPARING', label: 'Start Preparing', variant: 'primary' },
    PREPARING: { next: 'READY', label: 'Mark Ready', variant: 'warning' },
    READY: { next: 'SERVED', label: 'Mark Served', variant: 'success' },
};

import { useAuthStore } from '@/store/authStore';

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

    // Auto-polling interval
    useEffect(() => {
        if (!restaurantId) return;

        fetchOrders(restaurantId);

        const interval = setInterval(() => {
            fetchOrders(restaurantId);
        }, 15000); // 15s polling

        return () => clearInterval(interval);
    }, [restaurantId]);

    const fetchOrders = useCallback(async (rId) => {
        if (!rId) {
            setOrders([]);
            return;
        }
        setLoading(true);
        try {
            const data = await api.get(`/admin/orders/${rId}`);
            setOrders(data);
        } catch (err) {
            toast.error('Failed to load live orders');
        } finally {
            setLoading(false);
        }
    }, [toast]);

    const updateStatus = async (orderId, newStatus) => {
        try {
            await api.patch(`/orders/${orderId}/status`, { status: newStatus });
            toast.success(`Order marked as ${newStatus.toLowerCase()}`);
            fetchOrders(restaurantId);
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
            fetchOrders(restaurantId);
        } catch (err) {
            toast.error(err.message || 'Failed to cancel order');
        }
    };

    // Filter into columns
    const columns = [
        { id: 'RECEIVED', title: 'New Orders' },
        { id: 'PREPARING', title: 'Preparing' },
        { id: 'READY', title: 'Ready to Serve' }
    ];

    const getOrdersByStatus = (status) => {
        return orders.filter(o => o.status === status);
    };

    const formatTime = (isoString) => {
        return new Date(isoString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    return (
        <div className={sharedStyles.page} style={{ height: '100%' }}>
            <div className={sharedStyles.header}>
                <div>
                    <h1 className={sharedStyles.title}>Live Orders</h1>
                    <p className={sharedStyles.subtitle}>Kitchen Display System (KDS)</p>
                </div>
                <div className={sharedStyles.toolbar}>
                    <RestaurantSelector className={sharedStyles.select} onSelect={setLocalRestaurantId} />
                    {restaurantId && (
                        <Button variant="secondary" onClick={() => fetchOrders(restaurantId)}>
                            ↻ Refresh
                        </Button>
                    )}
                </div>
            </div>

            {!restaurantId ? (
                <div className={sharedStyles.emptyState}>
                    Please select a restaurant to view live orders.
                </div>
            ) : loading && orders.length === 0 ? (
                <div className={sharedStyles.loading}>Loading orders...</div>
            ) : (
                <div className={sharedStyles.kanban}>
                    {columns.map(col => {
                        const colOrders = getOrdersByStatus(col.id);
                        return (
                            <div key={col.id} className={sharedStyles.kanbanColumn}>
                                <div className={sharedStyles.kanbanTitle}>
                                    {col.title}
                                    <span className={sharedStyles.kanbanCount}>{colOrders.length}</span>
                                </div>

                                {colOrders.length === 0 && (
                                    <div style={{ color: 'var(--color-text-muted)', fontSize: 'var(--font-size-sm)', textAlign: 'center', marginTop: 'var(--space-4)' }}>
                                        No {col.title.toLowerCase()}
                                    </div>
                                )}

                                {colOrders.map(order => (
                                    <div key={order.id} className={sharedStyles.kanbanCard}>
                                        <div className={sharedStyles.kanbanCardHeader}>
                                            <span className={sharedStyles.kanbanCardId}>#{order.id.split('-')[0]}</span>
                                            <span className={sharedStyles.kanbanCardTime}>{formatTime(order.submitted_at)}</span>
                                        </div>

                                        <div className={sharedStyles.kanbanCardItems}>
                                            {order.items.map(item => (
                                                <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                                                    <span>{item.quantity}x {item.menu_item_name}</span>
                                                    {item.notes && <span style={{ fontSize: '0.7rem', color: '#EF4444', fontStyle: 'italic' }}>({item.notes})</span>}
                                                </div>
                                            ))}
                                            {order.special_notes && (
                                                <div style={{ marginTop: 'var(--space-2)', fontSize: '0.75rem', padding: 'var(--space-1)', background: 'var(--color-warning-light)', color: 'var(--color-warning-dark)', borderRadius: 'var(--radius-sm)' }}>
                                                    Note: {order.special_notes}
                                                </div>
                                            )}
                                        </div>

                                        <div className={sharedStyles.kanbanCardFooter}>
                                            <div className={sharedStyles.kanbanCardTotal}>
                                                ₹{order.total_amount}
                                            </div>

                                            <div style={{ display: 'flex', gap: 'var(--space-1)' }}>
                                                {STATUS_FLOW[order.status] && (
                                                    <Button
                                                        size="sm"
                                                        onClick={(e) => { e.stopPropagation(); updateStatus(order.id, STATUS_FLOW[order.status].next); }}
                                                    >
                                                        {STATUS_FLOW[order.status].label}
                                                    </Button>
                                                )}
                                                {order.status === 'RECEIVED' && (
                                                    <Button size="sm" variant="ghost" style={{ color: 'var(--color-error)' }} onClick={(e) => { e.stopPropagation(); cancelOrder(order.id); }}>
                                                        ✕
                                                    </Button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
