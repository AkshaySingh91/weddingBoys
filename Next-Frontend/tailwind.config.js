/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,jsx,ts,tsx}',
    './Component/**/*.{js,jsx,ts,tsx}',
    './Context/**/*.{js,jsx,ts,tsx}',
    // `lib/` holds the ENTIRE blog render layer — every block component and all
    // four story templates — and was not scanned. Any class used only there
    // generated no CSS, so those files were styled purely by coincidence
    // wherever a class also happened to appear under app/. Measured: the
    // Editorial Guide cover carries `aspect-[16/8]`, that rule was absent from
    // the stylesheet, and the cover rendered 960x0 — invisible on a live post.
    './lib/**/*.{js,jsx,ts,tsx}',
    './Hooks/**/*.{js,jsx,ts,tsx}',
  ],
  theme: {
    screens: {
      sm: '640px',
      // => @media (min-width: 640px) { ... }
      md: '720px',
      // => @media (min-width: 768px) { ... }
      lg: '970px',
      // => @media (min-width: 1024px) { ... }
      xl: '1280px',
      // => @media (min-width: 1280px) { ... }
      '2xl': '1536px',
      // => @media (min-width: 1536px) { ... }
    },
    extend: {
      /**
       * Values the codebase already asks for by their Tailwind v4 names.
       *
       * This project is on Tailwind 3.4, where `shadow-xs`, `scale-102`,
       * `duration-600`, `blur-xs` and `aspect-4/5` match nothing and compile to
       * no CSS at all — so a shadow or a hover zoom simply never appeared, with
       * no error anywhere. Defining them here keeps the design intent (a 2%
       * hover zoom is deliberately subtler than v3's nearest option, 5%) instead
       * of rewriting two dozen call sites to different values.
       *
       * scripts/check-tailwind-classes.mjs reads this config, so anything
       * defined here stops being reported and anything new that isn't gets
       * caught at build time.
       */
      scale: { 102: '1.02', 103: '1.03', 104: '1.04' },
      transitionDuration: { 600: '600ms' },
      boxShadow: { xs: '0 1px 2px 0 rgb(0 0 0 / 0.05)', '2xs': '0 1px 0 0 rgb(0 0 0 / 0.05)' },
      blur: { xs: '2px' },
      aspectRatio: { '4/5': '4 / 5', '3/4': '3 / 4', '4/3': '4 / 3' },
      backgroundColor: {
        primary: '#FFF7EE',
        primary_on: '#E5BDA7',
        secondary: '#FAD7A0',
        secondary_on: '#74583E',
        tertiary: '#5E6572',
        tertiary_on: '#2F2F2F',
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'ui-sans-serif', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
        primary: ['var(--font-inter)', 'sans-serif'],
        serif: ['var(--font-playfair)', 'var(--font-dmserif)', 'Georgia', 'serif'],
        playfair: ['var(--font-playfair)', 'serif'],
        lato: ['var(--font-lato)', 'sans-serif'],
        cinzel: ['var(--font-cinzel)', 'serif'],
        greatvibes: ['var(--font-greatvibes)', 'cursive'],
        vibes: ['var(--font-greatvibes)', 'cursive'],
        dmserif: ['var(--font-dmserif)', 'serif'],
        lora: ['var(--font-lora)', 'serif'],
      },
      colors: {
        primary: '#1C1917',
        studio: {
          canvas: '#F7F4EF',
          surface: '#FFFFFF',
          card: '#FCFAF7',
          border: '#E5DCD3',
          borderStrong: '#C8B9AA',
          ink: '#1C1917',
          inkSecondary: '#44403C',
          inkMuted: '#78716C',
          terracotta: '#A3603A',
          terracottaDark: '#7C4524',
          terracottaLight: '#FAF1E6',
          gold: '#C29555',
          goldLight: '#FDF7EE',
          goldDark: '#966F33',
          obsidian: '#1E1D1B',
          /*
            The brand coral. It was already the site's accent — the Inquire
            button, the Journal pill, the Cinematic template's rules — but only
            ever as the literal `#FF5353` repeated across a dozen files, so it
            could not be referred to or adjusted in one place.
          */
          coral: '#FF5353',
          // The deep brown the masthead and article titles are set in.
          cocoa: '#5E2B17',
          coralDark: '#E04545',
          blush: '#FDEEE9',
        },
      },
      fontSize: {
        mobileHeadlineLarge: '32px',
        mobileHeadlineMedium: '28px',
        mobileHeadlineSmall: '24px',
        mobileBodyLarge: '18px',
        mobileBodyMedium: '16px',
        mobileBodySmall: '14px',

        tabletHeadlineLarge: '40px',
        tabletHeadlineMedium: '32px',
        tabletHeadlineSmall: '28px',
        tabletBodyLarge: '20px',
        tabletBodyMedium: '18px',
        tabletBodySmall: '16px',

        desktopHeadlineLarge: '48px',
        desktopHeadlineMedium: '40px',
        desktopHeadlineSmall: '32px',
        desktopBodyLarge: '22px',
        desktopBodyMedium: '20px',
        desktopBodySmall: '18px',
      },
      lineHeight: {
        mobileHeadlineLarge: '40px',
        mobileHeadlineMedium: '36px',
        mobileHeadlineSmall: '32px',
        mobileBodyLarge: '28px',
        mobileBodyMedium: '24px',
        mobileBodySmall: '20px',

        tabletHeadlineLarge: '48px',
        tabletHeadlineMedium: '40px',
        tabletHeadlineSmall: '36px',
        tabletBodyLarge: '30px',
        tabletBodyMedium: '28px',
        tabletBodySmall: '24px',

        desktopHeadlineLarge: '56px',
        desktopHeadlineMedium: '48px',
        desktopHeadlineSmall: '40px',
        desktopBodyLarge: '32px',
        desktopBodyMedium: '30px',
        desktopBodySmall: '28px',
      },
      scroll: {
        hide: 'scrollbar-width: none; -ms-overflow-style: none;',
      },
    },
  },
  plugins: [require('tailwind-scrollbar'), require('@tailwindcss/typography')],
};
