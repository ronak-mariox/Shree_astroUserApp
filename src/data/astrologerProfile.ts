import type { ImageSourcePropType } from 'react-native';

/**
 * The astrologer profile Figma pinned into the detail screen (180:164498).
 *
 * That frame is drawn in a different visual language from the rest of the app
 * — its own greys, pastel tag fills and 44/50pt pill radii — so the palette it
 * needs lives here beside the content rather than in the shared theme.
 */
export const detailPalette = {
  page: '#F5F9F8',
  ink: '#505050',
  inkStrong: '#232323',
  inkTag: '#312E26',
  inkScore: '#3A3A3A',
  muted: '#888888',
  link: '#095FFF',
  star: '#FFC700',
  cardBorder: '#C5C5C5',
  cardShadow: 'rgba(210, 210, 210, 0.87)',
  aboutFill: '#FFFDE9',
  aboutBorder: '#CACACA',
} as const;

/** Figma pins five pastel fills to the speciality pills (nodes 180:164546+). */
export const TAG_FILLS = ['#EEFFDA', '#FFF3EA', '#EDF7FB', '#EAF2FF', '#F0FFDE'] as const;

/**
 * What the astrologer detail screen prints.
 *
 * Built from the API in the screen — see services/api.ts for the raw shape.
 */
export type AstrologerProfile = {
  name: string;
  online: boolean;
  /** "Wait 5 min" while they are busy; empty when they are free. */
  waitTime: string;
  languages: string;
  photo: ImageSourcePropType;
  /** Speciality pills, each with its own pastel fill. */
  tags: ReadonlyArray<{ label: string; fill: string }>;
  stats: ReadonlyArray<{ value: string; label: string }>;
  rates: {
    chat: { was: string; now: string };
    call: { was: string; now: string };
  };
  media: ReadonlyArray<ImageSourcePropType>;
  /** The Specialization section — the astrologer's own declared expertise. */
  specializations: ReadonlyArray<string>;
  /** The Languages Known section. */
  languagesList: ReadonlyArray<string>;
  about: string;
};

/**
 * What a listing knows about the astrologer that was tapped.
 *
 * The detail screen fetches the rest by id; this is only what the card already
 * had, so the header can paint before the fetch lands.
 */
export type AstrologerSummary = {
  id: string;
  name: string;
  photo: ImageSourcePropType;
  online?: boolean;
  experience?: string;
  languages?: string;
  rate?: string;
  rates?: { was: string; now: string };
  specialities?: string;
  wait?: string;
  /** The backend's estimated wait behind `wait`, in seconds (GET /astrologers' waitSeconds). */
  waitSeconds?: number;
};
