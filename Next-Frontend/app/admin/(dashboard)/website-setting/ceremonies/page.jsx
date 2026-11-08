'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { CircleNotch } from '@phosphor-icons/react';

export default function CeremoniesRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/admin/settings?tab=tags');
  }, [router]);

  return (
    <div className="py-24 flex flex-col items-center justify-center gap-3 text-ink-muted font-sans">
      <CircleNotch size={26} className="animate-spin text-accent-ink" />
      <p className="text-xs font-medium">Redirecting to Studio Settings Hub…</p>
    </div>
  );
}
