'use client';

import { useState, useRef, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import Button from '@/components/ui/Button';
import { UtensilsCrossed, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

function VerifyOTPContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const phone = searchParams.get('phone') || '';
    const { verifyOTP, requestOTP } = useAuthStore();

    const [otp, setOtp] = useState(['', '', '', '', '', '']);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [resendTimer, setResendTimer] = useState(30);
    const inputRefs = useRef([]);

    // Countdown timer for resend
    useEffect(() => {
        if (resendTimer <= 0) return;
        const timer = setTimeout(() => setResendTimer((t) => t - 1), 1000);
        return () => clearTimeout(timer);
    }, [resendTimer]);

    // Auto-focus first digit
    useEffect(() => {
        inputRefs.current[0]?.focus();
    }, []);

    const handleDigitChange = (index, value) => {
        if (!/^\d*$/.test(value)) return; // Only allow digits
        const newOtp = [...otp];
        newOtp[index] = value.slice(-1); // Take last digit
        setOtp(newOtp);

        // Auto-advance to next field
        if (value && index < 5) {
            inputRefs.current[index + 1]?.focus();
        }

        // Auto-submit when all digits filled
        if (newOtp.every((d) => d) && newOtp.join('').length === 6) {
            handleVerify(newOtp.join(''));
        }
    };

    const handleKeyDown = (index, e) => {
        if (e.key === 'Backspace' && !otp[index] && index > 0) {
            inputRefs.current[index - 1]?.focus();
        }
    };

    const handlePaste = (e) => {
        e.preventDefault();
        const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
        if (pasted.length === 6) {
            const digits = pasted.split('');
            setOtp(digits);
            inputRefs.current[5]?.focus();
            handleVerify(pasted);
        }
    };

    const handleVerify = async (otpString) => {
        setError('');
        setLoading(true);
        try {
            const data = await verifyOTP(phone, otpString);
            
            // Redirect based on role if profile is complete
            if (!data.profile_incomplete) {
                if (data.role === 'SUPER_ADMIN' || data.role === 'RESTAURANT_ADMIN') {
                    router.replace('/admin');
                } else if (data.role === 'WAITER') {
                    router.replace('/staff');
                } else {
                    router.replace('/');
                }
            } else {
                router.replace('/'); // Main page will catch the profileIncomplete flag and show modal
            }
        } catch (err) {
            setError(err.message || 'Invalid OTP. Please try again.');
            setOtp(['', '', '', '', '', '']);
            inputRefs.current[0]?.focus();
        } finally {
            setLoading(false);
        }
    };

    const handleResend = async () => {
        try {
            await requestOTP(phone);
            setResendTimer(30);
            setError('');
        } catch (err) {
            setError(err.message || 'Failed to resend OTP.');
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
                    <h1 className="text-2xl font-semibold tracking-tight text-foreground">Verify OTP</h1>
                    <p className="text-sm text-muted-foreground">
                        Enter the 6-digit code sent to {phone ? <span className="font-medium text-foreground">{phone.slice(0, 4)}****{phone.slice(-2)}</span> : 'your phone'}.
                    </p>
                </div>

                <div className="space-y-6">
                    <div className="flex items-center justify-center gap-2 sm:gap-3" onPaste={handlePaste}>
                        {otp.map((digit, i) => (
                            <input
                                key={i}
                                ref={(el) => (inputRefs.current[i] = el)}
                                type="text"
                                inputMode="numeric"
                                maxLength={1}
                                value={digit}
                                onChange={(e) => handleDigitChange(i, e.target.value)}
                                onKeyDown={(e) => handleKeyDown(i, e)}
                                className="h-12 w-10 sm:h-14 sm:w-12 rounded-lg border border-input bg-background object-contain px-0 py-2 text-center text-lg font-bold shadow-sm ring-offset-background transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                                aria-label={`OTP digit ${i + 1}`}
                            />
                        ))}
                    </div>

                    {error && (
                        <p className="text-center text-sm font-medium text-destructive animate-in fade-in slide-in-from-top-1">
                            {error}
                        </p>
                    )}

                    <Button fullWidth loading={loading} size="lg" className="h-12 text-base" onClick={() => handleVerify(otp.join(''))}>
                        Verify & Login
                    </Button>

                    <p className="text-center text-sm text-muted-foreground mt-4">
                        {resendTimer > 0 ? (
                            <span>Resend OTP in <span className="font-medium text-foreground">{resendTimer}s</span></span>
                        ) : (
                            <button
                                onClick={handleResend}
                                className="font-medium text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded"
                            >
                                Resend OTP
                            </button>
                        )}
                    </p>
                </div>

                <div className="mt-8 text-center">
                    <Link href="/login" className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-primary">
                        <ArrowLeft className="h-4 w-4" />
                        Change phone number
                    </Link>
                </div>
            </div>
        </div>
    );
}

export default function VerifyPage() {
    return (
        <Suspense fallback={
            <div className="flex min-h-screen items-center justify-center bg-secondary/30">
                <div className="flex flex-col items-center gap-4">
                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
                    <p className="text-sm font-medium text-muted-foreground">Loading verification...</p>
                </div>
            </div>
        }>
            <VerifyOTPContent />
        </Suspense>
    );
}
