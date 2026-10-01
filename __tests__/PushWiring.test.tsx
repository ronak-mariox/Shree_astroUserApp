/**
 * Push notifications, as the shell uses them (App.tsx): on once somebody is
 * signed in, a foreground push shown in the app's own dialog, a tapped one
 * — in the tray, or its row in the Notifications list — opening the screen
 * it is about, and off again on logout, before the session goes.
 *
 * services/push.ts itself is covered in push.test.ts, and the table of where
 * each action leads in notificationRoutes.test.ts; Firebase here is the same
 * stub (a device that grants permission and has a token).
 */
import React from 'react';
import { Text } from 'react-native';
import ReactTestRenderer from 'react-test-renderer';

import App from '../App';
import * as messagingMock from './helpers/firebaseMessagingMock';
import { AvailableAstrologersScreen } from '../src/screens/AvailableAstrologersScreen';
import { ConsultationChatScreen } from '../src/screens/ConsultationChatScreen';
import { ConsultationHistoryScreen } from '../src/screens/ConsultationHistoryScreen';
import { HomeScreen } from '../src/screens/HomeScreen';
import { NotificationsScreen } from '../src/screens/NotificationsScreen';
import { ProfileScreen } from '../src/screens/ProfileScreen';
import { WalletScreen } from '../src/screens/WalletScreen';
import { WelcomeScreen } from '../src/screens/WelcomeScreen';
import * as api from '../src/services/api';
import { signOut } from '../src/services/auth';
import { disablePush } from '../src/services/push';
import { clearSession, saveSession } from '../src/services/session';

jest.mock('react-native-safe-area-context', () => {
  const actual = jest.requireActual('react-native-safe-area-context');
  const ReactActual = jest.requireActual('react');
  const initialMetrics = {
    frame: { x: 0, y: 0, width: 390, height: 844 },
    insets: { top: 47, left: 0, right: 0, bottom: 34 },
  };
  return {
    ...actual,
    SafeAreaProvider: ({ children }: { children: React.ReactNode }) =>
      ReactActual.createElement(actual.SafeAreaProvider, { initialMetrics }, children),
  };
});

/** The stub jest.setup.js registered — the very object services/push.ts loads. */
const messaging = jest.requireMock('@react-native-firebase/messaging') as typeof messagingMock;
const registerDevice = api.registerDevice as jest.Mock;
const unregisterDevice = api.unregisterDevice as jest.Mock;

type Tree = ReactTestRenderer.ReactTestRenderer;
let tree: Tree;

const flush = async () => {
  await ReactTestRenderer.act(async () => {
    for (let i = 0; i < 10; i += 1) await Promise.resolve();
  });
};

const renderApp = async () => {
  await ReactTestRenderer.act(async () => {
    tree = ReactTestRenderer.create(<App />);
  });
  /** The keystore read settles over a few ticks before the shell decides where to go. */
  for (let i = 0; i < 40; i += 1) {
    await flush();
    if (tree.root.findAllByType(WelcomeScreen).length + tree.root.findAllByType(AvailableAstrologersScreen).length > 0) break;
    await ReactTestRenderer.act(async () => {
      await new Promise<void>(resolve => setTimeout(() => resolve(), 50));
    });
  }
  await flush();
  return tree;
};

const textOf = (): string => {
  const walk = (node: any): string => {
    if (node === null || node === undefined) return '';
    if (typeof node === 'string') return node;
    if (Array.isArray(node)) return node.map(walk).join('');
    if (typeof node === 'object') return walk(node.children);
    return '';
  };
  return walk(tree.toJSON());
};

const press = async (label: string) => {
  const target = tree.root.findAll(
    n => typeof n.type !== 'string' && typeof n.props.onPress === 'function' && n.props.accessibilityLabel === label,
  )[0];
  if (!target) throw new Error(`nothing pressable labelled "${label}"`);
  await ReactTestRenderer.act(async () => {
    await target.props.onPress();
  });
  await flush();
};

/** Delivers an event the way the native side would, and lets the shell react to it. */
const deliver = async (kind: 'message' | 'opened', payload: unknown) => {
  await ReactTestRenderer.act(async () => {
    messaging.__emit(kind, payload);
  });
  await flush();
};

const SESSION = {
  accessToken: 'test-access',
  refreshToken: 'test-refresh',
  user: { id: 'u-1', name: 'Arjun Sharma', email: 'arjun@example.com', phone: '9876543210', profileComplete: true },
};

const WALLET_PUSH = {
  notification: { title: 'Wallet credited', body: '₹500 was added to your wallet.' },
  data: { notificationId: 'n-42', type: 'wallet_credit', action: '{"screen":"wallets"}' },
};

/** Something the app has no screen for — a store order is a website feature. */
const ORDER_PUSH = {
  notification: { title: 'Order shipped', body: 'Your order is on its way.' },
  data: { notificationId: 'n-43', type: 'system', action: '{"screen":"order","id":"o-1"}' },
};

const consultationPush = (screen: 'consultation' | 'consultationChat', chatId: string) => ({
  notification: { title: 'Your astrologer is ready', body: 'Your consultation has started.' },
  data: { notificationId: 'n-44', type: 'consultation_started', action: JSON.stringify({ screen, id: chatId }) },
});

/** GET /chats/:chatId, as far as the shell reads it. */
const chatState = (chatId: string, status: string, channel = 'chat') =>
  ({ chatId, role: 'user', channel, status, ratePerMinute: 20, minutesBilled: 0, amountCharged: 0 }) as never;

const shows = (screen: React.ComponentType<any>) => tree.root.findAllByType(screen).length === 1;

/** The row in the Notifications list with this title — the pressable itself, whether or not it is enabled. */
const rowTitled = (title: string) => {
  const row = tree.root.findAll(
    n =>
      typeof n.type !== 'string' &&
      typeof n.props.onPress === 'function' &&
      n.findAllByType(Text).some(text => text.props.children === title),
  )[0];
  if (!row) throw new Error(`no notification row titled "${title}"`);
  return row;
};

const pressRow = async (title: string) => {
  const row = rowTitled(title);
  expect(row.props.accessibilityRole).toBe('button');
  await ReactTestRenderer.act(async () => {
    row.props.onPress();
  });
  await flush();
};

beforeEach(() => {
  jest.clearAllMocks();
});

afterEach(async () => {
  await ReactTestRenderer.act(() => {
    tree.unmount();
  });
  /** push.ts keeps its state in the module; every test starts with it off. */
  await disablePush();
  await clearSession();
  jest.restoreAllMocks();
});

test('nobody signed in: no permission is asked for and no device is registered', async () => {
  await renderApp();

  expect(tree.root.findAllByType(WelcomeScreen)).toHaveLength(1);
  expect(messaging.requestPermission).not.toHaveBeenCalled();
  expect(messaging.getToken).not.toHaveBeenCalled();
  expect(registerDevice).not.toHaveBeenCalled();
});

test('reopening the app signed in registers this device for push', async () => {
  await saveSession(SESSION as never);
  await renderApp();

  expect(registerDevice).toHaveBeenCalledTimes(1);
  expect(registerDevice).toHaveBeenCalledWith('fcm-token-1', 'ios');
});

test('signing in registers it too', async () => {
  await renderApp();
  expect(registerDevice).not.toHaveBeenCalled();

  await ReactTestRenderer.act(async () => {
    await saveSession(SESSION as never);
  });
  await flush();

  expect(registerDevice).toHaveBeenCalledTimes(1);
});

test('a push with the app open is shown in the app dialog, and the unread count is read again', async () => {
  await saveSession(SESSION as never);
  await renderApp();
  await press('Home');
  expect(tree.root.findAllByType(HomeScreen)).toHaveLength(1);
  const fetchHome = jest.spyOn(api, 'fetchHome');

  await deliver('message', WALLET_PUSH);

  expect(textOf()).toContain('Wallet credited');
  expect(textOf()).toContain('₹500 was added to your wallet.');
  /** Home holds the bell's unread dot (GET /home) — it is asked again rather than left stale. */
  expect(fetchHome).toHaveBeenCalledTimes(1);

  await press('OK');
  expect(textOf()).not.toContain('₹500 was added to your wallet.');
  /** Still on Home: a foreground push informs, it does not navigate. */
  expect(tree.root.findAllByType(HomeScreen)).toHaveLength(1);
});

test('a consultation push is not shown over what the live socket already put on screen', async () => {
  await saveSession(SESSION as never);
  await renderApp();

  await deliver('message', {
    notification: { title: 'Your astrologer is ready', body: 'Your consultation has started.' },
    data: { notificationId: 'n-7', type: 'consultation_started', action: '{"screen":"consultationChat","id":"chat-1"}' },
  });

  expect(textOf()).not.toContain('Your astrologer is ready');
});

test('a tapped wallet push lands on the wallet', async () => {
  await saveSession(SESSION as never);
  await renderApp();

  await deliver('opened', WALLET_PUSH);

  expect(shows(WalletScreen)).toBe(true);
  expect(shows(NotificationsScreen)).toBe(false);
});

test('a tapped push the app has no screen for opens Notifications, and Back returns to where the seeker was', async () => {
  await saveSession(SESSION as never);
  await renderApp();
  const fetchNotifications = jest.spyOn(api, 'fetchNotifications');

  await deliver('opened', ORDER_PUSH);

  expect(shows(NotificationsScreen)).toBe(true);
  expect(fetchNotifications).toHaveBeenCalled();
  expect(shows(ConsultationChatScreen)).toBe(false);

  /** A second tap while already there re-reads the feed and does not trap Back on itself. */
  const readsSoFar = fetchNotifications.mock.calls.length;
  await deliver('opened', ORDER_PUSH);
  expect(shows(NotificationsScreen)).toBe(true);
  expect(fetchNotifications.mock.calls.length).toBeGreaterThan(readsSoFar);

  await ReactTestRenderer.act(async () => {
    tree.root.findByType(NotificationsScreen).props.onBack();
  });
  expect(shows(AvailableAstrologersScreen)).toBe(true);
});

test.each([
  ['no action ("")', ''],
  ['an action that is not JSON', 'not json'],
])('a tapped notification with %s still opens Notifications', async (_label, action) => {
  await saveSession(SESSION as never);
  await renderApp();

  await deliver('opened', { notification: { title: 'Hello' }, data: { notificationId: 'n-1', type: 'system', action } });

  expect(tree.root.findAllByType(NotificationsScreen)).toHaveLength(1);
});

test('"Your astrologer is ready" opens the live consultation for that chat, with who it is with', async () => {
  await saveSession(SESSION as never);
  await renderApp();
  const getChatState = jest.spyOn(api, 'getChatState');
  const fetchConsultations = jest.spyOn(api, 'fetchConsultations').mockResolvedValue([
    {
      id: 'chat-9',
      astrologer: 'Kavita Joshi',
      astrologerId: 'a-kavita',
      topic: 'Marriage',
      timestamp: '1 Oct 2026, 10:00 AM',
      amount: '-₹0',
      duration: '0 min',
      channel: 'chat',
      status: 'active',
    },
  ]);

  await deliver('opened', consultationPush('consultationChat', 'chat-9'));
  await flush();

  expect(getChatState).toHaveBeenCalledWith('chat-9');
  expect(fetchConsultations).toHaveBeenCalledWith('active');
  const consultation = tree.root.findByType(ConsultationChatScreen);
  expect(consultation.props.chatId).toBe('chat-9');
  expect(consultation.props.astrologerName).toBe('Kavita Joshi');

  /** A consultation billed by the minute is not left for another notification. */
  await deliver('opened', WALLET_PUSH);
  await deliver('opened', ORDER_PUSH);
  expect(shows(ConsultationChatScreen)).toBe(true);
  expect(shows(WalletScreen)).toBe(false);
  expect(shows(NotificationsScreen)).toBe(false);

  /** Ending it returns to where the notification was tapped. */
  await ReactTestRenderer.act(async () => {
    tree.root.findByType(ConsultationChatScreen).props.onEnd();
  });
  expect(shows(AvailableAstrologersScreen)).toBe(true);
});

test('a live consultation still opens when its row cannot be read — only the name is missing', async () => {
  await saveSession(SESSION as never);
  await renderApp();
  jest.spyOn(api, 'fetchConsultations').mockRejectedValue(new Error('offline'));

  await deliver('opened', consultationPush('consultation', 'chat-5'));
  await flush();

  const consultation = tree.root.findByType(ConsultationChatScreen);
  expect(consultation.props.chatId).toBe('chat-5');
  expect(consultation.props.astrologerName).toBe('your astrologer');
});

test.each([
  ['declined', 'rejected'],
  ['never answered', 'missed'],
  ['already over', 'ended'],
  ['still waiting for an answer', 'requested'],
])('a consultation notification for a session that was %s opens the history, not a dead consultation', async (_label, status) => {
  await saveSession(SESSION as never);
  await renderApp();
  jest.spyOn(api, 'getChatState').mockResolvedValue(chatState('chat-3', status));

  await deliver('opened', consultationPush('consultation', 'chat-3'));
  await flush();

  expect(shows(ConsultationHistoryScreen)).toBe(true);
  expect(shows(ConsultationChatScreen)).toBe(false);

  await ReactTestRenderer.act(async () => {
    tree.root.findByType(ConsultationHistoryScreen).props.onBack();
  });
  expect(shows(AvailableAstrologersScreen)).toBe(true);
});

test('a consultation that cannot be looked up opens the history too', async () => {
  await saveSession(SESSION as never);
  await renderApp();
  jest.spyOn(api, 'getChatState').mockRejectedValue(new Error('offline'));

  await deliver('opened', consultationPush('consultationChat', 'chat-3'));
  await flush();

  expect(shows(ConsultationHistoryScreen)).toBe(true);
  expect(shows(ConsultationChatScreen)).toBe(false);
});

test('a later tap wins over an earlier one that is still being looked up', async () => {
  await saveSession(SESSION as never);
  await renderApp();
  let answer!: (state: never) => void;
  jest.spyOn(api, 'getChatState').mockReturnValue(new Promise<never>(resolve => (answer = resolve)));

  await deliver('opened', consultationPush('consultationChat', 'chat-9'));
  await deliver('opened', WALLET_PUSH);
  expect(shows(WalletScreen)).toBe(true);

  await ReactTestRenderer.act(async () => {
    answer(chatState('chat-9', 'active'));
  });
  await flush();

  expect(shows(WalletScreen)).toBe(true);
  expect(shows(ConsultationChatScreen)).toBe(false);
});

describe('the notification that launched the app', () => {
  test('is followed once the signed-in shell is up: a wallet one lands on the wallet', async () => {
    messaging.getInitialNotification.mockResolvedValueOnce(WALLET_PUSH);
    await saveSession(SESSION as never);
    await renderApp();
    await flush();

    expect(shows(WalletScreen)).toBe(true);
  });

  test('a consultation one opens the live consultation', async () => {
    messaging.getInitialNotification.mockResolvedValueOnce(consultationPush('consultationChat', 'chat-9'));
    await saveSession(SESSION as never);
    await renderApp();
    await flush();

    expect(tree.root.findByType(ConsultationChatScreen).props.chatId).toBe('chat-9');
  });

  test('one the app has no screen for opens Notifications', async () => {
    messaging.getInitialNotification.mockResolvedValueOnce(ORDER_PUSH);
    await saveSession(SESSION as never);
    await renderApp();
    await flush();

    expect(shows(NotificationsScreen)).toBe(true);
  });

  test('nobody signed in: nothing is followed', async () => {
    /** Not a `…Once`: nothing here consumes it, and it must not be left queued for the next test. */
    messaging.getInitialNotification.mockResolvedValue(WALLET_PUSH);
    try {
      await renderApp();
      await flush();

      expect(shows(WelcomeScreen)).toBe(true);
      expect(messaging.getInitialNotification).not.toHaveBeenCalled();
    } finally {
      messaging.getInitialNotification.mockResolvedValue(null);
    }
  });
});

describe('a row in the Notifications list', () => {
  const FEED = [
    { id: 'n-10', type: 'wallet_credit', title: 'Refund credited', body: '₹200 is back in your wallet.', action: { screen: 'wallet' }, createdAt: '2026-09-30T10:00:00.000Z' },
    { id: 'n-11', type: 'consultation_missed', title: 'No response', body: 'The astrologer did not respond in time.', action: { screen: 'consultation', id: 'chat-3' }, createdAt: '2026-09-30T09:00:00.000Z', readAt: '2026-09-30T09:30:00.000Z' },
    { id: 'n-12', type: 'system', title: 'Order shipped', body: 'Your order is on its way.', action: { screen: 'order', id: 'o-1' }, createdAt: '2026-09-29T09:00:00.000Z' },
    { id: 'n-13', type: 'system', title: 'Welcome to Shree Astro', createdAt: '2026-09-28T09:00:00.000Z', readAt: '2026-09-28T10:00:00.000Z' },
  ];

  const openNotificationsFromProfile = async () => {
    await saveSession(SESSION as never);
    await renderApp();
    jest.spyOn(api, 'fetchNotifications').mockResolvedValue({ items: FEED, total: FEED.length, unread: 2 });
    await press('Profile');
    await ReactTestRenderer.act(async () => {
      tree.root.findByType(ProfileScreen).props.onSelectMenu('notifications');
    });
    await flush();
    expect(shows(NotificationsScreen)).toBe(true);
    expect(textOf()).toContain('2 unread');
  };

  test('tapped, it opens the screen it is about and is marked read', async () => {
    await openNotificationsFromProfile();
    const markRead = jest.spyOn(api, 'markNotificationsRead');

    await pressRow('Refund credited');

    expect(shows(WalletScreen)).toBe(true);
    expect(markRead).toHaveBeenCalledTimes(1);
    expect(markRead).toHaveBeenCalledWith('n-10');
  });

  test('a consultation row goes where a tapped push would: the history, once the session is over', async () => {
    await openNotificationsFromProfile();
    jest.spyOn(api, 'getChatState').mockResolvedValue(chatState('chat-3', 'missed'));
    const markRead = jest.spyOn(api, 'markNotificationsRead');

    await pressRow('No response');
    await flush();

    expect(shows(ConsultationHistoryScreen)).toBe(true);
    /** It was read already — there is nothing to tell the server. */
    expect(markRead).not.toHaveBeenCalled();

    /** Back goes to where Notifications itself was opened from. */
    await ReactTestRenderer.act(async () => {
      tree.root.findByType(ConsultationHistoryScreen).props.onBack();
    });
    expect(shows(ProfileScreen)).toBe(true);
  });

  test('with nowhere to go, an unread one is marked read and the seeker stays on the list', async () => {
    await openNotificationsFromProfile();
    const markRead = jest.spyOn(api, 'markNotificationsRead');

    await pressRow('Order shipped');

    expect(markRead).toHaveBeenCalledWith('n-12');
    expect(shows(NotificationsScreen)).toBe(true);
    expect(textOf()).toContain('1 unread');
  });

  test('read and with nowhere to go, it is not a button at all', async () => {
    await openNotificationsFromProfile();

    const row = rowTitled('Welcome to Shree Astro');

    expect(row.props.disabled).toBe(true);
    expect(row.props.accessibilityRole).toBeUndefined();
  });
});

test('logout takes the device off the account before the session is ended', async () => {
  await saveSession(SESSION as never);
  await renderApp();
  await press('Profile');

  await ReactTestRenderer.act(async () => {
    await tree.root.findByType(ProfileScreen).props.onLogout();
  });
  await flush();

  expect(unregisterDevice).toHaveBeenCalledTimes(1);
  expect(unregisterDevice).toHaveBeenCalledWith('fcm-token-1');
  expect(messaging.deleteToken).toHaveBeenCalledTimes(1);
  expect(signOut).toHaveBeenCalledTimes(1);
  expect(unregisterDevice.mock.invocationCallOrder[0]).toBeLessThan((signOut as jest.Mock).mock.invocationCallOrder[0]);

  /** And nothing that arrives afterwards is shown to whoever picks the phone up next. */
  await deliver('message', WALLET_PUSH);
  expect(textOf()).not.toContain('Wallet credited');
});

test('a session that ends by itself still drops the token from this phone', async () => {
  await saveSession(SESSION as never);
  await renderApp();
  expect(registerDevice).toHaveBeenCalledTimes(1);

  /** What the HTTP client does when a refresh token turns out to be spent. */
  await ReactTestRenderer.act(async () => {
    await clearSession();
  });
  await flush();

  expect(tree.root.findAllByType(WelcomeScreen)).toHaveLength(1);
  expect(messaging.deleteToken).toHaveBeenCalledTimes(1);
});
