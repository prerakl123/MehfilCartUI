'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useSession } from '@/hooks/useSession';
import { useAuthStore } from '@/store/authStore';
import { useToast } from '@/components/ui/Toast';
import Button from '@/components/ui/Button';
import AuthModal from '@/components/auth/AuthModal';
import { LogIn, Eye, QrCode } from 'lucide-react';

export default function JoinTablePage() {
    const router = useRouter();
    const params = useParams();
    const { restaurantId, tableId } = params;

    const { createSession, getActiveSessionForTable, joinSession, getMyActiveSession, leaveSession } = useSession();
    const { isAuthenticated } = useAuthStore();
    const toast = useToast();

    const [status, setStatus] = useState('');
    const [waiting, setWaiting] = useState(false);
    const [showAuthModal, setShowAuthModal] = useState(false);
    const [showChoiceScreen, setShowChoiceScreen] = useState(false);
    const [existingSession, setExistingSession] = useState(null);

    // Prevent multiple API calls
    const hasRun = useRef(false);

    // Show choice screen if user is not authenticated
    useEffect(() => {
        if (!isAuthenticated && !hasRun.current) {
            setShowChoiceScreen(true);
        }
    }, [isAuthenticated]);

    // Run join flow when user IS authenticated
    useEffect(() => {
        if (hasRun.current) return;
        if (!isAuthenticated) return;

        hasRun.current = true;
        setShowChoiceScreen(false);
        checkAndHandleJoin();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isAuthenticated]);

    const checkAndHandleJoin = async () => {
        try {
            setStatus('Checking active sessions...');
            const mySession = await getMyActiveSession();
            if (mySession) {
                if (mySession.table_id === tableId) {
                    toast.success('You are already part of this session.');
                    router.push(`/menu/${restaurantId}/${tableId}`);
                    return;
                } else {
                    setExistingSession(mySession);
                    setStatus('');
                    return;
                }
            }
        } catch (err) {
            // No active session, continue normal join
        }
        handleJoinFlow();
    };

    const handleJoinFlow = async () => {
        try {
            setStatus('Attempting to open a table session...');
            await createSession(tableId);
            toast.success('Table claimed successfully. You are the host.');
            setStatus('Table claimed! Redirecting to menu...');
            setTimeout(() => router.push(`/menu/${restaurantId}/${tableId}`), 1000);
        } catch (err) {
            if (err.status === 409) {
                processExistingSession();
            } else {
                toast.error('Could not open table: ' + (err.data?.detail || err.message));
                setStatus('Error connecting to table.');
            }
        }
    };

    const processExistingSession = async () => {
        try {
            setStatus('Table is occupied. Fetching session details...');
            const activeSession = await getActiveSessionForTable(tableId);
            if (!activeSession) {
                setStatus('Session error. Please try scanning again.');
                return;
            }
            setStatus('Requesting to join the table...');
            await joinSession(activeSession.id);
            setWaiting(true);
            setStatus('Request sent! Waiting for host approval...');
            toast.success('Requested to join the table.');
        } catch (joinErr) {
            if (joinErr.status === 409 && joinErr.data?.detail?.includes('pending')) {
                setWaiting(true);
                setStatus('Request already pending! Waiting for host approval...');
            } else if (joinErr.status === 409 && joinErr.data?.detail?.includes('Already a member')) {
                toast.success('You are already a member of this session.');
                router.push(`/menu/${restaurantId}/${tableId}`);
            } else {
                toast.error(joinErr.data?.detail || joinErr.message || 'Failed to join table');
                setStatus('Failed to join the table.');
            }
        }
    };

    const handleAuthSuccess = () => {
        setShowAuthModal(false);
        // The useEffect above will trigger the join flow once isAuthenticated becomes true
    };

    const handleViewMenuOnly = () => {
        router.push(`/menu/${restaurantId}/${tableId}`);
    };

    const handleLeaveExistingAndJoin = async () => {
        try {
            setStatus('Leaving previous session...');
            setExistingSession(null);
            await leaveSession(existingSession.id);
            toast.success('Left previous session.');
            handleJoinFlow();
        } catch (err) {
            toast.error('Could not leave previous session: ' + (err.data?.detail || err.message));
            setStatus('Error leaving previous session.');
        }
    };

    const handleCancelJoin = () => {
        router.push('/');
    };

    if (existingSession) {
        return (
            <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4 text-center">
                <div className="w-full max-w-[400px] rounded-2xl border border-border bg-card p-8 shadow-sm">
                    <h2 className="mb-4 text-xl font-bold tracking-tight text-foreground text-red-500">Active Session Found</h2>
                    <p className="mb-8 text-sm text-muted-foreground">
                        You are already part of an active session at another table ({existingSession.table_label || 'Unknown Table'}).
                        You must leave that session before joining this one.
                    </p>
                    <div className="flex flex-col gap-3">
                        <Button size="lg" className="w-full" onClick={handleLeaveExistingAndJoin}>
                            Leave Previous & Join New
                        </Button>
                        <Button variant="secondary" size="lg" className="w-full" onClick={handleCancelJoin}>
                            Cancel
                        </Button>
                    </div>
                </div>
            </div>
        );
    }

    // Choice screen: Login vs View Menu Only
    if (showChoiceScreen && !isAuthenticated) {
        return (
            <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4 text-center">
                <div className="w-full max-w-[400px] rounded-2xl border border-border bg-card p-8 shadow-sm">
                    <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                        <QrCode className="h-7 w-7" />
                    </div>
                    <h2 className="mb-2 text-2xl font-bold tracking-tight text-foreground">Join Table</h2>
                    <p className="mb-8 text-sm text-muted-foreground">
                        You have been redirected to a table at this restaurant. How would you like to proceed?
                    </p>
                    <div className="flex flex-col gap-3">
                        <Button
                            size="lg"
                            className="w-full gap-2"
                            onClick={() => setShowAuthModal(true)}
                        >
                            <LogIn className="h-4 w-4" />
                            Login to Join Table
                        </Button>
                        <Button
                            variant="secondary"
                            size="lg"
                            className="w-full gap-2"
                            onClick={handleViewMenuOnly}
                        >
                            <Eye className="h-4 w-4" />
                            View Menu Only
                        </Button>
                    </div>
                </div>

                <AuthModal
                    isOpen={showAuthModal}
                    onClose={() => setShowAuthModal(false)}
                    onAuthenticated={handleAuthSuccess}
                />
            </div>
        );
    }

    // Join flow in progress
    return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4 text-center">
            <div className="w-full max-w-[400px] rounded-2xl border border-border bg-card p-8 shadow-sm">
                <h2 className="mb-4 text-2xl font-bold tracking-tight text-foreground">Joining Table</h2>
                <p className="mb-8 text-sm text-muted-foreground">{status}</p>
                {waiting && (
                    <div className="mt-4 flex flex-col items-center">
                        <div className="mb-4 h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
                        <p className="text-sm font-medium text-primary">The host will receive your request shortly.</p>
                        <Button className="mt-8 w-full" variant="secondary" onClick={() => router.push('/')}>
                            Cancel
                        </Button>
                    </div>
                )}
            </div>
        </div>
    );
}
