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

export default function TablesPage() {
    const toast = useToast();
    const [restaurantId, setRestaurantId] = useState(null);
    const [tables, setTables] = useState([]);
    const [loading, setLoading] = useState(false);

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

    const handleSave = async (e) => {
        e.preventDefault();
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
        }
    };

    return (
        <div className={sharedStyles.page}>
            <div className={sharedStyles.header}>
                <div>
                    <h1 className={sharedStyles.title}>Tables</h1>
                    <p className={sharedStyles.subtitle}>Manage dining tables and QR codes</p>
                </div>
                <div className={sharedStyles.toolbar}>
                    <RestaurantSelector className={sharedStyles.select} onSelect={setRestaurantId} />
                    {restaurantId && (
                        <Button onClick={() => setModal({ open: true, data: null })}>
                            + Add Table
                        </Button>
                    )}
                </div>
            </div>

            {!restaurantId ? (
                <div className={sharedStyles.emptyState}>
                    Please select a restaurant to manage tables.
                </div>
            ) : loading ? (
                <div className={sharedStyles.loading}>Loading tables...</div>
            ) : tables.length === 0 ? (
                <div className={sharedStyles.emptyState}>
                    <div className={sharedStyles.emptyIcon}>🪑</div>
                    <div className={sharedStyles.emptyTitle}>No tables found</div>
                    <p>Add tables to generate ordering QR codes.</p>
                    <Button style={{ marginTop: 'var(--space-4)' }} onClick={() => setModal({ open: true, data: null })}>
                        + Add Table
                    </Button>
                </div>
            ) : (
                <div className={sharedStyles.grid}>
                    {tables.map(table => (
                        <div key={table.id} className={sharedStyles.card}>
                            <div className={sharedStyles.cardHeader}>
                                <div className={sharedStyles.cardTitle}>{table.label}</div>
                                <Badge variant={table.is_active ? 'success' : 'neutral'}>
                                    {table.is_active ? 'Active' : 'Inactive'}
                                </Badge>
                            </div>
                            <div className={sharedStyles.cardBody}>
                                <div className={sharedStyles.cardRow}>
                                    <span>👥 Capacity: {table.capacity}</span>
                                </div>
                                {table.qr_code_url && (
                                    <div className={sharedStyles.cardRow}>
                                        <a href={table.qr_code_url} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'underline' }}>
                                            View QR Code
                                        </a>
                                    </div>
                                )}
                            </div>
                            <div className={sharedStyles.cardActions}>
                                <Button size="sm" variant="secondary" onClick={() => setModal({ open: true, data: table })}>
                                    Edit
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
            >
                <form id="tableForm" onSubmit={handleSave} className={sharedStyles.formGrid}>
                    <Input name="label" label="Table Label (e.g., T-1, Window 4)" defaultValue={modal.data?.label || ''} required autoFocus />

                    <div className={sharedStyles.formRow}>
                        <Input name="capacity" label="Seat Capacity" type="number" defaultValue={modal.data?.capacity || 4} required min="1" max="50" />

                        {modal.data && (
                            <div>
                                <label style={{ display: 'block', fontSize: 'var(--font-size-sm)', marginBottom: 'var(--space-1)', fontWeight: 'var(--font-weight-medium)' }}>Status</label>
                                <select name="is_active" className={sharedStyles.select} defaultValue={String(modal.data.is_active)} style={{ width: '100%' }}>
                                    <option value="true">Active</option>
                                    <option value="false">Inactive</option>
                                </select>
                            </div>
                        )}
                        {!modal.data && <input type="hidden" name="is_active" value="true" />}
                    </div>
                </form>
                <div style={{ marginTop: 'var(--space-4)', display: 'flex', gap: 'var(--space-2)', justifyContent: 'flex-end' }}>
                    <Button variant="ghost" onClick={() => setModal({ open: false, data: null })}>Cancel</Button>
                    <Button type="submit" form="tableForm">Save Table</Button>
                </div>
            </Modal>
        </div>
    );
}
