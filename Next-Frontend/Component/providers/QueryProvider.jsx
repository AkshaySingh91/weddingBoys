'use client';

import { useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// One QueryClient per browser session (created lazily so it isn't shared across
// requests during SSR). Powers server-state caching + optimistic updates for
// the admin dashboard.
export default function QueryProvider({ children }) {
    const [client] = useState(() => new QueryClient({
        defaultOptions: {
            queries: {
                staleTime: 30_000,
                refetchOnWindowFocus: false,
                retry: 1,
            },
        },
    }));

    return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}
