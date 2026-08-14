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
  filterBorder: '#FFC700',
  replyFill: '#F2F2F2',
  replyAccent: '#9A30CC',
  barTrack: '#F3F3F3',
} as const;

export const astrologerProfile = {
  name: 'Astro Ragini',
  online: true,
  waitTime: 'Wait 5Min',
  walletBalance: '₹ 1000',
  languages: 'English, Hindi',
  photo: require('../assets/images/astro-ragini.png') as ImageSourcePropType,
  /** Each speciality pill carries its own pastel fill (nodes 180:164546+). */
  tags: [
    { label: 'Vedic', fill: '#EEFFDA' },
    { label: 'Numerology', fill: '#FFF3EA' },
    { label: 'Palmistry', fill: '#EDF7FB' },
    { label: 'Horary', fill: '#EAF2FF' },
    { label: '+2', fill: '#F0FFDE' },
  ],
  stats: [
    { value: '(4.5/5)', label: 'Ratings', stars: true },
    { value: '8 Years', label: 'Experience' },
    { value: '2K Mins', label: 'Call' },
    { value: '3K Mins', label: 'Chat' },
  ],
  rates: {
    chat: { was: '₹31/min', now: '₹19/min' },
    call: { was: '₹31/min', now: '₹19/min' },
  },
  media: [
    require('../assets/images/astro-media.jpg'),
    require('../assets/images/astro-media.jpg'),
    require('../assets/images/astro-media.jpg'),
    require('../assets/images/astro-media.jpg'),
  ] as ImageSourcePropType[],
  specializations: [
    'Break-up & Divorce',
    'Career & Job',
    'Cheating & Affairs',
    'Numerology',
    'Love & Relationship',
    'Kids & Education',
    'Vedic Astrology',
    'Finance',
    'Business',
    'Palm Reading',
    'Marital Life',
  ],
  about:
    'Hello! I am an expert in Vedic and Nadi Astrology, and Vedic Numerology. My readings are spirit-guided and I work according to the ethics of Astrology to bring stability to the lives of people... ',
  score: { value: '4.7', outOf: '/ 5' },
  /** Histogram rows, top to bottom, with Figma's per-row bar colour. */
  histogram: [
    { rating: '5', count: '2.5k', ratio: 1, color: '#37B99E' },
    { rating: '4', count: '1.5k', ratio: 0.6, color: '#DB80FE' },
    { rating: '3', count: '500', ratio: 0.2, color: '#33C2EB' },
    { rating: '2', count: '200', ratio: 0.08, color: '#EFC048' },
    { rating: '0', count: '0', ratio: 0.05, color: '#FE7615' },
  ],
  reviews: [
    {
      id: 'r-1',
      author: 'Anonymous',
      date: '25 June 2024',
      body: 'Amazing astrologer mostly all doubts are clear.',
      reply: { author: 'Nidhi Kumari', body: 'Thank You' },
    },
    {
      id: 'r-2',
      author: 'Prakash Sharma',
      date: '25 June 2024',
      body: 'Amazing astrologer mostly all doubts are clear.',
      avatar: require('../assets/images/reviewer-avatar.png') as ImageSourcePropType,
    },
    {
      id: 'r-3',
      author: 'Prakash Sharma',
      date: '25 June 2024',
      body: 'Amazing astrologer mostly all doubts are clear.',
      avatar: require('../assets/images/reviewer-avatar.png') as ImageSourcePropType,
    },
  ],
};
