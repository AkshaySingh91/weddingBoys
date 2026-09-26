'use client';

import { useState } from 'react';
import { Reorder } from 'framer-motion';
import { DotsSixVertical, FilmSlate, ImageSquare } from '@phosphor-icons/react';
import { Button } from '@/app/admin/components/ui/Button.jsx';
import { fireMessage } from '@/Utils/fireMessage.js';
import { cn } from '@/lib/utils.js';
import { visibilityChip } from '../_lib/visibility.js';

const api_url = process.env.NEXT_PUBLIC_API_URL;
const MORE = 'More moments';

/**
 * Drag the wedding's films and photos into story-page order, within each
 * ceremony (the story page groups by ceremony, in the order set in
 * Settings › Portfolio Tags). Saved in one request as the item order.
 */
export default function ArrangePanel({ items, ceremonyOrder = [], clientId, onSaved, onCancel }) {
    const [groups, setGroups] = useState(() => {
        const byLabel = new Map();
        for (const i of items) {
            const label = i.eventGroup || MORE;
            if (!byLabel.has(label)) byLabel.set(label, []);
            byLabel.get(label).push(i);
        }
        const rank = (l) => (l === MORE ? Number.MAX_SAFE_INTEGER : (ceremonyOrder.indexOf(l) + 1 || ceremonyOrder.length + 1));
        return [...byLabel.entries()].sort((a, b) => rank(a[0]) - rank(b[0])).map(([label, list]) => ({ label, list }));
    });
    const [saving, setSaving] = useState(false);

    const save = async () => {
        setSaving(true);
        try {
            const res = await fetch(`${api_url}/api/admin/clients/${clientId}/order`, {
                method: 'POST',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ids: groups.flatMap((g) => g.list.map((i) => i._id)) }),
            });
            const data = await res.json().catch(() => ({}));
            if (!res.ok) throw new Error(data.message || 'Could not save the order');
            fireMessage('Order saved', 'success');
            onSaved?.();
        } catch (err) {
            fireMessage(err.message, 'error');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-studio-border bg-white px-4 py-3">
                <p className="text-xs text-studio-inkSecondary">
                    Drag to set the order on the story page. Ceremonies follow the order in Settings › Portfolio Tags.
                </p>
                <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={onCancel} disabled={saving}>Cancel</Button>
                    <Button variant="gold" size="sm" loading={saving} onClick={save}>Save order</Button>
                </div>
            </div>

            {groups.map((g, gi) => (
                <section key={g.label} className="rounded-2xl border border-studio-border bg-white">
                    <h3 className="border-b border-studio-border px-4 py-2.5 text-xs font-semibold uppercase tracking-wide text-studio-inkMuted">
                        {g.label} <span className="font-normal normal-case tracking-normal">· {g.list.length}</span>
                    </h3>
                    <Reorder.Group axis="y" values={g.list}
                        onReorder={(list) => setGroups((prev) => prev.map((x, xi) => (xi === gi ? { ...x, list } : x)))}
                        className="divide-y divide-studio-border">
                        {g.list.map((item) => {
                            const chip = visibilityChip(item);
                            const thumb = item.render?.posterUrl || item.render?.imageUrl;
                            return (
                                <Reorder.Item key={item._id} value={item}
                                    className="flex cursor-grab items-center gap-3 bg-white px-3 py-2 active:cursor-grabbing">
                                    <DotsSixVertical size={16} className="shrink-0 text-stone-400" />
                                    <span className="relative h-10 w-14 shrink-0 overflow-hidden rounded-md bg-stone-100">
                                        {/* eslint-disable-next-line @next/next/no-img-element -- small admin thumbnail */}
                                        {thumb && <img src={thumb} alt="" draggable={false} className="h-full w-full object-cover" />}
                                    </span>
                                    {item.kind === 'Video' ? <FilmSlate size={14} className="shrink-0 text-stone-500" /> : <ImageSquare size={14} className="shrink-0 text-stone-500" />}
                                    <span className="min-w-0 flex-1 truncate text-xs text-studio-ink">
                                        {item.caption || item.external?.title || item.media?.originalFileName || item.title}
                                    </span>
                                    {chip && <span title={chip.title} className={cn('rounded px-1.5 py-0.5 text-[10px] font-semibold text-white', chip.cls)}>{chip.label}</span>}
                                </Reorder.Item>
                            );
                        })}
                    </Reorder.Group>
                </section>
            ))}
        </div>
    );
}
