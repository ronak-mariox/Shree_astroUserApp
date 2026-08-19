/**
 * The Sort & Filter sheet (Figma nodes 180:90555 / 180:90954). Figma only
 * details the Expertise panel; the other eight sections carry the same anatomy,
 * so their options are stubbed here until the directory API lands. Every id
 * below is what the request will eventually send.
 */
export const consultFilterPalette = {
  /** Header strip — the same green as the promo banner. */
  header: '#7FD66F',
  /** Recessed rail behind the section list. */
  rail: 'rgba(249, 249, 249, 0.87)',
  /** Rule under the header and down the rail's edge. */
  rule: '#E6E6E6',
  /** Screen dimmed behind the sheet. */
  scrim: 'rgba(0, 0, 0, 0.5)',
} as const;

export type ConsultFilterSectionKey =
  | 'expertise'
  | 'language'
  | 'experience'
  | 'price'
  | 'ratings'
  | 'gender'
  | 'status'
  | 'top';

export type ConsultFilterOption = {
  id: string;
  label: string;
};

export type ConsultFilterSection = {
  key: ConsultFilterSectionKey;
  label: string;
  /** The two sort sections take one answer; the rest accept any number. */
  mode: 'single' | 'multiple';
  options: ReadonlyArray<ConsultFilterOption>;
};

/** Which options are ticked, per section. */
export type ConsultFilterSelection = Readonly<
  Record<ConsultFilterSectionKey, ReadonlyArray<string>>
>;

export const consultFilterSections: ReadonlyArray<ConsultFilterSection> = [
  {
    key: 'expertise',
    label: 'Expertise',
    mode: 'multiple',
    options: [
      { id: 'numerology', label: 'Numerology' },
      { id: 'vastu', label: 'Vastu' },
      { id: 'face-reading', label: 'Face Reading' },
      { id: 'nadi', label: 'Nadi' },
      { id: 'krishnamurti-paddhati', label: 'Krishnamurti Paddhati' },
      { id: 'tarot', label: 'Tarot' },
      { id: 'vedic', label: 'Vedic' },
      { id: 'palmistry', label: 'Palmistry' },
      { id: 'life-coach', label: 'Life Coach' },
      { id: 'prashna', label: 'Prashna' },
    ],
  },
  {
    key: 'language',
    label: 'Language',
    mode: 'multiple',
    options: [
      { id: 'english', label: 'English' },
      { id: 'hindi', label: 'Hindi' },
      { id: 'marathi', label: 'Marathi' },
      { id: 'gujarati', label: 'Gujarati' },
      { id: 'bengali', label: 'Bengali' },
      { id: 'tamil', label: 'Tamil' },
      { id: 'telugu', label: 'Telugu' },
      { id: 'kannada', label: 'Kannada' },
      { id: 'punjabi', label: 'Punjabi' },
      { id: 'malayalam', label: 'Malayalam' },
    ],
  },
  {
    key: 'experience',
    label: 'Experience',
    mode: 'multiple',
    options: [
      { id: '0-5', label: '0 - 5 Years' },
      { id: '5-10', label: '5 - 10 Years' },
      { id: '10-15', label: '10 - 15 Years' },
      { id: '15-20', label: '15 - 20 Years' },
      { id: '20+', label: '20+ Years' },
    ],
  },
  {
    key: 'price',
    label: 'Sort By Price',
    mode: 'single',
    options: [
      { id: 'price-asc', label: 'Low to High' },
      { id: 'price-desc', label: 'High to Low' },
    ],
  },
  {
    key: 'ratings',
    label: 'Sort By Ratings',
    mode: 'single',
    options: [
      { id: 'rating-desc', label: 'High to Low' },
      { id: 'rating-asc', label: 'Low to High' },
    ],
  },
  {
    key: 'gender',
    label: 'Gender',
    mode: 'multiple',
    options: [
      { id: 'female', label: 'Female' },
      { id: 'male', label: 'Male' },
    ],
  },
  {
    key: 'status',
    label: 'Status',
    mode: 'multiple',
    options: [
      { id: 'online', label: 'Online' },
      { id: 'busy', label: 'Busy' },
      { id: 'offline', label: 'Offline' },
    ],
  },
  {
    key: 'top',
    label: 'Top Astrologers',
    mode: 'multiple',
    options: [
      { id: 'celebrity', label: 'Celebrity' },
      { id: 'rising-star', label: 'Rising Star' },
      { id: 'top-choice', label: 'Top Choice' },
      { id: 'most-trusted', label: 'Most Trusted' },
    ],
  },
];

/** Nothing ticked — what "Clear" in every section leaves behind. */
export const emptyConsultFilters: ConsultFilterSelection = {
  expertise: [],
  language: [],
  experience: [],
  price: [],
  ratings: [],
  gender: [],
  status: [],
  top: [],
};

/** The five expertises Figma opens the sheet with (node I180:90953;295:4835+). */
export const defaultConsultFilters: ConsultFilterSelection = {
  ...emptyConsultFilters,
  expertise: [
    'numerology',
    'vastu',
    'face-reading',
    'nadi',
    'krishnamurti-paddhati',
  ],
};

/**
 * The two sorts the sheet offers.
 *
 * Narrowing the list is the server's job — every ticked option is an id the API
 * already understands, so it is sent as a query rather than applied here. What
 * is left for the client is the ordering, because the sheet lets a seeker sort
 * by price *and* by rating at once, and the API takes only one.
 *
 * When both are set the rating sort runs last, so it decides ties on price.
 */
export function sortConsultAstrologers<
  T extends { was: string; now: string; rating: string },
>(astrologers: ReadonlyArray<T>, selection: ConsultFilterSelection): T[] {
  const amountOf = (value: string) => Number(value.replace(/[^0-9.]/g, '')) || 0;
  const sorted = [...astrologers];

  if (selection.price.includes('low-to-high')) {
    sorted.sort((a, b) => amountOf(a.now) - amountOf(b.now));
  } else if (selection.price.includes('high-to-low')) {
    sorted.sort((a, b) => amountOf(b.now) - amountOf(a.now));
  }

  if (selection.ratings.includes('high-to-low')) {
    sorted.sort((a, b) => Number(b.rating || 0) - Number(a.rating || 0));
  }

  return sorted;
}
