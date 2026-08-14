/**
 * The deep-analysis reading Figma pinned across the three tabs
 * (nodes 180:89757 Dasha, 180:89892 Yogas, 180:90009 Doshas).
 */

export type AnalysisTab = 'dasha' | 'yogas' | 'doshas';

export const analysisTabs: ReadonlyArray<{ key: AnalysisTab; label: string }> = [
  { key: 'dasha', label: 'Dasha' },
  { key: 'yogas', label: 'Yogas' },
  { key: 'doshas', label: 'Doshas' },
];

export const mahadashas = [
  {
    name: 'Jupiter Dasha',
    years: '2018 – 2034',
    active: true,
    remaining: '8 yrs 5 mo',
  },
  { name: 'Saturn Dasha', years: '2034 – 2053' },
  { name: 'Mercury Dasha', years: '2053 – 2070' },
];

export const antardashas = [
  { name: 'Jupiter–Saturn', period: 'Jul 2025 – Nov 2027', active: true },
  { name: 'Jupiter–Mercury', period: 'Nov 2027 – Feb 2030' },
  { name: 'Jupiter–Ketu', period: 'Feb 2030 – Jan 2031' },
];

export type YogaVerdict = 'Beneficial' | 'Challenging';

export const analysisYogas: ReadonlyArray<{
  name: string;
  verdict: YogaVerdict;
  strength: string;
  description: string;
}> = [
  {
    name: 'Gaja Kesari Yoga',
    verdict: 'Beneficial',
    strength: 'Strong',
    description:
      'Jupiter in quadrant from Moon. Brings fame, wealth, and intelligence.',
  },
  {
    name: 'Chandra Mangala Yoga',
    verdict: 'Beneficial',
    strength: 'Medium',
    description:
      'Moon and Mars conjunction. Excellent for wealth accumulation.',
  },
  {
    name: 'Budhaditya Yoga',
    verdict: 'Beneficial',
    strength: 'Strong',
    description:
      'Sun and Mercury in same house. Sharp intellect and communication skills.',
  },
  {
    name: 'Kemadruma Yoga',
    verdict: 'Challenging',
    strength: 'Weak',
    description:
      'No planets on either side of Moon. Requires mindfulness and discipline.',
  },
];

export const doshas: ReadonlyArray<{
  name: string;
  present: boolean;
  /** Only set when the dosha is present. */
  severity?: string;
  description: string;
}> = [
  {
    name: 'Mangal Dosha',
    present: true,
    severity: 'Mild',
    description:
      'Mars in 4th house creates a mild Mangal Dosha. Cancellation possible through matching.',
  },
  {
    name: 'Kaal Sarp Dosha',
    present: false,
    description: 'No Kaal Sarp Dosha present in your chart. Highly favorable.',
  },
  {
    name: 'Shani Dosha',
    present: false,
    description: 'Saturn is well-placed with no affliction to ascendant lord.',
  },
  {
    name: 'Pitra Dosha',
    present: true,
    severity: 'Moderate',
    description:
      'Sun afflicted by Rahu suggests ancestral karma. Remedies recommended.',
  },
];
