import React from 'react'
import VideoThumbnail from './VideoThumbnail'
import Map from './Map'
import BtsTape from './BtsTape';
import Review from './Review';
import Herobanner from './Herobanner';
import "react-router-dom"

export default function Index() {
    return (<>
        <section className='lg:px-4 py-3 h-auto'>
            <Herobanner></Herobanner>
            <div className="py-24 flex items-center justify-center text-nowrap">
                <div className="">
                    <span>Turning Moments into Memories.</span>
                </div>
            </div>
            <VideoThumbnail></VideoThumbnail>
            <Map></Map>
            <BtsTape></BtsTape>
            <Review></Review>
        </section>

    </>)
}

