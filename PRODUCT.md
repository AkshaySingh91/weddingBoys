# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

**Primary: the couple.** Indian couples planning their wedding or pre-wedding shoot find, shortlist and contact the studio themselves. Their parents and elders approve the choice, mainly on trust and budget, so the site has to convince the couple on style and reassure the family in the same visit. Most visitors arrive on a phone.

**Secondary: the studio team.** Founders and staff run the business through the private admin panel (admin.theweddingvachan.com): uploading client work, editing page content, writing journal posts, managing the team, packages and enquiries.

## Product Purpose

The Wedding Vachan is a wedding cinematography and photography studio. This product is its website and business platform:

- **Public site:** the studio's shop window. It shows real films and photographs, destinations, the founders and crew, packages and the journal, and turns visitors into enquiries.
- **Admin panel:** a full CMS so the studio runs the site without a developer.

Success means booked weddings that start as enquiries, with organic Google search as the main source of new clients.

## Positioning

- **The people who run it shoot.** Aman Singh (founder) and Suraj Singh (managing director) are personally on set; the studio is not a booking front for anonymous crews.
- **Films, not recaps.** Story-led cinematic films are the core product; photographs come alongside.
- **Pan-India.** The studio regularly travels for destination weddings beyond its Mumbai base.
- **Vachan means promise.** The name commits the studio to written promises (see Evidence on Hand), a position a competitor cannot copy without making the same commitments.

## Operating Context

- Enquiries arrive through the contact form ("Get Quote") and WhatsApp; WhatsApp is the expected channel for Indian families.
- Packages are priced in INR, currently ₹10,000 to ₹2,10,000, from pre-wedding shoots to multi-day wedding plus pre-wedding combos.
- Destinations with their own pages: Varanasi (a dedicated landing page with a scroll-driven film sequence, and its own Instagram account), Udaipur, Jaipur, Goa.
- Dharaa Event Management is a catering and event-management arm presented under the parent brand.
- The journal publishes real weddings, planning guides and photo essays, mainly for search.
- Studio base: Vasai East, Mumbai.

## Capabilities and Constraints

- Next.js 16 (App Router) public site and admin on one deployment, Express API, MongoDB, media on Cloudflare R2 behind media.theweddingvachan.com.
- Domains: theweddingvachan.com (site), media.theweddingvachan.com (media), admin.theweddingvachan.com (admin; DNS not yet set up as of 2026-11-09).
- Rebrand from "The Wedding Boys" to "The Wedding Vachan" is in progress: name and domains are switched; the logo stays unchanged until a new one is supplied; the YouTube channel is still @The_wedding_boys_.
- Search ranking is a primary constraint: every public page must ship real server-rendered HTML with its own metadata.

## Brand Commitments

- Name: **The Wedding Vachan**.
- Primary colour: **red**, binding (stated by the owner).
- Logo: keep the current logo until a new one is provided.
- Social accounts: Instagram Mumbai `theweddingvachannn`, Instagram Varanasi `theweddingvachan_varanasi`, Facebook "The Wedding Vachan Pan India".

## Evidence on Hand

**Confirmed and publishable:**
- 1000+ weddings filmed and photographed.
- Aman and Suraj have filmed together since 2015; the studio opened in 2020.
- The four Vachan promises: delivery date written in the contract; every ritual and every relative covered; footage backed up the same night (two copies before leaving the venue); the people you meet are the people who shoot.
- Founder: Aman Singh (story and direction). Managing Director: Suraj Singh. Yogesh Dubey is no longer with the studio (team record removed 2026-11-09). Portraits: `Next-Frontend/Asset/Story/`. Aman's portrait was supplied as an AI-generated pose; confirm likeness before using it more widely.
- Crew names, roles and photos come from the team API (`/api/team`).
- Real client films and photographs in R2 (portfolio and client galleries), the YouTube channel, and the Instagram accounts above.

**Not confirmed — do not publish or repeat until the owner confirms:**
- "25 awards won" and "1,500 happy clients" (currently on the home page stats band).
- Any press coverage, Google or WedMeGood ratings, or review counts.
- Testimonials not written by real clients.

**Never use:** photographs carrying another studio's watermark (for example "Gleam"), stock photography, or images of people who are not the studio's clients or crew.

## Product Principles

1. **Trust before taste.** Every number, promise and review must be real and checkable; families decide on trust.
2. **Phone first.** Most visitors are on mobile; the phone experience is the primary one, not a reduction of desktop.
3. **Real work only.** The studio's own films and photographs carry the site.
4. **Every page leads to an enquiry.** WhatsApp and the enquiry form are always within reach.
5. **One brand.** Sub-brands (Dharaa, the Varanasi operation) live under The Wedding Vachan, never as separate identities.

## Accessibility & Inclusion

The existing design system commits to WCAG 2.2 AA: text contrast at AA or better, 44px minimum touch targets, a visible focus state, and reduced-motion fallbacks for scroll and animation work (see `DESIGN-SYSTEM.md`).
