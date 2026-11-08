'use client';

import { useState } from 'react';
import { useFormContext, useFieldArray, useWatch, Controller } from 'react-hook-form';
import {
    ChevronDown, ChevronUp, Eye, EyeOff, Trash2, ArrowUp, ArrowDown, Plus, GripVertical,
} from 'lucide-react';
import MediaField from './MediaField.jsx';
import Link from 'next/link';
import { BLOCK_CONFIG, fieldLabel, isTextarea, SECTION_OPTIONS, SECTION_SOURCES, sectionLabel } from './config.js';
import SectionSettings, { hasSectionSettings } from './SectionSettings.jsx';

const newItem = () => ({
    _id: Math.random().toString(36).slice(2, 10),
    title: '', subtitle: '', body: '', link: '', media: [], meta: {},
});

// Content that lives on another admin screen: say where, and link to it.
function SourceNote({ source }) {
    return (
        <div className="mt-2 flex flex-wrap items-center justify-between gap-2 rounded-lg border border-edge-subtle bg-ground px-3 py-2.5">
            <p className="text-xs text-ink-secondary">{source.text}</p>
            <Link href={source.href} className="text-xs font-medium text-rose-600 hover:underline">{source.cta}</Link>
        </div>
    );
}

// A single registered text/textarea input bound to `name`.
function Field({ name, label, textarea }) {
    const { register } = useFormContext();
    return (
        <label className="block">
            <span className="mb-1 block text-xs font-medium text-ink-secondary">{label}</span>
            {textarea ? (
                <textarea rows={3} {...register(name)} className="w-full rounded-lg border border-edge-strong p-2 text-sm focus:border-rose-500 focus:outline-none" />
            ) : (
                <input type="text" {...register(name)} className="w-full rounded-lg border border-edge-strong p-2 text-sm focus:border-rose-500 focus:outline-none" />
            )}
        </label>
    );
}

// A media slot bound to `name` via Controller (MediaField is a controlled value/onChange component).
function MediaControl({ name, mode, typeFilter }) {
    const { control } = useFormContext();
    return (
        <Controller
            control={control}
            name={name}
            render={({ field }) => (
                <MediaField mode={mode} typeFilter={typeFilter} value={field.value || []} onChange={field.onChange} />
            )}
        />
    );
}

export default function BlockCard({ index, total, type, onMove, onRemove, dragHandleProps, pageKey }) {
    const [open, setOpen] = useState(true);
    const { control, setValue, register } = useFormContext();
    const cfg = BLOCK_CONFIG[type];

    const base = `blocks.${index}`;
    const title = useWatch({ control, name: `${base}.title` });
    const visible = useWatch({ control, name: `${base}.visible` });
    const sectionComponent = useWatch({ control, name: `${base}.settings.component` });

    // Nested field array for list blocks (Stats rows, Team members, review items…).
    const { fields: items, append, remove, move } = useFieldArray({
        control,
        name: `${base}.items`,
        keyName: 'rhfId',
    });

    if (!cfg) return null;
    const Icon = cfg.icon;

    return (
        <div className={`rounded-xl border border-edge-subtle bg-white ${visible === false ? 'opacity-60' : ''}`}>
            {/* Header */}
            <div className="flex items-center gap-2 border-b px-4 py-3">
                <span {...dragHandleProps} className="cursor-grab text-gray-300 hover:text-ink-muted active:cursor-grabbing" title="Drag to reorder">
                    <GripVertical size={16} />
                </span>
                <button type="button" onClick={() => setOpen((o) => !o)} className="text-ink-muted hover:text-ink-secondary">
                    {open ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </button>
                <Icon size={16} className="text-rose-500" />
                <span className="text-sm font-semibold text-ink">
                    {cfg.section ? sectionLabel(sectionComponent) : cfg.label}
                </span>
                {!cfg.section && title && <span className="truncate text-sm text-ink-muted">— {title}</span>}

                <div className="ml-auto flex items-center gap-1">
                    <button type="button" onClick={() => onMove(-1)} disabled={index === 0} className="rounded-lg p-1 text-ink-muted hover:bg-ground-sunk disabled:opacity-30" title="Move up"><ArrowUp size={14} /></button>
                    <button type="button" onClick={() => onMove(1)} disabled={index === total - 1} className="rounded-lg p-1 text-ink-muted hover:bg-ground-sunk disabled:opacity-30" title="Move down"><ArrowDown size={14} /></button>
                    <button type="button" onClick={() => setValue(`${base}.visible`, visible === false)} className="rounded-lg p-1 text-ink-muted hover:bg-ground-sunk" title={visible === false ? 'Show' : 'Hide'}>
                        {visible === false ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                    <button type="button" onClick={onRemove} className="rounded-lg p-1 text-accent-ink hover:bg-accent-wash" title="Delete block"><Trash2 size={14} /></button>
                </div>
            </div>

            {open && (
                <div className="space-y-4 p-4">
                    {/* Section binding: pick which live component renders here */}
                    {cfg.section && (
                        <div>
                            <label className="block">
                                <span className="mb-1 block text-xs font-medium text-ink-secondary">Section</span>
                                <select
                                    {...register(`${base}.settings.component`)}
                                    className="w-full rounded-lg border border-edge-strong p-2 text-sm focus:border-rose-500 focus:outline-none"
                                >
                                    <option value="">Choose a section…</option>
                                    {SECTION_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                                </select>
                            </label>
                            {hasSectionSettings(sectionComponent) ? (
                                <SectionSettings base={base} component={sectionComponent} pageKey={pageKey} />
                            ) : SECTION_SOURCES[sectionComponent] ? (
                                <SourceNote source={SECTION_SOURCES[sectionComponent]} />
                            ) : (
                                <p className="mt-2 text-xs text-ink-muted">
                                    This section renders live from site data. Use show/hide and drag to control whether and where it appears.
                                </p>
                            )}
                        </div>
                    )}

                    {/* Top-level scalar fields */}
                    {cfg.fields?.length > 0 && (
                        <div className="grid gap-3 sm:grid-cols-2">
                            {cfg.fields.map((f) => (
                                <div key={f} className={isTextarea(f) ? 'sm:col-span-2' : ''}>
                                    <Field name={`${base}.${f}`} label={fieldLabel(f, cfg.labels)} textarea={isTextarea(f)} />
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Block-level media */}
                    {cfg.media && (
                        <div>
                            <span className="mb-1.5 block text-xs font-medium text-ink-secondary">
                                {cfg.media === 'gallery' ? 'Gallery media' : 'Media'}
                            </span>
                            <MediaControl name={`${base}.media`} mode={cfg.media} />
                        </div>
                    )}

                    {/* Items edited on their own screen */}
                    {cfg.source && <SourceNote source={cfg.source} />}

                    {/* Repeatable items (nested field array) */}
                    {cfg.item && (
                        <div>
                            <div className="mb-2 flex items-center justify-between">
                                <span className="text-xs font-semibold uppercase tracking-wide text-ink-muted">Items ({items.length})</span>
                                <button type="button" onClick={() => append(newItem())} className="flex items-center gap-1 rounded-lg border border-edge-strong px-2 py-1 text-xs text-ink-secondary hover:bg-ground">
                                    <Plus size={12} /> Add item
                                </button>
                            </div>
                            <div className="space-y-3">
                                {items.map((it, j) => (
                                    <div key={it.rhfId} className="rounded-lg border border-edge-subtle bg-ground p-3">
                                        <div className="mb-2 flex items-center justify-between">
                                            <span className="text-xs text-ink-muted">#{j + 1}</span>
                                            <div className="flex items-center gap-1">
                                                <button type="button" onClick={() => move(j, j - 1)} disabled={j === 0} className="rounded-lg p-0.5 text-ink-muted hover:bg-ground-sunk disabled:opacity-30"><ArrowUp size={12} /></button>
                                                <button type="button" onClick={() => move(j, j + 1)} disabled={j === items.length - 1} className="rounded-lg p-0.5 text-ink-muted hover:bg-ground-sunk disabled:opacity-30"><ArrowDown size={12} /></button>
                                                <button type="button" onClick={() => remove(j)} className="rounded-lg p-0.5 text-accent-ink hover:bg-accent-wash"><Trash2 size={12} /></button>
                                            </div>
                                        </div>
                                        <div className="flex gap-3">
                                            {cfg.item.media && (
                                                <MediaControl name={`${base}.items.${j}.media`} mode={cfg.item.media} typeFilter={cfg.item.mediaType || ''} />
                                            )}
                                            <div className="grid flex-1 gap-2">
                                                {cfg.item.fields.map((f) => (
                                                    <Field
                                                        key={f}
                                                        name={`${base}.items.${j}.${f}`}
                                                        label={fieldLabel(f, cfg.item.labels)}
                                                        textarea={isTextarea(f)}
                                                    />
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                {items.length === 0 && <p className="text-xs text-ink-muted">No items yet.</p>}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
