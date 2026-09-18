'use client';

import { useState, useEffect, useCallback } from 'react';
import { fireMessage } from '@/Utils/fireMessage.js';
import BannerImage from './_components/BannerImage.jsx';
import TeamImage from './_components/TeamImage.jsx';
import { PageHeader } from '@/app/admin/components/ui/PageHeader.jsx';

const api_url = process.env.NEXT_PUBLIC_API_URL;

export default function TeamSettingPage() {
  const [teamImages, setTeamImages] = useState([]);
  const [bannerImage, setBannerImage] = useState([]);

  const fetchTeamImage = useCallback(async () => {
    try {
      const res = await fetch(`${api_url}/api/team`);
      const data = await res.json();
      if (!res.ok || !data.teamImages || !data.bannerImage) {
        throw new Error(data.message || 'Failed to fetch team details');
      }
      setTeamImages(data.teamImages || []);
      setBannerImage(data.bannerImage || []);
    } catch (error) {
      fireMessage(error.message, 'error');
    }
  }, []);

  useEffect(() => {
    fetchTeamImage();
  }, [fetchTeamImage]);

  return (
    <div className="space-y-8 font-sans">
      <PageHeader
        title="Team Page & Masthead"
        subtitle="Curate the team photo mosaic banner and individual team member profiles on the public /team page."
        breadcrumbs={[
          { label: 'Admin', href: '/admin/dashboard' },
          { label: 'Website Settings' },
          { label: 'Team Page' },
        ]}
      />

      <BannerImage bannerImage={bannerImage} fetchTeamImage={fetchTeamImage} />
      <TeamImage teamImages={teamImages} fetchTeamImage={fetchTeamImage} />
    </div>
  );
}
