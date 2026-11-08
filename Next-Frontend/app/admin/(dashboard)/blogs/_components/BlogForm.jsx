'use client';

import { useCallback, useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import {
    FloppyDisk,
    ImageSquare,
    X,
    ArrowLeft,
    Eye,
    Plus,
    Sparkle,
    Tag,
    Clock,
    CheckCircle,
    Globe,
    TreeStructure,
    Heart,
    Trophy,
    Question,
    ArrowsClockwise,
    DeviceMobile,
    Desktop,
    CalendarBlank,
    ChatCircle,
    Trash,
    LinkSimple,
    InstagramLogo,
    Check,
    HourglassMedium,
    ListNumbers,
    PaperPlaneRight,
    Archive,
    CalendarCheck,
    Copy,
    ArrowsInSimple,
    ArrowsOutSimple,
    SidebarSimple,
    SlidersHorizontal,
} from '@phosphor-icons/react';
import { useAuth } from '@/Context/AdminAuthContext.jsx';
import Editor from './Editor.jsx';
import BlogRenderer from '@/lib/blog/BlogRenderer.jsx';
import SeoAuditor from './SeoAuditor.jsx';
import EditorialAiCopilot from './EditorialAiCopilot.jsx';
import MediaPickerModal from '@/app/admin/components/MediaPickerModal.jsx';
import { Button } from '@/app/admin/components/ui/Button.jsx';
import { Badge } from '@/app/admin/components/ui/Badge.jsx';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/app/admin/components/ui/Dialog.jsx';
import { fireMessage } from '@/Utils/fireMessage.js';
import { cn } from '@/lib/utils.js';

const api_url = process.env.NEXT_PUBLIC_API_URL;

const CATEGORIES = [
    'Real Weddings',
    'Wedding Planning',
    'Photography',
    'Decor & Styling',
    'Venues',
    'Bridal Fashion',
    'Tips & Advice',
    'Destination',
];

const TEMPLATES = [
    {
        id: 'editorial-guide',
        name: 'Editorial Guide',
        desc: 'TOC rail, structured advice, FAQ & tips. Ideal for planning guides and SEO/AEO.',
        badge: 'Recommended',
    },
    {
        id: 'cinematic-real-wedding',
        name: 'Cinematic Real Wedding',
        desc: 'Full-bleed hero, couple overlay, At-a-Glance stats strip, vendor credits & couple story.',
        badge: 'Popular',
    },
    {
        id: 'photo-essay',
        name: 'Photo Essay',
        desc: 'Edge-to-edge masonry visual storytelling, minimal prose, large gallery focus.',
        badge: 'Visual',
    },
    {
        id: 'minimal-journal',
        name: 'Minimal Journal',
        desc: 'Narrow reading measure, generous whitespace, refined editorial typography.',
        badge: 'Intimate',
    },
];

const WEDDING_MOODS = [
    { value: 'romantic', emoji: '💕', label: 'Romantic' },
    { value: 'elegant', emoji: '🥂', label: 'Elegant' },
    { value: 'rustic', emoji: '🌿', label: 'Rustic' },
    { value: 'modern', emoji: '✨', label: 'Modern' },
    { value: 'vintage', emoji: '📻', label: 'Vintage' },
    { value: 'bohemian', emoji: '🌺', label: 'Bohemian' },
    { value: 'fun', emoji: '🎉', label: 'Fun' },
    { value: 'intimate', emoji: '🕯️', label: 'Intimate' },
];

const SEASONS = ['Spring', 'Summer', 'Monsoon', 'Autumn', 'Winter'];

const BUDGET_RANGES = [
    'Under ₹5 Lakh',
    '₹5–10 Lakh',
    '₹10–25 Lakh',
    '₹25–50 Lakh',
    '₹50 Lakh+',
];

const localSlugify = (s) => (s || '')
    .toLowerCase().trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');

function collectInlineMediaIds(json) {
    const ids = [];
    const walk = (node) => {
        if (!node) return;
        if (node.type === 'inlineMedia' && node.attrs?.mediaId) ids.push(node.attrs.mediaId);
        (node.content || []).forEach(walk);
    };
    walk(json);
    return [...new Set(ids)];
}

const emptyForm = {
    title: '',
    slug: '',
    excerpt: '',
    category: 'Real Weddings',
    template: 'editorial-guide',
    tags: [],
    keywords: [],
    focusKeyword: '',
    metaTitle: '',
    metaDescription: '',
    canonicalUrl: '',
    status: 'Draft',
    coverImage: null,
    coverUrl: '',
    content: '<p></p>',
    contentJson: null,
    mood: '',
    season: '',
    budget: '',
    venue: '',
    style: '',
    testimonial: '',
    testimonialAuthor: '',
    weddingDetails: {
        destination: '',
        venue: '',
        seasonMood: '',
        cinemaCrew: '',
        subtitle: '',
        flourishQuote: '',
        tagline: '',
        coupleNames: '',
    },
    featuredVideo: {
        url: '',
        title: '',
        duration: '',
        thumbnail: '',
    },
    vendorCredits: [],
    faq: [],
    howToSteps: [],
    seoScore: 0,
    allowComments: true,
    scheduledFor: '',
};

export default function BlogForm({ mode = 'create', initial = null, postId = null }) {
    const router = useRouter();

    const [form, setForm] = useState(() => {
        if (!initial) return emptyForm;
        return {
            title: initial.title || '',
            slug: initial.slug || '',
            excerpt: initial.excerpt || '',
            category: initial.category || 'Real Weddings',
            template: initial.template || 'editorial-guide',
            tags: initial.tags || [],
            keywords: initial.keywords || [],
            focusKeyword: initial.focusKeyword || '',
            metaTitle: initial.metaTitle || '',
            metaDescription: initial.metaDescription || '',
            canonicalUrl: initial.canonicalUrl || '',
            status: initial.status || 'Draft',
            coverImage: initial.coverImage?._id || null,
            coverUrl: initial.coverImage?.publicUrl || initial.coverImage?.cdnUrl || initial.featuredImage?.url || '',
            content: initial.content || '<p></p>',
            contentJson: initial.contentJson || null,
            mood: initial.mood || '',
            season: initial.season || '',
            budget: initial.budget || '',
            venue: initial.venue || '',
            style: initial.style || '',
            testimonial: initial.testimonial || '',
            testimonialAuthor: initial.testimonialAuthor || '',
            weddingDetails: {
                destination: initial.weddingDetails?.destination || '',
                venue: initial.weddingDetails?.venue || initial.venue || '',
                seasonMood: initial.weddingDetails?.seasonMood || '',
                cinemaCrew: initial.weddingDetails?.cinemaCrew || '',
                subtitle: initial.weddingDetails?.subtitle || '',
                flourishQuote: initial.weddingDetails?.flourishQuote || '',
                tagline: initial.weddingDetails?.tagline || '',
                coupleNames: initial.weddingDetails?.coupleNames || '',
            },
            featuredVideo: {
                url: initial.featuredVideo?.url || '',
                title: initial.featuredVideo?.title || '',
                duration: initial.featuredVideo?.duration || '',
                thumbnail: initial.featuredVideo?.thumbnail || '',
            },
            vendorCredits: initial.vendorCredits || [],
            faq: initial.faq || [],
            howToSteps: initial.howToSteps || [],
            seoScore: initial.seoScore || 0,
            allowComments: initial.allowComments !== false,
            scheduledFor: initial.scheduledFor ? new Date(initial.scheduledFor).toISOString().slice(0, 16) : '',
        };
    });

    const [tagInput, setTagInput] = useState('');
    const [keywordInput, setKeywordInput] = useState('');
    const [toc, setToc] = useState([]);
    const [coverPicker, setCoverPicker] = useState(false);
    const [saving, setSaving] = useState(false);
    const [slugEdited, setSlugEdited] = useState(mode === 'edit');
    const [previewOpen, setPreviewOpen] = useState(false);
    const [previewViewport, setPreviewViewport] = useState('desktop'); // 'desktop' | 'mobile'

    // Role & Publishing Governance State
    const { user, role } = useAuth() || {};
    const canPublish = role === 'SuperAdmin' || role === 'Editor';

    const [aiCopilotOpen, setAiCopilotOpen] = useState(false);
    const [scheduleModalOpen, setScheduleModalOpen] = useState(false);
    const [scheduledDateTime, setScheduledDateTime] = useState('');
    const [sharingPreview, setSharingPreview] = useState(false);

    // Autosave & revision state
    const [isDirty, setIsDirty] = useState(false);
    const [autosaveStatus, setAutosaveStatus] = useState('idle'); // 'idle' | 'saving' | 'saved'
    const [lastSavedTime, setLastSavedTime] = useState(null);
    const [revisionsOpen, setRevisionsOpen] = useState(false);
    const [revisions, setRevisions] = useState([]);
    const [loadingRevisions, setLoadingRevisions] = useState(false);
    const [restoringRevId, setRestoringRevId] = useState(null);
    const [hasLocalDraft, setHasLocalDraft] = useState(false);

    // Layout & Inspector UX State
    const [zenMode, setZenMode] = useState(true);
    const [inspectorTab, setInspectorTab] = useState('story'); // 'story' | 'seo' | 'details' | 'manage'

    const autosaveTimerRef = useRef(null);
    const draftStorageKey = `wb_blog_draft_${postId || 'new'}`;

    const handleCopyPreviewLink = async () => {
        if (!postId) {
            return fireMessage('Please save draft first before generating a preview link.', 'warning');
        }
        setSharingPreview(true);
        try {
            const res = await fetch(`${api_url}/api/admin/blogs/${postId}/preview-token`, {
                credentials: 'include',
            });
            const data = await res.json();
            if (res.ok && data.previewUrl) {
                const fullUrl = `${window.location.origin}${data.previewUrl}`;
                await navigator.clipboard.writeText(fullUrl);
                fireMessage('24-Hour Preview link copied to clipboard!', 'success');
            } else {
                fireMessage(data.error || 'Failed to generate preview link', 'error');
            }
        } catch (err) {
            fireMessage(err.message, 'error');
        } finally {
            setSharingPreview(false);
        }
    };

    const handleApplyAi = (updates) => {
        set(updates);
        fireMessage('Editorial suggestions applied!', 'success');
    };

    const handleConfirmSchedule = () => {
        if (!scheduledDateTime) {
            return fireMessage('Please select publication date and time', 'error');
        }
        const targetDate = new Date(scheduledDateTime);
        if (targetDate <= new Date()) {
            return fireMessage('Scheduled date and time must be in the future', 'error');
        }
        setScheduleModalOpen(false);
        submit('Scheduled', targetDate.toISOString());
    };

    const set = (patch) => {
        setIsDirty(true);
        setForm((p) => ({ ...p, ...patch }));
    };

    const handleScoreChange = useCallback((score) => {
        setForm((prev) => {
            if (prev.seoScore === score) return prev;
            return { ...prev, seoScore: score };
        });
    }, []);

    const onTitle = (v) => {
        set({ title: v, ...(slugEdited ? {} : { slug: localSlugify(v) }) });
    };

    const onEditorUpdate = useCallback(({ html, json }) => {
        setIsDirty(true);
        setForm((p) => ({ ...p, content: html, contentJson: json }));
    }, []);

    const addToList = (key, value, clear) => {
        const v = value.trim().replace(/,$/, '');
        if (v && !form[key].includes(v)) set({ [key]: [...form[key], v] });
        clear('');
    };

    // ── Local SessionStorage Draft Recovery ──
    useEffect(() => {
        if (mode === 'create') {
            try {
                const saved = sessionStorage.getItem(draftStorageKey);
                if (saved) {
                    const parsed = JSON.parse(saved);
                    if (parsed.title || parsed.contentJson) {
                        // eslint-disable-next-line react-hooks/set-state-in-effect
                        setHasLocalDraft(true);
                    }
                }
            } catch (e) {
                // ignore
            }
        }
    }, [mode, draftStorageKey]);

    const restoreLocalDraft = () => {
        try {
            const saved = sessionStorage.getItem(draftStorageKey);
            if (saved) {
                const parsed = JSON.parse(saved);
                setForm((prev) => ({ ...prev, ...parsed }));
                setHasLocalDraft(false);
                fireMessage('Local draft restored', 'success');
            }
        } catch (e) {
            fireMessage('Failed to restore local draft', 'error');
        }
    };

    const discardLocalDraft = () => {
        sessionStorage.removeItem(draftStorageKey);
        setHasLocalDraft(false);
    };

    // ── SessionStorage Autosave (Every 1s debounce) ──
    useEffect(() => {
        if (!isDirty) return;
        const timer = setTimeout(() => {
            try {
                sessionStorage.setItem(draftStorageKey, JSON.stringify(form));
            } catch (e) {
                // storage full or quota
            }
        }, 1000);
        return () => clearTimeout(timer);
    }, [form, isDirty, draftStorageKey]);

    // ── Server DB Autosave for Edit Mode (5s idle debounce) ──
    useEffect(() => {
        if (mode !== 'edit' || !postId || !isDirty) return;

        if (autosaveTimerRef.current) clearTimeout(autosaveTimerRef.current);

        autosaveTimerRef.current = setTimeout(async () => {
            if (!form.title.trim()) return;
            setAutosaveStatus('saving');
            try {
                const res = await fetch(`${api_url}/api/admin/blogs/${postId}/revisions`, {
                    method: 'POST',
                    credentials: 'include',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        title: form.title,
                        contentJson: form.contentJson,
                        excerpt: form.excerpt,
                        template: form.template,
                        reason: 'autosave',
                    }),
                });
                if (res.ok) {
                    setAutosaveStatus('saved');
                    setLastSavedTime(new Date());
                    setIsDirty(false);
                }
            } catch (err) {
                setAutosaveStatus('idle');
            }
        }, 5000);

        return () => {
            if (autosaveTimerRef.current) clearTimeout(autosaveTimerRef.current);
        };
    }, [form.title, form.contentJson, form.excerpt, form.template, mode, postId, isDirty]);

    // ── Unsaved Changes Warning (beforeunload) ──
    useEffect(() => {
        const handleBeforeUnload = (e) => {
            if (isDirty) {
                e.preventDefault();
                e.returnValue = '';
            }
        };
        window.addEventListener('beforeunload', handleBeforeUnload);
        return () => window.removeEventListener('beforeunload', handleBeforeUnload);
    }, [isDirty]);

    // ── Fetch Revisions ──
    const fetchRevisions = async () => {
        if (!postId) return;
        setLoadingRevisions(true);
        try {
            const res = await fetch(`${api_url}/api/admin/blogs/${postId}/revisions`, {
                credentials: 'include',
            });
            const data = await res.json();
            if (res.ok) {
                setRevisions(data.revisions || []);
            }
        } catch (err) {
            fireMessage('Failed to fetch revisions', 'error');
        } finally {
            setLoadingRevisions(false);
        }
    };

    const handleOpenRevisions = () => {
        setRevisionsOpen(true);
        fetchRevisions();
    };

    const handleRestoreRevision = async (revId) => {
        if (!postId || !revId) return;
        setRestoringRevId(revId);
        try {
            const res = await fetch(`${api_url}/api/admin/blogs/${postId}/revisions/${revId}/restore`, {
                method: 'POST',
                credentials: 'include',
            });
            const data = await res.json();
            if (res.ok && data.post) {
                const restored = data.post;
                setForm((prev) => ({
                    ...prev,
                    title: restored.title || prev.title,
                    excerpt: restored.excerpt || prev.excerpt,
                    template: restored.template || prev.template,
                    contentJson: restored.contentJson || prev.contentJson,
                    content: restored.content || prev.content,
                }));
                setIsDirty(false);
                setRevisionsOpen(false);
                fireMessage('Revision restored successfully', 'success');
            } else {
                fireMessage(data.error || 'Restore failed', 'error');
            }
        } catch (err) {
            fireMessage(err.message, 'error');
        } finally {
            setRestoringRevId(null);
        }
    };

    // ── Submit / Save / Publish ──
    const submit = async (statusOverride, scheduledForOverride) => {
        if (!form.title.trim()) return fireMessage('Please provide a post title', 'error');
        if (!form.excerpt.trim()) return fireMessage('Please provide a short excerpt or summary', 'error');

        setSaving(true);
        const status = statusOverride || form.status;
        const scheduledFor = scheduledForOverride !== undefined ? scheduledForOverride : (form.scheduledFor || null);
        const payload = {
            title: form.title,
            slug: form.slug || localSlugify(form.title),
            excerpt: form.excerpt,
            content: form.content,
            contentJson: form.contentJson,
            template: form.template,
            category: form.category,
            tags: form.tags,
            keywords: form.keywords,
            focusKeyword: form.focusKeyword,
            metaTitle: form.metaTitle,
            metaDescription: form.metaDescription,
            canonicalUrl: form.canonicalUrl,
            status,
            coverImage: form.coverImage,
            mood: form.mood,
            season: form.season,
            budget: form.budget,
            venue: form.venue,
            style: form.style,
            testimonial: form.testimonial,
            testimonialAuthor: form.testimonialAuthor,
            weddingDetails: form.weddingDetails,
            featuredVideo: form.featuredVideo,
            vendorCredits: form.vendorCredits,
            faq: form.faq,
            howToSteps: form.howToSteps || [],
            seoScore: form.seoScore || 0,
            allowComments: form.allowComments,
            scheduledFor,
            inlineMedia: form.contentJson ? collectInlineMediaIds(form.contentJson) : [],
        };

        try {
            const url = mode === 'create'
                ? `${api_url}/api/admin/blogs`
                : `${api_url}/api/admin/blogs/${postId}`;
            const res = await fetch(url, {
                method: mode === 'create' ? 'POST' : 'PUT',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });
            const data = await res.json();
            if (res.status >= 300) return fireMessage(data.error || 'Save failed', 'error');

            sessionStorage.removeItem(draftStorageKey);
            setIsDirty(false);


            let msg = 'Story saved successfully';
            if (status === 'Published') msg = 'Story published successfully';
            else if (status === 'Scheduled') msg = `Story scheduled for ${new Date(payload.scheduledFor).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}`;
            else if (status === 'InReview') msg = 'Story submitted for editorial review';
            else if (status === 'Archived') msg = 'Story archived';

            fireMessage(msg, 'success');
            router.push('/admin/blogs');
        } catch (err) {
            fireMessage(err.message, 'error');
        } finally {
            setSaving(false);
        }
    };

    // Vendor credits helpers
    const addVendorCredit = () => {
        set({
            vendorCredits: [...form.vendorCredits, { role: '', name: '', url: '', instagram: '' }],
        });
    };
    const updateVendorCredit = (idx, field, val) => {
        const next = [...form.vendorCredits];
        next[idx] = { ...next[idx], [field]: val };
        set({ vendorCredits: next });
    };
    const removeVendorCredit = (idx) => {
        set({ vendorCredits: form.vendorCredits.filter((_, i) => i !== idx) });
    };

    // FAQ helpers
    const addFaqItem = () => {
        set({
            faq: [...form.faq, { question: '', answer: '' }],
        });
    };
    const updateFaqItem = (idx, field, val) => {
        const next = [...form.faq];
        next[idx] = { ...next[idx], [field]: val };
        set({ faq: next });
    };
    const removeFaqItem = (idx) => {
        set({ faq: form.faq.filter((_, i) => i !== idx) });
    };

    // HowTo steps helpers
    const addHowToStep = () => {
        set({
            howToSteps: [...(form.howToSteps || []), { name: '', text: '', image: '' }],
        });
    };
    const updateHowToStep = (idx, field, val) => {
        const next = [...(form.howToSteps || [])];
        next[idx] = { ...next[idx], [field]: val };
        set({ howToSteps: next });
    };
    const removeHowToStep = (idx) => {
        set({ howToSteps: (form.howToSteps || []).filter((_, i) => i !== idx) });
    };

    const metaTitleLen = (form.metaTitle || form.title).length;
    const metaDescLen = (form.metaDescription || form.excerpt).length;
    const counterColor = (len, min, max) => (len >= min && len <= max ? 'text-emerald-600' : len > max ? 'text-rose-600' : 'text-amber-600');
    const wordCount = form.content ? form.content.replace(/<[^>]*>/g, ' ').split(/\s+/).filter(Boolean).length : 0;
    const readingTime = Math.max(1, Math.ceil(wordCount / 200));

    // Live preview post representation
    const previewPost = {
        ...form,
        title: form.title || 'Untitled Wedding Story',
        category: form.category || 'Editorial Feature',
        excerpt: form.excerpt || 'An exquisite editorial feature capturing timeless romance and cinematic storytelling.',
        featuredImage: form.coverUrl ? { url: form.coverUrl } : null,
        coverImage: form.coverUrl ? { publicUrl: form.coverUrl, cdnUrl: form.coverUrl, altText: form.title || 'Cover' } : null,
        readingTime: Math.max(1, Math.ceil((form.content?.replace(/<[^>]*>/g, ' ').split(/\s+/).filter(Boolean).length || 0) / 200)),
        publishedAt: form.scheduledFor || new Date().toISOString(),
        createdAt: new Date().toISOString(),
        author: { name: 'The Wedding Vachan Editorial', avatar: null },
    };

    return (
        <div className="space-y-6 pb-16 font-sans">
            {/* Local Draft Recovery Banner */}
            {hasLocalDraft && (
                <div className="flex items-center justify-between gap-3 rounded-xl border border-amber-300 bg-amber-50 p-4 text-amber-900 shadow-sm">
                    <div className="flex items-center gap-2.5">
                        <Sparkle size={18} className="text-amber-600 shrink-0" weight="fill" />
                        <span className="text-xs font-medium">
                            An unsaved local draft was found in your browser session. Would you like to restore it?
                        </span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                        <Button variant="outline" size="sm" onClick={discardLocalDraft} className="text-xs">
                            Discard
                        </Button>
                        <Button variant="gold" size="sm" onClick={restoreLocalDraft} className="text-xs">
                            Restore Draft
                        </Button>
                    </div>
                </div>
            )}

            {/* Top Navigation & Action Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-edge-subtle pb-4">
                <div className="flex items-center gap-3">
                    <Button
                        variant="ghost"
                        size="sm"
                        icon={ArrowLeft}
                        onClick={() => router.push('/admin/blogs')}
                        className="text-ink-secondary"
                    >
                        Back
                    </Button>
                    <div className="h-4 w-px bg-ground-sunk" />
                    <div>
                        <div className="flex items-center gap-2">
                            <h1 className="text-lg sm:text-xl font-bold text-ink">
                                {mode === 'create' ? 'Compose New Story' : 'Edit Editorial Article'}
                            </h1>
                            <Badge
                                variant={
                                    form.status === 'Published'
                                        ? 'success'
                                        : form.status === 'InReview'
                                        ? 'warning'
                                        : form.status === 'Scheduled'
                                        ? 'info'
                                        : 'neutral'
                                }
                                size="sm"
                                dot
                            >
                                {form.status === 'InReview' ? 'In Review' : form.status}
                                {form.status === 'Scheduled' && form.scheduledFor && (
                                    <span className="ml-1 text-[10px] font-normal opacity-85">
                                        ({new Date(form.scheduledFor).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })})
                                    </span>
                                )}
                            </Badge>
                            {autosaveStatus === 'saving' && (
                                <span className="inline-flex items-center gap-1 text-[11px] text-ink-muted font-medium">
                                    <ArrowsClockwise size={12} className="animate-spin text-accent-ink" />
                                    Autosaving...
                                </span>
                            )}
                            {autosaveStatus === 'saved' && (
                                <span className="inline-flex items-center gap-1 text-[11px] text-emerald-600 font-medium">
                                    <Check size={12} weight="bold" />
                                    Saved
                                </span>
                            )}
                            {isDirty && autosaveStatus === 'idle' && (
                                <span className="inline-flex items-center gap-1 text-[11px] text-amber-600 font-medium">
                                    Unsaved changes
                                </span>
                            )}
                        </div>
                        <p className="text-[11px] text-ink-muted mt-0.5">
                            Craft wedding cinematography journals, vendor showcases, and couple stories.
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                    {mode === 'edit' && (
                        <Button
                            variant="ghost"
                            size="sm"
                            icon={ArrowsClockwise}
                            onClick={handleOpenRevisions}
                            className="text-ink-secondary"
                        >
                            Revisions
                        </Button>
                    )}
                    {mode === 'edit' && postId && (
                        <Button
                            variant="ghost"
                            size="sm"
                            icon={LinkSimple}
                            loading={sharingPreview}
                            onClick={handleCopyPreviewLink}
                            title="Generate 24-hour signed preview link for clients/reviewers"
                            className="text-ink-secondary"
                        >
                            Share Preview
                        </Button>
                    )}
                    <Button
                        variant="outline"
                        size="sm"
                        icon={Sparkle}
                        onClick={() => setAiCopilotOpen(true)}
                        className="border-accent/30 text-accent-ink hover:bg-accent-hover font-semibold"
                    >
                        AI Co-Pilot
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        icon={Eye}
                        onClick={() => setPreviewOpen(true)}
                    >
                        Live Preview
                    </Button>
                    <Button
                        variant={zenMode ? "secondary" : "outline"}
                        size="sm"
                        icon={zenMode ? ArrowsInSimple : ArrowsOutSimple}
                        onClick={() => setZenMode(!zenMode)}
                        title={zenMode ? "Exit Zen Focus Mode (Show Sidebar Inspector)" : "Zen Focus Mode (Distraction-Free Canvas)"}
                        className="hidden sm:inline-flex"
                    >
                        {zenMode ? "Exit Zen" : "Zen Focus"}
                    </Button>
                    <Button
                        variant="secondary"
                        size="sm"
                        icon={FloppyDisk}
                        loading={saving}
                        onClick={() => submit('Draft')}
                    >
                        Save Draft
                    </Button>

                    {/* Role-governed publication lifecycle actions */}
                    {!canPublish ? (
                        <Button
                            variant="gold"
                            size="sm"
                            icon={PaperPlaneRight}
                            loading={saving}
                            onClick={() => submit('InReview')}
                        >
                            Submit for Review
                        </Button>
                    ) : (
                        <>
                            {form.status === 'Draft' && (
                                <>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        icon={PaperPlaneRight}
                                        loading={saving}
                                        onClick={() => submit('InReview')}
                                    >
                                        Mark In Review
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        icon={CalendarBlank}
                                        onClick={() => setScheduleModalOpen(true)}
                                    >
                                        Schedule...
                                    </Button>
                                    <Button
                                        variant="gold"
                                        size="sm"
                                        icon={CheckCircle}
                                        loading={saving}
                                        onClick={() => submit('Published')}
                                    >
                                        Publish Now
                                    </Button>
                                </>
                            )}
                            {form.status === 'InReview' && (
                                <>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        icon={CalendarBlank}
                                        onClick={() => setScheduleModalOpen(true)}
                                    >
                                        Schedule...
                                    </Button>
                                    <Button
                                        variant="gold"
                                        size="sm"
                                        icon={CheckCircle}
                                        loading={saving}
                                        onClick={() => submit('Published')}
                                    >
                                        Approve &amp; Publish
                                    </Button>
                                </>
                            )}
                            {form.status === 'Scheduled' && (
                                <>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        icon={CalendarBlank}
                                        onClick={() => setScheduleModalOpen(true)}
                                    >
                                        Reschedule
                                    </Button>
                                    <Button
                                        variant="gold"
                                        size="sm"
                                        icon={CheckCircle}
                                        loading={saving}
                                        onClick={() => submit('Published')}
                                    >
                                        Publish Immediately
                                    </Button>
                                </>
                            )}
                            {form.status === 'Published' && (
                                <>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        icon={Archive}
                                        loading={saving}
                                        onClick={() => submit('Archived')}
                                    >
                                        Archive
                                    </Button>
                                    <Button
                                        variant="gold"
                                        size="sm"
                                        icon={CheckCircle}
                                        loading={saving}
                                        onClick={() => submit('Published')}
                                    >
                                        Update Story
                                    </Button>
                                </>
                            )}
                            {form.status === 'Archived' && (
                                <Button
                                    variant="gold"
                                    size="sm"
                                    icon={FloppyDisk}
                                    loading={saving}
                                    onClick={() => submit('Draft')}
                                >
                                    Restore to Draft
                                </Button>
                            )}
                        </>
                    )}
                </div>
            </div>

            {/* Main Editorial Workspace (Notion-Style Canvas + Sticky Luxury Inspector) */}
            <div className={cn(
                "flex flex-col lg:flex-row items-start gap-8 transition-all duration-300",
                zenMode ? "justify-center" : ""
            )}>
                {/* Center / Left: Notion-Style Editorial Paper Canvas */}
                {/*
                  Closing the inspector actually widens the canvas.

                  Both states used to be `max-w-4xl`, so Zen Focus hid the panel
                  and then re-centred the same narrow column — the writing area
                  never changed, which is why toggling it felt like it did
                  nothing. Open, the canvas is the published article's measure;
                  closed, it stretches past it for composing wide layouts.
                */}
                <div className={cn(
                    "min-w-0 w-full transition-[max-width,margin] duration-300 ease-out",
                    zenMode ? "max-w-6xl mx-auto" : "flex-1 max-w-4xl"
                )}>
                    <div className="rounded-xl border border-edge-subtle bg-white shadow-[0_4px_35px_rgba(0,0,0,0.03)] overflow-hidden transition-all duration-200">
                        {/* 1. Cover Photo Banner (Notion-style Hero Canvas) */}
                        {form.coverUrl ? (
                            <div className="group relative aspect-[21/9] sm:aspect-[24/9] w-full overflow-hidden bg-ground-sunk border-b border-edge-subtle">
                                <Image
                                    src={form.coverUrl}
                                    alt="Story Cover"
                                    fill
                                    priority
                                    sizes="(max-width: 1280px) 100vw, 900px"
                                    className="object-cover transition-transform duration-500 group-hover:scale-[1.02]"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/10 to-transparent" />

                                {/* Floating Cover Action Controls on Hover */}
                                <div className="absolute bottom-3 right-4 flex items-center gap-2 opacity-95 sm:opacity-0 group-hover:opacity-100 transition-opacity duration-200 backdrop-blur-md bg-ink/75 p-1.5 rounded-xl border border-white/20">
                                    <button
                                        type="button"
                                        onClick={() => setCoverPicker(true)}
                                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium text-white hover:bg-white/20 transition-colors cursor-pointer"
                                    >
                                        <ImageSquare size={14} />
                                        Change Cover
                                    </button>
                                    <span className="h-3 w-px bg-white/30" />
                                    <button
                                        type="button"
                                        onClick={() => set({ coverImage: null, coverUrl: '' })}
                                        className="inline-flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs font-medium text-rose-300 hover:text-rose-200 hover:bg-rose-500/20 transition-colors cursor-pointer"
                                        title="Remove cover"
                                    >
                                        <Trash size={14} />
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="px-6 sm:px-14 pt-8">
                                <button
                                    type="button"
                                    onClick={() => setCoverPicker(true)}
                                    className="group inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold text-ink-muted hover:text-accent-ink hover:bg-accent-hover border border-dashed border-edge-strong hover:border-accent/50 transition-all cursor-pointer"
                                >
                                    <ImageSquare size={16} className="text-ink-muted group-hover:text-accent-ink" />
                                    <span>+ Add Story Cover Banner</span>
                                </button>
                            </div>
                        )}

                        {/* 2. Document Paper Content Sheet */}
                        <div className="px-6 sm:px-14 py-8 sm:py-12 space-y-6">
                            {/* Metadata Badges Strip */}
                            <div className="flex items-center gap-2 flex-wrap text-xs text-ink-muted">
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-ground-sunk text-ink-secondary font-semibold text-[11px] border border-edge-subtle">
                                    <Tag size={12} className="text-accent-ink" />
                                    {form.category}
                                </span>

                                {form.mood && (
                                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-ground-sunk text-ink-secondary font-medium text-[11px] border border-edge-subtle">
                                        <span>{WEDDING_MOODS.find((m) => m.value === form.mood)?.emoji || '✨'}</span>
                                        <span className="capitalize">{form.mood}</span>
                                    </span>
                                )}

                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-ground text-ink-muted font-mono text-[11px]">
                                    <Sparkle size={12} className="text-ink-muted" />
                                    {TEMPLATES.find((t) => t.id === form.template)?.name || 'Editorial'}
                                </span>

                                {wordCount > 0 && (
                                    <span className="inline-flex items-center gap-1 px-2.5 py-1 text-ink-muted text-[11px] font-mono">
                                        <Clock size={12} />
                                        {readingTime} min read · {wordCount} words
                                    </span>
                                )}
                            </div>

                            {/* Borderless Large Serif Title */}
                            <div>
                                <textarea
                                    rows={1}
                                    value={form.title}
                                    onChange={(e) => {
                                        onTitle(e.target.value);
                                        e.target.style.height = 'auto';
                                        e.target.style.height = `${e.target.scrollHeight}px`;
                                    }}
                                    placeholder="Story Headline..."
                                    className="w-full resize-none overflow-hidden font-sans text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-ink placeholder:text-stone-300 border-none outline-none focus:outline-none focus:ring-0 bg-transparent p-0 leading-tight"
                                />
                            </div>

                            {/* Borderless Excerpt / Teaser Subtitle */}
                            <div>
                                <textarea
                                    rows={2}
                                    value={form.excerpt}
                                    onChange={(e) => {
                                        set({ excerpt: e.target.value });
                                        e.target.style.height = 'auto';
                                        e.target.style.height = `${e.target.scrollHeight}px`;
                                    }}
                                    placeholder="Add an emotional subtitle or story teaser that hooks the reader..."
                                    className="w-full resize-none overflow-hidden font-sans italic text-base sm:text-lg text-ink-muted placeholder:text-stone-300 border-none outline-none focus:outline-none focus:ring-0 bg-transparent p-0 leading-relaxed"
                                />
                            </div>

                            {/* Subtle Editorial Divider */}
                            <div className="h-px bg-ground-sunk my-2" />

                            {/* Tiptap Continuous Document Editor */}
                            <div className="-mx-2 sm:-mx-6">
                                <Editor
                                    initialContent={form.contentJson || form.content}
                                    onUpdate={onEditorUpdate}
                                    onTocChange={setToc}
                                    postMetadata={{
                                        venue: form.venue,
                                        season: form.season,
                                        budget: form.budget,
                                        style: form.style,
                                        mood: form.mood,
                                    }}
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right: Unified 4-Tab Luxury Inspector */}
                {!zenMode && (
                    <aside className="w-full lg:w-[380px] xl:w-[410px] shrink-0 sticky top-20 self-start max-h-[calc(100vh-6rem)] overflow-y-auto rounded-xl border border-edge-subtle bg-white p-4 shadow-sm space-y-4 font-sans animate-in fade-in slide-in-from-right-6 duration-300 ease-out">
                        {/* 4-Tab Navigation Header */}
                        <div className="grid grid-cols-4 gap-1 p-1 bg-ground-sunk/90 rounded-xl border border-edge-subtle">
                            <button
                                type="button"
                                onClick={() => setInspectorTab('story')}
                                className={cn(
                                    'flex flex-col items-center justify-center py-2 px-1 rounded-xl text-xs font-semibold transition-all cursor-pointer gap-0.5',
                                    inspectorTab === 'story'
                                        ? 'bg-white text-ink shadow-sm'
                                        : 'text-ink-muted hover:text-ink hover:bg-white/50'
                                )}
                            >
                                <Globe size={15} className={inspectorTab === 'story' ? 'text-accent-ink' : ''} />
                                <span className="text-[10px]">Story</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => setInspectorTab('seo')}
                                className={cn(
                                    'flex flex-col items-center justify-center py-2 px-1 rounded-xl text-xs font-semibold transition-all cursor-pointer gap-0.5',
                                    inspectorTab === 'seo'
                                        ? 'bg-white text-ink shadow-sm'
                                        : 'text-ink-muted hover:text-ink hover:bg-white/50'
                                )}
                            >
                                <Sparkle size={15} className={inspectorTab === 'seo' ? 'text-accent-ink' : ''} />
                                <span className="text-[10px]">SEO</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => setInspectorTab('details')}
                                className={cn(
                                    'flex flex-col items-center justify-center py-2 px-1 rounded-xl text-xs font-semibold transition-all cursor-pointer gap-0.5',
                                    inspectorTab === 'details'
                                        ? 'bg-white text-ink shadow-sm'
                                        : 'text-ink-muted hover:text-ink hover:bg-white/50'
                                )}
                            >
                                <Heart size={15} className={inspectorTab === 'details' ? 'text-accent-ink' : ''} />
                                <span className="text-[10px]">Details</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => setInspectorTab('manage')}
                                className={cn(
                                    'flex flex-col items-center justify-center py-2 px-1 rounded-xl text-xs font-semibold transition-all cursor-pointer gap-0.5',
                                    inspectorTab === 'manage'
                                        ? 'bg-white text-ink shadow-sm'
                                        : 'text-ink-muted hover:text-ink hover:bg-white/50'
                                )}
                            >
                                <SlidersHorizontal size={15} className={inspectorTab === 'manage' ? 'text-accent-ink' : ''} />
                                <span className="text-[10px]">Manage</span>
                            </button>
                        </div>

                        {/* Tab Content: Story */}
                        {inspectorTab === 'story' && (
                            <div className="space-y-4">
                                {/* Workflow Status & Publishing */}
                                <div className="rounded-xl border border-edge-subtle bg-ground/50 p-3.5 space-y-3">
                                    <div className="flex items-center justify-between">
                                        <label className="text-[11px] font-bold uppercase tracking-wider text-ink-secondary block">Workflow Status</label>
                                        <Badge variant={form.status === 'Published' ? 'success' : form.status === 'Draft' ? 'warning' : 'neutral'} size="sm">
                                            {form.status}
                                        </Badge>
                                    </div>
                                    <select
                                        value={form.status}
                                        onChange={(e) => set({ status: e.target.value })}
                                        className="w-full rounded-xl border border-edge-subtle bg-white p-2 text-xs text-ink font-medium focus:border-accent focus:ring-1 focus:ring-accent/30 focus:outline-none"
                                    >
                                        <option value="Draft">Draft (Private)</option>
                                        <option value="InReview">In Review (Editorial Check)</option>
                                        <option value="Scheduled">Scheduled (Auto-Publish)</option>
                                        <option value="Published">Published (Live to public)</option>
                                        <option value="Archived">Archived (Unlisted)</option>
                                    </select>

                                    {form.status === 'Scheduled' && (
                                        <div>
                                            <label className="mb-1 block text-[11px] font-semibold text-ink-secondary flex items-center gap-1">
                                                <CalendarBlank size={13} className="text-accent-ink" />
                                                Scheduled Date &amp; Time
                                            </label>
                                            <input
                                                type="datetime-local"
                                                value={form.scheduledFor}
                                                onChange={(e) => set({ scheduledFor: e.target.value })}
                                                className="w-full rounded-xl border border-edge-subtle bg-white p-2 text-xs text-ink focus:border-accent focus:outline-none"
                                            />
                                        </div>
                                    )}

                                    <div>
                                        <label className="mb-1 block text-[11px] font-semibold text-ink-secondary">URL Slug</label>
                                        <input
                                            type="text"
                                            value={form.slug}
                                            onChange={(e) => {
                                                setSlugEdited(true);
                                                set({ slug: localSlugify(e.target.value) });
                                            }}
                                            placeholder="auto-generated-from-title"
                                            className="w-full rounded-xl border border-edge-subtle bg-white p-2 text-xs text-ink font-mono focus:border-accent focus:outline-none"
                                        />
                                        <p className="mt-1 text-[10px] text-ink-muted font-mono truncate">
                                            /blogs/{form.slug || 'untitled-story'}
                                        </p>
                                    </div>
                                </div>

                                {/* Story Template Selector */}
                                <div className="rounded-xl border border-edge-subtle bg-ground/50 p-3.5 space-y-2.5">
                                    <div className="flex items-center justify-between">
                                        <h3 className="text-xs font-bold uppercase tracking-wider text-ink flex items-center gap-1.5">
                                            <Sparkle size={15} className="text-accent-ink" />
                                            Story Template
                                        </h3>
                                        <span className="text-[10px] text-ink-muted font-mono">
                                            {TEMPLATES.find((t) => t.id === form.template)?.badge || ''}
                                        </span>
                                    </div>

                                    <div className="grid grid-cols-1 gap-2">
                                        {TEMPLATES.map((tmpl) => {
                                            const isSelected = form.template === tmpl.id;
                                            return (
                                                <button
                                                    key={tmpl.id}
                                                    type="button"
                                                    onClick={() => set({ template: tmpl.id })}
                                                    className={cn(
                                                        'rounded-xl border p-2.5 text-left transition-all cursor-pointer flex flex-col gap-1',
                                                        isSelected
                                                            ? 'border-accent bg-white ring-1 ring-accent/30 shadow-sm'
                                                            : 'border-edge-subtle bg-white/60 hover:bg-white text-ink-secondary'
                                                    )}
                                                >
                                                    <div className="flex items-center justify-between">
                                                        <span className={cn('text-xs font-bold', isSelected ? 'text-accent-ink' : 'text-ink')}>
                                                            {tmpl.name}
                                                        </span>
                                                        {isSelected && (
                                                            <Check size={14} weight="bold" className="text-accent-ink" />
                                                        )}
                                                    </div>
                                                    <p className="text-[10px] text-ink-muted leading-tight">
                                                        {tmpl.desc}
                                                    </p>
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>

                                {/* Taxonomy & Topic Tags */}
                                <div className="rounded-xl border border-edge-subtle bg-ground/50 p-3.5 space-y-2.5">
                                    <h3 className="text-xs font-bold uppercase tracking-wider text-ink flex items-center gap-1.5">
                                        <Tag size={15} className="text-accent-ink" />
                                        Taxonomy &amp; Tags
                                    </h3>

                                    <div>
                                        <label className="mb-1 block text-[11px] font-semibold text-ink-secondary">Category</label>
                                        <select
                                            value={form.category}
                                            onChange={(e) => set({ category: e.target.value })}
                                            className="w-full rounded-xl border border-edge-subtle bg-white p-2 text-xs text-ink font-medium focus:border-accent focus:outline-none"
                                        >
                                            {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                                        </select>
                                    </div>

                                    <div>
                                        <label className="mb-1 block text-[11px] font-semibold text-ink-secondary">Topic Tags</label>
                                        <div className="flex gap-1.5">
                                            <input
                                                type="text"
                                                value={tagInput}
                                                onChange={(e) => setTagInput(e.target.value)}
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter' || e.key === ',') {
                                                        e.preventDefault();
                                                        addToList('tags', tagInput, setTagInput);
                                                    }
                                                }}
                                                placeholder="Add tag and press Enter"
                                                className="flex-1 rounded-xl border border-edge-subtle bg-white p-2 text-xs text-ink focus:border-accent focus:outline-none"
                                            />
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => addToList('tags', tagInput, setTagInput)}
                                                disabled={!tagInput.trim()}
                                                icon={Plus}
                                            />
                                        </div>

                                        <div className="mt-2 flex flex-wrap gap-1.5">
                                            {form.tags.length === 0 ? (
                                                <p className="text-[11px] text-ink-muted italic">No tags added yet</p>
                                            ) : (
                                                form.tags.map((t) => (
                                                    <span
                                                        key={t}
                                                        className="inline-flex items-center gap-1 rounded-lg bg-white px-2 py-0.5 text-xs text-ink-secondary border border-edge-subtle shadow-sm"
                                                    >
                                                        <span>#{t}</span>
                                                        <button
                                                            type="button"
                                                            onClick={() => set({ tags: form.tags.filter((x) => x !== t) })}
                                                            className="text-ink-muted hover:text-rose-600 cursor-pointer"
                                                        >
                                                            <X size={12} />
                                                        </button>
                                                    </span>
                                                ))
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Reader Comments Toggle */}
                                <div className="rounded-xl border border-edge-subtle bg-ground/50 p-3 flex items-center justify-between">
                                    <label htmlFor="inspector-allow-comments" className="text-xs font-semibold text-ink-secondary flex items-center gap-1.5 cursor-pointer">
                                        <ChatCircle size={15} className="text-accent-ink" />
                                        Allow Reader Comments
                                    </label>
                                    <input
                                        id="inspector-allow-comments"
                                        type="checkbox"
                                        checked={form.allowComments}
                                        onChange={(e) => set({ allowComments: e.target.checked })}
                                        className="rounded-lg border-edge-strong text-accent-ink focus:ring-accent h-4 w-4 cursor-pointer"
                                    />
                                </div>
                            </div>
                        )}

                        {/* Tab Content: SEO */}
                        {inspectorTab === 'seo' && (
                            <div className="space-y-4">
                                {/* In-Editor SEO & Readability Auditor */}
                                <SeoAuditor
                                    form={form}
                                    onScoreChange={handleScoreChange}
                                />

                                {/* Focus Keyword */}
                                <div className="rounded-xl border border-edge-subtle bg-ground/50 p-3.5 space-y-2">
                                    <label className="text-[11px] font-bold uppercase tracking-wider text-ink-secondary block">Focus Keyword (SEO Target)</label>
                                    <input
                                        type="text"
                                        value={form.focusKeyword}
                                        onChange={(e) => set({ focusKeyword: e.target.value })}
                                        placeholder="e.g. Udaipur Destination Wedding Videographer"
                                        className="w-full rounded-xl border border-edge-subtle bg-white p-2 text-xs text-ink focus:border-accent focus:ring-1 focus:ring-accent/30 focus:outline-none"
                                    />
                                </div>

                                {/* Search Engine Snippet Metadata */}
                                <div className="rounded-xl border border-edge-subtle bg-ground/50 p-3.5 space-y-3">
                                    <div className="flex items-center justify-between">
                                        <label className="text-[11px] font-bold uppercase tracking-wider text-ink-secondary block">Search Engine Snippet</label>
                                        <button
                                            type="button"
                                            onClick={() => setAiCopilotOpen(true)}
                                            className="inline-flex items-center gap-1 rounded-lg bg-accent/10 hover:bg-accent-hover px-2 py-0.5 text-[10px] font-semibold text-accent-ink transition-colors cursor-pointer"
                                        >
                                            <Sparkle size={12} weight="fill" />
                                            AI Assist
                                        </button>
                                    </div>

                                    <div>
                                        <div className="flex items-center justify-between mb-1">
                                            <span className="text-[11px] font-semibold text-ink-secondary">Custom Meta Title</span>
                                            <span className={cn('text-[10px] font-mono font-medium', counterColor(metaTitleLen, 30, 60))}>
                                                {metaTitleLen} / 60
                                            </span>
                                        </div>
                                        <input
                                            type="text"
                                            value={form.metaTitle}
                                            onChange={(e) => set({ metaTitle: e.target.value })}
                                            placeholder={form.title || 'Defaults to story title'}
                                            className="w-full rounded-xl border border-edge-subtle bg-white p-2 text-xs text-ink focus:border-accent focus:outline-none"
                                        />
                                    </div>

                                    <div>
                                        <div className="flex items-center justify-between mb-1">
                                            <span className="text-[11px] font-semibold text-ink-secondary">Meta Description / Snippet</span>
                                            <span className={cn('text-[10px] font-mono font-medium', counterColor(metaDescLen, 140, 160))}>
                                                {metaDescLen} / 160
                                            </span>
                                        </div>
                                        <textarea
                                            rows={3}
                                            value={form.metaDescription}
                                            onChange={(e) => set({ metaDescription: e.target.value })}
                                            placeholder="Brief 1-2 sentence teaser for Google search results..."
                                            className="w-full rounded-xl border border-edge-subtle bg-white p-2 text-xs text-ink focus:border-accent focus:outline-none resize-none"
                                        />
                                    </div>

                                    <div>
                                        <span className="text-[11px] font-semibold text-ink-secondary block mb-1">Canonical URL (Optional)</span>
                                        <input
                                            type="url"
                                            value={form.canonicalUrl}
                                            onChange={(e) => set({ canonicalUrl: e.target.value })}
                                            placeholder="https://theweddingvachan.com/blogs/..."
                                            className="w-full rounded-xl border border-edge-subtle bg-white p-2 text-xs text-ink focus:border-accent focus:outline-none"
                                        />
                                    </div>

                                    <div>
                                        <label className="mb-1 block text-[11px] font-semibold text-ink-secondary">Secondary Keywords</label>
                                        <div className="flex gap-1.5">
                                            <input
                                                type="text"
                                                value={keywordInput}
                                                onChange={(e) => setKeywordInput(e.target.value)}
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter' || e.key === ',') {
                                                        e.preventDefault();
                                                        addToList('keywords', keywordInput, setKeywordInput);
                                                    }
                                                }}
                                                placeholder="Add keyword and press Enter"
                                                className="flex-1 rounded-xl border border-edge-subtle bg-white p-2 text-xs text-ink focus:border-accent focus:outline-none"
                                            />
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => addToList('keywords', keywordInput, setKeywordInput)}
                                                disabled={!keywordInput.trim()}
                                                icon={Plus}
                                            />
                                        </div>
                                        <div className="mt-2 flex flex-wrap gap-1.5">
                                            {form.keywords.map((k) => (
                                                <span
                                                    key={k}
                                                    className="inline-flex items-center gap-1 rounded-lg bg-white px-2 py-0.5 text-xs text-ink-secondary border border-edge-subtle shadow-sm"
                                                >
                                                    <span>{k}</span>
                                                    <button
                                                        type="button"
                                                        onClick={() => set({ keywords: form.keywords.filter((x) => x !== k) })}
                                                        className="text-ink-muted hover:text-rose-600 cursor-pointer"
                                                    >
                                                        <X size={12} />
                                                    </button>
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Tab Content: Details */}
                        {inspectorTab === 'details' && (
                            <div className="space-y-4">
                                {/* Wedding Story Structured Details */}
                                <div className="rounded-xl border border-edge-subtle bg-ground/50 p-3.5 space-y-3">
                                    <label className="text-[11px] font-bold uppercase tracking-wider text-ink-secondary block">Wedding Story Details</label>

                                    {/* Mood */}
                                    <div>
                                        <span className="text-[11px] font-semibold text-ink-secondary block mb-1.5">Wedding Mood</span>
                                        <div className="grid grid-cols-2 gap-1.5">
                                            {WEDDING_MOODS.map((m) => {
                                                const isSel = form.mood === m.value;
                                                return (
                                                    <button
                                                        key={m.value}
                                                        type="button"
                                                        onClick={() => set({ mood: isSel ? '' : m.value })}
                                                        className={cn(
                                                            'rounded-xl border px-2 py-1.5 text-left text-xs font-medium transition-all flex items-center gap-1.5 cursor-pointer',
                                                            isSel
                                                                ? 'border-accent bg-accent/10 text-accent-ink font-bold shadow-sm'
                                                                : 'border-edge-subtle bg-white text-ink-secondary hover:bg-ground'
                                                        )}
                                                    >
                                                        <span>{m.emoji}</span>
                                                        <span>{m.label}</span>
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>

                                    {/* Season & Budget */}
                                    <div className="grid grid-cols-2 gap-2 pt-1">
                                        <div>
                                            <span className="text-[11px] font-semibold text-ink-secondary block mb-1">Season</span>
                                            <select
                                                value={form.season}
                                                onChange={(e) => set({ season: e.target.value })}
                                                className="w-full rounded-xl border border-edge-subtle bg-white p-2 text-xs text-ink focus:border-accent focus:outline-none"
                                            >
                                                <option value="">Select Season</option>
                                                {SEASONS.map((s) => <option key={s} value={s.toLowerCase()}>{s}</option>)}
                                            </select>
                                        </div>
                                        <div>
                                            <span className="text-[11px] font-semibold text-ink-secondary block mb-1">Budget</span>
                                            <select
                                                value={form.budget}
                                                onChange={(e) => set({ budget: e.target.value })}
                                                className="w-full rounded-xl border border-edge-subtle bg-white p-2 text-xs text-ink focus:border-accent focus:outline-none"
                                            >
                                                <option value="">Select Budget</option>
                                                {BUDGET_RANGES.map((b) => <option key={b} value={b}>{b}</option>)}
                                            </select>
                                        </div>
                                    </div>

                                    {/* Venue & Destination */}
                                    <div className="grid grid-cols-2 gap-2">
                                        <div>
                                            <span className="text-[11px] font-semibold text-ink-secondary block mb-1">Venue</span>
                                            <input
                                                type="text"
                                                value={form.weddingDetails?.venue || form.venue}
                                                onChange={(e) => {
                                                    const v = e.target.value;
                                                    set({
                                                        venue: v,
                                                        weddingDetails: { ...form.weddingDetails, venue: v }
                                                    });
                                                }}
                                                placeholder="e.g. The Leela Palace & Jag Mandir"
                                                className="w-full rounded-xl border border-edge-subtle bg-white p-2 text-xs text-ink focus:border-accent focus:outline-none"
                                            />
                                        </div>
                                        <div>
                                            <span className="text-[11px] font-semibold text-ink-secondary block mb-1">Destination / City</span>
                                            <input
                                                type="text"
                                                value={form.weddingDetails?.destination || ''}
                                                onChange={(e) => set({
                                                    weddingDetails: { ...form.weddingDetails, destination: e.target.value }
                                                })}
                                                placeholder="e.g. Udaipur, Rajasthan"
                                                className="w-full rounded-xl border border-edge-subtle bg-white p-2 text-xs text-ink focus:border-accent focus:outline-none"
                                            />
                                        </div>
                                    </div>

                                    {/* Cinema Crew & Subtitle */}
                                    <div className="grid grid-cols-2 gap-2">
                                        <div>
                                            <span className="text-[11px] font-semibold text-ink-secondary block mb-1">Cinema Crew</span>
                                            <input
                                                type="text"
                                                value={form.weddingDetails?.cinemaCrew || ''}
                                                onChange={(e) => set({
                                                    weddingDetails: { ...form.weddingDetails, cinemaCrew: e.target.value }
                                                })}
                                                placeholder="e.g. 6-Camera Team + 4K Drone"
                                                className="w-full rounded-xl border border-edge-subtle bg-white p-2 text-xs text-ink focus:border-accent focus:outline-none"
                                            />
                                        </div>
                                        <div>
                                            <span className="text-[11px] font-semibold text-ink-secondary block mb-1">Subtitle / Festivities</span>
                                            <input
                                                type="text"
                                                value={form.weddingDetails?.subtitle || ''}
                                                onChange={(e) => set({
                                                    weddingDetails: { ...form.weddingDetails, subtitle: e.target.value }
                                                })}
                                                placeholder="e.g. 3 Days of Festivities"
                                                className="w-full rounded-xl border border-edge-subtle bg-white p-2 text-xs text-ink focus:border-accent focus:outline-none"
                                            />
                                        </div>
                                    </div>

                                    {/* Romantic Flourish Calligraphy */}
                                    <div>
                                        <span className="text-[11px] font-semibold text-ink-secondary block mb-1">Romantic Flourish (Cursive Headline)</span>
                                        <input
                                            type="text"
                                            value={form.weddingDetails?.flourishQuote || ''}
                                            onChange={(e) => set({
                                                weddingDetails: { ...form.weddingDetails, flourishQuote: e.target.value }
                                            })}
                                            placeholder="e.g. Some love stories look like history —"
                                            className="w-full rounded-xl border border-edge-subtle bg-white p-2 text-xs text-ink focus:border-accent focus:outline-none"
                                        />
                                    </div>

                                    {/* 4K Video Trailer Embed */}
                                    <div className="rounded-xl border border-edge-subtle bg-ground/70 p-2.5 space-y-2">
                                        <span className="text-[11px] font-bold text-accent-ink block uppercase tracking-wider">4K Wedding Trailer Film</span>
                                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                                            <div className="sm:col-span-2">
                                                <span className="text-[10px] font-semibold text-ink-muted block mb-0.5">Video URL (YouTube / Vimeo / Cloudflare)</span>
                                                <input
                                                    type="text"
                                                    value={form.featuredVideo?.url || ''}
                                                    onChange={(e) => set({
                                                        featuredVideo: { ...form.featuredVideo, url: e.target.value }
                                                    })}
                                                    placeholder="https://www.youtube.com/watch?v=..."
                                                    className="w-full rounded-lg border border-edge-subtle bg-white p-1.5 text-xs text-ink focus:border-accent focus:outline-none"
                                                />
                                            </div>
                                            <div>
                                                <span className="text-[10px] font-semibold text-ink-muted block mb-0.5">Duration</span>
                                                <input
                                                    type="text"
                                                    value={form.featuredVideo?.duration || ''}
                                                    onChange={(e) => set({
                                                        featuredVideo: { ...form.featuredVideo, duration: e.target.value }
                                                    })}
                                                    placeholder="e.g. 3:45 min"
                                                    className="w-full rounded-lg border border-edge-subtle bg-white p-1.5 text-xs text-ink focus:border-accent focus:outline-none"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Couple Testimonial & Byline */}
                                    <div className="space-y-2">
                                        <div>
                                            <span className="text-[11px] font-semibold text-ink-secondary block mb-1">Couple Testimonial Quote</span>
                                            <textarea
                                                rows={2}
                                                value={form.testimonial}
                                                onChange={(e) => set({ testimonial: e.target.value })}
                                                placeholder="What the couple said about their cinematic film experience..."
                                                className="w-full rounded-xl border border-edge-subtle bg-white p-2 text-xs text-ink focus:border-accent focus:outline-none resize-none"
                                            />
                                        </div>
                                        <div>
                                            <span className="text-[11px] font-semibold text-ink-secondary block mb-1">Testimonial Byline / Couple Names</span>
                                            <input
                                                type="text"
                                                value={form.testimonialAuthor || ''}
                                                onChange={(e) => set({ testimonialAuthor: e.target.value })}
                                                placeholder="e.g. — Ananya & Kabir, Udaipur Bride & Groom"
                                                className="w-full rounded-xl border border-edge-subtle bg-white p-2 text-xs text-ink focus:border-accent focus:outline-none"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Vendor Credits Section */}
                                <div className="rounded-xl border border-edge-subtle bg-ground/50 p-3.5 space-y-2.5">
                                    <div className="flex items-center justify-between">
                                        <h3 className="text-xs font-bold uppercase tracking-wider text-ink flex items-center gap-1.5">
                                            <Trophy size={15} className="text-accent-ink" />
                                            Vendor Credits ({form.vendorCredits.length})
                                        </h3>
                                        <button
                                            type="button"
                                            onClick={addVendorCredit}
                                            className="inline-flex items-center gap-1 rounded-lg border border-accent/30 bg-accent/5 px-2 py-0.5 text-xs font-medium text-accent-ink hover:bg-accent-hover cursor-pointer"
                                        >
                                            <Plus size={12} weight="bold" />
                                            Add
                                        </button>
                                    </div>

                                    {form.vendorCredits.length === 0 ? (
                                        <p className="text-xs text-ink-muted italic">No partners added yet.</p>
                                    ) : (
                                        <div className="space-y-2.5">
                                            {form.vendorCredits.map((vc, idx) => (
                                                <div key={idx} className="rounded-xl border border-edge-subtle bg-white p-2.5 space-y-2">
                                                    <div className="flex items-center justify-between">
                                                        <span className="text-[10px] font-bold uppercase tracking-wider text-ink-muted">Partner #{idx + 1}</span>
                                                        <button type="button" onClick={() => removeVendorCredit(idx)} className="text-ink-muted hover:text-rose-600">
                                                            <Trash size={13} />
                                                        </button>
                                                    </div>
                                                    <div className="grid grid-cols-2 gap-1.5">
                                                        <input
                                                            type="text"
                                                            value={vc.role}
                                                            onChange={(e) => updateVendorCredit(idx, 'role', e.target.value)}
                                                            placeholder="Role (e.g. Venue)"
                                                            className="rounded-lg border border-edge-subtle px-2 py-1 text-xs text-ink"
                                                        />
                                                        <input
                                                            type="text"
                                                            value={vc.name}
                                                            onChange={(e) => updateVendorCredit(idx, 'name', e.target.value)}
                                                            placeholder="Name"
                                                            className="rounded-lg border border-edge-subtle px-2 py-1 text-xs text-ink font-semibold"
                                                        />
                                                    </div>
                                                    <div className="grid grid-cols-2 gap-1.5">
                                                        <input
                                                            type="url"
                                                            value={vc.url}
                                                            onChange={(e) => updateVendorCredit(idx, 'url', e.target.value)}
                                                            placeholder="Website URL"
                                                            className="rounded-lg border border-edge-subtle px-2 py-1 text-xs text-ink"
                                                        />
                                                        <input
                                                            type="text"
                                                            value={vc.instagram}
                                                            onChange={(e) => updateVendorCredit(idx, 'instagram', e.target.value)}
                                                            placeholder="@handle"
                                                            className="rounded-lg border border-edge-subtle px-2 py-1 text-xs text-ink"
                                                        />
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* FAQ Builder */}
                                <div className="rounded-xl border border-edge-subtle bg-ground/50 p-3.5 space-y-2.5">
                                    <div className="flex items-center justify-between">
                                        <h3 className="text-xs font-bold uppercase tracking-wider text-ink flex items-center gap-1.5">
                                            <Question size={15} className="text-accent-ink" />
                                            Story FAQs ({form.faq.length})
                                        </h3>
                                        <button
                                            type="button"
                                            onClick={addFaqItem}
                                            className="inline-flex items-center gap-1 rounded-lg border border-accent/30 bg-accent/5 px-2 py-0.5 text-xs font-medium text-accent-ink hover:bg-accent-hover cursor-pointer"
                                        >
                                            <Plus size={12} weight="bold" />
                                            Add
                                        </button>
                                    </div>
                                    {form.faq.length === 0 ? (
                                        <p className="text-xs text-ink-muted italic">No FAQ items defined.</p>
                                    ) : (
                                        <div className="space-y-2">
                                            {form.faq.map((item, idx) => (
                                                <div key={idx} className="rounded-xl border border-edge-subtle bg-white p-2.5 space-y-1.5">
                                                    <div className="flex items-center justify-between">
                                                        <span className="text-[10px] font-bold uppercase tracking-wider text-ink-muted">Q#{idx + 1}</span>
                                                        <button type="button" onClick={() => removeFaqItem(idx)} className="text-ink-muted hover:text-rose-600">
                                                            <Trash size={13} />
                                                        </button>
                                                    </div>
                                                    <input
                                                        type="text"
                                                        value={item.question}
                                                        onChange={(e) => updateFaqItem(idx, 'question', e.target.value)}
                                                        placeholder="Question..."
                                                        className="w-full rounded-lg border border-edge-subtle px-2 py-1 text-xs font-semibold text-ink"
                                                    />
                                                    <textarea
                                                        rows={2}
                                                        value={item.answer}
                                                        onChange={(e) => updateFaqItem(idx, 'answer', e.target.value)}
                                                        placeholder="Answer..."
                                                        className="w-full rounded-lg border border-edge-subtle px-2 py-1 text-xs text-ink resize-none"
                                                    />
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* How-To Steps */}
                                <div className="rounded-xl border border-edge-subtle bg-ground/50 p-3.5 space-y-2.5">
                                    <div className="flex items-center justify-between">
                                        <h3 className="text-xs font-bold uppercase tracking-wider text-ink flex items-center gap-1.5">
                                            <ListNumbers size={15} className="text-accent-ink" />
                                            How-To Steps ({(form.howToSteps || []).length})
                                        </h3>
                                        <button
                                            type="button"
                                            onClick={addHowToStep}
                                            className="inline-flex items-center gap-1 rounded-lg border border-accent/30 bg-accent/5 px-2 py-0.5 text-xs font-medium text-accent-ink hover:bg-accent-hover cursor-pointer"
                                        >
                                            <Plus size={12} weight="bold" />
                                            Add
                                        </button>
                                    </div>
                                    {(form.howToSteps || []).length === 0 ? (
                                        <p className="text-xs text-ink-muted italic">No structured steps added.</p>
                                    ) : (
                                        <div className="space-y-2">
                                            {(form.howToSteps || []).map((step, idx) => (
                                                <div key={idx} className="rounded-xl border border-edge-subtle bg-white p-2.5 space-y-1.5">
                                                    <div className="flex items-center justify-between">
                                                        <span className="text-[10px] font-bold uppercase tracking-wider text-ink-muted">Step #{idx + 1}</span>
                                                        <button type="button" onClick={() => removeHowToStep(idx)} className="text-ink-muted hover:text-rose-600">
                                                            <Trash size={13} />
                                                        </button>
                                                    </div>
                                                    <input
                                                        type="text"
                                                        value={step.name}
                                                        onChange={(e) => updateHowToStep(idx, 'name', e.target.value)}
                                                        placeholder="Step title..."
                                                        className="w-full rounded-lg border border-edge-subtle px-2 py-1 text-xs font-semibold text-ink"
                                                    />
                                                    <textarea
                                                        rows={2}
                                                        value={step.text}
                                                        onChange={(e) => updateHowToStep(idx, 'text', e.target.value)}
                                                        placeholder="Step instructions..."
                                                        className="w-full rounded-lg border border-edge-subtle px-2 py-1 text-xs text-ink resize-none"
                                                    />
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Tab Content: Manage */}
                        {inspectorTab === 'manage' && (
                            <div className="space-y-4">
                                {/* AI Co-Pilot Card */}
                                <div className="rounded-xl border border-accent/30 bg-gradient-to-br from-accent/5 to-transparent p-4 space-y-2.5">
                                    <div className="flex items-center gap-2 text-accent-ink font-bold text-xs">
                                        <Sparkle size={16} weight="fill" />
                                        <span>AI Editorial Co-Pilot</span>
                                    </div>
                                    <p className="text-xs text-ink-secondary">
                                        Generate SERP meta descriptions, emotional story teasers, keyword expansion, and venue FAQs in seconds.
                                    </p>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        icon={Sparkle}
                                        onClick={() => setAiCopilotOpen(true)}
                                        className="w-full border-accent/40 text-accent-ink hover:bg-accent-hover font-bold text-xs"
                                    >
                                        Launch AI Assistant
                                    </Button>
                                </div>

                                {/* Live Outline / TOC */}
                                <div className="rounded-xl border border-edge-subtle bg-ground/50 p-3.5 space-y-2">
                                    <div className="flex items-center justify-between">
                                        <h3 className="text-xs font-bold uppercase tracking-wider text-ink flex items-center gap-1.5">
                                            <TreeStructure size={15} className="text-accent-ink" />
                                            Document Outline
                                        </h3>
                                        <span className="text-[10px] text-ink-muted font-mono">{toc.length} sections</span>
                                    </div>
                                    {toc.length === 0 ? (
                                        <p className="text-xs text-ink-muted italic">Add H2–H4 headings in editor to populate outline.</p>
                                    ) : (
                                        <ul className="space-y-1.5 text-xs text-ink-secondary font-medium max-h-48 overflow-y-auto pr-1">
                                            {toc.map((h, i) => (
                                                <li
                                                    key={i}
                                                    className="truncate hover:text-accent-ink transition-colors"
                                                    style={{ paddingLeft: `${(h.level - 2) * 12}px` }}
                                                >
                                                    <span className="text-ink-muted mr-1.5">›</span>
                                                    {h.text || <span className="text-stone-300">Untitled section</span>}
                                                </li>
                                            ))}
                                        </ul>
                                    )}
                                </div>

                                {/* Revisions History */}
                                <div className="rounded-xl border border-edge-subtle bg-ground/50 p-3.5 space-y-2">
                                    <h3 className="text-xs font-bold uppercase tracking-wider text-ink flex items-center gap-1.5">
                                        <ArrowsClockwise size={15} className="text-accent-ink" />
                                        Snapshot History
                                    </h3>
                                    <p className="text-xs text-ink-muted">
                                        Automatic dual-save captures revisions every 5s while editing.
                                    </p>
                                    {mode === 'edit' && (
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            icon={ArrowsClockwise}
                                            onClick={handleOpenRevisions}
                                            className="w-full text-xs"
                                        >
                                            View Revisions Timeline
                                        </Button>
                                    )}
                                </div>

                                {/* Share 24-Hour Preview Link */}
                                {mode === 'edit' && postId && (
                                    <div className="rounded-xl border border-edge-subtle bg-ground/50 p-3.5 space-y-2">
                                        <h3 className="text-xs font-bold uppercase tracking-wider text-ink flex items-center gap-1.5">
                                            <LinkSimple size={15} className="text-accent-ink" />
                                            Client Preview Link
                                        </h3>
                                        <p className="text-xs text-ink-muted">
                                            Generate cryptographic 24-hour preview token for external reviewers without admin login.
                                        </p>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            icon={LinkSimple}
                                            loading={sharingPreview}
                                            onClick={handleCopyPreviewLink}
                                            className="w-full text-xs"
                                        >
                                            Copy 24h Signed Preview URL
                                        </Button>
                                    </div>
                                )}
                            </div>
                        )}
                    </aside>
                )}
            </div>

            {/* Media Picker Modal for Cover */}
            <MediaPickerModal
                open={coverPicker}
                onClose={() => setCoverPicker(false)}
                onSelect={(m) => set({ coverImage: m._id, coverUrl: m.cdnUrl || m.publicUrl || m.url })}
                ownerType="Blog"
                typeFilter="Image"
            />

            {/* Revision History Dialog (D5) */}
            <Dialog open={revisionsOpen} onOpenChange={setRevisionsOpen}>
                <DialogContent className="sm:max-w-lg font-sans">
                    <DialogHeader className="border-b border-edge-subtle pb-3">
                        <DialogTitle className="text-base font-bold text-ink flex items-center gap-2">
                            <ArrowsClockwise size={18} className="text-accent-ink" />
                            Revision History
                        </DialogTitle>
                        <p className="text-xs text-ink-muted">
                            View automated snapshots and manual saves. Restoring a version creates a safe backup of your current state.
                        </p>
                    </DialogHeader>

                    <div className="max-h-96 overflow-y-auto space-y-2 py-3 pr-1">
                        {loadingRevisions ? (
                            <div className="py-8 text-center text-xs text-ink-muted">Loading revisions...</div>
                        ) : revisions.length === 0 ? (
                            <div className="py-8 text-center text-xs text-ink-muted">No revisions recorded yet.</div>
                        ) : (
                            revisions.map((rev) => {
                                const date = new Date(rev.createdAt);
                                const isSnapshot = rev.reason === 'publish-snapshot';
                                const isAutosave = rev.reason === 'autosave';

                                return (
                                    <div
                                        key={rev._id}
                                        className="flex items-center justify-between gap-3 rounded-xl border border-edge-subtle bg-white p-3 hover:bg-ground/60 transition-colors"
                                    >
                                        <div className="min-w-0 flex-1">
                                            <div className="flex items-center gap-2">
                                                <Badge
                                                    variant={isSnapshot ? 'success' : isAutosave ? 'neutral' : 'warning'}
                                                    size="sm"
                                                >
                                                    {rev.reason}
                                                </Badge>
                                                <span className="text-xs font-semibold text-ink truncate">
                                                    {rev.title || 'Untitled'}
                                                </span>
                                            </div>
                                            <div className="mt-1 flex items-center gap-2 text-[11px] text-ink-muted">
                                                <span>
                                                    {date.toLocaleDateString('en-IN', {
                                                        month: 'short',
                                                        day: 'numeric',
                                                        hour: '2-digit',
                                                        minute: '2-digit',
                                                    })}
                                                </span>
                                                {rev.editedBy?.name && (
                                                    <>
                                                        <span>·</span>
                                                        <span>by {rev.editedBy.name}</span>
                                                    </>
                                                )}
                                                {rev.template && (
                                                    <>
                                                        <span>·</span>
                                                        <span className="capitalize">{rev.template.replace(/-/g, ' ')}</span>
                                                    </>
                                                )}
                                            </div>
                                        </div>

                                        <Button
                                            variant="outline"
                                            size="sm"
                                            loading={restoringRevId === rev._id}
                                            onClick={() => handleRestoreRevision(rev._id)}
                                            className="text-xs shrink-0"
                                        >
                                            Restore
                                        </Button>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </DialogContent>
            </Dialog>

            {/* Upgraded Live Story Preview Modal (D6) with Mobile ⇄ Desktop Viewport Switcher */}
            <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
                <DialogContent className="max-w-6xl w-[95vw] min-h-[70vh] max-h-[92vh] overflow-y-auto font-sans p-4 sm:p-6 bg-ground-sunk/90">
                    {/* Viewport & Controls Header */}
                    <div className="flex items-center justify-between border-b border-edge-subtle pb-3 mb-4 bg-white -mx-4 -mt-4 px-6 pt-4 rounded-t-xl shadow-sm">
                        <div className="flex items-center gap-3">
                            <h3 className="text-sm font-bold text-ink">
                                Production Layout Preview
                            </h3>
                            <Badge variant="neutral" size="sm" className="capitalize">
                                {form.template.replace(/-/g, ' ')}
                            </Badge>
                        </div>

                        {/* Mobile ⇄ Desktop Switcher */}
                        <div className="flex items-center gap-1 bg-ground-sunk p-1 rounded-xl border border-edge-subtle">
                            <button
                                type="button"
                                onClick={() => setPreviewViewport('desktop')}
                                className={cn(
                                    'flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer',
                                    previewViewport === 'desktop'
                                        ? 'bg-white text-ink shadow-sm font-semibold'
                                        : 'text-ink-secondary hover:text-ink'
                                )}
                            >
                                <Desktop size={14} />
                                <span>Desktop</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => setPreviewViewport('mobile')}
                                className={cn(
                                    'flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer',
                                    previewViewport === 'mobile'
                                        ? 'bg-white text-ink shadow-sm font-semibold'
                                        : 'text-ink-secondary hover:text-ink'
                                )}
                            >
                                <DeviceMobile size={14} />
                                <span>Mobile</span>
                            </button>
                        </div>

                        <Button variant="ghost" size="sm" onClick={() => setPreviewOpen(false)}>
                            Close
                        </Button>
                    </div>

                    {/* Preview Viewport Canvas */}
                    <div className="flex justify-center items-start py-4">
                        <div
                            className={cn(
                                'transition-all duration-300 bg-white rounded-xl shadow-xl overflow-hidden',
                                previewViewport === 'mobile'
                                    ? 'w-[390px] border-8 border-ink rounded-[44px] p-4 shadow-2xl'
                                    : 'w-full max-w-5xl p-6 sm:p-10 border border-edge-subtle'
                            )}
                        >
                            {/* Render using the authentic BlogRenderer and selected template */}
                            <BlogRenderer
                                template={form.template}
                                contentJson={form.contentJson}
                                post={previewPost}
                            />
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* AI Editorial Co-Pilot Drawer/Modal */}
            <EditorialAiCopilot
                isOpen={aiCopilotOpen}
                onClose={() => setAiCopilotOpen(false)}
                form={form}
                onApply={handleApplyAi}
            />

            {/* Publication Scheduling Modal */}
            <Dialog open={scheduleModalOpen} onOpenChange={setScheduleModalOpen}>
                <DialogContent className="max-w-md bg-white rounded-xl p-6 border border-edge-subtle shadow-2xl font-sans">
                    <DialogHeader>
                        <DialogTitle className="text-base font-bold text-ink flex items-center gap-2">
                            <CalendarBlank size={20} className="text-accent-ink" />
                            Schedule Publication
                        </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-3 font-sans">
                        <p className="text-xs text-ink-muted leading-relaxed">
                            Specify the future date and time when this wedding story will automatically transition to <strong>Published</strong> status, trigger on-demand ISR revalidation, and be visible to search engines and visitors.
                        </p>
                        <div>
                            <label className="block text-[11px] font-bold uppercase tracking-wider text-ink-secondary mb-1.5">
                                Scheduled Publication Date &amp; Time
                            </label>
                            <input
                                type="datetime-local"
                                value={scheduledDateTime}
                                onChange={(e) => setScheduledDateTime(e.target.value)}
                                min={new Date().toISOString().slice(0, 16)}
                                className="w-full rounded-xl border border-edge-subtle bg-ground p-2.5 text-xs text-ink focus:border-accent focus:ring-1 focus:ring-accent/30 focus:outline-none"
                            />
                        </div>
                    </div>
                    <div className="flex items-center justify-end gap-2 pt-3 border-t border-edge-subtle">
                        <Button variant="outline" size="sm" onClick={() => setScheduleModalOpen(false)}>
                            Cancel
                        </Button>
                        <Button variant="gold" size="sm" icon={CalendarCheck} onClick={handleConfirmSchedule}>
                            Confirm Schedule
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
