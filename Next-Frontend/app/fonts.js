import {
  Inter,
  Oxygen,
  Playfair_Display,
  Lato,
  Cinzel,
  Great_Vibes,
  DM_Serif_Display,
  Lora,
} from 'next/font/google';

export const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
});

export const oxygen = Oxygen({
  subsets: ['latin'],
  weight: ['400', '700'],
  display: 'swap',
  variable: '--font-oxygen',
});

export const playfair = Playfair_Display({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-playfair',
});

export const lato = Lato({
  subsets: ['latin'],
  weight: ['400', '700'],
  display: 'swap',
  variable: '--font-lato',
});

export const cinzel = Cinzel({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-cinzel',
});

export const greatVibes = Great_Vibes({
  subsets: ['latin'],
  weight: '400',
  display: 'swap',
  variable: '--font-greatvibes',
});

export const dmSerifDisplay = DM_Serif_Display({
  subsets: ['latin'],
  weight: '400',
  display: 'swap',
  variable: '--font-dmserif',
});

export const lora = Lora({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-lora',
});

export const fontVariables = [
  inter.variable,
  oxygen.variable,
  playfair.variable,
  lato.variable,
  cinzel.variable,
  greatVibes.variable,
  dmSerifDisplay.variable,
  lora.variable,
].join(' ');
