import type { ImageSourcePropType } from 'react-native';

/** The directory Figma pinned into the Find Astrologers screen (180:163904). */

export type DirectoryFilter = 'all' | 'online' | 'vedic' | 'tarot';

export const directoryFilters: ReadonlyArray<{
  key: DirectoryFilter;
  label: string;
  /** Renders a green dot before the label. */
  dot?: boolean;
}> = [
  { key: 'all', label: 'All' },
  { key: 'online', label: 'Online', dot: true },
  { key: 'vedic', label: 'Vedic' },
  { key: 'tarot', label: 'Tarot' },
];

/**
 * One row of the directory, in the words the card prints.
 *
 * Built from the API in the screens that list astrologers — see
 * services/api.ts for the raw shape it is mapped from.
 */
export type DirectoryAstrologer = {
  id: string;
  name: string;
  photo: ImageSourcePropType;
  online: boolean;
  /** "₹20/min", or a dash while no rate is set. */
  rate: string;
  /** "Vedic, Numerology". */
  specialities: string;
  /** "18 yrs exp". */
  experience: string;
  /** "Hindi, English". */
  languages: string;
  /** "4,820 consults". */
  consults: string;
  /** "Wait ~7 min" while they are in another consultation; absent when free. */
  wait?: string;
  /** The estimate behind `wait`, in seconds (GET /astrologers' waitSeconds). */
  waitSeconds?: number;
};
