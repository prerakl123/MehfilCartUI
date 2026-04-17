import { useState, useEffect } from 'react';
import { ChefHat, Flame, CheckCircle2, AlertCircle } from 'lucide-react';

/**
 * Animated Preparation Time Indicator.
 * @param {Array} items - List of items in the order containing `prep_time_minutes`.
 * @param {String} status - Current order status.
 * @param {String} submittedAt - ISO string of when order was submitted.
 */
export default function PrepTimeIndicator({ items = [], status, submittedAt }) {
    const [elapsedMinutes, setElapsedMinutes] = useState(0);

    // Calculate total expected prep time as the max of all item prep times
    // (Assuming items are prepared in parallel)
    const expectedPrepMinutes = Math.max(0, ...items.map(item => item.prep_time_minutes || 0));

    useEffect(() => {
        if (!submittedAt || status === 'COMPLETED' || status === 'CANCELLED' || status === 'SERVED') {
            return;
        }

        const updateClock = () => {
            const now = new Date();
            const started = new Date(submittedAt);
            const diffMs = now - started;
            setElapsedMinutes(Math.floor(diffMs / 60000));
        };

        updateClock();
        const timer = setInterval(updateClock, 30000); // 30 sec updates
        return () => clearInterval(timer);
    }, [submittedAt, status]);

    if (!expectedPrepMinutes) return null; // No prep time data

    // If order is done
    if (status === 'READY') {
        return (
            <div className="flex items-center gap-1.5 text-xs font-semibold text-success bg-success/10 px-2 py-1 rounded border border-success/20 w-max">
                <CheckCircle2 className="h-3.5 w-3.5" />
                Ready to Serve
            </div>
        );
    }

    if (status === 'SERVED' || status === 'COMPLETED') {
        return null;
    }

    if (status === 'RECEIVED') {
        return (
            <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground bg-secondary px-2 py-1 rounded w-max">
                Est. {expectedPrepMinutes}m prep
            </div>
        );
    }

    // Must be PREPARING
    const progressPercent = Math.min(100, (elapsedMinutes / expectedPrepMinutes) * 100);
    const isOverdue = elapsedMinutes > expectedPrepMinutes;

    return (
        <div className="flex flex-col gap-1 w-full mt-2">
            <div className="flex items-center justify-between text-xs font-medium">
                <div className={`flex items-center gap-1 ${isOverdue ? 'text-destructive' : 'text-warning-dark'}`}>
                    {isOverdue ? <AlertCircle className="h-3 w-3" /> : (
                         <div className="relative h-3 w-3 flex justify-center items-center">
                              <ChefHat className="h-3 w-3 absolute text-warning-dark" />
                         </div>
                    )}
                    <span>{isOverdue ? 'Overdue!' : 'Preparing...'}</span>
                </div>
                <span className={isOverdue ? 'text-destructive font-bold' : 'text-muted-foreground font-mono'}>
                    {elapsedMinutes} / {expectedPrepMinutes}m
                </span>
            </div>
            <div className="h-1.5 w-full bg-secondary rounded-full overflow-hidden">
                <div 
                    className={`h-full rounded-full transition-all duration-1000 ${
                        isOverdue ? 'bg-destructive animate-pulse' : progressPercent > 75 ? 'bg-orange-500' : 'bg-warning'
                    }`}
                    style={{ width: `${progressPercent}%` }}
                />
            </div>
        </div>
    );
}
