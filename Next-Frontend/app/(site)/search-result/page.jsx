import { Suspense } from 'react';
import Loader from '@/Component/Loader.jsx';
import SearchResultClient from './_components/SearchResultClient';

// Search results are thin, parameterised, near-duplicate content — exactly what
// Google asks sites not to index. `robots.txt` disallows the path and this
// noindex covers any URL that gets crawled anyway (e.g. via an external link).
export const metadata = {
    title: 'Search Results | The Wedding Boys',
    description: 'Search films and photos across The Wedding Boys portfolio.',
    robots: { index: false, follow: true },
};

// SearchResultClient calls useSearchParams() (to read `?query=`), which
// requires a Suspense boundary above it or `next build` fails with a
// missing-suspense-boundary error.
export default function SearchResultPage() {
    return (
        <Suspense fallback={<Loader />}>
            <SearchResultClient />
        </Suspense>
    );
}
