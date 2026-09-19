'use client';

/**
 * Route error boundary.
 *
 * The public site had **zero** `error.jsx` segments (R-40), so any thrown render
 * error produced Next's unbranded default screen with no route back into the
 * site. This catches everything under `(site)`.
 */
import { useEffect } from 'react';
import Button from '@/Component/ui/Button.jsx';
import Section from '@/Component/ui/Section.jsx';

export default function SiteError({ error, reset }) {
    useEffect(() => {
        // Surfaced for whatever monitoring is wired later; never shown to the visitor.
        console.error(error);
    }, [error]);

    return (
        <Section width="prose" rhythm="loose">
            <p className="t-label">Something broke</p>
            <h1 className="t-display-2 mt-4">This page didn&apos;t load</h1>
            <p className="t-body mt-4">
                The fault is ours, not yours. Try again — and if it keeps happening,
                tell us and we&apos;ll look into it.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
                <Button onClick={reset} variant="primary">Try again</Button>
                <Button href="/" variant="secondary">Back to the studio</Button>
            </div>
        </Section>
    );
}
