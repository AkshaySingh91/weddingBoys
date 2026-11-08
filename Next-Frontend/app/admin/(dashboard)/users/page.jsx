'use client';

import { useCallback, useEffect, useState } from 'react';
import {
    UserPlus, MagnifyingGlass, DotsThreeVertical, ShieldCheck, ShieldWarning, SignOut, CircleNotch, Check,
} from '@phosphor-icons/react';
import { apiJson } from '@/lib/apiClient.js';
import { useAuth } from '@/Context/AdminAuthContext';
import { fireMessage } from '@/Utils/fireMessage.js';
import Button from '@/app/admin/components/ui/Button.jsx';
import Badge from '@/app/admin/components/ui/Badge.jsx';
import InviteModal from './_components/InviteModal.jsx';

const ROLES = ['SuperAdmin', 'Editor', 'PortfolioManager'];

const ROLE_BADGE_VARIANT = {
    SuperAdmin: 'gold',
    Editor: 'info',
    PortfolioManager: 'purple',
};

const STATUS_BADGE_VARIANT = {
    Active: 'success',
    Suspended: 'danger',
    Invited: 'warning',
};

const initials = (name = '') => name.trim().split(/\s+/).slice(0, 2).map((w) => w[0]).join('').toUpperCase() || '?';

const formatDate = (d) => (d ? new Date(d).toLocaleString(undefined, {
    dateStyle: 'medium', timeStyle: 'short',
}) : 'Never');

import { PageHeader } from '@/app/admin/components/ui/PageHeader.jsx';

export default function UsersPage() {
    const { isSuperAdmin, user: currentUser } = useAuth() || {};
    const [users, setUsers] = useState(null);
    const [query, setQuery] = useState('');
    const [roleFilter, setRoleFilter] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [inviteOpen, setInviteOpen] = useState(false);
    const [menuFor, setMenuFor] = useState(null);
    const [busyId, setBusyId] = useState(null);

    // Bumping this re-runs the fetch (e.g. after a successful invite).
    const [refreshKey, setRefreshKey] = useState(0);
    const reload = useCallback(() => setRefreshKey((k) => k + 1), []);

    useEffect(() => {
        let cancelled = false;

        async function loadUsers() {
            try {
                const params = new URLSearchParams({ limit: '100' });
                if (roleFilter) params.set('role', roleFilter);
                if (statusFilter) params.set('status', statusFilter);
                const data = await apiJson(`/api/admin/users?${params.toString()}`);
                if (!cancelled) setUsers(data.users || []);
            } catch (err) {
                if (!cancelled) {
                    setUsers([]);
                    fireMessage(err.message, 'error');
                }
            }
        }

        loadUsers();
        return () => { cancelled = true; };
    }, [roleFilter, statusFilter, refreshKey]);

    const changeRole = async (u, role) => {
        setMenuFor(null);
        setBusyId(u.id);
        try {
            const data = await apiJson(`/api/admin/users/${u.id}/role`, {
                method: 'PUT',
                body: JSON.stringify({ role }),
            });
            setUsers((prev) => prev.map((x) => (x.id === u.id ? data.user : x)));
            fireMessage('Role updated', 'success');
        } catch (err) {
            fireMessage(err.message, 'error');
        } finally {
            setBusyId(null);
        }
    };

    const toggleStatus = async (u) => {
        setMenuFor(null);
        const status = u.status === 'Suspended' ? 'Active' : 'Suspended';
        setBusyId(u.id);
        try {
            const data = await apiJson(`/api/admin/users/${u.id}/status`, {
                method: 'PUT',
                body: JSON.stringify({ status }),
            });
            setUsers((prev) => prev.map((x) => (x.id === u.id ? data.user : x)));
            fireMessage(`User ${status.toLowerCase()}`, 'success');
        } catch (err) {
            fireMessage(err.message, 'error');
        } finally {
            setBusyId(null);
        }
    };

    const revokeSessions = async (u) => {
        setMenuFor(null);
        if (!window.confirm(`Sign ${u.name} out of all devices?`)) return;
        setBusyId(u.id);
        try {
            const data = await apiJson(`/api/admin/users/${u.id}/sessions`, { method: 'DELETE' });
            fireMessage(`${data.revoked} session(s) revoked`, 'success');
        } catch (err) {
            fireMessage(err.message, 'error');
        } finally {
            setBusyId(null);
        }
    };

    const visible = (users || []).filter((u) => {
        if (!query) return true;
        const q = query.toLowerCase();
        return u.name?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q);
    });

    return (
        <div className="space-y-6 font-sans">
            <PageHeader
                title="Team & Access Control"
                subtitle="Manage studio administrators, role privileges, and authentication sessions."
                breadcrumbs={[
                    { label: 'Admin', href: '/admin/dashboard' },
                    { label: 'Team & Access' },
                ]}
            >
                {isSuperAdmin && (
                    <Button
                        type="button"
                        variant="terracotta"
                        size="sm"
                        onClick={() => setInviteOpen(true)}
                        icon={UserPlus}
                    >
                        Invite Admin
                    </Button>
                )}
            </PageHeader>

            {/* Filters Bar */}
            <div className="flex flex-wrap items-center gap-3">
                <div className="relative min-w-[240px] flex-1">
                    <MagnifyingGlass size={16} weight="bold" className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-muted" />
                    <input
                        type="text"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Search team member by name or email…"
                        className="w-full rounded-xl border border-edge-subtle bg-white py-2.5 pl-10 pr-3.5 text-sm font-sans text-ink placeholder:text-ink-muted outline-none transition focus:border-gold focus:ring-1 focus:ring-gold"
                    />
                </div>
                <select
                    value={roleFilter}
                    onChange={(e) => setRoleFilter(e.target.value)}
                    className="rounded-xl border border-edge-subtle bg-white px-3.5 py-2.5 text-sm font-sans text-ink outline-none transition focus:border-gold cursor-pointer"
                >
                    <option value="">All Roles</option>
                    {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
                </select>
                <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="rounded-xl border border-edge-subtle bg-white px-3.5 py-2.5 text-sm font-sans text-ink outline-none transition focus:border-gold cursor-pointer"
                >
                    <option value="">All Statuses</option>
                    <option value="Active">Active</option>
                    <option value="Suspended">Suspended</option>
                    <option value="Invited">Invited</option>
                </select>
            </div>

            {/* Table Card */}
            <div className="overflow-hidden rounded-xl border border-edge-subtle bg-white shadow-sm">
                {users === null ? (
                    <div className="flex items-center justify-center gap-2.5 p-16 text-sm font-sans text-ink-muted">
                        <CircleNotch size={20} weight="bold" className="animate-spin text-gold-strong" /> Loading team…
                    </div>
                ) : visible.length === 0 ? (
                    <div className="p-16 text-center text-sm font-sans text-ink-muted">No team members found matching your search.</div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[760px] text-left text-sm font-sans">
                            <thead className="border-b border-edge-subtle bg-ground text-xs uppercase tracking-wider text-ink-muted">
                                <tr>
                                    <th className="px-5 py-3.5 font-medium">Team Member</th>
                                    <th className="px-5 py-3.5 font-medium">Role</th>
                                    <th className="px-5 py-3.5 font-medium">Status</th>
                                    <th className="px-5 py-3.5 font-medium">Last Login</th>
                                    <th className="px-5 py-3.5 text-right font-medium">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-edge-subtle">
                                {visible.map((u) => (
                                    <tr key={u.id} className="transition-colors hover:bg-ground/80">
                                        <td className="px-5 py-4">
                                            <div className="flex items-center gap-3.5">
                                                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-ink to-ink text-xs font-semibold text-white shadow-sm">
                                                    {initials(u.name)}
                                                </span>
                                                <div className="min-w-0">
                                                    <div className="flex items-center gap-2">
                                                        <span className="truncate font-medium text-ink">{u.name}</span>
                                                        {currentUser?.id === u.id && (
                                                            <span className="rounded-lg bg-ground px-1.5 py-0.5 text-[10px] font-medium text-ink-muted border border-edge-subtle">You</span>
                                                        )}
                                                    </div>
                                                    <span className="block truncate text-xs text-ink-muted">{u.email}</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-5 py-4">
                                            <Badge variant={ROLE_BADGE_VARIANT[u.role] || 'neutral'}>
                                                {u.role}
                                            </Badge>
                                        </td>
                                        <td className="px-5 py-4">
                                            <Badge variant={STATUS_BADGE_VARIANT[u.status] || 'neutral'} dot>
                                                {u.status}
                                            </Badge>
                                        </td>
                                        <td className="px-5 py-4 text-xs font-sans tabular-nums text-ink-muted">{formatDate(u.lastLoginAt)}</td>
                                        <td className="relative px-5 py-4 text-right">
                                            {isSuperAdmin && (
                                                busyId === u.id ? (
                                                    <CircleNotch size={18} weight="bold" className="ml-auto animate-spin text-gold-strong" />
                                                ) : (
                                                    <>
                                                        <button
                                                            type="button"
                                                            onClick={() => setMenuFor(menuFor === u.id ? null : u.id)}
                                                            className="rounded-lg p-2 text-ink-muted transition hover:bg-ground hover:text-ink"
                                                            aria-label="Actions"
                                                        >
                                                            <DotsThreeVertical size={18} weight="bold" />
                                                        </button>

                                                        {menuFor === u.id && (
                                                            <>
                                                                <button
                                                                    type="button"
                                                                    aria-label="Close menu"
                                                                    className="fixed inset-0 z-20 cursor-default"
                                                                    onClick={() => setMenuFor(null)}
                                                                />
                                                                <div className="absolute right-5 top-12 z-30 w-56 overflow-hidden rounded-xl border border-edge-subtle bg-white py-1.5 shadow-lg">
                                                                    <p className="px-3.5 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-ink-muted">Change Role</p>
                                                                    {ROLES.filter((r) => r !== u.role).map((r) => (
                                                                        <button
                                                                            key={r}
                                                                            type="button"
                                                                            onClick={() => changeRole(u, r)}
                                                                            className="flex w-full items-center gap-2.5 px-3.5 py-2 text-left text-xs font-medium text-ink-secondary transition hover:bg-ground"
                                                                        >
                                                                            <ShieldCheck size={16} weight="duotone" className="text-gold-strong" /> {r}
                                                                        </button>
                                                                    ))}
                                                                    <div className="my-1.5 border-t border-edge-subtle" />
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => toggleStatus(u)}
                                                                        className="flex w-full items-center gap-2.5 px-3.5 py-2 text-left text-xs font-medium text-ink-secondary transition hover:bg-ground"
                                                                    >
                                                                        <ShieldWarning size={16} weight="duotone" className="text-ink-muted" />
                                                                        {u.status === 'Suspended' ? 'Reactivate User' : 'Suspend User'}
                                                                    </button>
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => revokeSessions(u)}
                                                                        className="flex w-full items-center gap-2.5 px-3.5 py-2 text-left text-xs font-medium text-rose-600 transition hover:bg-rose-50"
                                                                    >
                                                                        <SignOut size={16} weight="duotone" /> Revoke All Sessions
                                                                    </button>
                                                                </div>
                                                            </>
                                                        )}
                                                    </>
                                                )
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {!isSuperAdmin && (
                <p className="text-xs font-sans text-ink-muted">
                    Only SuperAdmins can invite new administrators, modify roles, or revoke authentication sessions.
                </p>
            )}

            <InviteModal open={inviteOpen} onClose={() => setInviteOpen(false)} onInvited={reload} />
        </div>
    );
}
