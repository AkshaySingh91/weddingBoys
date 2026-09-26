import PageSections from '@/Component/cms/PageSections.jsx';
import Herobanner from './_home/Herobanner.jsx';
import VideoThumbnail from './_home/VideoThumbnail.jsx';
import WhyChooseUs from './_home/WhyChooseUs.jsx';
import OfferPackages from './_home/OfferPackages.jsx';
import OurServices from './_home/OurService.jsx';
import OurStory from './_home/OurShortStory.jsx';
import OurPortfolio from './_home/OurPortfolio.jsx';
import OurApproach from './_home/OurApproach.jsx';
import DharaService from '@/Component/DharaService.jsx';
import VaranasiLaunchCard from './_home/VaranasiLaunchCard.jsx';
import { CmsSection } from '@/Component/cms/CmsRender.jsx';
import StatsBand from '@/Component/cms/StatsBand.jsx';

const api_url = process.env.NEXT_PUBLIC_API_URL;

export const revalidate = 60; // ISR — CMS edits appear within a minute

// Fetch the CMS 'home' layout on the server (fails soft → fallback render).
async function fetchHome() {
    try {
        // resolve=1: each section arrives with the rows it shows (Admin › Rows),
        // so the home page needs one request. `portfolio` refreshes it when a row changes.
        const res = await fetch(`${api_url}/api/content/home?resolve=1`, { next: { revalidate: 60, tags: ['page:home', 'portfolio'] } });
        if (!res.ok) return null;
        const data = await res.json();
        return data.page || null;
    } catch {
        return null;
    }
}

export default async function HomePage() {
    const page = await fetchHome();

    return (
        <section id="top" className="lg:px-4 py-3 h-auto">
            {page?.blocks?.length ? (
                // CMS-driven: order, visibility, add/remove all controlled from
                // /admin/content/home.
                <PageSections blocks={page.blocks} />
            ) : (
                // Resilient fallback if the CMS is unreachable or the page is
                // unpublished — the site still renders its default layout.
                <>
                    <Herobanner />
                    <VideoThumbnail />
                    <OurServices />
                    <VaranasiLaunchCard />
                    <DharaService />
                    <OurStory />
                    <CmsSection pageKey="home" block="home-team" />
                    <OurPortfolio />
                    <WhyChooseUs />
                    <OfferPackages />
                    <StatsBand />
                    <OurApproach />
                    <CmsSection pageKey="home" block="home-bts" />
                    <CmsSection pageKey="home" block="home-reviews" />
                </>
            )}
        </section>
    );
}
