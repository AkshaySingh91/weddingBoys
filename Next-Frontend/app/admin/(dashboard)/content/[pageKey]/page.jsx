'use client';

import { useRef } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useForm, FormProvider, useFieldArray, useWatch } from 'react-hook-form';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Plus, FloppyDisk, Eye } from '@phosphor-icons/react';
import { apiJson } from '@/lib/apiClient.js';
import { fireMessage } from '@/Utils/fireMessage.js';
import Loader from '@/Component/Loader.jsx';
import Button from '@/app/admin/components/ui/Button.jsx';
import Badge from '@/app/admin/components/ui/Badge.jsx';
import BlockCard from '../_components/BlockCard.jsx';
import { BLOCK_CONFIG, BLOCK_TYPES } from '../_components/config.js';

const idOf = (m) => (typeof m === 'string' ? m : m?._id);

// Working state (media as objects) -> API payload (media as id arrays).
const serialize = (blocks) => (blocks || []).map((b) => ({
    ...b,
    media: (b.media || []).map(idOf).filter(Boolean),
    items: (b.items || []).map((it) => ({ ...it, media: (it.media || []).map(idOf).filter(Boolean) })),
}));

const blankBlock = (type) => ({
    _id: Math.random().toString(36).slice(2, 12),
    type, title: '', subtitle: '', body: '', link: '',
    media: [], items: [], settings: {}, visible: true,
});

const contentKey = (pageKey) => ['content', pageKey];

// Outer component: owns the server query, then mounts the form ONCE with the
// loaded data as defaultValues (so background refetches never clobber typing).
export default function PageBuilder() {
    const { pageKey } = useParams();
    const { data: page, isLoading } = useQuery({
        queryKey: contentKey(pageKey),
        queryFn: () => apiJson(`/api/admin/content/${pageKey}`).then((d) => d.page),
    });

    if (isLoading || !page) return <Loader />;
    return <BuilderForm key={pageKey} page={page} pageKey={pageKey} />;
}

function BuilderForm({ page, pageKey }) {
    const qc = useQueryClient();
    const dragIndex = useRef(null);

    const methods = useForm({
        defaultValues: {
            title: page.title || pageKey,
            status: page.status || 'Published',
            blocks: page.blocks || [],
        },
    });
    const { control, getValues } = methods;
    const status = useWatch({ control, name: 'status' });

    const { fields, append, remove, move } = useFieldArray({
        control,
        name: 'blocks',
        keyName: 'rhfId',
    });

    const saveMutation = useMutation({
        mutationFn: (payload) => apiJson(`/api/admin/content/${pageKey}`, {
            method: 'PUT',
            body: JSON.stringify(payload),
        }),
        onSuccess: (data) => {
            qc.setQueryData(contentKey(pageKey), data.page);
            fireMessage('Page saved successfully', 'success');
        },
        onError: (err) => fireMessage(err.message, 'error'),
    });

    const persist = (nextStatus) => {
        const values = getValues();
        const payload = {
            title: values.title,
            status: nextStatus || values.status,
            blocks: serialize(values.blocks),
        };
        saveMutation.mutate(payload);
    };

    const handleDrop = (dropIndex) => {
        const from = dragIndex.current;
        if (from === null || from === dropIndex) return;
        move(from, dropIndex);
        dragIndex.current = null;
        persist();
    };

    return (
        <FormProvider {...methods}>
            <div className="space-y-6 max-w-5xl">
                {/* Header */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-[#E7E2DA] pb-5">
                    <div className="flex items-center gap-3.5">
                        <Link
                            href="/admin/content"
                            className="rounded-xl border border-stone-200 bg-white p-2.5 text-stone-500 shadow-sm transition hover:bg-stone-50 hover:text-[#2F2F2F]"
                        >
                            <ArrowLeft size={18} weight="bold" />
                        </Link>
                        <div>
                            <div className="flex items-center gap-2.5">
                                <h1 className="text-2xl font-sans font-bold tracking-tight capitalize text-[#2F2F2F]">{page.title || pageKey}</h1>
                                <Badge variant={status === 'Draft' ? 'warning' : 'success'} dot>
                                    {status}
                                </Badge>
                            </div>
                            <p className="mt-0.5 text-xs font-sans text-[#78716C]">
                                /{pageKey} · {fields.length} content block{fields.length === 1 ? '' : 's'}
                            </p>
                        </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2.5">
                        <Link
                            href={`/${pageKey === 'home' ? '' : pageKey}`}
                            target="_blank"
                            className="inline-flex items-center gap-1.5 rounded-xl border border-[#E7E2DA] bg-white px-3.5 py-2 text-xs font-medium font-sans text-[#44403C] shadow-sm transition hover:bg-[#F7F4EF]"
                        >
                            <Eye size={16} weight="bold" /> Preview Live
                        </Link>
                        <Button
                            type="button"
                            variant="outline"
                            disabled={saveMutation.isPending}
                            onClick={() => persist('Draft')}
                        >
                            Save Draft
                        </Button>
                        <Button
                            type="button"
                            variant="gold"
                            disabled={saveMutation.isPending}
                            loading={saveMutation.isPending}
                            onClick={() => persist('Published')}
                            icon={<FloppyDisk size={16} weight="bold" />}
                        >
                            Publish Changes
                        </Button>
                    </div>
                </div>

                {/* Blocks */}
                <div className="space-y-3.5">
                    {fields.map((field, i) => (
                        <div
                            key={field.rhfId}
                            onDragOver={(e) => e.preventDefault()}
                            onDrop={() => handleDrop(i)}
                        >
                            <BlockCard
                                index={i}
                                total={fields.length}
                                type={field.type}
                                onMove={(dir) => { const j = i + dir; if (j >= 0 && j < fields.length) move(i, j); }}
                                onRemove={() => remove(i)}
                                dragHandleProps={{
                                    draggable: true,
                                    onDragStart: () => { dragIndex.current = i; },
                                    onDragEnd: () => { dragIndex.current = null; },
                                }}
                            />
                        </div>
                    ))}
                    {fields.length === 0 && (
                        <div className="rounded-2xl border border-dashed border-[#D6D0C5] bg-white p-12 text-center text-sm font-sans text-[#78716C]">
                            No blocks added yet. Use the selector below to build your page layout.
                        </div>
                    )}
                </div>

                {/* Add block */}
                <AddBlock onAdd={(type) => append(blankBlock(type))} />
            </div>
        </FormProvider>
    );
}

function AddBlock({ onAdd }) {
    const openRef = useRef(null);
    return (
        <details ref={openRef} className="group relative mt-5">
            <summary className="flex w-full cursor-pointer list-none items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-stone-300 bg-white py-3.5 text-sm font-medium font-sans text-stone-500 shadow-sm transition hover:border-red-300 hover:text-red-600">
                <Plus size={16} weight="bold" /> Add Content Block
            </summary>
            <div className="absolute inset-x-0 z-20 mt-2 grid grid-cols-2 gap-2.5 rounded-2xl border border-[#E7E2DA] bg-white p-4 shadow-xl sm:grid-cols-3">
                {BLOCK_TYPES.map((type) => {
                    const cfg = BLOCK_CONFIG[type];
                    const Icon = cfg.icon;
                    return (
                        <button
                            key={type}
                            type="button"
                            onClick={() => { onAdd(type); if (openRef.current) openRef.current.open = false; }}
                            className="flex items-center gap-2.5 rounded-xl border border-[#E7E2DA] p-3 text-left text-xs font-medium font-sans text-[#44403C] transition hover:border-[#C5A880] hover:bg-[#FAF8F5]"
                        >
                            <Icon size={16} className="text-[#C5A880] shrink-0" /> {cfg.label}
                        </button>
                    );
                })}
            </div>
        </details>
    );
}
