'use client';

import { useState } from 'react';
import { useAuthStore } from '@/store/authStore';
import { api } from '@/lib/api';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { User, AlertCircle } from 'lucide-react';

export default function ProfileCompletionModal() {
    const { user, profileIncomplete } = useAuthStore();
    
    const [displayName, setDisplayName] = useState(user?.display_name || '');
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const body = {
                display_name: displayName.trim(),
            };
            if (email.trim()) {
                body.email = email.trim();
            }

            const data = await api.patch('/users/me', body);

            // Update local auth store
            const updatedUser = { ...user, display_name: data.display_name };
            localStorage.setItem('user', JSON.stringify(updatedUser));
            localStorage.removeItem('profile_incomplete');
            
            useAuthStore.setState({ 
                user: updatedUser,
                profileIncomplete: false
            });
            
        } catch (err) {
            setError(err.message || 'Failed to finish profile setup.');
        } finally {
            setLoading(false);
        }
    };

    if (!profileIncomplete) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-background/80 backdrop-blur-md">
            <div className="w-full max-w-md overflow-hidden rounded-2xl border border-border bg-card p-8 shadow-2xl animate-in fade-in zoom-in-95 duration-300">
                <div className="mb-8 flex flex-col items-center justify-center gap-3">
                    <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary shadow-sm">
                        <User className="h-8 w-8" />
                    </div>
                </div>

                <div className="mb-6 space-y-2 text-center">
                    <h2 className="text-2xl font-bold tracking-tight text-foreground">Complete Your Profile</h2>
                    <p className="text-sm text-muted-foreground">Please provide your name to continue using MehfilCart.</p>
                </div>
                
                <div className="mb-6 flex items-start gap-2 rounded-lg border border-primary/20 bg-primary/5 p-3 text-sm">
                    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                    <p className="text-foreground/80">
                        Your name helps restaurants and your dining group identify you during table sessions.
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                    <Input
                        id="display-name"
                        label="Full Name"
                        type="text"
                        placeholder="e.g. John Doe"
                        value={displayName}
                        onChange={(e) => setDisplayName(e.target.value)}
                        error={error}
                        required
                        autoFocus
                        maxLength={50}
                        className="text-base"
                    />
                    
                    <Input
                        id="email"
                        label="Email Address (Optional)"
                        type="email"
                        placeholder="you@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        maxLength={100}
                        className="text-base"
                    />
                    
                    <Button
                        type="submit"
                        loading={loading}
                        fullWidth
                        size="lg"
                        className="mt-6 h-12 text-base"
                        disabled={!displayName.trim()}
                    >
                        Save & Continue
                    </Button>
                </form>
            </div>
        </div>
    );
}
