'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { ToastProvider } from '@/components/ui/Toast';
import styles from './admin.module.css';
import Link from 'next/link';

const NAV_ITEMS = [
    { section: 'Overview' },
    { href: '/admin', label: 'Dashboard', icon: '📊' },
    { section: 'Management' },
    { href: '/admin/restaurants', label: 'Restaurants', icon: '🍽️', superAdminOnly: true },
    { href: '/admin/menu', label: 'Menu', icon: '📋' },
    { href: '/admin/tables', label: 'Tables', icon: '🪑' },
    { href: '/admin/staff', label: 'Staff', icon: '👥' },
    { section: 'Operations' },
    { href: '/admin/orders', label: 'Live Orders', icon: '📦' },
    { href: '/admin/sessions', label: 'Sessions', icon: '⏱️' },
];

export default function AdminLayout({ children }) {
    const router = useRouter();
    const pathname = usePathname();
    const { isAuthenticated, isLoading, initialize, user, role, logout } = useAuthStore();

    useEffect(() => {
        initialize();
    }, [initialize]);

    useEffect(() => {
        if (!isLoading && !isAuthenticated) {
            router.replace('/login');
        }
    }, [isLoading, isAuthenticated, router]);

    if (isLoading || !isAuthenticated) {
        return (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100dvh' }}>
                <p>Loading...</p>
            </div>
        );
    }

    const displayName = user?.display_name || 'Admin';
    const initials = displayName.slice(0, 2).toUpperCase();

    return (
        <ToastProvider>
            <div className={styles.adminLayout}>
                {/* Sidebar */}
                <aside className={styles.sidebar}>
                    <div className={styles.sidebarBrand}>
                        <div className={styles.brandMark}>M</div>
                        <span className={styles.brandText}>MehfilCart</span>
                    </div>

                    <nav className={styles.nav}>
                        {NAV_ITEMS.map((item, i) => {
                            if (item.section) {
                                return (
                                    <div key={i} className={styles.navSection}>
                                        {item.section}
                                    </div>
                                );
                            }

                            // Hide super-admin-only items for regular admins
                            if (item.superAdminOnly && role !== 'SUPER_ADMIN') return null;

                            const isActive = pathname === item.href ||
                                (item.href !== '/admin' && pathname.startsWith(item.href));

                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className={`${styles.navItem} ${isActive ? styles.navItemActive : ''}`}
                                >
                                    <span className={styles.navIcon}>{item.icon}</span>
                                    {item.label}
                                </Link>
                            );
                        })}
                    </nav>

                    <div className={styles.sidebarFooter}>
                        <div className={styles.userInfo}>
                            <div className={styles.userAvatar}>{initials}</div>
                            <div>
                                <div className={styles.userName}>{displayName}</div>
                                <div className={styles.userRole}>{role?.replace('_', ' ')}</div>
                            </div>
                        </div>
                        <button
                            onClick={logout}
                            style={{
                                marginTop: 'var(--space-3)',
                                width: '100%',
                                padding: 'var(--space-2) var(--space-4)',
                                borderRadius: 'var(--radius-md)',
                                fontSize: 'var(--font-size-sm)',
                                color: 'var(--color-error)',
                                textAlign: 'left',
                            }}
                        >
                            ← Logout
                        </button>
                    </div>
                </aside>

                {/* Main Content */}
                <main className={styles.main}>
                    <div className={styles.content}>
                        {children}
                    </div>
                </main>
            </div>
        </ToastProvider>
    );
}
