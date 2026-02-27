'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { UtensilsCrossed, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function LoginPage() {
    const router = useRouter();
    const { requestOTP } = useAuthStore();
    const [phone, setPhone] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            // Normalize: add +91 if not present
            let normalized = phone.trim().replace(/\s|-/g, '');
            if (!normalized.startsWith('+91') && normalized.length === 10) {
                normalized = `+91${normalized}`;
            }

            await requestOTP(normalized);
            // Navigate to OTP page with phone in query
            router.push(`/verify?phone=${encodeURIComponent(normalized)}`);
        } catch (err) {
            setError(err.message || 'Failed to send OTP. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-secondary/30 p-4">
            <div className="w-full max-w-md overflow-hidden rounded-2xl border border-border bg-card p-8 shadow-lg">
                <div className="mb-8 flex flex-col items-center justify-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
                        <UtensilsCrossed className="h-6 w-6" />
                    </div>
                    <span className="text-2xl font-bold tracking-tight text-foreground">MehfilCart</span>
                </div>

                <div className="mb-8 space-y-2 text-center">
                    <h1 className="text-2xl font-semibold tracking-tight text-foreground">Welcome Back</h1>
                    <p className="text-sm text-muted-foreground">Enter your phone number to receive a secure one-time password.</p>
                </div>

                <form className="space-y-6" onSubmit={handleSubmit}>
                    <Input
                        id="phone"
                        label="Phone Number"
                        type="tel"
                        placeholder="9876543210"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        error={error}
                        required
                        autoFocus
                        className="text-lg tracking-wide"
                    />
                    <Button type="submit" fullWidth loading={loading} size="lg" className="h-12 text-base">
                        Send OTP
                    </Button>
                </form>

                <div className="mt-8 text-center">
                    <Link href="/" className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-primary">
                        <ArrowLeft className="h-4 w-4" />
                        Back to home
                    </Link>
                </div>
            </div>
        </div>
    );
}
