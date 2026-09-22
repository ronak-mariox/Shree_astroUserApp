/**
 * Package-based consultations, on the screens: the intake form's
 * "Choose consultation type" section, and the live chat's package countdown,
 * 30-second warning, and the PAUSE when the package runs out — clock frozen,
 * input blocked, nothing billed — until the seeker approves how to continue
 * (per-minute or another package), recharging first through the existing
 * Low Balance banner / Recharge popup when nothing is affordable.
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
import { quotePackages } from '../src/data/consultPackages';
import {
  fireEnded,
  fireLowBalance,
  firePackageEnded,
  firePackageExtended,
  firePackageWarning,
  firePerMinuteStarted,
  fireTick,
} from './helpers/apiMock';

const mockContinue = (api as unknown as { continueConsultation: jest.Mock }).continueConsultation;

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
  mockContinue.mockClear();
});

/** What the server sends when a package runs out — options priced against `balance`. */
const endedPayload = (balance: number) => {
  const packages = quotePackages(20, balance);
  return {
    chatId: 'chat-1',
    pausedSince: iso(0),
    serverTime: iso(0),
    ratePerMinute: 20,
    balanceRemaining: balance,
    perMinuteAffordable: balance >= 20,
    packages,
    canContinue: balance >= 20 || packages.some(q => q.affordable),
  };
};

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
  test('counts the package down, then warns ~30s out that the seeker will be asked', async () => {
    jest.spyOn(api, 'getChatState').mockImplementation(async () => packageState() as never);
    const tree = await render(<ConsultationChatScreen chatId="chat-1" astrologerName="Astro Rakesh" />);
    expect(textOf(tree)).toContain('(03:00 left)');

    await ReactTestRenderer.act(() => {
      firePackageWarning({ chatId: 'chat-1', endsAt: iso(25_000), serverTime: iso(0), secondsLeft: 25, ratePerMinute: 20 });
    });
    expect(textOf(tree)).toContain('Package ending in');
    expect(textOf(tree)).toContain('00:25');
    expect(textOf(tree)).toContain("You'll be asked how to continue");
    expect(composer(tree).props.editable).toBe(true);
  });

  test('package over with enough money: paused, input blocked, asked to approve — nothing auto-charged', async () => {
    jest.spyOn(api, 'getChatState').mockImplementation(async () => packageState({ endsAt: iso(5_000) }) as never);
    const tree = await render(<ConsultationChatScreen chatId="chat-1" astrologerName="Astro Rakesh" />);

    await ReactTestRenderer.act(() => {
      firePackageEnded(endedPayload(500));
    });
    const text = textOf(tree);
    expect(text).toContain('(Paused)');
    expect(composer(tree).props.editable).toBe(false);
    expect(text).toContain('Your package time is over');
    expect(text).toContain('How would you like to continue?');
    expect(text).toContain('Per-minute');
    expect(text).toContain('5 min');
    expect(text).toContain('₹100');
    expect(mockContinue).not.toHaveBeenCalled();
    // Enough money → straight to the choice, no low-balance banner.
    expect(text).not.toContain('Low Balance:');
  });

  test('approving another package sends it, resumes, and a fresh countdown starts', async () => {
    jest.spyOn(api, 'getChatState').mockImplementation(async () => packageState({ endsAt: iso(5_000) }) as never);
    const tree = await render(<ConsultationChatScreen chatId="chat-1" astrologerName="Astro Rakesh" />);
    await ReactTestRenderer.act(() => {
      firePackageEnded(endedPayload(500));
    });

    await press(tree, '5 min package, ₹100');
    await press(tree, 'Continue · Pay ₹100');
    expect(mockContinue).toHaveBeenCalledWith('chat-1', { mode: 'package', minutes: 5, price: 100 });
    expect(textOf(tree)).not.toContain('Your package time is over');
    expect(textOf(tree)).toContain('(05:00 left)');
    expect(composer(tree).props.editable).toBe(true);
  });

  test('approving per-minute sends it, resumes, and the clock counts up', async () => {
    jest.spyOn(api, 'getChatState').mockImplementation(async () => packageState({ endsAt: iso(5_000) }) as never);
    const tree = await render(<ConsultationChatScreen chatId="chat-1" astrologerName="Astro Rakesh" />);
    await ReactTestRenderer.act(() => {
      firePackageEnded(endedPayload(500));
    });

    await press(tree, 'Continue per-minute · ₹20/min');
    expect(mockContinue).toHaveBeenCalledWith('chat-1', { mode: 'per_minute' });
    expect(textOf(tree)).not.toContain('Your package time is over');
    expect(textOf(tree)).toContain('mins)');
    expect(textOf(tree)).not.toContain('(Paused)');
    expect(composer(tree).props.editable).toBe(true);
  });

  test('package over with a short wallet: existing Low Balance banner + Recharge popup first, then the approval', async () => {
    let state = packageState({ endsAt: iso(5_000) }) as Record<string, unknown>;
    jest.spyOn(api, 'getChatState').mockImplementation(async () => state as never);
    const tree = await render(<ConsultationChatScreen chatId="chat-1" astrologerName="Astro Rakesh" />);

    await ReactTestRenderer.act(() => {
      firePackageEnded(endedPayload(10));
    });
    let text = textOf(tree);
    expect(text).toContain('Low Balance:');
    expect(text).toContain('Recharge Now');
    expect(text).not.toContain('How would you like to continue?');
    expect(composer(tree).props.editable).toBe(false);
    expect(mockContinue).not.toHaveBeenCalled();

    // After paying, the server's state read now finds the options affordable → the approval appears.
    state = {
      ...state,
      package: { phase: 'awaiting_choice', awaitingChoiceSince: iso(-10_000), ...endedPayload(760) },
    };
    await press(tree, 'Pay Now');
    text = textOf(tree);
    expect(text).not.toContain('Recharge Now');
    expect(text).toContain('How would you like to continue?');
    expect(text).toContain('(Paused)');
    expect(mockContinue).not.toHaveBeenCalled();

    await press(tree, 'Continue per-minute · ₹20/min');
    expect(mockContinue).toHaveBeenCalledWith('chat-1', { mode: 'per_minute' });
    expect(composer(tree).props.editable).toBe(true);
  });

  test('picking an option the wallet can\'t cover opens the existing Recharge popup instead of charging', async () => {
    jest.spyOn(api, 'getChatState').mockImplementation(async () => packageState({ endsAt: iso(5_000) }) as never);
    jest.spyOn(api, 'fetchWallet').mockImplementation(async () => ({ balance: 150, currency: 'INR' }) as never);
    const tree = await render(<ConsultationChatScreen chatId="chat-1" astrologerName="Astro Rakesh" />);
    await ReactTestRenderer.act(() => {
      firePackageEnded(endedPayload(150));
    });

    await press(tree, '20 min package, ₹400');
    expect(textOf(tree)).toContain('Recharge to continue (₹250 more)');
    await press(tree, 'Recharge to continue (₹250 more)');
    expect(mockContinue).not.toHaveBeenCalled();
    expect(textOf(tree)).toContain('Recharge Now');
    expect(textOf(tree)).toContain('₹ 400');
  });

  test('ending from the approval ends the session, with nothing charged', async () => {
    jest.spyOn(api, 'getChatState').mockImplementation(async () => packageState({ endsAt: iso(5_000) }) as never);
    const endSpy = jest.spyOn(api, 'endChat');
    const tree = await render(<ConsultationChatScreen chatId="chat-1" astrologerName="Astro Rakesh" />);
    await ReactTestRenderer.act(() => {
      firePackageEnded(endedPayload(500));
    });
    await press(tree, 'End consultation');
    expect(endSpy).toHaveBeenCalledWith('chat-1', 'user_ended');
    expect(mockContinue).not.toHaveBeenCalled();
    expect(textOf(tree)).toContain('Chat Ended');
    expect(textOf(tree)).not.toContain('How would you like to continue?');
  });

  test('the astrologer ending it while paused closes the approval', async () => {
    jest.spyOn(api, 'getChatState').mockImplementation(async () => packageState({ endsAt: iso(5_000) }) as never);
    const tree = await render(<ConsultationChatScreen chatId="chat-1" astrologerName="Astro Rakesh" />);
    await ReactTestRenderer.act(() => {
      firePackageEnded(endedPayload(500));
    });
    await ReactTestRenderer.act(() => {
      fireEnded({ reason: 'astrologer_ended' });
    });
    expect(textOf(tree)).not.toContain('How would you like to continue?');
    expect(textOf(tree)).toContain('Chat Ended');
  });

  test('another device continuing resumes this screen too', async () => {
    jest.spyOn(api, 'getChatState').mockImplementation(async () => packageState({ endsAt: iso(5_000) }) as never);
    const tree = await render(<ConsultationChatScreen chatId="chat-1" astrologerName="Astro Rakesh" />);
    await ReactTestRenderer.act(() => {
      firePackageEnded(endedPayload(500));
    });
    await ReactTestRenderer.act(() => {
      firePackageExtended({ chatId: 'chat-1', packageMinutes: 3, amount: 60, endsAt: iso(180_000), serverTime: iso(0), balanceRemaining: 440 });
    });
    expect(textOf(tree)).not.toContain('How would you like to continue?');
    expect(textOf(tree)).toContain('(03:00 left)');
    expect(composer(tree).props.editable).toBe(true);
  });

  test('reopening the app while paused asks again', async () => {
    jest.spyOn(api, 'getChatState').mockImplementation(
      async () => packageState({ phase: 'awaiting_choice', endsAt: iso(-30_000), awaitingChoiceSince: iso(-30_000), ...endedPayload(500) }) as never,
    );
    const tree = await render(<ConsultationChatScreen chatId="chat-1" astrologerName="Astro Rakesh" />);
    expect(textOf(tree)).toContain('(Paused)');
    expect(textOf(tree)).toContain('How would you like to continue?');
    expect(composer(tree).props.editable).toBe(false);
  });

  test('per-minute after the choice: ordinary ticks update the wallet, as in any chat', async () => {
    jest.spyOn(api, 'getChatState').mockImplementation(
      async () => packageState({ phase: 'per_minute', endsAt: iso(-60_000), perMinuteStartedAt: iso(-30_000) }) as never,
    );
    const tree = await render(<ConsultationChatScreen chatId="chat-1" astrologerName="Astro Rakesh" />);
    expect(textOf(tree)).toContain('mins)');
    await ReactTestRenderer.act(() => {
      firePerMinuteStarted({ chatId: 'chat-1', perMinuteStartedAt: iso(0), serverTime: iso(0), ratePerMinute: 20 });
      fireTick({ minutesBilled: 1, minutesRemaining: 9, balanceRemaining: 180 });
    });
    expect(textOf(tree)).toContain('₹180');
  });

  test('a package low-balance warning does not lock paid package time', async () => {
    jest.spyOn(api, 'getChatState').mockImplementation(async () => packageState({ endsAt: iso(25_000) }) as never);
    const tree = await render(<ConsultationChatScreen chatId="chat-1" astrologerName="Astro Rakesh" />);
    await ReactTestRenderer.act(() => {
      fireLowBalance({ chatId: 'chat-1', exhausted: false, secondsUntilCut: 25, requiredAmount: 20, balanceRemaining: 10 });
    });
    expect(textOf(tree)).toContain('Low Balance:');
    expect(composer(tree).props.editable).toBe(true);
  });

  test('a per-minute session shows none of the package UI (unchanged)', async () => {
    const tree = await render(<ConsultationChatScreen chatId="chat-1" astrologerName="Astro Rakesh" />);
    const text = textOf(tree);
    expect(text).toContain('mins)');
    expect(text).not.toContain('left)');
    expect(text).not.toContain('Package ending in');
    expect(text).not.toContain('How would you like to continue?');
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
