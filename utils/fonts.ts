// fonts.ts
import { Russo_One, Exo_2 } from 'next/font/google';

export const russoOne = Russo_One({
  subsets: ['latin'],
  variable: '--font-russo-one',
  weight: ['400'],
});

export const exo2 = Exo_2({
  subsets: ['latin'],
  variable: '--font-exo-2',
  weight: ['100', '200', '300', '400', '500', '600', '700', '800', '900'],
  style: ['normal', 'italic'],
});
