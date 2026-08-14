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

export type DirectoryAstrologer = {
  id: string;
  name: string;
  rate: string;
  specialities: string;
  experience: string;
  languages: string;
  consults: string;
  photo: ImageSourcePropType;
  online: boolean;
  /** Which directory filters this astrologer answers to. */
  tags: ReadonlyArray<DirectoryFilter>;
};

export const directory: ReadonlyArray<DirectoryAstrologer> = [
  {
    id: 'rajesh',
    name: 'Pt. Rajesh Sharma',
    rate: '₹20/min',
    specialities: 'Vedic Astrology, KP System',
    experience: '18 yrs exp',
    languages: 'Hindi, English',
    consults: '4,820 consults',
    photo: require('../assets/images/astro-rajesh.jpg'),
    online: true,
    tags: ['online', 'vedic'],
  },
  {
    id: 'kavita',
    name: 'Kavita Joshi',
    rate: '₹15/min',
    specialities: 'Tarot, Numerology, Vastu',
    experience: '12 yrs exp',
    languages: 'English, Gujarati',
    consults: '3,210 consults',
    // Figma reuses Pt. Rajesh's headshot here; the project already carries a
    // distinct photo for Kavita, so that one is used instead.
    photo: require('../assets/images/astrologer-kavita.png'),
    online: true,
    tags: ['online', 'tarot'],
  },
  {
    id: 'suresh',
    name: 'Dr. Suresh Patel',
    rate: '₹25/min',
    specialities: 'Vastu Shastra, Jyotish',
    experience: '22 yrs exp',
    languages: 'Hindi, Marathi',
    consults: '6,540 consults',
    photo: require('../assets/images/astro-suresh.jpg'),
    online: false,
    tags: ['vedic'],
  },
  {
    id: 'anita',
    name: 'Anita Krishnan',
    rate: '₹12/min',
    specialities: 'Palmistry, Face Reading',
    experience: '9 yrs exp',
    languages: 'Tamil, English',
    consults: '1,890 consults',
    photo: require('../assets/images/astro-anita.jpg'),
    online: true,
    tags: ['online'],
  },
  {
    id: 'guru',
    name: 'Guru Prakash Das',
    rate: '₹35/min',
    specialities: 'Nadi Astrology, Muhurat',
    experience: '31 yrs exp',
    languages: 'Telugu, Hindi',
    consults: '9,120 consults',
    photo: require('../assets/images/astro-guru.jpg'),
    online: false,
    tags: ['vedic'],
  },
];
