'use client';

import { useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';
import { ToastProvider } from '@/components/ui/Toast';

export default function JoinLayout({ children }) {
    const { initialize } = useAuthStore();

    useEffect(() => {
        initialize();
    }, [initialize]);

    return (
        <ToastProvider>
            {children}
        </ToastProvider>
    );
}
