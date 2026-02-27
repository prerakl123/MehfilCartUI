'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import Button from '@/components/ui/Button';
import { QrCode, ShoppingCart, Zap } from 'lucide-react';

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
      <div className="relative flex min-h-[100dvh] flex-col items-center justify-center overflow-hidden p-8 text-center bg-background">
        <div className="relative z-10 mx-auto max-w-[560px]">
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-primary-light text-3xl font-extrabold text-white shadow-lg shadow-primary/30 animate-pulse">
            M
          </div>
          <p className="mx-auto max-w-[420px] text-lg text-muted-foreground animate-pulse">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <main className="relative flex min-h-[100dvh] flex-col items-center justify-center overflow-hidden p-8 text-center bg-background">
      {/* Animated background gradient */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_50%,_rgba(108,60,225,0.08)_0%,_transparent_50%),_radial-gradient(circle_at_80%_20%,_rgba(6,182,212,0.06)_0%,_transparent_50%),_radial-gradient(circle_at_60%_80%,_rgba(245,158,11,0.05)_0%,_transparent_50%)] animate-[pulse_8s_ease-in-out_infinite_alternate]" />

      <div className="relative z-10 mx-auto max-w-[560px]">
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-primary-light text-3xl font-extrabold text-white shadow-lg shadow-primary/30">
          M
        </div>
        <h1 className="mb-4 bg-gradient-to-br from-primary to-primary-light bg-clip-text text-[clamp(2rem,5vw,2.25rem)] font-extrabold leading-tight tracking-tight text-transparent">
          MehfilCart
        </h1>
        <p className="mx-auto mb-10 max-w-[420px] text-lg text-muted-foreground">
          Order together, dine together. Scan a QR code, join a table, and build a shared cart with friends.
        </p>

        <div className="mx-auto flex w-full max-w-[320px] flex-col gap-3">
          {isAuthenticated ? (
            <Button size="lg" className="w-full" onClick={() => router.push('/admin')}>
              Go to Dashboard
            </Button>
          ) : (
            <>
              <Button size="lg" className="w-full" onClick={() => router.push('/login')}>
                Login with Phone
              </Button>
              <Button variant="secondary" size="lg" className="w-full" onClick={() => router.push('/login')}>
                Scan QR to Join
              </Button>
            </>
          )}
        </div>

        <div className="mt-16 grid grid-cols-1 gap-6 sm:grid-cols-3 mx-auto max-w-[560px]">
          <div className="flex flex-col items-center gap-2">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <QrCode className="h-6 w-6" />
            </div>
            <span className="text-sm font-semibold text-foreground">Scan & Join</span>
            <span className="text-xs text-muted-foreground">Scan the table QR</span>
          </div>
          <div className="flex flex-col items-center gap-2">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <ShoppingCart className="h-6 w-6" />
            </div>
            <span className="text-sm font-semibold text-foreground">Shared Cart</span>
            <span className="text-xs text-muted-foreground">Add items together</span>
          </div>
          <div className="flex flex-col items-center gap-2">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Zap className="h-6 w-6" />
            </div>
            <span className="text-sm font-semibold text-foreground">Real-time</span>
            <span className="text-xs text-muted-foreground">See changes live</span>
          </div>
        </div>
      </div>
    </main>
  );
}
