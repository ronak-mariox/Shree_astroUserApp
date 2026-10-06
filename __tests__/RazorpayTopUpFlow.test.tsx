/**
 * Adding money through Razorpay, on the screens — the two places a seeker
 * pays from:
 *
 *   Wallet → Add Money → Payment → "Pay ₹X Securely" → checkout → receipt
 *   a live consultation's Recharge popup → "Pay Now" → checkout → back in the chat
 *
 * The server is __tests__/helpers/apiMock.ts with `startTopUp` answering as a
 * server with Razorpay configured, and the checkout is jest.setup.js's stub —
 * it pays unless a test makes it reject. The sequence itself (what is sent
 * where) is covered in payments.test.ts; this is what the seeker sees.
 */
import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import RazorpayCheckout from 'react-native-razorpay';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import App from '../App';
import { AppDialog } from '../src/components/AppDialog';
import { ConsultationChatScreen } from '../src/screens/ConsultationChatScreen';
import { PaymentScreen } from '../src/screens/PaymentScreen';
import * as api from '../src/services/api';
import { clearSession, saveSession } from '../src/services/session';
import { firePackageEnded } from './helpers/apiMock';

/** App.tsx mounts its own SafeAreaProvider, which renders nothing in a test run until it is handed a frame. */
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

type Tree = ReactTestRenderer.ReactTestRenderer;

const open = RazorpayCheckout.open as jest.Mock;

const textOf = (tree: Tree): string => {
  const walk = (node: any): string => {
    if (node === null || node === undefined) return '';
    if (typeof node === 'string') return node;
    if (Array.isArray(node)) return node.map(walk).join('');
    if (typeof node === 'object') return walk(node.children);
    return '';
  };
  return walk(tree.toJSON());
};

const flush = async () => {
  await ReactTestRenderer.act(async () => {
    for (let i = 0; i < 20; i += 1) await Promise.resolve();
  });
};

const pressLabel = async (tree: Tree, label: string | RegExp) => {
  const target = tree.root.findAll(
    n =>
      typeof n.type !== 'string' &&
      typeof n.props.onPress === 'function' &&
      typeof n.props.accessibilityLabel === 'string' &&
      (typeof label === 'string' ? n.props.accessibilityLabel === label : label.test(n.props.accessibilityLabel)),
  )[0];
  if (!target) throw new Error(`Nothing pressable labelled ${label}`);
  await ReactTestRenderer.act(async () => {
    await target.props.onPress();
  });
  await flush();
};

/** Presses the nearest pressable around a piece of visible text. */
const pressText = async (tree: Tree, matches: (text: string) => boolean) => {
  const joined = (children: unknown) => (Array.isArray(children) ? children.join('') : children);
  const node = tree.root.findAll(n => {
    const text = typeof n.type === 'string' ? joined(n.props.children) : undefined;
    return typeof text === 'string' && matches(text);
  })[0];
  if (!node) throw new Error('No such text on screen');
  let current: ReactTestRenderer.ReactTestInstance | null = node;
  while (current && typeof current.props.onPress !== 'function') current = current.parent;
  if (!current) throw new Error('That text is not pressable');
  const target = current;
  await ReactTestRenderer.act(async () => {
    await target.props.onPress();
  });
  await flush();
};

/** The app's own dialog, read the way it is shown. */
const dialogText = (tree: Tree) =>
  tree.root
    .findAllByType(AppDialog)
    .map(sheet => (sheet.props.request ? `${sheet.props.request.title} ${sheet.props.request.message ?? ''}` : ''))
    .join('');

/** POST /wallet/topup from a server with Razorpay configured, for whatever amount was asked. */
const razorpayOrder = (amount: number) => ({
  transactionId: 'txn-9',
  reference: 'TXN-RZP001',
  orderId: 'order_Test123',
  amount,
  couponCode: null,
  bonusAmount: 0,
  gateway: 'razorpay' as const,
  razorpay: {
    keyId: 'rzp_test_abc123',
    orderId: 'order_Test123',
    amount: amount * 100,
    currency: 'INR',
    name: 'Shree Astro',
    description: 'Wallet top-up',
    prefill: { name: 'Arjun Sharma', contact: '9876543210' },
  },
});

let start: jest.SpyInstance;
let confirm: jest.SpyInstance;
let cancel: jest.SpyInstance;

beforeEach(() => {
  open.mockClear();
  start = jest.spyOn(api, 'startTopUp').mockImplementation(async (amount: number) => razorpayOrder(amount) as never);
  confirm = jest.spyOn(api, 'confirmTopUp');
  cancel = jest.spyOn(api, 'cancelTopUp');
});

afterEach(() => {
  jest.restoreAllMocks();
});

describe('Wallet → Add Money → Payment', () => {
  let tree: Tree;

  /** The first mount of the whole App compiles every screen; give it room. */
  beforeEach(async () => {
    await saveSession({
      accessToken: 'test-access',
      refreshToken: 'test-refresh',
      user: { id: 'u-1', name: 'Arjun Sharma', email: 'arjun@example.com', phone: '9876543210' } as never,
    });
    await ReactTestRenderer.act(async () => {
      tree = ReactTestRenderer.create(<App />);
    });
    /** Restoring the session settles over a few ticks — wait for the signed-in shell's tab bar. */
    for (let i = 0; i < 40; i += 1) {
      await flush();
      if (tree.root.findAll(n => typeof n.props.onPress === 'function' && n.props.accessibilityLabel === 'Wallet').length > 0) break;
      await ReactTestRenderer.act(async () => {
        await new Promise<void>(resolve => setTimeout(() => resolve(), 50));
      });
    }

    await pressLabel(tree, 'Wallet');
    await pressText(tree, text => text === '+ Add Money');
    await pressText(tree, text => text.startsWith('Proceed to Pay'));
    /** Reaching the Payment screen opens nothing on the server — backing out here leaves no pending order behind. */
    expect(tree.root.findAllByType(PaymentScreen)).toHaveLength(1);
    expect(start).not.toHaveBeenCalled();
  }, 20000);

  afterEach(async () => {
    await ReactTestRenderer.act(() => {
      tree.unmount();
    });
    await clearSession();
  });

  test('paying opens the checkout on the picked method, and the receipt prints what Razorpay reported', async () => {
    /** The seeker left UPI selected, then paid by card inside the checkout. */
    confirm.mockResolvedValue({
      _id: 'txn-9',
      reference: 'TXN-RZP001',
      amount: 200,
      balanceAfter: 1450,
      status: 'success',
      payment: { gateway: 'razorpay', orderId: 'order_Test123', paymentId: 'pay_test_1', method: 'card' },
    } as never);

    await pressText(tree, text => text.endsWith('Securely'));

    expect(start).toHaveBeenCalledTimes(1);
    const amount = start.mock.calls[0][0] as number;
    expect(open).toHaveBeenCalledWith(
      expect.objectContaining({
        key: 'rzp_test_abc123',
        order_id: 'order_Test123',
        amount: amount * 100,
        prefill: { name: 'Arjun Sharma', contact: '9876543210', method: 'upi' },
      }),
    );
    expect(confirm).toHaveBeenCalledWith('txn-9', {
      razorpayPaymentId: 'pay_test_1',
      razorpayOrderId: 'order_Test123',
      razorpaySignature: 'sig_test_1',
    });

    const text = textOf(tree);
    expect(text).toContain('Payment Successful!');
    expect(text).toContain('TXN-RZP001');
    expect(text).toContain('Credit / Debit Card');
    expect(cancel).not.toHaveBeenCalled();
  });

  test('closing the checkout lands back on the Payment screen with "Payment cancelled", and nothing is confirmed', async () => {
    open.mockRejectedValueOnce({ code: 2, description: 'Payment cancelled by user' });

    await pressText(tree, text => text.endsWith('Securely'));

    expect(dialogText(tree)).toContain('Payment cancelled');
    expect(tree.root.findAllByType(PaymentScreen)).toHaveLength(1);
    expect(textOf(tree)).not.toContain('Payment Successful!');
    expect(cancel).toHaveBeenCalledWith('txn-9', 'checkout_dismissed');
    expect(confirm).not.toHaveBeenCalled();
  });

  test('a failed payment says why, in the app\'s own dialog, and can be tried again', async () => {
    open.mockRejectedValueOnce({ code: 1, description: 'Your bank declined the payment.' });

    await pressText(tree, text => text.endsWith('Securely'));

    expect(dialogText(tree)).toContain('Payment failed Your bank declined the payment.');
    expect(tree.root.findAllByType(PaymentScreen)).toHaveLength(1);
    expect(confirm).not.toHaveBeenCalled();

    /** Second attempt: a new order, and this time the checkout pays. */
    await pressLabel(tree, 'OK');
    await pressText(tree, text => text.endsWith('Securely'));
    expect(start).toHaveBeenCalledTimes(2);
    expect(textOf(tree)).toContain('Payment Successful!');
  });
});

describe('the Recharge popup in a live consultation', () => {
  const METRICS = {
    frame: { x: 0, y: 0, width: 390, height: 844 },
    insets: { top: 47, left: 0, right: 0, bottom: 34 },
  };
  const iso = (msFromNow: number) => new Date(Date.now() + msFromNow).toISOString();
  let tree: Tree;

  /** A package that has just run out with ₹10 in the wallet: the Low Balance banner and the Recharge popup are up. */
  beforeEach(async () => {
    jest.spyOn(api, 'getChatState').mockImplementation(
      async () =>
        ({
          chatId: 'chat-1',
          role: 'user',
          channel: 'chat',
          status: 'active',
          startedAt: iso(0),
          ratePerMinute: 20,
          minutesBilled: 0,
          amountCharged: 60,
          minutesRemaining: 7,
          billingMode: 'package',
          serverTime: iso(0),
          package: { phase: 'package', endsAt: iso(5_000), warningSeconds: 30 },
        }) as never,
    );
    await ReactTestRenderer.act(() => {
      tree = ReactTestRenderer.create(
        <SafeAreaProvider initialMetrics={METRICS}>
          <ConsultationChatScreen chatId="chat-1" astrologerName="Astro Rakesh" />
        </SafeAreaProvider>,
      );
    });
    await flush();
    await ReactTestRenderer.act(() => {
      firePackageEnded({
        chatId: 'chat-1',
        pausedSince: iso(0),
        serverTime: iso(0),
        ratePerMinute: 20,
        balanceRemaining: 10,
        perMinuteAffordable: false,
        packages: [],
        canContinue: false,
      });
    });
    expect(textOf(tree)).toContain('Recharge Now');
  });

  afterEach(async () => {
    await ReactTestRenderer.act(() => {
      tree.unmount();
    });
  });

  test('Pay Now goes through the checkout for exactly the tier\'s amount, then closes the popup', async () => {
    await pressLabel(tree, '₹100');
    await pressLabel(tree, 'Pay Now');

    expect(start).toHaveBeenCalledWith(100, undefined);
    expect(open).toHaveBeenCalledWith(expect.objectContaining({ order_id: 'order_Test123', amount: 10000 }));
    expect(confirm).toHaveBeenCalledWith('txn-9', expect.objectContaining({ razorpaySignature: 'sig_test_1' }));
    expect(textOf(tree)).not.toContain('Recharge Now');
  });

  test('closing the checkout is quiet: no dialog, and the popup is still there to try again', async () => {
    open.mockRejectedValueOnce({ code: 2, description: 'Payment cancelled by user' });

    await pressLabel(tree, 'Pay Now');

    expect(cancel).toHaveBeenCalledWith('txn-9', 'checkout_dismissed');
    expect(confirm).not.toHaveBeenCalled();
    expect(dialogText(tree)).toBe('');
    expect(textOf(tree)).toContain('Recharge Now');
  });

  test('a failed payment is explained in the app\'s dialog and leaves the popup open', async () => {
    open.mockRejectedValueOnce({ code: 1, description: 'Your bank declined the payment.' });

    await pressLabel(tree, 'Pay Now');

    expect(dialogText(tree)).toContain('Payment failed Your bank declined the payment.');
    expect(textOf(tree)).toContain('Recharge Now');
    expect(confirm).not.toHaveBeenCalled();
  });
});
