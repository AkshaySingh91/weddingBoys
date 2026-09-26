'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { CircleNotch } from '@phosphor-icons/react';

/**
 * The /films rows used to be a tag list edited here. They are rows now (plan
 * phase 6): which rows, in what order, is set on the films page composition,
 * and each row's films in Admin › Rows. This forwards there.
 */
export default function FilmsPageSettingsRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/admin/content/films');
  }, [router]);
  return (
    <div className="py-24 flex flex-col items-center justify-center gap-3 text-stone-500 font-sans">
      <CircleNotch size={26} className="animate-spin text-[#A3603A]" />
      <p className="text-xs font-medium">Opening the films page composition…</p>
    </div>
  );
}
