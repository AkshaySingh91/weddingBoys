# Figma AI Prompts — The Wedding Boys Blog & Journal System

> **How to use these prompts**:
> - If you are using **Figma AI ("Make Designs")**, paste the prompt for each screen into the prompt bar.
> - If you are using plugins like **Galileo AI**, **Uizard**, or **Claude/ChatGPT for Figma Tokens**, copy the relevant section below.
> - Each prompt includes exact color hex codes, font specifications, auto-layout instructions, and content hierarchy.

---

## 🎨 Global Design System & Variables Setup Prompt
*(Paste this first if using a Figma AI prompt that accepts styles, or set these as Figma Local Variables/Styles)*

```
Create a luxury editorial Design System for "The Wedding Boys" (India's premier wedding cinematography studio).

Color Tokens:
- Canvas/Background: #FFF7EE (Warm Cream Ivory)
- Surface Cards: #FFFFFF (Pure White)
- Secondary Surface: #FCEEE6 (Warm Blush Linen)
- Surface Gradient End: #FDE9D9 (Peach Sand)
- Primary Accent: #FF6969 (Coral Rose Red)
- Primary Heading: #5E2B17 (Deep Mahogany Red)
- Secondary Heading: #74583E (Bronze Earth Brown)
- Terracotta Accent: #A3603A (Warm Terracotta)
- Pill Fill: #E5BDA7 at 20% opacity (Terracotta Blush)
- Gold Highlight: #FAD7A0 (Warm Gold / Star ratings)
- Body Text: #2F2F2F (Off-Black Charcoal)
- Muted Text: #78716C (Warm Stone Muted)
- Borders: #E5DCD3 (Warm Hairline Border)

Typography Styles:
- Display/Title 1: Playfair Display, Bold, 56px / 64px line-height, letter-spacing -0.02em, color #5E2B17
- Display/Title 2: Playfair Display, SemiBold, 40px / 48px line-height, color #5E2B17
- Headline H1: Playfair Display, Bold, 36px / 44px line-height, color #5E2B17
- Headline H2: Playfair Display, SemiBold, 28px / 36px line-height, color #5E2B17
- Headline H3: Playfair Display, Medium, 22px / 30px line-height, color #74583E
- Body Large: Inter, Regular, 18px / 32px line-height (1.8), color #2F2F2F
- Body Regular: Inter, Regular, 16px / 26px line-height, color #2F2F2F
- Caption/Meta: Inter, Medium, 12px / 16px line-height, uppercase, letter-spacing +0.15em, color #74583E
- Pull-Quote: Playfair Display, Italic, 26px / 40px line-height, color #5E2B17

Card Styling:
- Corner Radius: 20px (rounded-2xl) on cards, 999px on pill badges
- Elevation: Drop shadow 0px 10px 30px -10px rgba(94, 43, 23, 0.08)
- Border: 1px solid #E5DCD3
```

---

## 📱 PROMPT 1: Magazine Hub & Story Directory (`/blogs`)
**Target Artboard**: Desktop (1440px wide, auto-layout vertical, background `#FFF7EE`)

```
Design a luxury magazine index hub webpage for "The Wedding Boys Journal" (URL: /blogs).
Theme: Warm Indian royal luxury editorial — warm ivory cream (#FFF7EE) background with coral rose (#FF6969) and deep mahogany (#5E2B17) accents. NOT dark mode.

Page Layout & Sections (Top to Bottom, 1440px width, centered 1200px container):

1. Editorial Navigation Masthead (Height 80px, sticky top, background #FFF7EE with 1px border #E5DCD3):
   - Left: Serif logo "THE WEDDING BOYS" (Playfair, 20px, bold, #5E2B17) with subtitle "Cinematography Studio" in 9px uppercase. Next to it, a small pill badge "✨ JOURNAL" with #FF6969 text.
   - Center: Category links with subtle hover underlines: "All Stories", "Real Weddings", "Planning Guides", "Cinematography", "Photo Essays".
   - Right: Search magnifying glass icon, "Films" link, and a pill CTA button "Inquire ↗" in coral red (#FF6969, white text, 14px bold, rounded-full).

2. Magazine Issue Header:
   - Centered badge: "THE WEDDING BOYS JOURNAL · ISSUE N° 14" in small caps #74583E with 1px border #E5BDA7.
   - Large Serif H1: "Cinema, Heritage & Real Love Stories" (Playfair Display, 52px, bold, #5E2B17).
   - Subtitle: "Curated wedding films, royal palace destination guides, and visual essays from India’s storytelling wedding cinematographers." (Inter, 16px, #74583E).

3. Live Category & Search Filter Bar:
   - Horizontal auto-layout pill strip:
     * "All (10)" [Active pill: background #FF6969, white text, rounded-full]
     * "Real Weddings (4)" [Inactive pill: white bg, border #E5DCD3, text #74583E, small grey badge]
     * "Planning Guides (2)"
     * "Cinematography (2)"
     * "Photo Essays (2)"
   - Right side: Clean search input pill with magnifying glass icon and placeholder "Search stories, destinations, advice..."

4. Hero Featured Story Spotlight (Large card, white bg #FFFFFF, 20px radius, 1px border #E5DCD3, padding 0):
   - 2-Column Split (55% photo / 45% text):
     * Left Column: High-res photograph of a royal Udaipur palace wedding on Lake Pichola. A badge on top-left of image: "✨ FEATURED STORY" (blush pill with rose text).
     * Right Column (padding 48px):
       - Category & Read time: "REAL WEDDINGS · 6 min read" in coral #FF6969.
       - Title: "A Royal Affair at Lake Pichola: Ananya & Kabir’s 3-Day Celebration" (Playfair 36px bold, #5E2B17).
       - Excerpt: "From sunrise boat arrivals on calm waters to midnight sangeet inside centuries-old marble courtyards, experience Ananya and Kabir's cinematic union at The Leela Palace."
       - Author footer: Avatar circle, "By Akshay Singh", and a pill button "Read Feature →" with coral accent.

5. Curated Two-Column Featured Stories:
   - 2 wide horizontal cards side by side (gap 32px):
     * Card 1: Photography of groom in royal sherwani. Category "CINEMATOGRAPHY · 4 min read". Title "Preserving Emotion for Generations: Why 4K Archival Wedding Films Matter 20 Years Later".
     * Card 2: Photography of bride with floral umbrella. Category "REAL WEDDINGS · 5 min read". Title "Modern Romance Above the Arabian Sea: Tarun & Meera’s Mumbai Rooftop Soirée".

6. Breakout Director Credo Quote Banner (Full-width card, background #5E2B17, rounded-3xl, padding 64px, text-center):
   - Tagline in golden apricot (#FAD7A0, uppercase, 11px): "CINEMATIC CREDO".
   - Huge Serif Quote (Playfair Italic, 28px, white text):
     “A wedding film shouldn't feel like a montage of choreographed poses; it must feel like an emotional heirloom that transports you back to the exact vibration of the room.”
   - Author: "— Akshay Singh, Creative Director, The Wedding Boys Studio" in warm apricot (#FAD7A0).

7. Three-Column Archival Stories Grid (3 cards per row, gap 24px):
   - Each card: White background, rounded-2xl, 1px border #E5DCD3, subtle shadow.
     * 16:10 photography thumbnail with rounded-t-2xl.
     * Category badge pill on top of image.
     * Content area (padding 24px): Playfair 20px bold title, 2-line excerpt in #74583E, author name, and reading time indicator.
   - 6 cards total showing Jaipur palaces, Varanasi dawn wedding, lighting guide, etc.
   - Bottom Pagination: Warm numbered pills: [1 (active #FF6969)], [2], [3], [Next →].

8. The Bi-Weekly Dispatch (Newsletter Footer Card, background #FCEEE6, rounded-3xl, padding 56px):
   - Left: "Cinematic Love Stories, Delivered to Your Inbox" (Playfair 32px #5E2B17) + "Join 12,000 discerning couples receiving curated real wedding films and palace destination guides."
   - Right: Single-line input field (white bg, rounded-full, "Enter your email address...") with a coral red "Subscribe →" button.
```

---

## 💍 PROMPT 2: Template A — Cinematic Real Wedding Feature (`/blogs/[slug]`)
**Target Artboard**: Desktop (1440px wide, auto-layout vertical, background `#FFF7EE`)

```
Design a high-end luxury editorial wedding story layout for "The Wedding Boys Journal" (Cinematic Real Wedding Template).
Theme: Indian Royal Wedding Editorial (Vogue Weddings / Harper's Bazaar aesthetic). Palette: Warm cream (#FFF7EE), coral rose (#FF6969), deep mahogany (#5E2B17), and white (#FFFFFF).

Layout & Components:

1. Breadcrumb Bar:
   - "Home / Journal / Real Weddings / Ananya & Kabir at Lake Pichola" in warm bronze (#74583E).

2. Full-Bleed Anamorphic Hero (Aspect ratio 21:9 or 16:7, edge-to-edge, height 600px):
   - Magnificent wide photograph of bride and groom in royal attire on a palace boat at Lake Pichola at sunset.
   - Dark gradient overlay at the bottom.
   - Overlay Content:
     * Pill badge: "REAL WEDDING FEATURE" in translucent white/blush glass.
     * Main Title: "A Royal Affair at Lake Pichola: Ananya & Kabir" (Playfair 48px bold, white).
     * Metadata line: "Udaipur, Rajasthan · The Leela Palace · 3 Days of Festivities".

3. At-A-Glance Floating Wedding Strip (Card overlapping the hero bottom by 40px, white bg, rounded-2xl, shadow, padding 24px, 4-column layout):
   - Col 1: Icon + "DESTINATION" / "Udaipur, Rajasthan"
   - Col 2: Icon + "VENUE" / "The Leela Palace & Jag Mandir"
   - Col 3: Icon + "SEASON & MOOD" / "Winter Royal Traditional"
   - Col 4: Icon + "CINEMA CREW" / "6-Camera Team + 4K Drone"

4. Wedding Film Teaser Embed Block (Max-width 960px, centered):
   - 16:9 Video Player Facade with 4K badge, play button circle in coral red (#FF6969) with soft pulsing ring, poster image of couple under a floral mandap, and title "Watch Official 4K Wedding Trailer (3:45 min)".

5. Two-Column Story Narrative (Max-width 960px, centered):
   - Chapter 1: "The Serenade of Lake Pichola" (Playfair 30px #5E2B17).
   - Paragraphs in Inter 18px / 1.8 line height with drop-cap initial letter in #FF6969.
   - Two vertical 4:5 wedding stills side-by-side: bride's bridal jewelry close-up + groom adjusting his royal safa.
   - Chapter 2: "The Varmala at Twilight" with candid descriptions of flower shower.

6. Couple's Emotional Testimonial (Card with warm blush #FCEEE6 background, rounded-2xl, padding 40px, left border 4px #FF6969):
   - Large quotation mark in #FF6969.
   - Italic quote: "The Wedding Boys gave us something that feels like a Sanjay Leela Bhansali motion picture, yet remains completely authentic to who we are as a couple. We have watched our trailer over a hundred times."
   - Byline: "— Ananya & Kabir, Udaipur Bride & Groom".

7. Comprehensive Vendor Credits Grid (Card with white bg, 1px border #E5DCD3, rounded-2xl, padding 32px):
   - Title: "THE CURATED WEDDING DIRECTORY" in 14px uppercase bold #5E2B17.
   - 6 clean pill cards (3x2 grid):
     * "Cinematography & Film": The Wedding Boys Studio [Link + Instagram icon]
     * "Venue": The Leela Palace Udaipur [Link]
     * "Bridal Couture": Sabyasachi Mukherjee [Link]
     * "Groom Couture": Tarun Tahiliani [Link]
     * "Wedding Planner": Regal Weddings Rajasthan [Link]
     * "Floral & Decor": Devika Narain & Company [Link]

8. Engagement & Discussion Bar:
   - Like heart button with counter ("148 Loves"), Share buttons (Pinterest, WhatsApp, Twitter, Copy Link).
   - Author card: Akshay Singh, Lead Cinematographer.
   - Comments section with 3 existing comments and an "Add a reflection..." input form.
```

---

## 📖 PROMPT 3: Template B — Editorial & Technical Planning Guide (`/blogs/[slug]`)
**Target Artboard**: Desktop (1440px wide, auto-layout vertical, background `#FFF7EE`)

```
Design an authoritative, elegant masterclass guide webpage for "The Wedding Boys Journal" (Editorial Planning Guide Template).
Topic: "Mastering Wedding Ceremony Lighting: From Golden Hour Pheras to Low-Light Reception".
Theme: Warm cream ivory (#FFF7EE), coral rose (#FF6969), deep mahogany (#5E2B17), and white (#FFFFFF).

Layout & Components:

1. Top Sticky Reading Progress Bar:
   - 3px slim progress bar at the very top of the browser in coral rose (#FF6969) showing 45% progress.

2. Article Header (Centered, max-width 800px, padding-top 48px):
   - Category tag: "WEDDING PLANNING GUIDE" in coral pill #FF6969.
   - Main Title: "Mastering Wedding Ceremony Lighting: From Golden Hour Pheras to Low-Light Receptions" (Playfair 44px bold, #5E2B17).
   - Subtitle: "Lighting separates amateur video from timeless cinema. Here is exactly how to coordinate with your decorator and venue for flattering skin tones and magical mandap atmospheres."
   - Byline strip: Author avatar, "Akshay Singh · September 6, 2026 · 8 min read · 3 Comments".

3. Two-Column Layout (Max-width 1200px, 32px gap):
   
   LEFT COLUMN (Content Area, width 780px):
   - Chapter 1: "Why Ambient Lighting Dictates Film Quality" with rich paragraphs and bold highlights.
   - Pro-Tip Callout Box (bg #FFF7EE, border 1.5px solid #FF6969, padding 20px, rounded-xl):
     * Icon: Lightbulb in #FF6969.
     * Text: "PRO TIP: Avoid direct overhead magenta or neon blue LED lights on the bride and groom during pheras. Request warm tungsten (3200K) or neutral daylight (5600K) spots."
   - Photographic comparison: Good warm mandap lighting vs. harsh uncalibrated spotlights.
   - Chapter 2: "Step-by-Step Lighting Timeline for Indian Ceremonies":
     * 3 Numbered How-To Cards:
       - Step 1: "Sunset Varmala Alignment" (Time: 5:15 PM - 5:45 PM).
       - Step 2: "Baraat Floodlights & Torch Coordination" (Time: 6:30 PM).
       - Step 3: "Mandap Sacred Fire Exposure Calibration" (Time: 8:00 PM).
   - Interactive FAQ Accordion (3 expandable cards with plus/minus icons):
     * Q1: "Will extra camera lights blind our wedding guests?" [Expanded state showing answer]
     * Q2: "Can our videographer work with candlelight only?" [Collapsed]
     * Q3: "What should we tell our wedding decorator about stage spotlights?" [Collapsed]
   
   RIGHT COLUMN (Sticky Sidebar, width 360px):
   - Card 1: Interactive Table of Contents (White bg, rounded-2xl, 1px border #E5DCD3, padding 24px):
     * Title: "ON THIS PAGE" (12px bold uppercase #74583E).
     * Links with active left indicator on current section:
       - 1. Why Ambient Lighting Dictates Cinema [Active, bold #FF6969]
       - 2. The Golden Hour Varmala Window
       - 3. Dealing with Low-Light Reception Stages
       - 4. Questions to Ask Your Decor Lighting Team
       - 5. Frequently Asked Questions
   - Card 2: Wedding Film Consultation Mini-Banner (Warm blush #FCEEE6, rounded-2xl, padding 24px):
     * "Planning a 2026 Destination Wedding?"
     * "Speak directly with our technical director about venue lighting and camera permits."
     * Coral pill button: "Book Creative Consultation →".

4. Footer Discussion & Next Stories:
   - Next/Previous story navigation cards.
   - Reader comments section.
```

---

## 📷 PROMPT 4: Template C — Photo Essay & Visual Feast (`/blogs/[slug]`)
**Target Artboard**: Desktop (1440px wide, auto-layout vertical, background `#FFF7EE`)

```
Design an immersive, photography-first visual essay webpage for "The Wedding Boys Journal" (Photo Essay Template).
Topic: "Sacred Dawn at the Ghats: An Intimate Varanasi Ganga Aarti Wedding".
Theme: Fine-Art Photography Exhibition. Palette: Warm Cream (#FFF7EE), Deep Charcoal (#1C1917), Coral Accent (#FF6969).

Layout & Components:

1. Minimalist Title Masthead (Max-width 800px, centered, padding 64px 0 40px):
   - Category: "PHOTO ESSAY · VARANASI SERIES" in 11px uppercase letter-spaced bronze #74583E.
   - Headline: "Sacred Dawn at the Ghats" (Playfair 48px, #5E2B17).
   - Poetic sub-heading: "Twelve visual fragments capturing an early morning union along the sacred river Ganga."
   - Simple byline: "Photographed on 35mm Leica & Sony Cine · By Akshay Singh".

2. Visual Rhythm Layout (Generous negative space, 48px vertical gaps):
   - Frame 1 (100vw Full-Width Hero): Edge-to-edge panoramic view of sunrise over the Ganges with morning mist, wooden boat, and floral marigolds floating in water.
   - Subtle Caption: "01 — 5:18 AM. The first rays touch the sandstone steps of Assi Ghat." (Inter Italic 13px #74583E, centered).
   
   - Frame 2 & 3 (Side-by-Side Vertical Diptych, width 1100px centered):
     * Left photo (4:5 aspect): Close-up of bride's hands adorned with intricate traditional alta and marigold garlands.
     * Right photo (4:5 aspect): The groom offering holy river water in brass vessels.
     * Shared centered caption below.

   - Frame 4 (Wide Cinematic 2.39:1 Anamorphic Still):
     * The couple taking silent pheras around the brass fire pot as sadhus chant in the background.

   - Frame 5 (Asymmetric 3-Photo Masonry Grid):
     * Left: Vertical portrait of bride's joyful smile through red veil.
     * Right Top: Burning brass aarti lamps held by priests.
     * Right Bottom: Floating clay diyas at dusk.

3. Poetic Reflection Quote:
   - Centered block in Playfair Display (24px, #5E2B17):
     “In Varanasi, love is not merely celebrated between two families; it is blessed by water, fire, and eternity.”

4. Photo Gallery Strip Carousel:
   - Horizontal gallery with thumbnail preview bar and fullscreen lightbox expansion icon.
```

---

## 🖋️ PROMPT 5: Template D — Director's Reflective Journal (`/blogs/[slug]`)
**Target Artboard**: Desktop (1440px wide, auto-layout vertical, background `#FFF7EE`)

```
Design an intimate, contemplative director's essay webpage for "The Wedding Boys Journal" (Director's Journal Template).
Topic: "The Art of the Unposed Moment: Why the Best Wedding Films Feel Like Cinema".
Theme: Intimate, literary, warm parchment canvas (#FFF7EE), single-column reading flow (max-width 680px centered).

Layout & Components:

1. Header:
   - Category pill: "DIRECTOR'S JOURNAL" in blush pill #E5BDA7.
   - Title: "The Art of the Unposed Moment" (Playfair Display 42px bold, #5E2B17).
   - Byline: "Akshay Singh, Creative Director · August 28, 2026 · 5 min read".

2. Reading Canvas (Single column, 680px width, padding 0 20px):
   - Huge classic Drop Cap letter "F" in coral rose (#FF6969) starting the first sentence:
     "For decades, wedding videography meant a director shouting instructions: 'Look here, smile wider, twirl again, fake laugh for the drone!' But true emotion cannot be manufactured on command."
   - Paragraphs in Inter 19px / 1.85 line height, warm charcoal #2F2F2F.
   
   - BTS Polaroid Still:
     * A candid black-and-white or warm 35mm photograph of the director filming quietly with a handheld camera while family members cry during the Vidaai.
     * Caption: "Behind the lens: Stepping back so the family forgets the camera exists."

   - Huge Centered Pull-Quote (No card border, just elegant italic serif typography 30px with coral quotation marks):
     “Directing destroys intimacy. Observing elevates it into cinema.”

   - Narrative text continuing on how waiting for genuine laughter creates unforgettable frames.

3. Director's Technical Gear Footnote:
   - Small warm card at bottom (padding 20px, 1px border #E5DCD3, background #FCEEE6):
     * Title: "CINEMATOGRAPHY CRAFT NOTES" (11px uppercase bold #74583E).
     * Notes: "Shot on Sony FX6 & Leica Summicron primes. Sound captured with Sennheiser MKH50 and wireless micro-lavaliers. Color graded in DaVinci Resolve using custom 35mm Kodak 5207 film emulation."

4. Author Signature & Studio Heritage:
   - Handcrafted script signature in #5E2B17.
   - "Akshay Singh, Founder & Creative Director".
```
