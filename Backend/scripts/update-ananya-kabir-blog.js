import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

async function updatePost() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected to MongoDB');

  const BlogPost = (await import('../Models/blogPost.js')).default;
  const Media = (await import('../Models/Media.js')).default;

  const slug = 'ananya-kabir-royal-destination-wedding-lake-pichola-udaipur';

  const updateData = {
    template: 'cinematic-real-wedding',
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
    likeCount: 128,
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
          content: [
            {
              type: 'text',
              text: 'Few places in the world command the timeless, ethereal romance of Udaipur. When Ananya and Kabir chose Lake Pichola as the canvas for their three-day royal union, our cinema team knew every frame needed to reflect the quiet majesty of the Aravali hills juxtaposed with the lively warmth of their families. From the moment the morning mist lifted above the Jag Niwas palace to the soft lapping of water against stone steps, the destination breathed poetry into our lenses.'
            }
          ]
        },
        {
          type: 'paragraph',
          content: [
            {
              type: 'text',
              text: 'The couple envisioned an intimate yet grand celebration where heritage architecture would serve as a living character in their wedding film rather than merely a decorative backdrop. Every courtyard, carved jharokha, and lotus pond was carefully scouted during pre-production to anticipate golden hour reflections and ambient palace acoustics.'
            }
          ]
        },
        {
          type: 'blockquote',
          content: [
            {
              type: 'paragraph',
              content: [
                {
                  type: 'text',
                  text: '“Udaipur doesn\'t just host a wedding; it bestows upon it the dignity of centuries of royal love stories and architectural romance.”'
                }
              ]
            }
          ]
        },
        {
          type: 'photoGallery',
          attrs: {
            layout: 'grid-2',
            images: [
              {
                url: 'https://media.theweddingboys.in/review/sMAWYBQgJEWB/orig.jpg',
                alt: 'Ananya in handcrafted bridal ivory couture',
                caption: 'Ananya in handcrafted bridal ivory couture adorned with emerald heirlooms'
              },
              {
                url: 'https://media.theweddingboys.in/review/Nou40WfY3Pvu/orig.jpg',
                alt: 'Sunlit marble corridor overlooking Lake Pichola',
                caption: 'The sunlit marble corridor overlooking the calm waters of Lake Pichola'
              }
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
          content: [
            {
              type: 'text',
              text: 'The second evening awakened the palace with the resonant rhythm of Rajasthani dholaks, soulful Sufi verses, and hundreds of shimmering chandeliers. Guests arrived via royal wooden shikaras adorned with fresh marigolds and tuberose garlands, serenaded by folk artists whose sarangi melodies carried across the lake breeze.'
            }
          ]
        },
        {
          type: 'paragraph',
          content: [
            {
              type: 'text',
              text: 'Inside the grand Sheesh Mahal courtyard, the energy shifted into an electrifying celebration of dance and heartfelt toasts. Our multi-camera cinema crew operated with prime cine lenses on compact gimbals, gliding between dancers without breaking the authenticity of the laughter and tearful reunions.'
            }
          ]
        },
        {
          type: 'photoGallery',
          attrs: {
            layout: 'grid-1',
            images: [
              {
                url: 'https://media.theweddingboys.in/client/67e05bb60f15ebfba3ee509b/sGZNN2jIaQma/orig.jpg',
                alt: 'The lantern-lit courtyard sangeet under starry skies',
                caption: 'The lantern-lit courtyard sangeet under starry Rajasthani night skies'
              }
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
          content: [
            {
              type: 'text',
              text: 'As dusk settled in shades of deep indigo and amber, the wedding procession crossed the illuminated waters toward Jag Mandir Island. Over two thousand brass oil diyas floated gently across the lake surface, casting an ethereal glow upon Kabir as he awaited his bride beneath a mandap woven of cascading white jasmine and blush roses.'
            }
          ]
        },
        {
          type: 'paragraph',
          content: [
            {
              type: 'text',
              text: 'Ananya\'s walk down the floating glass aisle—accompanied by an original acoustic score composed specifically for their film trailer—hushed the entire gathering into reverent silence. As they exchanged rose garlands, fireworks burst in golden arcs over the Aravali hills, immortalizing a night of pure magic.'
            }
          ]
        },
        {
          type: 'photoGallery',
          attrs: {
            layout: 'grid-2',
            images: [
              {
                url: 'https://media.theweddingboys.in/client/67e05bb60f15ebfba3ee509b/POyAD5Y51q_E/orig.jpg',
                alt: 'The sacred saat phere around the holy agni',
                caption: 'The sacred saat phere around the holy agni at twilight'
              },
              {
                url: 'https://media.theweddingboys.in/client/67e055820f15ebfba3ee504b/1D7ntEi1Cp3v/orig.jpg',
                alt: 'Joy as Ananya and Kabir step forward as husband and wife',
                caption: 'Pure joy as Ananya and Kabir step forward into their new beginning'
              }
            ]
          }
        }
      ]
    },
    content: '<h2>The Setting — Palace of Shimmering Waters</h2><p>Few places in the world command the timeless, ethereal romance of Udaipur...</p>'
  };

  const res = await BlogPost.findOneAndUpdate({ slug }, { $set: updateData }, { new: true });
  console.log('Updated blog post:', res?.title, 'Template:', res?.template);
  console.log('WeddingDetails:', res?.weddingDetails);
  console.log('FeaturedVideo:', res?.featuredVideo);
  console.log('VendorCredits count:', res?.vendorCredits?.length);

  await mongoose.disconnect();
  console.log('Done');
}

updatePost().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
