'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { api } from '@/lib/api';
import RestaurantSelector from '@/components/admin/RestaurantSelector';
import styles from './dashboard.module.css';
import sharedStyles from './shared.module.css';

export default function AdminDashboard() {
    const router = useRouter();
    const { user, role } = useAuthStore();

    const displayName = user?.display_name || 'Admin';
    const today = new Date().toLocaleDateString('en-IN', {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
    });

    const [statsData, setStatsData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [restaurantId, setLocalRestaurantId] = useState(null);

    const fetchStats = useCallback(async (rId) => {
        if (!rId) {
            setStatsData(null);
            return;
        }
        setLoading(true);
        try {
            const data = await api.get(`/admin/dashboard/${rId}`);
            setStatsData(data);
        } catch (err) {
            console.error('Failed to load dashboard stats', err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchStats(restaurantId);
    }, [restaurantId, fetchStats]);

    const stats = [
        { label: 'Active Sessions', value: statsData ? statsData.active_sessions : '—', icon: '⏱️' },
        { label: 'Orders Today', value: statsData ? statsData.total_orders_today : '—', icon: '📦' },
        { label: 'Revenue Today', value: statsData ? `₹${statsData.revenue_today}` : '—', icon: '💰' },
        { label: 'Active Tables', value: statsData ? statsData.total_tables : '—', icon: '🪑' },
    ];

    const quickActions = [
        { label: 'Manage Restaurants', icon: '🍽️', href: '/admin/restaurants', superAdminOnly: true },
        { label: 'Manage Menu', icon: '📋', href: '/admin/menu' },
        { label: 'Manage Tables', icon: '🪑', href: '/admin/tables' },
        { label: 'View Orders', icon: '📦', href: '/admin/orders' },
        { label: 'Manage Staff', icon: '👥', href: '/admin/staff' },
    ];

    return (
        <div className={sharedStyles.page}>
            <div className={sharedStyles.header}>
                <div>
                    <h1 className={styles.greeting}>Welcome, {displayName}</h1>
                    <p className={styles.today}>{today}</p>
                </div>
                <div className={sharedStyles.toolbar}>
                    <RestaurantSelector
                        className={sharedStyles.select}
                        onSelect={setLocalRestaurantId}
                    />
                </div>
            </div>

            {/* Stats */}
            <div className={styles.stats}>
                {stats.map((stat) => (
                    <div key={stat.label} className={styles.statCard}>
                        <span className={styles.statIcon}>{stat.icon}</span>
                        <div className={styles.statLabel}>{stat.label}</div>
                        <div className={styles.statValue}>{stat.value}</div>
                    </div>
                ))}
            </div>

            {/* Quick Actions */}
            <h2 className={styles.sectionTitle}>Quick Actions</h2>
            <div className={styles.quickActions}>
                {quickActions
                    .filter((a) => !a.superAdminOnly || role === 'SUPER_ADMIN')
                    .map((action) => (
                        <div
                            key={action.label}
                            className={styles.actionCard}
                            onClick={() => router.push(action.href)}
                        >
                            <span className={styles.actionIcon}>{action.icon}</span>
                            <span className={styles.actionLabel}>{action.label}</span>
                        </div>
                    ))}
            </div>

            {(!restaurantId || loading) && (
                <div className={sharedStyles.emptyState}>
                    {!restaurantId && (
                        role === 'SUPER_ADMIN'
                            ? 'Select a restaurant to see live statistics.'
                            : 'Dashboard statistics will appear once the system is connected.'
                    )}
                    {loading && restaurantId && 'Loading live statistics...'}
                </div>
            )}
        </div>
    );
}
