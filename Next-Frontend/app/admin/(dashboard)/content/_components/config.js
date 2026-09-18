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
];

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
        item: { media: 'single', mediaType: 'Image', fields: ['title', 'subtitle', 'body'], labels: { title: 'Person name', subtitle: 'Bride / Groom', body: 'Review text' } },
    },
    team: {
        label: 'Team',
        icon: Users,
        fields: ['title'],
        item: { media: 'single', mediaType: 'Image', fields: ['title', 'subtitle', 'body'], labels: { title: 'Name', subtitle: 'Role', body: 'About' } },
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
        fields: ['title'],
        item: { fields: ['title', 'subtitle'], labels: { title: 'Value', subtitle: 'Label' } },
    },
    section: {
        label: 'Site section',
        icon: LayoutTemplate,
        section: true,   // rendered by a live component; admin picks which + toggles it
    },
};

export const BLOCK_TYPES = Object.keys(BLOCK_CONFIG);

// Managed pages offered in the CMS (admins can add more via "New page").
export const DEFAULT_PAGES = [
    { pageKey: 'home', title: 'Home' },
    { pageKey: 'about', title: 'About Us' },
    { pageKey: 'films', title: 'Films' },
    { pageKey: 'photos', title: 'Photos' },
    { pageKey: 'contact', title: 'Contact' },
];

const FIELD_LABELS = {
    title: 'Title',
    subtitle: 'Subtitle',
    body: 'Body',
    link: 'Link',
};

export const fieldLabel = (field, labels = {}) => labels[field] || FIELD_LABELS[field] || field;
export const isTextarea = (field) => field === 'body';
