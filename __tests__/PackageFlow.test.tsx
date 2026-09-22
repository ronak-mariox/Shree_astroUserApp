/**
 * Package-based consultations, on the screens: the intake form's
 * "Choose consultation type" section, and the live chat's package countdown,
 * 30-second warning, "Extend consultation?" prompt and its three answers.
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
import { quotePackages } from '../src/data/consultPackages';
import { ApiError } from '../src/services/client';
import * as api from '../src/services/api';
import {
  fireEnded,
  firePackageEnded,
  firePackageWarning,
} from './helpers/apiMock';

const mockApi = api as unknown as {
  extendPackage: jest.Mock;
  continuePerMinute: jest.Mock;
};

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
  package: { phase: 'package', endsAt: iso(180_000), warningSeconds: 30, respondWithinSeconds: 60, ...pkg },
});

const promptPayload = (balance = 150) => ({
  chatId: 'chat-1',
  promptedAt: iso(0),
  serverTime: iso(0),
  respondWithinSeconds: 60,
  ratePerMinute: 20,
  balanceRemaining: balance,
  perMinuteAffordable: balance >= 20,
  packages: quotePackages(20, balance),
});

afterEach(async () => {
  await ReactTestRenderer.act(() => {
    mounted.splice(0).forEach(tree => tree.unmount());
  });
  jest.restoreAllMocks();
  mockApi.extendPackage.mockClear();
  mockApi.continuePerMinute.mockClear();
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
  test('counts the package down, warns ~30s out, and freezes when time is up', async () => {
    jest.spyOn(api, 'getChatState').mockImplementation(async () => packageState() as never);
    const tree = await render(<ConsultationChatScreen chatId="chat-1" astrologerName="Astro Rakesh" />);

    expect(textOf(tree)).toContain('(03:00 left)');
    expect(textOf(tree)).not.toContain('Package ending in');
    expect(composer(tree).props.editable).toBe(true);

    await ReactTestRenderer.act(() => {
      firePackageWarning({ chatId: 'chat-1', endsAt: iso(25_000), serverTime: iso(0), secondsLeft: 25 });
    });
    expect(textOf(tree)).toContain('Package ending in');
    expect(textOf(tree)).toContain('00:25');

    await ReactTestRenderer.act(() => {
      firePackageEnded(promptPayload(150));
    });
    const text = textOf(tree);
    expect(text).toContain('Your package time is over');
    expect(text).toContain('Extend consultation?');
    expect(text).toContain('Ends automatically in 01:00');
    expect(text).toContain('+3 min');
    expect(text).toContain('+20 min');
    expect(text).toContain('Continue per-minute · ₹20/min');
    expect(text).toContain('End consultation');
    expect(text).toContain('Recharge ₹50'); // 10 min = ₹200 against ₹150
    expect(composer(tree).props.editable).toBe(false);
  });

  test('extend with another package: sends the choice, and the timer continues', async () => {
    jest.spyOn(api, 'getChatState').mockImplementation(async () => packageState() as never);
    const tree = await render(<ConsultationChatScreen chatId="chat-1" astrologerName="Astro Rakesh" />);
    await ReactTestRenderer.act(() => {
      firePackageEnded(promptPayload(500));
    });

    await press(tree, 'Extend 5 min for ₹100');
    expect(mockApi.extendPackage).toHaveBeenCalledTimes(1);
    expect(mockApi.extendPackage).toHaveBeenCalledWith('chat-1', 5, 100);
    expect(textOf(tree)).not.toContain('Your package time is over');
    expect(textOf(tree)).toContain('(05:00 left)');
    expect(composer(tree).props.editable).toBe(true);
  });

  test('the extend prompt shows discounted packages and extends at the discounted price', async () => {
    jest.spyOn(api, 'getChatState').mockImplementation(async () => packageState() as never);
    const tree = await render(<ConsultationChatScreen chatId="chat-1" astrologerName="Astro Rakesh" />);
    await ReactTestRenderer.act(() => {
      firePackageEnded({
        ...promptPayload(500),
        packages: [
          { minutes: 3, discountPercent: 0, originalPrice: 60, price: 60, affordable: true, shortfallAmount: 0 },
          { minutes: 5, discountPercent: 20, originalPrice: 100, price: 80, affordable: true, shortfallAmount: 0 },
        ],
      });
    });
    expect(textOf(tree)).toContain('20% OFF');
    expect(textOf(tree)).toContain('₹100₹80');

    await press(tree, 'Extend 5 min for ₹80');
    expect(mockApi.extendPackage).toHaveBeenCalledWith('chat-1', 5, 80);
  });

  test('an unaffordable package opens the recharge flow instead of charging', async () => {
    jest.spyOn(api, 'getChatState').mockImplementation(async () => packageState() as never);
    const tree = await render(<ConsultationChatScreen chatId="chat-1" astrologerName="Astro Rakesh" />);
    await ReactTestRenderer.act(() => {
      firePackageEnded(promptPayload(150));
    });

    await press(tree, 'Extend 20 min for ₹400');
    expect(mockApi.extendPackage).not.toHaveBeenCalled();
    expect(textOf(tree)).toContain('Recharge Now');
    expect(textOf(tree)).toContain('₹ 400');
  });

  test('a server-side insufficient-balance refusal also lands on recharge', async () => {
    jest.spyOn(api, 'getChatState').mockImplementation(async () => packageState() as never);
    mockApi.extendPackage.mockRejectedValueOnce(
      new ApiError('Not enough balance.', 400, undefined, 'insufficient_balance', undefined, { price: 100 }),
    );
    const tree = await render(<ConsultationChatScreen chatId="chat-1" astrologerName="Astro Rakesh" />);
    await ReactTestRenderer.act(() => {
      firePackageEnded(promptPayload(500));
    });
    await press(tree, 'Extend 5 min for ₹100');
    expect(textOf(tree)).toContain('Recharge Now');
    expect(textOf(tree)).toContain('₹ 100');
  });

  test('continue per-minute switches to the running per-minute clock', async () => {
    jest.spyOn(api, 'getChatState').mockImplementation(async () => packageState() as never);
    const tree = await render(<ConsultationChatScreen chatId="chat-1" astrologerName="Astro Rakesh" />);
    await ReactTestRenderer.act(() => {
      firePackageEnded(promptPayload(500));
    });

    await press(tree, 'Continue per-minute at ₹20 per minute');
    expect(mockApi.continuePerMinute).toHaveBeenCalledWith('chat-1');
    expect(textOf(tree)).not.toContain('Your package time is over');
    expect(textOf(tree)).not.toContain('left)');
    expect(textOf(tree)).toContain('mins)');
    expect(composer(tree).props.editable).toBe(true);
  });

  test('end at the prompt ends the session, with no extend/per-minute call', async () => {
    jest.spyOn(api, 'getChatState').mockImplementation(async () => packageState() as never);
    const endSpy = jest.spyOn(api, 'endChat');
    const tree = await render(<ConsultationChatScreen chatId="chat-1" astrologerName="Astro Rakesh" />);
    await ReactTestRenderer.act(() => {
      firePackageEnded(promptPayload(500));
    });

    await press(tree, 'End consultation');
    expect(endSpy).toHaveBeenCalledWith('chat-1', 'user_ended');
    expect(mockApi.extendPackage).not.toHaveBeenCalled();
    expect(mockApi.continuePerMinute).not.toHaveBeenCalled();
    expect(textOf(tree)).not.toContain('Your package time is over');
    expect(textOf(tree)).toContain('Chat Ended');
  });

  test('no answer: when the server auto-ends the session the prompt closes', async () => {
    jest.spyOn(api, 'getChatState').mockImplementation(async () => packageState() as never);
    const tree = await render(<ConsultationChatScreen chatId="chat-1" astrologerName="Astro Rakesh" />);
    await ReactTestRenderer.act(() => {
      firePackageEnded(promptPayload(500));
    });
    await ReactTestRenderer.act(() => {
      fireEnded({ reason: 'package_no_response' });
    });
    expect(textOf(tree)).not.toContain('Your package time is over');
    expect(textOf(tree)).toContain('Chat Ended');
    expect(composer(tree).props.editable).toBe(false);
  });

  test('reopening the app mid-prompt restores it from the server state', async () => {
    jest.spyOn(api, 'getChatState').mockImplementation(
      async () =>
        packageState({
          phase: 'awaiting_extension',
          endsAt: iso(-5_000),
          promptedAt: iso(-20_000),
          respondBy: iso(40_000),
          packages: quotePackages(20, 500),
          perMinuteAffordable: true,
        }) as never,
    );
    const tree = await render(<ConsultationChatScreen chatId="chat-1" astrologerName="Astro Rakesh" />);
    expect(textOf(tree)).toContain('Your package time is over');
    expect(textOf(tree)).toContain('Ends automatically in 00:40');
  });

  test('a per-minute session shows none of the package UI (unchanged)', async () => {
    const tree = await render(<ConsultationChatScreen chatId="chat-1" astrologerName="Astro Rakesh" />);
    const text = textOf(tree);
    expect(text).toContain('mins)');
    expect(text).not.toContain('left)');
    expect(text).not.toContain('Package ending in');
    expect(text).not.toContain('Extend consultation?');
  });
});
