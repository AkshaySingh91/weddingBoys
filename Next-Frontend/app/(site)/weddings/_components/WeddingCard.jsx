import Link from 'next/link';
import Media from '@/Component/ui/Media.jsx';

/**
 * A wedding in a list (the weddings index, "More weddings" on a story page).
 * Portrait cover in the arch — the system's portrait frame (DESIGN-SYSTEM.md
 * §3.3) — then the couple, then place and dates on their own lines.
 */
export default function WeddingCard({ wedding, priority = false }) {
    const place = [wedding.location?.venue, wedding.location?.city].filter(Boolean).join(', ');
    return (
        <Link href={wedding.href} className="group block">
            <Media
                src={wedding.cover?.url}
                alt={`${wedding.title}, wedding`}
                ratio="portrait"
                className="arch-soft border border-gold/40"
                imgClassName="transition-transform duration-media ease-standard group-hover:scale-[1.03]"
                blurDataURL={wedding.cover?.blurDataURL}
                dominantColor={wedding.cover?.dominantColor}
                priority={priority}
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 380px"
            />
            <h3 className="t-heading-2 mt-4 group-hover:text-accent-ink">{wedding.title}</h3>
            {place && <p className="t-body-sm mt-1">{place}</p>}
            {wedding.dates && <p className="t-caption">{wedding.dates}</p>}
        </Link>
    );
}
