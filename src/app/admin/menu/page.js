'use client';

import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';
import { useToast } from '@/components/ui/Toast';
import RestaurantSelector from '@/components/admin/RestaurantSelector';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import Input from '@/components/ui/Input';
import Badge from '@/components/ui/Badge';
import { Plus, Edit2, Trash2, MenuSquare, AlertCircle } from 'lucide-react';

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
        if (!rId || rId === 'global') {
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
            prep_time_minutes: parseInt(formData.get('prep_time_minutes')) || null,
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
        <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-foreground">Menu Management</h1>
                    <p className="text-sm text-muted-foreground mt-1">Manage categories and items</p>
                </div>
                <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
                    <RestaurantSelector className="w-full sm:w-[250px]" onSelect={setLocalRestaurantId} />
                    {restaurantId && (
                        <Button className="w-full sm:w-auto" onClick={() => setCatModal({ open: true, data: null })}>
                            <Plus className="mr-2 h-4 w-4" />
                            Add Category
                        </Button>
                    )}
                </div>
            </div>

            {!restaurantId || restaurantId === 'global' ? (
                <div className="flex h-[400px] flex-col items-center justify-center rounded-xl border border-dashed border-border bg-card/50 text-center px-4">
                    <div className="rounded-full bg-secondary p-4 mb-4">
                        <AlertCircle className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <h3 className="text-lg font-medium text-foreground mb-1">
                        {restaurantId === 'global' ? 'Select a Specific Restaurant' : 'Select a Restaurant'}
                    </h3>
                    <p className="text-sm text-muted-foreground max-w-sm">
                        {restaurantId === 'global'
                            ? 'Menu management is scoped to individual restaurants. Please select one from the dropdown.'
                            : 'Please select a restaurant from the dropdown above to manage its menu items and categories.'}
                    </p>
                </div>
            ) : loading ? (
                <div className="flex h-[400px] flex-col items-center justify-center gap-4">
                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
                    <p className="text-sm font-medium text-muted-foreground">Loading menu...</p>
                </div>
            ) : menu.categories.length === 0 ? (
                <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-card py-24 text-center px-4">
                    <div className="rounded-full bg-primary/10 p-4 mb-4">
                        <MenuSquare className="h-10 w-10 text-primary" />
                    </div>
                    <h3 className="text-xl font-semibold text-foreground mb-2">No menu available</h3>
                    <p className="max-w-sm text-sm text-muted-foreground mb-6">
                        Start building your menu by creating your first category.
                    </p>
                    <Button onClick={() => setCatModal({ open: true, data: null })}>
                        <Plus className="mr-2 h-4 w-4" />
                        Create Category
                    </Button>
                </div>
            ) : (
                <div className="flex flex-col gap-8">
                    {menu.categories.map((cat) => {
                        const items = menu.items.filter(i => i.category_id === cat.id);
                        return (
                            <div key={cat.id} className="flex flex-col gap-4">
                                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 rounded-lg bg-secondary/50 p-4">
                                    <div
                                        className="group flex items-center gap-3 cursor-pointer"
                                        onClick={() => setCatModal({ open: true, data: cat })}
                                    >
                                        <h3 className="text-xl font-semibold tracking-tight text-foreground transition-colors group-hover:text-primary">
                                            {cat.name}
                                        </h3>
                                        <div className="flex items-center text-xs font-medium text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100">
                                            <Edit2 className="mr-1 h-3 w-3" />
                                            Edit
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <Badge variant={cat.is_active ? 'success' : 'neutral'}>
                                            {cat.is_active ? 'Active' : 'Inactive'}
                                        </Badge>
                                        <Button size="sm" onClick={() => setItemModal({ open: true, data: null, categoryId: cat.id })}>
                                            <Plus className="mr-1.5 h-3.5 w-3.5" />
                                            Add Item
                                        </Button>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                                    {items.map(item => (
                                        <div key={item.id} className="flex flex-col justify-between rounded-xl border border-border bg-card p-5 shadow-sm transition-all hover:border-primary/50 hover:shadow-md">
                                            <div className="flex flex-col gap-3">
                                                <div className="flex items-start justify-between gap-2">
                                                    <div className="flex items-center gap-2 font-medium text-foreground">
                                                        <span
                                                            className={`h-3 w-3 shrink-0 rounded-sm border`}
                                                            style={{
                                                                borderColor: item.diet_type === 'VEG' || item.diet_type === 'VEGAN' ? '#10B981' : item.diet_type === 'NON_VEG' ? '#EF4444' : '#F59E0B',
                                                                backgroundColor: item.diet_type === 'VEG' || item.diet_type === 'VEGAN' ? '#10B98120' : item.diet_type === 'NON_VEG' ? '#EF444420' : '#F59E0B20'
                                                            }}
                                                            title={item.diet_type}
                                                        />
                                                        <span className="line-clamp-2 leading-tight">{item.name}</span>
                                                    </div>
                                                    <div className="font-semibold text-foreground">₹{item.price}</div>
                                                </div>
                                                <p className="text-sm text-muted-foreground line-clamp-2 min-h-[2.5rem]">
                                                    {item.description}
                                                </p>
                                                <div className="mt-1">
                                                    <Badge variant={item.is_available ? 'success' : 'neutral'} className="text-[10px] px-1.5 py-0 h-5">
                                                        {item.is_available ? 'Available' : 'Unavailable'}
                                                    </Badge>
                                                </div>
                                            </div>
                                            <div className="mt-5 flex items-center justify-end gap-2 border-t border-border pt-4">
                                                <Button size="sm" variant="outline" className="h-8 px-3" onClick={() => setItemModal({ open: true, data: item, categoryId: cat.id })}>
                                                    <Edit2 className="mr-1.5 h-3 w-3" />
                                                    Edit
                                                </Button>
                                                {item.is_available && (
                                                    <Button size="sm" variant="ghost" className="h-8 px-3 text-destructive hover:bg-destructive/10 hover:text-destructive" onClick={() => deleteItem(item.id)}>
                                                        <Trash2 className="mr-1.5 h-3 w-3" />
                                                        Remove
                                                    </Button>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                    {items.length === 0 && (
                                        <div className="col-span-full rounded-lg border border-dashed border-border py-8 text-center text-sm font-medium italic text-muted-foreground bg-secondary/10">
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
                footer={
                    <>
                        <Button variant="ghost" onClick={() => setCatModal({ open: false, data: null })}>Cancel</Button>
                        <Button type="submit" form="catForm">Save Category</Button>
                    </>
                }
            >
                <form id="catForm" onSubmit={handleCatSave} className="grid gap-4 py-4">
                    <Input name="name" label="Category Name" defaultValue={catModal.data?.name || ''} required autoFocus />
                    <Input name="display_order" label="Display Order" type="number" defaultValue={catModal.data?.display_order || 0} />
                </form>
            </Modal>

            {/* Menu Item Modal */}
            <Modal
                isOpen={itemModal.open}
                onClose={() => setItemModal({ open: false, data: null, categoryId: null })}
                title={itemModal.data ? 'Edit Item' : 'New Menu Item'}
                footer={
                    <>
                        <Button variant="ghost" onClick={() => setItemModal({ open: false, data: null, categoryId: null })}>Cancel</Button>
                        <Button type="submit" form="itemForm">Save Item</Button>
                    </>
                }
            >
                <form id="itemForm" onSubmit={handleItemSave} className="grid gap-4 py-4">
                    <input type="hidden" name="category_id" value={itemModal.data?.category_id || itemModal.categoryId || ''} />

                    <Input name="name" label="Item Name" defaultValue={itemModal.data?.name || ''} required autoFocus />
                    <Input name="description" label="Description" textarea defaultValue={itemModal.data?.description || ''} />

                    <div className="grid grid-cols-2 gap-4">
                        <Input name="price" label="Price (₹)" type="number" step="0.01" defaultValue={itemModal.data?.price || ''} required />
                        <div className="space-y-2">
                            <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-foreground">Diet Type</label>
                            <select
                                name="diet_type"
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                defaultValue={itemModal.data?.diet_type || 'VEG'}
                            >
                                {DIET_TYPES.map(d => <option key={d} value={d}>{d.replace('_', ' ')}</option>)}
                            </select>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <Input name="prep_time_minutes" label="Prep Time (mins)" type="number" min="1" defaultValue={itemModal.data?.prep_time_minutes || ''} placeholder="e.g. 15" />
                        <Input name="display_order" label="Display Order" type="number" defaultValue={itemModal.data?.display_order || 0} />
                    </div>

                    <div className="grid grid-cols-1 gap-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-foreground">Status</label>
                            <select
                                name="is_available"
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                defaultValue={itemModal.data ? String(itemModal.data.is_available) : 'true'}
                            >
                                <option value="true">Available</option>
                                <option value="false">Unavailable</option>
                            </select>
                        </div>
                    </div>
                </form>
            </Modal>
        </div>
    );
}
