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

export type ConsultBannerId = 'marriage' | 'love' | 'wealth';

export type ConsultBannerSlide = {
  id: ConsultBannerId;
  headline: string;
  /** Only the original Figma export is a baked-in image; the rest are drawn live — see `ConsultBannerCard`. */
  image?: ImageSourcePropType;
};

/** The Consult tab's promo carousel, above the astrologer list (node 180:90174). */
export const consultBanners: ReadonlyArray<ConsultBannerSlide> = [
  {
    id: 'marriage',
    headline: 'When Will I Get Marriage ?',
    image: require('../assets/images/promo-marriage.png') as ImageSourcePropType,
  },
  { id: 'love', headline: 'When Will I Find True Love ?' },
  { id: 'wealth', headline: 'When Will I Become Rich ?' },
];

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

/**
 * One row of the Available Astrologers list, in the words the card prints.
 *
 * Built from the API in the screen — see services/api.ts for the raw shape.
 */
export type ConsultAstrologer = {
  id: string;
  name: string;
  photo: ImageSourcePropType;
  online: boolean;
  /** "Hindi, English". */
  languages: string;
  /** "18 Yrs". */
  experience: string;
  /** "4,820" — how many consultations they have taken. */
  orders: string;
  /** Shown only while they are busy, e.g. "Wait ~7 min" — an estimate. */
  wait?: string;
  /** The estimate behind `wait`, in seconds (GET /astrologers' waitSeconds). */
  waitSeconds?: number;
  /** Struck-through list price. */
  was: string;
  /** What the seeker actually pays, after any offer discount. */
  now: string;
};

