'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  CalendarHeart,
  Plus,
  Trash,
  PencilSimple,
  ArrowUp,
  ArrowDown,
  Check,
  X,
  CircleNotch,
  Sparkle,
} from '@phosphor-icons/react';
import { Button } from '@/app/admin/components/ui/Button.jsx';
import { Input } from '@/app/admin/components/ui/Input.jsx';
import { Switch } from '@/app/admin/components/ui/Switch.jsx';
import { fireMessage } from '@/Utils/fireMessage.js';
import { cn } from '@/lib/utils.js';

const api_url = process.env.NEXT_PUBLIC_API_URL;

export const COLOR_OPTIONS = [
  { id: 'amber', label: 'Amber', dot: 'bg-amber-500', pill: 'bg-amber-50 text-amber-800 border-amber-200' },
  { id: 'emerald', label: 'Emerald', dot: 'bg-emerald-500', pill: 'bg-emerald-50 text-emerald-800 border-emerald-200' },
  { id: 'purple', label: 'Purple', dot: 'bg-purple-500', pill: 'bg-purple-50 text-purple-800 border-purple-200' },
  { id: 'indigo', label: 'Indigo', dot: 'bg-indigo-500', pill: 'bg-indigo-50 text-indigo-800 border-indigo-200' },
  { id: 'rose', label: 'Rose', dot: 'bg-rose-500', pill: 'bg-rose-50 text-rose-800 border-rose-200' },
  { id: 'gold', label: 'Gold', dot: 'bg-yellow-500', pill: 'bg-yellow-50 text-yellow-900 border-yellow-200' },
  { id: 'sky', label: 'Sky', dot: 'bg-sky-500', pill: 'bg-sky-50 text-sky-800 border-sky-200' },
  { id: 'neutral', label: 'Stone', dot: 'bg-stone-500', pill: 'bg-ground-sunk text-ink border-edge-subtle' },
  { id: 'pink', label: 'Pink', dot: 'bg-pink-500', pill: 'bg-pink-50 text-pink-800 border-pink-200' },
  { id: 'cyan', label: 'Cyan', dot: 'bg-cyan-500', pill: 'bg-cyan-50 text-cyan-800 border-cyan-200' },
  { id: 'orange', label: 'Orange', dot: 'bg-orange-500', pill: 'bg-orange-50 text-orange-800 border-orange-200' },
];

function getColorConfig(colorId) {
  return COLOR_OPTIONS.find((c) => c.id === colorId) || COLOR_OPTIONS[0];
}

export default function CeremoniesSettingsTab() {
  const [ceremonies, setCeremonies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    color: 'amber',
    isActive: true,
  });

  // Load ceremonies
  const loadCeremonies = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${api_url}/api/admin/ceremonies`, {
        credentials: 'include',
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to load ceremonies');
      setCeremonies(data.ceremonies || []);
    } catch (err) {
      fireMessage(err.message, 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCeremonies();
  }, [loadCeremonies]);

  // Open Form for Adding
  const handleOpenAdd = () => {
    setEditingId(null);
    setFormData({
      name: '',
      description: '',
      color: 'amber',
      isActive: true,
    });
    setIsFormOpen(true);
  };

  // Open Form for Editing
  const handleOpenEdit = (ceremony) => {
    setEditingId(ceremony._id);
    setFormData({
      name: ceremony.name,
      description: ceremony.description || '',
      color: ceremony.color || 'amber',
      isActive: ceremony.isActive !== false,
    });
    setIsFormOpen(true);
  };

  // Cancel Form
  const handleCancelForm = () => {
    setIsFormOpen(false);
    setEditingId(null);
  };

  // Submit Add or Edit
  const handleSubmitForm = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      return fireMessage('Ceremony name is required', 'error');
    }

    setSubmitting(true);
    try {
      const url = editingId
        ? `${api_url}/api/admin/ceremonies/${editingId}`
        : `${api_url}/api/admin/ceremonies`;
      const method = editingId ? 'PATCH' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Operation failed');

      fireMessage(data.message || (editingId ? 'Ceremony updated' : 'Ceremony created'), 'success');
      handleCancelForm();
      loadCeremonies();
    } catch (err) {
      fireMessage(err.message, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // Delete Ceremony
  const handleDelete = async (id) => {
    setSubmitting(true);
    try {
      const res = await fetch(`${api_url}/api/admin/ceremonies/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to delete ceremony');

      fireMessage(data.message || 'Ceremony removed', 'success');
      setDeletingId(null);
      loadCeremonies();
    } catch (err) {
      fireMessage(err.message, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // Toggle Active inline
  const handleToggleActive = async (ceremony) => {
    const nextState = !ceremony.isActive;
    // Optimistic update
    setCeremonies((prev) =>
      prev.map((c) => (c._id === ceremony._id ? { ...c, isActive: nextState } : c))
    );

    try {
      const res = await fetch(`${api_url}/api/admin/ceremonies/${ceremony._id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ isActive: nextState }),
      });
      if (!res.ok) throw new Error('Failed to update status');
    } catch (err) {
      fireMessage(err.message, 'error');
      // Revert on failure
      setCeremonies((prev) =>
        prev.map((c) => (c._id === ceremony._id ? { ...c, isActive: !nextState } : c))
      );
    }
  };

  // Move ceremony order
  const handleMove = async (index, direction) => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= ceremonies.length) return;

    const newList = [...ceremonies];
    const [moved] = newList.splice(index, 1);
    newList.splice(targetIndex, 0, moved);

    setCeremonies(newList);

    try {
      const orderedIds = newList.map((item) => item._id);
      const res = await fetch(`${api_url}/api/admin/ceremonies/reorder`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ orderedIds }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to save reorder');
      if (data.ceremonies) setCeremonies(data.ceremonies);
    } catch (err) {
      fireMessage(err.message, 'error');
      loadCeremonies();
    }
  };

  return (
    <div className="space-y-6">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-edge-subtle">
        <div>
          <h2 className="text-lg font-bold text-ink tracking-tight flex items-center gap-2 font-sans">
            <CalendarHeart size={20} className="text-accent-ink" weight="duotone" />
            Wedding Ceremonies & Events
          </h2>
          <p className="text-xs text-ink-muted mt-0.5">
            Configure the ceremony taxonomy used when onboarding weddings and categorizing media.
          </p>
        </div>

        {!isFormOpen && (
          <Button
            variant="terracotta"
            size="sm"
            icon={Plus}
            onClick={handleOpenAdd}
            className="shrink-0 text-xs"
          >
            Add Ceremony
          </Button>
        )}
      </div>

      {/* Inline Fast Add / Edit Drawer */}
      {isFormOpen && (
        <form
          onSubmit={handleSubmitForm}
          className="rounded-xl border border-accent/30 bg-ground/40 p-4 space-y-3.5 transition-all animate-in fade-in duration-200"
        >
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-ink tracking-wide uppercase font-sans">
              {editingId ? 'Edit Ceremony Details' : 'New Ceremony Ritual'}
            </h4>
            <button
              type="button"
              onClick={handleCancelForm}
              className="text-ink-muted hover:text-ink-secondary h-6 w-6 flex items-center justify-center rounded-lg"
            >
              <X size={14} />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-ink-secondary">
                Ceremony Name <span className="text-rose-500">*</span>
              </label>
              <Input
                required
                placeholder="e.g. Haldi, Sangeet, Cocktail"
                value={formData.name}
                onChange={(e) => setFormData((p) => ({ ...p, name: e.target.value }))}
                className="h-8 text-xs bg-white"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-ink-secondary">
                Description / Celebration Note
              </label>
              <Input
                placeholder="Brief note or theme..."
                value={formData.description}
                onChange={(e) => setFormData((p) => ({ ...p, description: e.target.value }))}
                className="h-8 text-xs bg-white"
              />
            </div>
          </div>

          {/* Color theme selection */}
          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-ink-secondary">
              Badge Tone
            </label>
            <div className="flex flex-wrap gap-1.5 items-center">
              {COLOR_OPTIONS.map((col) => {
                const isSelected = formData.color === col.id;
                return (
                  <button
                    key={col.id}
                    type="button"
                    onClick={() => setFormData((p) => ({ ...p, color: col.id }))}
                    className={cn(
                      'flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-medium border transition-all',
                      isSelected
                        ? 'bg-white border-accent ring-1 ring-accent text-ink font-semibold shadow-sm'
                        : 'bg-white/80 border-edge-subtle text-ink-secondary hover:border-edge-strong'
                    )}
                  >
                    <span className={cn('h-2 w-2 rounded-full', col.dot)} />
                    <span>{col.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Status & Action buttons */}
          <div className="flex items-center justify-between pt-2 border-t border-edge-subtle">
            <div className="flex items-center gap-2">
              <Switch
                checked={formData.isActive}
                onChange={(v) => setFormData((p) => ({ ...p, isActive: v }))}
              />
              <span className="text-[11px] font-medium text-ink-secondary">
                {formData.isActive ? 'Active & Selectable' : 'Hidden from intake'}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={submitting}
                onClick={handleCancelForm}
                className="h-7 text-xs px-2.5"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="terracotta"
                size="sm"
                loading={submitting}
                icon={Check}
                className="h-7 text-xs px-3"
              >
                {editingId ? 'Save Changes' : 'Create Ritual'}
              </Button>
            </div>
          </div>
        </form>
      )}

      {/* Compact Ceremonies Table / List */}
      <div className="rounded-xl border border-edge-subtle bg-white overflow-hidden shadow-sm">
        {loading ? (
          <div className="py-12 flex flex-col items-center justify-center gap-2 text-ink-muted">
            <CircleNotch size={22} className="animate-spin text-accent-ink" />
            <p className="text-xs">Loading ceremonies…</p>
          </div>
        ) : ceremonies.length === 0 ? (
          <div className="py-12 text-center px-4 space-y-2">
            <CalendarHeart size={28} className="text-stone-300 mx-auto" />
            <p className="text-xs font-semibold text-ink">No ceremonies configured</p>
            <p className="text-[11px] text-ink-muted max-w-xs mx-auto">
              Add ceremonies like Haldi, Mehendi, Sangeet to start organizing wedding content.
            </p>
            <Button
              variant="outline"
              size="sm"
              icon={Plus}
              onClick={handleOpenAdd}
              className="mt-2 text-xs"
            >
              Add Ceremony
            </Button>
          </div>
        ) : (
          <div className="divide-y divide-edge-subtle">
            {ceremonies.map((ceremony, idx) => {
              const colorCfg = getColorConfig(ceremony.color);
              const isFirst = idx === 0;
              const isLast = idx === ceremonies.length - 1;
              const isDeleting = deletingId === ceremony._id;

              return (
                <div
                  key={ceremony._id}
                  className="flex items-center justify-between px-3.5 py-2.5 hover:bg-ground transition-colors group text-xs"
                >
                  {/* Left: Reorder & Name */}
                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    {/* Reorder Buttons */}
                    <div className="flex flex-col gap-0.5 shrink-0 opacity-40 group-hover:opacity-100 transition-opacity">
                      <button
                        type="button"
                        disabled={isFirst}
                        onClick={() => handleMove(idx, 'up')}
                        title="Move Up"
                        className="h-3.5 w-3.5 flex items-center justify-center text-ink-muted hover:text-ink disabled:opacity-20"
                      >
                        <ArrowUp size={10} weight="bold" />
                      </button>
                      <button
                        type="button"
                        disabled={isLast}
                        onClick={() => handleMove(idx, 'down')}
                        title="Move Down"
                        className="h-3.5 w-3.5 flex items-center justify-center text-ink-muted hover:text-ink disabled:opacity-20"
                      >
                        <ArrowDown size={10} weight="bold" />
                      </button>
                    </div>

                    {/* Order rank */}
                    <span className="text-[11px] font-mono text-ink-muted w-4 shrink-0">
                      #{idx + 1}
                    </span>

                    {/* Ceremony Color & Name */}
                    <div className="flex items-center gap-2 min-w-0">
                      <span className={cn('h-2.5 w-2.5 rounded-full shrink-0', colorCfg.dot)} />
                      <span className="font-semibold text-ink truncate">
                        {ceremony.name}
                      </span>
                      <span className="text-[10px] font-mono text-ink-muted bg-ground-sunk px-1 py-0.5 rounded-lg shrink-0">
                        {ceremony.slug}
                      </span>
                    </div>

                    {/* Description snippet */}
                    {ceremony.description && (
                      <span className="text-[11px] text-ink-muted truncate hidden md:inline ml-2 max-w-xs">
                        — {ceremony.description}
                      </span>
                    )}
                  </div>

                  {/* Right: Active Switch & Actions */}
                  <div className="flex items-center gap-3 shrink-0 ml-2">
                    {/* Active toggle */}
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] text-ink-muted hidden sm:inline">
                        {ceremony.isActive ? 'Active' : 'Hidden'}
                      </span>
                      <Switch
                        checked={ceremony.isActive}
                        onChange={() => handleToggleActive(ceremony)}
                      />
                    </div>

                    {/* Action buttons */}
                    {isDeleting ? (
                      <div className="flex items-center gap-1 bg-rose-50 border border-rose-200 px-1.5 py-0.5 rounded-lg text-[10px]">
                        <span className="text-rose-700 font-medium">Delete?</span>
                        <button
                          type="button"
                          onClick={() => handleDelete(ceremony._id)}
                          className="text-rose-700 font-bold hover:underline"
                        >
                          Yes
                        </button>
                        <span className="text-stone-300">/</span>
                        <button
                          type="button"
                          onClick={() => setDeletingId(null)}
                          className="text-ink-muted hover:text-ink-secondary"
                        >
                          No
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-0.5">
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(ceremony)}
                          title="Edit ceremony"
                          className="h-7 w-7 flex items-center justify-center rounded-lg text-ink-muted hover:text-ink hover:bg-ground-sunk transition-colors"
                        >
                          <PencilSimple size={13} />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeletingId(ceremony._id)}
                          title="Delete ceremony"
                          className="h-7 w-7 flex items-center justify-center rounded-lg text-ink-muted hover:text-rose-600 hover:bg-rose-50 transition-colors"
                        >
                          <Trash size={13} />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
