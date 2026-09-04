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
import {
  DUMMY_AI_THREAD,
  DUMMY_ASTROLOGERS,
  DUMMY_CONSULTATIONS,
  DUMMY_FAVOURITE_IDS,
  DUMMY_HOME,
  DUMMY_HOROSCOPES,
  DUMMY_KUNDLIS,
  DUMMY_MESSAGES,
  DUMMY_NOTIFICATIONS,
  DUMMY_SETTINGS,
  DUMMY_TRANSACTIONS,
  DUMMY_USER,
  DUMMY_WALLET,
  nextTicketReference,
} from './dummyData';
import {
  USE_DUMMY_ASTROLOGERS,
  USE_DUMMY_AUTH,
  USE_DUMMY_DATA,
  USE_DUMMY_HOME,
  USE_DUMMY_NOTIFICATIONS,
  USE_DUMMY_WALLET,
} from './dummyMode';

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

/** An ISO date -> "5 mins ago" / "2 hrs ago" / "Yesterday" / "12 Jul 2026". */
export const timeAgo = (value?: string) => {
  if (!value) return '—';
  const then = new Date(value).getTime();
  if (Number.isNaN(then)) return '—';

  const minutes = Math.floor((Date.now() - then) / 60000);
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes} min${minutes === 1 ? '' : 's'} ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hr${hours === 1 ? '' : 's'} ago`;

  const days = Math.floor(hours / 24);
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days} days ago`;

  return shortDate(value);
};

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
  if (USE_DUMMY_HOME) return DUMMY_HOME;
  const { data } = await client.get<Home>('/users/me/home');
  return data;
}

/** Today's reading for one sign, or all twelve. Open to anyone. */
export async function fetchHoroscope(sign?: string) {
  if (USE_DUMMY_DATA) return sign ? DUMMY_HOROSCOPES[sign] : DUMMY_HOROSCOPES;
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
  gender?: string;
  badges?: string[];
  sort?: 'recommended' | 'experience' | 'price_low' | 'price_high' | 'popular';
  page?: number;
  limit?: number;
};

/** Runs the same narrowing the server would, over the fixture directory. */
function filterDummyAstrologers(filters: DirectoryFilters): DirectoryCard[] {
  const search = filters.search?.trim().toLowerCase();

  let rows = DUMMY_ASTROLOGERS.filter(row => {
    if (search && !row.name.toLowerCase().includes(search) && !row.expertise.some(item => item.includes(search))) {
      return false;
    }
    if (filters.online && !row.online) return false;
    if (filters.expertise?.length && !filters.expertise.some(item => row.expertise.includes(item))) return false;
    if (filters.languages?.length && !filters.languages.some(item => row.languages.includes(item))) return false;
    if (filters.topics?.length && !filters.topics.some(item => row.topics.includes(item))) return false;
    if (filters.badges?.length && !filters.badges.some(item => row.badges.includes(item))) return false;
    if (filters.gender && row.gender !== filters.gender) return false;
    if (filters.minExperience !== undefined && row.experienceYears < filters.minExperience) return false;
    if (filters.maxRate !== undefined && row.rates.chat.now > filters.maxRate) return false;
    return true;
  });

  switch (filters.sort) {
    case 'experience':
      rows = [...rows].sort((a, b) => b.experienceYears - a.experienceYears);
      break;
    case 'price_low':
      rows = [...rows].sort((a, b) => a.rates.chat.now - b.rates.chat.now);
      break;
    case 'price_high':
      rows = [...rows].sort((a, b) => b.rates.chat.now - a.rates.chat.now);
      break;
    case 'popular':
      rows = [...rows].sort((a, b) => b.consultations - a.consultations);
      break;
    default:
      break;
  }

  const limit = filters.limit ?? rows.length;
  return rows.slice(0, limit);
}

/** The Find Astrologers and Consult screens. */
export async function fetchAstrologers(
  filters: DirectoryFilters = {},
): Promise<{ items: DirectoryCard[]; total: number }> {
  if (USE_DUMMY_ASTROLOGERS) {
    const items = filterDummyAstrologers(filters);
    return { items, total: items.length };
  }

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

/** The astrologer detail screen: the card fields plus about and gallery. */
export async function fetchAstrologer(astrologerId: string) {
  if (USE_DUMMY_ASTROLOGERS) {
    const astrologer = DUMMY_ASTROLOGERS.find(row => row.id === astrologerId);
    if (!astrologer) {
      throw new Error('That astrologer is no longer listed.');
    }
    return astrologer;
  }
  const { data } = await client.get(`/astrologers/${astrologerId}`);
  return data.astrologer;
}

/** Adds or removes a favourite. The answer says which way it went. */
export async function toggleFavourite(astrologerId: string): Promise<boolean> {
  if (USE_DUMMY_ASTROLOGERS) {
    const index = DUMMY_FAVOURITE_IDS.indexOf(astrologerId);
    if (index === -1) {
      DUMMY_FAVOURITE_IDS.push(astrologerId);
      return true;
    }
    DUMMY_FAVOURITE_IDS.splice(index, 1);
    return false;
  }
  const { data } = await client.post(`/users/me/favourites/${astrologerId}`, {});
  return Boolean(data.favourite);
}

export async function fetchFavourites(): Promise<DirectoryCard[]> {
  if (USE_DUMMY_ASTROLOGERS) {
    return DUMMY_ASTROLOGERS.filter(row => DUMMY_FAVOURITE_IDS.includes(row.id));
  }
  const { data } = await client.get('/users/me/favourites');
  return data.items ?? [];
}

/* -------------------------------------------------------------------------- */
/* The seeker's own account                                                   */
/* -------------------------------------------------------------------------- */

export async function fetchProfile() {
  if (USE_DUMMY_AUTH) return DUMMY_USER;
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
  if (USE_DUMMY_AUTH) {
    const { photo, fullName, ...fields } = changes;
    Object.assign(DUMMY_USER, fields);
    if (fullName) DUMMY_USER.name = fullName;
    if (photo) DUMMY_USER.avatarUrl = photo.uri;
    return { ...DUMMY_USER };
  }

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
  if (USE_DUMMY_DATA) return prefs;
  const { data } = await client.patch('/users/me/notification-prefs', prefs);
  return data.notificationPrefs;
}

/* ----------------------------------------------------------------- kundlis */

export async function fetchKundlis() {
  if (USE_DUMMY_DATA) return DUMMY_KUNDLIS;
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
  if (USE_DUMMY_DATA) {
    const kundli = { id: `kundli-${DUMMY_KUNDLIS.length + 1}`, createdAt: new Date().toISOString(), ...input };
    DUMMY_KUNDLIS.push(kundli);
    return kundli;
  }
  const { data } = await client.post('/users/me/kundlis', input);
  return data.kundli;
}

export async function deleteKundli(kundliId: string) {
  if (USE_DUMMY_DATA) {
    const index = DUMMY_KUNDLIS.findIndex(entry => entry.id === kundliId);
    if (index !== -1) DUMMY_KUNDLIS.splice(index, 1);
    return;
  }
  await client.delete(`/users/me/kundlis/${kundliId}`);
}

/* -------------------------------------------------------------------------- */
/* Wallet                                                                     */
/* -------------------------------------------------------------------------- */

export async function fetchWallet() {
  if (USE_DUMMY_WALLET) return DUMMY_WALLET;
  const { data } = await client.get('/wallet');
  return data.wallet;
}

/** The ledger. `filter` is what the screen's three tabs send. */
export async function fetchTransactions(filter: 'all' | 'added' | 'spent' = 'all') {
  if (USE_DUMMY_WALLET) {
    const rows = DUMMY_TRANSACTIONS.filter(row => {
      if (filter === 'added') return row.direction === 'credit';
      if (filter === 'spent') return row.direction === 'debit';
      return true;
    });
    return rows.map(row => ({
      id: row._id,
      title: row.title || titleCase(row.type),
      detail: titleCase(row.type),
      timestamp: dateTime(row.createdAt),
      amount: `${row.direction === 'credit' ? '+' : '−'} ${rupees(row.amount)}`,
      reference: row.reference,
      credit: row.direction === 'credit',
    }));
  }
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
/** Amounts `startTopUp` has quoted but not yet settled, keyed by transactionId. */
const dummyPendingTopUps = new Map<string, number>();

export async function startTopUp(amount: number) {
  if (USE_DUMMY_WALLET) {
    const transactionId = `pending-${Date.now()}`;
    dummyPendingTopUps.set(transactionId, amount);
    return {
      transactionId,
      reference: `TXN-${Math.random().toString(36).slice(2, 8).toUpperCase()}`,
      orderId: `order-${transactionId}`,
      amount,
    };
  }
  const { data } = await client.post('/wallet/topup', { amount });
  return data as { transactionId: string; reference: string; orderId: string; amount: number };
}

/**
 * `method` is cosmetic today — there is no gateway to report one back — but
 * it is recorded on the transaction so the receipt shows what the user
 * picked, and so nothing has to change here once a real gateway does.
 */
export async function confirmTopUp(transactionId: string, paymentId?: string, method?: string) {
  if (USE_DUMMY_WALLET) {
    const amount = dummyPendingTopUps.get(transactionId) ?? 0;
    dummyPendingTopUps.delete(transactionId);

    DUMMY_WALLET.balance += amount;
    DUMMY_WALLET.totalAdded += amount;
    DUMMY_WALLET.lastTransactionAt = new Date().toISOString();
    DUMMY_HOME.wallet.balance = DUMMY_WALLET.balance;

    const reference = `TXN-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
    DUMMY_TRANSACTIONS.unshift({
      _id: transactionId,
      reference,
      title: 'Wallet Top-up',
      type: 'topup',
      direction: 'credit',
      amount,
      createdAt: new Date().toISOString(),
    });

    return {
      id: transactionId,
      reference,
      amount,
      balanceAfter: DUMMY_WALLET.balance,
      status: 'success',
      method,
    };
  }
  const { data } = await client.post('/wallet/topup/confirm', { transactionId, paymentId, method });
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
  if (USE_DUMMY_DATA) {
    const astrologer = DUMMY_ASTROLOGERS.find(row => row.id === astrologerId);
    const service = channel === 'call' ? astrologer?.rates.call : astrologer?.rates.chat;
    return {
      chatId: `chat-${Date.now()}`,
      status: astrologer?.busy ? 'requested' : 'active',
      ratePerMinute: service?.now ?? 0,
      freeMinutes: astrologer?.freeMinutes ?? 0,
      expiresInSeconds: 90,
    };
  }
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
  if (USE_DUMMY_DATA) return { chatId, status: 'cancelled' };
  const { data } = await client.post(`/chats/${chatId}/cancel`, {});
  return data;
}

export async function endChat(chatId: string, reason?: string) {
  if (USE_DUMMY_DATA) {
    return { chatId, status: 'ended', durationSeconds: 0, amountCharged: 0 };
  }
  const { data } = await client.post(`/chats/${chatId}/end`, { reason });
  return data as {
    chatId: string;
    status: string;
    durationSeconds: number;
    amountCharged: number;
  };
}

/** The consultation history screen. */
export async function fetchConsultations(status?: string) {
  if (USE_DUMMY_DATA) {
    const rows = status ? DUMMY_CONSULTATIONS.filter(row => row.status === status) : DUMMY_CONSULTATIONS;
    return rows.map(row => ({
      id: row.id,
      astrologer: row.with?.name ?? 'Astrologer',
      photo: row.with?.photo,
      topic: titleCase(row.topic ?? 'general'),
      timestamp: dateTime(row.endedAt ?? row.createdAt),
      amount: rupees(row.amountCharged),
      duration: minutesOf(row.durationSeconds),
      channel: row.channel === 'call' ? 'voice' : 'chat',
      status: row.status,
    }));
  }

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
    status: row.status,
  }));
}

/** One page of the transcript, oldest first. */
export async function fetchMessages(chatId: string, beforeSeq?: number) {
  if (USE_DUMMY_DATA) return DUMMY_MESSAGES;
  const { data } = await client.get(`/chats/${chatId}/messages`, {
    params: { beforeSeq, limit: 50 },
  });
  return data.items ?? [];
}

/** Sending without a socket — the fallback when the connection is down. */
export async function sendMessage(chatId: string, text: string, clientMessageId?: string) {
  if (USE_DUMMY_DATA) {
    const message = {
      id: clientMessageId ?? `msg-${DUMMY_MESSAGES.length + 1}`,
      senderRole: 'user',
      content: { text },
      createdAt: new Date().toISOString(),
    };
    DUMMY_MESSAGES.push(message);
    return message;
  }
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
  if (USE_DUMMY_DATA) return DUMMY_AI_THREAD;
  const { data } = await client.get('/chats/ai', { params: { limit: 50 } });
  return data as { chatId: string; items: any[] };
}

/** Returns both turns, so the screen can append them together. */
export async function askAi(text: string, clientMessageId?: string) {
  if (USE_DUMMY_DATA) {
    const question = {
      id: clientMessageId ?? `ai-msg-${DUMMY_AI_THREAD.items.length + 1}`,
      senderRole: 'user',
      content: { text },
      createdAt: new Date().toISOString(),
    };
    const answer = {
      id: `ai-msg-${DUMMY_AI_THREAD.items.length + 2}`,
      senderRole: 'ai',
      content: {
        text: 'The stars are still aligning on that one — in the meantime, focus on what you can control today.',
      },
      createdAt: new Date().toISOString(),
    };
    DUMMY_AI_THREAD.items.push(question, answer);
    return { chatId: DUMMY_AI_THREAD.chatId, question, answer };
  }
  const { data } = await client.post('/chats/ai/messages', { text, clientMessageId });
  return data as { chatId: string; question: any; answer: any };
}

/* -------------------------------------------------------------------------- */
/* Notifications and support                                                  */
/* -------------------------------------------------------------------------- */

export type NotificationRow = {
  id: string;
  type: string;
  title: string;
  body?: string;
  action?: { screen?: string; id?: string };
  createdAt: string;
  readAt?: string;
};

export async function fetchNotifications() {
  if (USE_DUMMY_NOTIFICATIONS) {
    return {
      items: DUMMY_NOTIFICATIONS as NotificationRow[],
      total: DUMMY_NOTIFICATIONS.length,
      unread: DUMMY_NOTIFICATIONS.filter(row => !row.readAt).length,
    };
  }
  const { data } = await client.get('/notifications', { params: { limit: 50 } });
  return data as { items: NotificationRow[]; total: number; unread: number };
}

export async function markNotificationsRead(notificationId?: string) {
  if (USE_DUMMY_NOTIFICATIONS) {
    const now = new Date().toISOString();
    for (const notification of DUMMY_NOTIFICATIONS) {
      if (!notificationId || notification.id === notificationId) {
        notification.readAt = now;
      }
    }
    return { ok: true };
  }
  const { data } = await client.post('/notifications/read', { notificationId });
  return data as { updated: number; unread: number };
}

export async function raiseTicket(issueType: string, description: string, chatId?: string) {
  if (USE_DUMMY_DATA) {
    return {
      id: `ticket-${Date.now()}`,
      reference: nextTicketReference(),
      issueType,
      description,
      chatId,
      status: 'open',
      createdAt: new Date().toISOString(),
    };
  }
  const { data } = await client.post('/support/tickets', { issueType, description, chatId });
  return data.ticket;
}

/* -------------------------------------------------------------------------- */
/* Platform settings                                                          */
/* -------------------------------------------------------------------------- */

/** Read on launch: recharge limits, feature switches, app versions. */
export async function fetchSettings() {
  if (USE_DUMMY_DATA) return DUMMY_SETTINGS;
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
