'use client';
import React, { createContext, useCallback, useContext, useState } from 'react';
import { CheckCircle2, AlertCircle, Info, AlertTriangle } from 'lucide-react';

const ToastContext = createContext(null);

/** Hook to trigger toast notifications from anywhere. */
export function useToast() {
    const ctx = useContext(ToastContext);
    if (!ctx) throw new Error('useToast must be inside ToastProvider');
    return ctx;
}

/** Wrap the app with this to enable toast notifications. */
export function ToastProvider({ children }) {
    const [toasts, setToasts] = useState([]);

    const addToast = useCallback((message, type = 'info', duration = 4000) => {
        const id = Date.now();
        setToasts((prev) => [...prev, { id, message, type }]);
        setTimeout(() => {
            setToasts((prev) => prev.filter((t) => t.id !== id));
        }, duration);
    }, []);

    const toast = React.useMemo(() => ({
        success: (msg) => addToast(msg, 'success'),
        error: (msg) => addToast(msg, 'error'),
        warning: (msg) => addToast(msg, 'warning'),
        info: (msg) => addToast(msg, 'info'),
    }), [addToast]);

    const getIcon = (type) => {
        switch (type) {
            case 'success': return <CheckCircle2 className="h-5 w-5 text-green-500" />;
            case 'error': return <AlertCircle className="h-5 w-5 text-red-500" />;
            case 'warning': return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
            default: return <Info className="h-5 w-5 text-blue-500" />;
        }
    };

    const getBgColor = (type) => {
        switch (type) {
            case 'success': return 'border-green-200 bg-green-50 dark:border-green-900/50 dark:bg-green-950';
            case 'error': return 'border-red-200 bg-red-50 dark:border-red-900/50 dark:bg-red-950';
            case 'warning': return 'border-yellow-200 bg-yellow-50 dark:border-yellow-900/50 dark:bg-yellow-950';
            default: return 'border-blue-200 bg-blue-50 dark:border-blue-900/50 dark:bg-blue-950';
        }
    };

    return (
        <ToastContext.Provider value={toast}>
            {children}
            <div className="fixed bottom-4 right-4 z-[100] flex max-w-sm flex-col gap-2">
                {toasts.map((t) => (
                    <div
                        key={t.id}
                        className={`pointer-events-auto flex w-full items-center gap-3 overflow-hidden rounded-lg border p-4 shadow-lg transition-all ${getBgColor(t.type)}`}
                    >
                        {getIcon(t.type)}
                        <p className="text-sm font-medium text-foreground">
                            {t.message}
                        </p>
                    </div>
                ))}
            </div>
        </ToastContext.Provider>
    );
}
