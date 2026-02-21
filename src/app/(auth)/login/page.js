'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import styles from '../auth.module.css';

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
        <div className={styles.container}>
            <div className={styles.card}>
                <div className={styles.logo}>
                    <div className={styles.logoMark}>M</div>
                    <span className={styles.logoText}>MehfilCart</span>
                </div>

                <h1 className={styles.title}>Welcome</h1>
                <p className={styles.subtitle}>Enter your phone number to receive a one-time password.</p>

                <form className={styles.form} onSubmit={handleSubmit}>
                    <Input
                        id="phone"
                        label="Phone Number"
                        type="tel"
                        placeholder="9876543210"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        error={error}
                        autoFocus
                    />
                    <Button type="submit" fullWidth loading={loading} size="lg">
                        Send OTP
                    </Button>
                </form>

                <div className={styles.back}>
                    <a href="/">← Back to home</a>
                </div>
            </div>
        </div>
    );
}
