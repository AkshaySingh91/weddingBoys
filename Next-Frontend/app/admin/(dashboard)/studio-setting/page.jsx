'use client';

import StudioContact from './_components/StudioContact';
import AdminInviteCode from './_components/AdminInviteCode';
import { PageHeader } from '@/app/admin/components/ui/PageHeader.jsx';

export default function Page() {
  return (
    <div className="space-y-6 pb-12 font-sans">
      <PageHeader
        title="Studio Contact & Business Profile"
        subtitle="Manage official studio details, corporate contact channels, social handles, and admin invitation codes."
        breadcrumbs={[
          { label: 'Admin', href: '/admin/dashboard' },
          { label: 'Studio Settings' },
        ]}
      />

      <StudioContact />
      <AdminInviteCode />
    </div>
  );
}
