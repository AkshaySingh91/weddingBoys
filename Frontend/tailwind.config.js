/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./public/index.html', "'./src/**/*.{js,jsx,ts,tsx}'"],
  theme: {
    screens: {
      'sm': '50px',
      // => @media (min-width: 640px) { ... }

      'md': '720px',
      // => @media (min-width: 768px) { ... }

      'lg': '970px',
      // => @media (min-width: 1024px) { ... }

      'xl': '1280px',
      // => @media (min-width: 1280px) { ... }

      '2xl': '1536px',
      // => @media (min-width: 1536px) { ... }
    },
    extend: {
      backgroundColor: {
        primary: '#FFF7EE',
        primary_on: '#E5BDA7',
        secondary: '#FAD7A0',
        secondary_on: '#74583E',
        tertiary: '#5E6572',
        tertiary_on: '#2F2F2F',
      },
      fontFamily: {
        primary: 'Oxygen',
      },
      colors: {
        primary: '#2F2F2F',
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
  plugins: [
    require("tailwind-scrollbar"),
  ],
}