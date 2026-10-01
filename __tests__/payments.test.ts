/**
 * services/payments.ts — `payTopUp`, the one call behind every "add money"
 * button: start → (Razorpay checkout) → confirm.
 *
 * The checkout is the stub from jest.setup.js (it pays, unless a test makes it
 * reject), and the server is services/api.ts's stub with each call spied on —
 * so what is asserted here is the sequence and what is passed along it. That
 * the server credits only on a verified signature is the backend's own suite
 * (tests/razorpay-topup.test.js).
 *
 * The last block runs the real services/api.ts against a stubbed HTTP client,
 * for the request bodies the backend's contract names.
 */
import RazorpayCheckout from 'react-native-razorpay';

import * as api from '../src/services/api';
import { ApiError, client } from '../src/services/client';
import {
  PaymentCancelledError,
  PaymentFailedError,
  PaymentUnavailableError,
  PaymentUnconfirmedError,
  describePaymentError,
  paidWithLabel,
  payTopUp,
} from '../src/services/payments';
import { colors } from '../src/theme';

const open = RazorpayCheckout.open as jest.Mock;

/** POST /wallet/topup from a server with Razorpay configured (test mode). */
const RAZORPAY_ORDER = {
  transactionId: 'txn-9',
  reference: 'TXN-RZP001',
  orderId: 'order_Test123',
  amount: 100,
  couponCode: null,
  bonusAmount: 0,
  gateway: 'razorpay' as const,
  razorpay: {
    keyId: 'rzp_test_abc123',
    orderId: 'order_Test123',
    amount: 10000,
    currency: 'INR',
    name: 'Shree Astro',
    description: 'Wallet top-up',
    prefill: { name: 'Arjun Sharma', contact: '9876543210', email: 'arjun@example.com' },
  },
};

const SETTLED = {
  _id: 'txn-9',
  reference: 'TXN-RZP001',
  amount: 100,
  balanceAfter: 350,
  status: 'success',
  payment: { gateway: 'razorpay', orderId: 'order_Test123', paymentId: 'pay_test_1', method: 'upi' },
};

let start: jest.SpyInstance;
let confirm: jest.SpyInstance;
let cancel: jest.SpyInstance;

beforeEach(() => {
  open.mockClear();
  start = jest.spyOn(api, 'startTopUp').mockResolvedValue(RAZORPAY_ORDER as never);
  confirm = jest.spyOn(api, 'confirmTopUp').mockResolvedValue(SETTLED as never);
  cancel = jest.spyOn(api, 'cancelTopUp').mockResolvedValue(undefined as never);
});

afterEach(() => {
  jest.restoreAllMocks();
  jest.useRealTimers();
});

describe('a server with Razorpay', () => {
  test('a paid checkout is confirmed with the three ids it returned, and the settled transaction comes back', async () => {
    const transaction = await payTopUp({ amount: 100, couponCode: 'WELCOME', method: 'upi', methodLabel: 'UPI' });

    expect(start).toHaveBeenCalledWith(100, 'WELCOME');
    /** Every value the checkout opens with is the server's; only the theme and the method preference are the app's. */
    expect(open).toHaveBeenCalledTimes(1);
    expect(open).toHaveBeenCalledWith({
      key: 'rzp_test_abc123',
      order_id: 'order_Test123',
      amount: 10000,
      currency: 'INR',
      name: 'Shree Astro',
      description: 'Wallet top-up',
      prefill: { name: 'Arjun Sharma', contact: '9876543210', email: 'arjun@example.com', method: 'upi' },
      theme: { color: colors.gradient.from },
    });
    /** No method is sent for a Razorpay payment — the server records the one Razorpay reports. */
    expect(confirm).toHaveBeenCalledTimes(1);
    expect(confirm).toHaveBeenCalledWith('txn-9', {
      razorpayPaymentId: 'pay_test_1',
      razorpayOrderId: 'order_Test123',
      razorpaySignature: 'sig_test_1',
    });
    expect(cancel).not.toHaveBeenCalled();
    expect(transaction).toBe(SETTLED);
  });

  test('no method picked and nothing to prefill: the checkout is opened without a prefill at all', async () => {
    start.mockResolvedValue({ ...RAZORPAY_ORDER, razorpay: { ...RAZORPAY_ORDER.razorpay, prefill: undefined } } as never);
    await payTopUp({ amount: 100 });

    expect(open.mock.calls[0][0]).not.toHaveProperty('prefill');
    expect(start).toHaveBeenCalledWith(100, undefined);
  });

  test('closing the checkout cancels the pending row and rejects as PaymentCancelledError', async () => {
    /** iOS (the test platform) reports a dismissal as code 2. */
    open.mockRejectedValueOnce({ code: 2, description: 'Payment cancelled by user' });

    await expect(payTopUp({ amount: 100 })).rejects.toBeInstanceOf(PaymentCancelledError);
    expect(cancel).toHaveBeenCalledWith('txn-9', 'checkout_dismissed');
    expect(confirm).not.toHaveBeenCalled();
  });

  test('Android\'s dismissal — code 0, the reason inside a JSON description — is a cancel too', async () => {
    open.mockRejectedValueOnce({
      code: 0,
      description: JSON.stringify({
        error: {
          code: 'BAD_REQUEST_ERROR',
          description: 'You may have cancelled the payment or there was a delay in response from the UPI app',
          source: 'customer',
          step: 'payment_authentication',
          reason: 'payment_cancelled',
        },
      }),
    });

    await expect(payTopUp({ amount: 100 })).rejects.toBeInstanceOf(PaymentCancelledError);
    expect(cancel).toHaveBeenCalledWith('txn-9', 'checkout_dismissed');
    expect(confirm).not.toHaveBeenCalled();
  });

  test('a failed payment cancels the row with Razorpay\'s reason and rejects with its description', async () => {
    open.mockRejectedValueOnce({
      code: 1,
      description: JSON.stringify({
        error: {
          code: 'BAD_REQUEST_ERROR',
          description: 'Payment failed because of insufficient funds in the account.',
          reason: 'insufficient_funds',
        },
      }),
    });

    const error = await payTopUp({ amount: 100 }).catch(caught => caught);
    expect(error).toBeInstanceOf(PaymentFailedError);
    expect(error.message).toBe('Payment failed because of insufficient funds in the account.');
    expect(error.reason).toBe('insufficient_funds');
    expect(cancel).toHaveBeenCalledWith('txn-9', 'Payment failed because of insufficient funds in the account.');
    expect(confirm).not.toHaveBeenCalled();
  });

  test('a failure described in plain prose is passed on as it is', async () => {
    open.mockRejectedValueOnce({ code: 5, description: 'Your bank declined the payment.' });

    await expect(payTopUp({ amount: 100 })).rejects.toThrow('Your bank declined the payment.');
    expect(cancel).toHaveBeenCalledWith('txn-9', 'Your bank declined the payment.');
  });

  test('a checkout that lost its connection fails without cancelling the row — the payment may still have been taken', async () => {
    /** iOS reports a network error as code 0. */
    open.mockRejectedValueOnce({ code: 0, description: '' });

    await expect(payTopUp({ amount: 100 })).rejects.toBeInstanceOf(PaymentFailedError);
    expect(cancel).not.toHaveBeenCalled();
    expect(confirm).not.toHaveBeenCalled();
  });

  test('a binary without the native module gets a readable error, not a crash, and the row is closed', async () => {
    open.mockImplementationOnce(() => {
      throw new TypeError("Cannot read property 'open' of null");
    });

    const error = await payTopUp({ amount: 100 }).catch(caught => caught);
    expect(error).toBeInstanceOf(PaymentUnavailableError);
    expect(error.message).toMatch(/latest version of the app/);
    expect(cancel).toHaveBeenCalledWith('txn-9', 'checkout_unavailable');
    expect(confirm).not.toHaveBeenCalled();
  });

  test('a cancel that itself fails does not hide what happened to the payment', async () => {
    open.mockRejectedValueOnce({ code: 2, description: 'Payment cancelled by user' });
    cancel.mockRejectedValue(new ApiError('Cannot reach the server. Check your connection.'));

    await expect(payTopUp({ amount: 100 })).rejects.toBeInstanceOf(PaymentCancelledError);
  });

  test('the server refusing the payment (bad signature) is passed on, without a retry and without a cancel', async () => {
    confirm.mockRejectedValue(new ApiError('That payment could not be verified.', 400, undefined, 'payment_signature_invalid'));

    const error = await payTopUp({ amount: 100 }).catch(caught => caught);
    expect(error).toBeInstanceOf(ApiError);
    expect(error.code).toBe('payment_signature_invalid');
    expect(confirm).toHaveBeenCalledTimes(1);
    expect(cancel).not.toHaveBeenCalled();
  });

  test('paid, but the confirm never reaches the server: asked once more, then PaymentUnconfirmedError — never a cancel', async () => {
    jest.useFakeTimers();
    confirm.mockRejectedValue(new ApiError('Cannot reach the server. Check your connection.'));

    const outcome = payTopUp({ amount: 100 }).catch(caught => caught);
    await jest.advanceTimersByTimeAsync(2000);
    const error = await outcome;

    expect(error).toBeInstanceOf(PaymentUnconfirmedError);
    expect(confirm).toHaveBeenCalledTimes(2);
    expect(cancel).not.toHaveBeenCalled();
  });

  test('a confirm that fails once and then lands settles normally', async () => {
    jest.useFakeTimers();
    confirm.mockRejectedValueOnce(new ApiError('The request timed out. Please try again.'));

    const outcome = payTopUp({ amount: 100 });
    await jest.advanceTimersByTimeAsync(2000);

    await expect(outcome).resolves.toBe(SETTLED);
    expect(confirm).toHaveBeenCalledTimes(2);
  });

  test('a Razorpay order with no checkout details is closed and refused rather than confirmed blind', async () => {
    start.mockResolvedValue({ ...RAZORPAY_ORDER, razorpay: undefined } as never);

    await expect(payTopUp({ amount: 100 })).rejects.toBeInstanceOf(PaymentFailedError);
    expect(open).not.toHaveBeenCalled();
    expect(confirm).not.toHaveBeenCalled();
    expect(cancel).toHaveBeenCalledWith('txn-9', 'checkout_details_missing');
  });

  test('one payment at a time: a second call while the checkout is open is refused before anything is opened', async () => {
    let finish!: (value: unknown) => void;
    open.mockImplementationOnce(() => new Promise(resolve => { finish = resolve; }));

    const first = payTopUp({ amount: 100 });
    await expect(payTopUp({ amount: 100 })).rejects.toThrow('A payment is already in progress.');
    expect(start).toHaveBeenCalledTimes(1);

    /** `open` is reached a few ticks in, behind startTopUp and the SDK's lazy import. */
    for (let tick = 0; tick < 20 && !finish; tick += 1) {
      await Promise.resolve();
    }
    finish({ razorpay_payment_id: 'pay_test_1', razorpay_order_id: 'order_Test123', razorpay_signature: 'sig_test_1' });
    await expect(first).resolves.toBe(SETTLED);

    /** And it is released afterwards. */
    await expect(payTopUp({ amount: 100 })).resolves.toBe(SETTLED);
  });
});

describe('a server with no gateway', () => {
  const PLAIN = { transactionId: 't-1', reference: 'TXN-ABC123', orderId: 'ORD-1', amount: 500, gateway: 'none' as const };
  const CREDITED = { _id: 't-1', amount: 500, balanceAfter: 1750, status: 'success' };

  test('is confirmed straight away, exactly as before: no checkout, and the picked method goes along for the receipt', async () => {
    start.mockResolvedValue(PLAIN as never);
    confirm.mockResolvedValue(CREDITED as never);

    await expect(payTopUp({ amount: 500, method: 'card', methodLabel: 'Credit / Debit Card' })).resolves.toBe(CREDITED);
    expect(start).toHaveBeenCalledWith(500, undefined);
    expect(confirm).toHaveBeenCalledWith('t-1', undefined, 'Credit / Debit Card');
    expect(open).not.toHaveBeenCalled();
    expect(cancel).not.toHaveBeenCalled();
  });

  test('an order from a server that predates the `gateway` field is treated the same way', async () => {
    start.mockResolvedValue({ transactionId: 't-1' } as never);
    confirm.mockResolvedValue(CREDITED as never);

    await payTopUp({ amount: 500 });
    expect(confirm).toHaveBeenCalledWith('t-1', undefined, undefined);
    expect(open).not.toHaveBeenCalled();
  });

  test('top-ups switched off (503 payments_unavailable) reject with the server\'s message and open nothing', async () => {
    start.mockRejectedValue(new ApiError('Adding money is not available right now.', 503, undefined, 'payments_unavailable'));

    await expect(payTopUp({ amount: 500 })).rejects.toThrow('Adding money is not available right now.');
    expect(open).not.toHaveBeenCalled();
    expect(confirm).not.toHaveBeenCalled();
    expect(cancel).not.toHaveBeenCalled();
  });
});

describe('what the screens show', () => {
  test('a closed checkout is flagged so a screen can stay quiet; everything else is a dialog with the reason', () => {
    expect(describePaymentError(new PaymentCancelledError())).toEqual({
      cancelled: true,
      dialog: { title: 'Payment cancelled', tone: 'info', message: 'Nothing was added to your wallet.' },
    });
    expect(describePaymentError(new PaymentFailedError('Your bank declined the payment.'))).toEqual({
      cancelled: false,
      dialog: { title: 'Payment failed', tone: 'error', message: 'Your bank declined the payment.' },
    });
    expect(describePaymentError(new ApiError('Minimum top-up is ₹50.', 400)).dialog.message).toBe('Minimum top-up is ₹50.');
    expect(describePaymentError(new PaymentUnconfirmedError()).dialog).toEqual(
      expect.objectContaining({ title: 'Payment received', tone: 'warning' }),
    );
    expect(describePaymentError(new PaymentUnavailableError()).dialog.title).toBe('Payments unavailable');
    expect(describePaymentError(new TypeError('x is not a function')).dialog.message).toBe(
      'Something went wrong. Please try again.',
    );
  });

  test('the receipt prints the method Razorpay reported, not the one picked before the checkout', () => {
    expect(paidWithLabel({ payment: { gateway: 'razorpay', method: 'card' } }, 'UPI')).toBe('Credit / Debit Card');
    expect(paidWithLabel({ payment: { gateway: 'razorpay', method: 'upi' } }, 'Net Banking')).toBe('UPI');
    expect(paidWithLabel({ payment: { gateway: 'razorpay' } }, 'UPI')).toBe('Razorpay');
    /** No gateway: the pick is all there is, as before. */
    expect(paidWithLabel({ payment: { gateway: 'none' } }, 'UPI')).toBe('UPI');
    expect(paidWithLabel({ method: 'Net Banking' }, 'UPI')).toBe('Net Banking');
  });
});

describe('services/api.ts — the requests behind it', () => {
  const real = jest.requireActual('../src/services/api') as typeof api;
  let post: jest.SpyInstance;

  beforeEach(() => {
    post = jest.spyOn(client, 'post');
  });

  test('startTopUp posts the amount (and a coupon only when there is one) and returns the order with its gateway', async () => {
    post.mockResolvedValue({ data: RAZORPAY_ORDER });

    await expect(real.startTopUp(100)).resolves.toEqual(RAZORPAY_ORDER);
    expect(post).toHaveBeenLastCalledWith('/wallet/topup', { amount: 100 });

    await real.startTopUp(100, 'WELCOME');
    expect(post).toHaveBeenLastCalledWith('/wallet/topup', { amount: 100, couponCode: 'WELCOME' });
  });

  test('confirmTopUp sends the Razorpay triple for a checkout payment, and the old body otherwise', async () => {
    post.mockResolvedValue({ data: { transaction: SETTLED } });

    await expect(
      real.confirmTopUp('txn-9', {
        razorpayPaymentId: 'pay_test_1',
        razorpayOrderId: 'order_Test123',
        razorpaySignature: 'sig_test_1',
      }),
    ).resolves.toEqual(SETTLED);
    expect(post).toHaveBeenLastCalledWith('/wallet/topup/confirm', {
      transactionId: 'txn-9',
      razorpayPaymentId: 'pay_test_1',
      razorpayOrderId: 'order_Test123',
      razorpaySignature: 'sig_test_1',
    });

    await real.confirmTopUp('t-1', undefined, 'UPI');
    expect(post).toHaveBeenLastCalledWith('/wallet/topup/confirm', {
      transactionId: 't-1',
      paymentId: undefined,
      method: 'UPI',
    });
  });

  test('cancelTopUp posts the row and why it was closed', async () => {
    post.mockResolvedValue({ data: { ok: true } });

    await real.cancelTopUp('txn-9', 'checkout_dismissed');
    expect(post).toHaveBeenLastCalledWith('/wallet/topup/cancel', { transactionId: 'txn-9', reason: 'checkout_dismissed' });

    await real.cancelTopUp('txn-9');
    expect(post).toHaveBeenLastCalledWith('/wallet/topup/cancel', { transactionId: 'txn-9' });
  });
});
