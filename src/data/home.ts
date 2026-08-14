import type { ImageSourcePropType } from 'react-native';

import type { Astrologer } from '../components/AstrologerCard';
import type { Consultation } from '../components/ConsultationRow';

/**
 * The content Figma pinned into the home screen (node 180:88920). It lives
 * here rather than inline so the screen can be swapped onto a real API by
 * replacing this module.
 */

export const profile = {
  greeting: '✦ Namaste',
  name: 'Arjun Sharma',
  zodiacGlyph: '♌',
  zodiacLine: 'Leo · 15 Aug 1995',
  photo: require('../assets/images/profile-avatar.jpg') as ImageSourcePropType,
};

export const wallet = {
  label: 'WALLET BALANCE',
  balance: '₹ 1,250',
  hint: 'Available for consultations',
};

export const horoscope = {
  title: 'Daily Horoscope',
  meta: 'Leo · Today, 13 Jul 2026',
  reading:
    'Today is favorable for new beginnings. The Sun in your first house brings confidence and vitality. Focus on creative pursuits and leadership opportunities...',
  stats: [
    { label: 'Lucky #', value: '7' },
    { label: 'Color', value: 'Gold' },
    { label: 'Energy', value: 'High ↑' },
  ],
};

export type QuickAction = {
  id: string;
  title: string;
  subtitle: string;
  image: ImageSourcePropType;
  /** The Generate Kundli tile is a rounded square; the others are circles. */
  rounded?: boolean;
};

export const quickActions: ReadonlyArray<QuickAction> = [
  {
    id: 'ai-astrology',
    title: 'AI Astrology',
    subtitle: 'Ask anything',
    image: require('../assets/images/quick-ai-astrology.png'),
  },
  {
    id: 'talk-to-astro',
    title: 'Talk to Astro',
    subtitle: 'Chat & Voice',
    image: require('../assets/images/quick-talk-to-astro.png'),
  },
  {
    id: 'generate-kundli',
    title: 'Generate Kundli',
    subtitle: 'Birth chart',
    image: require('../assets/images/quick-generate-kundli.png'),
    rounded: true,
  },
];

export const astrologers: ReadonlyArray<Astrologer> = [
  {
    id: 'rajesh',
    name: 'Pt. Rajesh Sharma',
    speciality: 'Vedic · KP',
    experience: 'Exp-18 yrs',
    rate: '₹20/min',
    online: true,
    photo: require('../assets/images/astrologer-rajesh.png'),
  },
  {
    id: 'kavita',
    name: 'Kavita Joshi',
    speciality: 'Tarot · Numerology',
    experience: 'Exp-12 yrs',
    rate: '₹15/min',
    online: true,
    photo: require('../assets/images/astrologer-kavita.png'),
  },
  {
    id: 'suresh',
    name: 'Dr. Suresh Patel',
    speciality: 'Vastu · Jyotish',
    experience: 'Exp-22 yrs',
    rate: '₹25/min',
    photo: require('../assets/images/astrologer-suresh.jpg'),
  },
];

export const planetPositions = {
  date: '13 Jul 2026',
  planets: [
    { glyph: '☀', name: 'Sun', sign: 'Cancer' },
    { glyph: '☽', name: 'Moon', sign: 'Scorpio' },
    { glyph: '♂', name: 'Mars', sign: 'Aries' },
    { glyph: '♃', name: 'Jupiter', sign: 'Gemini' },
    { glyph: '♀', name: 'Venus', sign: 'Leo' },
  ],
};

export const recentConsultations: ReadonlyArray<Consultation> = [
  {
    id: 'c-1',
    astrologer: 'Pt. Rajesh Sharma',
    summary: 'Chat Consultation · 32 min',
    date: '12 Jul 2026',
    amount: '₹640',
    photo: require('../assets/images/astrologer-rajesh.png'),
  },
  {
    id: 'c-2',
    astrologer: 'Kavita Joshi',
    summary: 'Voice Consultation · 18 min',
    date: '8 Jul 2026',
    amount: '₹270',
    photo: require('../assets/images/astrologer-kavita.png'),
  },
];

/** Birth details echoed onto the Kundli screen (node 180:89251). */
export const birthDetails = [
  { label: 'Name', value: 'Arjun Sharma' },
  { label: 'Date', value: '15 August 1995' },
  { label: 'Time', value: '06:30 AM IST' },
  { label: 'Place', value: 'Mumbai, Maharashtra' },
];
