'use client';

import { useState } from 'react';
import { LinkSimple } from '@phosphor-icons/react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/app/admin/components/ui/Dialog.jsx';
import { Button } from '@/app/admin/components/ui/Button.jsx';
import TagPicker from '@/app/admin/components/taxonomy/TagPicker.jsx';
import { fireMessage } from '@/Utils/fireMessage.js';

const api_url = process.env.NEXT_PUBLIC_API_URL;

/**
 * Add a film that lives on YouTube or Vimeo (plan D8). The server looks the
 * video up (title, poster) and the film is ready at once — nothing to upload
 * or process. It plays on the site in the host's privacy-friendly embed.
 */
export default function AddFilmLinkDialog({ open, onClose, clientId, taxonomy, defaults, onAdded }) {
    const [url, setUrl] = useState('');
    const [tagIds, setTagIds] = useState([]);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    const close = () => { setUrl(''); setTagIds([]); setError(''); onClose(); };

    const submit = async (e) => {
        e.preventDefault();
        if (!url.trim()) return;
        setSaving(true);
        setError('');
        try {
            const res = await fetch(`${api_url}/api/admin/portfolio/external`, {
                method: 'POST',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    client: clientId,
                    url: url.trim(),
                    tagIds,
                    shootDate: defaults?.shootDate || undefined,
                    location: defaults?.city || defaults?.venue ? { city: defaults.city, venue: defaults.venue } : undefined,
                }),
            });
            const data = await res.json().catch(() => ({}));
            if (!res.ok) { setError(data.message || 'Could not add the film'); return; }
            fireMessage(`Added "${data.item?.caption || 'film'}"`, 'success');
            onAdded?.(data.item);
            close();
        } catch (err) {
            setError(err.message);
        } finally {
            setSaving(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={(v) => { if (!v && !saving) close(); }}>
            <DialogContent className="max-w-lg">
                <form onSubmit={submit} className="space-y-4">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2"><LinkSimple size={18} /> Add a film by link</DialogTitle>
                        <DialogDescription>Paste a YouTube or Vimeo link. The film plays from there; its poster and title are fetched for you.</DialogDescription>
                    </DialogHeader>
                    <input
                        autoFocus
                        value={url}
                        onChange={(e) => setUrl(e.target.value)}
                        placeholder="https://youtu.be/…  or  https://vimeo.com/…"
                        className="h-10 w-full rounded-xl border border-stone-300 px-3 text-sm outline-none focus:border-[#D9342A]"
                    />
                    {taxonomy && (
                        <TagPicker taxonomy={taxonomy} kind="Video" value={tagIds} onChange={setTagIds} only={['ceremony', 'film-type']} compact />
                    )}
                    {error && <p className="rounded-lg bg-rose-50 px-3 py-2 text-xs text-rose-700">{error}</p>}
                    <DialogFooter>
                        <Button type="button" variant="outline" size="sm" onClick={close} disabled={saving}>Cancel</Button>
                        <Button type="submit" variant="terracotta" size="sm" loading={saving} disabled={!url.trim()}>Add film</Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
