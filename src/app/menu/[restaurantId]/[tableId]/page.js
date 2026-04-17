'use client';

/**
 * Consumer menu page -- fetches and displays the restaurant menu for guests.
 * Supports category filtering, search, and veg/non-veg badges.
 * Cart functionality requires authentication.
 */

import { useEffect, useState, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import AuthModal from '@/components/auth/AuthModal';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import {
    Search, Filter, ShoppingCart, Plus, Minus, ArrowLeft,
    Leaf, Flame, LogIn, ChevronDown, Users, X, Check, ClipboardList, RefreshCw
} from 'lucide-react';
import SessionManagementModal from '@/components/session/SessionManagementModal';
import { useSession } from '@/hooks/useSession';
import { useToast } from '@/components/ui/Toast';
import { APP_CONFIG } from '@/constants/config';
import QuickActionsBar from '@/components/session/QuickActionsBar';

export default function ConsumerMenuPage() {
    const params = useParams();
    const router = useRouter();
    const { restaurantId, tableId } = params;
    const { isAuthenticated, initialize } = useAuthStore();

    const [menu, setMenu] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [activeCategory, setActiveCategory] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [showAuthModal, setShowAuthModal] = useState(false);

    // Remote Cart and UI state
    const [remoteCart, setRemoteCart] = useState({ items: [], total: 0, item_count: 0 });
    const [paymentMethod, setPaymentMethod] = useState('Pay Later');

    const { getMyActiveSession, fetchSession, handleMember, transferHostToMember, leaveSession: apiLeaveSession } = useSession();
    const { user } = useAuthStore();
    const toast = useToast();

    const [activeSession, setActiveSession] = useState(null);
    const [showSessionModal, setShowSessionModal] = useState(false);
    const [showCart, setShowCart] = useState(false);
    const [isSubmittingOrder, setIsSubmittingOrder] = useState(false);
    const [acceptedItems, setAcceptedItems] = useState(new Set());
    const [showOrders, setShowOrders] = useState(false);
    const [orders, setOrders] = useState([]);
    const [loadingOrders, setLoadingOrders] = useState(false);

    const groupedCartItems = useMemo(() => {
        if (!remoteCart.items) return {};
        const groups = {};
        remoteCart.items.forEach(item => {
            const name = item.added_by_name || 'Guest';
            if (!groups[name]) groups[name] = [];
            groups[name].push(item);
        });
        return groups;
    }, [remoteCart.items]);

    const unacceptedOtherItemsCount = useMemo(() => {
        if (!remoteCart.items) return 0;
        return remoteCart.items.filter(item =>
            item.added_by_id !== user?.id && !acceptedItems.has(item.id)
        ).length;
    }, [remoteCart.items, acceptedItems, user?.id]);

    useEffect(() => { initialize(); }, [initialize]);

    useEffect(() => {
        fetchMenu();
        if (isAuthenticated) {
            checkActiveSession();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [restaurantId, isAuthenticated]);

    // We removed polling in favor of WebSocket 'session:updated' broadcasts

    // WebSocket Cart Real-time Sync
    useEffect(() => {
        if (!activeSession?.id) return;

        let socket;

        const initCart = async () => {
            try {
                const data = await api.get(`/sessions/${activeSession.id}/cart`);
                setRemoteCart(data);
            } catch (err) {
                console.error('Failed to init cart:', err);
            }
        };
        initCart();

        const token = localStorage.getItem('access_token');
        if (token) {
            const wsUrl = APP_CONFIG.SOCKET_URL.replace('http', 'ws') + `/api/v1/ws?token=${token}`;
            socket = new WebSocket(wsUrl);

            socket.onopen = () => {
                socket.send(JSON.stringify({ event: 'join:session', data: { session_id: activeSession.id } }));
            };

            socket.onmessage = (event) => {
                try {
                    const message = JSON.parse(event.data);
                    if (message.event === 'cart:updated') {
                        setRemoteCart(message.data);
                    } else if (message.event === 'session:updated') {
                        if (message.data.status === 'CLOSED' || message.data.status === 'COMPLETED') {
                            setActiveSession(null);
                            toast.error('Session has been closed.');
                            router.push('/');
                        } else if (message.data.status === 'SUBMITTED') {
                            setActiveSession(message.data);
                            setAcceptedItems(new Set());
                        } else {
                            setActiveSession(message.data);
                        }
                    }
                } catch (e) {
                    console.error('Invalid WS message', e);
                }
            };
        }

        return () => {
            if (socket && socket.readyState === WebSocket.OPEN) {
                socket.send(JSON.stringify({ event: 'leave:session', data: { session_id: activeSession.id } }));
                socket.close();
            }
        };
    }, [activeSession?.id]);

    const checkActiveSession = async () => {
        try {
            const data = await getMyActiveSession();
            if (data?.table_id === tableId) {
                setActiveSession(data);
            }
        } catch (err) {
            console.log('No active session or error:', err);
        }
    };

    const refreshSession = async (sessionId) => {
        try {
            const data = await fetchSession(sessionId);
            setActiveSession(data);
        } catch (err) {
            // Might have been closed
            if (err.status === 404) {
                setActiveSession(null);
                toast.error('Session has been closed.');
                router.push('/');
            }
        }
    };

    const fetchMenu = async () => {
        setLoading(true);
        try {
            const data = await api.get(`/restaurants/${restaurantId}/menu`);
            setMenu(data);
        } catch (err) {
            setError('Unable to load menu. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    // Filtered items based on category and search
    const filteredItems = useMemo(() => {
        if (!menu?.items) return [];
        let items = menu.items; // Include unavailable items
        if (activeCategory !== 'all') {
            items = items.filter((item) => item.category_id === activeCategory);
        }
        if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase();
            items = items.filter(
                (item) =>
                    item.name.toLowerCase().includes(q) ||
                    (item.description && item.description.toLowerCase().includes(q))
            );
        }
        return items;
    }, [menu, activeCategory, searchQuery]);

    const cartCount = remoteCart.item_count || 0;
    const totalCartPrice = remoteCart.total || 0;

    const getMenuQty = (menuItemId) => {
        if (!remoteCart.items) return 0;
        return remoteCart.items
            .filter(i => i.menu_item_id === menuItemId)
            .reduce((sum, item) => sum + item.quantity, 0);
    };

    const handleAddMenuQty = async (menuItemId) => {
        if (!isAuthenticated) return setShowAuthModal(true);
        if (!activeSession) return toast.error('Join table first');

        const existing = remoteCart.items.find(i => i.menu_item_id === menuItemId && i.added_by_id === user?.id);
        try {
            if (existing) {
                await api.patch(`/sessions/${activeSession.id}/cart/items/${existing.id}`, { quantity: existing.quantity + 1 });
            } else {
                await api.post(`/sessions/${activeSession.id}/cart/items`, { menu_item_id: menuItemId, quantity: 1 });
            }
        } catch (err) {
            toast.error('Failed to update cart');
        }
    };

    const handleMinusMenuQty = async (menuItemId) => {
        if (!isAuthenticated || !activeSession) return;

        const existing = remoteCart.items.find(i => i.menu_item_id === menuItemId && i.added_by_id === user?.id);
        if (!existing) {
            toast.error("You can only remove items you added.");
            return;
        }
        try {
            if (existing.quantity > 1) {
                await api.patch(`/sessions/${activeSession.id}/cart/items/${existing.id}`, { quantity: existing.quantity - 1 });
            } else {
                await api.delete(`/sessions/${activeSession.id}/cart/items/${existing.id}`);
            }
        } catch (err) {
            toast.error('Failed to update cart');
        }
    };

    const handlePlaceOrder = async () => {
        if (!activeSession) {
            toast.error('You need to join the table session to order.');
            return;
        }

        setIsSubmittingOrder(true);
        try {
            await api.post(`/sessions/${activeSession.id}/orders`, {
                special_notes: `[Payment Method: ${paymentMethod}]`
            });

            toast.success('Order placed successfully!');
            setShowCart(false);
            setRemoteCart({ items: [], total: 0, item_count: 0 });
            setAcceptedItems(new Set());
        } catch (error) {
            toast.error('Failed to place order: ' + (error.data?.detail || error.message));
        } finally {
            setIsSubmittingOrder(false);
        }
    };

    const handleRejectItem = async (cartItemId) => {
        try {
            await api.delete(`/sessions/${activeSession.id}/cart/items/${cartItemId}`);
            toast.success('Item rejected');
            setAcceptedItems(prev => {
                const newSet = new Set(prev);
                newSet.delete(cartItemId);
                return newSet;
            });
        } catch (err) {
            toast.error('Failed to reject item');
        }
    };

    const handleRejectAllPerson = async (personName, items) => {
        try {
            await Promise.all(items.map(item => api.delete(`/sessions/${activeSession.id}/cart/items/${item.id}`)));
            toast.success(`Rejected all items for ${personName}`);
            setAcceptedItems(prev => {
                const newSet = new Set(prev);
                items.forEach(item => newSet.delete(item.id));
                return newSet;
            });
        } catch (err) {
            toast.error('Failed to reject some items');
        }
    };

    const handleAcceptItem = (cartItemId) => {
        setAcceptedItems(prev => {
            const newSet = new Set(prev);
            newSet.add(cartItemId);
            return newSet;
        });
    };

    const handleAcceptAllPerson = (items) => {
        setAcceptedItems(prev => {
            const newSet = new Set(prev);
            items.forEach(item => newSet.add(item.id));
            return newSet;
        });
    };

    const handleLeaveSession = async () => {
        if (!activeSession) return;
        try {
            await apiLeaveSession(activeSession.id);
            setActiveSession(null);
            setShowSessionModal(false);
            toast.success('You have left the session.');
            router.push('/');
        } catch (err) {
            toast.error('Failed to leave session');
        }
    };

    const handleTransferHost = async (newHostId) => {
        if (!activeSession) return;
        try {
            const updated = await transferHostToMember(activeSession.id, newHostId);
            setActiveSession(updated);
            setShowSessionModal(false);
            toast.success('Host transferred successfully.');
        } catch (err) {
            toast.error('Failed to transfer host');
        }
    };

    const handleApproveMember = async (memberId) => {
        if (!activeSession) return;
        try {
            await handleMember(activeSession.id, memberId, 'approve');
            await refreshSession(activeSession.id);
            toast.success('Member approved');
        } catch (err) {
            toast.error('Failed to approve member');
        }
    };

    const handleRejectMember = async (memberId) => {
        if (!activeSession) return;
        try {
            await handleMember(activeSession.id, memberId, 'reject');
            await refreshSession(activeSession.id);
            toast.success('Member rejected');
        } catch (err) {
            toast.error('Failed to reject member');
        }
    };

    const handleAuthSuccess = () => {
        setShowAuthModal(false);
    };

    if (loading) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-background">
                <div className="flex flex-col items-center gap-4">
                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
                    <p className="text-sm font-medium text-muted-foreground">Loading menu...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
                <p className="mb-4 text-destructive">{error}</p>
                <Button onClick={fetchMenu}>Retry</Button>
            </div>
        );
    }

    const pendingRequestsCount = activeSession?.members?.filter(m => m.status === 'PENDING').length || 0;
    const isHost = activeSession?.host_user_id === user?.id;

    return (
        <div className="min-h-screen bg-background pb-24">
            {/* Header */}
            <header className="sticky top-0 z-20 border-b border-border bg-card/95 backdrop-blur-sm shadow-sm">
                <div className="mx-auto max-w-3xl px-4 py-3">
                    <div className="flex items-center justify-between mb-3">
                        <button
                            onClick={() => {
                                if (activeSession) {
                                    handleLeaveSession();
                                } else {
                                    router.push('/');
                                }
                            }}
                            className="flex items-center gap-1.5 text-sm font-medium text-destructive hover:text-destructive/80 transition-colors"
                        >
                            <ArrowLeft className="h-4 w-4" />
                            Leave
                        </button>
                        <h1 className="text-lg font-bold text-foreground">Menu</h1>
                        <div className="flex gap-2">
                            {isAuthenticated && activeSession && (
                                <button
                                    onClick={() => setShowSessionModal(true)}
                                    className="relative flex items-center justify-center rounded-lg bg-secondary/80 p-2 text-foreground hover:bg-secondary transition-colors"
                                >
                                    <Users className="h-5 w-5" />
                                    {isHost && pendingRequestsCount > 0 && (
                                        <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
                                            {pendingRequestsCount}
                                        </span>
                                    )}
                                </button>
                            )}

                            {!isAuthenticated ? (
                                <button
                                    onClick={() => setShowAuthModal(true)}
                                    className="flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
                                >
                                    <LogIn className="h-4 w-4" />
                                    Login
                                </button>
                            ) : (
                                <>
                                    {activeSession && (
                                        <button
                                            onClick={async () => {
                                                setShowOrders(true);
                                                setLoadingOrders(true);
                                                try {
                                                    const data = await api.get(`/orders?session_id=${activeSession.id}`);
                                                    setOrders(data.orders || []);
                                                } catch (err) { console.error(err); }
                                                finally { setLoadingOrders(false); }
                                            }}
                                            className="rounded-lg bg-secondary/80 p-2 text-foreground hover:bg-secondary transition-colors"
                                            title="View Orders"
                                        >
                                            <ClipboardList className="h-5 w-5" />
                                        </button>
                                    )}
                                    <button
                                        onClick={() => setShowCart(true)}
                                        className="relative rounded-lg bg-primary/10 p-2 text-primary hover:bg-primary/20 transition-colors"
                                    >
                                        <ShoppingCart className="h-5 w-5" />
                                        {cartCount > 0 && (
                                            <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                                                {cartCount}
                                            </span>
                                        )}
                                    </button>
                                </>
                            )}
                        </div>
                    </div>

                    {/* Search */}
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <input
                            type="text"
                            placeholder="Search items..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full rounded-lg border border-input bg-background py-2 pl-10 pr-4 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring"
                        />
                    </div>
                </div>

                {/* Category tabs */}
                {menu?.categories?.length > 0 && (
                    <div className="mx-auto max-w-3xl px-4 pb-3">
                        <div className="flex gap-2 overflow-x-auto scrollbar-hide">
                            <button
                                onClick={() => setActiveCategory('all')}
                                className={`shrink-0 rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${activeCategory === 'all'
                                    ? 'bg-primary text-primary-foreground'
                                    : 'bg-secondary/80 text-muted-foreground hover:bg-secondary'
                                    }`}
                            >
                                All
                            </button>
                            {menu.categories.map((cat) => (
                                <button
                                    key={cat.id}
                                    onClick={() => setActiveCategory(cat.id)}
                                    className={`shrink-0 rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${activeCategory === cat.id
                                        ? 'bg-primary text-primary-foreground'
                                        : 'bg-secondary/80 text-muted-foreground hover:bg-secondary'
                                        }`}
                                >
                                    {cat.name}
                                </button>
                            ))}
                        </div>
                    </div>
                )}
            </header>

            {/* Menu Items */}
            <div className="mx-auto max-w-3xl px-4 pt-4">
                {filteredItems.length === 0 ? (
                    <div className="py-16 text-center">
                        <p className="text-muted-foreground">No items found.</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {filteredItems.map((item) => (
                            <div
                                key={item.id}
                                className={`flex gap-4 rounded-xl border p-4 shadow-sm transition-shadow hover:shadow-md ${item.is_available === false ? 'border-border/50 bg-muted/20 opacity-70' : 'border-border bg-card'}`}
                            >
                                <div className="flex-1 min-w-0">
                                    <div className="mb-1 flex items-center gap-2">
                                        {item.diet_type === 'VEG' ? (
                                            <span className="flex h-4 w-4 items-center justify-center rounded-sm border-2 border-green-600">
                                                <span className="h-1.5 w-1.5 rounded-full bg-green-600" />
                                            </span>
                                        ) : (
                                            <span className="flex h-4 w-4 items-center justify-center rounded-sm border-2 border-red-600">
                                                <span className="h-1.5 w-1.5 rounded-full bg-red-600" />
                                            </span>
                                        )}
                                        <h3 className="text-sm font-semibold text-foreground truncate">{item.name}</h3>
                                    </div>
                                    {item.description && (
                                        <p className="mb-2 text-xs text-muted-foreground line-clamp-2">{item.description}</p>
                                    )}
                                    <p className="text-sm font-bold text-foreground">
                                        Rs. {item.price?.toFixed(2)}
                                    </p>
                                </div>

                                {/* Add to cart controls */}
                                <div className="flex shrink-0 flex-col items-center justify-end gap-1">
                                    {item.is_available === false ? (
                                        <span className="bg-destructive/10 text-destructive border border-destructive/20 rounded-md px-2 py-1 text-[10px] font-semibold whitespace-nowrap">
                                            Out of Stock
                                        </span>
                                    ) : getMenuQty(item.id) > 0 ? (
                                        <div className="flex items-center gap-2 rounded-lg border border-primary bg-primary/5 px-1">
                                            <button
                                                onClick={() => handleMinusMenuQty(item.id)}
                                                className="rounded p-1 text-primary hover:bg-primary/10 transition-colors"
                                            >
                                                <Minus className="h-4 w-4" />
                                            </button>
                                            <span className="w-6 text-center text-sm font-bold text-primary">
                                                {getMenuQty(item.id)}
                                            </span>
                                            <button
                                                onClick={() => handleAddMenuQty(item.id)}
                                                className="rounded p-1 text-primary hover:bg-primary/10 transition-colors"
                                            >
                                                <Plus className="h-4 w-4" />
                                            </button>
                                        </div>
                                    ) : (
                                        <button
                                            onClick={() => handleAddMenuQty(item.id)}
                                            className="flex items-center gap-1 rounded-lg border border-primary bg-primary/5 px-3 py-1.5 text-sm font-medium text-primary hover:bg-primary/10 transition-colors"
                                        >
                                            <Plus className="h-4 w-4" />
                                            Add
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Login prompt for unauthenticated users */}
            {!isAuthenticated && (
                <div className="fixed bottom-0 left-0 right-0 z-30 border-t border-border bg-card/95 backdrop-blur-sm px-4 py-3 shadow-lg">
                    <div className="mx-auto max-w-3xl flex items-center justify-between">
                        <p className="text-sm text-muted-foreground">Login to add items and place orders</p>
                        <Button size="sm" onClick={() => setShowAuthModal(true)} className="gap-1.5">
                            <LogIn className="h-4 w-4" />
                            Login
                        </Button>
                    </div>
                </div>
            )}

            {/* Auth Modal */}
            <AuthModal
                isOpen={showAuthModal}
                onClose={() => setShowAuthModal(false)}
                onAuthenticated={handleAuthSuccess}
            />

            {/* Session Management Modal */}
            <SessionManagementModal
                isOpen={showSessionModal}
                onClose={() => setShowSessionModal(false)}
                session={activeSession}
                onLeave={handleLeaveSession}
                onTransferHost={handleTransferHost}
                onApprove={handleApproveMember}
                onReject={handleRejectMember}
            />

            {/* Quick Actions for Guests */}
            {isAuthenticated && activeSession && (
                <QuickActionsBar sessionId={activeSession.id} />
            )}

            {/* Cart Drawer Output */}
            {showCart && (
                <div className="fixed inset-0 z-50 flex justify-end bg-background/60 backdrop-blur-md">
                    <div className="w-full max-w-sm h-full bg-card shadow-xl border-l border-border flex flex-col p-4 animate-in slide-in-from-right">
                        <div className="flex items-center justify-between mb-6 pb-4 border-b border-border">
                            <h2 className="text-xl font-bold flex items-center gap-2">
                                <ShoppingCart className="h-5 w-5" /> Your Cart
                            </h2>
                            <button onClick={() => setShowCart(false)} className="rounded-full p-2 hover:bg-muted text-muted-foreground">
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto space-y-4">
                            {remoteCart.items.length === 0 ? (
                                <div className="text-center py-10 text-muted-foreground">
                                    <ShoppingCart className="h-12 w-12 mx-auto mb-4 opacity-20" />
                                    <p>Your cart is empty.</p>
                                </div>
                            ) : (
                                Object.entries(groupedCartItems).map(([personName, items]) => {
                                    const allAccepted = items.every(item => acceptedItems.has(item.id));
                                    const isSelf = items[0]?.added_by_id === user?.id;

                                    return (
                                        <div key={personName} className="mb-4 space-y-2">
                                            <div className="flex items-center justify-between border-b pb-1">
                                                <h3 className="font-semibold text-sm text-foreground">
                                                    {personName} {isSelf && '(You)'}
                                                </h3>
                                                {isHost && !isSelf && (
                                                    <div className="flex items-center gap-3">
                                                        <button
                                                            onClick={() => handleRejectAllPerson(personName, items)}
                                                            className="text-[11px] font-medium text-destructive hover:underline"
                                                        >
                                                            Reject All
                                                        </button>
                                                        {!allAccepted && (
                                                            <button
                                                                onClick={() => handleAcceptAllPerson(items)}
                                                                className="text-[11px] font-medium text-green-600 hover:underline"
                                                            >
                                                                Accept All
                                                            </button>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                            {items.map((cartItem) => (
                                                <div key={cartItem.id} className={`flex justify-between items-center bg-muted/30 p-3 rounded-lg border ${acceptedItems.has(cartItem.id) ? 'border-green-500/50 bg-green-50/50 dark:bg-green-950/20' : 'border-border'}`}>
                                                    <div className="flex-1 truncate">
                                                        <div className="flex items-center gap-2">
                                                            <p className="font-semibold text-sm truncate">{cartItem.menu_item_name}</p>
                                                            {acceptedItems.has(cartItem.id) && (
                                                                <span className="text-[9px] uppercase tracking-wider bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 px-1.5 py-0.5 rounded-sm font-bold">Accepted</span>
                                                            )}
                                                        </div>
                                                        <p className="text-xs text-primary font-bold">Rs. {(cartItem.menu_item_price * cartItem.quantity).toFixed(2)}</p>
                                                    </div>

                                                    {isSelf ? (
                                                        <div className="flex items-center gap-2 rounded-lg border border-primary bg-primary/5 px-1 ml-2 shrink-0">
                                                            <button
                                                                onClick={() => handleMinusMenuQty(cartItem.menu_item_id)}
                                                                className="rounded p-1 text-primary hover:bg-primary/10 transition-colors"
                                                            >
                                                                <Minus className="h-3 w-3" />
                                                            </button>
                                                            <span className="w-4 text-center text-xs font-bold text-primary">
                                                                {cartItem.quantity}
                                                            </span>
                                                            <button
                                                                onClick={() => handleAddMenuQty(cartItem.menu_item_id)}
                                                                className="rounded p-1 text-primary hover:bg-primary/10 transition-colors"
                                                            >
                                                                <Plus className="h-3 w-3" />
                                                            </button>
                                                        </div>
                                                    ) : isHost ? (
                                                        <div className="flex items-center gap-1 ml-2 shrink-0">
                                                            <span className="px-2 text-xs font-bold text-primary mr-2">
                                                                Qty: {cartItem.quantity}
                                                            </span>
                                                            <button
                                                                onClick={() => handleRejectItem(cartItem.id)}
                                                                className="rounded-lg p-1.5 text-destructive hover:bg-destructive/10 transition-colors border border-transparent hover:border-destructive/20"
                                                                title="Reject"
                                                            >
                                                                <X className="h-4 w-4" />
                                                            </button>
                                                            {!acceptedItems.has(cartItem.id) && (
                                                                <button
                                                                    onClick={() => handleAcceptItem(cartItem.id)}
                                                                    className="rounded-lg p-1.5 text-green-600 hover:bg-green-600/10 transition-colors border border-transparent hover:border-green-600/20"
                                                                    title="Accept"
                                                                >
                                                                    <Check className="h-4 w-4" />
                                                                </button>
                                                            )}
                                                        </div>
                                                    ) : (
                                                        <span className="px-2 text-xs font-bold text-primary">
                                                            Qty: {cartItem.quantity}
                                                        </span>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    );
                                })
                            )}
                        </div>

                        {remoteCart.item_count > 0 && (
                            <div className="pt-4 border-t border-border mt-4">
                                <div className="flex justify-between mb-4">
                                    <span className="font-bold">Total:</span>
                                    <span className="font-bold text-primary">Rs. {remoteCart.total.toFixed(2)}</span>
                                </div>

                                {isHost && (
                                    <div className="mb-4">
                                        <label className="text-xs font-medium text-muted-foreground block mb-1">Payment Method</label>
                                        <div className="relative">
                                            <ChevronDown className="absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                                            <select
                                                value={paymentMethod}
                                                onChange={(e) => setPaymentMethod(e.target.value)}
                                                className="w-full appearance-none rounded-lg border border-input bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-ring"
                                            >
                                                <option value="Pay Later">Pay Later (Post-meal)</option>
                                                <option value="UPI">UPI Payment</option>
                                                <option value="Credit Card">Credit Card</option>
                                                <option value="Cash">Cash</option>
                                            </select>
                                        </div>
                                    </div>
                                )}

                                {isHost ? (
                                    <Button
                                        className="w-full"
                                        onClick={handlePlaceOrder}
                                        disabled={isSubmittingOrder || unacceptedOtherItemsCount > 0}
                                        title={unacceptedOtherItemsCount > 0 ? "Accept all items to place order" : ""}
                                    >
                                        {isSubmittingOrder ? 'Placing Order...' : (unacceptedOtherItemsCount > 0 ? `Review Items First (${unacceptedOtherItemsCount})` : 'Place Order')}
                                    </Button>
                                ) : (
                                    <Button className="w-full" variant="outline" disabled>
                                        Only Host Can Place Order
                                    </Button>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Orders Tracking Panel */}
            {showOrders && (
                <div className="fixed inset-0 z-50 flex justify-end bg-background/60 backdrop-blur-md">
                    <div className="w-full max-w-sm h-full bg-card shadow-xl border-l border-border flex flex-col p-4 animate-in slide-in-from-right">
                        <div className="flex items-center justify-between mb-6 pb-4 border-b border-border">
                            <h2 className="text-xl font-bold flex items-center gap-2">
                                <ClipboardList className="h-5 w-5" /> Order Status
                            </h2>
                            <div className="flex items-center gap-2">
                                <button onClick={async () => {
                                    if (!activeSession) return;
                                    setLoadingOrders(true);
                                    try {
                                        const data = await api.get(`/orders?session_id=${activeSession.id}`);
                                        setOrders(data.orders || []);
                                    } catch (err) { console.error(err); }
                                    finally { setLoadingOrders(false); }
                                }} className="rounded-full p-2 hover:bg-muted text-muted-foreground" title="Refresh">
                                    <RefreshCw className={`h-4 w-4 ${loadingOrders ? 'animate-spin' : ''}`} />
                                </button>
                                <button onClick={() => setShowOrders(false)} className="rounded-full p-2 hover:bg-muted text-muted-foreground">
                                    <X className="h-5 w-5" />
                                </button>
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto space-y-4">
                            {loadingOrders ? (
                                <div className="flex items-center justify-center py-10">
                                    <div className="h-6 w-6 animate-spin rounded-full border-3 border-primary border-t-transparent"></div>
                                </div>
                            ) : orders.length === 0 ? (
                                <div className="text-center py-10 text-muted-foreground">
                                    <ClipboardList className="h-12 w-12 mx-auto mb-4 opacity-20" />
                                    <p>No orders placed yet.</p>
                                </div>
                            ) : (
                                orders.map((order) => {
                                    const statusColors = {
                                        RECEIVED: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
                                        PREPARING: 'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300',
                                        READY: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
                                        SERVED: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300',
                                        COMPLETED: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
                                        CANCELLED: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300',
                                    };
                                    return (
                                        <div key={order.id} className="rounded-lg border border-border bg-muted/20 p-3 space-y-3">
                                            <div className="flex items-center justify-between">
                                                <span className={`text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-sm ${statusColors[order.status] || 'bg-muted text-foreground'}`}>
                                                    {order.status}
                                                </span>
                                                <span className="text-xs text-muted-foreground">
                                                    {new Date(order.submitted_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                            </div>
                                            <div className="space-y-1.5">
                                                {order.items?.map((item) => (
                                                    <div key={item.id} className="flex justify-between items-center text-sm">
                                                        <div className="flex-1 truncate">
                                                            <span className="font-medium">{item.menu_item_name}</span>
                                                            <span className="text-muted-foreground ml-1">x{item.quantity}</span>
                                                        </div>
                                                        <span className="text-xs font-bold text-primary ml-2">Rs. {(item.unit_price * item.quantity).toFixed(2)}</span>
                                                    </div>
                                                ))}
                                            </div>
                                            <div className="flex justify-between items-center pt-2 border-t border-border">
                                                <span className="text-xs text-muted-foreground">Total</span>
                                                <span className="text-sm font-bold text-primary">Rs. {Number(order.total_amount).toFixed(2)}</span>
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
