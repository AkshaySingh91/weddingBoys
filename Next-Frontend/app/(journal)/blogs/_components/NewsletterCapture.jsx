import Link from 'next/link';

export default function NewsletterCapture() {
    return (
        <section aria-label="Explore the journal" className="my-16 rounded-3xl border border-studio-border bg-studio-canvas p-8 text-center">
            <h3 className="font-display text-2xl text-studio-ink">More stories from The Wedding Vachan</h3>
            <p className="mt-3 text-sm text-studio-inkSecondary">Explore real weddings, destination guides, and cinematography inspiration.</p>
            <Link href="/blogs" className="mt-6 inline-block rounded-xl bg-studio-ink px-6 py-3 text-sm font-semibold text-studio-canvas">Browse the journal</Link>
        </section>
    );
}
