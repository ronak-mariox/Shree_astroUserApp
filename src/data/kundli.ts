/**
 * The chart Figma pinned into the generated-Kundli screen (node 180:89330).
 * Swap this module for a real ephemeris response to make the screen live.
 */

/** Where a planet sits in the birth chart's 3 x 4 grid, in Figma percentages. */
export type ChartPlanet = {
  abbr: string;
  color: string;
  /** Distance from the chart's left edge, as a percentage of its width. */
  left: number;
};

export type ChartHouse = {
  number: string;
  /** Percentages measured from the chart's top-left corner. */
  top: number;
  left: number;
  planetTop: number;
  planets: ReadonlyArray<ChartPlanet>;
};

export const chartHouses: ReadonlyArray<ChartHouse> = [
  { number: '12', top: 2.28, left: 3.04, planetTop: 18.16, planets: [{ abbr: 'Sa', color: '#6B7280', left: 3.04 }] },
  {
    number: '1',
    top: 2.28,
    left: 36.37,
    planetTop: 18.16,
    planets: [
      { abbr: 'As', color: '#1F2937', left: 36.37 },
      { abbr: 'Ma', color: '#EF4444', left: 46.28 },
    ],
  },
  { number: '2', top: 2.28, left: 69.71, planetTop: 18.16, planets: [] },
  { number: '11', top: 27.28, left: 3.04, planetTop: 43.16, planets: [{ abbr: 'Ve', color: '#EC4899', left: 3.04 }] },
  { number: '3', top: 27.28, left: 69.71, planetTop: 43.16, planets: [{ abbr: 'Me', color: '#10B981', left: 69.71 }] },
  { number: '10', top: 52.28, left: 3.04, planetTop: 68.16, planets: [{ abbr: 'Ju', color: '#000000', left: 3.04 }] },
  { number: '9', top: 52.28, left: 36.37, planetTop: 68.16, planets: [{ abbr: 'Su', color: '#FF4E00', left: 36.37 }] },
  { number: '4', top: 52.28, left: 69.71, planetTop: 68.16, planets: [] },
  { number: '8', top: 77.29, left: 3.04, planetTop: 93.16, planets: [] },
  {
    number: '7',
    top: 77.29,
    left: 36.37,
    planetTop: 93.16,
    planets: [
      { abbr: 'Mo', color: '#6366F1', left: 36.37 },
      { abbr: 'Ra', color: '#7C3AED', left: 46.28 },
    ],
  },
  { number: '6', top: 77.29, left: 69.71, planetTop: 93.16, planets: [{ abbr: 'Ke', color: '#8B5CF6', left: 69.71 }] },
];

export const chartNative = {
  name: 'Arjun',
  date: '15 Aug 1995',
  place: 'Mumbai',
};

export const keyPositions = [
  { glyph: '♋', label: 'Lagna', sign: 'Cancer' },
  { glyph: '☀', label: 'Sun', sign: 'Leo' },
  { glyph: '☽', label: 'Moon', sign: 'Sagittarius' },
  { glyph: '♂', label: 'Mars', sign: 'Gemini' },
  { glyph: '☿', label: 'Mercury', sign: 'Virgo' },
  { glyph: '♃', label: 'Jupiter', sign: 'Pisces' },
];

/** Dignity of a planet — drives the pill colour on the positions table. */
export type Dignity = 'Own Sign' | 'Neutral' | 'Debilitated' | 'Exalted';

export const planetaryPositions: ReadonlyArray<{
  planet: string;
  sign: string;
  house: string;
  dignity?: Dignity;
}> = [
  { planet: 'Sun ☀', sign: 'Leo', house: '2nd', dignity: 'Own Sign' },
  { planet: 'Moon ☽', sign: 'Sagittarius', house: '6th', dignity: 'Neutral' },
  { planet: 'Mars ♂', sign: 'Gemini', house: '12th', dignity: 'Debilitated' },
  { planet: 'Mercury ☿', sign: 'Virgo', house: '3rd', dignity: 'Exalted' },
  { planet: 'Jupiter ♃', sign: 'Pisces', house: '9th', dignity: 'Own Sign' },
  { planet: 'Venus ♀', sign: 'Aquarius', house: '8th', dignity: 'Neutral' },
  { planet: 'Saturn ♄', sign: 'Pisces', house: '9th', dignity: 'Neutral' },
  { planet: 'Rahu ☊', sign: 'Scorpio', house: '5th' },
  { planet: 'Ketu ☋', sign: 'Taurus', house: '11th' },
];

/** Figma tints "Own Sign" and "Exalted" green, the rest red. */
export const positiveDignities: ReadonlyArray<Dignity> = ['Own Sign', 'Exalted'];

export const dashas = [
  { glyph: '♃', name: 'Jupiter Dasha', years: '2020 – 2036', progress: 0.4, current: true },
  { glyph: '♄', name: 'Saturn Dasha', years: '2036 – 2055', progress: 0 },
  { glyph: '☿', name: 'Mercury Dasha', years: '2055 – 2072', progress: 0 },
];

export const yogas = [
  {
    name: 'Hamsa Yoga',
    verdict: 'Auspicious' as const,
    description:
      'Jupiter in own/exalted sign — great wisdom, spiritual growth & authority',
  },
  {
    name: 'Budhaditya Yoga',
    verdict: 'Auspicious' as const,
    description:
      'Sun & Mercury conjunction — sharp intellect, strong communication skills',
  },
  {
    name: 'Kemadruma Yoga',
    verdict: 'Challenging' as const,
    description:
      'Moon without planets in adjacent houses — occasional mental restlessness',
  },
];

export const shadbala = [
  { planet: 'Sun ☀', strength: 78 },
  { planet: 'Moon ☽', strength: 64 },
  { planet: 'Mars ♂', strength: 42 },
  { planet: 'Mercury ☿', strength: 88 },
  { planet: 'Jupiter ♃', strength: 91 },
  { planet: 'Venus ♀', strength: 55 },
  { planet: 'Saturn ♄', strength: 60 },
];

export const remedies = [
  {
    glyph: '🌅',
    name: 'Surya Namaskar',
    description: 'Perform daily at sunrise to strengthen Sun',
    schedule: 'Every Sunday',
  },
  {
    glyph: '💎',
    name: 'Yellow Sapphire',
    description: 'Wear on index finger to boost Jupiter',
    schedule: 'Thursday',
  },
  {
    glyph: '🕉',
    name: 'Vishnu Sahasranama',
    description: 'Chant for 21 days to reduce Mars effects',
    schedule: 'Every Tuesday',
  },
];
