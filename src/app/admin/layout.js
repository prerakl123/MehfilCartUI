'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { ToastProvider } from '@/components/ui/Toast';
import Link from 'next/link';
import {
    LayoutDashboard,
    Store,
    Menu as MenuIcon, // renamed to avoid conflict
    Combine,
    Users,
    Package,
    Timer,
    LogOut,
    Menu,
    X,
    UtensilsCrossed,
    Moon,
    Sun,
    ChevronDown
} from 'lucide-react';

const NAV_ITEMS = [
    { section: 'Overview' },
    { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
    { section: 'Management' },
    { href: '/admin/restaurants', label: 'Restaurants', icon: Store, superAdminOnly: true },
    { href: '/admin/menu', label: 'Menu', icon: MenuIcon }, // using the renamed icon
    { href: '/admin/tables', label: 'Tables', icon: Combine },
    { href: '/admin/staff', label: 'Staff', icon: Users },
    { section: 'Operations' },
    { href: '/admin/orders', label: 'Live Orders', icon: Package },
    { href: '/admin/sessions', label: 'Sessions', icon: Timer },
];

export default function AdminLayout({ children }) {
    const router = useRouter();
    const pathname = usePathname();
    const { isAuthenticated, isLoading, initialize, user, role, logout } = useAuthStore();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [userMenuOpen, setUserMenuOpen] = useState(false);
    const [theme, setTheme] = useState('light');

    useEffect(() => {
        // Hydrate theme from localStorage on mount
        const savedTheme = localStorage.getItem('theme') || 'light';
        setTheme(savedTheme);
        if (savedTheme === 'dark') {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    }, []);

    const toggleTheme = () => {
        const newTheme = theme === 'light' ? 'dark' : 'light';
        setTheme(newTheme);
        localStorage.setItem('theme', newTheme);
        if (newTheme === 'dark') {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    };

    useEffect(() => {
        initialize();
    }, [initialize]);

    useEffect(() => {
        if (!isLoading && !isAuthenticated) {
            router.replace('/login');
        }
    }, [isLoading, isAuthenticated, router]);

    // Close mobile menu on route change
    useEffect(() => {
        setIsMobileMenuOpen(false);
    }, [pathname]);

    if (isLoading || !isAuthenticated) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-background">
                <div className="flex flex-col items-center gap-4">
                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
                    <p className="text-sm font-medium text-muted-foreground">Loading application...</p>
                </div>
            </div>
        );
    }

    const displayName = user?.display_name || 'Admin';
    const initials = displayName.slice(0, 2).toUpperCase();

    const SidebarContent = () => (
        <>
            <div className="flex h-16 shrink-0 items-center justify-between px-6 border-b border-border">
                <Link href="/admin" className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                        <UtensilsCrossed className="h-5 w-5" />
                    </div>
                    <span className="text-lg font-bold tracking-tight">MehfilCart</span>
                </Link>
                {/* Mobile Close Button */}
                <button
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="md:hidden rounded-md p-2 text-muted-foreground hover:bg-secondary"
                >
                    <X className="h-5 w-5" />
                </button>
            </div>

            <nav className="flex-1 overflow-y-auto p-4 space-y-1">
                {NAV_ITEMS.map((item, i) => {
                    if (item.section) {
                        return (
                            <div key={i} className="pt-4 pb-2 px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                                {item.section}
                            </div>
                        );
                    }

                    if (item.superAdminOnly && role !== 'SUPER_ADMIN') return null;

                    const isActive = pathname === item.href ||
                        (item.href !== '/admin' && pathname.startsWith(item.href));

                    const Icon = item.icon;

                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={`flex items-center gap-3 rounded-lg px-3 py-2 transition-colors ${isActive
                                ? 'bg-primary/10 text-primary font-medium'
                                : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
                                }`}
                        >
                            <Icon className={`h-5 w-5 ${isActive ? 'text-primary' : 'text-muted-foreground'}`} />
                            {item.label}
                        </Link>
                    );
                })}
            </nav>

            <div className="border-t border-border p-4 flex flex-col gap-2">
                <button
                    onClick={toggleTheme}
                    className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                >
                    {theme === 'light' ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
                    {theme === 'light' ? 'Dark Mode' : 'Light Mode'}
                </button>
                <div className="mt-2 flex items-center gap-3 rounded-lg bg-secondary/50 p-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/20 text-sm font-semibold text-primary">
                        {initials}
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="truncate text-sm font-medium text-foreground">{displayName}</div>
                        <div className="truncate text-xs text-muted-foreground">{role?.replace('_', ' ')}</div>
                    </div>
                </div>
                <button
                    onClick={logout}
                    className="mt-1 flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-destructive transition-colors hover:bg-destructive/10"
                >
                    <LogOut className="h-5 w-5" />
                    Sign Out
                </button>
            </div>
        </>
    );

    return (
        <ToastProvider>
            <div className="flex min-h-screen bg-secondary/20">
                {/* Desktop Sidebar */}
                <aside className="hidden md:flex w-64 flex-col border-r border-border bg-card shadow-sm fixed inset-y-0 z-20">
                    <SidebarContent />
                </aside>

                {/* Mobile Drawer Overlay */}
                {isMobileMenuOpen && (
                    <div
                        className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm md:hidden"
                        onClick={() => setIsMobileMenuOpen(false)}
                    />
                )}

                {/* Mobile Sidebar */}
                <aside className={`fixed inset-y-0 left-0 z-50 w-72 transform bg-card shadow-xl transition-transform duration-300 ease-in-out md:hidden ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
                    }`}>
                    <div className="flex h-full flex-col">
                        <SidebarContent />
                    </div>
                </aside>

                {/* Main Content Wrapper */}
                <div className="flex flex-1 flex-col md:pl-64 w-full">
                    {/* Mobile Header */}
                    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border bg-card px-4 shadow-sm md:hidden">
                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => setIsMobileMenuOpen(true)}
                                className="rounded-md p-2 -ml-2 text-muted-foreground hover:bg-secondary"
                            >
                                <Menu className="h-6 w-6" />
                            </button>
                            <span className="text-lg font-bold tracking-tight">MehfilCart</span>
                        </div>
                        <div className="relative">
                            <button
                                onClick={() => setUserMenuOpen(!userMenuOpen)}
                                className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/20 text-xs font-semibold text-primary transition-colors hover:bg-primary/30 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1 focus:ring-offset-background"
                            >
                                {initials}
                            </button>
                            {userMenuOpen && (
                                <>
                                    <div className="fixed inset-0 z-40" onClick={() => setUserMenuOpen(false)} />
                                    <div className="absolute right-0 mt-2 w-48 rounded-md border border-border bg-popover py-1 shadow-lg z-50 animate-in fade-in slide-in-from-top-2 text-popover-foreground">
                                        <div className="px-4 py-2 border-b border-border">
                                            <p className="text-sm font-medium">{displayName}</p>
                                            <p className="text-xs text-muted-foreground truncate">{role?.replace('_', ' ')}</p>
                                        </div>
                                        <button
                                            onClick={() => { toggleTheme(); setUserMenuOpen(false); }}
                                            className="flex w-full items-center gap-2 px-4 py-2 text-sm hover:bg-accent transition-colors"
                                        >
                                            {theme === 'light' ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
                                            {theme === 'light' ? 'Dark Mode' : 'Light Mode'}
                                        </button>
                                        <button
                                            onClick={() => { logout(); setUserMenuOpen(false); }}
                                            className="flex w-full items-center gap-2 px-4 py-2 text-sm text-destructive hover:bg-destructive/10 transition-colors"
                                        >
                                            <LogOut className="h-4 w-4" />
                                            Sign Out
                                        </button>
                                    </div>
                                </>
                            )}
                        </div>
                    </header>

                    {/* Main Content Area */}
                    <main className="flex-1 overflow-x-hidden w-full max-w-[100vw]">
                        <div className="mx-auto max-w-7xl p-4 md:p-6 lg:p-8 w-full">
                            {children}
                        </div>
                    </main>
                </div>
            </div>
        </ToastProvider>
    );
}
