/**
 * Package-based consultations, on the screens: the intake form's
 * "Choose consultation type" section, and the live chat's package countdown,
 * 30-second warning and the switch to per-minute when the package runs out —
 * where a short wallet shows the app's existing Low Balance banner and
 * Recharge popup, exactly as in a per-minute chat.
 *
 * Runs against __tests__/helpers/apiMock.ts (wired in jest.setup.js); the
 * package socket events are fired through its fire* helpers, exactly as the
 * real socket would deliver them. The money rules themselves are verified
 * server-side in the backend's tests/chat-packages.test.js.
 */
import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { OptionPickerDialog } from '../src/components/OptionPickerDialog';
import { ChatIntakeScreen } from '../src/screens/ChatIntakeScreen';
import { ConsultationChatScreen } from '../src/screens/ConsultationChatScreen';
import * as api from '../src/services/api';
import {
  fireLowBalance,
  firePackageWarning,
  firePerMinuteStarted,
  fireTick,
} from './helpers/apiMock';

const METRICS = {
  frame: { x: 0, y: 0, width: 390, height: 844 },
  insets: { top: 47, left: 0, right: 0, bottom: 34 },
};

const textOf = (tree: ReactTestRenderer.ReactTestRenderer): string => {
  const walk = (node: any): string => {
    if (node === null || node === undefined) return '';
    if (typeof node === 'string') return node;
    if (Array.isArray(node)) return node.map(walk).join('');
    if (typeof node === 'object') return walk(node.children);
    return '';
  };
  return walk(tree.toJSON());
};

const findPressable = (tree: ReactTestRenderer.ReactTestRenderer, label: string) =>
  tree.root.findAll(
    n => typeof n.type !== 'string' && typeof n.props.onPress === 'function' && n.props.accessibilityLabel === label,
  )[0];

const composer = (tree: ReactTestRenderer.ReactTestRenderer) =>
  tree.root.findAll(n => typeof n.type === 'string' && n.props.accessibilityLabel === 'Type message')[0];

const flush = async () => {
  await ReactTestRenderer.act(async () => {
    for (let i = 0; i < 5; i += 1) {
      await Promise.resolve();
    }
  });
};

/** Every tree a test rendered — unmounted after it, so no screen's running clock outlives its test. */
const mounted: ReactTestRenderer.ReactTestRenderer[] = [];

const render = async (element: React.ReactElement) => {
  let tree!: ReactTestRenderer.ReactTestRenderer;
  await ReactTestRenderer.act(() => {
    tree = ReactTestRenderer.create(<SafeAreaProvider initialMetrics={METRICS}>{element}</SafeAreaProvider>);
  });
  mounted.push(tree);
  await flush();
  return tree;
};

const press = async (tree: ReactTestRenderer.ReactTestRenderer, label: string) => {
  const target = findPressable(tree, label);
  if (!target) {
    throw new Error(`No pressable labelled "${label}"`);
  }
  await ReactTestRenderer.act(async () => {
    await target.props.onPress();
  });
  await flush();
};

/** Fills the two fields that start empty (birth place, topic) so the form can submit. */
const completeForm = async (tree: ReactTestRenderer.ReactTestRenderer) => {
  const birthPlace = tree.root.findAll(n => typeof n.type === 'string' && n.props.accessibilityLabel === 'Birth Place')[0];
  await ReactTestRenderer.act(() => {
    birthPlace.props.onChangeText('Noida');
  });
  await press(tree, 'Topic of concern');
  const topicDialog = tree.root.findAllByType(OptionPickerDialog).filter(d => d.props.visible)[0];
  await ReactTestRenderer.act(() => {
    topicDialog.props.onSubmit('Career & Job');
  });
};

const iso = (msFromNow: number) => new Date(Date.now() + msFromNow).toISOString();

/** A live package session as GET /chats/:id returns it. */
const packageState = (pkg: Record<string, unknown> = {}) => ({
  chatId: 'chat-1',
  role: 'user' as const,
  channel: 'chat',
  status: 'active',
  startedAt: iso(0),
  ratePerMinute: 20,
  minutesBilled: 0,
  amountCharged: 60,
  minutesRemaining: 7,
  billingMode: 'package' as const,
  serverTime: iso(0),
  package: { phase: 'package', endsAt: iso(180_000), warningSeconds: 30, ...pkg },
});

afterEach(async () => {
  await ReactTestRenderer.act(() => {
    mounted.splice(0).forEach(tree => tree.unmount());
  });
  jest.restoreAllMocks();
});

/* ======================================================================== */
/* Intake form                                                              */
/* ======================================================================== */

describe('intake form — choose consultation type', () => {
  test('per-minute is the default; each package is priced at the astrologer\'s rate', async () => {
    const onConnect = jest.fn();
    const tree = await render(
      <ChatIntakeScreen astrologerName="Astro Ragini" ratePerMinute={20} walletBalance={1000} onConnect={onConnect} />,
    );
    const text = textOf(tree);
    expect(text).toContain('Choose consultation type');
    expect(text).toContain('Per-minute');
    for (const [minutes, price] of [[3, '₹60'], [5, '₹100'], [10, '₹200'], [20, '₹400']]) {
      expect(text).toContain(`${minutes} min`);
      expect(text).toContain(price);
    }
    expect(findPressable(tree, 'Per-minute, ₹20 per minute').props.accessibilityState.selected).toBe(true);
    expect(text).toContain('Connect With Astro Ragini →');

    await completeForm(tree);
    await press(tree, 'Connect With Astro Ragini');
    expect(onConnect).toHaveBeenCalledWith(expect.objectContaining({ consultation: { mode: 'per_minute' } }));
  });

  test('picking a package shows its total and books it on submit', async () => {
    const onConnect = jest.fn();
    const tree = await render(
      <ChatIntakeScreen astrologerName="Astro Ragini" ratePerMinute={20} walletBalance={1000} onConnect={onConnect} />,
    );
    await press(tree, '5 min package, ₹100');
    const text = textOf(tree);
    expect(text).toContain('Total ₹100');
    expect(text).toContain('5 × ₹20');
    expect(text).toContain('Charged once when the astrologer accepts');
    expect(text).toContain('Pay ₹100 & Connect With Astro Ragini →');

    await completeForm(tree);
    await press(tree, 'Connect With Astro Ragini');
    expect(onConnect).toHaveBeenCalledWith(
      expect.objectContaining({ topic: 'Career & Job', consultation: { mode: 'package', minutes: 5, price: 100 } }),
    );
  });

  test('a package the wallet can\'t cover shows the shortfall before submitting', async () => {
    const tree = await render(<ChatIntakeScreen astrologerName="Astro Ragini" ratePerMinute={20} walletBalance={150} />);
    await press(tree, '10 min package, ₹200');
    const text = textOf(tree);
    expect(text).toContain('Low balance');
    expect(text).toContain('You need ₹50 more in your wallet.');
  });

  test('server quotes are shown as-is (priced server-side)', async () => {
    const quotes = [
      { minutes: 3, discountPercent: 0, price: 75, affordable: true, shortfallAmount: 0 },
      { minutes: 5, discountPercent: 0, price: 125, affordable: true, shortfallAmount: 0 },
    ];
    const tree = await render(<ChatIntakeScreen astrologerName="Astro Ragini" ratePerMinute={25} packageQuotes={quotes} />);
    expect(textOf(tree)).toContain('₹75');
    expect(textOf(tree)).toContain('₹125');
    expect(textOf(tree)).not.toContain('20 min');
  });

  test('an admin discount shows the full price struck through and books the discounted one', async () => {
    const onConnect = jest.fn();
    const quotes = [
      { minutes: 3, discountPercent: 0, originalPrice: 60, price: 60, affordable: true, shortfallAmount: 0 },
      { minutes: 5, discountPercent: 10, originalPrice: 100, price: 90, affordable: true, shortfallAmount: 0 },
      { minutes: 10, discountPercent: 20, originalPrice: 200, price: 160, affordable: true, shortfallAmount: 0 },
      { minutes: 20, discountPercent: 25, originalPrice: 400, price: 300, affordable: true, shortfallAmount: 0 },
    ];
    const tree = await render(
      <ChatIntakeScreen astrologerName="Astro Ragini" ratePerMinute={20} packageQuotes={quotes} walletBalance={1000} onConnect={onConnect} />,
    );
    const struck = tree.root.findAll(
      n => typeof n.type === 'string' && [n.props.style].flat(Infinity).some((st: any) => st?.textDecorationLine === 'line-through'),
    );
    expect(struck.map(n => n.props.children)).toEqual(['₹100', '₹200', '₹400']);
    expect(textOf(tree)).toContain('10% OFF');
    expect(textOf(tree)).toContain('25% OFF');
    expect(textOf(tree)).not.toContain('0% OFF₹');

    await press(tree, '5 min package, ₹90, was ₹100, 10% off');
    expect(textOf(tree)).toContain('10% package discount: −₹10');
    expect(textOf(tree)).toContain('Total ₹90');
    expect(textOf(tree)).toContain('Pay ₹90 & Connect With Astro Ragini →');

    await completeForm(tree);
    await press(tree, 'Connect With Astro Ragini');
    expect(onConnect).toHaveBeenCalledWith(
      expect.objectContaining({ consultation: { mode: 'package', minutes: 5, price: 90 } }),
    );
  });

  test('without a known rate there is nothing to price, so the form stays per-minute only', async () => {
    const tree = await render(<ChatIntakeScreen astrologerName="Astro Ragini" />);
    expect(textOf(tree)).not.toContain('Choose consultation type');
  });

  test('a call intake prices at the call rate and says so', async () => {
    const tree = await render(<ChatIntakeScreen astrologerName="Astro Ragini" channel="call" ratePerMinute={30} />);
    const text = textOf(tree);
    expect(text).toContain('Call Intake Form');
    expect(text).toContain('₹150');
    expect(text).toContain('while you call');
  });

  test('while submitting, the button is disabled so a double tap can\'t send twice', async () => {
    const onConnect = jest.fn();
    const tree = await render(
      <ChatIntakeScreen astrologerName="Astro Ragini" ratePerMinute={20} submitting onConnect={onConnect} />,
    );
    const cta = findPressable(tree, 'Connect With Astro Ragini');
    expect(cta.props.disabled).toBe(true);
    expect(textOf(tree)).toContain('Connecting…');
    await completeForm(tree);
    await ReactTestRenderer.act(() => {
      cta.props.onPress();
    });
    expect(onConnect).not.toHaveBeenCalled();
  });
});

/* ======================================================================== */
/* Live package session                                                     */
/* ======================================================================== */

describe('live package session', () => {
  test('counts the package down, then warns ~30s out that it continues per-minute', async () => {
    jest.spyOn(api, 'getChatState').mockImplementation(async () => packageState() as never);
    const tree = await render(<ConsultationChatScreen chatId="chat-1" astrologerName="Astro Rakesh" />);

    expect(textOf(tree)).toContain('(03:00 left)');
    expect(textOf(tree)).not.toContain('Package ending in');

    await ReactTestRenderer.act(() => {
      firePackageWarning({ chatId: 'chat-1', endsAt: iso(25_000), serverTime: iso(0), secondsLeft: 25, ratePerMinute: 20 });
    });
    expect(textOf(tree)).toContain('Package ending in');
    expect(textOf(tree)).toContain('00:25');
    expect(textOf(tree)).toContain('Then ₹20/min');
    // Informational only — the chat keeps working.
    expect(composer(tree).props.editable).toBe(true);
    // No separate package popup exists any more.
    expect(textOf(tree)).not.toContain('Extend consultation?');
  });

  test('when the package runs out the chat simply continues per-minute — no popup', async () => {
    jest.spyOn(api, 'getChatState').mockImplementation(async () => packageState({ endsAt: iso(10_000) }) as never);
    const tree = await render(<ConsultationChatScreen chatId="chat-1" astrologerName="Astro Rakesh" />);

    await ReactTestRenderer.act(() => {
      firePerMinuteStarted({ chatId: 'chat-1', perMinuteStartedAt: iso(0), serverTime: iso(0), ratePerMinute: 20 });
    });
    const text = textOf(tree);
    expect(text).not.toContain('left)');
    expect(text).toContain('mins)');
    expect(text).not.toContain('Package ending in');
    expect(text).not.toContain('Extend consultation?');
    expect(composer(tree).props.editable).toBe(true);

    // From here the ordinary per-minute tick updates the wallet pill, same as any chat.
    await ReactTestRenderer.act(() => {
      fireTick({ minutesBilled: 1, minutesRemaining: 9, balanceRemaining: 180 });
    });
    expect(textOf(tree)).toContain('₹180');
  });

  test('a package ending with a short wallet shows the existing Low Balance banner and Recharge popup', async () => {
    jest.spyOn(api, 'getChatState').mockImplementation(async () => packageState({ endsAt: iso(25_000) }) as never);
    const tree = await render(<ConsultationChatScreen chatId="chat-1" astrologerName="Astro Rakesh" />);

    // What the server sends ~30s out when the wallet can't cover a per-minute minute: the ordinary low-balance warning.
    await ReactTestRenderer.act(() => {
      fireLowBalance({ chatId: 'chat-1', exhausted: false, secondsUntilCut: 25, requiredAmount: 20, balanceRemaining: 10 });
    });
    let text = textOf(tree);
    expect(text).toContain('Low Balance:');
    // The package notice steps aside for the existing banner.
    expect(text).not.toContain('Package ending in');

    await press(tree, 'Recharge wallet');
    text = textOf(tree);
    expect(text).toContain('Recharge Now');
    expect(text).toContain('Minimum balance need to talk is');
    expect(text).toContain('₹ 20');

    // At the end, unable to pay, the session pauses — the same existing pause as a per-minute chat.
    await ReactTestRenderer.act(() => {
      firePerMinuteStarted({ chatId: 'chat-1', perMinuteStartedAt: iso(0), serverTime: iso(0), ratePerMinute: 20 });
      fireLowBalance({ chatId: 'chat-1', exhausted: true, paused: true, balanceRemaining: 10 });
    });
    expect(textOf(tree)).toContain('Low Balance:');
    expect(composer(tree).props.editable).toBe(false);

    await press(tree, 'Pay Now');
    expect(textOf(tree)).not.toContain('Recharge Now');
    expect(textOf(tree)).not.toContain('Low Balance:');
  });

  test('reopening the app after the switch restores the per-minute view from the server', async () => {
    jest.spyOn(api, 'getChatState').mockImplementation(
      async () => packageState({ phase: 'per_minute', endsAt: iso(-60_000), perMinuteStartedAt: iso(-60_000) }) as never,
    );
    const tree = await render(<ConsultationChatScreen chatId="chat-1" astrologerName="Astro Rakesh" />);
    expect(textOf(tree)).toContain('mins)');
    expect(textOf(tree)).not.toContain('left)');
  });

  test('a package low-balance warning does not lock paid package time; only the actual pause does', async () => {
    jest.spyOn(api, 'getChatState').mockImplementation(async () => packageState({ endsAt: iso(25_000) }) as never);
    const tree = await render(<ConsultationChatScreen chatId="chat-1" astrologerName="Astro Rakesh" />);
    await ReactTestRenderer.act(() => {
      fireLowBalance({ chatId: 'chat-1', exhausted: false, secondsUntilCut: 25, requiredAmount: 20, balanceRemaining: 10 });
    });
    expect(textOf(tree)).toContain('Low Balance:');
    expect(composer(tree).props.editable).toBe(true);

    await ReactTestRenderer.act(() => {
      firePerMinuteStarted({ chatId: 'chat-1', perMinuteStartedAt: iso(0), serverTime: iso(0), ratePerMinute: 20 });
      fireLowBalance({ chatId: 'chat-1', exhausted: true, paused: true, balanceRemaining: 10 });
    });
    expect(composer(tree).props.editable).toBe(false);
  });

  test('a per-minute session shows none of the package UI (unchanged)', async () => {
    const tree = await render(<ConsultationChatScreen chatId="chat-1" astrologerName="Astro Rakesh" />);
    const text = textOf(tree);
    expect(text).toContain('mins)');
    expect(text).not.toContain('left)');
    expect(text).not.toContain('Package ending in');
  });
});

/* ======================================================================== */
/* Header clock parity with the astrologer app                              */
/* ======================================================================== */

/**
 * The same server state astro_app's __tests__/SessionClock.test.tsx uses:
 * this phone's clock is 10 minutes behind the server's, and the session
 * started 125s ago by the server's clock. Both headers must read the same.
 */
describe('header clock matches the astrologer\'s', () => {
  const SKEW_MS = 10 * 60 * 1000;
  const serverIso = (msFromServerNow: number) => new Date(Date.now() + SKEW_MS + msFromServerNow).toISOString();
  const skewedState = (extra: Record<string, unknown> = {}) => ({
    chatId: 'chat-1',
    role: 'user' as const,
    channel: 'chat',
    status: 'active',
    startedAt: serverIso(-125_000),
    ratePerMinute: 20,
    minutesBilled: 3,
    amountCharged: 60,
    minutesRemaining: 10,
    serverTime: serverIso(0),
    ...extra,
  });

  test('per-minute: counts on the server clock (02:05 — same as the astrologer), not the phone\'s', async () => {
    jest.spyOn(api, 'getChatState').mockImplementation(async () => skewedState() as never);
    const tree = await render(<ConsultationChatScreen chatId="chat-1" astrologerName="Astro Rakesh" />);
    expect(textOf(tree)).toContain('(02:05 mins)');
  });

  test('package: counts down on the server clock (02:30 left — same as the astrologer)', async () => {
    jest.spyOn(api, 'getChatState').mockImplementation(
      async () => skewedState({ billingMode: 'package', package: { phase: 'package', endsAt: serverIso(150_000), warningSeconds: 30 } }) as never,
    );
    const tree = await render(<ConsultationChatScreen chatId="chat-1" astrologerName="Astro Rakesh" />);
    expect(textOf(tree)).toContain('(02:30 left)');
  });
});
