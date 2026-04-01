import { 
    Timer, Package, CircleDollarSign, Combine, 
    ArrowUpRight, ArrowDownRight, Menu as MenuIcon, Users, Store, Flame, Ghost
} from 'lucide-react';
import {
    AreaChart, Area,
    PieChart, Pie, Cell,
    BarChart, Bar,
    ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid, Legend
} from 'recharts';

export default function RestaurantDashboard({ data, router, role }) {
    if (!data) return null;

    const quickActions = [
        { label: 'Manage Restaurants', icon: Store, href: '/admin/restaurants', superAdminOnly: true },
        { label: 'Manage Menu', icon: MenuIcon, href: '/admin/menu' },
        { label: 'Manage Tables', icon: Combine, href: '/admin/tables' },
        { label: 'View Live Orders', icon: Package, href: '/admin/orders' },
        { label: 'Manage Staff', icon: Users, href: '/admin/staff' },
    ];

    const kpiCards = [
        {
            label: 'Active Sessions',
            value: data.active_sessions,
            icon: Timer,
            color: 'text-blue-500',
            bgColor: 'bg-blue-500/10',
            subtitle: `${data.table_occupancy_rate}% occupancy`,
        },
        {
            label: 'Orders Today',
            value: data.orders_today,
            icon: Package,
            color: 'text-purple-500',
            bgColor: 'bg-purple-500/10',
            trend: `${data.orders_trend > 0 ? '+' : ''}${data.orders_trend}%`,
            trendUp: data.orders_trend >= 0
        },
        {
            label: 'Revenue Today',
            value: `₹${data.revenue_today?.toLocaleString('en-IN')}`,
            icon: CircleDollarSign,
            color: 'text-emerald-500',
            bgColor: 'bg-emerald-500/10',
            trend: `${data.revenue_trend > 0 ? '+' : ''}${data.revenue_trend}%`,
            trendUp: data.revenue_trend >= 0
        },
        {
            label: 'Average Order Value',
            value: `₹${data.average_order_value?.toLocaleString('en-IN')}`,
            icon: Combine,
            color: 'text-orange-500',
            bgColor: 'bg-orange-500/10',
            subtitle: `Live (Pre/Rdy): ${data.live_orders_preparing} / ${data.live_orders_ready}`
        },
    ];

    const COLORS = ['hsl(var(--primary))', '#8b5cf6', '#3b82f6', '#f59e0b', '#ef4444', '#10b981'];

    const CustomTooltip = ({ active, payload, label, prefix = '' }) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-popover border border-border shadow-xl rounded-xl p-3 flex flex-col gap-1 z-50">
                    <p className="text-sm font-semibold text-foreground mb-1">{label}</p>
                    {payload.map((entry, index) => (
                        <p key={index} className="text-sm font-medium flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }}></span>
                            <span className="text-muted-foreground">{entry.name}:</span>
                            <span className="font-semibold" style={{ color: entry.color }}>
                                {prefix}{entry.value?.toLocaleString('en-IN')}
                            </span>
                        </p>
                    ))}
                </div>
            );
        }
        return null;
    };

    return (
        <div className="flex flex-col gap-6 w-full pb-8">
            {/* KPI Cards Grid */}
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
                            
                            <div className="mt-4 flex flex-col gap-1">
                                <div className="flex items-baseline gap-2">
                                    <h2 className="text-3xl font-extrabold tracking-tighter text-foreground">{stat.value}</h2>
                                    {stat.trendUp !== undefined && (
                                        <span className={`flex items-center text-xs font-semibold px-1.5 py-0.5 rounded-full ${stat.trendUp ? 'text-emerald-600 bg-emerald-500/10' : 'text-red-500 bg-red-500/10'}`}>
                                            {stat.trendUp ? <ArrowUpRight className="mr-0.5 h-3 w-3" /> : <ArrowDownRight className="mr-0.5 h-3 w-3" />}
                                            {stat.trend}
                                        </span>
                                    )}
                                </div>
                                {stat.subtitle && (
                                    <p className="text-xs font-medium text-muted-foreground mt-1 bg-secondary/60 w-fit px-2 py-0.5 rounded-full">
                                        {stat.subtitle}
                                    </p>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 w-full">
                {/* Revenue Chart */}
                <div className="lg:col-span-2 flex flex-col rounded-2xl border border-border bg-card shadow-sm w-full relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-50 pointer-events-none"></div>
                    <div className="flex flex-col gap-1 border-b border-border p-6 z-10 bg-card/50 backdrop-blur-sm">
                        <h3 className="text-xl font-bold leading-none tracking-tight text-foreground">Revenue Analytics</h3>
                        <p className="text-sm text-muted-foreground font-medium">Hourly revenue & order volume overview for today</p>
                    </div>
                    <div className="p-6 h-[380px] w-full relative z-10">
                        {(!data.hourly_trend || data.hourly_trend.length === 0) ? (
                            <div className="absolute inset-0 flex items-center justify-center">
                                <p className="text-sm text-muted-foreground font-medium">No order data available for today yet.</p>
                            </div>
                        ) : (
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={data.hourly_trend} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id="colorRevs" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.4} />
                                            <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" strokeOpacity={0.5} />
                                    <XAxis dataKey="time" stroke="currentColor" className="text-muted-foreground text-xs font-medium" tickLine={false} axisLine={false} dy={10} />
                                    <YAxis yAxisId="left" stroke="currentColor" className="text-muted-foreground text-xs font-medium" tickLine={false} axisLine={false} tickFormatter={(value) => `₹${value}`} width={60} />
                                    <YAxis yAxisId="right" orientation="right" stroke="currentColor" className="text-muted-foreground text-xs font-medium" tickLine={false} axisLine={false} width={40} />
                                    <Tooltip content={<CustomTooltip />} />
                                    <Area yAxisId="left" type="monotone" name="Revenue" dataKey="revenue" stroke="hsl(var(--primary))" strokeWidth={3} fillOpacity={1} fill="url(#colorRevs)" activeDot={{ r: 6, strokeWidth: 0, fill: "hsl(var(--primary))" }} />
                                    <Area yAxisId="right" type="step" name="Orders" dataKey="orders" stroke="#8b5cf6" strokeWidth={2} fill="transparent" />
                                </AreaChart>
                            </ResponsiveContainer>
                        )}
                    </div>
                </div>

                {/* Category Pie Chart */}
                <div className="flex flex-col rounded-2xl border border-border bg-card shadow-sm w-full relative overflow-hidden">
                    <div className="flex flex-col gap-1 border-b border-border p-6 z-10 bg-card/50 backdrop-blur-sm">
                        <h3 className="text-xl font-bold leading-none tracking-tight text-foreground">Sales by Category</h3>
                        <p className="text-sm text-muted-foreground font-medium">Revenue split for today</p>
                    </div>
                    <div className="p-4 h-[380px] w-full relative z-10 flex items-center justify-center">
                        {(!data.category_sales || data.category_sales.length === 0) ? (
                            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
                                <PieChart className="h-8 w-8 text-muted-foreground/30" />
                                <p className="text-sm text-muted-foreground font-medium">No sales data available.</p>
                            </div>
                        ) : (
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={data.category_sales}
                                        cx="50%"
                                        cy="45%"
                                        innerRadius={70}
                                        outerRadius={100}
                                        paddingAngle={5}
                                        dataKey="revenue"
                                        nameKey="category"
                                        stroke="none"
                                        cornerIsRadius
                                    >
                                        {data.category_sales.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip content={<CustomTooltip prefix="₹" />} />
                                    <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '12px', fontWeight: 500 }} />
                                </PieChart>
                            </ResponsiveContainer>
                        )}
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 w-full">
                
                {/* Menu Engineering (Top vs Bottom) */}
                <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Top Items */}
                    <div className="flex flex-col rounded-2xl border border-border bg-card shadow-sm w-full">
                        <div className="flex items-center gap-2 border-b border-border p-4 bg-emerald-500/5">
                            <Flame className="h-5 w-5 text-emerald-500" />
                            <h3 className="text-lg font-bold leading-none tracking-tight text-foreground">Top Best-Sellers</h3>
                        </div>
                        <div className="p-4 flex flex-col gap-3">
                            {(!data.top_items || data.top_items.length === 0) ? (
                                <p className="text-sm text-muted-foreground text-center py-4">No top items yet.</p>
                            ) : (
                                data.top_items.map((item, i) => (
                                    <div key={i} className="flex flex-col gap-1">
                                        <div className="flex justify-between items-center text-sm">
                                            <span className="font-semibold">{item.name}</span>
                                            <span className="text-muted-foreground font-medium">{item.orders} ord</span>
                                        </div>
                                        <div className="w-full bg-secondary h-2 rounded-full overflow-hidden">
                                            <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${Math.max((item.orders / data.top_items[0].orders) * 100, 5)}%` }}></div>
                                        </div>
                                        <span className="text-xs text-muted-foreground w-full text-right">₹{item.revenue.toLocaleString('en-IN')}</span>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    {/* Dead Stock */}
                    <div className="flex flex-col rounded-2xl border border-border bg-card shadow-sm w-full">
                        <div className="flex items-center gap-2 border-b border-border p-4 bg-red-500/5">
                            <Ghost className="h-5 w-5 text-red-500" />
                            <h3 className="text-lg font-bold leading-none tracking-tight text-foreground">Dead Stock</h3>
                        </div>
                        <div className="p-4 flex flex-col gap-3">
                            {(!data.dead_stock || data.dead_stock.length === 0) ? (
                                <p className="text-sm text-muted-foreground text-center py-4">No dead items yet.</p>
                            ) : (
                                data.dead_stock.map((item, i) => (
                                    <div key={i} className="flex flex-col gap-1">
                                        <div className="flex justify-between items-center text-sm">
                                            <span className="font-semibold">{item.name}</span>
                                            <span className="text-muted-foreground font-medium">{item.orders} ord</span>
                                        </div>
                                        <div className="w-full bg-secondary h-2 rounded-full overflow-hidden">
                                            <div className="bg-red-500 h-full rounded-full" style={{ width: `${Math.min((item.orders / (data.top_items[0]?.orders || 1)) * 100, 100)}%` }}></div>
                                        </div>
                                        <span className="text-xs text-muted-foreground w-full text-right">₹{item.revenue.toLocaleString('en-IN')}</span>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>

                {/* Quick Actions Panel */}
                <div className="flex flex-col rounded-2xl border border-border bg-card shadow-sm w-full h-fit">
                    <div className="flex flex-col gap-1 border-b border-border p-6 bg-card/50 backdrop-blur-sm">
                        <h3 className="text-xl font-bold leading-none tracking-tight text-foreground">Quick Actions</h3>
                        <p className="text-sm text-muted-foreground font-medium">Jump directly to modules</p>
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
                                        className="group flex w-full items-center justify-between rounded-xl border border-border bg-background p-4 transition-all hover:border-primary/50 hover:bg-primary/5 hover:shadow-sm"
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className="rounded-lg bg-secondary p-2.5 text-muted-foreground transition-colors group-hover:bg-primary/10 group-hover:text-primary">
                                                <ActionIcon className="h-5 w-5" />
                                            </div>
                                            <span className="font-semibold text-foreground tracking-tight transition-colors group-hover:text-primary">
                                                {action.label}
                                            </span>
                                        </div>
                                        <ArrowUpRight className="h-5 w-5 text-muted-foreground opacity-0 transition-all group-hover:opacity-100 group-hover:translate-x-1 group-hover:-translate-y-1 group-hover:text-primary stroke-[2.5]" />
                                    </button>
                                );
                            })}
                    </div>
                </div>
            </div>
        </div>
    );
}
