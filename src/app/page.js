'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import Button from '@/components/ui/Button';
import QrScanner from '@/components/ui/QrScanner';
import AuthModal from '@/components/auth/AuthModal';
import AppLogo from '@/components/ui/AppLogo';
import { QrCode, LogIn, Eye, BookOpen, ShoppingCart, Receipt } from 'lucide-react';

export default function LandingPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading, initialize, role } = useAuthStore();

  const [showScanner, setShowScanner] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [scannedData, setScannedData] = useState(null); // { restaurantId, tableId }

  useEffect(() => {
    initialize();
  }, [initialize]);

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      if (role === 'SUPER_ADMIN' || role === 'RESTAURANT_ADMIN') {
        router.replace('/admin');
      } else if (role === 'WAITER') {
        router.replace('/staff');
      }
    }
  }, [isLoading, isAuthenticated, role, router]);

  const parseQrUrl = (url) => {
    try {
      const parsed = new URL(url);
      const parts = parsed.pathname.split('/').filter(Boolean);
      if (parts.length >= 3 && parts[0] === 'join') {
        return { restaurantId: parts[1], tableId: parts[2] };
      }
    } catch {
      // Not a valid URL
    }
    return null;
  };

  const handleQrScan = (url) => {
    setShowScanner(false);
    const parsed = parseQrUrl(url);
    if (parsed) {
      setScannedData(parsed);
    } else {
      try {
        const urlObj = new URL(url, window.location.origin);
        router.push(urlObj.pathname);
      } catch {
        // Invalid QR
      }
    }
  };

  const handleAuthSuccess = (data) => {
    setShowAuthModal(false);
    if (scannedData) {
      router.push(`/join/${scannedData.restaurantId}/${scannedData.tableId}`);
    } else if (data.role === 'SUPER_ADMIN' || data.role === 'RESTAURANT_ADMIN') {
      router.replace('/admin');
    } else if (data.role === 'WAITER') {
      router.replace('/staff');
    }
  };

  const handleViewMenuOnly = () => {
    if (scannedData) {
      router.push(`/menu/${scannedData.restaurantId}/${scannedData.tableId}`);
    }
    setScannedData(null);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      </div>
    );
  }

  return (
    <main className="relative flex min-h-[100dvh] flex-col items-center justify-center overflow-hidden bg-background px-4 py-12">
      {/* Clean radial gradient background matching the image */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(243,239,255,1)_0%,_rgba(255,255,255,0)_70%)] dark:bg-[radial-gradient(ellipse_at_top,_rgba(124,82,214,0.15)_0%,_rgba(0,0,0,0)_70%)]" />

      <div className="relative z-10 mx-auto flex w-full max-w-[420px] flex-col items-center text-center">

        {/* Logo */}
        <div className="mb-4 h-32 w-32 drop-shadow-sm">
          <AppLogo />
        </div>

        <h1 className="mb-4 bg-gradient-to-br from-[#7C52D6] to-[#4F2EB3] bg-clip-text text-[28px] font-extrabold tracking-tight text-transparent dark:from-[#9d7cf3] dark:to-[#7C52D6]">
          MehfilCart
        </h1>

        <p className="mb-12 text-[15px] leading-[1.6] text-muted-foreground px-2 font-medium">
          Order together, dine together. Scan a QR code, join a table, and build a shared cart with friends.
        </p>

        {/* QR Scanned -- choice screen */}
        {scannedData ? (
          <div className="w-full rounded-2xl border border-border bg-card p-6 shadow-sm mb-14">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#F3EFFF] text-[#7C52D6] dark:bg-primary/20 dark:text-primary">
              <QrCode className="h-7 w-7" />
            </div>
            <h3 className="mb-2 text-xl font-bold text-foreground">Table Found</h3>
            <p className="mb-6 text-sm text-muted-foreground font-medium">How would you like to proceed?</p>
            <div className="flex flex-col gap-3">
              <Button
                size="lg"
                className="w-full gap-2 text-base font-semibold bg-[#7C52D6] hover:bg-[#633eb0] text-white"
                onClick={() => {
                  if (isAuthenticated) {
                    router.push(`/join/${scannedData.restaurantId}/${scannedData.tableId}`);
                  } else {
                    setShowAuthModal(true);
                  }
                }}
              >
                <LogIn className="h-5 w-5" />
                Login to Join Table
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="w-full gap-2 text-base font-semibold border-border bg-card text-foreground hover:bg-accent/50"
                onClick={handleViewMenuOnly}
              >
                <Eye className="h-5 w-5" />
                View Menu Only
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex w-full flex-col gap-3 mb-16 px-4">
            {isAuthenticated ? (
              (role === 'SUPER_ADMIN' || role === 'RESTAURANT_ADMIN' || role === 'WAITER') ? (
                <Button size="lg" className="h-14 w-full text-[15px] font-semibold bg-[#7C52D6] hover:bg-[#633eb0] text-white rounded-xl" onClick={() => router.push(role === 'WAITER' ? '/staff' : '/admin')}>
                  Go to Dashboard
                </Button>
              ) : (
                <Button
                  variant="outline"
                  size="lg"
                  className="h-[52px] w-full gap-2 text-[15px] font-semibold bg-gray-50/80 border-transparent text-foreground hover:bg-gray-100 rounded-xl transition-all dark:bg-card dark:border-border dark:hover:bg-accent"
                  onClick={() => setShowScanner(true)}
                >
                  <QrCode className="h-5 w-5" />
                  Scan QR to Join
                </Button>
              )
            ) : (
              <>
                <Button size="lg" className="h-[52px] w-full text-[15px] font-semibold bg-[#673AB7] hover:bg-[#5E35B1] text-white rounded-xl shadow-md transition-all" onClick={() => router.push('/login')}>
                  Login with Phone
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  className="h-[52px] w-full gap-2 text-[15px] font-semibold bg-gray-50/80 border-transparent text-foreground hover:bg-gray-100 rounded-xl transition-all dark:bg-card dark:border-border dark:hover:bg-accent"
                  onClick={() => setShowScanner(true)}
                >
                  <QrCode className="h-5 w-5" />
                  Scan QR to Join
                </Button>
              </>
            )}
          </div>
        )}

        {/* Features Grid */}
        <div className="mt-auto grid w-full grid-cols-3 gap-3 px-1">
          {/* Feature 1 */}
          <div className="flex flex-col items-center text-center">
            <div className="mb-3 flex h-[52px] w-[52px] items-center justify-center rounded-[18px] bg-[#F3EFFF] text-[#7C52D6] shadow-sm transition-transform hover:scale-105 dark:bg-primary/20 dark:text-primary">
              <BookOpen className="h-[22px] w-[22px]" strokeWidth={2.5} />
            </div>
            <h4 className="mb-1 text-[13px] font-bold text-foreground">Explore Menu</h4>
            <p className="text-[11px] leading-tight text-muted-foreground px-1">Browse business menu items and picks</p>
          </div>

          {/* Feature 2 */}
          <div className="flex flex-col items-center text-center">
            <div className="mb-3 flex h-[52px] w-[52px] items-center justify-center rounded-[18px] bg-[#F3EFFF] text-[#7C52D6] shadow-sm transition-transform hover:scale-105 dark:bg-primary/20 dark:text-primary">
              <ShoppingCart className="h-[22px] w-[22px]" strokeWidth={2.5} />
            </div>
            <h4 className="mb-1 text-[13px] font-bold text-foreground">Manage Orders</h4>
            <p className="text-[11px] leading-tight text-muted-foreground px-1">Check status of group items</p>
          </div>

          {/* Feature 3 */}
          <div className="flex flex-col items-center text-center">
            <div className="mb-3 flex h-[52px] w-[52px] items-center justify-center rounded-[18px] bg-[#F3EFFF] text-[#7C52D6] shadow-sm transition-transform hover:scale-105 dark:bg-primary/20 dark:text-primary">
              <Receipt className="h-[22px] w-[22px]" strokeWidth={2.5} />
            </div>
            <h4 className="mb-1 text-[13px] font-bold text-foreground">Finalize Bill</h4>
            <p className="text-[11px] leading-tight text-muted-foreground px-1">Settle and split the group total</p>
          </div>
        </div>

      </div>

      <QrScanner
        isOpen={showScanner}
        onClose={() => setShowScanner(false)}
        onScan={handleQrScan}
      />

      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onAuthenticated={handleAuthSuccess}
      />
    </main>
  );
}
