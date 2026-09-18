// Maps a CMS `section` block's settings.component name → the rich client
// component that renders it. These components self-fetch their data (hero
// videos, films, packages…); the CMS only decides whether they appear and in
// what order. Adding a new site section = one import + one entry here + one
// option in the admin picker (SECTION_OPTIONS in the content config).
import Herobanner from '@/app/(site)/_home/Herobanner.jsx';
import VideoThumbnail from '@/app/(site)/_home/VideoThumbnail.jsx';
import OurServices from '@/app/(site)/_home/OurService.jsx';
import OurStory from '@/app/(site)/_home/OurShortStory.jsx';
import OurPortfolio from '@/app/(site)/_home/OurPortfolio.jsx';
import WhyChooseUs from '@/app/(site)/_home/WhyChooseUs.jsx';
import OfferPackages from '@/app/(site)/_home/OfferPackages.jsx';
import OurApproach from '@/app/(site)/_home/OurApproach.jsx';
import VaranasiLaunchCard from '@/app/(site)/_home/VaranasiLaunchCard.jsx';
import DharaService from '@/Component/DharaService.jsx';

export const SECTION_COMPONENTS = {
    heroVideos: Herobanner,
    ourFilms: VideoThumbnail,
    service: OurServices,
    announcementVaranasi: VaranasiLaunchCard,
    announcementDharaa: DharaService,
    ourStory: OurStory,
    portfolio: OurPortfolio,
    whyChooseUs: WhyChooseUs,
    packages: OfferPackages,
    ourApproach: OurApproach,
};
