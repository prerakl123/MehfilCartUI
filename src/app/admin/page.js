'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { api } from '@/lib/api';
import RestaurantSelector from '@/components/admin/RestaurantSelector';
import RestaurantDashboard from '@/components/admin/dashboard/RestaurantDashboard';
import SuperAdminDashboard from '@/components/admin/dashboard/SuperAdminDashboard';
import { Store } from 'lucide-react';

export default function AdminDashboard() {
    const router = useRouter();
    const { user, role } = useAuthStore();

    const displayName = user?.display_name || 'Admin';
    const today = new Date().toLocaleDateString('en-IN', {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
    });

    const [statsData, setStatsData] = useState(null);
    const [loading, setLoading] = useState(false);

    // Auto-select restaurant for RESTAURANT_ADMIN
    const authRestaurantId = useAuthStore(state => state.restaurantId);
    const [restaurantId, setLocalRestaurantId] = useState(authRestaurantId);

    useEffect(() => {
        if (authRestaurantId && role !== 'SUPER_ADMIN') {
            setLocalRestaurantId(authRestaurantId);
        }
    }, [authRestaurantId, role]);

    const fetchStats = useCallback(async (rId) => {
        if (!rId) {
            setStatsData(null);
            return;
        }
        setLoading(true);
        try {
            const endpoint = rId === 'global' ? '/admin/dashboard/global' : `/admin/dashboard/${rId}`;
            const data = await api.get(endpoint);
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

    return (
        <div className="flex flex-col gap-8 w-full pb-10">
            {/* Header section */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between w-full">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-foreground">Overview</h1>
                    <p className="text-muted-foreground mt-1 text-sm sm:text-base">
                        Welcome back, <span className="font-semibold text-primary">{displayName}</span>. Here's what's happening today, {today}.
                    </p>
                </div>
                <div className="flex flex-shrink-0 w-full sm:w-auto z-10">
                    <RestaurantSelector
                        className="w-full sm:w-[280px] shadow-sm hover:border-primary/50 transition-colors"
                        onSelect={setLocalRestaurantId}
                    />
                </div>
            </div>

            {/* Empty / Loading State */}
            {(!restaurantId || loading) && (
                <div className="flex h-[400px] w-full flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-gradient-to-b from-card/50 to-background px-4 text-center">
                    {loading ? (
                        <>
                            <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent mb-4 shadow-sm"></div>
                            <h3 className="text-xl font-semibold text-foreground tracking-tight">Crunching Numbers</h3>
                            <p className="text-sm text-muted-foreground mt-2">Aggregating the latest platform metrics for you.</p>
                        </>
                    ) : (
                        <>
                            <div className="p-4 bg-secondary/50 rounded-full mb-4">
                                <Store className="h-12 w-12 text-muted-foreground/70" />
                            </div>
                            <h3 className="text-xl font-semibold text-foreground tracking-tight">No Context Selected</h3>
                            <p className="text-sm text-muted-foreground mt-2 max-w-sm">
                                {role === 'SUPER_ADMIN'
                                    ? 'Select a restaurant or the global view from the dropdown to access real-time statistics.'
                                    : 'Your dashboard statistics will appear once your account is fully linked.'}
                            </p>
                        </>
                    )}
                </div>
            )}

            {/* Render Dashboard Component */}
            {restaurantId && !loading && statsData && (
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 fill-mode-both">
                    {restaurantId === 'global' ? (
                        <SuperAdminDashboard data={statsData} router={router} />
                    ) : (
                        <RestaurantDashboard data={statsData} router={router} role={role} />
                    )}
                </div>
            )}
        </div>
    );
}
