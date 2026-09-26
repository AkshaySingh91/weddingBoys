// Declarative description of every block type: which top-level fields it shows,
// whether it carries media (single vs gallery), and — for list blocks — the
// per-item fields. The generic BlockCard editor is driven entirely by this, so
// adding a block type is a config entry here + a renderer on the public side.

import {
    Heading1, Type, Image as ImageIcon, Images, Clapperboard,
    MessageSquareQuote, Users, LayoutGrid, Megaphone, BarChart3, LayoutTemplate,
} from 'lucide-react';

// `section` blocks bind to a rich, self-fetching site component. The admin
// chooses which one via settings.component; the public SECTION_COMPONENTS
// registry renders it. Order/visibility are what the CMS controls here.
export const SECTION_OPTIONS = [
    { value: 'heroVideos', label: 'Hero Videos' },
    { value: 'ourFilms', label: 'Our Films' },
    { value: 'service', label: 'Services / Offerings' },
    { value: 'announcementVaranasi', label: 'Announcement — Varanasi' },
    { value: 'announcementDharaa', label: 'Announcement — Dharaa Events' },
    { value: 'ourStory', label: 'Our Story' },
    { value: 'portfolio', label: 'Our Portfolio' },
    { value: 'whyChooseUs', label: 'Why Choose Us' },
    { value: 'packages', label: 'Our Packages' },
    { value: 'ourApproach', label: 'Our Approach' },
    // The portfolio pages (each renders its own page; the settings choose rows / filters).
    { value: 'filmRows', label: 'Film rows — /films page' },
    { value: 'browseFilms', label: 'Browse films — /allfilms page' },
    { value: 'photoGallery', label: 'Photo gallery — /photos page' },
];

// Sections and blocks whose content is edited on its own screen (plan phase 7:
// one truth per thing). The editor links there instead of offering a copy.
export const SECTION_SOURCES = {
    packages: { text: 'The packages come from Pricing: add, edit, hide and order them there.', href: '/admin/pricing', cta: 'Open Pricing' },
};

export const sectionLabel = (value) => SECTION_OPTIONS.find((o) => o.value === value)?.label || 'Section';

export const BLOCK_CONFIG = {
    heading: {
        label: 'Heading',
        icon: Heading1,
        fields: ['title', 'subtitle'],
    },
    richText: {
        label: 'Rich text',
        icon: Type,
        fields: ['title', 'body'],
    },
    mediaSingle: {
        label: 'Single media',
        icon: ImageIcon,
        fields: ['title', 'subtitle'],
        media: 'single',
    },
    mediaGallery: {
        label: 'Media gallery',
        icon: Images,
        fields: ['title', 'subtitle'],
        media: 'gallery',
    },
    heroVideo: {
        label: 'Hero videos',
        icon: Clapperboard,
        fields: ['title'],
        item: { media: 'single', mediaType: '', fields: ['title', 'link'], labels: { title: 'Caption', link: 'Film link (/films/:id)' } },
    },
    reviews: {
        label: 'Reviews',
        icon: MessageSquareQuote,
        fields: ['title'],
        source: { text: 'The reviews come from Couple reviews, which can also show each one on its wedding’s story page.', href: '/admin/website-setting/home?tab=reviews', cta: 'Open Couple reviews' },
    },
    team: {
        label: 'Team',
        icon: Users,
        fields: ['title'],
        source: { text: 'The people come from Team, which also feeds the /team page and the film credits.', href: '/admin/website-setting/teams', cta: 'Open Team' },
    },
    featureCards: {
        label: 'Feature cards',
        icon: LayoutGrid,
        fields: ['title', 'subtitle'],
        item: { media: 'single', mediaType: 'Image', fields: ['title', 'body', 'link'], labels: { title: 'Card title', body: 'Card text', link: 'Link' } },
    },
    cta: {
        label: 'Call to action',
        icon: Megaphone,
        fields: ['title', 'subtitle', 'body', 'link'],
    },
    stats: {
        label: 'Stats',
        icon: BarChart3,
        fields: ['title', 'subtitle'],
        labels: { title: 'Heading', subtitle: 'Lead' },
        item: { fields: ['title', 'subtitle', 'body'], labels: { title: 'Value (e.g. 1000+)', subtitle: 'Label', body: 'One line beneath' } },
    },
    section: {
        label: 'Site section',
        icon: LayoutTemplate,
        section: true,   // rendered by a live component; admin picks which + toggles it
    },
};

export const BLOCK_TYPES = Object.keys(BLOCK_CONFIG);

// Managed pages offered in the CMS (admins can add more via "New page").
// (About and Contact were listed here, but /about-us and /contact never read a
// CMS page, so edits to them changed nothing.)
export const DEFAULT_PAGES = [
    { pageKey: 'home', title: 'Home' },
    { pageKey: 'films', title: 'Films' },
    { pageKey: 'allfilms', title: 'All films' },
    { pageKey: 'photos', title: 'Photos' },
];
export const UNREAD_PAGES = new Set(['about', 'contact']);

const FIELD_LABELS = {
    title: 'Title',
    subtitle: 'Subtitle',
    body: 'Body',
    link: 'Link',
};

export const fieldLabel = (field, labels = {}) => labels[field] || FIELD_LABELS[field] || field;
export const isTextarea = (field) => field === 'body';
