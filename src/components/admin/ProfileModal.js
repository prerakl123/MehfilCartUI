/**
 * ProfileModal -- allows all users to view and update their display name.
 * For staff (WAITER), changes create a pending approval request.
 */

'use client';

import { useState } from 'react';
import { useAuthStore } from '@/store/authStore';
import { api } from '@/lib/api';
import { useToast } from '@/components/ui/Toast';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { X, User, AlertCircle } from 'lucide-react';

export default function ProfileModal({ isOpen, onClose }) {
    const { user, role } = useAuthStore();
    const toast = useToast();

    const [displayName, setDisplayName] = useState(user?.display_name || '');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const isWaiter = role === 'WAITER';

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const data = await api.patch('/users/me', { display_name: displayName.trim() });

            if (data.pending_request) {
                toast.success('Name change request submitted for admin approval.');
            } else {
                // Update local auth store
                const updatedUser = { ...user, display_name: data.display_name };
                localStorage.setItem('user', JSON.stringify(updatedUser));
                useAuthStore.setState({ user: updatedUser });
                toast.success('Display name updated successfully.');
            }
            onClose();
        } catch (err) {
            setError(err.message || 'Failed to update name.');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center bg-black/50 backdrop-blur-sm">
            <div className="w-full max-w-md rounded-t-2xl sm:rounded-2xl border border-border bg-card p-6 shadow-xl animate-in slide-in-from-bottom-4 sm:slide-in-from-bottom-0 sm:fade-in">
                {/* Header */}
                <div className="mb-6 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                            <User className="h-5 w-5" />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-foreground">Edit Profile</h3>
                            <p className="text-xs text-muted-foreground">Update your display name</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="rounded-lg p-2 text-muted-foreground hover:bg-secondary"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                {/* Waiter notice */}
                {isWaiter && (
                    <div className="mb-4 flex items-start gap-2 rounded-lg border border-yellow-200 bg-yellow-50 p-3 text-sm dark:border-yellow-900/50 dark:bg-yellow-900/20">
                        <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-yellow-600 dark:text-yellow-400" />
                        <p className="text-yellow-800 dark:text-yellow-300">
                            As a staff member, name changes require restaurant admin approval.
                        </p>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-5">
                    <Input
                        id="display-name"
                        label="Display Name"
                        type="text"
                        placeholder="Enter your name"
                        value={displayName}
                        onChange={(e) => setDisplayName(e.target.value)}
                        error={error}
                        required
                        autoFocus
                        maxLength={50}
                    />
                    <div className="flex gap-3">
                        <Button
                            type="button"
                            variant="secondary"
                            className="flex-1"
                            onClick={onClose}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            loading={loading}
                            className="flex-1"
                            disabled={!displayName.trim() || displayName.trim() === user?.display_name}
                        >
                            {isWaiter ? 'Request Change' : 'Save'}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}
