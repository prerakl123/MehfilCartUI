'use client';

import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';
import { useToast } from '@/components/ui/Toast';
import RestaurantSelector from '@/components/admin/RestaurantSelector';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import Input from '@/components/ui/Input';
import Badge from '@/components/ui/Badge';
import { useAuthStore } from '@/store/authStore';
import { APP_CONFIG } from '@/constants/config';
import { Plus, Edit2, Trash2, Users, Download, TabletSmartphone, AlertCircle } from 'lucide-react';

export default function TablesPage() {
    const toast = useToast();
    const { user, role, restaurantId: authRestaurantId } = useAuthStore();
    const [restaurantId, setLocalRestaurantId] = useState(authRestaurantId);

    useEffect(() => {
        if (authRestaurantId && role !== 'SUPER_ADMIN') {
            setLocalRestaurantId(authRestaurantId);
        }
    }, [authRestaurantId, role]);

    const [tables, setTables] = useState([]);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false); // Added saving state

    const [modal, setModal] = useState({ open: false, data: null });

    const fetchTables = useCallback(async (rId) => {
        if (!rId) {
            setTables([]);
            return;
        }
        setLoading(true);
        try {
            const data = await api.get(`/admin/tables/${rId}`);
            setTables(data);
        } catch (err) {
            toast.error('Failed to load tables');
        } finally {
            setLoading(false);
        }
    }, [toast]);

    useEffect(() => {
        fetchTables(restaurantId);
    }, [restaurantId, fetchTables]);

    const openEdit = (table) => {
        setModal({ open: true, data: table });
    };

    const handleSave = async (e) => {
        e.preventDefault();
        setSaving(true); // Set saving to true
        const formData = new FormData(e.target);
        const body = {
            label: formData.get('label'),
            capacity: parseInt(formData.get('capacity')) || 4,
            is_active: formData.get('is_active') === 'true',
        };

        try {
            if (modal.data) {
                // Update
                await api.patch(`/admin/tables/${restaurantId}/${modal.data.id}`, body);
                toast.success('Table updated');
            } else {
                // Create
                await api.post(`/admin/tables/${restaurantId}`, body);
                toast.success('Table created');
            }
            setModal({ open: false, data: null });
            fetchTables(restaurantId);
        } catch (err) {
            toast.error(err.message || 'Failed to save table');
        } finally {
            setSaving(false); // Set saving to false
        }
    };

    const handleDelete = async (tableId, e) => {
        if (e) e.stopPropagation();
        if (!confirm('Are you sure you want to delete this table? This action cannot be undone.')) return;
        try {
            await api.delete(`/admin/tables/${restaurantId}/${tableId}`);
            toast.success('Table deleted');
            fetchTables(restaurantId);
        } catch (err) {
            toast.error(err.message || 'Failed to delete table');
        }
    };

    const downloadQrCode = async (tableId, tableLabel) => {
        try {
            // Can't use api.get directly because it expects JSON, so use raw fetch with auth
            const token = localStorage.getItem('access_token');
            const baseURL = APP_CONFIG.API_BASE_URL;
            const res = await fetch(`${baseURL}/admin/tables/${restaurantId}/${tableId}/qr?base_url=${encodeURIComponent(window.location.origin)}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (!res.ok) throw new Error('Failed to fetch QR');

            const blob = await res.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `table-${tableLabel}-qr.png`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
        } catch (err) {
            toast.error('Failed to download QR code');
        }
    };

    return (
        <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-foreground">Tables</h1>
                    <p className="text-sm text-muted-foreground mt-1">Manage dining tables and QR codes</p>
                </div>
                <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
                    <RestaurantSelector className="w-full sm:w-[250px]" onSelect={setLocalRestaurantId} />
                    {restaurantId && (
                        <Button className="w-full sm:w-auto" onClick={() => setModal({ open: true, data: null })}>
                            <Plus className="mr-2 h-4 w-4" />
                            Add Table
                        </Button>
                    )}
                </div>
            </div>

            {!restaurantId ? (
                <div className="flex h-[400px] flex-col items-center justify-center rounded-xl border border-dashed border-border bg-card/50 px-4 text-center">
                    <div className="rounded-full bg-secondary p-4 mb-4">
                        <AlertCircle className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <h3 className="text-lg font-medium text-foreground mb-1">Select a Restaurant</h3>
                    <p className="text-sm text-muted-foreground max-w-sm">Please select a restaurant from the dropdown above to manage its tables and generate QR codes.</p>
                </div>
            ) : loading ? (
                <div className="flex h-[400px] flex-col items-center justify-center gap-4">
                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
                    <p className="text-sm font-medium text-muted-foreground">Loading tables...</p>
                </div>
            ) : tables.length === 0 ? (
                <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-card py-24 px-4 text-center">
                    <div className="rounded-full bg-primary/10 p-4 mb-4">
                        <TabletSmartphone className="h-10 w-10 text-primary" />
                    </div>
                    <h3 className="text-xl font-semibold text-foreground mb-2">No tables found</h3>
                    <p className="mb-6 max-w-sm text-sm text-muted-foreground">
                        Add tables to generate ordering QR codes for your customers.
                    </p>
                    <Button onClick={() => setModal({ open: true, data: null })}>
                        <Plus className="mr-2 h-4 w-4" />
                        Add Table
                    </Button>
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {tables.map(table => (
                        <div key={table.id} className="group flex flex-col justify-between overflow-hidden rounded-xl border border-border bg-card p-6 shadow-sm transition-all hover:border-primary/50 hover:shadow-md cursor-pointer" onClick={() => openEdit(table)}>
                            <div className="flex flex-col gap-4">
                                <div className="flex items-start justify-between gap-4">
                                    <div className="flex items-center gap-3">
                                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary text-secondary-foreground transition-colors group-hover:bg-primary/10 group-hover:text-primary">
                                            <TabletSmartphone className="h-5 w-5" />
                                        </div>
                                        <h3 className="text-lg font-semibold tracking-tight text-foreground transition-colors group-hover:text-primary">
                                            {table.label}
                                        </h3>
                                    </div>
                                    <Badge variant={table.is_active ? 'success' : 'neutral'} className="shrink-0">
                                        {table.is_active ? 'Active' : 'Inactive'}
                                    </Badge>
                                </div>

                                <div className="flex flex-col gap-3 text-sm text-muted-foreground">
                                    <div className="flex items-center gap-2">
                                        <Users className="h-4 w-4 text-foreground/70" />
                                        <span>Capacity: {table.capacity} people</span>
                                    </div>
                                    {table.qr_code_url && (
                                        <div className="flex items-center -ml-2">
                                            <Button
                                                size="sm"
                                                variant="ghost"
                                                className="h-8 gap-2 hover:bg-transparent hover:text-primary"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    downloadQrCode(table.id, table.label);
                                                }}
                                            >
                                                <Download className="h-4 w-4" />
                                                <span className="underline underline-offset-4">Download QR</span>
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="mt-6 flex items-center justify-end gap-2 border-t border-border pt-4">
                                <Button
                                    size="sm"
                                    variant="outline"
                                    className="h-8 px-3"
                                    onClick={(e) => { e.stopPropagation(); openEdit(table); }}
                                >
                                    <Edit2 className="mr-1.5 h-3.5 w-3.5" />
                                    Edit
                                </Button>
                                <Button
                                    size="sm"
                                    variant="ghost"
                                    className="h-8 px-3 text-destructive hover:bg-destructive/10 hover:text-destructive"
                                    onClick={(e) => handleDelete(table.id, e)}
                                >
                                    <Trash2 className="mr-1.5 h-3.5 w-3.5" />
                                    Delete
                                </Button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Table Modal */}
            <Modal
                isOpen={modal.open}
                onClose={() => setModal({ open: false, data: null })}
                title={modal.data ? 'Edit Table' : 'New Table'}
                footer={
                    <>
                        <Button variant="ghost" onClick={() => setModal({ open: false, data: null })}>Cancel</Button>
                        <Button type="submit" form="tableForm" loading={saving}>Save Table</Button>
                    </>
                }
            >
                <form id="tableForm" onSubmit={handleSave} className="grid gap-4 py-4">
                    <Input name="label" label="Table Label (e.g., T-1, Window 4)" defaultValue={modal.data?.label || ''} required autoFocus />

                    <div className="grid grid-cols-2 gap-4">
                        <Input name="capacity" label="Seat Capacity" type="number" defaultValue={modal.data?.capacity || 4} required min="1" max="50" />

                        {modal.data && (
                            <div className="space-y-2">
                                <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-foreground">Status</label>
                                <select
                                    name="is_active"
                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                    defaultValue={String(modal.data.is_active)}
                                >
                                    <option value="true">Active</option>
                                    <option value="false">Inactive</option>
                                </select>
                            </div>
                        )}
                        {!modal.data && <input type="hidden" name="is_active" value="true" />}
                    </div>
                </form>
            </Modal>
        </div>
    );
}
