'use client';

import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';
import { useToast } from '@/components/ui/Toast';
import { useAuthStore } from '@/store/authStore';
import RestaurantSelector from '@/components/admin/RestaurantSelector';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import Input from '@/components/ui/Input';
import Badge from '@/components/ui/Badge';
import sharedStyles from '../shared.module.css';

export default function StaffPage() {
    const toast = useToast();
    const { user } = useAuthStore();
    const [restaurantId, setRestaurantId] = useState(null);
    const [staffList, setStaffList] = useState([]);
    const [loading, setLoading] = useState(false);

    const [modal, setModal] = useState({ open: false });

    const fetchStaff = useCallback(async (rId) => {
        if (!rId) {
            setStaffList([]);
            return;
        }
        setLoading(true);
        try {
            const data = await api.get(`/admin/staff/${rId}`);
            setStaffList(data);
        } catch (err) {
            toast.error('Failed to load staff');
        } finally {
            setLoading(false);
        }
    }, [toast]);

    useEffect(() => {
        fetchStaff(restaurantId);
    }, [restaurantId, fetchStaff]);

    const handleSave = async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);

        let phone = formData.get('phone').replace(/\s|-/g, '');
        if (!phone.startsWith('+91') && phone.length === 10) {
            phone = `+91${phone}`;
        }

        const body = {
            phone,
            role: formData.get('role'),
            display_name: formData.get('display_name') || null,
        };

        try {
            await api.post(`/admin/staff/${restaurantId}`, body);
            toast.success('Staff member added');
            setModal({ open: false });
            fetchStaff(restaurantId);
        } catch (err) {
            toast.error(err.message || 'Failed to add staff');
        }
    };

    const removeStaff = async (roleId, isSelf) => {
        if (isSelf) {
            toast.warning("You cannot remove yourself");
            return;
        }
        if (!confirm('Are you sure you want to remove this staff member?')) return;
        try {
            await api.delete(`/admin/staff/${roleId}`);
            toast.success('Staff removed');
            fetchStaff(restaurantId);
        } catch (err) {
            toast.error('Failed to remove staff');
        }
    };

    return (
        <div className={sharedStyles.page}>
            <div className={sharedStyles.header}>
                <div>
                    <h1 className={sharedStyles.title}>Staff Management</h1>
                    <p className={sharedStyles.subtitle}>Manage waitstaff and local admins</p>
                </div>
                <div className={sharedStyles.toolbar}>
                    <RestaurantSelector className={sharedStyles.select} onSelect={setRestaurantId} />
                    {restaurantId && (
                        <Button onClick={() => setModal({ open: true })}>
                            + Add Staff
                        </Button>
                    )}
                </div>
            </div>

            {!restaurantId ? (
                <div className={sharedStyles.emptyState}>
                    Please select a restaurant to manage staff.
                </div>
            ) : loading ? (
                <div className={sharedStyles.loading}>Loading staff...</div>
            ) : staffList.length === 0 ? (
                <div className={sharedStyles.emptyState}>
                    <div className={sharedStyles.emptyIcon}>👥</div>
                    <div className={sharedStyles.emptyTitle}>No staff assigned</div>
                    <p>Add waitstaff to let them view and manage live orders.</p>
                    <Button style={{ marginTop: 'var(--space-4)' }} onClick={() => setModal({ open: true })}>
                        + Add Staff
                    </Button>
                </div>
            ) : (
                <div className={sharedStyles.list}>
                    {staffList.map(role => {
                        const isSelf = user?.id === role.user_id;
                        return (
                            <div key={role.id} className={sharedStyles.listItem}>
                                <div className={sharedStyles.listItemInfo}>
                                    <div className={sharedStyles.listItemName}>
                                        {role.display_name || role.phone} {isSelf && <span style={{ color: 'var(--color-primary)' }}>(You)</span>}
                                    </div>
                                    <div className={sharedStyles.listItemMeta}>
                                        {role.display_name ? role.phone : 'Name not set'}
                                    </div>
                                </div>
                                <div className={sharedStyles.listItemActions}>
                                    <Badge variant={role.role === 'RESTAURANT_ADMIN' ? 'primary' : 'neutral'}>
                                        {role.role.replace('_', ' ')}
                                    </Badge>
                                    <Button size="sm" variant="ghost" disabled={isSelf} onClick={() => removeStaff(role.id, isSelf)}>
                                        Remove
                                    </Button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Add Staff Modal */}
            <Modal
                isOpen={modal.open}
                onClose={() => setModal({ open: false })}
                title="Add Staff Member"
            >
                <form id="staffForm" onSubmit={handleSave} className={sharedStyles.formGrid}>
                    <Input name="phone" label="Phone Number" type="tel" placeholder="9876543210" required autoFocus />
                    <Input name="display_name" label="Display Name (Optional)" placeholder="John Doe" />

                    <div>
                        <label style={{ display: 'block', fontSize: 'var(--font-size-sm)', marginBottom: 'var(--space-1)', fontWeight: 'var(--font-weight-medium)' }}>Role</label>
                        <select name="role" className={sharedStyles.select} defaultValue="WAITER" style={{ width: '100%' }}>
                            <option value="WAITER">WAITER</option>
                            <option value="RESTAURANT_ADMIN">RESTAURANT ADMIN</option>
                        </select>
                    </div>
                </form>
                <div style={{ marginTop: 'var(--space-4)', display: 'flex', gap: 'var(--space-2)', justifyContent: 'flex-end' }}>
                    <Button variant="ghost" onClick={() => setModal({ open: false })}>Cancel</Button>
                    <Button type="submit" form="staffForm">Add Staff</Button>
                </div>
            </Modal>
        </div>
    );
}
