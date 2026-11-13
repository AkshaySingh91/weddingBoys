/**
 * Home › Banaras pre-wedding: the three stops both layouts share, in plain
 * words (a Hinglish line that feels like Banaras + one simple English
 * sentence), and the river diyas.
 */
import dawnWide from '@/Asset/Varanasi/desktop-dawn-boat.jpg';      // = first frame of the dawn loop
import galiStandIn from '@/Asset/Varanasi/culture-ghats.png';
import aarti from '@/Asset/Varanasi/culture-aarti.png';
// Phones: one couple, one day (sunrise → lanes → aarti), composed for 9:16.
import phoneDawn from '@/Asset/Varanasi/phone-1-sunrise-boat.jpg';
import phoneLanes from '@/Asset/Varanasi/phone-2-ghat-lanes.jpg';
import phoneAarti from '@/Asset/Varanasi/phone-3-ganga-aarti.jpg';

/**
 * Desktop images still to generate. Until then the slot shows the stand-in with
 * a visible "AI placeholder" tag (desktop only — phones have their own photo).
 * When the file exists: replace the `galiStandIn` import with it and delete
 * `placeholder: 'gali'` below.
 */
export const AI_PLACEHOLDERS = {
    gali: {
        file: 'Asset/Varanasi/varanasi-gali-couple.png',
        size: '2400 × 1350 (16:9), the same couple as the phone photos, couple right of centre (~two-thirds across)',
    },
};

/**
 * Desktop only: a 9 s silent loop of the dawn boat (water and mist moving, the
 * couple still) — System Media 2pTby87C9hDq on R2, made with
 * Backend/scripts/publish-system-video.js. Plays only on a good connection, on
 * screen, with motion allowed; its first frame (desktop-dawn-boat.jpg) is the
 * poster, so the hand-off never jumps. Override with NEXT_PUBLIC_VARANASI_DAWN_LOOP.
 */
export const DAWN_LOOP_SRC = process.env.NEXT_PUBLIC_VARANASI_DAWN_LOOP
    || 'https://media.theweddingvachan.com/dev/system/2pTby87C9hDq/loop.mp4';

export const STOPS = [
    {
        key: 'dawn', label: 'Sunrise', hi: 'Subah ki pehli kiran',
        title: 'Sunrise boat ride on the Ganga',
        line: 'The two of you on a boat while the sun comes up over the ghats.',
        wide: dawnWide, tall: phoneDawn, posWide: '50% 55%', posTall: '50% 58%', flipWide: true, loop: DAWN_LOOP_SRC,
        sky: 'radial-gradient(120% 80% at 70% 0%, rgba(244,179,122,0.45), transparent 60%)', diyas: 0.4,
    },
    {
        key: 'gali', label: 'Old lanes', hi: 'Ghaat, galiyan aur mandir ki ghantiyan',
        title: 'The ghats and old lanes',
        line: 'Ghat steps, narrow lanes and painted doors. Every turn looks like a film set.',
        wide: galiStandIn, tall: phoneLanes, posWide: '50% 60%', posTall: '58% 50%', placeholder: 'gali',
        sky: 'radial-gradient(120% 80% at 30% 0%, rgba(255,226,170,0.32), transparent 62%)', diyas: 0.15,
    },
    {
        key: 'aarti', label: 'Ganga Aarti', hi: 'Ganga Aarti ki roshni mein',
        title: 'In the light of the Ganga Aarti',
        line: 'Lamps, bells and the river glowing behind you at the evening aarti.',
        wide: aarti, tall: phoneAarti, posWide: '40% 45%', posTall: '30% 50%', flipWide: true,
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
    // a note for the team while an image is still a stand-in; visitors never see it
    if (!id || process.env.NODE_ENV === 'production') return null;
    return (
        <span className={`absolute z-20 rounded-lg border border-dashed border-gold/80 bg-black/55 px-2.5 py-1.5 text-[10.5px] font-semibold uppercase tracking-[0.14em] text-gold ${className}`}>
            AI placeholder · {AI_PLACEHOLDERS[id].file.split('/').pop()}
        </span>
    );
}
