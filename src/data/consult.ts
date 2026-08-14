import type { ImageSourcePropType } from 'react-native';

/**
 * The Available Astrologers directory (Figma node 180:90120). Like the
 * astrologer detail screen, this frame uses its own greys and pastel pills
 * rather than the app's shared theme, so its palette lives here.
 */
export const consultPalette = {
  /** Cool near-white the frame is drawn on. */
  canvas: '#F5F9F8',
  ink: '#505050',
  inkStrong: '#232323',
  cardBorder: '#CACACA',
  photoBorder: '#EAEAEA',
  chipBorder: '#C4C4C4',
  chipIdleText: '#959595',
  wait: '#FF0C0C',
  free: '#14A50E',
  banner: '#7FD66F',
  callAccent: '#F65C02',
  callBorder: 'rgba(246, 92, 2, 0.4)',
  /** Core and halo of the pulsing "online" bead beside a name. */
  online: '#4EB73B',
  onlineHalo: '#8FD283',
  /** An astrologer who is offline — the bead, and their muted Chat button. */
  offline: '#FF0C0C',
  disabled: '#6C6A6A',
} as const;

export type ConsultMode = 'chat' | 'call';

export type ConsultCategory =
  | 'all'
  | 'love'
  | 'education'
  | 'marriage'
  | 'wealth'
  | 'health';

/** Widths are Figma's own (nodes 180:90145+), so the row measures 373.2. */
export const consultCategories: ReadonlyArray<{
  key: ConsultCategory;
  label: string;
  width: number;
}> = [
  { key: 'all', label: 'All', width: 35 },
  { key: 'love', label: 'Love', width: 48 },
  { key: 'education', label: 'Education', width: 73 },
  { key: 'marriage', label: 'Marriage', width: 68 },
  { key: 'wealth', label: 'Wealth', width: 58 },
  { key: 'health', label: 'Health', width: 54 },
];

export const consultBanner = {
  headline: 'When Will I Get Marriage ?',
  image: require('../assets/images/promo-marriage.png') as ImageSourcePropType,
  slides: 3,
};

/**
 * Each speciality pill carries its own pastel fill and its drawn width
 * (nodes 180:90208+); together with the 2pt gaps the row measures 246.5,
 * which is what clips the "+2" counter against the card's edge.
 */
export const consultTags = [
  { label: 'Numerology', fill: '#FFF3EA', width: 64 },
  { label: 'Palmistry', fill: '#EDF7FB', width: 52 },
  { label: 'Horary', fill: '#EAF2FF', width: 52 },
  { label: 'Vedic', fill: '#EAF2FF', width: 52 },
  { label: '+2', fill: '#F0FFDE', width: 18.507 },
];

export type ConsultAstrologer = {
  id: string;
  name: string;
  languages: string;
  experience: string;
  orders: string;
  rating: string;
  photo: ImageSourcePropType;
  online: boolean;
  /** Countdown shown only while the astrologer is busy. */
  wait?: string;
  /** Struck-through list price. */
  was: string;
  /** What the user actually pays — "Free" on the promotional rows. */
  now: string;
  categories: ReadonlyArray<ConsultCategory>;
};

/**
 * Figma fills the 90 x 111 card tile with a crop of the stock portrait rather
 * than the whole frame, so the tile ships pre-cropped to that window (the
 * untouched source stays alongside it as consult-astrologer.png).
 */
const photo = require('../assets/images/consult-astrologer-card.png');

export const consultAstrologers: ReadonlyArray<ConsultAstrologer> = [
  {
    id: 'ragini-1',
    name: 'Astro Ragini',
    languages: 'English, Hindi',
    experience: '8 Years',
    orders: '1000+',
    rating: '(4.5/5)',
    photo,
    online: true,
    wait: 'Wait 00:01:21',
    was: '₹21/min',
    now: 'Free',
    categories: ['love', 'marriage'],
  },
  {
    id: 'ragini-2',
    name: 'Astro Ragini',
    languages: 'English, Hindi',
    experience: '8 Years',
    orders: '1000+',
    rating: '(4.5/5)',
    photo,
    online: true,
    wait: 'Wait 00:01:21',
    was: '₹21/min',
    now: 'Free',
    categories: ['education', 'wealth'],
  },
  {
    id: 'ragini-3',
    name: 'Astro Ragini',
    languages: 'English, Hindi',
    experience: '8 Years',
    orders: '1000+',
    rating: '(4.5/5)',
    photo,
    online: true,
    was: '₹21/min',
    now: '₹15/Min',
    categories: ['marriage', 'health'],
  },
  {
    id: 'ragini-4',
    name: 'Astro Ragini',
    languages: 'English, Hindi',
    experience: '8 Years',
    orders: '1000+',
    rating: '(4.5/5)',
    photo,
    online: false,
    was: '₹21/min',
    now: '₹15/Min',
    categories: ['love', 'wealth'],
  },
];
