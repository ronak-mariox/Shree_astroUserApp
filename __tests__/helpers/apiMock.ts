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
  timeAgo,
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
  consultations: 4820,
  badges: [],
  rates: { chat: { was: 20, now: 20 }, call: { was: 30, now: 30 } },
};

export const fetchHome = async () => ({
  profile: { name: 'Arjun Sharma', moonSign: 'Leo', dateOfBirth: '1995-08-15T00:00:00.000Z' },
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
  consultations: 3210,
  rates: { chat: { was: 15, now: 15 }, call: { was: 25, now: 25 } },
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
  chatMinutes: 3000,
  callMinutes: 2000,
});

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

export const searchPlaces = async () => [
  { id: 'place:mumbai#0', formatted: 'Mumbai, IN', city: 'Mumbai', country: 'IN', latitude: 19.076, longitude: 72.8777, timezone: 'Asia/Kolkata' },
];
export const createBirthProfile = async () => ({ id: 'profile-1', status: 'ready' });

export const fetchKundliOverview = async () => ({
  profileId: 'profile-1',
  status: 'ready',
  chart: { url: 'https://example.com/chart.svg' },
  lagna: 'Cancer',
  nakshatra: 'Revati',
  keyPositions: [
    { label: 'Lagna', sign: 'Cancer' },
    { label: 'Sun', sign: 'Cancer' },
    { label: 'Moon', sign: 'Pisces' },
    { label: 'Mars', sign: 'Virgo' },
    { label: 'Mercury', sign: 'Leo' },
    { label: 'Jupiter', sign: 'Scorpio' },
  ],
  planetaryPositions: [
    { planet: 'Sun', sign: 'Cancer', house: 1, isRetrograde: false, nakshatra: 'Ashlesha', dignity: 'Neutral' },
    { planet: 'Moon', sign: 'Pisces', house: 9, isRetrograde: false, nakshatra: 'Revati', dignity: 'Exalted' },
    { planet: 'Mars', sign: 'Virgo', house: 3, isRetrograde: false, nakshatra: 'Hast', dignity: 'Debilitated' },
    { planet: 'Mercury', sign: 'Leo', house: 2, isRetrograde: false, nakshatra: 'Purva Phalguni', dignity: 'Neutral' },
    { planet: 'Jupiter', sign: 'Scorpio', house: 5, isRetrograde: false, nakshatra: 'Anuradha', dignity: 'Neutral' },
    { planet: 'Venus', sign: 'Cancer', house: 1, isRetrograde: false, nakshatra: 'Pushya', dignity: 'Neutral' },
    { planet: 'Saturn', sign: 'Aquarius', house: 8, isRetrograde: false, nakshatra: 'Shatabhisha', dignity: 'Own Sign' },
    { planet: 'Rahu', sign: 'Libra', house: 4, isRetrograde: true, nakshatra: 'Swati' },
    { planet: 'Ketu', sign: 'Aries', house: 10, isRetrograde: true, nakshatra: 'Ashwini' },
  ],
});

export const fetchKundliDasha = async () => ({
  profileId: 'profile-1',
  mahadasha: [
    { lord: 'Venus', start: '2011-10-25T02:43:00.000Z', end: '2031-10-25T02:43:00.000Z', current: true },
    { lord: 'Sun', start: '2031-10-25T02:43:00.000Z', end: '2037-10-24T14:43:00.000Z', current: false },
  ],
  currentAntardasha: [
    { lord: 'Venus', start: '2011-10-25T02:43:00.000Z', end: '2015-02-23T14:43:00.000Z', current: false },
    { lord: 'Saturn', start: '2024-08-24T11:43:00.000Z', end: '2027-10-25T02:43:00.000Z', current: true },
  ],
});

export const fetchKundliAntardasha = async (_profileId: string, lord: string) => ({
  profileId: 'profile-1',
  lord,
  antardasha: [
    { lord: 'Saturn', start: '2024-08-24T11:43:00.000Z', end: '2027-10-25T02:43:00.000Z', current: true },
  ],
});

export const fetchKundliDoshas = async () => ({
  profileId: 'profile-1',
  doshas: [
    { name: 'Kaal Sarp Dosha', present: false, description: 'Kalsarpa dosha is not detected in your horoscope.' },
    { name: 'Sade Sati', present: true, severity: 'Middle Phase', description: 'Yes, currently you are undergoing Sadhesati.' },
    { name: 'Pitra Dosha', present: false, description: 'Your horoscope is free from Pitra Dosha.' },
  ],
});

export const fetchKundliStrength = async () => ({
  profileId: 'profile-1',
  strength: [
    { planet: 'Sun', symbol: '☀', percentage: 116, rupas: 7.57 },
    { planet: 'Moon', symbol: '☽', percentage: 105, rupas: 6.32 },
    { planet: 'Mars', symbol: '♂', percentage: 123, rupas: 6.13 },
    { planet: 'Mercury', symbol: '☿', percentage: 125, rupas: 8.73 },
    { planet: 'Jupiter', symbol: '♃', percentage: 110, rupas: 7.13 },
    { planet: 'Venus', symbol: '♀', percentage: 125, rupas: 6.89 },
    { planet: 'Saturn', symbol: '♄', percentage: 130, rupas: 6.5 },
  ],
});

export const fetchKundliRemedies = async () => ({
  profileId: 'profile-1',
  remedies: [
    { type: 'puja', title: 'Nakshatra Pujan', description: 'Recommended to mitigate evil effects of vedha.' },
    { type: 'gemstone', title: 'Pearl', description: 'Wear a Pearl set in Silver on your Ring or Little finger to strengthen Moon.', frequency: 'Monday', planet: 'Moon' },
    { type: 'gemstone', title: 'Red Coral', description: 'Wear a Red Coral set in Gold on your Ring finger to strengthen Mars.', frequency: 'Tuesday', planet: 'Mars' },
    { type: 'gemstone', title: 'Yellow Sapphire', description: 'Wear a Yellow Sapphire set in Gold on your Index finger to strengthen Jupiter.', frequency: 'Thursday', planet: 'Jupiter' },
  ],
});

export const fetchWallet = async () => ({ balance: 1250, totalAdded: 3000, totalSpent: 1750 });

const TRANSACTIONS = [
  { id: 'l-1', title: 'Wallet Top-up', detail: 'UPI – GPay', timestamp: '13 Jul 2026 · 12:34 PM', amount: '+₹500', reference: '71312345', credit: true },
  { id: 'l-2', title: 'Chat Consultation', detail: 'Pt. Rajesh Sharma · 32 min', timestamp: '12 Jul 2026 · 11:32 AM', amount: '-₹640', reference: '71211231', credit: false },
  { id: 'l-3', title: 'Voice Consultation', detail: 'Kavita Joshi · 18 min', timestamp: '8 Jul 2026 · 3:44 PM', amount: '-₹270', reference: '70833412', credit: false },
  { id: 'l-4', title: 'Wallet Top-up', detail: 'Debit Card – HDFC', timestamp: '5 Jul 2026 · 2:10 PM', amount: '+₹1000', reference: '70521001', credit: true },
  { id: 'l-5', title: 'Chat Consultation', detail: 'Dr. Suresh Patel · 25 min', timestamp: '1 Jul 2026 · 10:05 AM', amount: '-₹375', reference: '70110055', credit: false },
];

export const fetchTransactions = async (filter: 'all' | 'added' | 'spent' = 'all') => {
  if (filter === 'added') return TRANSACTIONS.filter(row => row.credit);
  if (filter === 'spent') return TRANSACTIONS.filter(row => !row.credit);
  return TRANSACTIONS;
};
export const startTopUp = async () => ({
  transactionId: 't-1', reference: 'TXN-ABC123', orderId: 'ORD-1', amount: 500,
});
export const confirmTopUp = async () => ({ _id: 't-1', balanceAfter: 1750, status: 'success' });

export const precheckSession = async () => ({
  ok: true,
  astrologerAvailable: true,
  ratePerMinute: 20,
  minSessionMinutes: 3,
  minutesAffordable: 62,
  shortfallAmount: 0,
});
export const requestChat = async () => ({
  chatId: 'chat-1', status: 'requested', ratePerMinute: 20, expiresInSeconds: 120,
});
export const cancelChat = async () => ({});
export const endChat = async () => ({
  chatId: 'chat-1', status: 'ended', durationSeconds: 600, amountCharged: 200,
});
export const getChatState = async (chatId: string) => ({
  chatId,
  role: 'user' as const,
  channel: 'chat',
  status: 'active',
  startedAt: new Date().toISOString(),
  ratePerMinute: 20,
  minutesBilled: 0,
  amountCharged: 0,
  minutesRemaining: 62,
});
export const fetchConsultations = async () => [
  { id: 'c-1', astrologer: 'Pt. Rajesh Sharma', photo: undefined, topic: 'Career Job', timestamp: '12 Jul 2026, 11:00 AM', amount: '-₹640', duration: '32 min', channel: 'chat', status: 'ended' },
  { id: 'c-2', astrologer: 'Kavita Joshi', photo: undefined, topic: 'Marriage', timestamp: '8 Jul 2026, 3:30 PM', amount: '-₹270', duration: '18 min', channel: 'voice', status: 'ended' },
];
export const fetchRecentIntakeContacts = async () => [
  { id: 'chat-hist-1', fullName: 'Mithu Kumar', gender: 'male' as const, dateOfBirth: '15 August 1995', timeOfBirth: '06 : 30 AM', birthPlace: 'Mumbai, Maharashtra' },
];
export const fetchMessages = async () => [];
export const joinChat = async (chatId: string) => ({
  chatId, role: 'user' as const, status: 'active', seq: 0, unread: 0, messages: [],
});
export const sendMessage = async () => ({});

/**
 * No live server in a screen test, but the real join backfill's first
 * delivery is always the seeker's own intake — requestChat posts it the
 * moment the request goes out (services/chat.service.js) — so this mock
 * delivers that same one message, then stays quiet like an idle connection.
 */
type ConsultationHandlers = {
  onMessage?: (message: Record<string, unknown>) => void;
  onTick?: (payload: { chatId: string; minutesBilled: number; minutesRemaining: number; balanceRemaining?: number }) => void;
  onLowBalance?: (payload: {
    chatId: string;
    exhausted: boolean;
    paused?: boolean;
    minutesRemaining?: number;
    graceSeconds?: number;
    secondsUntilCut?: number;
    requiredAmount?: number;
    balanceRemaining?: number;
  }) => void;
  onAstrologerLeft?: (payload: { chatId: string; reconnectSeconds: number }) => void;
  onAstrologerJoined?: (payload: { chatId: string }) => void;
  onEnded?: (payload: { chatId: string; endedBy: string; reason?: string; durationSeconds: number; amountCharged: number }) => void;
  onPackageWarning?: (payload: Record<string, unknown>) => void;
  onPerMinuteStarted?: (payload: Record<string, unknown>) => void;
};

/** Whatever the screen currently under test subscribed with — lets a test fire a live event (see fireAstrologerLeft/fireAstrologerJoined below) the same way the real socket would. */
let consultationHandlers: ConsultationHandlers | null = null;

export const subscribeToConsultation = (chatId: string, _initialSeq: number, handlers: ConsultationHandlers) => {
  consultationHandlers = handlers;
  handlers.onMessage?.({
    id: 'msg-intake',
    chatId,
    senderId: 'u-1',
    senderRole: 'user',
    type: 'text',
    content: { text: 'Hi\nName: Mithu\nPOB: Delhi, India' },
    seq: 1,
    replyTo: null,
    status: 'sent',
    isIntake: true,
    createdAt: new Date().toISOString(),
  });
  return () => {
    consultationHandlers = null;
  };
};

/** Test-only: simulates the astrologer's own socket dropping/returning while the screen under test is subscribed. */
export const fireAstrologerLeft = (payload: { chatId: string; reconnectSeconds: number }) =>
  consultationHandlers?.onAstrologerLeft?.(payload);
export const fireAstrologerJoined = (payload: { chatId: string }) =>
  consultationHandlers?.onAstrologerJoined?.(payload);
/** Test-only: simulates the live billing tick warning the balance won't cover much more. */
export const fireLowBalance = (payload: {
  chatId: string;
  exhausted: boolean;
  paused?: boolean;
  minutesRemaining?: number;
  graceSeconds?: number;
  secondsUntilCut?: number;
  requiredAmount?: number;
  balanceRemaining?: number;
}) => consultationHandlers?.onLowBalance?.(payload);
/** Test-only: simulates a normal minute billing fine, which clears any standing low-balance banner. */
export const fireTick = (payload?: { chatId?: string; minutesBilled?: number; minutesRemaining?: number; balanceRemaining?: number }) =>
  consultationHandlers?.onTick?.({
    chatId: payload?.chatId ?? 'chat-1',
    minutesBilled: payload?.minutesBilled ?? 0,
    minutesRemaining: payload?.minutesRemaining ?? 0,
    balanceRemaining: payload?.balanceRemaining,
  });
/** Test-only: the package events, fired the way the real socket would. */
export const firePackageWarning = (payload: Record<string, unknown>) => consultationHandlers?.onPackageWarning?.(payload);
export const firePerMinuteStarted = (payload: Record<string, unknown>) => consultationHandlers?.onPerMinuteStarted?.(payload);
export const fireEnded = (payload?: { reason?: string }) =>
  consultationHandlers?.onEnded?.({ chatId: 'chat-1', endedBy: 'system', reason: payload?.reason, durationSeconds: 240, amountCharged: 60 });
export const subscribeToRequest = () => () => {};
/** App.tsx opens/closes the one live socket around the session — nothing to open in a test. */
export const connectLiveUpdates = () => null;
export const disconnectLiveUpdates = () => {};

export const fetchAiThread = async () => ({ chatId: 'ai-1', items: [] });
export const askAi = async () => ({
  chatId: 'ai-1',
  question: { id: 'q1', senderRole: 'user', content: { text: 'Hi' } },
  answer: { id: 'a1', senderRole: 'ai', content: { text: 'Namaste' } },
});

const NOTIFICATIONS: Array<{
  id: string;
  type: string;
  title: string;
  body: string;
  createdAt: string;
  readAt: string | undefined;
}> = [
  { id: 'n-1', type: 'system', title: 'Mercury goes Direct today!', body: 'Mercury retrograde ends today. Favorable time for signing contracts.', createdAt: '2026-08-17T00:00:00.000Z', readAt: undefined },
  { id: 'n-2', type: 'consultation_ended', title: 'Consultation completed', body: 'Your chat with Pt. Rajesh Sharma has ended.', createdAt: '2026-08-18T00:00:00.000Z', readAt: undefined },
  { id: 'n-3', type: 'wallet_credit', title: 'Wallet Credited', body: 'Your wallet has been topped up.', createdAt: '2026-08-16T00:00:00.000Z', readAt: '2026-08-16T01:00:00.000Z' },
];

export const fetchNotifications = async () => ({
  items: NOTIFICATIONS,
  total: NOTIFICATIONS.length,
  unread: NOTIFICATIONS.filter(row => !row.readAt).length,
});

export const markNotificationsRead = async (notificationId?: string) => {
  const now = new Date().toISOString();
  for (const row of NOTIFICATIONS) {
    if (!notificationId || row.id === notificationId) row.readAt = now;
  }
  return { updated: NOTIFICATIONS.length, unread: NOTIFICATIONS.filter(row => !row.readAt).length };
};
export const raiseTicket = async () => ({ id: 't-1', reference: 'TKT-ABC' });

export const fetchSettings = async () => ({
  minRecharge: 10,
  maxRecharge: 100000,
  minPayout: 100,
  features: { aiAssistant: true, maintenanceMode: false },
  appVersions: { minimumSupported: '1.0.0' },
});
