'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { useToast } from '@/components/ui/Toast';
import { Bell, Droplets, Receipt, UtensilsCrossed, Sparkles, X, ChevronRight } from 'lucide-react';
import Button from '@/components/ui/Button';

const ACTION_CONFIG = {
    CALL_WAITER: { label: 'Waiter Requested', icon: Bell, color: 'text-blue-400', bg: 'bg-blue-400/20' },
    TABLE_CLEANUP: { label: 'Table Cleanup', icon: Sparkles, color: 'text-amber-400', bg: 'bg-amber-400/20' },
    WATER_REFILL: { label: 'Water Refill', icon: Droplets, color: 'text-cyan-400', bg: 'bg-cyan-400/20' },
    EXTRA_CUTLERY: { label: 'Extra Cutlery', icon: UtensilsCrossed, color: 'text-emerald-400', bg: 'bg-emerald-400/20' },
    BILL_REQUEST: { label: 'Bill Request', icon: Receipt, color: 'text-purple-400', bg: 'bg-purple-400/20' },
};

export default function ServiceActionPopup({ action, onDismiss, onClaimed }) {
    const toast = useToast();
    const [loading, setLoading] = useState(false);
    const [progress, setProgress] = useState(100);

    // Auto-dismiss after 15 seconds if not claimed
    useEffect(() => {
        let startTime = Date.now();
        const duration = 15000;
        
        const timer = setInterval(() => {
            const elapsed = Date.now() - startTime;
            const newProgress = Math.max(0, 100 - (elapsed / duration) * 100);
            setProgress(newProgress);
            
            if (elapsed >= duration) {
                clearInterval(timer);
                onDismiss(action.id);
            }
        }, 50);

        return () => clearInterval(timer);
    }, [action.id, onDismiss]);

    const handleClaim = async () => {
        setLoading(true);
        try {
            const resp = await api.patch(`/service-actions/${action.id}/claim`);
            toast.success(`Claimed request for Table ${action.table_label}`);
            onClaimed(resp);
        } catch (err) {
            toast.error('Failed to claim request');
            onDismiss(action.id);
        } finally {
            setLoading(false);
        }
    };

    const config = ACTION_CONFIG[action.action_type] || ACTION_CONFIG.CALL_WAITER;
    const Icon = config.icon;

    return (
        <div className="pointer-events-auto relative mb-3 w-full max-w-sm overflow-hidden rounded-2xl border border-white/10 bg-slate-900/90 p-4 shadow-2xl backdrop-blur-xl animate-in slide-in-from-top-4 fade-in duration-300 z-[100]">
            <button 
                onClick={() => onDismiss(action.id)} 
                className="absolute right-3 top-3 rounded-full p-1 text-slate-400 transition-colors hover:bg-white/10 hover:text-white"
            >
                <X className="h-4 w-4" />
            </button>

            <div className="flex items-center gap-4">
                <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${config.bg}`}>
                    <Icon className={`h-6 w-6 ${config.color}`} />
                </div>
                
                <div className="flex-1 pr-6">
                    <div className="flex items-center gap-2">
                        <span className="rounded bg-white/20 px-1.5 py-0.5 font-mono text-xs font-bold text-white">
                            {action.table_label}
                        </span>
                        <span className="text-xs font-medium text-slate-400">Just now</span>
                    </div>
                    <h4 className="mt-0.5 font-bold text-white leading-tight">{config.label}</h4>
                </div>
            </div>

            <div className="mt-4 flex gap-2">
                <Button 
                    size="sm" 
                    className="flex-1 bg-white text-slate-900 hover:bg-slate-200"
                    onClick={handleClaim}
                    loading={loading}
                >
                    Claim Request
                    <ChevronRight className="ml-1 h-4 w-4" />
                </Button>
            </div>

            {/* Progress bar at the bottom */}
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/5">
                <div 
                    className={`h-full bg-slate-300 transition-all duration-75 ease-linear`}
                    style={{ width: `${progress}%` }}
                />
            </div>
        </div>
    );
}
