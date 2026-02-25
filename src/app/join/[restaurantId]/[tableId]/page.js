'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useSession } from '@/hooks/useSession';
import { useAuthStore } from '@/store/authStore';
import { useToast } from '@/components/ui/Toast';
import sharedStyles from '@/app/admin/shared.module.css';
import Button from '@/components/ui/Button';

export default function JoinTablePage() {
    const router = useRouter();
    const params = useParams();
    const { restaurantId, tableId } = params;

    const { createSession, getActiveSessionForTable, joinSession } = useSession();
    const { isAuthenticated } = useAuthStore();
    const toast = useToast();

    const [status, setStatus] = useState('Checking table availability...');
    const [waiting, setWaiting] = useState(false);

    // Prevent multiple API calls
    const hasRun = useRef(false);

    useEffect(() => {
        if (hasRun.current) return;

        // If the user is an admin or staff they shouldn't usually be joining a table like this, but we allow it anyway.
        if (!isAuthenticated) {
            toast.error("You need to login first");
            router.push('/login');
            return;
        }

        const handleJoinFlow = async () => {
            try {
                // Try creating a new session
                setStatus('Attempting to open a table session...');
                const newSession = await createSession(tableId);

                toast.success('Table claimed successfully. You are the host.');
                // Here you would redirect user to the consumer menu page
                // But MehfilCart consumer pages are not yet built, so we just show success for now.
                setStatus('Table claimed! Redirecting to menu...');
                setTimeout(() => router.push(`/menu/${restaurantId}/${tableId}`), 1000);
            } catch (err) {
                // If 409 Conflict, a session already exists! We should join it.
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
                toast.error(joinErr.data?.detail || joinErr.message || 'Failed to join table');
                setStatus('Failed to join the table.');
            }
        };

        if (isAuthenticated) {
            hasRun.current = true;
            handleJoinFlow();
        }

    }, [isAuthenticated, tableId, restaurantId, router, toast, createSession, getActiveSessionForTable, joinSession]);

    return (
        <div className={sharedStyles.page} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', textAlign: 'center' }}>
            <div style={{ maxWidth: '400px', padding: '2rem', background: 'var(--color-bg)', borderRadius: '1rem', border: '1px solid var(--color-border)' }}>
                <h2 style={{ marginBottom: '1rem' }}>Joining Table</h2>
                <p style={{ marginBottom: '2rem', color: 'var(--color-text-muted)' }}>{status}</p>
                {waiting && (
                    <div style={{ marginTop: '1rem' }}>
                        <div className="spinner" style={{ marginBottom: '1rem' }} />
                        <p style={{ fontSize: '0.9rem', color: 'var(--color-primary)' }}>The host will receive your request shortly.</p>
                        <Button style={{ marginTop: '2rem' }} variant="secondary" onClick={() => router.push('/')}>
                            Cancel
                        </Button>
                    </div>
                )}
            </div>
        </div>
    );
}
