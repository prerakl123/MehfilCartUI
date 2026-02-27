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
import { Plus, Trash2, Users, AlertCircle, User, ShieldAlert, ShieldCheck } from 'lucide-react';

export default function StaffPage() {
    const toast = useToast();
    const { user, role, restaurantId: authRestaurantId } = useAuthStore();
    const [restaurantId, setLocalRestaurantId] = useState(authRestaurantId);

    useEffect(() => {
        if (authRestaurantId && role !== 'SUPER_ADMIN') {
            setLocalRestaurantId(authRestaurantId);
        }
    }, [authRestaurantId, role]);

    const [staffList, setStaffList] = useState([]);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);

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
        setSaving(true);
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
        } finally {
            setSaving(false);
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
        <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-foreground">Staff Management</h1>
                    <p className="text-sm text-muted-foreground mt-1">Manage waitstaff and local admins</p>
                </div>
                <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
                    <RestaurantSelector className="w-full sm:w-[250px]" onSelect={setLocalRestaurantId} />
                    {restaurantId && (
                        <Button className="w-full sm:w-auto" onClick={() => setModal({ open: true })}>
                            <Plus className="mr-2 h-4 w-4" />
                            Add Staff
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
                    <p className="text-sm text-muted-foreground max-w-sm">Please select a restaurant from the dropdown above to view and manage assigned staff members.</p>
                </div>
            ) : loading ? (
                <div className="flex h-[400px] flex-col items-center justify-center gap-4">
                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
                    <p className="text-sm font-medium text-muted-foreground">Loading staff members...</p>
                </div>
            ) : staffList.length === 0 ? (
                <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-card py-24 px-4 text-center">
                    <div className="rounded-full bg-primary/10 p-4 mb-4">
                        <Users className="h-10 w-10 text-primary" />
                    </div>
                    <h3 className="text-xl font-semibold text-foreground mb-2">No staff assigned</h3>
                    <p className="mb-6 max-w-sm text-sm text-muted-foreground">
                        Add waitstaff and admins to let them view and manage live orders for this restaurant.
                    </p>
                    <Button onClick={() => setModal({ open: true })}>
                        <Plus className="mr-2 h-4 w-4" />
                        Add Staff
                    </Button>
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {staffList.map(role => {
                        const isSelf = user?.id === role.user_id;
                        const isAdmin = role.role === 'RESTAURANT_ADMIN';

                        return (
                            <div key={role.id} className="flex flex-col justify-between overflow-hidden rounded-xl border border-border bg-card p-5 shadow-sm transition-all hover:border-primary/50 hover:shadow-md">
                                <div className="flex flex-col gap-4">
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="flex items-center gap-3">
                                            <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${isAdmin ? 'bg-primary/10 text-primary' : 'bg-secondary text-muted-foreground'}`}>
                                                {isAdmin ? <ShieldCheck className="h-5 w-5" /> : <User className="h-5 w-5" />}
                                            </div>
                                            <div className="flex flex-col">
                                                <div className="flex items-center gap-2">
                                                    <h3 className="text-base font-semibold tracking-tight text-foreground line-clamp-1">
                                                        {role.display_name || 'Staff Member'}
                                                    </h3>
                                                    {isSelf && (
                                                        <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">
                                                            You
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="text-sm text-muted-foreground font-mono mt-0.5">
                                                    {role.phone}
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div>
                                        <Badge variant={isAdmin ? 'primary' : 'neutral'} className="text-xs">
                                            {role.role.replace('_', ' ')}
                                        </Badge>
                                    </div>
                                </div>

                                <div className="mt-5 flex items-center justify-end border-t border-border pt-4">
                                    <Button
                                        size="sm"
                                        variant="ghost"
                                        className="h-8 px-3 text-destructive hover:bg-destructive/10 hover:text-destructive"
                                        disabled={isSelf}
                                        onClick={() => removeStaff(role.id, isSelf)}
                                        title={isSelf ? "You cannot remove yourself" : "Remove Staff"}
                                    >
                                        <Trash2 className="mr-1.5 h-3.5 w-3.5" />
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
                footer={
                    <>
                        <Button variant="ghost" onClick={() => setModal({ open: false })}>Cancel</Button>
                        <Button type="submit" form="staffForm" loading={saving}>Add Staff</Button>
                    </>
                }
            >
                <form id="staffForm" onSubmit={handleSave} className="grid gap-4 py-4">
                    <Input name="phone" label="Phone Number" type="tel" placeholder="9876543210" required autoFocus />
                    <Input name="display_name" label="Display Name (Optional)" placeholder="John Doe" />

                    <div className="space-y-2">
                        <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-foreground">Role</label>
                        <select
                            name="role"
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            defaultValue="WAITER"
                        >
                            <option value="WAITER">WAITER</option>
                            <option value="RESTAURANT_ADMIN">RESTAURANT ADMIN</option>
                        </select>
                    </div>
                </form>
            </Modal>
        </div>
    );
}
