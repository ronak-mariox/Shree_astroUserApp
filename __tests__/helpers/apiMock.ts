/**
 * A stand-in for services/api.ts, for the screen tests.
 *
 * The real one talks to a server, which a screen test has no business doing.
 * The shapes are the same, so what is being tested is still the real screens.
 */

const actual = jest.requireActual('../../src/services/api');

/** Re-exported unchanged: these are pure formatting, not network calls. */
export const {
  titleCase,
  joinLabels,
  rupees,
  minutesOf,
  shortDate,
  dateTime,
} = actual;

const ASTROLOGER = {
  id: 'a-rajesh',
  name: 'Pt. Rajesh Sharma',
  photo: undefined,
  online: true,
  busy: false,
  waitSeconds: 0,
  expertise: ['vedic', 'numerology'],
  languages: ['hindi', 'english'],
  topics: ['career-job', 'marriage'],
  experienceYears: 18,
  rating: 4.7,
  ratingCount: 120,
  consultations: 4820,
  badges: [],
  rates: { chat: { was: 20, now: 20 }, call: { was: 30, now: 30 } },
  freeMinutes: 3,
};

export const fetchHome = async () => ({
  profile: { name: 'Arjun Sharma', sunSign: 'Leo', dateOfBirth: '1995-08-15T00:00:00.000Z' },
  wallet: { balance: 1250, currency: 'INR' },
  horoscope: {
    sign: 'Leo',
    reading: 'Today is favourable for new beginnings.',
    luckyNumber: 7,
    colour: 'Gold',
    energy: 'High ↑',
  },
  planetPositions: {
    date: '2026-08-19',
    planets: [
      { glyph: '☀', name: 'Sun', sign: 'Leo' },
      { glyph: '☽', name: 'Moon', sign: 'Scorpio' },
    ],
  },
  freeConsultation: { isUsed: false, minutes: 3 },
  unreadNotifications: 2,
  recentConsultations: [
    {
      id: 'c-1',
      astrologer: 'Pt. Rajesh Sharma',
      channel: 'chat',
      durationSeconds: 1920,
      amount: 640,
      endedAt: '2026-07-12T10:30:00.000Z',
    },
  ],
});

export const fetchHoroscope = async () => ({
  sign: 'Leo',
  reading: 'Today is favourable for new beginnings.',
  luckyNumber: 7,
  colour: 'Gold',
  energy: 'High ↑',
});

/** A second row, so the filtering tests have something to narrow. */
const KAVITA = {
  ...ASTROLOGER,
  id: 'a-kavita',
  name: 'Kavita Joshi',
  online: false,
  expertise: ['tarot', 'numerology'],
  languages: ['english', 'gujarati'],
  topics: ['health', 'love-relationship'],
  experienceYears: 12,
  rating: 4.5,
  consultations: 3210,
  rates: { chat: { was: 15, now: 15 }, call: { was: 25, now: 25 } },
  freeMinutes: 0,
};

/** Narrows the same way the server does, so a filtering test means something. */
export const fetchAstrologers = async (filters: any = {}) => {
  let items = [ASTROLOGER, KAVITA];

  if (filters.search) {
    const needle = String(filters.search).toLowerCase();
    items = items.filter(row => row.name.toLowerCase().includes(needle));
  }
  if (filters.online) {
    items = items.filter(row => row.online);
  }
  if (filters.expertise?.length) {
    items = items.filter(row => row.expertise.some(area => filters.expertise.includes(area)));
  }
  if (filters.languages?.length) {
    items = items.filter(row => row.languages.some(l => filters.languages.includes(l)));
  }
  if (filters.topics?.length) {
    items = items.filter(row => row.topics.some(topic => filters.topics.includes(topic)));
  }

  return { items, total: items.length };
};

export const fetchAstrologer = async (id: string) => ({
  ...(id === 'a-kavita' ? KAVITA : ASTROLOGER),
  about: 'Vedic astrologer with 18 years of practice.',
  specializations: ['Career & Job', 'Marriage'],
  gallery: [],
  ratingBreakdown: { five: 90, four: 20, three: 6, two: 3, one: 1 },
  chatMinutes: 3000,
  callMinutes: 2000,
  reviews: [
    {
      id: 'r-1',
      reviewer: 'Anonymous',
      rating: 5,
      comment: 'Amazing astrologer, all doubts cleared.',
      reply: 'Thank you',
      at: '2026-06-25T00:00:00.000Z',
    },
  ],
});

export const fetchAstrologerReviews = async () => [];
export const toggleFavourite = async () => true;
export const fetchFavourites = async () => [];

export const fetchProfile = async () => ({
  id: 'u-1',
  name: 'Arjun Sharma',
  email: 'arjun@example.com',
  phone: '9876543210',
  wallet: { balance: 1250, totalAdded: 3000, totalSpent: 1750 },
  stats: { consultations: 12, kundlis: 3 },
  birthDetails: {},
});

export const saveProfile = async (changes: Record<string, unknown>) => ({
  id: 'u-1',
  name: 'Arjun Sharma',
  ...changes,
});
export const updateNotificationPrefs = async (prefs: Record<string, boolean>) => prefs;

export const fetchKundlis = async () => [];
export const saveKundli = async () => ({ _id: 'k-1' });
export const deleteKundli = async () => {};

export const fetchWallet = async () => ({ balance: 1250, totalAdded: 3000, totalSpent: 1750 });
export const fetchTransactions = async () => [];
export const startTopUp = async () => ({
  transactionId: 't-1', reference: 'TXN-ABC123', orderId: 'ORD-1', amount: 500,
});
export const confirmTopUp = async () => ({ _id: 't-1', balanceAfter: 1750, status: 'success' });

export const requestChat = async () => ({
  chatId: 'chat-1', status: 'requested', ratePerMinute: 20, freeMinutes: 3, expiresInSeconds: 120,
});
export const cancelChat = async () => ({});
export const endChat = async () => ({
  chatId: 'chat-1', status: 'ended', durationSeconds: 600, amountCharged: 200,
});
export const rateChat = async () => ({});
export const fetchConsultations = async () => [];
export const fetchMessages = async () => [];
export const sendMessage = async () => ({});

export const fetchAiThread = async () => ({ chatId: 'ai-1', items: [] });
export const askAi = async () => ({
  chatId: 'ai-1',
  question: { id: 'q1', senderRole: 'user', content: { text: 'Hi' } },
  answer: { id: 'a1', senderRole: 'ai', content: { text: 'Namaste' } },
});

export const fetchNotifications = async () => ({ items: [], total: 0, unread: 0 });
export const markNotificationsRead = async () => ({ updated: 0, unread: 0 });
export const raiseTicket = async () => ({ id: 't-1', reference: 'TKT-ABC' });

export const fetchSettings = async () => ({
  minRecharge: 10,
  maxRecharge: 100000,
  minPayout: 100,
  freeTrialMinutes: 3,
  features: { aiAssistant: true, maintenanceMode: false },
  appVersions: { minimumSupported: '1.0.0' },
});
