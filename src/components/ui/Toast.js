'use client';
import { createContext, useCallback, useContext, useState } from 'react';
import styles from './Toast.module.css';

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

    const toast = {
        success: (msg) => addToast(msg, 'success'),
        error: (msg) => addToast(msg, 'error'),
        warning: (msg) => addToast(msg, 'warning'),
        info: (msg) => addToast(msg, 'info'),
    };

    return (
        <ToastContext.Provider value={toast}>
            {children}
            <div className={styles.toast}>
                {toasts.map((t) => (
                    <div key={t.id} className={`${styles.item} ${styles[t.type]}`}>
                        {t.message}
                    </div>
                ))}
            </div>
        </ToastContext.Provider>
    );
}
