'use client';

import { useState } from 'react';
import { X, CheckCircle, WarningCircle, FilmSlate, ImageSquare } from '@phosphor-icons/react';
import { Button } from '@/app/admin/components/ui/Button.jsx';

const field = 'w-full rounded-lg border border-edge-subtle bg-white px-3 py-2 text-xs text-ink outline-none focus:border-accent focus:ring-2 focus:ring-accent/15';
const label = 'mb-1 block text-[11px] font-medium uppercase tracking-wide text-ink-muted';

const clientLabel = (c) => [c.clientName?.Bride, c.clientName?.Groom].filter(Boolean).join(' & ') || 'Unnamed client';

/**
 * Assign library assets to a client.
 *
 * This is the door that did not exist: a media-library upload set `ownerType`
 * with `ownerId: null`, so it could never reach a public page. Assigning creates
 * the PortfolioItem and moves Media ownership to the client in one step.
 */
export default function AssignModal({ media, clients, vocabulary, onClose, onAssign, onDone }) {
    const [clientId, setClientId] = useState('');
    const [tags, setTags] = useState([]);
    const [tagInput, setTagInput] = useState('');
    const [shootDate, setShootDate] = useState('');
    const [city, setCity] = useState('');
    const [priority, setPriority] = useState(0);
    const [busy, setBusy] = useState(false);
    const [results, setResults] = useState(null);

    const addTag = (raw) => {
        const t = raw.trim();
        if (!t) return;
        setTags((prev) => (prev.includes(t) ? prev : [...prev, t]));
        setTagInput('');
    };

    const run = async () => {
        if (!clientId) return;
        setBusy(true);
        const out = [];
        // Sequential on purpose: each assignment writes both a PortfolioItem and
        // the Media ownership, and a partial failure should be attributable to a
        // specific file rather than lost in a Promise.all rejection.
        for (const m of media) {
            const res = await onAssign({
                media: m._id,
                client: clientId,
                tags,
                shootDate: shootDate || undefined,
                location: city ? { city } : undefined,
                generalPriority: Number(priority) || 0,
            });
            out.push({ media: m, ...res });
        }
        setResults(out);
        setBusy(false);
    };

    const ok = results?.filter((r) => r.item).length ?? 0;
    const failed = results?.filter((r) => r.error) ?? [];

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <button type="button" aria-label="Close" onClick={onClose} className="absolute inset-0 bg-ink/50 backdrop-blur-[2px]" />
            <div className="relative flex max-h-[88vh] w-full max-w-lg flex-col overflow-hidden rounded-xl border border-edge-subtle bg-ground shadow-2xl">
                <header className="flex shrink-0 items-center justify-between border-b border-edge-subtle px-4 py-3">
                    <div>
                        <h2 className="text-sm font-medium text-ink">Assign to a client</h2>
                        <p className="text-[11px] text-ink-muted">
                            {media.length} asset{media.length === 1 ? '' : 's'} selected
                        </p>
                    </div>
                    <Button variant="ghost" size="iconSm" onClick={onClose} aria-label="Close"><X size={15} /></Button>
                </header>

                <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-4">
                    <div className="flex flex-wrap gap-1.5">
                        {media.slice(0, 12).map((m) => (
                            <span key={m._id} className="flex items-center gap-1 rounded-lg border border-edge-subtle bg-white px-1.5 py-0.5 text-[10px] text-ink-secondary">
                                {m.mediaType === 'Video' ? <FilmSlate size={10} /> : <ImageSquare size={10} />}
                                <span className="max-w-[9rem] truncate">{m.title || m.originalName || m.mediaId}</span>
                            </span>
                        ))}
                        {media.length > 12 && <span className="text-[10px] text-ink-muted">+{media.length - 12} more</span>}
                    </div>

                    {results ? (
                        <div className="space-y-2">
                            <p className="flex items-center gap-1.5 text-xs font-medium text-emerald-700">
                                <CheckCircle size={14} weight="fill" /> {ok} assigned
                            </p>
                            {failed.length > 0 && (
                                <div className="rounded-lg border border-amber-200 bg-amber-50 p-2.5">
                                    <p className="mb-1 flex items-center gap-1.5 text-xs font-medium text-amber-800">
                                        <WarningCircle size={14} /> {failed.length} skipped
                                    </p>
                                    <ul className="space-y-0.5">
                                        {failed.map((f) => (
                                            <li key={f.media._id} className="text-[11px] text-amber-800">
                                                <span className="font-medium">{f.media.title || f.media.originalName || f.media.mediaId}</span> — {f.error}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </div>
                    ) : (
                        <>
                            <div>
                                <span className={label}>Client</span>
                                <select className={field} value={clientId} onChange={(e) => setClientId(e.target.value)}>
                                    <option value="">Choose a client…</option>
                                    {clients.map((c) => (
                                        <option key={c.clientId} value={c.clientId}>{clientLabel(c)}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <span className={label}>Tags</span>
                                <div className="mb-2 flex flex-wrap gap-1.5">
                                    {tags.map((t) => (
                                        <button
                                            key={t}
                                            type="button"
                                            onClick={() => setTags(tags.filter((x) => x !== t))}
                                            className="flex items-center gap-1 rounded-lg border border-edge-subtle bg-ground-sunk px-2 py-0.5 text-[11px] text-accent-ink hover:border-rose-300 hover:bg-rose-50 hover:text-rose-700"
                                        >
                                            {t} <X size={9} />
                                        </button>
                                    ))}
                                </div>
                                <input
                                    className={field}
                                    value={tagInput}
                                    placeholder="Type a tag and press Enter"
                                    onChange={(e) => setTagInput(e.target.value)}
                                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addTag(tagInput); } }}
                                />
                                <div className="mt-2 flex flex-wrap gap-1">
                                    {(vocabulary || []).filter((t) => !tags.includes(t)).slice(0, 14).map((t) => (
                                        <button
                                            key={t}
                                            type="button"
                                            onClick={() => addTag(t)}
                                            className="rounded-lg border border-edge-subtle bg-white px-1.5 py-0.5 text-[10px] text-ink-secondary hover:border-accent hover:text-accent-ink"
                                        >
                                            + {t}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="grid grid-cols-3 gap-3">
                                <div>
                                    <span className={label}>Shoot date</span>
                                    <input type="date" className={field} value={shootDate} onChange={(e) => setShootDate(e.target.value)} />
                                </div>
                                <div>
                                    <span className={label}>City</span>
                                    <input className={field} value={city} onChange={(e) => setCity(e.target.value)} />
                                </div>
                                <div>
                                    <span className={label}>Priority</span>
                                    <input type="number" className={field} value={priority} onChange={(e) => setPriority(e.target.value)} />
                                </div>
                            </div>

                            <p className="text-[10px] leading-relaxed text-ink-muted">
                                An asset still being transcoded is saved as a Draft and publishes itself
                                once the worker has produced its renditions.
                            </p>
                        </>
                    )}
                </div>

                <footer className="flex shrink-0 justify-end gap-2 border-t border-edge-subtle bg-white px-4 py-3">
                    {results ? (
                        <Button variant="gold" size="sm" onClick={onDone}>Done</Button>
                    ) : (
                        <>
                            <Button variant="outline" size="sm" onClick={onClose}>Cancel</Button>
                            <Button variant="gold" size="sm" loading={busy} disabled={!clientId} onClick={run}>
                                Assign {media.length} asset{media.length === 1 ? '' : 's'}
                            </Button>
                        </>
                    )}
                </footer>
            </div>
        </div>
    );
}
