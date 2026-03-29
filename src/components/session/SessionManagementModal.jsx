import { useState } from 'react';
import Button from '@/components/ui/Button';
import { X, UserCheck, UserX, Crown, LogOut } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';

export default function SessionManagementModal({ 
    isOpen, 
    onClose, 
    session, 
    onLeave, 
    onTransferHost, 
    onApprove, 
    onReject 
}) {
    const { user } = useAuthStore();
    const [loadingAction, setLoadingAction] = useState(null);

    if (!isOpen || !session) return null;

    const isHost = session.host_user_id === user?.id;
    const members = session.members || [];
    const pendingMembers = members.filter(m => m.status === 'PENDING');
    const approvedMembers = members.filter(m => m.status === 'APPROVED');

    const handleAction = async (actionFn, id) => {
        setLoadingAction(id);
        try {
            await actionFn(id);
        } finally {
            setLoadingAction(null);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
            <div className="w-full max-w-md rounded-2xl border border-border bg-card shadow-lg flex flex-col max-h-[90vh]">
                <div className="flex items-center justify-between border-b border-border p-4">
                    <h2 className="text-lg font-bold">Session Management</h2>
                    <button onClick={onClose} className="rounded-full p-1 hover:bg-muted text-muted-foreground">
                        <X className="h-5 w-5" />
                    </button>
                </div>
                
                <div className="overflow-y-auto p-4 flex-1">
                    {isHost && pendingMembers.length > 0 && (
                        <div className="mb-6">
                            <h3 className="mb-3 text-sm font-semibold text-primary">Pending Requests ({pendingMembers.length})</h3>
                            <div className="space-y-2">
                                {pendingMembers.map((member) => (
                                    <div key={member.id} className="flex items-center justify-between rounded-lg border border-border bg-muted/30 p-3">
                                        <div>
                                            <p className="font-medium text-sm">{member.display_name || 'Guest'}</p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Button 
                                                size="sm" 
                                                variant="outline" 
                                                className="h-8 w-8 !p-0 text-red-500 hover:text-red-500 hover:bg-red-500/10"
                                                onClick={() => handleAction(onReject, member.id)}
                                                disabled={loadingAction === member.id}
                                            >
                                                <UserX className="h-4 w-4" />
                                            </Button>
                                            <Button 
                                                size="sm" 
                                                className="h-8 w-8 !p-0 bg-green-500/10 text-green-600 hover:bg-green-500/20 hover:text-green-700"
                                                onClick={() => handleAction(onApprove, member.id)}
                                                disabled={loadingAction === member.id}
                                            >
                                                <UserCheck className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="mb-6">
                        <h3 className="mb-3 text-sm font-semibold text-muted-foreground">Active Members ({approvedMembers.length})</h3>
                        <div className="space-y-2">
                            {approvedMembers.map((member) => (
                                <div key={member.id} className="flex items-center justify-between rounded-lg border border-border p-3">
                                    <div className="flex items-center gap-2">
                                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary uppercase font-bold text-xs">
                                            {(member.display_name || 'G')[0]}
                                        </div>
                                        <div>
                                            <p className="font-medium text-sm flex items-center gap-1">
                                                {member.display_name || 'Guest'}
                                                {member.role === 'HOST' && <Crown className="h-3 w-3 text-yellow-500" />}
                                            </p>
                                            <p className="text-xs text-muted-foreground">
                                                {member.user_id === user?.id ? '(You)' : member.role}
                                            </p>
                                        </div>
                                    </div>
                                    
                                    {isHost && member.user_id !== user?.id && (
                                        <Button 
                                            size="sm" 
                                            variant="outline"
                                            className="text-xs h-7"
                                            onClick={() => handleAction(onTransferHost, member.user_id)}
                                            disabled={loadingAction === member.user_id}
                                        >
                                            Make Host
                                        </Button>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="border-t border-border p-4 bg-muted/20">
                    <Button 
                        variant="destructive" 
                        className="w-full gap-2"
                        onClick={onLeave}
                    >
                        <LogOut className="h-4 w-4" />
                        {isHost ? 'End Session for All' : 'Leave Session'}
                    </Button>
                </div>
            </div>
        </div>
    );
}
