import { Suspense } from 'react';
import SiteLayout from '@/app/(site)/layout.jsx';
import JournalNavbar from './_components/JournalNavbar.jsx';

export default function JournalLayout({ children }) {
    return (
        <SiteLayout>
            <Suspense fallback={<div className="h-12 border-b border-gold/25 bg-ground-sunk" />}>
                <JournalNavbar />
            </Suspense>
            {children}
        </SiteLayout>
    );
}
