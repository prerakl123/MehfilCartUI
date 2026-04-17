'use client';

import { useState } from 'react';
import { api } from '@/lib/api';
import { useToast } from '@/components/ui/Toast';
import { Bell, Droplets, Receipt, UtensilsCrossed, Sparkles, X, ChevronUp, ChevronDown } from 'lucide-react';
import Button from '@/components/ui/Button';

const ACTIONS = [
    { id: 'CALL_WAITER', label: 'Call Waiter', icon: Bell, color: 'text-blue-500', bg: 'bg-blue-50' },
    { id: 'TABLE_CLEANUP', label: 'Clean Table', icon: Sparkles, color: 'text-amber-500', bg: 'bg-amber-50' },
    { id: 'WATER_REFILL', label: 'Water', icon: Droplets, color: 'text-cyan-500', bg: 'bg-cyan-50' },
    { id: 'EXTRA_CUTLERY', label: 'Cutlery', icon: UtensilsCrossed, color: 'text-emerald-500', bg: 'bg-emerald-50' },
    { id: 'BILL_REQUEST', label: 'Bill', icon: Receipt, color: 'text-purple-500', bg: 'bg-purple-50' },
];

export default function QuickActionsBar({ sessionId }) {
    const toast = useToast();
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(null); // id of action currently loading

    const handleActionClick = async (actionId) => {
        setLoading(actionId);
        try {
            await api.post(`/sessions/${sessionId}/service-actions`, { action_type: actionId });
            toast.success('Request sent to staff!');
            setIsOpen(false);
        } catch (err) {
            toast.error(err.message || 'Failed to send request');
        } finally {
            setLoading(null);
        }
    };

    return (
        <div className="fixed bottom-20 left-0 right-0 z-40 mx-auto w-full max-w-md px-4 sm:bottom-6 sm:left-auto sm:right-6 sm:w-auto sm:max-w-[300px] sm:px-0 pointer-events-none">
            {/* Quick Actions Panel */}
            <div 
                className={`pointer-events-auto absolute bottom-16 left-4 right-4 sm:left-auto sm:right-0 sm:w-[280px] origin-bottom rounded-2xl border border-border bg-card/95 p-4 shadow-xl backdrop-blur-xl transition-all duration-300 ease-out ${
                    isOpen ? 'scale-100 opacity-100 translate-y-0' : 'scale-95 opacity-0 translate-y-4 pointer-events-none'
                }`}
            >
                <div className="mb-3 flex items-center justify-between">
                    <h4 className="font-semibold text-foreground">Service Request</h4>
                    <button onClick={() => setIsOpen(false)} className="rounded-full p-1 text-muted-foreground hover:bg-secondary">
                        <X className="h-4 w-4" />
                    </button>
                </div>
                <div className="grid grid-cols-3 gap-3">
                    {ACTIONS.map((action) => {
                        const Icon = action.icon;
                        const isThisLoading = loading === action.id;
                        return (
                            <button
                                key={action.id}
                                onClick={() => handleActionClick(action.id)}
                                disabled={loading !== null}
                                className={`flex flex-col items-center gap-2 rounded-xl border border-border bg-background p-3 transition-all hover:border-primary/50 hover:shadow-sm disabled:opacity-50 ${isThisLoading ? 'animate-pulse' : ''}`}
                            >
                                <div className={`flex h-10 w-10 items-center justify-center rounded-full ${action.bg} ${action.color}`}>
                                    {isThisLoading ? (
                                        <div className={`h-5 w-5 animate-spin rounded-full border-2 border-t-transparent ${action.color.replace('text-', 'border-')}`}></div>
                                    ) : (
                                        <Icon className="h-5 w-5" />
                                    )}
                                </div>
                                <span className="text-[10px] font-semibold text-foreground text-center leading-tight">
                                    {action.label}
                                </span>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Toggle Button */}
            <div className="pointer-events-auto absolute bottom-0 right-4 sm:right-0 flex justify-end">
                <Button 
                    onClick={() => setIsOpen(!isOpen)}
                    className="h-12 rounded-full px-5 shadow-lg gap-2 text-sm font-semibold bg-primary text-primary-foreground hover:bg-primary/90"
                >
                    <Bell className="h-4 w-4" />
                    <span className="hidden sm:inline">Call Waiter</span>
                    {isOpen ? <ChevronDown className="h-4 w-4 opacity-70" /> : <ChevronUp className="h-4 w-4 opacity-70" />}
                </Button>
            </div>
        </div>
    );
}
