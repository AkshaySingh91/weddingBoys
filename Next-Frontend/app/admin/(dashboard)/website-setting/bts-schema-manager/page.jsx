'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  UsersThree,
  Plus,
  Trash,
  CircleNotch,
  IdentificationBadge,
} from '@phosphor-icons/react';
import { fireMessage } from '@/Utils/fireMessage.js';
import { Button } from '@/app/admin/components/ui/Button.jsx';
import { Badge } from '@/app/admin/components/ui/Badge.jsx';
import { PageHeader } from '@/app/admin/components/ui/PageHeader.jsx';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/app/admin/components/ui/Dialog.jsx';

const api_url = process.env.NEXT_PUBLIC_API_URL;

export default function BtsSchemaManagerPage() {
  const [roles, setRoles] = useState([]);
  const [newRole, setNewRole] = useState({ title: '', key: '' });
  const [loading, setLoading] = useState(true);
  const [addingRole, setAddingRole] = useState(false);
  const [deleteConfirmRole, setDeleteConfirmRole] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const fetchBtsSchema = useCallback(async () => {
    try {
      const response = await fetch(`${api_url}/api/bts-schema`, {
        method: 'GET',
        credentials: 'include',
      });
      const data = await response.json();
      if (response.ok) {
        setRoles(data.schema || []);
      } else {
        fireMessage(data.message, 'error');
      }
    } catch (error) {
      fireMessage(error.message, 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBtsSchema();
  }, [fetchBtsSchema]);

  const handleAddRole = async (e) => {
    e?.preventDefault();
    if (!newRole.title.trim() || !newRole.key.trim()) {
      return fireMessage('Both role title and key are required', 'error');
    }

    setAddingRole(true);
    try {
      const response = await fetch(`${api_url}/api/bts-schema`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newRole),
        credentials: 'include',
      });
      if (response.ok) {
        const newRoleData = await response.json();
        setRoles((prev) => [...prev, newRoleData.role]);
        setNewRole({ title: '', key: '' });
        fireMessage('Crew role added successfully', 'success');
      } else {
        const errorData = await response.json();
        fireMessage(errorData.message, 'error');
      }
    } catch (error) {
      fireMessage(error.message, 'error');
    } finally {
      setAddingRole(false);
    }
  };

  const handleDeleteRole = async () => {
    if (!deleteConfirmRole) return;
    setDeleting(true);
    try {
      const response = await fetch(`${api_url}/api/bts-schema/${deleteConfirmRole._id}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (response.ok) {
        setRoles((prev) => prev.filter((role) => role._id !== deleteConfirmRole._id));
        fireMessage('Crew role deleted', 'success');
        setDeleteConfirmRole(null);
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to delete role');
      }
    } catch (error) {
      fireMessage(error.message, 'error');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-6 font-sans">
      <PageHeader
        title="BTS Crew Roles Schema"
        subtitle="Manage the crew credits checklist (e.g., Drone Pilot, Lead Cinematographer) used when tagging shoot crew on wedding films."
        breadcrumbs={[
          { label: 'Admin', href: '/admin/dashboard' },
          { label: 'Website Settings' },
          { label: 'BTS Roles' },
        ]}
      />

      {/* Add Role Form Card */}
      <div className="rounded-2xl border border-[#E5DCD3] bg-white p-6 shadow-sm space-y-4">
        <div className="flex items-center gap-2">
          <IdentificationBadge size={18} weight="fill" className="text-[#A3603A]" />
          <h2 className="text-base font-serif font-semibold text-[#1C1917]">
            Add New Crew Role
          </h2>
        </div>

        <form onSubmit={handleAddRole} className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <input
            type="text"
            placeholder="Role Title (e.g. Lead Cinematographer)"
            className="flex-1 rounded-xl border border-[#E5DCD3] bg-white py-2.5 px-3.5 text-xs text-[#1C1917] placeholder:text-stone-400 outline-none transition focus:border-[#A3603A] focus:ring-1 focus:ring-[#A3603A]"
            value={newRole.title}
            onChange={(e) => setNewRole({ ...newRole, title: e.target.value })}
          />
          <input
            type="text"
            placeholder="Schema Key (e.g. leadCamera)"
            className="flex-1 rounded-xl border border-[#E5DCD3] bg-white py-2.5 px-3.5 text-xs text-[#1C1917] placeholder:text-stone-400 outline-none transition focus:border-[#A3603A] focus:ring-1 focus:ring-[#A3603A]"
            value={newRole.key}
            onChange={(e) => setNewRole({ ...newRole, key: e.target.value })}
          />
          <Button
            type="submit"
            variant="terracotta"
            size="sm"
            loading={addingRole}
            icon={Plus}
          >
            Add Role
          </Button>
        </form>
      </div>

      {/* Roles Grid */}
      {loading ? (
        <div className="flex items-center justify-center p-20 text-sm text-stone-500">
          <CircleNotch size={24} className="animate-spin text-[#A3603A] mr-2.5" />
          Loading crew roles…
        </div>
      ) : roles.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[#E5DCD3] bg-white p-16 text-center shadow-sm">
          <UsersThree size={32} className="mx-auto text-[#A3603A] mb-3" />
          <h3 className="text-base font-serif font-semibold text-[#1C1917]">No crew roles configured</h3>
          <p className="mt-1 text-xs text-stone-500">Define roles using the form above.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {roles.map((role) => (
            <div
              key={role._id}
              className="flex items-center justify-between rounded-2xl border border-[#E5DCD3] bg-white p-4 shadow-sm transition hover:border-[#A3603A]/60"
            >
              <div className="min-w-0 pr-3">
                <h3 className="truncate font-serif text-sm font-semibold text-[#1C1917]">
                  {role.title}
                </h3>
                <div className="mt-1 flex items-center gap-1.5">
                  <Badge variant="neutral">{role.key}</Badge>
                </div>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setDeleteConfirmRole(role)}
                className="text-rose-600 hover:bg-rose-50 shrink-0"
                icon={Trash}
              >
                Delete
              </Button>
            </div>
          ))}
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteConfirmRole} onOpenChange={(open) => { if (!open) setDeleteConfirmRole(null); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Delete Crew Role?</DialogTitle>
            <DialogDescription>
              Are you sure you want to remove &quot;{deleteConfirmRole?.title}&quot; from the crew role checklist?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirmRole(null)} disabled={deleting}>
              Cancel
            </Button>
            <Button variant="danger" onClick={handleDeleteRole} loading={deleting}>
              Delete Role
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
