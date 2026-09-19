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
      /*
        Motion tokens. `600` stays for the blog (out of scope) — it is what keeps
        check-tailwind-classes.mjs from flagging `duration-600` there. A second
        `transitionDuration` key declared below silently overrode it and failed
        the build; same mistake as boxShadow, caught the same way.
      */
      transitionDuration: {
        600: '600ms',
        micro: 'var(--motion-micro)',
        ui: 'var(--motion-ui)',
        entrance: 'var(--motion-entrance)',
        media: 'var(--motion-media)',
        page: 'var(--motion-page)',
      },
      /*
        Elevation on the public site's near-black ground comes from surface
        lightening, not shadow — a drop shadow is close to invisible there. One
        real shadow exists, `overlay`, for genuinely floating chrome.

        `xs` and `2xs` stay: they are v4 spellings that admin uses in 53 places,
        and defining them here is what keeps check-tailwind-classes.mjs from
        flagging them. Declaring a second `boxShadow` key below silently
        overrode these and broke the build — the guard caught it.
      */
      boxShadow: {
        xs: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
        '2xs': '0 1px 0 0 rgb(0 0 0 / 0.05)',
        overlay: '0 24px 64px -12px rgba(42, 27, 18, 0.28)',
        panel: '0 2px 10px -4px rgba(42, 27, 18, 0.14)',
      },
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
      /* One radius set, mapped to component types. Deliberately austere: sharp
         corners read more expensive, and it counters the identical-rounded-cards
         tell. 4 values replacing 10. */
      borderRadius: {
        none: '0',
        control: '2px',
        panel: '4px',
        /* Photographs want more than a panel's 4px — the previous UI used a
           generous rounding on its film cards and was right to. */
        media: '20px',
        pill: '999px',
      },
      zIndex: {
        base: '0', raised: '10', sticky: '100',
        header: '200', overlay: '300', modal: '400', toast: '500',
      },
      maxWidth: {
        prose: '720px',
        content: '1180px',
        wide: '1440px',
      },
      transitionTimingFunction: {
        standard: 'var(--ease-standard)',
        entrance: 'var(--ease-entrance)',
        page: 'var(--ease-page)',
      },
      spacing: {
        section: 'var(--section)',
        'section-tight': 'var(--section-tight)',
        'section-loose': 'var(--section-loose)',
        header: 'var(--header-height)',
      },
      fontFamily: {
        display: ['var(--font-display)', 'Bodoni Moda', 'Didot', 'Times New Roman', 'serif'],
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
        /*
          ── Design-system tokens (DESIGN-SYSTEM.md) ──────────────────────────
          Public-site components consume ONLY these. Values live as CSS custom
          properties in globals.css so utilities and raw CSS cannot diverge.
          The legacy `studio.*` block below stays until Stage 8 — the
          out-of-scope blog still consumes it.
        */
        ground: {
          DEFAULT: 'rgb(var(--ground-rgb) / <alpha-value>)',
          raised: 'rgb(var(--ground-raised-rgb) / <alpha-value>)',
          sunk: 'rgb(var(--ground-sunk-rgb) / <alpha-value>)',
          deep: 'rgb(var(--ground-deep-rgb) / <alpha-value>)',
        },
        ink: {
          DEFAULT: 'rgb(var(--ink-primary-rgb) / <alpha-value>)',
          secondary: 'rgb(var(--ink-secondary-rgb) / <alpha-value>)',
          muted: 'rgb(var(--ink-muted-rgb) / <alpha-value>)',
          onAccent: 'var(--ink-on-accent)',
          onDeep: 'var(--ink-on-deep)',
        },
        accent: {
          DEFAULT: 'rgb(var(--accent-rgb) / <alpha-value>)',
          hover: 'var(--accent-hover)',
          press: 'var(--accent-press)',
          ink: 'rgb(var(--accent-ink-rgb) / <alpha-value>)',
          wash: 'rgb(var(--accent-wash-rgb) / <alpha-value>)',
          tint: 'rgb(var(--accent-tint-rgb) / <alpha-value>)',
        },
        marigold: {
          DEFAULT: 'rgb(var(--marigold-rgb) / <alpha-value>)',
          ink: 'var(--marigold-ink)',
        },
        gold: {
          DEFAULT: 'rgb(var(--gold-rgb) / <alpha-value>)',
          strong: 'rgb(var(--gold-strong-rgb) / <alpha-value>)',
          soft: 'var(--gold-soft)',
        },
        edge: {
          subtle: 'var(--border-subtle)',
          strong: 'var(--border-strong)',
        },
        state: {
          success: 'var(--status-success)',
          error: 'var(--status-error)',
          warning: 'var(--status-warning)',
        },

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
