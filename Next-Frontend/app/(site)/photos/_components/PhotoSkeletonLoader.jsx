'use client';

import { useEffect, useState } from 'react';

// Shared masonry placeholder tile, used by the gallery (/photos) and by the
// single-photo page's recommendation strip (/photos/[photoId]). It lives in its
// own module so neither route imports from the other's page component — which
// broke when /photos gained a server shell for its metadata.

export const PhotoSkeletonLoader = () => {
    // Height was originally randomized inline during render, which produces
    // a server/client hydration mismatch under Next.js SSR (Math.random()
    // during render). Default to a fixed height for the first render and
    // randomize post-mount only, matching the fix pattern used in
    // Component/Background.jsx.
    const [height, setHeight] = useState(350);

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setHeight(Math.floor(Math.random() * (450 - 300 + 1)) + 300);
    }, []);

    return (
        <div className="relative animate-pulse rounded-3xl w-full bg-slate-300"
            style={{
                height: `${height}px`,
            }}>
            <div className="absolute bottom-6 left-6 text-white flex flex-col gap-0">
                <div className="flex items-center text-desktopBodySmall uppercase font-semibold tracking-wide">
                    <span className="inline-block animate-pulse w-28 h-4 rounded-lg bg-slate-400 mr-2 my-4"></span>
                    <span className="inline-block animate-pulse w-10 h-4 rounded-lg bg-slate-400"></span>
                </div>
                <div className="flex gap-2 text-desktopBodyMedium font-bold">
                    <span className="inline-block animate-pulse w-10 h-4 rounded-lg bg-slate-400"></span>
                    <span className="inline-block animate-pulse w-10 h-4 rounded-lg bg-slate-400"></span>
                </div>
            </div>
        </div>
    )
}
