/**
 * useTimer hook — countdown timer for session expiry.
 * Independent hook ready to be wired into view components.
 */

import { useState, useEffect, useCallback } from 'react';

export function useTimer(initialSeconds = 0) {
    const [seconds, setSeconds] = useState(initialSeconds);
    const [isRunning, setIsRunning] = useState(false);

    useEffect(() => {
        if (!isRunning || seconds <= 0) return;

        const interval = setInterval(() => {
            setSeconds((prev) => {
                if (prev <= 1) {
                    setIsRunning(false);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(interval);
    }, [isRunning, seconds]);

    const start = useCallback((secs) => {
        if (secs !== undefined) setSeconds(secs);
        setIsRunning(true);
    }, []);

    const pause = useCallback(() => setIsRunning(false), []);
    const reset = useCallback((secs) => {
        setSeconds(secs || initialSeconds);
        setIsRunning(false);
    }, [initialSeconds]);

    return { seconds, isRunning, start, pause, reset, isExpired: seconds === 0 && !isRunning };
}
