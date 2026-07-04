'use client';
import React, { createContext, useCallback, useContext, useState } from 'react';
import { Loader2 } from 'lucide-react';

const BlockingContext = createContext(null);

/** Hook to run an action while blocking all user interaction. */
export function useBlocking() {
    const ctx = useContext(BlockingContext);
    if (!ctx) throw new Error('useBlocking must be inside BlockingProvider');
    return ctx;
}

/**
 * Wrap the app with this to enable a full-screen blocking overlay.
 *
 * Use `runBlocking(async () => { ...mutate then refetch... }, 'Saving…')` to
 * run a mutation and its follow-up refetch while preventing the user from
 * interacting with anything until the fresh data is on screen.
 */
export function BlockingProvider({ children }) {
    const [state, setState] = useState({ active: false, message: '' });

    /**
     * Run `action` while a blocking overlay is shown. The overlay stays up for
     * the entire duration of `action` (mutation + refetch) and clears once it
     * settles, so the user only regains control after the changes are visible.
     * Returns whatever `action` resolves to.
     */
    const runBlocking = useCallback(async (action, message = 'Saving changes…') => {
        setState({ active: true, message });
        try {
            return await action();
        } finally {
            setState({ active: false, message: '' });
        }
    }, []);

    return (
        <BlockingContext.Provider value={{ runBlocking, isBlocking: state.active }}>
            {children}
            {state.active && (
                <div
                    className="fixed inset-0 z-[200] flex cursor-wait items-center justify-center bg-black/40 backdrop-blur-sm"
                    role="alertdialog"
                    aria-busy="true"
                    aria-live="assertive"
                    // Swallow every interaction that reaches the overlay so nothing
                    // underneath can be clicked, typed into, or scrolled meanwhile.
                    onClickCapture={(e) => { e.preventDefault(); e.stopPropagation(); }}
                    onKeyDownCapture={(e) => { e.preventDefault(); e.stopPropagation(); }}
                    onWheelCapture={(e) => { e.preventDefault(); e.stopPropagation(); }}
                >
                    <div className="flex flex-col items-center gap-3 rounded-xl border border-border bg-card px-8 py-6 shadow-lg">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        <p className="text-sm font-medium text-foreground">{state.message}</p>
                    </div>
                </div>
            )}
        </BlockingContext.Provider>
    );
}
