'use client';

import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';
import { useToast } from '@/components/ui/Toast';
import { useBlocking } from '@/components/ui/BlockingOverlay';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Badge from '@/components/ui/Badge';
import Modal from '@/components/ui/Modal';
import MapPicker from '@/components/admin/MapPicker';
import { useAuthStore } from '@/store/authStore';
import { Plus, Store, MapPin, Phone, Edit2, Trash2, ExternalLink } from 'lucide-react';

export default function RestaurantsPage() {
    const toast = useToast();
    const { runBlocking } = useBlocking();
    const { isAuthenticated, role } = useAuthStore();
    const [restaurants, setRestaurants] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingRestaurant, setEditingRestaurant] = useState(null);
    const [form, setForm] = useState({ name: '', slug: '', address: '', phone: '' });
    const [location, setLocation] = useState({ latitude: null, longitude: null, provider: null, placeId: null });
    const [saving, setSaving] = useState(false);

    const fetchRestaurants = useCallback(async () => {
        try {
            const data = await api.get('/admin/restaurants');
            setRestaurants(data);
        } catch (err) {
            toast.error(err.message || 'Failed to load restaurants.');
        } finally {
            setLoading(false);
        }
    }, [toast]);

    useEffect(() => {
        fetchRestaurants();
    }, [fetchRestaurants]);

    const openCreate = () => {
        setEditingRestaurant(null);
        setForm({ name: '', slug: '', address: '', phone: '' });
        setLocation({ latitude: null, longitude: null, provider: null, placeId: null });
        setShowModal(true);
    };

    const openEdit = (restaurant) => {
        setEditingRestaurant(restaurant);
        setForm({
            name: restaurant.name,
            slug: restaurant.slug,
            address: restaurant.address || '',
            phone: restaurant.phone || '',
        });
        setLocation({
            latitude: restaurant.location?.latitude ?? null,
            longitude: restaurant.location?.longitude ?? null,
            provider: restaurant.location?.provider ?? null,
            placeId: restaurant.location?.provider_place_id ?? null,
        });
        setShowModal(true);
    };

    /** Pin moved on the map: store coords; prefill the address only if empty. */
    const handleLocationChange = ({ latitude, longitude, provider, placeId, address }) => {
        setLocation({ latitude, longitude, provider: provider ?? null, placeId: placeId ?? null });
        if (address) {
            setForm((prev) => (prev.address?.trim() ? prev : { ...prev, address }));
        }
    };

    /** Auto-generate slug from name. */
    const handleNameChange = (value) => {
        setForm((prev) => ({
            ...prev,
            name: value,
            slug: editingRestaurant
                ? prev.slug  // Don't auto-change slug on edit
                : value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''),
        }));
    };

    const handleSave = async () => {
        if (!form.name.trim() || !form.slug.trim()) {
            toast.warning('Name and slug are required.');
            return;
        }
        setSaving(true);
        await runBlocking(async () => {
            try {
                const saved = editingRestaurant
                    ? await api.patch(`/admin/restaurants/${editingRestaurant.id}`, form)
                    : await api.post('/admin/restaurants', form);
                // Persist the map location if a pin was placed.
                if (location.latitude != null && location.longitude != null) {
                    await api.put(`/admin/restaurants/${saved.id}/location`, {
                        formatted_address: form.address || null,
                        latitude: location.latitude,
                        longitude: location.longitude,
                        provider: location.provider,
                        provider_place_id: location.placeId,
                    });
                }
                toast.success(editingRestaurant ? 'Restaurant updated.' : 'Restaurant created.');
                setShowModal(false);
                await fetchRestaurants();
            } catch (err) {
                toast.error(err.message || 'Failed to save restaurant.');
            }
        }, editingRestaurant ? 'Saving changes…' : 'Creating restaurant…');
        setSaving(false);
    };

    const handleDelete = async (id, e) => {
        if (e) e.stopPropagation();
        if (!confirm('Are you sure you want to delete this restaurant? This cannot be undone.')) return;
        await runBlocking(async () => {
            try {
                await api.delete(`/admin/restaurants/${id}`);
                toast.success('Restaurant deleted');
                await fetchRestaurants();
            } catch (err) {
                toast.error(err.message || 'Failed to delete restaurant');
            }
        }, 'Deleting restaurant…');
    };

    if (loading) {
        return (
            <div className="flex h-[50vh] flex-col items-center justify-center gap-4">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
                <p className="text-sm font-medium text-muted-foreground">Loading restaurants...</p>
            </div>
        );
    }

    if (!isAuthenticated || role !== 'SUPER_ADMIN') {
        return null;
    }

    return (
        <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-foreground">Restaurants</h1>
                    <p className="text-sm text-muted-foreground mt-1">Manage all restaurant locations and details.</p>
                </div>
                <Button onClick={openCreate} className="w-full sm:w-auto">
                    <Plus className="mr-2 h-4 w-4" />
                    New Restaurant
                </Button>
            </div>

            {restaurants.length === 0 ? (
                <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-card py-24 text-center">
                    <Store className="mb-4 h-12 w-12 text-muted-foreground/50" />
                    <h2 className="text-xl font-semibold text-foreground">No restaurants yet</h2>
                    <p className="mb-6 mt-2 max-w-sm text-sm text-muted-foreground">
                        Create your first restaurant to start managing its menu, tables, and orders.
                    </p>
                    <Button onClick={openCreate}>
                        <Plus className="mr-2 h-4 w-4" />
                        Create Restaurant
                    </Button>
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {restaurants.map((r) => (
                        <div
                            key={r.id}
                            className="group relative flex flex-col justify-between overflow-hidden rounded-xl border border-border bg-card p-6 shadow-sm transition-all hover:border-primary/50 hover:shadow-md cursor-pointer"
                            onClick={() => openEdit(r)}
                        >
                            <div>
                                <div className="flex items-start justify-between gap-4">
                                    <div className="flex-1 overflow-hidden">
                                        <h3 className="truncate text-lg font-semibold tracking-tight text-foreground transition-colors group-hover:text-primary">
                                            {r.name}
                                        </h3>
                                        <p className="truncate text-sm text-muted-foreground">
                                            /{r.slug}
                                        </p>
                                    </div>
                                    <Badge variant={r.is_active ? 'success' : 'neutral'} className="shrink-0">
                                        {r.is_active ? 'Active' : 'Inactive'}
                                    </Badge>
                                </div>
                                <div className="mb-4 mt-6 flex flex-col gap-2.5">
                                    {r.address && (
                                        <div className="flex items-start gap-2.5 text-sm text-muted-foreground">
                                            <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-foreground/70" />
                                            <span className="line-clamp-2">{r.address}</span>
                                        </div>
                                    )}
                                    {r.phone && (
                                        <div className="flex items-center gap-2.5 text-sm text-muted-foreground">
                                            <Phone className="h-4 w-4 shrink-0 text-foreground/70" />
                                            <span className="truncate">{r.phone}</span>
                                        </div>
                                    )}
                                    {r.location?.map_url && (
                                        <a
                                            href={r.location.map_url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            onClick={(e) => e.stopPropagation()}
                                            className="flex items-center gap-2.5 text-sm font-medium text-primary hover:underline"
                                        >
                                            <MapPin className="h-4 w-4 shrink-0" />
                                            <span className="truncate">View on map</span>
                                            <ExternalLink className="h-3.5 w-3.5 shrink-0" />
                                        </a>
                                    )}
                                </div>
                            </div>
                            <div className="mt-4 flex items-center justify-end gap-2 border-t border-border pt-4">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="h-8"
                                    onClick={(e) => { e.stopPropagation(); openEdit(r); }}
                                >
                                    <Edit2 className="mr-1.5 h-3.5 w-3.5" />
                                    Edit
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-8 text-destructive hover:bg-destructive/10 hover:text-destructive"
                                    onClick={(e) => handleDelete(r.id, e)}
                                >
                                    <Trash2 className="mr-1.5 h-3.5 w-3.5" />
                                    Delete
                                </Button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Create/Edit Modal */}
            <Modal
                isOpen={showModal}
                onClose={() => setShowModal(false)}
                title={editingRestaurant ? 'Edit Restaurant' : 'New Restaurant'}
                footer={
                    <>
                        <Button variant="ghost" onClick={() => setShowModal(false)}>Cancel</Button>
                        <Button onClick={handleSave} loading={saving}>
                            {editingRestaurant ? 'Save Changes' : 'Create'}
                        </Button>
                    </>
                }
            >
                <div className="grid gap-4 py-4">
                    <Input
                        id="name"
                        label="Restaurant Name"
                        value={form.name}
                        onChange={(e) => handleNameChange(e.target.value)}
                        placeholder="Mehfil Kitchen"
                        autoFocus
                    />
                    <Input
                        id="slug"
                        label="URL Slug"
                        value={form.slug}
                        onChange={(e) => setForm({ ...form, slug: e.target.value })}
                        placeholder="mehfil-kitchen"
                    />
                    <Input
                        id="address"
                        label="Address"
                        value={form.address}
                        onChange={(e) => setForm({ ...form, address: e.target.value })}
                        placeholder="123 Street, City"
                    />
                    <Input
                        id="phone"
                        label="Phone"
                        type="tel"
                        value={form.phone}
                        onChange={(e) => setForm({ ...form, phone: e.target.value })}
                        placeholder="9876543210"
                    />
                    <div className="grid w-full items-center gap-1.5">
                        <label className="text-sm font-medium leading-none text-foreground">Location on map</label>
                        <p className="text-xs text-muted-foreground">
                            Search for the restaurant, then click the map or drag the pin to set the exact spot.
                        </p>
                        <MapPicker
                            latitude={location.latitude}
                            longitude={location.longitude}
                            onChange={handleLocationChange}
                        />
                    </div>
                </div>
            </Modal>
        </div>
    );
}
