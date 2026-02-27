/**
 * AuthModal -- in-page bottom sheet for login and OTP verification.
 * Used in the QR join flow so users don't get redirected away.
 */

'use client';

import { useState, useRef, useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { X, UtensilsCrossed, ArrowLeft } from 'lucide-react';

export default function AuthModal({ isOpen, onClose, onAuthenticated }) {
    const { requestOTP, verifyOTP } = useAuthStore();

    const [step, setStep] = useState('phone'); // 'phone' | 'otp'
    const [phone, setPhone] = useState('');
    const [normalizedPhone, setNormalizedPhone] = useState('');
    const [otp, setOtp] = useState(['', '', '', '', '', '']);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [resendTimer, setResendTimer] = useState(0);

    const inputRefs = useRef([]);

    // Countdown timer for resend
    useEffect(() => {
        if (resendTimer <= 0) return;
        const timer = setTimeout(() => setResendTimer((t) => t - 1), 1000);
        return () => clearTimeout(timer);
    }, [resendTimer]);

    // Auto-focus first OTP digit when switching to OTP step
    useEffect(() => {
        if (step === 'otp') {
            inputRefs.current[0]?.focus();
        }
    }, [step]);

    const handlePhoneSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            let normalized = phone.trim().replace(/\s|-/g, '');
            if (!normalized.startsWith('+91') && normalized.length === 10) {
                normalized = `+91${normalized}`;
            }
            await requestOTP(normalized);
            setNormalizedPhone(normalized);
            setStep('otp');
            setResendTimer(30);
        } catch (err) {
            setError(err.message || 'Failed to send OTP.');
        } finally {
            setLoading(false);
        }
    };

    const handleDigitChange = (index, value) => {
        if (!/^\d*$/.test(value)) return;
        const newOtp = [...otp];
        newOtp[index] = value.slice(-1);
        setOtp(newOtp);

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
            const data = await verifyOTP(normalizedPhone, otpString);
            onAuthenticated(data);
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
            await requestOTP(normalizedPhone);
            setResendTimer(30);
            setError('');
        } catch (err) {
            setError(err.message || 'Failed to resend OTP.');
        }
    };

    const resetAndClose = () => {
        setStep('phone');
        setPhone('');
        setOtp(['', '', '', '', '', '']);
        setError('');
        setNormalizedPhone('');
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center bg-black/50 backdrop-blur-sm">
            <div className="w-full max-w-md rounded-t-2xl sm:rounded-2xl border border-border bg-card p-6 shadow-xl animate-in slide-in-from-bottom-4 sm:slide-in-from-bottom-0 sm:fade-in">
                {/* Header */}
                <div className="mb-6 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        {step === 'otp' && (
                            <button
                                onClick={() => { setStep('phone'); setError(''); }}
                                className="rounded-lg p-1.5 text-muted-foreground hover:bg-secondary"
                            >
                                <ArrowLeft className="h-5 w-5" />
                            </button>
                        )}
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground">
                            <UtensilsCrossed className="h-5 w-5" />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-foreground">
                                {step === 'phone' ? 'Login' : 'Verify OTP'}
                            </h3>
                            <p className="text-xs text-muted-foreground">
                                {step === 'phone'
                                    ? 'Enter your phone number'
                                    : `Code sent to ${normalizedPhone.slice(0, 4)}****${normalizedPhone.slice(-2)}`}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={resetAndClose}
                        className="rounded-lg p-2 text-muted-foreground hover:bg-secondary"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                {/* Phone Step */}
                {step === 'phone' && (
                    <form onSubmit={handlePhoneSubmit} className="space-y-5">
                        <Input
                            id="modal-phone"
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
                )}

                {/* OTP Step */}
                {step === 'otp' && (
                    <div className="space-y-5">
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
                                    className="h-12 w-10 sm:h-14 sm:w-12 rounded-lg border border-input bg-background text-center text-lg font-bold shadow-sm transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                                    aria-label={`OTP digit ${i + 1}`}
                                />
                            ))}
                        </div>

                        {error && (
                            <p className="text-center text-sm font-medium text-destructive">{error}</p>
                        )}

                        <Button fullWidth loading={loading} size="lg" className="h-12 text-base" onClick={() => handleVerify(otp.join(''))}>
                            Verify & Login
                        </Button>

                        <p className="text-center text-sm text-muted-foreground">
                            {resendTimer > 0 ? (
                                <span>Resend OTP in <span className="font-medium text-foreground">{resendTimer}s</span></span>
                            ) : (
                                <button onClick={handleResend} className="font-medium text-primary hover:underline">
                                    Resend OTP
                                </button>
                            )}
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
