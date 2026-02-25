'use client';

import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';
import { useToast } from '@/components/ui/Toast';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Badge from '@/components/ui/Badge';
import Modal from '@/components/ui/Modal';
import styles from './restaurants.module.css';
import { useAuthStore } from '@/store/authStore';

export default function RestaurantsPage() {
    const toast = useToast();
    const { isAuthenticated, role } = useAuthStore();
    const [restaurants, setRestaurants] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingRestaurant, setEditingRestaurant] = useState(null);
    const [form, setForm] = useState({ name: '', slug: '', address: '', phone: '' });
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
        setShowModal(true);
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
        try {
            if (editingRestaurant) {
                await api.patch(`/admin/restaurants/${editingRestaurant.id}`, form);
                toast.success('Restaurant updated.');
            } else {
                await api.post('/admin/restaurants', form);
                toast.success('Restaurant created.');
            }
            setShowModal(false);
            fetchRestaurants();
        } catch (err) {
            toast.error(err.message || 'Failed to save restaurant.');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id, e) => {
        if (e) e.stopPropagation();
        if (!confirm('Are you sure you want to delete this restaurant? This cannot be undone.')) return;
        try {
            await api.delete(`/admin/restaurants/${id}`);
            toast.success('Restaurant deleted');
            fetchRestaurants();
        } catch (err) {
            toast.error(err.message || 'Failed to delete restaurant');
        }
    };

    if (loading) {
        return <div className={styles.page}><p>Loading restaurants...</p></div>;
    }

    if (!isAuthenticated || role !== 'SUPER_ADMIN') {
        return null;
    }

    return (
        <div className={styles.page}>
            <div className={styles.header}>
                <h1 className={styles.title}>Restaurants</h1>
                <Button onClick={openCreate}>+ New Restaurant</Button>
            </div>

            {restaurants.length === 0 ? (
                <div className={styles.emptyState}>
                    <div className={styles.emptyIcon}>🍽️</div>
                    <div className={styles.emptyTitle}>No restaurants yet</div>
                    <p>Create your first restaurant to get started.</p>
                    <Button onClick={openCreate} style={{ marginTop: 'var(--space-4)' }}>
                        + Create Restaurant
                    </Button>
                </div>
            ) : (
                <div className={styles.list}>
                    {restaurants.map((r) => (
                        <div key={r.id} className={styles.card} onClick={() => openEdit(r)}>
                            <div className={styles.cardHeader}>
                                <div>
                                    <div className={styles.cardName}>{r.name}</div>
                                    <div className={styles.cardSlug}>/{r.slug}</div>
                                </div>
                                <Badge variant={r.is_active ? 'success' : 'neutral'}>
                                    {r.is_active ? 'Active' : 'Inactive'}
                                </Badge>
                            </div>
                            <div className={styles.cardDetails}>
                                {r.address && (
                                    <div className={styles.cardRow}>📍 {r.address}</div>
                                )}
                                {r.phone && (
                                    <div className={styles.cardRow}>📞 {r.phone}</div>
                                )}
                            </div>
                            <div className={styles.cardActions}>
                                <Button variant="secondary" size="sm" onClick={(e) => { e.stopPropagation(); openEdit(r); }}>
                                    Edit
                                </Button>
                                <Button variant="ghost" size="sm" style={{ color: 'var(--color-error)' }} onClick={(e) => handleDelete(r.id, e)}>
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
                <div className={styles.formGrid}>
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
                </div>
            </Modal>
        </div>
    );
}
