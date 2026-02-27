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
    Leaf, Flame, LogIn, ChevronDown
} from 'lucide-react';

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

    useEffect(() => { initialize(); }, [initialize]);

    useEffect(() => {
        fetchMenu();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [restaurantId]);

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
                        <div className="relative">
                            {!isAuthenticated ? (
                                <button
                                    onClick={() => setShowAuthModal(true)}
                                    className="flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
                                >
                                    <LogIn className="h-4 w-4" />
                                    Login
                                </button>
                            ) : (
                                <button className="relative rounded-lg bg-primary/10 p-2 text-primary hover:bg-primary/20 transition-colors">
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
        </div>
    );
}
