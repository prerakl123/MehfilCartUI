'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import ProfileModal from '@/components/admin/ProfileModal';
import { UtensilsCrossed, LogOut, UserCircle } from 'lucide-react';
import Button from '@/components/ui/Button';

export default function StaffLayout({ children }) {
    const router = useRouter();
    const pathname = usePathname();
    const { isAuthenticated, isLoading, initialize, role, user, logout } = useAuthStore();
    const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

    useEffect(() => {
        initialize();
    }, [initialize]);

    useEffect(() => {
        if (!isLoading) {
            if (!isAuthenticated) {
                router.replace('/login');
            } else if (role !== 'WAITER') {
                router.replace('/');
            }
        }
    }, [isLoading, isAuthenticated, role, router]);

    const handleLogout = async () => {
        await logout();
        router.replace('/');
    };

    if (isLoading || !isAuthenticated || role !== 'WAITER') {
        return (
            <div className="flex min-h-screen items-center justify-center bg-background">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background">
            {/* Top Navigation */}
            <header className="sticky top-0 z-40 border-b border-border bg-card/80 backdrop-blur-md">
                <div className="flex h-16 items-center justify-between px-4 sm:px-6">
                    <div className="flex items-center gap-2 cursor-pointer" onClick={() => router.push('/staff')}>
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground">
                            <UtensilsCrossed className="h-5 w-5" />
                        </div>
                        <span className="text-xl font-bold tracking-tight text-foreground hidden sm:inline-block">
                            Staff Portal
                        </span>
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="h-8 w-px bg-border mx-1"></div>

                        <button
                            onClick={() => setIsProfileModalOpen(true)}
                            className="flex items-center gap-2 rounded-full p-1 pr-3 transition-colors hover:bg-secondary border border-transparent hover:border-border"
                        >
                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary">
                                <UserCircle className="h-5 w-5" />
                            </div>
                            <span className="text-sm font-medium text-foreground max-w-[100px] truncate">
                                {user?.display_name || 'Staff'}
                            </span>
                        </button>
                        
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={handleLogout}
                            className="text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                            title="Sign Out"
                        >
                            <LogOut className="h-5 w-5" />
                        </Button>
                    </div>
                </div>
            </header>

            {/* Main Content Area */}
            <main className="mx-auto max-w-7xl p-4 sm:p-6 lg:p-8">
                {children}
            </main>

            <ProfileModal isOpen={isProfileModalOpen} onClose={() => setIsProfileModalOpen(false)} />
        </div>
    );
}
