# The Wedding Boys — Blog System Architecture, UI/UX Specification & Figma AI Design Prompt

> **Document Purpose**: This comprehensive specification serves as the authoritative context and master prompt for **Figma AI** (and product design teams) to create world-class, award-winning UI/UX layouts for **The Wedding Boys Journal & Blog System**.
> 
> It provides:
> 1. Complete design token alignment with our public-facing website (warm reddish-cream, terracotta, rose, and deep mahogany tones).
> 2. Full architectural breakdown of our database schemas, content types, and block systems.
> 3. Distinct visual layouts and wireframe structures for different blog templates (Real Weddings, Planning Guides, Photo Essays, Director's Journals, Destination City Guides).
> 4. Explicit step-by-step instructions for Figma AI to generate production-ready auto-layout components, variant states, and responsive screens.

---

## 1. Brand Identity & Public Website Design System

> [!IMPORTANT]
> **Theme Boundary Rule**: The viewer-facing blog MUST NOT adopt the dark obsidian/slate theme of the admin dashboard. It must be an organic, seamless extension of our public brand: warm, romantic, cinematic, celebratory, and rooted in Indian royal heritage and fine-art wedding cinematography.

### 1.1 Color Palette & Design Tokens

| Token Name | Hex Code | Tailwind / Role | UI Application |
| :--- | :--- | :--- | :--- |
| **Canvas Cream (Base)** | `#FFF7EE` | `bg-primary` | Main page background, primary canvas, warm ivory foundation |
| **Blush Linen** | `#FCEEE6` | `bg-[#fceee6]` | Hero background top gradient, card fills, subtle breakout sections |
| **Peach Sand** | `#FDE9D9` | `bg-[#FDE9D9]` | Gradient bottom terminator, soft contrast areas |
| **Warm Rose / Coral Red** | `#FF6969` | `text-[#FF6969]`, `bg-[#FF6969]` | Primary brand accent, star icons, pill badges, active tabs, CTA buttons |
| **Deep Mahogany Red** | `#5E2B17` | `text-[#5E2B17]` | Primary display headlines, H1/H2 titles, strong brand accents |
| **Bronze Brown / Earth** | `#74583E` | `text-secondary_on` | Section titles, subheadings, author bylines, icons |
| **Warm Terracotta** | `#A3603A` | `text-[#A3603A]` | Category tags, pull-quote borders, metadata indicators |
| **Terracotta Blush** | `#E5BDA7` | `bg-primary_on` | Subtle pill fills, hover backgrounds, image frame borders |
| **Warm Apricot Gold** | `#FAD7A0` | `bg-secondary` | Highlight banners, awards, reading progress bar, rating stars |
| **Off-Black Charcoal** | `#1C1917` / `#2F2F2F` | `text-primary`, `text-tertiary_on` | Editorial body copy for maximum readability (never pure `#000000`) |
| **Surface White** | `#FFFFFF` | `bg-white` | Elevated story cards, comment containers, input form fields |
| **Border Muted Warm** | `#E5DCD3` / `#E8D5C4` | `border-[#E5DCD3]` | Subtle hairline dividers, card outlines, table borders |

### 1.2 Typography Hierarchy

- **Display & Headlines (Serif)**:
  - Font Families: `Playfair Display`, `Cinzel`, or `Lora`
  - Personality: Aristocratic, cinematic, timeless, evocative of luxury print editorial (Vogue Weddings, Architectural Digest, Over The Moon).
  - Weights: SemiBold (600), Bold (700).
  - Tracking: `-0.02em` on large headlines; `+0.15em` uppercase on small mastheads.
- **Editorial Body & UI (Sans-Serif)**:
  - Font Families: `Inter` or `Lato`
  - Personality: Clean, highly legible, modern, warm.
  - Weights: Regular (400), Medium (500), SemiBold (600).
  - Line Height: Generous `1.75` to `1.85` for reading ease.
- **Accents & Monograms (Cursive / Script)**:
  - Font Families: `Great Vibes` or `Playfair Italic`
  - Personality: Handcrafted couple signatures, romantic pull-quote openers, issue flourishes.

### 1.3 Surface Elevation & Visual Motifs

- **Soft Organic Radii**: Cards use `rounded-2xl` (16px) or `rounded-3xl` (24px); pills use `rounded-full` (9999px).
- **Warm Glow Shadows**: `0 10px 30px -10px rgba(94, 43, 23, 0.08)` instead of harsh black dropshadows.
- **Borders**: 1px or 1.5px warm borders using `#E5DCD3` or `#E8D5C4` (never harsh grey `#E5E7EB`).
- **Subtle Film Grain**: 4–8% opacity film grain texture overlay to evoke 35mm and 16mm celluloid cinematography.

---

## 2. Blog Data Architecture & What Data We Store

The blog management system is powered by MongoDB and a structured Tiptap JSON AST. Figma AI must understand every field stored in our backend to build complete, functional layouts:

### 2.1 Core Article Record (`BlogPost` Model)

```typescript
interface BlogPost {
  // --- Identifiers & URLs ---
  _id: string;
  title: string;                          // e.g. "A Royal Affair at Lake Pichola: Ananya & Kabir"
  slug: string;                           // URL-safe permalink: "ananya-kabir-royal-destination-wedding"
  previousSlugs: string[];                // For 301 automated redirects
  
  // --- Editorial Content ---
  excerpt: string;                        // 2-3 sentence synopsis for search cards & hero teasers
  content: string;                        // Rendered HTML fallback for SEO crawlers
  contentJson: TiptapAstDocument;         // Canonical JSON AST tree with embedded modular blocks
  
  // --- Media Attachments ---
  coverImage: {
    url: string;                          // High-res CDN URL (WebP/AVIF, 2400px+)
    altText: string;
    caption?: string;
    width: number;
    height: number;
    variants?: { label: string; url: string }[];
  };
  gallery: MediaItem[];                   // 5 to 50 curated high-resolution wedding film stills
  inlineMedia: MediaItem[];               // Inline photography & video clips
  
  // --- Story Categorization ---
  category: "Real Weddings" | "Wedding Planning" | "Cinematography" | "Photo Essays" | "Director's Journal";
  tags: string[];                         // e.g. ["Udaipur", "Lake Pichola", "Leela Palace", "Royal Mandap"]
  keywords: string[];                     // SEO indexing terms
  
  // --- Wedding Specific Metadata (For Real Wedding features) ---
  mood?: "royal" | "romantic" | "bohemian" | "vintage" | "contemporary" | "intimate";
  season?: "Winter 2025" | "Spring 2026" | "Autumn 2025" | "Monsoon Romance";
  venue?: string;                         // e.g. "The Leela Palace, Udaipur"
  style?: string;                         // e.g. "Heritage Royal & Candid Drone"
  budget?: string;                        // Optional luxury tier classification
  testimonial?: string;                   // Direct quote from bride & groom about the film
  
  // --- Author & Credits ---
  author: {
    _id: string;
    name: string;                         // e.g. "Akshay Singh"
    avatar?: string;
    role?: string;                        // e.g. "Creative Director & Lead Cinematographer"
    bio?: string;
  };
  contributors: { role: string; name: string }[];
  
  // --- Structured Sub-Collections (Blocks) ---
  vendorCredits: Array<{
    role: string;                         // e.g. "Cinematography", "Bridal Couture", "Venue", "Decor"
    name: string;                         // e.g. "The Wedding Boys", "Sabyasachi", "The Leela Palace"
    url?: string;
    instagram?: string;                   // e.g. "@sabyasachiofficial"
  }>;
  
  tableOfContents: Array<{
    id: string;                           // Heading anchor: "why-sound-matters"
    text: string;                         // "The Invisible Half of Cinema: Sound & Vows"
    level: 2 | 3;                         // H2 or H3
  }>;
  
  faq: Array<{
    question: string;
    answer: string;
  }>;
  
  howToSteps: Array<{
    name: string;                         // Step Title: "Schedule Sunset Varmala"
    text: string;                         // Instruction text
    image?: string;
  }>;
  
  tips: string[];                         // Bulleted takeaway boxes
  
  // --- Publishing & Analytics ---
  status: "Draft" | "InReview" | "Scheduled" | "Published" | "Archived";
  publishedAt: string;                    // ISO date string
  readingTime: number;                    // Estimated minutes (e.g. 6)
  viewCount: number;
  likeCount: number;
  commentCount: number;
  allowComments: boolean;
  featured: boolean;                      // Pin to magazine hero spotlight
  
  // --- SEO & Search Engine Optimization ---
  metaTitle: string;
  metaDescription: string;
  canonicalUrl?: string;
  focusKeyword?: string;
  seoScore: number;                       // 0 to 100 calculated score
}
```

---

## 3. Modular Content Blocks (What Content Each Blog Contains)

When reading an article, the body is not just walls of plain text. It is constructed from **16 rich, modular design blocks**. Figma AI should create component variants for each:

### 3.1 Typography & Text Blocks
1. **Chapter / Section Headline (H2)**: Deep mahogany (`#5E2B17`), serif, decorative left border line in rose (`#FF6969`).
2. **Sub-heading (H3)**: Bronze brown (`#74583E`), medium weight serif or bold sans.
3. **Editorial Paragraph**: Off-black charcoal (`#2F2F2F`), 18px font size, 1.8 line height, optimal 68-character line length.
4. **Cinematic Pull-Quote**: Centered or 2-column breakout with oversized quotation marks in coral rose (`#FF6969`), italicized Playfair typography, speaker byline, and role.
5. **Key Takeaway / Tip Box**: Warm ivory card (`#FFF7EE`) with terracotta border (`#E5BDA7`), lightbulb/sparkle icon, and highlighted action point.

### 3.2 Media & Visual Blocks
6. **Full-Bleed 16:9 Cinematic Video Embed**: 4K YouTube/Vimeo embed with custom studio facade, play button with pulsing glow, film title overlay, and duration pill.
7. **Single High-Res Photograph Figure**: Aspect ratio 3:2 or 16:10, rounded-2xl corners, subtle warm drop shadow, and centered italic caption with location/camera metadata.
8. **Side-by-Side Dual Still Diptych**: Two complementary 4:5 vertical portrait stills (e.g. bride getting ready + groom waiting), 16px gap, synchronized zoom on hover.
9. **Interactive Photo Essay Masonry / Mosaic**: 3 to 6 curated frames with staggered heights celebrating details: jewelry, sindoor ritual, candlelit dinner, fireworks.
10. **Cinematic Stills Film Strip**: Horizontal scrollable gallery of 2.39:1 anamorphic film stills with left/right drag indicators.

### 3.3 Interactive & Structural Blocks
11. **At-A-Glance Wedding Pill Strip**: Floating card displaying 4 metadata badges: *Destination* (e.g. Udaipur), *Venue* (e.g. The Leela), *Season* (Winter), *Style* (Royal Heritage).
12. **Interactive Table of Contents (TOC)**:
    - Desktop: Sticky right-rail or left-rail navigation with active section highlighting as the reader scrolls.
    - Mobile: Collapsible warm accordion at the top of the article.
13. **Vendor Credits Accordion / Grid**: Clean 3-column pill grid recognizing creative partners (Couture, Decor, Planner, Jewellery, MUA) with outbound links and Instagram tags.
14. **How-To Step Sequence Card**: Numbered circle (`01`, `02`, `03`) in `#FF6969`, step title, explanatory paragraph, and pro-tip badge.
15. **Interactive FAQ Accordion**: Expandable Q&A items with smooth chevron rotation, styled for rich Google FAQPage search snippet eligibility.
16. **Director's Wedding Inquiry CTA**: Warm blush linen banner (`#FCEEE6`) with decorative floral motif, inviting couples to book The Wedding Boys for their wedding dates, featuring an *"Inquire About Your Date"* action button.

### 3.4 Community & Navigation Blocks
17. **Author Credo Card**: Circular director portrait, verified name, bio, and social links.
18. **Next / Previous Story Navigation**: Two wide cards at the bottom showing previous and next stories with thumbnail, title, and directional arrows.
19. **Reader Comments Section**: Threaded discussion list with verified studio responses (`"The Wedding Boys Studio" [Verified Team]` badge in warm mahogany & gold), comment submission form with live validation.
20. **Related Stories 3-Column Carousel**: 3 related posts filtered by same destination or wedding category.

---

## 4. The 5 Distinct Blog Types & Why Their UI Must Differ

A bride reading a 3-day royal palace wedding story requires an emotional, visual, film-like experience. A couple researching drone permits and lighting requires a clear, scannable, structured guide. 

Therefore, **The Wedding Boys Journal features 5 distinct UI layout templates**:

```
                              ┌────────────────────────────────────────────────────────┐
                              │            THE WEDDING BOYS JOURNAL                    │
                              │           (Viewer-Facing Architecture)                 │
                              └────────────────────────────────────────────────────────┘
                                                           │
         ┌───────────────────┬─────────────────────────────┼───────────────────────────┬────────────────────┐
         ▼                   ▼                             ▼                           ▼                    ▼
┌─────────────────┐ ┌─────────────────┐           ┌─────────────────┐         ┌─────────────────┐ ┌───────────────────┐
│ Template 1      │ │ Template 2      │           │ Template 3      │         │ Template 4      │ │ Template 5        │
│ CINEMATIC REAL  │ │ EDITORIAL       │           │ PHOTO ESSAY /   │         │ DIRECTOR'S      │ │ DESTINATION       │
│ WEDDING FEATURE │ │ PLANNING GUIDE  │           │ VISUAL NARRATIVE│         │ JOURNAL / CRAFT │ │ WEDDING CITY HUB│
└─────────────────┘ └─────────────────┘           └─────────────────┘         └─────────────────┘ └───────────────────┘
│ • Full-bleed    │ │ • Sticky TOC    │           │ • 80% imagery   │         │ • Parchment     │ │ • City Map Hero │
│   Couple Hero   │   Sidebar         │           │ • Storytelling  │           Canvas          │ • Curated Palace  │
│ • Wedding Stats │ │ • Scroll Read   │             Captions        │         │ • Monologue     │   Venue Guide     │
│   Pill Strip    │   Progress Line   │           │ • Anamorphic    │           Typography      │ • Golden Hour &   │
│ • Film Trailer  │ │ • How-To Cards  │             2.39:1 Stills   │         │ • Philosophy    │   Weather Table   │
│   Embed         │ │ • FAQ Dropdowns │           │ • Minimalist    │           Pull-Quotes     │ • Local Permits   │
│ • Vendor Table  │ │ • Lead CTA Form │             Copy            │         │ • Camera Gear   │ • Direct Lead CTA │
│ • Couple Quote  │ │ • Tips Callouts │           │ • Fullscreen    │           Sidebar Notes   │                   │
└─────────────────┘ └─────────────────┘           └─────────────────┘         └─────────────────┘ └───────────────────┘
```

---

### Template 1: Cinematic Real Wedding Feature
- **Target Audience**: Brides, grooms, and luxury wedding planners looking for inspiration.
- **Tone & Mood**: Emotional, romantic, grand, cinematic, celebratory.
- **Key UI Layout Components**:
  1. **Full-Bleed Anamorphic Hero**: Massive edge-to-edge cover photograph of the couple with a soft gradient overlay, couple's names in Playfair Display (`Ananya & Kabir`), venue location, and wedding date.
  2. **At-a-Glance Floating Metric Strip**: 4-pill floating glass/cream card below the hero:
     - *Location*: Udaipur, Rajasthan
     - *Venue*: The Leela Palace
     - *Coverage*: 3 Days (Sangeet, Haldi, Varmala, Reception)
     - *Cinematography*: 4K Archival 6-Camera Team + Aerial FPV
  3. **The Wedding Film Teaser (Video Player)**: Prominent 16:9 4K video block with custom rose play button.
  4. **The Love Story Narrative**: Two-column alternating text and imagery chronicling each day.
  5. **Couple's Emotional Reflection**: Full-width warm blush quote block with bride/groom testimonial.
  6. **Comprehensive Vendor Credits Card**: Clean 3-column directory honoring bridal designers (e.g. Sabyasachi, Manish Malhotra), wedding planner, and decor stylist.
  7. **Couple Film Stills Grid**: 6-photo masonry grid showing candid family moments and mandap rituals.

---

### Template 2: Editorial & Destination Planning Guide
- **Target Audience**: Couples in the active planning phase seeking advice on videography, lighting, budgets, timelines, and permits.
- **Tone & Mood**: Authoritative, informative, masterclass-level, elegant, reassuring.
- **Key UI Layout Components**:
  1. **Clean Structured Header**: Centered title, estimated reading time pill, author avatar, date, and category badge (`WEDDING PLANNING GUIDE`).
  2. **Reading Progress Bar**: Slim gold/rose line fixed to the top of the browser that tracks reading depth.
  3. **Two-Column Layout**:
     - *Left Column (Content, 68%)*: Structured body with numbered sections, sub-bullets, and imagery.
     - *Right Column (Sticky Sidebar, 32%)*:
       - Sticky Table of Contents that tracks scroll position.
       - Quick Share buttons (Pinterest, WhatsApp, Copy Link).
       - Lead Capture Mini-Card (*"Planning a destination wedding? Download our timeline checklist"*).
  4. **Pro-Tip & Caution Callout Boxes**: Colored callouts for lighting advice and contract terms.
  5. **Step-by-Step How-To Sequences**: Visual cards with step number, timeline recommendation, and checklist items.
  6. **Interactive FAQ Accordion**: Expandable questions addressing common questions (e.g. *"Do we receive raw footage?"*, *"When should we book?"*).

---

### Template 3: Photo Essay / Visual Narrative
- **Target Audience**: Photography lovers, visual artists, and couples who value aesthetic storytelling over heavy text.
- **Tone & Mood**: Poetic, quiet, high-contrast, breathtaking, immersive.
- **Key UI Layout Components**:
  1. **Minimalist Title Bar**: Quiet headline with subtle date and location tag, letting the photography dominate.
  2. **80% Imagery, 20% Text**: Massive photography showcases with generous negative space (48px+ margins).
  3. **Varied Visual Tempos**:
     - Single 100vw edge-to-edge panoramic frames.
     - Symmetrical vertical pairs (4:5 aspect ratio).
     - Asymmetrical 3-image triptychs with subtle caption tooltips.
  4. **Poetic Story Captions**: Small serif italic captions underneath photos providing poetic narrative context.
  5. **Full-Screen Lightbox View**: Click-to-expand image viewer with dark warm backdrop and high-res zoom.

---

### Template 4: Director's Journal / Cinema Craft
- **Target Audience**: Film enthusiasts, connoisseurs of art, clients interested in the philosophy and artistry of The Wedding Boys.
- **Tone & Mood**: Intimate, reflective, behind-the-lens, philosophical, artisanal.
- **Key UI Layout Components**:
  1. **Parchment Canvas**: Narrower, single-column reading column (`max-w-2xl`, 680px) centered on screen for an intimate book/journal reading feel.
  2. **First-Person Monologue Typography**: Large drop cap initial letter, generous paragraph spacing, warm cream paper background (`#FFF7EE`).
  3. **Behind-the-Scenes (BTS) Polaroids**: Candid photos of cinematographers with 35mm cameras, sound recorders, and director monitors, styled with subtle warm frames.
  4. **Philosophy Credo Pull-Quotes**: Oversized quotes about memory, love, and the transience of time.
  5. **Director's Technical Gear Footnote**: Discreet sidebar noting camera gear (e.g. *Shot on Sony FX6 & Leica Summicron-C lenses*).

---

### Template 5: Destination Wedding City Guide (e.g. Udaipur, Jaipur, Varanasi, Goa)
- **Target Audience**: Couples flying to India or hosting royal destination celebrations.
- **Tone & Mood**: Majestic, celebratory, logistical, inspiring.
- **Key UI Layout Components**:
  1. **City Skyline / Palace Panorama Hero**: Aerial drone capture of the city.
  2. **Curated Palace Venue Comparison Cards**: Cards comparing top palaces (e.g. Taj Lake Palace vs. Oberoi Udaivilas vs. Jag Mandir) with capacity, lighting score, and drone accessibility notes.
  3. **Golden Hour & Weather Matrix**: Table showing best photography timings across seasons.
  4. **Local Tradition & Aarti Film Guide**: Tips on capturing cultural moments (Ganga Aarti, Baraat boat processions).
  5. **Direct Destination Film Booking Banner**: CTA to book our destination crew.

---

## 5. Magazine Index Hub Layout (`/blogs`)

The blog directory page functions like an international luxury publication (Vogue, Vanity Fair, Kinfolk):

```
+---------------------------------------------------------------------------------------+
|  THE WEDDING BOYS  ·  Cinematography Studio  /  ✨ JOURNAL                            |
|  [All Stories (10)]  [Real Weddings (4)]  [Planning Guides (2)]  [Cinematography (2)] |
+---------------------------------------------------------------------------------------+
|                                                                                       |
|                     THE WEDDING BOYS JOURNAL  ·  ISSUE N° 14                          |
|                   Cinema, Heritage & Real Love Stories                                |
|   Curated wedding films, royal palace destination guides, and visual essays from      |
|                      India’s storytelling wedding cinematographers.                   |
|                                                                                       |
|   [ All (10) ] [ Real Weddings (4) ] [ Planning Guides (2) ]  [ 🔍 Search stories... ]|
|                                                                                       |
+---------------------------------------------------------------------------------------+
|  +-------------------------------------------------+  +----------------------------+  |
|  |                                                 |  | REAL WEDDINGS · 6 min read |  |
|  |          HERO SPOTLIGHT ARTICLE                 |  |                            |  |
|  |          (16:10 High-Res Imagery)               |  | A Royal Affair at Lake     |  |
|  |                                                 |  | Pichola: Ananya & Kabir    |  |
|  |   [✨ FEATURED STORY BADGE]                      |  |                            |  |
|  |                                                 |  | From sunrise boat arrivals |  |
|  |                                                 |  | to candlelit pheras...     |  |
|  |                                                 |  |                            |  |
|  |                                                 |  | By Akshay Singh  [Read ->] |  |
|  +-------------------------------------------------+  +----------------------------+  |
+---------------------------------------------------------------------------------------+
|                                                                                       |
|  TWO-COLUMN FEATURED STORIES:                                                         |
|  +---------------------------------------+   +-------------------------------------+  |
|  | [ Image ]                             |   | [ Image ]                           |  |
|  | CINEMATOGRAPHY · 4 min read           |   | REAL WEDDINGS · 8 min read          |  |
|  | Preserving Emotion for Generations:   |   | Modern Romance Above the Arabian    |  |
|  | Why 4K Archival Films Matter 20 Yrs   |   | Sea: Tarun & Meera's Rooftop Soirée |  |
|  +---------------------------------------+   +-------------------------------------+  |
|                                                                                       |
+---------------------------------------------------------------------------------------+
|                                                                                       |
|  DIRECTOR CREDO PULL-QUOTE BANNER (Full-width deep warm mahogany #5E2B17 or Obsidian):|
|  “A wedding film shouldn't feel like a montage of choreographed poses; it must feel   |
|   like an emotional heirloom that transports you back to the exact vibration of       |
|   the room.” — Akshay Singh, Creative Director                                        |
|                                                                                       |
+---------------------------------------------------------------------------------------+
|                                                                                       |
|  THREE-COLUMN ARCHIVAL GRID (With filter tabs & search):                              |
|  +-------------------+      +-------------------+      +-------------------+          |
|  | [ Card Image ]    |      | [ Card Image ]    |      | [ Card Image ]    |          |
|  | PLANNING GUIDES   |      | PHOTO ESSAYS      |      | CINEMATOGRAPHY    |          |
|  | 10 Questions to   |      | Sacred Dawn at    |      | The Art of the    |          |
|  | Ask Before...     |      | Varanasi Ghats    |      | Unposed Moment    |          |
|  | By Akshay Singh   |      | By Akshay Singh   |      | By Akshay Singh   |          |
|  +-------------------+      +-------------------+      +-------------------+          |
|  [ Card 4 ]                 [ Card 5 ]                 [ Card 6 ]                     |
|                                                                                       |
|                     [ Page 1 ]  [ 2 ]  [ 3 ]  [ Next -> ]                             |
+---------------------------------------------------------------------------------------+
|                                                                                       |
|  THE BI-WEEKLY DISPATCH (Newsletter & Community):                                     |
|  Cinematic Love Stories, Delivered to Your Inbox.                                     |
|  [ Enter your email address... ]  [ Subscribe Button (Coral Red #FF6969) ]            |
+---------------------------------------------------------------------------------------+
```

---

## 6. Complete Figma AI Prompt Instructions

Use the following exact instructions when generating designs in Figma AI:

```markdown
### FIGMA AI MASTER PROMPT: THE WEDDING BOYS EDITORIAL BLOG SYSTEM

Role: You are an award-winning Principal Luxury Design Systems Architect specializing in high-fashion, cinema, and editorial publications (Vogue, Kinfolk, Architectural Digest, A24).

Task: Design the complete responsive UI/UX system for "The Wedding Boys Journal" (Viewer-Facing Blog & Magazine Platform for India's premier wedding cinematography studio).

Theme & Color Palette Constraints (CRITICAL):
- DO NOT use generic grey/black admin dashboard themes.
- DO NOT use plain bootstrap colors.
- Use our signature warm romantic palette:
  * Canvas: Warm Cream Ivory (#FFF7EE) and Blush Linen (#FCEEE6)
  * Accents: Coral Rose Red (#FF6969) and Warm Terracotta (#A3603A)
  * Headings: Deep Mahogany Red (#5E2B17) in Playfair Display (Serif)
  * Body: Off-black charcoal (#2F2F2F) in Inter (Sans-serif) at 18px / 1.8 line-height
  * Borders & Cards: Soft warm ivory white (#FFFFFF) with warm borders (#E5DCD3) and subtle glow shadows.

Deliverables to Generate:
1. Magazine Hub Screen (/blogs):
   - Issue Masthead with Issue N° 14 badge and romantic serif title.
   - Filter pill navigation bar with active count badges (All 10, Real Weddings 4, Guides 2, Photo Essays 2).
   - Hero spotlight feature card (55% photo / 45% editorial synopsis).
   - 2-Column featured story spotlight cards.
   - Breakout cinematic quote card in deep mahogany with golden script accents.
   - 3-Column archival story grid with hover state cards, badges, reading times, and author bylines.
   - Newsletter subscription banner with single-field input and coral CTA button.

2. Five Distinct Article Detail Layouts (/blogs/[slug]):
   - Template A: "Cinematic Real Wedding" — Full-bleed couple hero, 4-stat floating pill strip, 4K film embed, ceremony storytelling, couple reflection quote, and 3-column vendor credits grid.
   - Template B: "Editorial Planning Guide" — Two-column masterclass layout, sticky scroll-aware TOC sidebar, tip callout boxes, How-To steps, and FAQ accordions.
   - Template C: "Photo Essay" — Minimalist headline, 80% photography with 2.39:1 anamorphic stills, side-by-side portrait diptychs, and poetic captions.
   - Template D: "Director's Journal" — Bookish single-column reading canvas (680px max-width), drop caps, BTS film camera polaroids, and philosophical pull-quotes.
   - Template E: "Destination City Guide" — Palace venue comparison cards, golden-hour schedule matrix, and direct booking CTA.

3. Shared Component Kit:
   - Dedicated Journal Navigation Bar (Brand masthead, category links, search icon, "Inquire" button).
   - Real-time Scroll Reading Progress Line (fixed top bar).
   - Interactive Comment Section (comment card, verified studio badge, nested replies, submission form).
   - Next/Previous Story Footer Cards.
   - Mobile Responsive Views (390px iPhone viewport with collapsible navigation drawer).

Design Standards:
- 8pt grid system (8, 16, 24, 32, 48, 64, 96).
- Auto-layout on all frames and cards.
- Proper component variants for states (Default, Hover, Active, Focus, Disabled).
- High-resolution photographic wedding imagery with authentic Indian bridal and palace aesthetics.
```

---

## 7. Summary & Next Steps for the Team

1. **Copy the prompt above** directly into **Figma AI** or use it as the design brief for your Figma design file.
2. **Review Auto-Layout Frames**: Ensure all components respect the `#FFF7EE` (Cream) and `#FF6969` (Coral Rose) color tokens.
3. **Check Responsive Variants**: Inspect desktop (1440px), tablet (768px), and mobile (390px) artboards.
4. **Implement in Code**: Once the Figma frames are finalized, our modular React template engine in `Next-Frontend/lib/blog/templates/` is already structured to map directly to these 5 layout types with 100% fidelity.
