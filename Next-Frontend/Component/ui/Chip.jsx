/**
 * Chip — taxonomy tags and small metadata.
 *
 * The audit found this one concept rendering four different ways, two of them
 * inside a single row on /photos: warm cream tags beside a slate-grey "+5 more"
 * with a different border (R-20). One component, three tones.
 */
export default function Chip({ tone = 'default', as: Tag = 'span', className = '', children, ...rest }) {
    const TONES = {
        default: 'bg-ground-raised text-ink-secondary border-edge-subtle',
        accent: 'bg-accent-wash text-accent-ink border-accent/25',
        /* Overflow counts ("+5 more") are the SAME chip, quieter — not a
           different component in a different palette. */
        quiet: 'bg-transparent text-ink-muted border-edge-subtle',
    };
    return (
        <Tag
            className={`inline-flex items-center rounded-pill border px-3 py-1 text-[12px]
                        font-medium leading-none ${TONES[tone]} ${className}`}
            {...rest}
        >
            {children}
        </Tag>
    );
}
