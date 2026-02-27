'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { api } from '@/lib/api';
import RestaurantSelector from '@/components/admin/RestaurantSelector';
import {
    Timer,
    Package,
    CircleDollarSign,
    Combine,
    ArrowUpRight,
    ArrowDownRight,
    Store,
    Menu as MenuIcon,
    Users
} from 'lucide-react';
import {
    Area,
    AreaChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
    CartesianGrid
} from 'recharts';

// Mock data for the chart since the API currently only returns single numbers
const mockChartData = [
    { time: '10 AM', revenue: 1200, orders: 4 },
    { time: '12 PM', revenue: 3500, orders: 12 },
    { time: '2 PM', revenue: 5800, orders: 18 },
    { time: '4 PM', revenue: 4200, orders: 15 },
    { time: '6 PM', revenue: 8900, orders: 28 },
    { time: '8 PM', revenue: 12500, orders: 42 },
    { time: '10 PM', revenue: 9800, orders: 32 },
];

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
        {
            label: 'Active Sessions',
            value: statsData ? statsData.active_sessions : '—',
            icon: Timer,
            color: 'text-blue-600 dark:text-blue-400',
            bgColor: 'bg-blue-100 dark:bg-blue-900/40',
            trend: '+12%',
            trendUp: true
        },
        {
            label: 'Orders Today',
            value: statsData ? statsData.total_orders_today : '—',
            icon: Package,
            color: 'text-purple-600 dark:text-purple-400',
            bgColor: 'bg-purple-100 dark:bg-purple-900/40',
            trend: '+5%',
            trendUp: true
        },
        {
            label: 'Revenue Today',
            value: statsData ? `₹${statsData.revenue_today}` : '—',
            icon: CircleDollarSign,
            color: 'text-green-600 dark:text-green-400',
            bgColor: 'bg-green-100 dark:bg-green-900/40',
            trend: '+18%',
            trendUp: true
        },
        {
            label: 'Total Tables',
            value: statsData ? statsData.total_tables : '—',
            icon: Combine,
            color: 'text-orange-600 dark:text-orange-400',
            bgColor: 'bg-orange-100 dark:bg-orange-900/40',
            trend: 'Stable',
            trendUp: null
        },
    ];

    const quickActions = [
        { label: 'Manage Restaurants', icon: Store, href: '/admin/restaurants', superAdminOnly: true },
        { label: 'Manage Menu', icon: MenuIcon, href: '/admin/menu' },
        { label: 'Manage Tables', icon: Combine, href: '/admin/tables' },
        { label: 'View Live Orders', icon: Package, href: '/admin/orders' },
        { label: 'Manage Staff', icon: Users, href: '/admin/staff' },
    ];

    return (
        <div className="flex flex-col gap-8 w-full">
            {/* Header section */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between w-full">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-foreground">Overview</h1>
                    <p className="text-muted-foreground mt-1 text-sm sm:text-base">
                        Welcome back, {displayName}. Here's what's happening today, {today}.
                    </p>
                </div>
                <div className="flex items-center w-full sm:w-auto">
                    <RestaurantSelector
                        className="w-full sm:w-[250px]"
                        onSelect={setLocalRestaurantId}
                    />
                </div>
            </div>

            {/* Empty / Loading State */}
            {(!restaurantId || loading) && (
                <div className="flex h-[400px] w-full flex-col items-center justify-center rounded-xl border border-dashed border-border bg-card/50 px-4 text-center">
                    {loading ? (
                        <>
                            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mb-4"></div>
                            <h3 className="text-lg font-medium text-foreground">Loading dashboard data</h3>
                            <p className="text-sm text-muted-foreground mt-1">Please wait while we fetch the latest metrics.</p>
                        </>
                    ) : (
                        <>
                            <Store className="mx-auto mb-4 h-12 w-12 text-muted-foreground/50" />
                            <h3 className="text-lg font-medium text-foreground">No Restaurant Selected</h3>
                            <p className="text-sm text-muted-foreground mt-1 max-w-sm">
                                {role === 'SUPER_ADMIN'
                                    ? 'Select a restaurant from the dropdown above to view its live statistics and performance.'
                                    : 'Your dashboard statistics will appear once your account is fully linked.'}
                            </p>
                        </>
                    )}
                </div>
            )}

            {/* Dashboard Content */}
            {restaurantId && !loading && (
                <div className="flex flex-col gap-6 w-full">
                    {/* KPI Cards Grid */}
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 w-full">
                        {stats.map((stat) => {
                            const Icon = stat.icon;
                            return (
                                <div key={stat.label} className="flex flex-col justify-between rounded-xl border border-border bg-card p-6 shadow-sm transition-all hover:shadow-md">
                                    <div className="flex items-center justify-between">
                                        <p className="text-sm font-medium text-muted-foreground">{stat.label}</p>
                                        <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                                            <Icon className={`h-5 w-5 ${stat.color}`} />
                                        </div>
                                    </div>
                                    <div className="mt-4 flex items-baseline gap-2">
                                        <h2 className="text-3xl font-bold tracking-tighter text-foreground">{stat.value}</h2>
                                        {stat.trendUp !== null && (
                                            <span className={`flex items-center text-xs font-medium ${stat.trendUp ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                                                {stat.trendUp ? <ArrowUpRight className="mr-0.5 h-3 w-3" /> : <ArrowDownRight className="mr-0.5 h-3 w-3" />}
                                                {stat.trend}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 w-full">
                        {/* Revenue Chart */}
                        <div className="lg:col-span-2 flex flex-col rounded-xl border border-border bg-card shadow-sm w-full">
                            <div className="flex flex-col gap-1 border-b border-border p-6">
                                <h3 className="text-lg font-semibold leading-none tracking-tight text-foreground">Revenue Analytics</h3>
                                <p className="text-sm text-muted-foreground">Hourly revenue overview for today</p>
                            </div>
                            <div className="p-6 h-[350px] w-full relative">
                                {!statsData ? (
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <p className="text-sm text-muted-foreground">No data available for chart</p>
                                    </div>
                                ) : (
                                    <ResponsiveContainer width="100%" height="100%">
                                        <AreaChart data={mockChartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                                            <defs>
                                                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="var(--color-primary)" stopOpacity={0.3} />
                                                    <stop offset="95%" stopColor="var(--color-primary)" stopOpacity={0} />
                                                </linearGradient>
                                            </defs>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-border)" />
                                            <XAxis
                                                dataKey="time"
                                                stroke="var(--color-muted-foreground)"
                                                fontSize={12}
                                                tickLine={false}
                                                axisLine={false}
                                            />
                                            <YAxis
                                                stroke="var(--color-muted-foreground)"
                                                fontSize={12}
                                                tickLine={false}
                                                axisLine={false}
                                                tickFormatter={(value) => `₹${value}`}
                                                width={60}
                                            />
                                            <Tooltip
                                                contentStyle={{
                                                    backgroundColor: 'var(--color-card)',
                                                    borderColor: 'var(--color-border)',
                                                    borderRadius: '0.5rem',
                                                    color: 'var(--color-foreground)',
                                                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                                                }}
                                                itemStyle={{ color: 'var(--color-foreground)' }}
                                            />
                                            <Area
                                                type="monotone"
                                                dataKey="revenue"
                                                stroke="var(--color-primary)"
                                                strokeWidth={3}
                                                fillOpacity={1}
                                                fill="url(#colorRevenue)"
                                            />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                )}
                            </div>
                        </div>

                        {/* Quick Actions Panel */}
                        <div className="flex flex-col rounded-xl border border-border bg-card shadow-sm w-full">
                            <div className="flex flex-col gap-1 border-b border-border p-6">
                                <h3 className="text-lg font-semibold leading-none tracking-tight text-foreground">Quick Actions</h3>
                                <p className="text-sm text-muted-foreground">Jump directly to modules</p>
                            </div>
                            <div className="p-4 flex flex-col gap-2 w-full">
                                {quickActions
                                    .filter((a) => !a.superAdminOnly || role === 'SUPER_ADMIN')
                                    .map((action) => {
                                        const ActionIcon = action.icon;
                                        return (
                                            <button
                                                key={action.label}
                                                onClick={() => router.push(action.href)}
                                                className="group flex w-full items-center justify-between rounded-lg border border-border bg-background p-4 transition-all hover:border-primary/50 hover:bg-primary/5 hover:shadow-sm"
                                            >
                                                <div className="flex items-center gap-4">
                                                    <div className="rounded-md bg-secondary p-2 text-muted-foreground transition-colors group-hover:bg-primary/10 group-hover:text-primary">
                                                        <ActionIcon className="h-5 w-5" />
                                                    </div>
                                                    <span className="font-medium text-foreground transition-colors group-hover:text-primary">
                                                        {action.label}
                                                    </span>
                                                </div>
                                                <ArrowUpRight className="h-4 w-4 text-muted-foreground opacity-0 transition-all group-hover:opacity-100 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-primary" />
                                            </button>
                                        );
                                    })}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
