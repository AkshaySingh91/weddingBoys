/**
 * The curated icon set for editorial blocks.
 *
 * One list, shared by the editor's pickers and the published renderer, so an
 * icon chosen in the admin is the icon that ships. Blocks already import
 * Phosphor directly (see AtAGlanceBlock), so this follows that pattern rather
 * than inventing an SVG sprite.
 *
 * Deliberately small and wedding-shaped. An open icon library would mean an
 * author hunting through a thousand glyphs to label a step card, and would let
 * a post drift off-brand one icon at a time. Adding to this list is a decision,
 * not a search result.
 */
import {
    Sun, Camera, MapPin, CalendarBlank, Clock, Heart, Sparkle, Lightbulb,
    Fire, Users, FilmSlate, CheckCircle, XCircle, Star, VideoCamera,
    Palette, CurrencyInr, MusicNotes, Confetti, FlowerLotus,
} from '@phosphor-icons/react';

export const BLOCK_ICONS = {
    sun: { label: 'Sun', Icon: Sun },
    camera: { label: 'Camera', Icon: Camera },
    video: { label: 'Video', Icon: VideoCamera },
    film: { label: 'Film', Icon: FilmSlate },
    place: { label: 'Place', Icon: MapPin },
    date: { label: 'Date', Icon: CalendarBlank },
    time: { label: 'Time', Icon: Clock },
    heart: { label: 'Heart', Icon: Heart },
    sparkle: { label: 'Sparkle', Icon: Sparkle },
    tip: { label: 'Tip', Icon: Lightbulb },
    fire: { label: 'Fire', Icon: Fire },
    people: { label: 'People', Icon: Users },
    yes: { label: 'Tick', Icon: CheckCircle },
    no: { label: 'Cross', Icon: XCircle },
    star: { label: 'Star', Icon: Star },
    palette: { label: 'Palette', Icon: Palette },
    price: { label: 'Price', Icon: CurrencyInr },
    music: { label: 'Music', Icon: MusicNotes },
    celebrate: { label: 'Celebration', Icon: Confetti },
    lotus: { label: 'Lotus', Icon: FlowerLotus },
};

/** For <select> pickers, with a "none" entry first. */
export const ICON_OPTIONS = [
    { id: '', label: 'No icon' },
    ...Object.entries(BLOCK_ICONS).map(([id, { label }]) => ({ id, label })),
];

/** Render an icon by id. Returns null for an unknown or empty id. */
export function BlockIcon({ name, size = 16, weight = 'regular', className }) {
    const entry = name ? BLOCK_ICONS[name] : null;
    if (!entry) return null;
    const { Icon } = entry;
    return <Icon size={size} weight={weight} className={className} />;
}

export default BLOCK_ICONS;
