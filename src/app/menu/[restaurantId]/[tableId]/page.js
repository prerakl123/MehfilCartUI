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
    Leaf, Flame, LogIn, ChevronDown, Users, X
} from 'lucide-react';
import SessionManagementModal from '@/components/session/SessionManagementModal';
import { useSession } from '@/hooks/useSession';
import { useToast } from '@/components/ui/Toast';

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
    const [cartItems, setCartItems] = useState({});
    
    // Session and UI state
    const { getMyActiveSession, fetchSession, handleMember, transferHostToMember, leaveSession: apiLeaveSession } = useSession();
    const { user } = useAuthStore();
    const toast = useToast();
    
    const [activeSession, setActiveSession] = useState(null);
    const [showSessionModal, setShowSessionModal] = useState(false);
    const [showCart, setShowCart] = useState(false);
    const [isSubmittingOrder, setIsSubmittingOrder] = useState(false);

    useEffect(() => { initialize(); }, [initialize]);

    useEffect(() => {
        fetchMenu();
        if (isAuthenticated) {
            checkActiveSession();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [restaurantId, isAuthenticated]);

    // Polling for session updates
    useEffect(() => {
        let interval;
        if (activeSession) {
            interval = setInterval(() => {
                refreshSession(activeSession.id);
            }, 10000);
        }
        return () => clearInterval(interval);
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
        let items = menu.items.filter((item) => item.is_available !== false);
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

    const cartCount = Object.values(cartItems).reduce((sum, qty) => sum + qty, 0);

    const addToCart = (itemId) => {
        if (!isAuthenticated) {
            setShowAuthModal(true);
            return;
        }
        setCartItems((prev) => ({ ...prev, [itemId]: (prev[itemId] || 0) + 1 }));
    };

    const removeFromCart = (itemId) => {
        setCartItems((prev) => {
            const next = { ...prev };
            if (next[itemId] > 1) {
                next[itemId] -= 1;
            } else {
                delete next[itemId];
            }
            return next;
        });
    };

    const handlePlaceOrder = async () => {
        if (!activeSession) {
            toast.error('You need to join the table session to order.');
            return;
        }
        
        setIsSubmittingOrder(true);
        try {
            const items = Object.entries(cartItems).map(([item_id, quantity]) => ({
                menu_item_id: item_id,
                quantity: quantity
            }));
            
            await api.post('/orders', {
                session_id: activeSession.id,
                items: items
            });
            
            toast.success('Order placed successfully!');
            setCartItems({});
            setShowCart(false);
        } catch (error) {
            toast.error('Failed to place order: ' + (error.data?.detail || error.message));
        } finally {
            setIsSubmittingOrder(false);
        }
    };

    const totalCartPrice = useMemo(() => {
        if (!menu?.items) return 0;
        return Object.entries(cartItems).reduce((total, [itemId, qty]) => {
            const item = menu.items.find(i => i.id === itemId);
            return total + (item ? item.price * qty : 0);
        }, 0);
    }, [cartItems, menu]);

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
                            onClick={() => router.back()}
                            className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                        >
                            <ArrowLeft className="h-4 w-4" />
                            Back
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
                                className="flex gap-4 rounded-xl border border-border bg-card p-4 shadow-sm transition-shadow hover:shadow-md"
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
                                    {cartItems[item.id] ? (
                                        <div className="flex items-center gap-2 rounded-lg border border-primary bg-primary/5 px-1">
                                            <button
                                                onClick={() => removeFromCart(item.id)}
                                                className="rounded p-1 text-primary hover:bg-primary/10 transition-colors"
                                            >
                                                <Minus className="h-4 w-4" />
                                            </button>
                                            <span className="w-6 text-center text-sm font-bold text-primary">
                                                {cartItems[item.id]}
                                            </span>
                                            <button
                                                onClick={() => addToCart(item.id)}
                                                className="rounded p-1 text-primary hover:bg-primary/10 transition-colors"
                                            >
                                                <Plus className="h-4 w-4" />
                                            </button>
                                        </div>
                                    ) : (
                                        <button
                                            onClick={() => addToCart(item.id)}
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

            {/* Cart Drawer Output */}
            {showCart && (
                <div className="fixed inset-0 z-50 flex justify-end bg-background/80 backdrop-blur-sm">
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
                            {cartCount === 0 ? (
                                <div className="text-center py-10 text-muted-foreground">
                                    <ShoppingCart className="h-12 w-12 mx-auto mb-4 opacity-20" />
                                    <p>Your cart is empty.</p>
                                </div>
                            ) : (
                                Object.entries(cartItems).map(([itemId, qty]) => {
                                    const item = menu?.items?.find(i => i.id === itemId);
                                    if (!item) return null;
                                    return (
                                        <div key={itemId} className="flex justify-between items-center bg-muted/30 p-3 rounded-lg border border-border">
                                            <div className="flex-1 truncate">
                                                <p className="font-semibold text-sm truncate">{item.name}</p>
                                                <p className="text-xs text-primary font-bold">Rs. {(item.price * qty).toFixed(2)}</p>
                                            </div>
                                            <div className="flex items-center gap-2 rounded-lg border border-primary bg-primary/5 px-1 ml-2 shrink-0">
                                                <button
                                                    onClick={() => removeFromCart(item.id)}
                                                    className="rounded p-1 text-primary hover:bg-primary/10 transition-colors"
                                                >
                                                    <Minus className="h-3 w-3" />
                                                </button>
                                                <span className="w-4 text-center text-xs font-bold text-primary">
                                                    {qty}
                                                </span>
                                                <button
                                                    onClick={() => addToCart(item.id)}
                                                    className="rounded p-1 text-primary hover:bg-primary/10 transition-colors"
                                                >
                                                    <Plus className="h-3 w-3" />
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                        
                        {cartCount > 0 && (
                            <div className="pt-4 border-t border-border mt-4">
                                <div className="flex justify-between mb-4">
                                    <span className="font-bold">Total:</span>
                                    <span className="font-bold text-primary">Rs. {totalCartPrice.toFixed(2)}</span>
                                </div>
                                {activeSession ? (
                                    <Button className="w-full" onClick={handlePlaceOrder} disabled={isSubmittingOrder}>
                                        {isSubmittingOrder ? 'Placing Order...' : 'Place Order'}
                                    </Button>
                                ) : (
                                    <Button className="w-full" onClick={() => router.push(`/join/${restaurantId}/${tableId}`)}>
                                        Join Table to Order
                                    </Button>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
