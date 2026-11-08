'use client';

import { useCallback, useEffect, useState } from 'react';
import Image from 'next/image';
import { createUpload } from '@/lib/upload/multipartUploader.js';
import { apiJson } from '@/lib/apiClient.js';

const slots = [{ key: 'hero', label: 'Opening Varanasi scene' }, { key: 'director', label: 'Director scene' }];

function previewUrl(sequence, progress) {
  const tier = sequence.preview?.tiers?.find((item) => item.label === 'mobile') || sequence.preview?.tiers?.[0];
  if (!tier) return sequence.posterUrl;
  const raw = Math.round(progress * (sequence.frameCount - 1));
  const index = Math.min(Math.floor((sequence.frameCount - 1) / tier.everyNth) * tier.everyNth,
    Math.round(raw / tier.everyNth) * tier.everyNth);
  return tier.keyPattern.replace('{index}', String(index).padStart(tier.padTo || 4, '0'));
}

export default function VaranasiSequencesAdmin() {
  const [data, setData] = useState({ sequences: [], published: {} });
  const [files, setFiles] = useState({});
  const [startSec, setStartSec] = useState({ hero: 0, director: 0 });
  const [durationSec, setDurationSec] = useState({ hero: '', director: '' });
  const [focalX, setFocalX] = useState({ hero: 0.5, director: 0.5 });
  const [focalY, setFocalY] = useState({ hero: 0.5, director: 0.5 });
  const [progress, setProgress] = useState({});
  const [preview, setPreview] = useState({});
  const [busy, setBusy] = useState('');
  const [message, setMessage] = useState('');

  const refresh = useCallback(async () => {
    try { setData(await apiJson('/api/admin/sequences')); }
    catch (error) { setMessage(error.message); }
  }, []);

  useEffect(() => {
    const initial = setTimeout(refresh, 0);
    const timer = setInterval(refresh, 10000);
    return () => { clearTimeout(initial); clearInterval(timer); };
  }, [refresh]);

  async function upload(slot) {
    const file = files[slot];
    if (!file) return;
    setBusy(slot);
    setMessage('');
    try {
      const task = createUpload({
        file, ownerType: 'Website', slot: `varanasi-${slot}-source`,
        meta: { title: `Varanasi ${slot} sequence source`, sequenceSource: true },
        onProgress: (done, total) => setProgress((current) => ({ ...current, [slot]: Math.round(100 * done / total) })),
      });
      const media = await task.promise;
      await apiJson('/api/admin/sequences', {
        method: 'POST',
        body: JSON.stringify({ slot, sourceMediaId: media.mediaId, startSec: Number(startSec[slot]),
          durationSec: durationSec[slot] === '' ? undefined : Number(durationSec[slot]), frameCount: 150,
          focalX: Number(focalX[slot]), focalY: Number(focalY[slot]) }),
      });
      setFiles((current) => ({ ...current, [slot]: null }));
      setMessage('Upload complete. The media worker is generating the sequence.');
      await refresh();
    } catch (error) { setMessage(error.message); }
    finally { setBusy(''); }
  }

  async function publish(sequence) {
    setBusy(sequence._id);
    setMessage('');
    try {
      await apiJson(`/api/admin/sequences/${sequence._id}/publish`, { method: 'POST' });
      setMessage(`${sequence.name} is now published. Previous releases remain available for rollback.`);
      await refresh();
    } catch (error) { setMessage(error.message); }
    finally { setBusy(''); }
  }

  return (
    <div className="space-y-8 text-ink">
      <div>
        <p className="text-xs uppercase tracking-[0.2em] text-amber-700">Site presentation</p>
        <h1 className="mt-2 text-3xl font-semibold">Varanasi motion</h1>
        <p className="mt-2 max-w-2xl text-sm text-ink-secondary">Upload one source video per scene. The worker creates mobile and desktop frames in a versioned R2 release. Preview the frames, then publish. Publishing an older ready release rolls back.</p>
      </div>
      {message && <p role="status" className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm">{message}</p>}
      <div className="grid gap-5 lg:grid-cols-2">
        {slots.map((slot) => (
          <section key={slot.key} className="rounded-xl border border-edge-subtle bg-white p-5 shadow-sm">
            <h2 className="text-xl font-semibold">{slot.label}</h2>
            <p className="mt-1 text-xs text-ink-muted">Published release: {data.sequences.find((item) => item._id === data.published[slot.key])?.releaseId || 'Local fallback'}</p>
            <label className="mt-5 block text-sm font-medium">Source video</label>
            <input type="file" accept="video/mp4,video/quicktime,video/webm" className="mt-2 block w-full text-sm" onChange={(event) => setFiles((current) => ({ ...current, [slot.key]: event.target.files?.[0] }))} />
            <div className="mt-4 flex gap-3">
              <label className="text-xs">Start (seconds)<input className="mt-1 w-full rounded-lg border p-2 text-sm" type="number" min="0" step="0.1" value={startSec[slot.key]} onChange={(event) => setStartSec((current) => ({ ...current, [slot.key]: event.target.value }))} /></label>
              <label className="text-xs">Length (blank = source, max 15s)<input className="mt-1 w-full rounded-lg border p-2 text-sm" type="number" min="1" max="15" step="0.1" value={durationSec[slot.key]} onChange={(event) => setDurationSec((current) => ({ ...current, [slot.key]: event.target.value }))} /></label>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <label className="text-xs">Horizontal focus<input className="mt-1 block w-full" type="range" min="0" max="1" step="0.05" value={focalX[slot.key]} onChange={(event) => setFocalX((current) => ({ ...current, [slot.key]: event.target.value }))} /></label>
              <label className="text-xs">Vertical focus<input className="mt-1 block w-full" type="range" min="0" max="1" step="0.05" value={focalY[slot.key]} onChange={(event) => setFocalY((current) => ({ ...current, [slot.key]: event.target.value }))} /></label>
            </div>
            <button type="button" disabled={!files[slot.key] || !!busy} onClick={() => upload(slot.key)} className="mt-5 rounded-xl bg-ink px-5 py-3 text-sm font-semibold text-white disabled:opacity-50">{busy === slot.key ? `Uploading ${progress[slot.key] || 0}%` : 'Upload and generate'}</button>
          </section>
        ))}
      </div>
      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Releases</h2>
        {data.sequences.length === 0 && <p className="text-sm text-ink-muted">No generated releases yet. The current page uses its local frames.</p>}
        {data.sequences.map((sequence) => (
          <div key={sequence._id} className="grid gap-5 rounded-xl border border-edge-subtle bg-white p-5 md:grid-cols-[1fr_220px]">
            <div>
              <div className="flex flex-wrap items-center gap-2"><h3 className="font-semibold">{sequence.name}</h3><span className="rounded-full bg-ground-sunk px-2 py-1 text-xs">{sequence.status}</span>{data.published[sequence.slot] === sequence._id && <span className="rounded-full bg-emerald-100 px-2 py-1 text-xs text-emerald-800">Live</span>}</div>
              <p className="mt-1 font-mono text-xs text-ink-muted">{sequence.releaseId} · {sequence.frameCount} frames · {Math.round((sequence.totalBytes || 0) / 1024 / 1024 * 10) / 10} MB stored</p>
              {sequence.status === 'Processing' && !!sequence.expectedObjects && <p className="mt-2 text-xs text-amber-800">Generated {sequence.processedObjects || 0} of {sequence.expectedObjects} rendition frames</p>}
              {sequence.lastError && <p className="mt-2 text-sm text-accent-ink">{sequence.lastError}</p>}
              {sequence.status === 'Ready' && <>
                <label className="mt-4 block text-xs">Preview timeline <input aria-label={`Preview ${sequence.name}`} className="block w-full max-w-md" type="range" min="0" max="100" value={preview[sequence._id] || 0} onChange={(event) => setPreview((current) => ({ ...current, [sequence._id]: Number(event.target.value) }))} /></label>
                <button type="button" disabled={!!busy || data.published[sequence.slot] === sequence._id} onClick={() => publish(sequence)} className="mt-4 rounded-lg bg-amber-700 px-4 py-2 text-sm font-medium text-white disabled:opacity-50">{data.published[sequence.slot] === sequence._id ? 'Published' : 'Publish this release'}</button>
              </>}
            </div>
            {sequence.status === 'Ready' && <Image src={previewUrl(sequence, (preview[sequence._id] || 0) / 100)} alt={`${sequence.name} preview`} width={220} height={124} unoptimized className="aspect-video w-full rounded-xl bg-ink object-cover" style={{ objectPosition: `${(sequence.focalX ?? 0.5) * 100}% ${(sequence.focalY ?? 0.5) * 100}%` }} />}
          </div>
        ))}
      </section>
    </div>
  );
}
