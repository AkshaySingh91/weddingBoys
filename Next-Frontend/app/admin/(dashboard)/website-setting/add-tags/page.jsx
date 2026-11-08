'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { CircleNotch } from '@phosphor-icons/react';

/**
 * The old category editor. Tags now live in one system with rename, merge and
 * undo (Settings › Portfolio Tags), and this page's writes are retired, so it
 * forwards there.
 */
export default function AddTagsRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/admin/settings?tab=tags');
  }, [router]);

  return (
    <div className="py-24 flex flex-col items-center justify-center gap-3 text-ink-muted font-sans">
      <CircleNotch size={26} className="animate-spin text-accent-ink" />
      <p className="text-xs font-medium">Opening Portfolio Tags…</p>
    </div>
  );
}
