/**
 * Fixture data for every screen that normally reads from the API.
 *
 * Used only while `USE_DUMMY_DATA` in `./api.ts` is on — see the comment
 * there. Field names follow the backend models (`User`, `UserProfile`,
 * `Astrologer`, `WalletTransaction`, `Notification`) so swapping back to the
 * real endpoints later needs no reshaping.
 */

const minutesAgo = (minutes: number) => new Date(Date.now() - minutes * 60 * 1000).toISOString();
const daysAgo = (days: number) => minutesAgo(days * 24 * 60);

/* ------------------------------------------------------------------ the seeker */

export const DUMMY_USER = {
  id: 'user-dummy-1',
  name: 'Arjun Sharma',
  email: 'arjun@example.com',
  phone: '9876543210',
  gender: 'male',
  dateOfBirth: '1995-08-15',
  timeOfBirth: '06:30',
  placeOfBirth: 'Mumbai, Maharashtra',
  avatarUrl: undefined as string | undefined,
  sunSign: 'Leo',
};

/* -------------------------------------------------------------- astrologers */

/**
 * One row covers both the directory card and the detail screen — the detail
 * screen just reads the extra fields the card does not need.
 */
export const DUMMY_ASTROLOGERS = [
  {
    id: 'astro-1',
    name: 'Pt. Vikram Joshi',
    photo: undefined as string | undefined,
    online: true,
    busy: false,
    waitSeconds: 0,
    gender: 'male',
    expertise: ['vedic', 'numerology'],
    languages: ['hindi', 'english'],
    topics: ['career-job', 'marriage', 'love-relationship'],
    experienceYears: 15,
    consultations: 5400,
    badges: ['top-choice', 'most-trusted'],
    rates: { chat: { was: 25, now: 20 }, call: { was: 35, now: 30 } },
    freeMinutes: 3,
    about:
      'Vedic astrologer with 15+ years reading horoscopes for career, marriage and finance. Known for direct, practical guidance rather than vague predictions.',
    gallery: [] as string[],
    specializations: ['Career', 'Marriage', 'Finance'],
    callMinutes: 42000,
    chatMinutes: 68000,
  },
  {
    id: 'astro-2',
    name: 'Acharya Meera Nair',
    photo: undefined as string | undefined,
    online: true,
    busy: true,
    waitSeconds: 240,
    gender: 'female',
    expertise: ['tarot', 'face-reading'],
    languages: ['english', 'malayalam'],
    topics: ['love-relationship', 'family'],
    experienceYears: 10,
    consultations: 3100,
    badges: ['rising-star'],
    rates: { chat: { was: 18, now: 15 }, call: { was: 28, now: 25 } },
    freeMinutes: 3,
    about:
      'Tarot reader and face-reading practitioner focused on relationships and family matters. Warm, conversational sessions.',
    gallery: [] as string[],
    specializations: ['Love', 'Family', 'Relationships'],
    callMinutes: 21000,
    chatMinutes: 39000,
  },
  {
    id: 'astro-3',
    name: 'Pt. Suresh Iyer',
    photo: undefined as string | undefined,
    online: false,
    busy: false,
    waitSeconds: 0,
    gender: 'male',
    expertise: ['vedic', 'vastu'],
    languages: ['hindi', 'tamil', 'telugu'],
    topics: ['vastu', 'muhurat', 'wealth-finance'],
    experienceYears: 22,
    consultations: 9200,
    badges: ['celebrity', 'most-trusted'],
    rates: { chat: { was: 40, now: 35 }, call: { was: 55, now: 50 } },
    freeMinutes: 0,
    about:
      'Senior Vedic astrologer and Vastu consultant with over two decades of experience guiding families on wealth, property and auspicious timing.',
    gallery: [] as string[],
    specializations: ['Vastu', 'Wealth', 'Muhurat'],
    callMinutes: 90000,
    chatMinutes: 120000,
  },
  {
    id: 'astro-4',
    name: 'Dr. Kavita Desai',
    photo: undefined as string | undefined,
    online: true,
    busy: false,
    waitSeconds: 0,
    gender: 'female',
    expertise: ['numerology', 'palmistry'],
    languages: ['english', 'hindi', 'gujarati'],
    topics: ['career-job', 'business', 'education'],
    experienceYears: 8,
    consultations: 1900,
    badges: [] as string[],
    rates: { chat: { was: 15, now: 12 }, call: { was: 22, now: 20 } },
    freeMinutes: 5,
    about:
      'Numerologist and palmistry consultant helping students and professionals pick the right path forward.',
    gallery: [] as string[],
    specializations: ['Career', 'Education', 'Numerology'],
    callMinutes: 9800,
    chatMinutes: 18200,
  },
  {
    id: 'astro-5',
    name: 'Pt. Ramesh Trivedi',
    photo: undefined as string | undefined,
    online: true,
    busy: false,
    waitSeconds: 0,
    gender: 'male',
    expertise: ['vedic', 'krishnamurti-paddhati'],
    languages: ['hindi', 'marathi'],
    topics: ['marriage', 'kundli-milan', 'general'],
    experienceYears: 25,
    consultations: 6800,
    badges: ['top-choice'],
    rates: { chat: { was: 30, now: 28 }, call: { was: 45, now: 42 } },
    freeMinutes: 0,
    about:
      'KP and Vedic astrologer specialising in matchmaking and marriage timing, consulted by families across three generations.',
    gallery: [] as string[],
    specializations: ['Marriage', 'Kundli Milan'],
    callMinutes: 61000,
    chatMinutes: 84000,
  },
  {
    id: 'astro-6',
    name: 'Astro Neha Kapoor',
    photo: undefined as string | undefined,
    online: true,
    busy: true,
    waitSeconds: 120,
    gender: 'female',
    expertise: ['tarot', 'vedic'],
    languages: ['english', 'hindi', 'punjabi'],
    topics: ['love-relationship', 'health'],
    experienceYears: 6,
    consultations: 1200,
    badges: ['rising-star'],
    rates: { chat: { was: 12, now: 10 }, call: { was: 18, now: 16 } },
    freeMinutes: 3,
    about:
      'Young tarot and Vedic astrologer with a growing following for quick, honest readings on love and wellbeing.',
    gallery: [] as string[],
    specializations: ['Love', 'Health'],
    callMinutes: 4200,
    chatMinutes: 9600,
  },
];

/** Who the seeker has favourited — mutated by toggleFavourite. */
export const DUMMY_FAVOURITE_IDS: string[] = ['astro-1', 'astro-5'];

/* -------------------------------------------------------------------- home */

export const DUMMY_HOME = {
  profile: {
    name: DUMMY_USER.name,
    avatarUrl: DUMMY_USER.avatarUrl,
    sunSign: DUMMY_USER.sunSign,
    dateOfBirth: DUMMY_USER.dateOfBirth,
  },
  wallet: { balance: 1250, currency: 'INR' },
  horoscope: {
    sign: 'Leo',
    reading:
      'Today is favorable for new beginnings. The Sun in your first house brings confidence and vitality. Focus on creative pursuits and leadership opportunities — a conversation you have been avoiding goes better than expected.',
    luckyNumber: 7,
    colour: 'Gold',
    energy: 'High ↑',
  },
  planetPositions: {
    /** Pre-formatted, like the rest of this fixture — the card prints it as-is. */
    date: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
    planets: [
      { glyph: '☉', name: 'Sun', sign: 'Leo' },
      { glyph: '☽', name: 'Moon', sign: 'Cancer' },
      { glyph: '☿', name: 'Mercury', sign: 'Virgo' },
      { glyph: '♀', name: 'Venus', sign: 'Libra' },
      { glyph: '♂', name: 'Mars', sign: 'Aries' },
      { glyph: '♃', name: 'Jupiter', sign: 'Taurus' },
      { glyph: '♄', name: 'Saturn', sign: 'Aquarius' },
    ],
  },
  freeConsultation: { isUsed: false, minutes: 3 },
  unreadNotifications: 2,
  recentConsultations: [
    {
      id: 'chat-hist-1',
      astrologer: 'Pt. Vikram Joshi',
      photo: undefined as string | undefined,
      channel: 'chat',
      durationSeconds: 900,
      amount: 180,
      endedAt: daysAgo(2),
    },
    {
      id: 'chat-hist-2',
      astrologer: 'Acharya Meera Nair',
      photo: undefined as string | undefined,
      channel: 'call',
      durationSeconds: 1200,
      amount: 400,
      endedAt: daysAgo(5),
    },
    {
      id: 'chat-hist-3',
      astrologer: 'Pt. Ramesh Trivedi',
      photo: undefined as string | undefined,
      channel: 'chat',
      durationSeconds: 480,
      amount: 112,
      endedAt: daysAgo(9),
    },
  ],
};

/* ------------------------------------------------------------------- wallet */

export const DUMMY_WALLET = {
  balance: 1250,
  totalAdded: 4500,
  totalSpent: 3240,
  currency: 'INR',
  lastTransactionAt: daysAgo(2),
};

export const DUMMY_TRANSACTIONS = [
  {
    _id: 'txn-1',
    reference: 'TXN-8FA21C',
    title: 'Chat with Pt. Vikram Joshi',
    type: 'consultation_charge',
    direction: 'debit',
    amount: 180,
    createdAt: daysAgo(2),
  },
  {
    _id: 'txn-2',
    reference: 'TXN-6B12E4',
    title: 'Wallet Top-up',
    type: 'topup',
    direction: 'credit',
    amount: 1000,
    createdAt: daysAgo(3),
  },
  {
    _id: 'txn-3',
    reference: 'TXN-9C77A1',
    title: 'Call with Acharya Meera Nair',
    type: 'consultation_charge',
    direction: 'debit',
    amount: 400,
    createdAt: daysAgo(5),
  },
  {
    _id: 'txn-4',
    reference: 'TXN-4D19F0',
    title: 'Chat with Pt. Ramesh Trivedi',
    type: 'consultation_charge',
    direction: 'debit',
    amount: 112,
    createdAt: daysAgo(9),
  },
  {
    _id: 'txn-5',
    reference: 'TXN-2A66B7',
    title: 'Wallet Top-up',
    type: 'topup',
    direction: 'credit',
    amount: 2000,
    createdAt: daysAgo(14),
  },
  {
    _id: 'txn-6',
    reference: 'TXN-7E90C2',
    title: 'Referral Bonus',
    type: 'bonus',
    direction: 'credit',
    amount: 50,
    createdAt: daysAgo(20),
  },
];

/* ------------------------------------------------------------------ kundlis */

type DummyKundli = {
  id: string;
  label?: string;
  relation?: string;
  fullName: string;
  gender?: string;
  dateOfBirth: string;
  timeOfBirth: string;
  placeOfBirth: string;
  chart?: unknown;
  createdAt: string;
};

export const DUMMY_KUNDLIS: DummyKundli[] = [
  {
    id: 'kundli-1',
    label: 'My Kundli',
    relation: 'self',
    fullName: DUMMY_USER.name,
    gender: DUMMY_USER.gender,
    dateOfBirth: DUMMY_USER.dateOfBirth,
    timeOfBirth: DUMMY_USER.timeOfBirth,
    placeOfBirth: DUMMY_USER.placeOfBirth,
    chart: undefined as unknown,
    createdAt: daysAgo(40),
  },
  {
    id: 'kundli-2',
    label: 'Father',
    relation: 'family',
    fullName: 'Ravindra Sharma',
    gender: 'male',
    dateOfBirth: '1965-03-22',
    timeOfBirth: '11:15',
    placeOfBirth: 'Pune, Maharashtra',
    chart: undefined as unknown,
    createdAt: daysAgo(30),
  },
];

/* -------------------------------------------------------------- consultations */

export const DUMMY_CONSULTATIONS = [
  {
    id: 'chat-hist-1',
    with: { name: 'Pt. Vikram Joshi', photo: undefined as string | undefined },
    topic: 'career-job',
    channel: 'chat',
    amountCharged: 180,
    durationSeconds: 900,
    createdAt: daysAgo(2),
    endedAt: daysAgo(2),
    status: 'ended',
  },
  {
    id: 'chat-hist-2',
    with: { name: 'Acharya Meera Nair', photo: undefined as string | undefined },
    topic: 'family',
    channel: 'call',
    amountCharged: 400,
    durationSeconds: 1200,
    createdAt: daysAgo(5),
    endedAt: daysAgo(5),
    status: 'ended',
  },
  {
    id: 'chat-hist-3',
    with: { name: 'Pt. Ramesh Trivedi', photo: undefined as string | undefined },
    topic: 'marriage',
    channel: 'chat',
    amountCharged: 112,
    durationSeconds: 480,
    createdAt: daysAgo(9),
    endedAt: daysAgo(9),
    status: 'ended',
  },
  {
    id: 'chat-hist-4',
    with: { name: 'Pt. Suresh Iyer', photo: undefined as string | undefined },
    topic: 'vastu',
    channel: 'call',
    amountCharged: 0,
    durationSeconds: 0,
    createdAt: daysAgo(15),
    endedAt: daysAgo(15),
    status: 'cancelled',
  },
];

/** One transcript, shared by whichever consultation is open. */
export const DUMMY_MESSAGES = [
  {
    id: 'msg-1',
    senderRole: 'user',
    content: { text: 'Namaste ji, I wanted to ask about my career growth this year.' },
    createdAt: minutesAgo(14),
    isIntake: true,
  },
  {
    id: 'msg-2',
    senderRole: 'astrologer',
    content: { text: 'Namaste! Let me check your chart — please confirm your date of birth.' },
    createdAt: minutesAgo(13),
  },
  {
    id: 'msg-3',
    senderRole: 'user',
    content: { text: '15 August 1995, 6:30 AM, Mumbai.' },
    createdAt: minutesAgo(12),
  },
  {
    id: 'msg-4',
    senderRole: 'astrologer',
    content: { text: 'Thank you. Jupiter is transiting favourably — expect good career news around October.' },
    createdAt: minutesAgo(11),
  },
];

/* -------------------------------------------------------------- AI assistant */

export const DUMMY_AI_THREAD = {
  chatId: 'chat-ai-1',
  items: [
    {
      id: 'ai-msg-1',
      senderRole: 'user',
      content: { text: 'What does my Jupiter placement mean?' },
      createdAt: minutesAgo(60),
    },
    {
      id: 'ai-msg-2',
      senderRole: 'ai',
      content: {
        text: 'Jupiter in your chart represents wisdom, growth and good fortune. Its current placement favours learning and long-distance opportunities over the next few months.',
      },
      createdAt: minutesAgo(59),
    },
  ],
};

/* -------------------------------------------------------------- notifications */

export const DUMMY_NOTIFICATIONS = [
  {
    id: 'notif-1',
    type: 'consultation_ended',
    title: 'Consultation completed',
    body: 'Your chat with Pt. Vikram Joshi has ended. Rate your experience.',
    action: { screen: 'consultationHistory', id: 'chat-hist-1' },
    createdAt: daysAgo(2),
    readAt: undefined as string | undefined,
  },
  {
    id: 'notif-2',
    type: 'wallet_credit',
    title: 'Wallet recharged',
    body: '₹1,000 has been added to your wallet.',
    action: { screen: 'wallet', id: undefined as string | undefined },
    createdAt: daysAgo(3),
    readAt: undefined as string | undefined,
  },
  {
    id: 'notif-3',
    type: 'promotion',
    title: 'Free minutes waiting',
    body: 'You still have 3 free minutes on your first chat consultation.',
    action: { screen: 'findAstrologers', id: undefined as string | undefined },
    createdAt: daysAgo(6),
    readAt: daysAgo(5),
  },
  {
    id: 'notif-4',
    type: 'system',
    title: 'Welcome to Shree Astro',
    body: 'Complete your birth details to unlock a free Kundli.',
    action: { screen: 'birthDetails', id: undefined as string | undefined },
    createdAt: daysAgo(12),
    readAt: daysAgo(12),
  },
];

/* ----------------------------------------------------------------- support */

let ticketSequence = 0;

export function nextTicketReference(): string {
  ticketSequence += 1;
  return `TCKT-${String(1000 + ticketSequence)}`;
}

/* ----------------------------------------------------------- platform settings */

export const DUMMY_SETTINGS = {
  minRecharge: 100,
  maxRecharge: 50000,
  minPayout: 500,
  freeTrialMinutes: 3,
  features: { chat: true, call: false, aiAstrology: true, kundli: true },
  appVersions: { ios: '1.0.0', android: '1.0.0' },
  supportEmail: 'support@shreeastro.com',
  supportPhone: '+91 98765 00000',
};

/* --------------------------------------------------------------- horoscopes */

const ZODIAC_SIGNS = [
  'Aries',
  'Taurus',
  'Gemini',
  'Cancer',
  'Leo',
  'Virgo',
  'Libra',
  'Scorpio',
  'Sagittarius',
  'Capricorn',
  'Aquarius',
  'Pisces',
] as const;

export const DUMMY_HOROSCOPES: Record<
  string,
  { sign: string; reading: string; luckyNumber: number; colour: string; energy: string }
> = Object.fromEntries(
  ZODIAC_SIGNS.map((sign, index) => [
    sign,
    {
      sign,
      reading: `A steady day for ${sign}. Trust your instincts on money matters and keep communication open with people close to you — small efforts today compound into bigger wins later this week.`,
      luckyNumber: ((index * 3) % 9) + 1,
      colour: ['Gold', 'Emerald', 'Sky Blue', 'Silver', 'Crimson', 'Violet'][index % 6],
      energy: ['High ↑', 'Steady →', 'Low ↓'][index % 3],
    },
  ]),
);
