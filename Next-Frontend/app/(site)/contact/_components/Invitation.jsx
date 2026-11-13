'use client';

/**
 * /contact — "The Invitation".
 *
 * The couple doesn't fill in a form; they write the studio an invitation, in the
 * studio's own invitation-card design (the lookbook's gold double frame and TWV
 * monogram): "Together with their families, Riya & Arjun invite The Wedding
 * Vachan to their wedding, in December 2026, in Udaipur. Reply to …".
 *
 *   - arrives half-written: the button that brought them travels along
 *     (lib/contact.js) — a film, a wedding's story, the frames they circled,
 *     Varanasi's pre-wedding shoot, a city — and the card says so
 *   - asks for little: a name and a way to reply; the date can be a day, a month
 *     or "not fixed yet"; the partner's name, city and a note are optional
 *   - one card, two ways out: Send on WhatsApp opens a chat with the invitation
 *     already written (and quietly saves the lead when a name and number are
 *     there); Send the invitation submits it here
 *   - sent: the studio circles your date in red grease pencil and seals the
 *     card with a red TWV seal; Continue on WhatsApp is right there
 *
 * Phones: the card, then the direct ways to reach the studio; the two actions
 * sit in a bar at the bottom of the screen. Desktop: the card beside the studio.
 */
import { useMemo, useRef, useState, useEffect } from 'react';
import { flushSync } from 'react-dom';
import Link from 'next/link';
import { FaWhatsapp } from 'react-icons/fa';
import { FiPhone, FiMail, FiInstagram, FiMapPin, FiX, FiPlus, FiShare2, FiLink } from 'react-icons/fi';
import { KINDS } from '@/lib/contact.js';
import { INVITE_LOOKS, lookOf } from '@/lib/grades.js';

const api = () => (typeof window !== 'undefined' && window.location.hostname !== 'localhost' ? '' : (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'));
// The site's analytics only run once enabled (Component/analytics); this is a no-op otherwise.
const track = (name, params) => { try { if (window.__wvAnalyticsEnabled && typeof window.gtag === 'function') window.gtag('event', name, params); } catch { /* none */ } };

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const nextMonths = (n = 18) => {
    const d = new Date(); d.setDate(1);
    return Array.from({ length: n }, (_, i) => { const m = new Date(d.getFullYear(), d.getMonth() + i, 1); return `${MONTHS[m.getMonth()]} ${m.getFullYear()}`; });
};
/** "November" this year; "Jan 2027" after (never "January 27", which reads as a day). */
const monthLabel = (m) => { const [name, y] = m.split(' '); return y === String(new Date().getFullYear()) ? name : `${name.slice(0, 3)} ${y}`; };
const longDate = (iso) => { const [y, m, d] = iso.split('-').map(Number); return `${d} ${MONTHS[m - 1]} ${y}`; };
const validContact = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim()) || /^(91)?[0-9]{10}$/.test(v.replace(/[\s()+.-]/g, ''));
const article = (k) => (k ? k.toLowerCase() : 'wedding');

export default function Invitation({ from = '', context: initialContext = null, initialKind = '', initialCity = '', focus = '', studio = {}, windows = {}, initialLook = 'ivory', selects = [] }) {
    const [look, setLook] = useState(initialLook);
    const [preview, setPreview] = useState(null);   // desktop: the light under the pointer, not yet chosen
    const [invite, setInvite] = useState(null);     // { code, url } — the partner's copy, once sent
    const card = useRef(null);
    const [name, setName] = useState('');
    const [partner, setPartner] = useState('');
    const [kind, setKind] = useState(initialKind || 'Wedding');
    const [dateMode, setDateMode] = useState('month'); // 'day' | 'month' | 'open'
    const [day, setDay] = useState('');
    const [month, setMonth] = useState('');
    const [city, setCity] = useState(initialCity);
    const [contact, setContact] = useState('');
    const [note, setNote] = useState('');
    const [noteOpen, setNoteOpen] = useState(false);
    const [context, setContext] = useState(initialContext);
    const [errors, setErrors] = useState({});
    const [status, setStatus] = useState('idle'); // idle | sending | sent | error
    const [problem, setProblem] = useState('');
    const started = useRef(false);
    const request = useRef(null);
    const waSaved = useRef(false);
    const months = useMemo(() => nextMonths(), []);
    const studioPhone = studio.phones?.[0]?.replace(/\D/g, '') || '';

    useEffect(() => {
        if (focus === 'date') document.getElementById('invite-when')?.scrollIntoView({ block: 'center' });
    }, [focus]);

    const touch = () => { if (!started.current) { started.current = true; track('form_start', { form_id: 'wedding_enquiry' }); } };
    const set = (fn, key) => (e) => { fn(e.target.value); if (errors[key]) setErrors((x) => ({ ...x, [key]: undefined })); };

    const names = [name.trim(), partner.trim()].filter(Boolean).join(' & ');
    const when = dateMode === 'day' && day ? `on ${longDate(day)}` : dateMode === 'month' && month ? `in ${month}` : dateMode === 'open' ? 'on a date not fixed yet' : '';
    const sentence = [
        names ? `We're ${names}` : "Hi, we're planning a wedding",
        names ? `, planning our ${article(kind)}` : '',
        when ? ` ${when}` : '',
        city.trim() ? ` in ${city.trim()}` : '',
        '.',
    ].join('');
    const message = [
        'Hi The Wedding Vachan!', sentence,
        context ? `We loved ${context.label}${context.href ? `: ${typeof window === 'undefined' ? '' : window.location.origin}${context.href}` : ''}.` : '',
        note.trim(),
    ].filter(Boolean).join(' ');
    const waHref = studioPhone ? `https://wa.me/${studioPhone}?text=${encodeURIComponent(message)}` : null;

    const payload = (channel) => ({
        bride: name.trim(), groom: partner.trim(), contact: contact.trim(),
        eventDate: dateMode === 'day' && day ? { start: day, end: day } : undefined,
        dateNote: dateMode === 'month' ? month : dateMode === 'open' ? 'Not fixed yet' : '',
        kind, city: city.trim(), source: from || 'contact page',
        context: context ? `${context.label}${context.href ? ` (${context.href})` : ''}` : '',
        message: note.trim(), channel, grade: look, selects,
    });
    const post = (body, key, keepalive = false) => fetch(`${api()}/api/enquiry`, {
        method: 'POST', keepalive, headers: { 'Content-Type': 'application/json', 'Idempotency-Key': key }, body: JSON.stringify(body),
    });

    /** WhatsApp: the chat opens with the invitation written; the lead is saved too when it can be. */
    const onWhatsApp = () => {
        touch();
        if (waSaved.current || !name.trim() || !validContact(contact)) return;
        waSaved.current = true;
        post(payload('whatsapp'), crypto.randomUUID(), true).then((r) => { if (r.ok) track('generate_lead', { form_id: 'wedding_enquiry', method: 'whatsapp' }); }).catch(() => {});
    };

    const onSubmit = async (e) => {
        e.preventDefault();
        if (status === 'sending') return;
        const problems = {};
        if (!name.trim()) problems.name = 'Your name, please.';
        if (!validContact(contact)) problems.contact = 'A phone number (10 digits, +91 optional) or an email, so we can reply.';
        setErrors(problems);
        if (Object.keys(problems).length) { document.getElementById(problems.name ? 'invite-name' : 'invite-contact')?.focus(); return; }
        const body = payload('form');
        const serialized = JSON.stringify(body);
        if (request.current?.serialized !== serialized) request.current = { serialized, key: crypto.randomUUID() };
        setStatus('sending'); setProblem('');
        try {
            const res = await post(body, request.current.key);
            const data = await res.json().catch(() => ({}));
            if (!res.ok) {
                const server = {};
                for (const x of data.errors || []) server[x.field === 'bride' ? 'name' : x.field] = x.message;
                setErrors(server);
                throw new Error(data.message || 'Your invitation could not be sent. Please try again.');
            }
            if (data.invite?.code) setInvite(data.invite);
            setStatus('sent');
            track('generate_lead', { form_id: 'wedding_enquiry', method: 'website_form' });
            window.scrollTo({ top: 0, behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
        } catch (err) {
            setStatus('error');
            setProblem(err.message || 'Please check your connection and try again.');
        }
    };

    const sent = status === 'sent';
    const choose = (key, e) => {
        if (key === look) return;
        touch();
        const el = card.current;
        const go = () => flushSync(() => { setLook(key); setPreview(null); });
        if (!el || !document.startViewTransition || window.matchMedia('(prefers-reduced-motion: reduce)').matches) { go(); return; }
        const r = el.getBoundingClientRect(); const t = e?.currentTarget?.getBoundingClientRect();
        const root = document.documentElement;
        root.style.setProperty('--vx', `${t ? t.left + t.width / 2 - r.left : r.width / 2}px`);
        root.style.setProperty('--vy', `${t ? t.top + t.height / 2 - r.top : 0}px`);
        root.classList.add('vt-gel');
        document.startViewTransition(go).finished.finally(() => root.classList.remove('vt-gel'));
    };
    // Desktop: a warm lamp follows the pointer over the card (one layer, transform only).
    const lamp = useRef(0);
    const onPointerMove = (e) => {
        if (e.pointerType !== 'mouse') return;
        const el = card.current; if (!el) return;
        cancelAnimationFrame(lamp.current);
        const x = e.clientX; const y = e.clientY;
        lamp.current = requestAnimationFrame(() => {
            const r = el.getBoundingClientRect();
            el.style.setProperty('--lx', `${((x - r.left) / r.width - 0.5) * 100}%`);
            el.style.setProperty('--ly', `${((y - r.top) / r.height - 0.5) * 100}%`);
        });
    };
    const lk = lookOf(look);

    return (
        <div className="relative isolate">
            <div className="mx-auto w-full max-w-wide px-4 pb-32 pt-6 sm:px-6 lg:grid lg:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)] lg:gap-12 lg:px-8 lg:pb-20 lg:pt-10">
                <div>
                    <h1 className="sr-only">Check your date with The Wedding Vachan</h1>
                    {!sent && <LookRail look={look} onChoose={choose} />}
                    <form id="invitation" ref={card} onSubmit={onSubmit} onInput={touch} onPointerMove={onPointerMove} noValidate aria-label="Your invitation to The Wedding Vachan"
                        data-look={look} style={{ '--grade': lk.rgb, '--preview': lookOf(preview || look).rgb }}
                        className={`invite-card ${sent ? 'is-sealed' : ''} ${preview && preview !== look ? 'is-previewing' : ''}`}>
                        <span aria-hidden="true" className="invite-lamp" />
                        <span aria-hidden="true" className="invite-preview" />
                        <Motif key={look} look={look} />
                        {windows[look] ? (
                            <span aria-hidden="true" className="invite-window">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img src={windows[look]} alt="" />
                            </span>
                        ) : <span aria-hidden="true" className="invite-mono">TWV</span>}

                        {sent ? (
                            <Sealed names={names || name} when={when} contact={contact} waHref={waHref} onWhatsApp={onWhatsApp} invite={invite} partner={partner.trim()} />
                        ) : (
                            <>
                                {context && (
                                    <div className="mx-auto mb-6 flex max-w-md items-center gap-3 rounded-full bg-ground py-1.5 pl-1.5 pr-2 text-left ring-1 ring-ink/10">
                                        <span className="flex -space-x-3">
                                            {context.images.slice(0, 3).map((src) => (
                                                // eslint-disable-next-line @next/next/no-img-element
                                                <img key={src} src={src} alt="" className="h-9 w-9 rounded-full object-cover ring-2 ring-ground" />
                                            ))}
                                        </span>
                                        <span className="min-w-0 flex-1 text-[13px] leading-tight text-ink-secondary">
                                            {context.type === 'selects' ? 'Attached: ' : 'You were looking at '}<span className="font-semibold text-ink">{context.label}</span>
                                        </span>
                                        <button type="button" onClick={() => setContext(null)} aria-label="Leave this out of the invitation"
                                            className="grid h-9 w-9 shrink-0 cursor-pointer place-items-center rounded-full text-ink-muted hover:bg-ink/5 focus-ring">
                                            <FiX aria-hidden="true" className="h-4 w-4" />
                                        </button>
                                    </div>
                                )}

                                <p className="invite-line uppercase tracking-[0.22em] text-[11.5px] font-semibold text-gold">Together with their families</p>

                                <div className="mt-4 flex flex-wrap items-baseline justify-center gap-x-3 gap-y-2">
                                    <label className="invite-blank">
                                        <span className="sr-only">Your name</span>
                                        <input id="invite-name" value={name} onChange={set(setName, 'name')} placeholder="Your name" autoComplete="given-name"
                                            maxLength={120} aria-invalid={Boolean(errors.name)} aria-describedby={errors.name ? 'err-name' : undefined}
                                            className="invite-input font-display" size={Math.max(8, name.length + 1)} />
                                    </label>
                                    <span aria-hidden="true" className="font-display text-[30px] text-gold sm:text-[40px]">&amp;</span>
                                    <label className="invite-blank">
                                        <span className="sr-only">Your partner&rsquo;s name (optional)</span>
                                        <input value={partner} onChange={set(setPartner, 'partner')} placeholder="Partner" autoComplete="off"
                                            maxLength={120} className="invite-input font-display" size={Math.max(7, partner.length + 1)} />
                                    </label>
                                </div>
                                {errors.name && <p id="err-name" className="invite-error">{errors.name}</p>}

                                <p className="invite-line mt-6">invite The Wedding Vachan to their</p>
                                <div role="radiogroup" aria-label="What it is for" className="mt-3 flex flex-wrap justify-center gap-2">
                                    {KINDS.map((k) => (
                                        <button key={k} type="button" role="radio" aria-checked={kind === k} onClick={() => { touch(); setKind(k); }}
                                            className={`h-11 cursor-pointer rounded-full px-4 text-[14px] font-semibold transition-colors focus-ring ${kind === k ? 'bg-ink text-ground' : 'bg-ground text-ink-secondary ring-1 ring-ink/15 hover:text-ink'}`}>
                                            {k}
                                        </button>
                                    ))}
                                </div>

                                <div id="invite-when" className="mt-6 scroll-mt-28">
                                    <p className="invite-line">on</p>
                                    <div role="radiogroup" aria-label="When" className="mx-auto mt-3 flex w-max max-w-full rounded-full bg-ground p-1 ring-1 ring-ink/10">
                                        {[['day', 'A date'], ['month', 'A month'], ['open', 'Not fixed yet']].map(([m, label]) => (
                                            <button key={m} type="button" role="radio" aria-checked={dateMode === m} onClick={() => { touch(); setDateMode(m); }}
                                                className={`h-10 cursor-pointer rounded-full px-4 text-[13.5px] font-semibold transition-colors focus-ring ${dateMode === m ? 'bg-ink text-ground' : 'text-ink-secondary hover:text-ink'}`}>
                                                {label}
                                            </button>
                                        ))}
                                    </div>
                                    {dateMode === 'day' && (
                                        <label className="invite-blank mx-auto mt-4 block w-max">
                                            <span className="sr-only">The date</span>
                                            <input type="date" value={day} onChange={set(setDay, 'day')} min={new Date().toISOString().slice(0, 10)}
                                                className="invite-input font-display text-center" />
                                        </label>
                                    )}
                                    {dateMode === 'month' && (
                                        <ul aria-label="The month" className="-mx-2 mt-4 flex gap-2 overflow-x-auto px-2 pb-1 scrollbar-none sm:flex-wrap sm:justify-center sm:overflow-visible">
                                            {months.slice(0, 12).map((m) => (
                                                <li key={m} className="shrink-0">
                                                    <button type="button" aria-pressed={month === m} onClick={() => { touch(); setMonth(month === m ? '' : m); }}
                                                        className={`h-10 cursor-pointer whitespace-nowrap rounded-full px-3.5 text-[13.5px] font-semibold focus-ring ${month === m ? 'bg-accent text-ink-onAccent' : 'bg-ground text-ink-secondary ring-1 ring-ink/15 hover:text-ink'}`}>
                                                        {monthLabel(m)}
                                                    </button>
                                                </li>
                                            ))}
                                        </ul>
                                    )}
                                </div>

                                <p className="invite-line mt-6">in</p>
                                <label className="invite-blank mx-auto mt-2 block max-w-xs">
                                    <span className="sr-only">Where (optional)</span>
                                    <input value={city} onChange={set(setCity, 'city')} placeholder="Your city" autoComplete="address-level2" maxLength={80}
                                        className="invite-input font-display w-full text-center" />
                                </label>

                                <p className="invite-line mt-7">Reply to</p>
                                <label className="invite-blank mx-auto mt-2 block max-w-sm">
                                    <span className="sr-only">Your phone number or email</span>
                                    <input id="invite-contact" value={contact} onChange={set(setContact, 'contact')} placeholder="+91 phone, or email"
                                        inputMode="email" autoComplete="tel" maxLength={254} aria-invalid={Boolean(errors.contact)} aria-describedby={errors.contact ? 'err-contact' : 'hint-contact'}
                                        className="invite-input w-full text-center text-[20px] font-semibold" />
                                </label>
                                {errors.contact ? <p id="err-contact" className="invite-error">{errors.contact}</p>
                                    : <p id="hint-contact" className="mt-2 text-[12.5px] text-ink-muted">Your WhatsApp number works best.</p>}

                                <div className="mt-6">
                                    {noteOpen ? (
                                        <label className="mx-auto block max-w-md text-left">
                                            <span className="text-[12.5px] font-semibold text-ink-secondary">A note for us (optional)</span>
                                            <textarea value={note} onChange={set(setNote, 'note')} rows={3} maxLength={1000} autoFocus
                                                className="mt-1 w-full rounded-[14px] bg-ground p-3 text-[16px] text-ink ring-1 ring-ink/15 focus:outline-none focus:ring-2 focus:ring-accent/40" />
                                        </label>
                                    ) : (
                                        <button type="button" onClick={() => setNoteOpen(true)} className="inline-flex h-10 cursor-pointer items-center gap-1.5 rounded-full px-3 text-[13.5px] font-semibold text-ink-secondary hover:text-ink focus-ring">
                                            <FiPlus aria-hidden="true" className="h-4 w-4" />Add a note
                                        </button>
                                    )}
                                </div>

                                {problem && <p role="alert" className="invite-error mt-4">{problem}</p>}

                                {/* Desktop: the two ways out, on the card. Phones: the bar below. */}
                                <div className="mt-8 hidden gap-3 lg:flex lg:justify-center">
                                    <Actions waHref={waHref} onWhatsApp={onWhatsApp} sending={status === 'sending'} />
                                </div>
                            </>
                        )}
                    </form>
                </div>

                <div className="lg:sticky lg:top-[calc(var(--header-height)+16px)] lg:self-start">
                    {!sent && <Swatchbook look={look} preview={preview} onPreview={setPreview} onChoose={choose} />}
                    <Studio studio={studio} waHref={waHref} onWhatsApp={onWhatsApp} />
                </div>
            </div>

            {!sent && (
                <div className="invite-bar lg:hidden">
                    <Actions waHref={waHref} onWhatsApp={onWhatsApp} sending={status === 'sending'} />
                </div>
            )}
        </div>
    );
}

/** Phones: the lights as a row of small arched swatches above the card. */
function LookRail({ look, onChoose }) {
    return (
        <div role="radiogroup" aria-label="The invitation's light" className="invite-rail lg:hidden">
            {INVITE_LOOKS.map((l) => (
                <button key={l.key} type="button" role="radio" aria-checked={look === l.key} onClick={(e) => onChoose(l.key, e)}
                    style={{ '--grade': l.rgb }} className="invite-chip focus-ring">
                    <span aria-hidden="true" className="invite-chip-swatch" />{l.label}
                </button>
            ))}
        </div>
    );
}

/** Desktop: a fanned swatchbook under the card — point to preview a light, click to choose it. */
function Swatchbook({ look, preview, onPreview, onChoose }) {
    const n = INVITE_LOOKS.length;
    const shown = lookOf(preview || look);
    return (
        <div className="mb-10 hidden flex-col items-center rounded-[22px] bg-ground-raised/70 px-6 pb-5 pt-4 ring-1 ring-ink/[0.07] lg:flex">
            <p className="self-start text-[12px] font-semibold uppercase tracking-[0.16em] text-ink-muted">The invitation&rsquo;s light</p>
            <div role="radiogroup" aria-label="The invitation's light" className="invite-fan" onPointerLeave={() => onPreview(null)}>
                {INVITE_LOOKS.map((l, i) => (
                    <button key={l.key} type="button" role="radio" aria-checked={look === l.key} aria-label={l.label}
                        onPointerEnter={() => onPreview(l.key)} onFocus={() => onPreview(l.key)} onBlur={() => onPreview(null)} onClick={(e) => onChoose(l.key, e)}
                        style={{ '--grade': l.rgb, '--r': `${(i - (n - 1) / 2) * 14}deg`, '--z': look === l.key ? 9 : i }}
                        className="invite-leaf focus-ring" />
                ))}
            </div>
            <p aria-live="polite" className="mt-4 text-[13.5px] text-ink-muted">
                {preview && preview !== look ? <>Choose <span className="font-semibold text-ink">{shown.label}</span> light</> : <>In <span className="font-semibold text-ink">{shown.label}</span> light. Point to another.</>}
            </p>
        </div>
    );
}

/** Each light's hairline motif in foil; it draws in when the light changes. Never a fill. */
function Motif({ look }) {
    const corner = {
        mehendi: 'M4 46 C4 24 14 10 34 6 M10 30 C16 30 20 26 20 20 C20 26 24 30 30 30 M14 16 C18 18 20 14 22 12',
        sangeet: 'M4 4 L40 40 M4 22 L22 40 M22 4 L40 22 M4 40 L40 4 M4 22 L22 4 M22 40 L40 22',
        reception: 'M4 40 V4 H40 M10 40 V10 H40 M4 16 H10 M16 4 V10',
    }[look];
    return (
        <span aria-hidden="true" className="invite-motif">
            {look === 'haldi' && (
                <svg viewBox="0 0 100 20" preserveAspectRatio="none" className="invite-motif-top"><path pathLength="1" d="M4 4 Q27 18 50 6 Q73 18 96 4 M48 7 L50 3 L52 7 L50 11 Z" /></svg>
            )}
            {look === 'pheras' && (
                <svg viewBox="0 0 100 40" preserveAspectRatio="none" className="invite-motif-arch"><path pathLength="1" d="M14 40 C14 14 30 4 50 4 C70 4 86 14 86 40" /></svg>
            )}
            {corner && ['tl', 'tr', 'bl', 'br'].map((c) => (
                <svg key={c} viewBox="0 0 44 50" className={`invite-motif-corner is-${c}`}><path pathLength="1" d={corner} /></svg>
            ))}
        </span>
    );
}

function Actions({ waHref, onWhatsApp, sending }) {
    return (
        <>
            {waHref && (
                <a href={waHref} target="_blank" rel="noopener noreferrer" onClick={onWhatsApp}
                    className="flex h-12 flex-1 items-center justify-center gap-2 rounded-full bg-ink px-5 text-[15px] font-semibold text-ground hover:bg-ink/90 focus-ring lg:flex-none">
                    <FaWhatsapp aria-hidden="true" className="h-5 w-5" /><span className="sm:hidden">WhatsApp</span><span className="hidden sm:inline">Send on WhatsApp</span>
                </a>
            )}
            <button type="submit" form="invitation" disabled={sending} aria-busy={sending}
                className="flex h-12 flex-1 cursor-pointer items-center justify-center rounded-full bg-accent px-6 text-[15px] font-semibold text-ink-onAccent hover:bg-accent-hover focus-ring disabled:cursor-wait disabled:opacity-80 lg:flex-none">
                {sending ? 'Sending…' : <><span className="sm:hidden">Send invitation</span><span className="hidden sm:inline">Send the invitation</span></>}
            </button>
        </>
    );
}

/** Sent: the studio circles your date and seals the card; then a copy for your partner. */
function Sealed({ names, when, contact, waHref, onWhatsApp, invite, partner }) {
    return (
        <div role="status" className="invite-sealed">
            <span aria-hidden="true" className="invite-seal">TWV</span>
            <p className="invite-line uppercase tracking-[0.22em] text-[11.5px] font-semibold text-gold">Your invitation reached us</p>
            <p className="mt-4 font-display text-[36px] leading-tight text-ink sm:text-[48px]">{names}</p>
            {when && (
                <p className="mt-3 inline-block">
                    <span className="relative inline-block px-4 py-2 text-[17px] text-ink">
                        {when.replace(/^on |^in /, (m) => m)}
                        <svg aria-hidden="true" viewBox="0 0 150 100" preserveAspectRatio="none" className="select-loop" data-fresh="">
                            <path pathLength="1" d="M86 4 C128 4 147 14 147 50 C147 84 126 96 76 96 C27 96 3 86 3 50 C3 16 26 4 80 4 C92 4 101 6 108 9" />
                        </svg>
                    </span>
                </p>
            )}
            <p className="mx-auto mt-5 max-w-sm text-[15px] leading-relaxed text-ink-secondary">
                We&rsquo;ve circled your date. We&rsquo;ll reply on <span className="font-semibold text-ink">{contact}</span>.
            </p>
            <div className="mt-7 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
                {waHref && (
                    <a href={waHref} target="_blank" rel="noopener noreferrer" onClick={onWhatsApp}
                        className="flex h-12 items-center justify-center gap-2 rounded-full bg-ink px-5 text-[15px] font-semibold text-ground hover:bg-ink/90 focus-ring">
                        <FaWhatsapp aria-hidden="true" className="h-5 w-5" />Continue on WhatsApp
                    </a>
                )}
                <Link href="/films" className="flex h-12 items-center rounded-full px-5 text-[15px] font-semibold text-ink ring-1 ring-ink/15 hover:bg-ink/5 focus-ring">Watch our films</Link>
            </div>
            {invite && <PartnerCopy invite={invite} partner={partner} names={names} />}
        </div>
    );
}

/**
 * The partner's copy: the same invitation, at /invite/<code>, with sixteen of
 * the studio's photographs to circle. It peels off the card once it is sealed.
 * Share sheet on phones (WhatsApp, anyone); on desktop also a QR code to send
 * it from the phone.
 */
function PartnerCopy({ invite, partner, names }) {
    const [copied, setCopied] = useState(false);
    const url = typeof window === 'undefined' ? invite.url : `${window.location.origin}${invite.url}`;
    const who = partner || 'your partner';
    const text = `${names ? `${names}: our` : 'Our'} invitation, with a few photographs from The Wedding Vachan`;
    const send = async () => {
        track('share', { method: 'invite', form_id: 'wedding_enquiry' });
        if (navigator.share) { try { await navigator.share({ title: 'Our invitation', text, url }); } catch { /* dismissed */ } return; }
        window.open(`https://wa.me/?text=${encodeURIComponent(`${text} ${url}`)}`, '_blank', 'noopener');
    };
    const copy = async () => { try { await navigator.clipboard.writeText(url); setCopied(true); setTimeout(() => setCopied(false), 2000); } catch { /* none */ } };
    return (
        <div className="invite-copy">
            <p className="text-[11.5px] font-semibold uppercase tracking-[0.22em] text-gold">A copy for {who}</p>
            <p className="mx-auto mt-2 max-w-sm text-[14.5px] leading-relaxed text-ink-secondary">
                Your invitation, with sixteen of our photographs for {partner || 'them'} to circle.
            </p>
            <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
                <button type="button" onClick={send}
                    className="flex h-12 cursor-pointer items-center gap-2 rounded-full bg-accent px-5 text-[15px] font-semibold text-ink-onAccent hover:bg-accent-hover focus-ring">
                    <FiShare2 aria-hidden="true" className="h-[18px] w-[18px]" />Send to {partner || 'your partner'}
                </button>
                <button type="button" onClick={copy}
                    className="flex h-12 cursor-pointer items-center gap-2 rounded-full px-4 text-[14px] font-semibold text-ink ring-1 ring-ink/15 hover:bg-ink/5 focus-ring">
                    <FiLink aria-hidden="true" className="h-4 w-4" />{copied ? 'Copied' : 'Copy link'}
                </button>
            </div>
            <div className="mt-5 hidden items-center justify-center gap-4 lg:flex">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={`${api()}/api/invites/${invite.code}/qr.png`} alt="" width="96" height="96" className="h-24 w-24 rounded-[6px] bg-white p-1 ring-1 ring-ink/10" />
                <p className="max-w-[12rem] text-left text-[13px] leading-snug text-ink-muted">Scan to send it from your phone.</p>
            </div>
        </div>
    );
}

/** The studio, directly: WhatsApp, call, email, Instagram, the address. */
function Studio({ studio, waHref, onWhatsApp }) {
    const handleOf = (url) => `@${url.replace(/\/+$/, '').split('/').pop()}`;
    const instagram = Array.isArray(studio.instagram) ? studio.instagram : [];
    const maps = studio.address ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(studio.address)}` : null;
    return (
        <aside aria-labelledby="direct-title" className="mt-10 lg:mt-0 lg:pt-4">
            <h2 id="direct-title" className="font-display text-[30px] leading-tight text-ink">Or talk to us now</h2>
            <ul className="mt-5 divide-y divide-ink/10 rounded-[22px] bg-ground-raised ring-1 ring-ink/[0.07]">
                {waHref && (
                    <li>
                        <a href={waHref} target="_blank" rel="noopener noreferrer" onClick={onWhatsApp} className="direct-row">
                            <FaWhatsapp aria-hidden="true" className="h-5 w-5 text-ink" />
                            <span className="flex-1"><span className="block font-semibold text-ink">WhatsApp</span><span className="block text-[13px] text-ink-muted">Opens with your invitation written in</span></span>
                        </a>
                    </li>
                )}
                {(studio.phones || []).map((p) => (
                    <li key={p}>
                        <a href={`tel:${p.replace(/[^\d+]/g, '')}`} className="direct-row">
                            <FiPhone aria-hidden="true" className="h-5 w-5 text-ink" />
                            <span className="flex-1"><span className="block font-semibold tabular-nums text-ink">{p.replace(/^\+91(\d{5})(\d{5})$/, '+91 $1 $2')}</span><span className="block text-[13px] text-ink-muted">Call</span></span>
                        </a>
                    </li>
                ))}
                {studio.email && (
                    <li>
                        <a href={`mailto:${studio.email}`} className="direct-row">
                            <FiMail aria-hidden="true" className="h-5 w-5 text-ink" />
                            <span className="min-w-0 flex-1"><span className="block truncate font-semibold text-ink">{studio.email}</span><span className="block text-[13px] text-ink-muted">Email</span></span>
                        </a>
                    </li>
                )}
                {instagram.map((ig) => (
                    <li key={ig.href}>
                        <a href={ig.href} target="_blank" rel="noopener noreferrer" className="direct-row">
                            <FiInstagram aria-hidden="true" className="h-5 w-5 text-ink" />
                            <span className="flex-1"><span className="block font-semibold text-ink">{handleOf(ig.href)}</span><span className="block text-[13px] text-ink-muted">Instagram, {ig.place}</span></span>
                        </a>
                    </li>
                ))}
                {maps && (
                    <li>
                        <a href={maps} target="_blank" rel="noopener noreferrer" className="direct-row">
                            <FiMapPin aria-hidden="true" className="h-5 w-5 shrink-0 text-ink" />
                            <span className="flex-1"><span className="block text-[14px] leading-snug text-ink">{studio.address}</span><span className="block text-[13px] text-ink-muted">Visit the studio</span></span>
                        </a>
                    </li>
                )}
            </ul>
            <h2 className="mt-9 text-[12px] font-semibold uppercase tracking-[0.16em] text-ink-muted">What happens next</h2>
            <ol className="mt-3 space-y-3 text-[15px] leading-relaxed text-ink-secondary">
                <li className="flex gap-3"><span className="font-display text-[28px] leading-none text-gold">1</span>Your invitation reaches the studio team.</li>
                <li className="flex gap-3"><span className="font-display text-[28px] leading-none text-gold">2</span>We reply on the number or email you leave.</li>
            </ol>
        </aside>
    );
}
