import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

async function seedBlogs() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected to MongoDB');

  const Media = mongoose.model('Media', new mongoose.Schema({}, { strict: false }));
  const Admin = mongoose.model('Admin', new mongoose.Schema({}, { strict: false }));
  const BlogPost = (await import('../Models/blogPost.js')).default;

  const admin = await Admin.findOne();
  if (!admin) {
    console.error('No admin found to author posts');
    process.exit(1);
  }

  // Fetch available images and videos
  const allMedia = await Media.find();
  const images = allMedia.filter((m) => m.mediaType === 'Image');
  const videos = allMedia.filter((m) => m.mediaType === 'Video');

  console.log(`Found ${images.length} images and ${videos.length} videos`);

  const img = (idx) => images[idx % images.length]?._id;
  const vid = (idx) => videos[idx % videos.length]?._id;

  const blogs = [
    // 1. Editorial Planning Guide
    {
      title: 'The Ultimate Guide to Destination Wedding Cinematography in India',
      slug: 'capturing-your-love-story-the-ultimate-guide-to-cinematic-wedding-videography-in-india',
      category: 'Wedding Planning',
      template: 'editorial-guide',
      excerpt: 'Everything couples need to know about planning cinematic coverage: destination acoustics, golden hour timelines, drone permits, and ceremony storytelling.',
      coverImage: img(1),
      gallery: [img(2), img(3), img(5)],
      inlineMedia: [img(2), img(3)],
      author: admin._id,
      tags: ['Wedding Planning', 'Cinematography', 'Destination Weddings', 'India'],
      keywords: ['wedding videography india', 'destination wedding film', 'cinematic wedding guide', 'udaipur wedding video'],
      metaTitle: 'The Ultimate Guide to Destination Wedding Cinematography in India | The Wedding Boys',
      metaDescription: 'Complete masterclass on planning wedding films in India. Timelines, sound recording, drone permits, and lighting guides.',
      readingTime: 6,
      seoScore: 96,
      status: 'Published',
      isPublished: true,
      publishedAt: new Date('2026-08-15T10:00:00Z'),
      views: 1420,
      tableOfContents: [
        { id: 'why-cinematic-matters', text: 'Why Cinematic Storytelling Outlasts Traditional Coverage', level: 2 },
        { id: 'mastering-timelines', text: 'Sculpting the Timeline for Natural Golden Hour Light', level: 2 },
        { id: 'sound-architecture', text: 'The Invisible Half of Cinema: Sound & Vows', level: 2 },
        { id: 'drone-aerials', text: 'Drone Coverage in Heritage Palaces: What to Expect', level: 2 },
        { id: 'essential-checklist', text: 'Curated 5-Step Planning Checklist for Couples', level: 2 },
      ],
      faq: [
        {
          question: 'How early should we book our wedding cinematographers?',
          answer: 'For prime Indian destination wedding dates (October to March), couples typically secure their cinematic team 9 to 14 months in advance.'
        },
        {
          question: 'Do you provide raw footage alongside edited films?',
          answer: 'Yes, we provide master archival SSDs containing all unedited 4K/6K camera rushes alongside the teaser, trailer, and extended documentary feature.'
        },
        {
          question: 'How do you coordinate with still photographers?',
          answer: 'We coordinate pre-event timeline schedules so neither team blocks key sightlines, allowing candid, unobtrusive captures throughout the mandap rituals.'
        }
      ],
      howToSteps: [
        { name: 'Schedule Sunset Varmala', text: 'Position the varmala 45 minutes before nautical twilight for warm, flattering skin tones.' },
        { name: 'Pin Microphones to Groom & Pandit', text: 'Wireless lavalier microphones ensure Sanskrit mantras and emotional vows are crystal clear.' },
        { name: 'Reserve Dedicated Golden Hour Session', text: 'Allow 30 uninterrupted minutes between the baraat and pheras for cinematic portrait movements.' }
      ],
      vendorCredits: [
        { role: 'Cinematography', name: 'The Wedding Boys', url: 'https://theweddingboys.in' },
        { role: 'Curated Venues', name: 'Rajasthan Heritage Castles' }
      ],
      content: `<h2>Why Cinematic Storytelling Outlasts Traditional Coverage</h2><p>Your wedding day is an emotional whirlwind of fleeting glances: the gentle tremor in the father's hand during the kanyadaan, the burst of laughter over joota chupai, and the quiet tear that falls during the bidaai. While still photographs freeze individual seconds, cinematic filmmaking captures the rhythm, cadence, and breath of your celebration.</p><p>Unlike traditional videography which logs hours of static tripod recording, modern cinematic wedding films treat your union like high-art cinema. Every frame is graded in tailored 3D LUTs, accompanied by bespoke soundscapes crafted from real vows, family toasts, and ambient courtyard flutes.</p><h2>Sculpting the Timeline for Natural Golden Hour Light</h2><p>Lighting is the lifeblood of cinematic motion picture. When planning your palace courtyard or beach mandap, align key moments with the golden hour. A pheras ceremony bathed in soft 5500K natural sunlight creates a dreamy halo around the sacred fire that no artificial light can replicate.</p><h2>The Invisible Half of Cinema: Sound & Vows</h2><p>George Lucas famously noted that sound is 50 percent of the movie-going experience. In Indian weddings, where dhol beats and chants fill the air, directional hypercardioid audio ensures that the whispered exchange between bride and groom stands out with poignant intimacy.</p>`,
      contentJson: {
        type: 'doc',
        content: [
          {
            type: 'heading',
            attrs: { level: 2 },
            content: [{ type: 'text', text: 'Why Cinematic Storytelling Outlasts Traditional Coverage' }]
          },
          {
            type: 'paragraph',
            content: [{ type: 'text', text: 'Your wedding day is an emotional whirlwind of fleeting glances: the gentle tremor in the father’s hand during the kanyadaan, the burst of laughter over joota chupai, and the quiet tear that falls during the bidaai. While still photographs freeze individual seconds, cinematic filmmaking captures the rhythm, cadence, and breath of your celebration.' }]
          },
          {
            type: 'paragraph',
            content: [{ type: 'text', text: 'Unlike traditional videography which logs hours of static tripod recording, modern cinematic wedding films treat your union like high-art cinema. Every frame is graded in tailored 3D LUTs, accompanied by bespoke soundscapes crafted from real vows, family toasts, and ambient courtyard flutes.' }]
          },
          {
            type: 'blockquote',
            content: [{ type: 'paragraph', content: [{ type: 'text', text: '“A great wedding film isn’t a montage of poses; it is an heirloom that allows your grandchildren to hear the exact tone of your voice when you promised forever.”' }] }]
          },
          {
            type: 'heading',
            attrs: { level: 2 },
            content: [{ type: 'text', text: 'Sculpting the Timeline for Natural Golden Hour Light' }]
          },
          {
            type: 'paragraph',
            content: [{ type: 'text', text: 'Lighting is the lifeblood of cinematic motion picture. When planning your palace courtyard or beach mandap, align key moments with the golden hour. A pheras ceremony bathed in soft 5500K natural sunlight creates a dreamy halo around the sacred fire that no artificial light can replicate.' }]
          },
          {
            type: 'bulletList',
            content: [
              { type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Schedule couple portraits 45 minutes before sunset for warm ambient glow.' }] }] },
              { type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Ensure the mandap is open to the sky or backed by lake reflections rather than direct floodlights.' }] }] },
              { type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Coordinate with your planner to dim house halogens during the couple entrance.' }] }] }
            ]
          },
          {
            type: 'heading',
            attrs: { level: 2 },
            content: [{ type: 'text', text: 'The Invisible Half of Cinema: Sound & Vows' }]
          },
          {
            type: 'paragraph',
            content: [{ type: 'text', text: 'Sound is half of the film. In Indian weddings, where dhol beats and crowd cheers fill the atmosphere, directional hypercardioid audio ensures that the whispered exchange between bride and groom stands out with poignant intimacy.' }]
          }
        ]
      }
    },

    // 2. Cinematic Real Wedding — Udaipur
    {
      title: 'A Royal Affair at Lake Pichola: Ananya & Kabir’s 3-Day Celebration in Udaipur',
      slug: 'ananya-kabir-royal-destination-wedding-lake-pichola-udaipur',
      category: 'Real Weddings',
      template: 'cinematic-real-wedding',
      excerpt: 'From sunrise boat arrivals on calm waters to a midnight Sangeet inside marble courtyards, experience Ananya and Kabir’s breathtaking Udaipur wedding film.',
      coverImage: img(5),
      gallery: [img(1), img(3), img(7), img(9)],
      inlineMedia: [img(5), img(7)],
      author: admin._id,
      tags: ['Real Weddings', 'Udaipur', 'Palace Weddings', 'Rajasthan', 'Luxury Weddings'],
      keywords: ['udaipur real wedding', 'lake pichola wedding film', 'taj lake palace wedding', 'royal indian wedding'],
      metaTitle: 'Ananya & Kabir: Royal Udaipur Wedding Film | The Wedding Boys',
      metaDescription: 'Step inside Ananya and Kabir’s 3-day royal palace wedding in Udaipur. Watch the full cinematic trailer and explore wedding inspiration.',
      readingTime: 5,
      seoScore: 98,
      status: 'Published',
      isPublished: true,
      publishedAt: new Date('2026-08-20T12:00:00Z'),
      views: 3180,
      tableOfContents: [
        { id: 'the-setting', text: 'The Serenade of Lake Pichola', level: 2 },
        { id: 'mehendi-sangeet', text: 'Sufi Melodies & Sangeet Revelry', level: 2 },
        { id: 'varmala-at-twilight', text: 'The Varmala at Twilight', level: 2 },
        { id: 'cinematography-notes', text: 'Cinematic Approach & Visual Palette', level: 2 }
      ],
      weddingDetails: {
        destination: 'Udaipur, Rajasthan',
        venue: 'The Leela Palace & Jag Mandir Island',
        seasonMood: 'Winter Romance • Royal Splendor',
        cinemaCrew: '4 Cinematographers • 2 Aerial Pilots',
        subtitle: 'Ananya & Kabir',
        flourishQuote: 'A three-day royal celebration orchestrated amidst shimmering waters, centuries-old marble archways, and cinematic Sufi melodies.',
        tagline: 'Royal Destination Wedding at Lake Pichola',
        coupleNames: 'Ananya & Kabir'
      },
      featuredVideo: {
        url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        title: 'Ananya & Kabir | Official 4K Wedding Film Trailer',
        duration: '03:45',
        thumbnail: 'https://media.theweddingboys.in/client/67e055820f15ebfba3ee504b/1D7ntEi1Cp3v/orig.jpg'
      },
      testimonial: 'The Wedding Boys gave us something that feels like a Sanjay Leela Bhansali motion picture, yet remains completely authentic to who we are as a couple. We have watched our trailer over a hundred times with tears of joy.',
      testimonialAuthor: 'Ananya & Kabir — The Bride & Groom',
      vendorCredits: [
        { role: 'Cinematography & Film', name: 'The Wedding Boys', url: 'https://theweddingboys.in', instagram: '@theweddingboys' },
        { role: 'Venue', name: 'The Leela Palace & Jag Mandir Island, Udaipur', url: 'https://theleela.com', instagram: '@theleelapalace' },
        { role: 'Bridal Couture', name: 'Sabyasachi Mukherjee', instagram: '@sabyasachiofficial' },
        { role: 'Groom Couture', name: 'Tarun Tahiliani', instagram: '@taruntahiliani' },
        { role: 'Wedding Planning & Decor', name: 'Regal Weddings Rajasthan', instagram: '@regalweddings' },
        { role: 'Bridal Jewelry', name: 'Amrapali Jewels Jaipur', instagram: '@amrapalijewels' },
        { role: 'Makeup & Hair Artist', name: 'Namrata Soni Studio', instagram: '@namratasoni' },
        { role: 'Live Sufi & Folk Artists', name: 'Desert Sounds Ensemble', instagram: '@desertsounds' }
      ],
      content: `<h2>The Setting — Palace of Shimmering Waters</h2><p>Few places in the world command the timeless romance of Udaipur...</p>`,
      contentJson: {
        type: 'doc',
        content: [
          {
            type: 'heading',
            attrs: { level: 2 },
            content: [{ type: 'text', text: 'The Setting — Palace of Shimmering Waters' }]
          },
          {
            type: 'paragraph',
            content: [{ type: 'text', text: 'Few places in the world command the timeless, ethereal romance of Udaipur. When Ananya and Kabir chose Lake Pichola as the canvas for their three-day royal union, our cinema team knew every frame needed to reflect the quiet majesty of the Aravali hills juxtaposed with the lively warmth of their families. From the moment the morning mist lifted above the Jag Niwas palace to the soft lapping of water against stone steps, the destination breathed poetry into our lenses.' }]
          },
          {
            type: 'paragraph',
            content: [{ type: 'text', text: 'The couple envisioned an intimate yet grand celebration where heritage architecture would serve as a living character in their wedding film rather than merely a decorative backdrop. Every courtyard, carved jharokha, and lotus pond was carefully scouted during pre-production to anticipate golden hour reflections and ambient palace acoustics.' }]
          },
          {
            type: 'blockquote',
            content: [{ type: 'paragraph', content: [{ type: 'text', text: '“Udaipur doesn’t just host a wedding; it bestows upon it the dignity of centuries of royal love stories and architectural romance.”' }] }]
          },
          {
            type: 'photoGallery',
            attrs: {
              layout: 'grid-2',
              images: [
                { url: 'https://media.theweddingboys.in/review/sMAWYBQgJEWB/orig.jpg', alt: 'Ananya in bridal ivory couture', caption: 'Ananya in handcrafted bridal ivory couture adorned with emerald heirlooms' },
                { url: 'https://media.theweddingboys.in/review/Nou40WfY3Pvu/orig.jpg', alt: 'Sunlit marble corridor overlooking Lake Pichola', caption: 'The sunlit marble corridor overlooking the calm waters of Lake Pichola' }
              ]
            }
          },
          {
            type: 'heading',
            attrs: { level: 2 },
            content: [{ type: 'text', text: 'The Procession & Sangeet Revelry' }]
          },
          {
            type: 'paragraph',
            content: [{ type: 'text', text: 'The second evening awakened the palace with the resonant rhythm of Rajasthani dholaks, soulful Sufi verses, and hundreds of shimmering chandeliers. Guests arrived via royal wooden shikaras adorned with fresh marigolds and tuberose garlands, serenaded by folk artists whose sarangi melodies carried across the lake breeze.' }]
          },
          {
            type: 'photoGallery',
            attrs: {
              layout: 'grid-1',
              images: [
                { url: 'https://media.theweddingboys.in/client/67e05bb60f15ebfba3ee509b/sGZNN2jIaQma/orig.jpg', alt: 'Courtyard sangeet under starry skies', caption: 'The lantern-lit courtyard sangeet under starry Rajasthani night skies' }
              ]
            }
          },
          {
            type: 'heading',
            attrs: { level: 2 },
            content: [{ type: 'text', text: 'The Twilight Varmala at Jag Mandir' }]
          },
          {
            type: 'paragraph',
            content: [{ type: 'text', text: 'As dusk settled in shades of deep indigo and amber, the wedding procession crossed the illuminated waters toward Jag Mandir Island. Over two thousand brass oil diyas floated gently across the lake surface, casting an ethereal glow upon Kabir as he awaited his bride beneath a mandap woven of cascading white jasmine and blush roses.' }]
          },
          {
            type: 'photoGallery',
            attrs: {
              layout: 'grid-2',
              images: [
                { url: 'https://media.theweddingboys.in/client/67e05bb60f15ebfba3ee509b/POyAD5Y51q_E/orig.jpg', alt: 'Sacred saat phere at twilight', caption: 'The sacred saat phere around the holy agni at twilight' },
                { url: 'https://media.theweddingboys.in/client/67e055820f15ebfba3ee504b/1D7ntEi1Cp3v/orig.jpg', alt: 'Ananya and Kabir wedding portrait', caption: 'Pure joy as Ananya and Kabir step forward into their new beginning' }
              ]
            }
          }
        ]
      }
    },

    // 3. Photo Essay — Varanasi
    {
      title: 'Sacred Dawn on the Ghats: A Sunrise Ganga Aarti Intimate Wedding',
      slug: 'sacred-dawn-varanasi-intimate-ganga-aarti-wedding',
      category: 'Photo Essays',
      template: 'photo-essay',
      excerpt: 'Twenty-four close family members, morning mist over the river Ganga, and brass bell chants: a photographic journey into an unhurried Varanasi ceremony.',
      coverImage: img(9),
      gallery: [img(11), img(13), img(15), img(17)],
      inlineMedia: [img(9), img(11)],
      author: admin._id,
      tags: ['Photo Essays', 'Varanasi', 'Intimate Weddings', 'Spiritual Weddings', 'Candid Photography'],
      keywords: ['varanasi wedding photo essay', 'ganga aarti wedding', 'intimate wedding varanasi', 'candid wedding photographer'],
      metaTitle: 'Sacred Dawn on the Ghats: A Varanasi Photo Essay | The Wedding Boys',
      metaDescription: 'A visual celebration of love in the spiritual capital of India. Explore our photo essay of an intimate Ganga Aarti dawn wedding.',
      readingTime: 3,
      seoScore: 92,
      status: 'Published',
      isPublished: true,
      publishedAt: new Date('2026-08-25T08:00:00Z'),
      views: 2450,
      content: `<h2>The Golden Mist of Ahilya Ghat</h2><p>At 5:15 AM, the city of Varanasi breathes in silence. Before the morning boatmen take their oars, Meenakshi and Dev tied their sacred knot under the stone pillars of Ahilya Ghat.</p><p>There were no amplifiers, no artificial floodlights, and no choreographed rehearsals. Only the deep hum of Vedic shlokas chanted by Vedic scholars and the soft orange warmth of brass brass lamps reflecting against sacred waters.</p>`,
      contentJson: {
        type: 'doc',
        content: [
          {
            type: 'heading',
            attrs: { level: 2 },
            content: [{ type: 'text', text: 'The Golden Mist of Ahilya Ghat' }]
          },
          {
            type: 'paragraph',
            content: [{ type: 'text', text: 'At 5:15 AM, the city of Varanasi breathes in silence. Before the morning boatmen take their oars, Meenakshi and Dev tied their sacred knot under the stone pillars of Ahilya Ghat.' }]
          },
          {
            type: 'paragraph',
            content: [{ type: 'text', text: 'There were no amplifiers, no artificial floodlights, and no choreographed rehearsals. Only the deep hum of Vedic shlokas chanted by Vedic scholars and the soft orange warmth of brass lamps reflecting against sacred waters.' }]
          },
          {
            type: 'blockquote',
            content: [{ type: 'paragraph', content: [{ type: 'text', text: '“In Varanasi, the river is the witness, and the bells are the benediction.”' }] }]
          }
        ]
      }
    },

    // 4. Minimal Journal — Director's Note
    {
      title: 'The Art of the Unposed Moment: Why the Best Wedding Films Feel Like Cinema',
      slug: 'the-art-of-the-unposed-moment-directors-journal',
      category: 'Cinematography',
      template: 'minimal-journal',
      excerpt: 'A reflection on modern documentary wedding filmmaking. Why posing stiffens memories and how observing in stillness produces timeless cinema.',
      coverImage: img(13),
      gallery: [img(13), img(14)],
      inlineMedia: [img(13)],
      author: admin._id,
      tags: ['Cinematography', 'Director Journal', 'Philosophy', 'Craft'],
      keywords: ['unposed wedding cinema', 'documentary wedding films', 'cinematography philosophy', 'wedding filmmaking craft'],
      metaTitle: 'The Art of the Unposed Moment: A Director’s Journal | The Wedding Boys',
      metaDescription: 'Why directing real couples destroys the magic of weddings. Studio director thoughts on candid wedding documentary cinema.',
      readingTime: 4,
      seoScore: 91,
      status: 'Published',
      isPublished: true,
      publishedAt: new Date('2026-08-28T15:00:00Z'),
      views: 1890,
      content: `<h2>The Fallacy of the Endless Pose</h2><p>For decades, wedding videography meant a director shouting instructions: 'Look here, smile wider, twirl again, fake laugh for the drone!' But true emotion cannot be manufactured on command.</p><p>When you ask a nervous bride to repeat her tears for a second angle, you kill the truth of that second. The cinema we pursue at The Wedding Boys relies on patience. We fade into the architecture. We wait with 85mm primes and quiet breathing until reality unfolds.</p>`,
      contentJson: {
        type: 'doc',
        content: [
          {
            type: 'heading',
            attrs: { level: 2 },
            content: [{ type: 'text', text: 'The Fallacy of the Endless Pose' }]
          },
          {
            type: 'paragraph',
            content: [{ type: 'text', text: 'For decades, wedding videography meant a director shouting instructions: “Look here, smile wider, twirl again, fake laugh for the drone!” But true emotion cannot be manufactured on command.' }]
          },
          {
            type: 'paragraph',
            content: [{ type: 'text', text: 'When you ask a nervous bride to repeat her tears for a second angle, you kill the truth of that second. The cinema we pursue at The Wedding Boys relies on patience. We fade into the architecture. We wait with 85mm primes and quiet breathing until reality unfolds.' }]
          },
          {
            type: 'blockquote',
            content: [{ type: 'paragraph', content: [{ type: 'text', text: '“Directing destroys intimacy. Observing elevates it into cinema.”' }] }]
          },
          {
            type: 'paragraph',
            content: [{ type: 'text', text: 'Twenty years from today, you won’t care about how coordinated your dance routine was. You will care about how your grandmother looked at you from across the dinner table when she thought no one was watching.' }]
          }
        ]
      }
    },

    // 5. Cinematic Real Wedding — Goa
    {
      title: 'Sunset Vows & Coastal Rhythms: Rhea & Siddharth’s Bohemian Goa Celebration',
      slug: 'rhea-siddharth-bohemian-sunset-coastal-wedding-goa',
      category: 'Real Weddings',
      template: 'cinematic-real-wedding',
      excerpt: 'Barefoot vows along Morjim beach, acoustic sundowners, and an electric afterparty under tropical palms. Discover Rhea and Siddharth’s coastal wedding film.',
      coverImage: img(15),
      gallery: [img(15), img(16), img(18)],
      inlineMedia: [img(15), img(16)],
      author: admin._id,
      tags: ['Real Weddings', 'Goa', 'Beach Weddings', 'Destination Weddings', 'Bohemian Weddings'],
      keywords: ['goa wedding film', 'beach wedding cinematography', 'morjim destination wedding', 'boho wedding india'],
      metaTitle: 'Rhea & Siddharth: Bohemian Beach Wedding in Goa | The Wedding Boys',
      metaDescription: 'Experience the relaxed coastal magic of Rhea and Siddharth’s wedding film in Goa. Beach pheras, acoustic sundowners, and wild sangeet moments.',
      readingTime: 4,
      seoScore: 94,
      status: 'Published',
      isPublished: true,
      publishedAt: new Date('2026-08-30T16:00:00Z'),
      views: 2890,
      tableOfContents: [
        { id: 'coastal-canvas', text: 'A Different Pace of Celebration', level: 2 },
        { id: 'barefoot-vows', text: 'Barefoot Vows as the Tide Rolled In', level: 2 },
        { id: 'sound-design', text: 'Capturing Ocean Acoustics & Music', level: 2 }
      ],
      testimonial: 'The film feels exactly like our weekend in Goa — warm, breezy, salty, and completely unpretentious. Every friend who watched it cried and danced.',
      vendorCredits: [
        { role: 'Cinematography', name: 'The Wedding Boys', url: 'https://theweddingboys.in' },
        { role: 'Venue', name: 'Alila Diwa Goa' },
        { role: 'Event Design', name: 'The A-Cube Project' },
        { role: 'Bridal Ensemble', name: 'Arpita Mehta' }
      ],
      content: `<h2>A Different Pace of Celebration</h2><p>Goa brings out an effortless, joyous energy that grand palaces cannot mimic. Rhea and Siddharth wanted their wedding to feel like an extended dinner party with their closest 150 friends.</p><h2>Barefoot Vows as the Tide Rolled In</h2><p>With ocean breezes rustling through bamboo arches and acoustic jazz playing, the couple exchanged vows written on handmade paper. The setting sun painted the sky in shades of guava and gold.</p>`,
      contentJson: {
        type: 'doc',
        content: [
          {
            type: 'heading',
            attrs: { level: 2 },
            content: [{ type: 'text', text: 'A Different Pace of Celebration' }]
          },
          {
            type: 'paragraph',
            content: [{ type: 'text', text: 'Goa brings out an effortless, joyous energy that grand palaces cannot mimic. Rhea and Siddharth wanted their wedding to feel like an extended dinner party with their closest 150 friends.' }]
          },
          {
            type: 'heading',
            attrs: { level: 2 },
            content: [{ type: 'text', text: 'Barefoot Vows as the Tide Rolled In' }]
          },
          {
            type: 'paragraph',
            content: [{ type: 'text', text: 'With ocean breezes rustling through bamboo arches and acoustic jazz playing, the couple exchanged vows written on handmade paper. The setting sun painted the sky in shades of guava and gold.' }]
          }
        ]
      }
    },

    // 6. Editorial Guide — Lighting
    {
      title: 'Mastering Wedding Ceremony Lighting: From Golden Hour Pheras to Midnight Sangeet',
      slug: 'mastering-wedding-ceremony-lighting-golden-hour-to-sangeet',
      category: 'Planning Guides',
      template: 'editorial-guide',
      excerpt: 'Lighting separates amateur footage from cinematic mastery. Here is how to plan your stage, mandap, and reception illumination for flawless camera sensor rendering.',
      coverImage: img(19),
      gallery: [img(19), img(20), img(22)],
      inlineMedia: [img(19)],
      author: admin._id,
      tags: ['Planning Guides', 'Lighting', 'Cinematography Craft', 'Mandap Design'],
      keywords: ['wedding lighting guide', 'mandap lighting for video', 'sangeet stage lighting tips', 'cinematography lighting'],
      metaTitle: 'Mastering Wedding Ceremony Lighting | The Wedding Boys Guide',
      metaDescription: 'The ultimate couple guide to wedding lighting. How color temperature, diffusion, and position transform your cinematic film.',
      readingTime: 6,
      seoScore: 97,
      status: 'Published',
      isPublished: true,
      publishedAt: new Date('2026-09-01T11:00:00Z'),
      views: 1670,
      tableOfContents: [
        { id: 'color-temperature', text: 'The Danger of Mixed Color Temperatures', level: 2 },
        { id: 'the-mandap-trap', text: 'Avoiding the Harsh Overhead Spotlight Trap', level: 2 },
        { id: 'sangeet-haze', text: 'Using Stage Haze & Backlight for Epic Dance Motion', level: 2 },
        { id: 'checklist', text: 'Lighting Brief for Your Decorator', level: 2 }
      ],
      faq: [
        {
          question: 'Why do bright LED wash lights look unflattering in videos?',
          answer: 'Narrow-spectrum RGB LEDs often cast intense magenta or cyan spikes on human skin that are impossible to correct in post-production. Always insist on High-CRI (95+) warm white diodes.'
        },
        {
          question: 'Should we have stage haze or smoke at the Sangeet?',
          answer: 'Light water-based haze catches moving stage beams and creates glorious cinematic depth behind the performers, elevating simple dance acts into concert-scale spectacle.'
        }
      ],
      howToSteps: [
        { name: 'Insist on 3200K Warm Light for Mandap', text: 'Warm tungsten tones complement gold jewelry and traditional Indian fabrics harmoniously.' },
        { name: 'Avoid Down-Facing Green or Purple LEDs', text: 'Color-cast shadows under eyes and chin cannot be fully restored in color grading.' }
      ],
      content: `<h2>The Danger of Mixed Color Temperatures</h2><p>One of the most frequent visual mistakes in Indian wedding decor is mixing cold daylight halogen spots (5600K) with warm tungsten fairy lights (2700K) and blue stage washers. When sensors encounter mixed color temperatures, skin tones suffer.</p><h2>Avoiding the Harsh Overhead Spotlight Trap</h2><p>When powerful par-cans point directly down from the mandap ceiling, they create deep shadows under the eyes and nose. Soft, diffused cross-key lighting from 45-degree angles flatters both bride and groom effortlessly.</p>`,
      contentJson: {
        type: 'doc',
        content: [
          {
            type: 'heading',
            attrs: { level: 2 },
            content: [{ type: 'text', text: 'The Danger of Mixed Color Temperatures' }]
          },
          {
            type: 'paragraph',
            content: [{ type: 'text', text: 'One of the most frequent visual mistakes in Indian wedding decor is mixing cold daylight halogen spots (5600K) with warm tungsten fairy lights (2700K) and blue stage washers. When sensors encounter mixed color temperatures, skin tones suffer.' }]
          },
          {
            type: 'heading',
            attrs: { level: 2 },
            content: [{ type: 'text', text: 'Avoiding the Harsh Overhead Spotlight Trap' }]
          },
          {
            type: 'paragraph',
            content: [{ type: 'text', text: 'When powerful par-cans point directly down from the mandap ceiling, they create deep shadows under the eyes and nose. Soft, diffused cross-key lighting from 45-degree angles flatters both bride and groom effortlessly.' }]
          }
        ]
      }
    },

    // 7. Photo Essay — Jaipur Heritage
    {
      title: 'The Heritage Palaces of Jaipur: Rambagh & Samode Through Our Lens',
      slug: 'heritage-palaces-of-jaipur-rambagh-samode-visual-essay',
      category: 'Photo Essays',
      template: 'photo-essay',
      excerpt: 'Hand-carved sandstone jharokhas, peacock fresco courtyards, and mirror-work ceilings: a visual study in royal Rajputana architecture and bridal grandeur.',
      coverImage: img(23),
      gallery: [img(23), img(24), img(26), img(28)],
      inlineMedia: [img(23), img(24)],
      author: admin._id,
      tags: ['Photo Essays', 'Jaipur', 'Palaces', 'Rajputana', 'Architecture'],
      keywords: ['jaipur wedding photography', 'rambagh palace wedding', 'samode palace photoshoot', 'heritage bridal portraits'],
      metaTitle: 'Heritage Palaces of Jaipur: A Visual Essay | The Wedding Boys',
      metaDescription: 'Explore the architectural majesty of Jaipur’s iconic heritage palaces through the lenses of The Wedding Boys cinematographers.',
      readingTime: 3,
      seoScore: 93,
      status: 'Published',
      isPublished: true,
      publishedAt: new Date('2026-09-02T13:00:00Z'),
      views: 2150,
      content: `<h2>The Symmetry of Rajputana Royalty</h2><p>In Jaipur, architecture is not just a backdrop; it is an active character in the love story. The scalloped arches of Rambagh Palace and the mirror-inlaid Sheesh Mahal of Samode create reflections that belong in classical oil paintings.</p>`,
      contentJson: {
        type: 'doc',
        content: [
          {
            type: 'heading',
            attrs: { level: 2 },
            content: [{ type: 'text', text: 'The Symmetry of Rajputana Royalty' }]
          },
          {
            type: 'paragraph',
            content: [{ type: 'text', text: 'In Jaipur, architecture is not just a backdrop; it is an active character in the love story. The scalloped arches of Rambagh Palace and the mirror-inlaid Sheesh Mahal of Samode create reflections that belong in classical oil paintings.' }]
          }
        ]
      }
    },

    // 8. Editorial Guide — 10 Questions
    {
      title: '10 Critical Questions to Ask Before Booking Your Wedding Cinematographer',
      slug: '10-critical-questions-to-ask-before-booking-wedding-cinematographer',
      category: 'Planning Guides',
      template: 'editorial-guide',
      excerpt: 'Do not sign a contract until you have asked these 10 revealing questions about color grading, music licensing, backup gear, and delivery timelines.',
      coverImage: img(27),
      gallery: [img(27), img(29), img(31)],
      inlineMedia: [img(27)],
      author: admin._id,
      tags: ['Planning Guides', 'Hiring Advice', 'Cinematography', 'Vendor Selection'],
      keywords: ['questions for wedding videographer', 'booking wedding cinematographer', 'wedding film contract checklist'],
      metaTitle: '10 Questions to Ask Your Wedding Cinematographer | The Wedding Boys',
      metaDescription: 'Essential interview checklist before hiring your wedding film team. Music rights, delivery timelines, backup protocols, and editing revisions.',
      readingTime: 7,
      seoScore: 99,
      status: 'Published',
      isPublished: true,
      publishedAt: new Date('2026-09-03T10:00:00Z'),
      views: 3410,
      tableOfContents: [
        { id: 'style-philosophy', text: '1. What is your fundamental storytelling philosophy?', level: 2 },
        { id: 'music-licensing', text: '2. How do you license music for online and social sharing?', level: 2 },
        { id: 'backup-safeguards', text: '3. What redundancy and backup systems do you bring on-site?', level: 2 },
        { id: 'post-production-team', text: '4. Who actually edits the film?', level: 2 },
        { id: 'delivery-guarantees', text: '5. What are the contractually binding delivery deadlines?', level: 2 }
      ],
      faq: [
        {
          question: 'Can we choose all the songs for our wedding film?',
          answer: 'We collaborate closely on musical tastes. However, the best cinematic trailers use licensed independent music or bespoke orchestral scoring to avoid copyright takedowns on YouTube and Instagram.'
        },
        {
          question: 'What happens if a hard drive fails after the wedding?',
          answer: 'Professional studios follow the 3-2-1 backup rule: immediately backing up footage to dual on-site SSDs and syncing to off-site cloud archives within 24 hours of shoot completion.'
        }
      ],
      content: `<h2>1. What is your fundamental storytelling philosophy?</h2><p>Ask the studio whether they see your wedding as a checklist of events or as a character-driven narrative. If their answers focus solely on cameras, lenses, and drone brands rather than family relationships and emotional resonance, keep looking.</p><h2>2. How do you license music for online and social sharing?</h2><p>Many couples find their wedding videos muted or banned on Instagram because their videographer slapped unauthorized commercial pop songs on the soundtrack. A professional studio licenses compositions legally through sound agencies or records live instruments.</p>`,
      contentJson: {
        type: 'doc',
        content: [
          {
            type: 'heading',
            attrs: { level: 2 },
            content: [{ type: 'text', text: '1. What is your fundamental storytelling philosophy?' }]
          },
          {
            type: 'paragraph',
            content: [{ type: 'text', text: 'Ask the studio whether they see your wedding as a checklist of events or as a character-driven narrative. If their answers focus solely on cameras, lenses, and drone brands rather than family relationships and emotional resonance, keep looking.' }]
          },
          {
            type: 'heading',
            attrs: { level: 2 },
            content: [{ type: 'text', text: '2. How do you license music for online and social sharing?' }]
          },
          {
            type: 'paragraph',
            content: [{ type: 'text', text: 'Many couples find their wedding videos muted or banned on Instagram because their videographer slapped unauthorized commercial pop songs on the soundtrack. A professional studio licenses compositions legally through sound agencies or records live instruments.' }]
          }
        ]
      }
    },

    // 9. Cinematic Real Wedding — Mumbai
    {
      title: 'Modern Romance Above the Arabian Sea: Tarun & Meera’s Mumbai Rooftop Soirée',
      slug: 'tarun-meera-modern-skyline-romance-mumbai-rooftop',
      category: 'Real Weddings',
      template: 'cinematic-real-wedding',
      excerpt: 'Chic, contemporary, and deeply personal: a black-tie Mumbai celebration overlooking the glowing skyline of Marine Drive.',
      coverImage: img(32),
      gallery: [img(32), img(34), img(36)],
      inlineMedia: [img(32)],
      author: admin._id,
      tags: ['Real Weddings', 'Mumbai', 'Modern Weddings', 'Black Tie', 'Urban Weddings'],
      keywords: ['mumbai wedding film', 'rooftop wedding marine drive', 'black tie indian wedding', 'modern wedding cinematography'],
      metaTitle: 'Tarun & Meera: Modern Mumbai Skyline Wedding | The Wedding Boys',
      metaDescription: 'Watch Tarun and Meera’s modern black-tie wedding film above Mumbai’s Queen’s Necklace. Contemporary romance captured on cinema primes.',
      readingTime: 4,
      seoScore: 95,
      status: 'Published',
      isPublished: true,
      publishedAt: new Date('2026-09-04T14:00:00Z'),
      views: 2650,
      tableOfContents: [
        { id: 'urban-elegance', text: 'A Distinctly Modern Indian Wedding', level: 2 },
        { id: 'night-grading', text: 'Color Grading the Mumbai Skyline', level: 2 }
      ],
      testimonial: 'The Wedding Boys understood our aesthetic completely. We didn’t want palace pomp; we wanted sleek urban cinema with jazz chords and honest laughter. They delivered beyond our wildest expectations.',
      vendorCredits: [
        { role: 'Cinematography', name: 'The Wedding Boys', url: 'https://theweddingboys.in' },
        { role: 'Venue', name: 'The Taj Mahal Palace, Colaba' },
        { role: 'Event Design', name: 'Devika Narain & Company' }
      ],
      content: `<h2>A Distinctly Modern Indian Wedding</h2><p>Not every grand Indian wedding needs horse carriages or palace fortifications. Tarun and Meera chose a minimalist, black-tie rooftop setting overlooking the Queen’s Necklace in South Mumbai.</p><h2>Color Grading the Mumbai Skyline</h2><p>Capturing deep ocean blues alongside the amber streetlights of Marine Drive demanded our highest dynamic range sensors. In color grading, we dialed in deep obsidian shadows and warm golden highlights that mirrored the city’s electric night pulse.</p>`,
      contentJson: {
        type: 'doc',
        content: [
          {
            type: 'heading',
            attrs: { level: 2 },
            content: [{ type: 'text', text: 'A Distinctly Modern Indian Wedding' }]
          },
          {
            type: 'paragraph',
            content: [{ type: 'text', text: 'Not every grand Indian wedding needs horse carriages or palace fortifications. Tarun and Meera chose a minimalist, black-tie rooftop setting overlooking the Queen’s Necklace in South Mumbai.' }]
          },
          {
            type: 'heading',
            attrs: { level: 2 },
            content: [{ type: 'text', text: 'Color Grading the Mumbai Skyline' }]
          },
          {
            type: 'paragraph',
            content: [{ type: 'text', text: 'Capturing deep ocean blues alongside the amber streetlights of Marine Drive demanded our highest dynamic range sensors. In color grading, we dialed in deep obsidian shadows and warm golden highlights that mirrored the city’s electric night pulse.' }]
          }
        ]
      }
    },

    // 10. Minimal Journal — Archival Legacy
    {
      title: 'Preserving Emotion for Generations: Why 4K Archival Wedding Films Matter 20 Years Later',
      slug: 'preserving-emotion-why-4k-archival-films-matter-twenty-years-later',
      category: 'Cinematography',
      template: 'minimal-journal',
      excerpt: 'Beyond fleeting social media reels, a wedding film is a family heritage document. Why 10-bit color, high-bitrate masters, and uncompressed audio are your legacy.',
      coverImage: img(38),
      gallery: [img(38), img(40)],
      inlineMedia: [img(38)],
      author: admin._id,
      tags: ['Cinematography', 'Archival Legacy', 'Heritage', '4K Master'],
      keywords: ['archival wedding film', 'wedding video preservation', '4k wedding master', 'family heritage cinema'],
      metaTitle: 'Why Archival 4K Wedding Films Matter 20 Years Later | The Wedding Boys',
      metaDescription: 'Reflections on the lasting archival value of wedding motion pictures. Preserving voices, laughter, and heritage for future generations.',
      readingTime: 5,
      seoScore: 92,
      status: 'Published',
      isPublished: true,
      publishedAt: new Date('2026-09-05T09:00:00Z'),
      views: 1980,
      content: `<h2>The Transience of Compressed Social Media</h2><p>In our era of 15-second vertical video clips, it is easy to forget that wedding films were never meant to be disposable content. When Instagram changes algorithms or formats fade away, will your memories still exist?</p><h2>The Weight of Voice and Presence</h2><p>When you sit down with your children twenty years from today, what will matter is not the trending audio track of 2026. What will make you weep is hearing your parents’ voices in uncompressed fidelity, seeing the texture of your mother’s wedding saree in 10-bit color, and witnessing the exact moment your eyes met across the sacred fire.</p>`,
      contentJson: {
        type: 'doc',
        content: [
          {
            type: 'heading',
            attrs: { level: 2 },
            content: [{ type: 'text', text: 'The Transience of Compressed Social Media' }]
          },
          {
            type: 'paragraph',
            content: [{ type: 'text', text: 'In our era of 15-second vertical video clips, it is easy to forget that wedding films were never meant to be disposable content. When Instagram changes algorithms or formats fade away, will your memories still exist?' }]
          },
          {
            type: 'heading',
            attrs: { level: 2 },
            content: [{ type: 'text', text: 'The Weight of Voice and Presence' }]
          },
          {
            type: 'paragraph',
            content: [{ type: 'text', text: 'When you sit down with your children twenty years from today, what will matter is not the trending audio track of 2026. What will make you weep is hearing your parents’ voices in uncompressed fidelity, seeing the texture of your mother’s wedding saree in 10-bit color, and witnessing the exact moment your eyes met across the sacred fire.' }]
          }
        ]
      }
    }
  ];

  console.log(`Prepared ${blogs.length} stories. Upserting into MongoDB...`);

  for (const b of blogs) {
    const existing = await BlogPost.findOne({ slug: b.slug });
    if (existing) {
      await BlogPost.updateOne({ slug: b.slug }, { $set: b });
      console.log(`Updated story: ${b.title} [${b.template}]`);
    } else {
      await BlogPost.create(b);
      console.log(`Created story: ${b.title} [${b.template}]`);
    }
  }

  const totalBlogs = await BlogPost.countDocuments();
  console.log(`\nSuccessfully seeded. Total blogs in database: ${totalBlogs}`);
  process.exit(0);
}

seedBlogs().catch((err) => {
  console.error('Seed error:', err);
  process.exit(1);
});
