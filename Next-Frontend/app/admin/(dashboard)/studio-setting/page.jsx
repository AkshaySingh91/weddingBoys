'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { CircleNotch } from '@phosphor-icons/react';

/**
 * Studio details live in one place: Settings › Studio details. This page used
 * to render the same two editors a second time; it now forwards there, like the
 * other retired website-setting routes. Its `_components` are still used by
 * the Settings page.
 */
export default function StudioSettingRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/admin/settings?tab=studio');
  }, [router]);
  return (
    <div className="py-24 flex items-center justify-center text-ink-muted">
      <CircleNotch size={24} className="animate-spin" aria-label="Opening studio details" />
    </div>
  );
}
