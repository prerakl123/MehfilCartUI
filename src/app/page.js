'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import Button from '@/components/ui/Button';
import styles from './page.module.css';

export default function LandingPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading, initialize, role } = useAuthStore();

  useEffect(() => {
    initialize();
  }, [initialize]);

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      // Redirect authenticated users to their appropriate dashboard
      if (role === 'SUPER_ADMIN' || role === 'RESTAURANT_ADMIN') {
        router.replace('/admin');
      } else if (role === 'WAITER') {
        router.replace('/staff');
      }
      // TABLE_HOST/TABLE_GUEST stay until they scan a QR
    }
  }, [isLoading, isAuthenticated, role, router]);

  if (isLoading) {
    return (
      <div className={styles.hero}>
        <div className={styles.content}>
          <div className={styles.logoMark}>M</div>
          <p className={styles.tagline}>Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <main className={styles.hero}>
      <div className={styles.content}>
        <div className={styles.logoMark}>M</div>
        <h1 className={styles.headline}>MehfilCart</h1>
        <p className={styles.tagline}>
          Order together, dine together. Scan a QR code, join a table, and build a shared cart with friends.
        </p>

        <div className={styles.actions}>
          {isAuthenticated ? (
            <Button size="lg" fullWidth onClick={() => router.push('/admin')}>
              Go to Dashboard
            </Button>
          ) : (
            <>
              <Button size="lg" fullWidth onClick={() => router.push('/login')}>
                Login with Phone
              </Button>
              <Button variant="secondary" size="lg" fullWidth onClick={() => router.push('/login')}>
                Scan QR to Join
              </Button>
            </>
          )}
        </div>

        <div className={styles.features}>
          <div className={styles.featureCard}>
            <div className={styles.featureIcon}>📱</div>
            <span className={styles.featureTitle}>Scan & Join</span>
            <span className={styles.featureDesc}>Scan the table QR</span>
          </div>
          <div className={styles.featureCard}>
            <div className={styles.featureIcon}>🛒</div>
            <span className={styles.featureTitle}>Shared Cart</span>
            <span className={styles.featureDesc}>Add items together</span>
          </div>
          <div className={styles.featureCard}>
            <div className={styles.featureIcon}>⚡</div>
            <span className={styles.featureTitle}>Real-time</span>
            <span className={styles.featureDesc}>See changes live</span>
          </div>
        </div>
      </div>
    </main>
  );
}
