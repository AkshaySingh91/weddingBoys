/**
 * Home › Banaras pre-wedding: the three stops both layouts share, in plain
 * words (a Hinglish line that feels like Banaras + one simple English
 * sentence), and the river diyas.
 */
import dawnWide from '@/Asset/Varanasi/varanasi-boat-intimate.png';
import dawnTall from '@/Asset/Varanasi/fragmentRiver.png';
import galiStandIn from '@/Asset/Varanasi/culture-ghats.png';
import aarti from '@/Asset/Varanasi/culture-aarti.png';

/**
 * Images to generate and drop in. Until then the slot shows the stand-in with a
 * visible "AI placeholder" tag so it cannot ship unnoticed.
 * When the file exists: replace the `galiStandIn` import with it and delete
 * `placeholder: 'gali'` below.
 */
export const AI_PLACEHOLDERS = {
    gali: {
        file: 'Asset/Varanasi/varanasi-gali-couple.png',
        size: '2400 × 1600 (3:2), couple right of centre (~two-thirds across)',
    },
};

export const STOPS = [
    {
        key: 'dawn', label: 'Sunrise', hi: 'Subah ki pehli kiran',
        title: 'Sunrise boat ride on the Ganga',
        line: 'Just the two of you on a boat, as the sun comes up over the ghats.',
        wide: dawnWide, tall: dawnTall, posWide: '50% 55%', posTall: '50% 62%', flipWide: true,
        sky: 'radial-gradient(120% 80% at 70% 0%, rgba(244,179,122,0.45), transparent 60%)', diyas: 0.4,
    },
    {
        key: 'gali', label: 'Old lanes', hi: 'Ghaat, galiyan aur mandir ki ghantiyan',
        title: 'The ghats and old lanes',
        line: 'Walk the ghat steps and the colourful old lanes. Every corner looks like a film set.',
        wide: galiStandIn, tall: galiStandIn, posWide: '50% 60%', posTall: '64% 55%', placeholder: 'gali',
        sky: 'radial-gradient(120% 80% at 30% 0%, rgba(255,226,170,0.32), transparent 62%)', diyas: 0.15,
    },
    {
        key: 'aarti', label: 'Ganga Aarti', hi: 'Ganga Aarti ki roshni mein',
        title: 'In the light of the Ganga Aarti',
        line: 'Stand together in the glow of the grand evening aarti: the lamps, the bells and the river.',
        wide: aarti, tall: aarti, posWide: '40% 45%', posTall: '36% 50%', flipWide: true,
        sky: 'radial-gradient(120% 90% at 60% 100%, rgba(232,120,40,0.35), transparent 60%)', diyas: 1,
    },
];

/** Diyas on the river: few, slow, paused unless an ancestor has [data-live]. */
const DIYAS = [
    { top: '8%', dur: 46, delay: -4, scale: 1 },
    { top: '34%', dur: 58, delay: -22, scale: 0.8 },
    { top: '18%', dur: 52, delay: -37, scale: 0.9 },
    { top: '52%', dur: 64, delay: -12, scale: 0.7 },
    { top: '70%', dur: 49, delay: -30, scale: 0.85 },
];
export function Diyas({ strength, className = 'h-[26%]' }) {
    return (
        <span aria-hidden="true" className={`pointer-events-none absolute inset-x-0 bottom-0 overflow-hidden transition-opacity duration-[1200ms] ${className}`}
            style={{ opacity: strength }}>
            {DIYAS.map((d, i) => (
                <span key={i} className="diya-drift absolute left-0" style={{ top: d.top, animationDuration: `${d.dur}s`, animationDelay: `${d.delay}s` }}>
                    <span className="diya-bob block" style={{ transform: `scale(${d.scale})`, animationDelay: `${i * -0.7}s`, '--i': i }}>
                        <span className="diya-flame mx-auto block h-[9px] w-[6px] rounded-[50%_50%_45%_45%] bg-[#FFD27A]" />
                        <span className="mt-[1px] block h-[4px] w-[16px] rounded-b-full bg-[#8A4B22]" />
                    </span>
                </span>
            ))}
        </span>
    );
}

export function PlaceholderTag({ id, className = '' }) {
    if (!id) return null;
    return (
        <span className={`absolute z-20 rounded-lg border border-dashed border-gold/80 bg-black/55 px-2.5 py-1.5 text-[10.5px] font-semibold uppercase tracking-[0.14em] text-gold ${className}`}>
            AI placeholder · {AI_PLACEHOLDERS[id].file.split('/').pop()}
        </span>
    );
}
