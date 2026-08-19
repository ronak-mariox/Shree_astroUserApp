/**
 * Everything the signed-in screens read or write.
 *
 * This is the only file that talks to the server. Each function calls a real
 * endpoint and maps between two vocabularies: the API speaks in ids and
 * numbers (`expertise: ['vedic']`, `ratePerMinute: 20`), and the screens were
 * drawn against readable strings (`"Vedic Astrology"`, `"₹20/min"`). The
 * adapters below do that translation, so no screen has to know either shape.
 *
 * Every function throws an `ApiError` when the server refuses; a screen catches
 * it and shows `error.message`, which is always safe to print.
 */

import { client } from './client';

/* -------------------------------------------------------------------------- */
/* Translating between the API's ids and the screens' words                   */
/* -------------------------------------------------------------------------- */

/** "vedic" -> "Vedic", "face-reading" -> "Face Reading". */
export const titleCase = (value: string) =>
  String(value)
    .split(/[-_\s]+/)
    .filter(Boolean)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

/** ["vedic","tarot"] -> "Vedic, Tarot". */
export const joinLabels = (values?: string[]) => (values ?? []).map(titleCase).join(', ');

/** 1250 -> "₹1,250". */
export const rupees = (value?: number) => `₹${Math.round(Number(value) || 0).toLocaleString('en-IN')}`;

/** 1325 seconds -> "22 min". */
export const minutesOf = (seconds?: number) =>
  seconds ? `${Math.ceil(seconds / 60)} min` : '—';

/** An ISO date -> "12 Jul 2026". */
export const shortDate = (value?: string) =>
  value
    ? new Date(value).toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      })
    : '—';

/** An ISO date -> "12 Jul 2026, 04:20 PM". */
export const dateTime = (value?: string) =>
  value
    ? `${shortDate(value)}, ${new Date(value).toLocaleTimeString('en-GB', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      })}`
    : '—';

/* -------------------------------------------------------------------------- */
/* Home                                                                       */
/* -------------------------------------------------------------------------- */

export type Home = {
  profile: { name: string; avatarUrl?: string; sunSign?: string; dateOfBirth?: string };
  wallet: { balance: number; currency: string };
  horoscope: {
    sign: string;
    reading: string;
    luckyNumber: number;
    colour: string;
    energy: string;
  } | null;
  planetPositions: { date: string; planets: Array<{ glyph: string; name: string; sign: string }> };
  freeConsultation: { isUsed: boolean; minutes: number };
  unreadNotifications: number;
  recentConsultations: Array<{
    id: string;
    astrologer?: string;
    photo?: string;
    channel: string;
    durationSeconds: number;
    amount: number;
    endedAt: string;
  }>;
};

/** Everything the home screen prints, in one call. */
export async function fetchHome(): Promise<Home> {
  const { data } = await client.get<Home>('/users/me/home');
  return data;
}

/** Today's reading for one sign, or all twelve. Open to anyone. */
export async function fetchHoroscope(sign?: string) {
  const { data } = await client.get('/horoscope', { params: { sign } });
  return sign ? data.horoscope : data;
}

/* -------------------------------------------------------------------------- */
/* The directory                                                              */
/* -------------------------------------------------------------------------- */

/** One astrologer, in the shape every listing card reads. */
export type DirectoryCard = {
  id: string;
  name: string;
  photo?: string;
  online: boolean;
  busy: boolean;
  waitSeconds: number;
  expertise: string[];
  languages: string[];
  experienceYears: number;
  rating: number;
  ratingCount: number;
  consultations: number;
  badges: string[];
  rates: {
    chat: { was: number; now: number } | null;
    call: { was: number; now: number } | null;
  };
  freeMinutes: number;
};

export type DirectoryFilters = {
  search?: string;
  expertise?: string[];
  languages?: string[];
  /** Life areas — what the Consult tab's category row narrows by. */
  topics?: string[];
  online?: boolean;
  minExperience?: number;
  maxRate?: number;
  minRating?: number;
  gender?: string;
  badges?: string[];
  sort?: 'recommended' | 'rating' | 'experience' | 'price_low' | 'price_high' | 'popular';
  page?: number;
  limit?: number;
};

/** The Find Astrologers and Consult screens. */
export async function fetchAstrologers(
  filters: DirectoryFilters = {},
): Promise<{ items: DirectoryCard[]; total: number }> {
  const { data } = await client.get('/astrologers', {
    params: {
      ...filters,
      /** Lists travel as `a,b`; axios would otherwise repeat the key. */
      expertise: filters.expertise?.join(','),
      languages: filters.languages?.join(','),
      topics: filters.topics?.join(','),
      badges: filters.badges?.join(','),
    },
  });
  return data;
}

/** The astrologer detail screen: the card fields plus about, gallery, reviews. */
export async function fetchAstrologer(astrologerId: string) {
  const { data } = await client.get(`/astrologers/${astrologerId}`);
  return data.astrologer;
}

export async function fetchAstrologerReviews(astrologerId: string, page = 1) {
  const { data } = await client.get(`/astrologers/${astrologerId}/reviews`, {
    params: { page, limit: 20 },
  });
  return data.items ?? [];
}

/** Adds or removes a favourite. The answer says which way it went. */
export async function toggleFavourite(astrologerId: string): Promise<boolean> {
  const { data } = await client.post(`/users/me/favourites/${astrologerId}`, {});
  return Boolean(data.favourite);
}

export async function fetchFavourites(): Promise<DirectoryCard[]> {
  const { data } = await client.get('/users/me/favourites');
  return data.items ?? [];
}

/* -------------------------------------------------------------------------- */
/* The seeker's own account                                                   */
/* -------------------------------------------------------------------------- */

export async function fetchProfile() {
  const { data } = await client.get('/users/me');
  return data.user;
}

/**
 * Edit Profile.
 *
 * Sent as multipart when a new photo comes with it, because React Native
 * streams the file from the picker's uri.
 */
export async function saveProfile(changes: {
  fullName?: string;
  email?: string;
  gender?: string;
  dateOfBirth?: string;
  timeOfBirth?: string;
  placeOfBirth?: string;
  photo?: { uri: string; name?: string; type?: string };
}) {
  if (!changes.photo) {
    const { data } = await client.patch('/users/me', changes);
    return data.user;
  }

  const form = new FormData();
  for (const [key, value] of Object.entries(changes)) {
    if (key !== 'photo' && value !== undefined) {
      form.append(key, String(value));
    }
  }
  form.append('photo', {
    uri: changes.photo.uri,
    name: changes.photo.name || 'profile.jpg',
    type: changes.photo.type || 'image/jpeg',
  } as unknown as Blob);

  const { data } = await client.patch('/users/me', form);
  return data.user;
}

export async function updateNotificationPrefs(prefs: Record<string, boolean>) {
  const { data } = await client.patch('/users/me/notification-prefs', prefs);
  return data.notificationPrefs;
}

/* ----------------------------------------------------------------- kundlis */

export async function fetchKundlis() {
  const { data } = await client.get('/users/me/kundlis');
  return data.items ?? [];
}

export async function saveKundli(input: {
  label?: string;
  relation?: string;
  fullName: string;
  gender?: string;
  dateOfBirth: string;
  timeOfBirth: string;
  placeOfBirth: string;
  chart?: unknown;
}) {
  const { data } = await client.post('/users/me/kundlis', input);
  return data.kundli;
}

export async function deleteKundli(kundliId: string) {
  await client.delete(`/users/me/kundlis/${kundliId}`);
}

/* -------------------------------------------------------------------------- */
/* Wallet                                                                     */
/* -------------------------------------------------------------------------- */

export async function fetchWallet() {
  const { data } = await client.get('/wallet');
  return data.wallet;
}

/** The ledger. `filter` is what the screen's three tabs send. */
export async function fetchTransactions(filter: 'all' | 'added' | 'spent' = 'all') {
  const { data } = await client.get('/wallet/transactions', {
    params: { filter, limit: 50 },
  });
  return (data.items ?? []).map((row: any) => ({
    id: String(row._id),
    title: row.title || titleCase(row.type),
    detail: titleCase(row.type),
    timestamp: dateTime(row.createdAt),
    amount: `${row.direction === 'credit' ? '+' : '−'} ${rupees(row.amount)}`,
    reference: row.reference,
    credit: row.direction === 'credit',
  }));
}

/**
 * Adding money, in two steps.
 *
 * There is no payment gateway wired up yet, so `startTopUp` returns an order the
 * app confirms straight away. When one is added, take its result to
 * `confirmTopUp` instead.
 */
export async function startTopUp(amount: number) {
  const { data } = await client.post('/wallet/topup', { amount });
  return data as { transactionId: string; reference: string; orderId: string; amount: number };
}

export async function confirmTopUp(transactionId: string, paymentId?: string) {
  const { data } = await client.post('/wallet/topup/confirm', { transactionId, paymentId });
  return data.transaction;
}

/* -------------------------------------------------------------------------- */
/* Consultations                                                              */
/* -------------------------------------------------------------------------- */

/** What the Chat Intake screen collects. */
export type Intake = {
  topic: string;
  question?: string;
  minutes?: number;
  birthDetails?: {
    fullName?: string;
    gender?: string;
    dateOfBirth?: string;
    timeOfBirth?: string;
    place?: { formatted?: string };
  };
};

/** Asks an astrologer for a chat. The rate is fixed at this moment. */
export async function requestChat(astrologerId: string, intake: Intake, channel = 'chat') {
  const { data } = await client.post('/chats', { astrologerId, channel, intake });
  return data as {
    chatId: string;
    status: string;
    ratePerMinute: number;
    freeMinutes: number;
    expiresInSeconds: number;
  };
}

export async function cancelChat(chatId: string) {
  const { data } = await client.post(`/chats/${chatId}/cancel`, {});
  return data;
}

export async function endChat(chatId: string, reason?: string) {
  const { data } = await client.post(`/chats/${chatId}/end`, { reason });
  return data as {
    chatId: string;
    status: string;
    durationSeconds: number;
    amountCharged: number;
  };
}

export async function rateChat(chatId: string, rating: number, comment?: string) {
  const { data } = await client.post(`/chats/${chatId}/rate`, { rating, comment });
  return data;
}

/** The consultation history screen. */
export async function fetchConsultations(status?: string) {
  const { data } = await client.get('/chats', { params: { status, limit: 50 } });

  return (data.items ?? []).map((row: any) => ({
    id: row.id,
    astrologer: row.with?.name ?? 'Astrologer',
    photo: row.with?.photo,
    topic: titleCase(row.topic ?? 'general'),
    timestamp: dateTime(row.endedAt ?? row.createdAt),
    amount: rupees(row.amountCharged),
    duration: minutesOf(row.durationSeconds),
    channel: row.channel === 'call' ? 'voice' : 'chat',
    rating: row.rating,
    status: row.status,
  }));
}

/** One page of the transcript, oldest first. */
export async function fetchMessages(chatId: string, beforeSeq?: number) {
  const { data } = await client.get(`/chats/${chatId}/messages`, {
    params: { beforeSeq, limit: 50 },
  });
  return data.items ?? [];
}

/** Sending without a socket — the fallback when the connection is down. */
export async function sendMessage(chatId: string, text: string, clientMessageId?: string) {
  const { data } = await client.post(`/chats/${chatId}/messages`, {
    type: 'text',
    content: { text },
    clientMessageId,
  });
  return data.message;
}

/* -------------------------------------------------------------------------- */
/* The AI assistant                                                           */
/* -------------------------------------------------------------------------- */

/** One thread per seeker, kept for good. Free — nothing is ever billed. */
export async function fetchAiThread() {
  const { data } = await client.get('/chats/ai', { params: { limit: 50 } });
  return data as { chatId: string; items: any[] };
}

/** Returns both turns, so the screen can append them together. */
export async function askAi(text: string, clientMessageId?: string) {
  const { data } = await client.post('/chats/ai/messages', { text, clientMessageId });
  return data as { chatId: string; question: any; answer: any };
}

/* -------------------------------------------------------------------------- */
/* Notifications and support                                                  */
/* -------------------------------------------------------------------------- */

export async function fetchNotifications() {
  const { data } = await client.get('/notifications', { params: { limit: 50 } });
  return data as { items: any[]; total: number; unread: number };
}

export async function markNotificationsRead(notificationId?: string) {
  const { data } = await client.post('/notifications/read', { notificationId });
  return data;
}

export async function raiseTicket(issueType: string, description: string, chatId?: string) {
  const { data } = await client.post('/support/tickets', { issueType, description, chatId });
  return data.ticket;
}

/* -------------------------------------------------------------------------- */
/* Platform settings                                                          */
/* -------------------------------------------------------------------------- */

/** Read on launch: recharge limits, feature switches, app versions. */
export async function fetchSettings() {
  const { data } = await client.get('/settings');
  return data.settings as {
    minRecharge: number;
    maxRecharge: number;
    minPayout: number;
    freeTrialMinutes: number;
    features: Record<string, boolean>;
    appVersions: Record<string, string>;
    supportEmail?: string;
    supportPhone?: string;
  };
}
