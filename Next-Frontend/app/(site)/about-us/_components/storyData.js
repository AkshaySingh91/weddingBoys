/**
 * Copy and imagery for /about-us ("Our story").
 *
 * Everything a visitor reads on the page lives here so it can be checked in one
 * place. Lines marked CONFIRM are statements the studio has to stand behind —
 * they were written from the brief, not from a source, and must be verified by
 * the founders before this ships.
 */
import amanSingh from '@/Asset/Story/aman-singh.jpg';
import surajSingh from '@/Asset/Story/suraj-singh.jpg';
import abhay from '@/Asset/Team/abhay.jpg';

// R2 masters. The custom loader snaps `/orig.*` to the nearest pre-rendered width.
const r2 = (client, media) => `https://media.theweddingvachan.com/client/${client}/${media}/orig.jpg`;

export const PHOTOS = {
    amitKomal: { src: r2('6804af4ef012e5e291abec61', 'YUmdBkyUwF8z'), alt: 'Amit and Komal walk down a mirrored aisle under sparklers' },
    hritikSonamWide: { src: r2('6804a822f012e5e291abebe3', 'QPEtgK2hgPn0'), alt: 'Hritik and Sonam on their wedding day' },
    brideEntrance: { src: r2('6804af4ef012e5e291abec61', 'O0E3c8rXNTRc'), alt: 'A bride’s entrance between dancers in white' },
    groomCelebrates: { src: r2('6804af4ef012e5e291abec61', 'wceON0Qpv6eP'), alt: 'A groom celebrates under the wedding lights' },
    anshuAbhishek: { src: r2('67e05bb60f15ebfba3ee509b', 'ajXzfcyp24Rj'), alt: 'Anshu and Abhishek at their ceremony' },
    aadarshGeet: { src: r2('6804afb7f012e5e291abec6a', 'Fran6zITHpf0'), alt: 'Aadarsh and Geet, portrait' },
    nehalRani: { src: r2('6804ac74f012e5e291abec54', 'GTMXQajTPaP2'), alt: 'Nehal and Rani, portrait' },
};

export const FOUNDERS = [
    {
        name: 'Aman Singh',
        title: 'Founder',
        image: amanSingh,
        alt: 'Aman Singh filming a wedding with a cinema camera',
        department: 'Story & direction',
        since: '2015', // CONFIRM
    },
    {
        name: 'Suraj Singh',
        title: 'Founder',
        image: surajSingh,
        alt: 'Suraj Singh reviewing footage on a monitor at a wedding',
        since: '2015', // CONFIRM
    },
];

/** Founders, then the managing director: the leadership slates and the end credits. */
export const LEADERSHIP = [
    ...FOUNDERS,
    {
        name: 'Abhay Singh',
        title: 'Managing Director',
        image: abhay,
        alt: 'Abhay Singh, managing director of The Wedding Vachan',
    },
];

/** Leadership gets its own section; the crew list leaves them out. */
export const FOUNDER_NAMES = LEADERSHIP.map((f) => f.name.toLowerCase());

export const BEATS = [
    {
        year: '2015',
        title: 'Where it began.',
        body: 'Aman and Suraj start filming weddings together. They have filmed together ever since.', // CONFIRM
        media: 'founders',
    },
    {
        year: '2018',
        title: 'One film travelled.',
        body: 'A love story we shot went further on YouTube than we ever imagined.',
        media: PHOTOS.hritikSonamWide,
        link: 'youtube',
    },
    {
        year: '2020',
        title: 'The studio opens.',
        body: 'Our studio opens in Mumbai, run by the two people who still pick up the camera.',
        media: PHOTOS.anshuAbhishek,
    },
];

export const CONTACT_SHEET = [
    { frame: '12A', ...PHOTOS.anshuAbhishek, circled: true },
    { frame: '13A', ...PHOTOS.nehalRani },
    { frame: '14A', ...PHOTOS.brideEntrance },
    { frame: '15A', ...PHOTOS.aadarshGeet },
    { frame: '16A', ...PHOTOS.groomCelebrates },
    { frame: '17A', ...PHOTOS.hritikSonamWide },
];

// CONFIRM — every line here is a commitment the studio is making in writing.
export const PROMISES = [
    { title: 'Your delivery date, in your contract.', detail: 'Agreed before the wedding, not after.' },
    { title: 'Every ritual. Every relative.', detail: 'Family portraits and the full ceremony.' },
    { title: 'Footage backed up the same night.', detail: 'Two copies before we leave the venue.' },
    { title: 'The people you meet are the people who shoot.', detail: 'No surprise crew on the day.' },
];
