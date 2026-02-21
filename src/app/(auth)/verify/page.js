'use client';

import { useState, useRef, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import Button from '@/components/ui/Button';
import styles from '../auth.module.css';

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
            // Redirect based on role
            if (data.role === 'SUPER_ADMIN' || data.role === 'RESTAURANT_ADMIN') {
                router.replace('/admin');
            } else if (data.role === 'WAITER') {
                router.replace('/staff');
            } else {
                router.replace('/');
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
        <div className={styles.container}>
            <div className={styles.card}>
                <div className={styles.logo}>
                    <div className={styles.logoMark}>M</div>
                    <span className={styles.logoText}>MehfilCart</span>
                </div>

                <h1 className={styles.title}>Verify OTP</h1>
                <p className={styles.subtitle}>
                    Enter the 6-digit code sent to {phone ? `${phone.slice(0, 4)}****${phone.slice(-2)}` : 'your phone'}.
                </p>

                <div className={styles.form}>
                    <div className={styles.otpRow} onPaste={handlePaste}>
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
                                className={styles.otpDigit}
                                aria-label={`OTP digit ${i + 1}`}
                            />
                        ))}
                    </div>

                    {error && <p style={{ color: 'var(--color-error)', fontSize: 'var(--font-size-sm)', textAlign: 'center' }}>{error}</p>}

                    <Button fullWidth loading={loading} size="lg" onClick={() => handleVerify(otp.join(''))}>
                        Verify & Login
                    </Button>

                    <p className={styles.resend}>
                        {resendTimer > 0 ? (
                            <>Resend OTP in {resendTimer}s</>
                        ) : (
                            <button onClick={handleResend}>Resend OTP</button>
                        )}
                    </p>
                </div>

                <div className={styles.back}>
                    <a href="/login">← Change phone number</a>
                </div>
            </div>
        </div>
    );
}

export default function VerifyPage() {
    return (
        <Suspense fallback={<div className={styles.container}><p>Loading...</p></div>}>
            <VerifyOTPContent />
        </Suspense>
    );
}
