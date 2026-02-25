'use client';

import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';
import { useToast } from '@/components/ui/Toast';
import RestaurantSelector from '@/components/admin/RestaurantSelector';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import Input from '@/components/ui/Input';
import Badge from '@/components/ui/Badge';
import sharedStyles from '../shared.module.css';

import { useAuthStore } from '@/store/authStore';

const DIET_TYPES = ['VEG', 'NON_VEG', 'VEGAN', 'EGGETARIAN'];

export default function MenuPage() {
    const toast = useToast();
    const { role, restaurantId: authRestaurantId } = useAuthStore();
    const [restaurantId, setLocalRestaurantId] = useState(authRestaurantId);

    useEffect(() => {
        if (authRestaurantId && role !== 'SUPER_ADMIN') {
            setLocalRestaurantId(authRestaurantId);
        }
    }, [authRestaurantId, role]);

    const [menu, setMenu] = useState({ categories: [], items: [] });
    const [loading, setLoading] = useState(false);

    // Modals state
    const [catModal, setCatModal] = useState({ open: false, data: null });
    const [itemModal, setItemModal] = useState({ open: false, data: null, categoryId: null });

    const fetchMenu = useCallback(async (rId) => {
        if (!rId) {
            setMenu({ categories: [], items: [] });
            return;
        }
        setLoading(true);
        try {
            const data = await api.get(`/restaurants/${rId}/menu/admin`);
            setMenu(data);
        } catch (err) {
            toast.error('Failed to load menu');
        } finally {
            setLoading(false);
        }
    }, [toast]);

    useEffect(() => {
        fetchMenu(restaurantId);
    }, [restaurantId, fetchMenu]);

    // -- Category Actions --
    const handleCatSave = async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const body = {
            name: formData.get('name'),
            display_order: parseInt(formData.get('display_order')) || 0,
        };

        try {
            if (catModal.data) {
                // Update
                const id = catModal.data.id;
                await api.patch(`/categories/${id}`, body);
                toast.success('Category updated');
            } else {
                // Create
                await api.post(`/restaurants/${restaurantId}/categories`, body);
                toast.success('Category created');
            }
            setCatModal({ open: false, data: null });
            fetchMenu(restaurantId);
        } catch (err) {
            toast.error(err.message || 'Failed to save category');
        }
    };

    // -- Item Actions --
    const handleItemSave = async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const body = {
            category_id: formData.get('category_id'),
            name: formData.get('name'),
            description: formData.get('description'),
            price: parseFloat(formData.get('price')),
            diet_type: formData.get('diet_type'),
            display_order: parseInt(formData.get('display_order')) || 0,
            is_available: formData.get('is_available') === 'true',
        };

        try {
            if (itemModal.data) {
                // Update
                await api.patch(`/menu/items/${itemModal.data.id}`, body);
                toast.success('Item updated');
            } else {
                // Create
                await api.post(`/restaurants/${restaurantId}/menu/items`, body);
                toast.success('Item created');
            }
            setItemModal({ open: false, data: null, categoryId: null });
            fetchMenu(restaurantId);
        } catch (err) {
            toast.error(err.message || 'Failed to save menu item');
        }
    };

    const deleteItem = async (id) => {
        if (!confirm('Are you sure you want to remove this item?')) return;
        try {
            await api.delete(`/menu/items/${id}`);
            toast.success('Item deleted');
            fetchMenu(restaurantId);
        } catch (err) {
            toast.error('Failed to delete item');
        }
    };

    return (
        <div className={sharedStyles.page}>
            <div className={sharedStyles.header}>
                <div>
                    <h1 className={sharedStyles.title}>Menu Management</h1>
                    <p className={sharedStyles.subtitle}>Manage categories and items</p>
                </div>
                <div className={sharedStyles.toolbar}>
                    <RestaurantSelector className={sharedStyles.select} onSelect={setLocalRestaurantId} />
                    {restaurantId && (
                        <Button onClick={() => setCatModal({ open: true, data: null })}>
                            + Add Category
                        </Button>
                    )}
                </div>
            </div>

            {!restaurantId ? (
                <div className={sharedStyles.emptyState}>
                    Please select a restaurant to manage its menu.
                </div>
            ) : loading ? (
                <div className={sharedStyles.loading}>Loading menu...</div>
            ) : menu.categories.length === 0 ? (
                <div className={sharedStyles.emptyState}>
                    <div className={sharedStyles.emptyIcon}>📋</div>
                    <div className={sharedStyles.emptyTitle}>No menu available</div>
                    <p>Start by creating your first category.</p>
                    <Button style={{ marginTop: 'var(--space-4)' }} onClick={() => setCatModal({ open: true, data: null })}>
                        + Create Category
                    </Button>
                </div>
            ) : (
                <div className={sharedStyles.list}>
                    {menu.categories.map((cat) => {
                        const items = menu.items.filter(i => i.category_id === cat.id);
                        return (
                            <div key={cat.id} className={sharedStyles.categorySection}>
                                <div className={sharedStyles.categoryHeader}>
                                    <h3
                                        className={sharedStyles.categoryName}
                                        onClick={() => setCatModal({ open: true, data: cat })}
                                        style={{ cursor: 'pointer' }}
                                    >
                                        {cat.name} <span style={{ fontSize: '0.8rem', color: 'var(--color-primary)' }}>✎ Edit</span>
                                    </h3>
                                    <div className={sharedStyles.categoryActions}>
                                        <Badge variant={cat.is_active ? 'success' : 'neutral'}>
                                            {cat.is_active ? 'Active' : 'Inactive'}
                                        </Badge>
                                        <Button size="sm" onClick={() => setItemModal({ open: true, data: null, categoryId: cat.id })}>
                                            + Add Item
                                        </Button>
                                    </div>
                                </div>
                                <div className={sharedStyles.grid}>
                                    {items.map(item => (
                                        <div key={item.id} className={sharedStyles.card}>
                                            <div className={sharedStyles.cardHeader}>
                                                <div className={sharedStyles.cardTitle}>
                                                    <span className={sharedStyles.dietDot}
                                                        style={{ background: item.diet_type === 'VEG' ? '#10B981' : item.diet_type === 'NON_VEG' ? '#EF4444' : '#F59E0B', marginRight: 'var(--space-2)' }}></span>
                                                    {item.name}
                                                </div>
                                                <div className={sharedStyles.price}>₹{item.price}</div>
                                            </div>
                                            <div className={sharedStyles.cardBody}>
                                                <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)' }}>
                                                    {item.description}
                                                </p>
                                                <Badge style={{ alignSelf: 'flex-start' }} variant={item.is_available ? 'success' : 'neutral'}>
                                                    {item.is_available ? 'Available' : 'Unavailable'}
                                                </Badge>
                                            </div>
                                            <div className={sharedStyles.cardActions}>
                                                <Button size="sm" variant="secondary" onClick={() => setItemModal({ open: true, data: item, categoryId: cat.id })}>
                                                    Edit
                                                </Button>
                                                {item.is_available && (
                                                    <Button size="sm" variant="ghost" onClick={() => deleteItem(item.id)}>
                                                        Remove
                                                    </Button>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                    {items.length === 0 && (
                                        <div style={{ color: 'var(--color-text-muted)', fontSize: 'var(--font-size-sm)', fontStyle: 'italic' }}>
                                            No items in this category yet.
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Category Modal */}
            <Modal
                isOpen={catModal.open}
                onClose={() => setCatModal({ open: false, data: null })}
                title={catModal.data ? 'Edit Category' : 'New Category'}
            >
                <form id="catForm" onSubmit={handleCatSave} className={sharedStyles.formGrid}>
                    <Input name="name" label="Category Name" defaultValue={catModal.data?.name || ''} required autoFocus />
                    <Input name="display_order" label="Display Order" type="number" defaultValue={catModal.data?.display_order || 0} />
                </form>
                <div style={{ marginTop: 'var(--space-4)', display: 'flex', gap: 'var(--space-2)', justifyContent: 'flex-end' }}>
                    <Button variant="ghost" onClick={() => setCatModal({ open: false, data: null })}>Cancel</Button>
                    <Button type="submit" form="catForm">Save Category</Button>
                </div>
            </Modal>

            {/* Menu Item Modal */}
            <Modal
                isOpen={itemModal.open}
                onClose={() => setItemModal({ open: false, data: null, categoryId: null })}
                title={itemModal.data ? 'Edit Item' : 'New Menu Item'}
            >
                <form id="itemForm" onSubmit={handleItemSave} className={sharedStyles.formGrid}>
                    <input type="hidden" name="category_id" value={itemModal.data?.category_id || itemModal.categoryId || ''} />

                    <Input name="name" label="Item Name" defaultValue={itemModal.data?.name || ''} required autoFocus />
                    <Input name="description" label="Description" textarea defaultValue={itemModal.data?.description || ''} />

                    <div className={sharedStyles.formRow}>
                        <Input name="price" label="Price (₹)" type="number" step="0.01" defaultValue={itemModal.data?.price || ''} required />
                        <div>
                            <label style={{ display: 'block', fontSize: 'var(--font-size-sm)', marginBottom: 'var(--space-1)', fontWeight: 'var(--font-weight-medium)' }}>Diet Type</label>
                            <select name="diet_type" className={sharedStyles.select} defaultValue={itemModal.data?.diet_type || 'VEG'} style={{ width: '100%' }}>
                                {DIET_TYPES.map(d => <option key={d} value={d}>{d}</option>)}
                            </select>
                        </div>
                    </div>

                    <div className={sharedStyles.formRow}>
                        <Input name="display_order" label="Display Order" type="number" defaultValue={itemModal.data?.display_order || 0} />
                        <div>
                            <label style={{ display: 'block', fontSize: 'var(--font-size-sm)', marginBottom: 'var(--space-1)', fontWeight: 'var(--font-weight-medium)' }}>Status</label>
                            <select name="is_available" className={sharedStyles.select} defaultValue={itemModal.data ? String(itemModal.data.is_available) : 'true'} style={{ width: '100%' }}>
                                <option value="true">Available</option>
                                <option value="false">Unavailable</option>
                            </select>
                        </div>
                    </div>
                </form>
                <div style={{ marginTop: 'var(--space-4)', display: 'flex', gap: 'var(--space-2)', justifyContent: 'flex-end' }}>
                    <Button variant="ghost" onClick={() => setItemModal({ open: false, data: null, categoryId: null })}>Cancel</Button>
                    <Button type="submit" form="itemForm">Save Item</Button>
                </div>
            </Modal>
        </div>
    );
}
