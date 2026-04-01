import { 
    Activity, ArrowUpRight, ArrowDownRight, CircleDollarSign, 
    Store, Users
} from 'lucide-react';
import {
    AreaChart, Area, BarChart, Bar, Cell,
    LineChart, Line,
    ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid
} from 'recharts';

/**
 * SuperAdminDashboard -- Global overview utilizing real platform data.
 * @param {{ data: SuperAdminDashboardStats, router: import('next/navigation').AppRouterInstance }} props
 */
export default function SuperAdminDashboard({ data, router }) {
    if (!data) return null;

    const kpiCards = [
        {
            label: 'Total GMV Today',
            value: `₹${data.total_gmv_today?.toLocaleString('en-IN')}`,
            icon: CircleDollarSign,
            color: 'text-emerald-500',
            bgColor: 'bg-emerald-500/10',
            trend: `${data.gmv_trend > 0 ? '+' : ''}${data.gmv_trend}%`,
            trendUp: data.gmv_trend >= 0
        },
        {
            label: 'Total Platform Orders',
            value: data.total_orders_today?.toLocaleString('en-IN'),
            icon: Activity,
            color: 'text-blue-500',
            bgColor: 'bg-blue-500/10',
        },
        {
            label: 'Active Restaurants',
            value: data.total_active_restaurants,
            icon: Store,
            color: 'text-violet-500',
            bgColor: 'bg-violet-500/10',
        },
        {
            label: 'Global Active Sessions',
            value: data.global_active_sessions,
            icon: Users,
            color: 'text-amber-500',
            bgColor: 'bg-amber-500/10',
        },
    ];

    const CustomTooltip = ({ active, payload, label, prefix = '' }) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-popover border border-border shadow-xl rounded-xl p-3 flex flex-col gap-1">
                    <p className="text-sm font-semibold text-foreground mb-1">{label}</p>
                    {payload.map((entry, index) => (
                        <p key={index} className="text-sm font-medium" style={{ color: entry.color }}>
                            {entry.name}: {prefix}{entry.value?.toLocaleString('en-IN')}
                        </p>
                    ))}
                </div>
            );
        }
        return null;
    };

    return (
        <div className="flex flex-col gap-6 w-full">
            {/* KPI Cards */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 w-full">
                {kpiCards.map((stat) => {
                    const Icon = stat.icon;
                    return (
                        <div key={stat.label} className="group relative overflow-hidden flex flex-col justify-between rounded-2xl border border-border bg-card p-6 shadow-sm transition-all hover:shadow-lg hover:-translate-y-1">
                            <div className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-transparent via-primary/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                            <div className="flex items-center justify-between">
                                <p className="text-sm tracking-tight font-medium text-muted-foreground">{stat.label}</p>
                                <div className={`p-2 rounded-xl transition-colors ${stat.bgColor} group-hover:bg-opacity-80`}>
                                    <Icon className={`h-5 w-5 ${stat.color}`} />
                                </div>
                            </div>
                            <div className="mt-6 flex items-baseline gap-2">
                                <h2 className="text-3xl font-extrabold tracking-tighter text-foreground">{stat.value}</h2>
                                {stat.trendUp !== undefined && (
                                    <span className={`flex items-center text-xs font-semibold px-1.5 py-0.5 rounded-full ${stat.trendUp ? 'text-emerald-600 bg-emerald-500/10' : 'text-red-500 bg-red-500/10'}`}>
                                        {stat.trendUp ? <ArrowUpRight className="mr-0.5 h-3 w-3" /> : <ArrowDownRight className="mr-0.5 h-3 w-3" />}
                                        {stat.trend}
                                    </span>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 w-full">
                {/* Platform Growth Trend */}
                <div className="flex flex-col rounded-2xl border border-border bg-card shadow-sm w-full relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-50 pointer-events-none"></div>
                    <div className="flex flex-col gap-1 border-b border-border p-6 z-10 bg-card/50 backdrop-blur-sm">
                        <h3 className="text-xl font-bold leading-none tracking-tight text-foreground">Platform Growth</h3>
                        <p className="text-sm text-muted-foreground font-medium">Last 7 days daily GMV & Revenue generation</p>
                    </div>
                    <div className="p-6 h-[380px] w-full relative z-10">
                        {(!data.platform_growth_trend || data.platform_growth_trend.length === 0) ? (
                            <div className="absolute inset-0 flex items-center justify-center">
                                <p className="text-sm text-muted-foreground">Not enough historical data.</p>
                            </div>
                        ) : (
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={data.platform_growth_trend} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id="colorGrowth" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.6} />
                                            <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" strokeOpacity={0.5} />
                                    <XAxis dataKey="date" stroke="currentColor" className="text-muted-foreground text-xs font-medium" tickLine={false} axisLine={false} dy={10} />
                                    <YAxis stroke="currentColor" className="text-muted-foreground text-xs font-medium" tickLine={false} axisLine={false} tickFormatter={(value) => `₹${value}`} width={60} />
                                    <Tooltip content={<CustomTooltip prefix="₹" />} />
                                    <Area type="monotone" name="Revenue" dataKey="revenue" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorGrowth)" />
                                </AreaChart>
                            </ResponsiveContainer>
                        )}
                    </div>
                </div>

                {/* Top Performing Restaurants */}
                <div className="flex flex-col rounded-2xl border border-border bg-card shadow-sm w-full relative overflow-hidden">
                    <div className="flex flex-col gap-1 border-b border-border p-6 z-10 bg-card/50 backdrop-blur-sm">
                        <h3 className="text-xl font-bold leading-none tracking-tight text-foreground">Top Performing Entities</h3>
                        <p className="text-sm text-muted-foreground font-medium">Last 30 days revenue leaders</p>
                    </div>
                    <div className="p-6 h-[380px] w-full relative z-10">
                        {(!data.top_restaurants || data.top_restaurants.length === 0) ? (
                            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
                                <Store className="h-8 w-8 text-muted-foreground/30" />
                                <p className="text-sm text-muted-foreground font-medium">No order data available yet.</p>
                            </div>
                        ) : (
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={data.top_restaurants} layout="vertical" margin={{ top: 0, right: 0, left: 10, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="var(--border)" strokeOpacity={0.5} />
                                    <XAxis type="number" stroke="currentColor" className="text-muted-foreground text-xs font-medium" tickLine={false} axisLine={false} tickFormatter={(value) => `₹${value}`} />
                                    <YAxis type="category" dataKey="name" stroke="currentColor" className="text-foreground text-xs font-semibold" tickLine={false} axisLine={false} width={100} />
                                    <Tooltip content={<CustomTooltip prefix="₹" />} cursor={{ fill: 'var(--muted)', opacity: 0.4 }} />
                                    <Bar dataKey="revenue" name="Revenue generated" radius={[0, 6, 6, 0]}>
                                        {
                                            data.top_restaurants.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={`hsl(var(--primary))`} opacity={1 - (index * 0.15)} />
                                            ))
                                        }
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        )}
                    </div>
                </div>

                {/* Global Hourly Trend */}
                <div className="lg:col-span-2 flex flex-col rounded-2xl border border-border bg-card shadow-sm w-full">
                    <div className="flex flex-col gap-1 border-b border-border p-6 bg-card/50 backdrop-blur-sm">
                        <h3 className="text-xl font-bold leading-none tracking-tight text-foreground">Platform Traffic Today</h3>
                        <p className="text-sm text-muted-foreground font-medium">Hourly order volume and revenue generation</p>
                    </div>
                    <div className="p-6 h-[350px] w-full">
                        {(!data.global_hourly_trend || data.global_hourly_trend.length === 0) ? (
                            <div className="flex h-full items-center justify-center space-x-2">
                                <Activity className="h-5 w-5 animate-pulse text-muted-foreground" />
                                <p className="text-sm text-muted-foreground font-medium">Awaiting today's traffic.</p>
                            </div>
                        ) : (
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={data.global_hourly_trend} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" strokeOpacity={0.5} />
                                    <XAxis dataKey="time" stroke="currentColor" className="text-muted-foreground text-xs font-medium" tickLine={false} axisLine={false} dy={10} />
                                    <YAxis stroke="currentColor" className="text-muted-foreground text-xs font-medium" tickLine={false} axisLine={false} tickFormatter={(value) => `₹${value}`} width={60} />
                                    <Tooltip content={<CustomTooltip prefix="₹" />} />
                                    <Line type="smooth" name="Revenue" dataKey="revenue" stroke="hsl(var(--primary))" strokeWidth={3} dot={{ strokeWidth: 2, r: 4, fill: "hsl(var(--background))" }} activeDot={{ r: 6, strokeWidth: 0, fill: "hsl(var(--primary))" }} />
                                </LineChart>
                            </ResponsiveContainer>
                        )}
                    </div>
                </div>

            </div>
        </div>
    );
}
