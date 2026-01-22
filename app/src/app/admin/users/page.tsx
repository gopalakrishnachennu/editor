'use client';

/**
 * Admin User Management Page
 * View, search, and manage all users
 */

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
    Users,
    Search,
    Filter,
    MoreVertical,
    Shield,
    Crown,
    Ban,
    Trash2,
    Mail,
    Calendar,
    Activity,
    ChevronDown,
    Download,
    RefreshCw,
    Eye,
    UserCheck,
    UserX,
} from 'lucide-react';
import { collection, getDocs, doc, updateDoc, deleteDoc, query, orderBy, limit, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { User } from '@/lib/types';
import { cn } from '@/lib/utils';
import { logger } from '@/lib/logger';

type UserRole = 'admin' | 'moderator' | 'pro' | 'free';
type UserTier = 'enterprise' | 'pro' | 'free';

const roleColors: Record<UserRole, string> = {
    admin: 'bg-red-500/20 text-red-400 border-red-500/30',
    moderator: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
    pro: 'bg-violet-500/20 text-violet-400 border-violet-500/30',
    free: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
};

const tierColors: Record<UserTier, string> = {
    enterprise: 'bg-amber-500/20 text-amber-400',
    pro: 'bg-violet-500/20 text-violet-400',
    free: 'bg-gray-500/20 text-gray-400',
};

export default function AdminUsersPage() {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [roleFilter, setRoleFilter] = useState<UserRole | 'all'>('all');
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [showRoleMenu, setShowRoleMenu] = useState<string | null>(null);

    // Load users
    const loadUsers = async () => {
        setLoading(true);
        try {
            const usersRef = collection(db, 'users');
            const q = query(usersRef, orderBy('createdAt', 'desc'), limit(100));
            const snapshot = await getDocs(q);

            const usersData = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                createdAt: doc.data().createdAt?.toDate() || new Date(),
                lastLoginAt: doc.data().lastLoginAt?.toDate() || new Date(),
            })) as User[];

            setUsers(usersData);
            logger.info('AdminUsers', 'Loaded users', { count: usersData.length });
        } catch (error) {
            logger.exception('AdminUsers', error as Error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadUsers();
    }, []);

    // Change user role
    const changeRole = async (userId: string, newRole: UserRole) => {
        try {
            await updateDoc(doc(db, 'users', userId), { role: newRole });
            setUsers(users.map(u => u.id === userId ? { ...u, role: newRole } : u));
            setShowRoleMenu(null);
            logger.info('AdminUsers', 'Changed user role', { userId, newRole });
        } catch (error) {
            logger.exception('AdminUsers', error as Error);
        }
    };

    // Change user tier
    const changeTier = async (userId: string, newTier: UserTier) => {
        try {
            await updateDoc(doc(db, 'users', userId), { tier: newTier });
            setUsers(users.map(u => u.id === userId ? { ...u, tier: newTier } : u));
            logger.info('AdminUsers', 'Changed user tier', { userId, newTier });
        } catch (error) {
            logger.exception('AdminUsers', error as Error);
        }
    };

    // Ban/Unban user
    const toggleBan = async (userId: string, isBanned: boolean) => {
        try {
            await updateDoc(doc(db, 'users', userId), { isBanned: !isBanned });
            setUsers(users.map(u => u.id === userId ? { ...u, isBanned: !isBanned } : u));
            logger.info('AdminUsers', isBanned ? 'Unbanned user' : 'Banned user', { userId });
        } catch (error) {
            logger.exception('AdminUsers', error as Error);
        }
    };

    // Delete user
    const deleteUser = async (userId: string) => {
        if (!confirm('Are you sure you want to delete this user? This cannot be undone.')) {
            return;
        }
        try {
            await deleteDoc(doc(db, 'users', userId));
            setUsers(users.filter(u => u.id !== userId));
            logger.info('AdminUsers', 'Deleted user', { userId });
        } catch (error) {
            logger.exception('AdminUsers', error as Error);
        }
    };

    // Export users as CSV
    const exportUsers = () => {
        const headers = ['ID', 'Email', 'Display Name', 'Role', 'Tier', 'Created At', 'Last Login'];
        const rows = users.map(u => [
            u.id,
            u.email,
            u.displayName,
            u.role,
            u.tier,
            u.createdAt?.toISOString() || '',
            u.lastLoginAt?.toISOString() || '',
        ]);

        const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `users-${new Date().toISOString().split('T')[0]}.csv`;
        link.click();
    };

    // Filter users
    const filteredUsers = users.filter(user => {
        const matchesSearch =
            user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
            user.displayName?.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesRole = roleFilter === 'all' || user.role === roleFilter;
        return matchesSearch && matchesRole;
    });

    // Stats
    const totalUsers = users.length;
    const adminCount = users.filter(u => u.role === 'admin').length;
    const proCount = users.filter(u => u.tier === 'pro' || u.tier === 'enterprise').length;
    const bannedCount = users.filter(u => u.isBanned).length;

    return (
        <div className="min-h-screen bg-gray-950 p-6">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-2xl font-bold text-white flex items-center gap-3">
                            <Users className="w-7 h-7 text-violet-500" />
                            User Management
                        </h1>
                        <p className="text-gray-400 text-sm mt-1">
                            View and manage all registered users
                        </p>
                    </div>
                    <div className="flex gap-3">
                        <button
                            onClick={exportUsers}
                            className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg transition-colors"
                        >
                            <Download className="w-4 h-4" />
                            Export CSV
                        </button>
                        <button
                            onClick={loadUsers}
                            disabled={loading}
                            className="flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-lg transition-colors disabled:opacity-50"
                        >
                            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                            Refresh
                        </button>
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-4 gap-4 mb-6">
                    <div className="bg-gray-900 rounded-xl p-4 border border-gray-800">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-violet-500/20 rounded-lg">
                                <Users className="w-5 h-5 text-violet-400" />
                            </div>
                            <div>
                                <div className="text-2xl font-bold text-white">{totalUsers}</div>
                                <div className="text-gray-400 text-sm">Total Users</div>
                            </div>
                        </div>
                    </div>
                    <div className="bg-gray-900 rounded-xl p-4 border border-gray-800">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-red-500/20 rounded-lg">
                                <Shield className="w-5 h-5 text-red-400" />
                            </div>
                            <div>
                                <div className="text-2xl font-bold text-white">{adminCount}</div>
                                <div className="text-gray-400 text-sm">Admins</div>
                            </div>
                        </div>
                    </div>
                    <div className="bg-gray-900 rounded-xl p-4 border border-gray-800">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-amber-500/20 rounded-lg">
                                <Crown className="w-5 h-5 text-amber-400" />
                            </div>
                            <div>
                                <div className="text-2xl font-bold text-white">{proCount}</div>
                                <div className="text-gray-400 text-sm">Pro Users</div>
                            </div>
                        </div>
                    </div>
                    <div className="bg-gray-900 rounded-xl p-4 border border-gray-800">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-gray-500/20 rounded-lg">
                                <Ban className="w-5 h-5 text-gray-400" />
                            </div>
                            <div>
                                <div className="text-2xl font-bold text-white">{bannedCount}</div>
                                <div className="text-gray-400 text-sm">Banned</div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Filters */}
                <div className="bg-gray-900 rounded-xl p-4 border border-gray-800 mb-6">
                    <div className="flex items-center gap-4">
                        <div className="flex-1 relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                            <input
                                type="text"
                                placeholder="Search by email or name..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-violet-500"
                            />
                        </div>

                        {/* Role Filter */}
                        <div className="flex gap-2">
                            {(['all', 'admin', 'moderator', 'pro', 'free'] as const).map((role) => (
                                <button
                                    key={role}
                                    onClick={() => setRoleFilter(role)}
                                    className={cn(
                                        'px-3 py-1.5 rounded-lg text-sm font-medium transition-colors border',
                                        roleFilter === role
                                            ? role === 'all'
                                                ? 'bg-violet-600 text-white border-violet-500'
                                                : roleColors[role as UserRole]
                                            : 'bg-gray-800 text-gray-400 border-gray-700 hover:text-white'
                                    )}
                                >
                                    {role.charAt(0).toUpperCase() + role.slice(1)}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Users Table */}
                <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-gray-800">
                                <th className="text-left px-6 py-4 text-gray-400 font-medium text-sm">User</th>
                                <th className="text-left px-6 py-4 text-gray-400 font-medium text-sm">Role</th>
                                <th className="text-left px-6 py-4 text-gray-400 font-medium text-sm">Tier</th>
                                <th className="text-left px-6 py-4 text-gray-400 font-medium text-sm">Status</th>
                                <th className="text-left px-6 py-4 text-gray-400 font-medium text-sm">Joined</th>
                                <th className="text-right px-6 py-4 text-gray-400 font-medium text-sm">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan={6} className="text-center py-12">
                                        <RefreshCw className="w-8 h-8 text-violet-500 animate-spin mx-auto" />
                                        <p className="text-gray-400 mt-4">Loading users...</p>
                                    </td>
                                </tr>
                            ) : filteredUsers.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="text-center py-12">
                                        <Users className="w-12 h-12 text-gray-600 mx-auto" />
                                        <p className="text-gray-400 mt-4">No users found</p>
                                    </td>
                                </tr>
                            ) : (
                                filteredUsers.map((user) => (
                                    <motion.tr
                                        key={user.id}
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        className="border-b border-gray-800/50 hover:bg-gray-800/30 transition-colors"
                                    >
                                        {/* User Info */}
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 bg-gradient-to-br from-violet-500 to-purple-600 rounded-full flex items-center justify-center text-white font-medium">
                                                    {user.photoURL ? (
                                                        <img src={user.photoURL} alt="" className="w-10 h-10 rounded-full" />
                                                    ) : (
                                                        user.displayName?.charAt(0) || user.email.charAt(0).toUpperCase()
                                                    )}
                                                </div>
                                                <div>
                                                    <div className="text-white font-medium">{user.displayName || 'No name'}</div>
                                                    <div className="text-gray-500 text-sm">{user.email}</div>
                                                </div>
                                            </div>
                                        </td>

                                        {/* Role with dropdown */}
                                        <td className="px-6 py-4">
                                            <div className="relative">
                                                <button
                                                    onClick={() => setShowRoleMenu(showRoleMenu === user.id ? null : user.id)}
                                                    className={cn(
                                                        'flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-sm font-medium border transition-colors',
                                                        roleColors[user.role as UserRole] || roleColors.free
                                                    )}
                                                >
                                                    <Shield className="w-3.5 h-3.5" />
                                                    {user.role}
                                                    <ChevronDown className="w-3 h-3" />
                                                </button>

                                                {showRoleMenu === user.id && (
                                                    <div className="absolute top-full left-0 mt-1 bg-gray-800 rounded-lg border border-gray-700 py-1 z-10 min-w-[120px] shadow-xl">
                                                        {(['admin', 'moderator', 'pro', 'free'] as UserRole[]).map((role) => (
                                                            <button
                                                                key={role}
                                                                onClick={() => changeRole(user.id, role)}
                                                                className="w-full text-left px-3 py-1.5 text-sm text-gray-300 hover:bg-gray-700 hover:text-white transition-colors capitalize"
                                                            >
                                                                {role}
                                                            </button>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        </td>

                                        {/* Tier */}
                                        <td className="px-6 py-4">
                                            <span className={cn(
                                                'px-2.5 py-1 rounded-lg text-sm font-medium',
                                                tierColors[user.tier as UserTier] || tierColors.free
                                            )}>
                                                {user.tier === 'pro' && <Crown className="w-3 h-3 inline mr-1" />}
                                                {user.tier}
                                            </span>
                                        </td>

                                        {/* Status */}
                                        <td className="px-6 py-4">
                                            {user.isBanned ? (
                                                <span className="flex items-center gap-1.5 text-red-400 text-sm">
                                                    <UserX className="w-4 h-4" />
                                                    Banned
                                                </span>
                                            ) : (
                                                <span className="flex items-center gap-1.5 text-green-400 text-sm">
                                                    <UserCheck className="w-4 h-4" />
                                                    Active
                                                </span>
                                            )}
                                        </td>

                                        {/* Joined */}
                                        <td className="px-6 py-4 text-gray-400 text-sm">
                                            {user.createdAt?.toLocaleDateString() || 'Unknown'}
                                        </td>

                                        {/* Actions */}
                                        <td className="px-6 py-4">
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    onClick={() => setSelectedUser(user)}
                                                    className="p-1.5 hover:bg-gray-700 rounded-lg transition-colors text-gray-400 hover:text-white"
                                                    title="View details"
                                                >
                                                    <Eye className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => toggleBan(user.id, user.isBanned || false)}
                                                    className={cn(
                                                        'p-1.5 hover:bg-gray-700 rounded-lg transition-colors',
                                                        user.isBanned ? 'text-green-400' : 'text-yellow-400'
                                                    )}
                                                    title={user.isBanned ? 'Unban user' : 'Ban user'}
                                                >
                                                    <Ban className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => deleteUser(user.id)}
                                                    className="p-1.5 hover:bg-red-500/20 rounded-lg transition-colors text-gray-400 hover:text-red-400"
                                                    title="Delete user"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </motion.tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* User Detail Modal */}
                {selectedUser && (
                    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="bg-gray-900 rounded-2xl w-full max-w-lg p-6 border border-gray-800"
                        >
                            <div className="flex items-start justify-between mb-6">
                                <div className="flex items-center gap-4">
                                    <div className="w-16 h-16 bg-gradient-to-br from-violet-500 to-purple-600 rounded-full flex items-center justify-center text-white text-2xl font-bold">
                                        {selectedUser.photoURL ? (
                                            <img src={selectedUser.photoURL} alt="" className="w-16 h-16 rounded-full" />
                                        ) : (
                                            selectedUser.displayName?.charAt(0) || selectedUser.email.charAt(0).toUpperCase()
                                        )}
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-bold text-white">{selectedUser.displayName}</h2>
                                        <p className="text-gray-400">{selectedUser.email}</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setSelectedUser(null)}
                                    className="p-2 hover:bg-gray-800 rounded-lg"
                                >
                                    <span className="text-gray-400 text-xl">×</span>
                                </button>
                            </div>

                            <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="bg-gray-800 rounded-lg p-3">
                                        <div className="text-gray-400 text-sm">Role</div>
                                        <div className="text-white font-medium capitalize">{selectedUser.role}</div>
                                    </div>
                                    <div className="bg-gray-800 rounded-lg p-3">
                                        <div className="text-gray-400 text-sm">Tier</div>
                                        <div className="text-white font-medium capitalize">{selectedUser.tier}</div>
                                    </div>
                                    <div className="bg-gray-800 rounded-lg p-3">
                                        <div className="text-gray-400 text-sm">Joined</div>
                                        <div className="text-white font-medium">{selectedUser.createdAt?.toLocaleDateString()}</div>
                                    </div>
                                    <div className="bg-gray-800 rounded-lg p-3">
                                        <div className="text-gray-400 text-sm">Last Login</div>
                                        <div className="text-white font-medium">{selectedUser.lastLoginAt?.toLocaleDateString()}</div>
                                    </div>
                                </div>

                                {selectedUser.usage && (
                                    <div className="bg-gray-800 rounded-lg p-4">
                                        <h3 className="text-white font-medium mb-3">Usage Stats</h3>
                                        <div className="grid grid-cols-2 gap-3 text-sm">
                                            <div>
                                                <span className="text-gray-400">AI Generations:</span>
                                                <span className="text-white ml-2">{selectedUser.usage.aiGenerationsThisMonth || 0}</span>
                                            </div>
                                            <div>
                                                <span className="text-gray-400">Exports:</span>
                                                <span className="text-white ml-2">{selectedUser.usage.exportsThisMonth || 0}</span>
                                            </div>
                                            <div>
                                                <span className="text-gray-400">Posts Created:</span>
                                                <span className="text-white ml-2">{selectedUser.usage.postsCreated || 0}</span>
                                            </div>
                                            <div>
                                                <span className="text-gray-400">Templates:</span>
                                                <span className="text-white ml-2">{selectedUser.usage.templatesCreated || 0}</span>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                <div className="flex gap-3 pt-4">
                                    <button
                                        onClick={() => {
                                            changeTier(selectedUser.id, selectedUser.tier === 'pro' ? 'free' : 'pro');
                                            setSelectedUser({ ...selectedUser, tier: selectedUser.tier === 'pro' ? 'free' : 'pro' });
                                        }}
                                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 rounded-lg transition-colors"
                                    >
                                        <Crown className="w-4 h-4" />
                                        {selectedUser.tier === 'pro' ? 'Downgrade to Free' : 'Upgrade to Pro'}
                                    </button>
                                    <button
                                        onClick={() => setSelectedUser(null)}
                                        className="flex-1 px-4 py-2.5 bg-gray-800 hover:bg-gray-700 text-white rounded-lg transition-colors"
                                    >
                                        Close
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </div>
        </div>
    );
}
