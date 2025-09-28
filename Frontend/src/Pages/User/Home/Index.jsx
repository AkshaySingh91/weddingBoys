import React from 'react';
import Herobanner from './Herobanner';
import VideoThumbnail from './VideoThumbnail';
// import BtsTape from './BtsTape';
import Review from './Review';
import WhyChooseUs from './WhyChooseUs';
import OfferPackages from "./OfferPackages"
import OurServices from './OurService';
import OurStory from './OurShortStory';
import OurTeams from './OurTeams';
import OurPortfolio from './OurPortfolio';
import OurApproach from './OurApproach';
import DharaService from '../../Admin/Pages/HomePage/DharaService';

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
      <DharaService/>
      <OurStory />
      <OurTeams />
      <OurPortfolio />
      <WhyChooseUs />
      <OfferPackages />
      <OurApproach />
      {/* <BtsTape /> */}
      <Review />
    </section>
  );
};

export default HomePage;
