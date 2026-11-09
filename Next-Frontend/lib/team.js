/**
 * The studio's people, as the home page shows them (Component/home/StudioTeam.jsx).
 *
 * Hierarchy: two founders → managing director → crew. Founders and the MD have
 * dedicated portraits (seated founders, standing MD); the crew are matching
 * studio headshots.
 *
 * CONFIRM: crew entries marked `placeholder: true` carry stand-in names and
 * roles — the studio supplied the photographs without names. Replace them here.
 * Swapnil Hatkar and Swapnil are matched to existing team records by likeness;
 * confirm those too.
 */
import amanSingh from '@/Asset/Team/aman-singh.jpg';
import surajSingh from '@/Asset/Team/suraj-singh.jpg';
import abhay from '@/Asset/Team/abhay.jpg';
import swapnilHatkar from '@/Asset/Team/swapnil-hatkar.jpg';
import swapnil from '@/Asset/Team/swapnil.jpg';
import rohit from '@/Asset/Team/crew-rohit.jpg';
import vikram from '@/Asset/Team/crew-vikram.jpg';
import nikhil from '@/Asset/Team/crew-nikhil.jpg';
import pranav from '@/Asset/Team/crew-pranav.jpg';

export const FOUNDERS = [
    { name: 'Aman Singh', role: 'Founder', image: amanSingh },
    { name: 'Suraj Singh', role: 'Founder', image: surajSingh },
];

export const MANAGING_DIRECTOR = {
    name: 'Abhay', role: 'Managing Director', image: abhay,
    line: 'Runs the studio day to day, so the founders can stay behind the camera.',
};

export const CREW = [
    { name: 'Swapnil', role: 'Candid Photographer', image: swapnilHatkar },
    { name: 'Rohit Patil', role: 'Cinematographer', image: rohit, placeholder: true },
    { name: 'Vikram Shinde', role: 'Photographer', image: vikram, placeholder: true },
    { name: 'Nikhil Jadhav', role: 'Film Editor', image: nikhil, placeholder: true },
    { name: 'Deepak', role: 'Drone Pilot', image: pranav, placeholder: true },
    { name: 'Swapnil Hatkar', role: 'Camera Assistant', image: swapnil },
];
