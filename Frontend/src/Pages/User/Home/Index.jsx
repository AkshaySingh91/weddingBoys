import React from 'react';
import Herobanner from './Herobanner';
import VideoThumbnail from './VideoThumbnail';
import Map from './Map';
import BtsTape from './BtsTape';
import Review from './Review';
import WhyChooseUs from './WhyChooseUs';
import OfferPackages from "./OfferPackages"
import OurServices from './OurService';
import OurStory from './OurShortStory';
import OurTeams from './OurTeams';
import OurPortfolio from './OurPortfolio';
import OurApproach from './OurApproach';

const HomePage = () => {
  return (
    <section
    id='top'
    className="lg:px-4 py-3 h-auto">
      <Herobanner />
      <div className="py-16 flex items-center justify-center text-nowrap">
        <div>
          <span>Turning Moments into Memories.</span>
        </div>
      </div>
      <VideoThumbnail />
      <OurServices />
      <OurStory />
      <OurTeams />
      <OurPortfolio />
      <WhyChooseUs />
      <OfferPackages />
      <OurApproach />
      <Map />
      <BtsTape />
      <Review />
    </section>
  );
};

export default HomePage;
