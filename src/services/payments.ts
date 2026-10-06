/**
 * Paying for a wallet top-up — the one function every "add money" button calls.
 *
 * `payTopUp` runs the whole sequence so no screen has to know there is one:
 *
 *   startTopUp ──► gateway 'razorpay' ──► Razorpay checkout ──► confirmTopUp(the three ids)
 *              └─► gateway 'none' ─────────────────────────────► confirmTopUp()
 *
 * Which branch runs is the server's call (see `startTopUp` in services/api.ts).
 * With Razorpay the wallet is credited only after the server has verified the
 * signature the checkout returned; nothing here can credit it. Test mode and
 * live mode are the same code — the server hands out whichever key id it was
 * configured with.
 *
 * `react-native-razorpay` is loaded when a checkout is first opened rather
 * than at startup, the way services/voiceCall.ts loads Agora: its native
 * module is looked up when the JS module is first evaluated, so a binary built
 * before it was linked (the pods not installed, an older build under Metro)
 * would otherwise fail to open the app at all rather than just fail to take a
 * payment. Here that case is a `PaymentUnavailableError` with a message worth
 * showing.
 */

import { Platform } from 'react-native';
import type { RazorpayCheckoutOptions } from 'react-native-razorpay';

import type { DialogRequest } from '../components/AppDialog';
import { colors } from '../theme';
import {
  cancelTopUp,
  confirmTopUp,
  startTopUp,
  type RazorpayOrder,
  type RazorpayPayment,
  type TopUpTransaction,
} from './api';
import { ApiError } from './client';

type RazorpaySdk = typeof import('react-native-razorpay');

/** The ways Razorpay's checkout can be asked to open — a preference, not a restriction. */
export type CheckoutMethod = 'upi' | 'card' | 'netbanking' | 'wallet';

export type PayTopUpOptions = {
  /** In rupees. */
  amount: number;
  couponCode?: string;
  /** What the seeker picked on the Payment screen; Razorpay opens on it but still offers the rest. */
  method?: CheckoutMethod;
  /** Recorded on the transaction only when the server has no gateway — with Razorpay the method is whatever Razorpay reports. */
  methodLabel?: string;
};

/** The seeker closed the checkout without paying. Not a failure — screens stay quiet, or say "Payment cancelled". */
export class PaymentCancelledError extends Error {
  constructor(message = 'Payment cancelled.') {
    super(message);
    this.name = 'PaymentCancelledError';
  }
}

/** The payment was attempted and did not go through. `message` is Razorpay's own description. */
export class PaymentFailedError extends Error {
  /** The checkout SDK's numeric code, when it gave one. */
  code?: number;
  /** Razorpay's machine reason (`payment_failed`, `insufficient_funds`…), when it gave one. */
  reason?: string;

  constructor(message: string, code?: number, reason?: string) {
    super(message);
    this.name = 'PaymentFailedError';
    this.code = code;
    this.reason = reason;
  }
}

/** This build has no Razorpay native module — it predates the checkout being linked. */
export class PaymentUnavailableError extends Error {
  constructor(message = 'Payments need the latest version of the app. Please update it and try again.') {
    super(message);
    this.name = 'PaymentUnavailableError';
  }
}

/**
 * The checkout reported success but the server could not be reached to confirm
 * it. The money has moved; the wallet is credited when the server hears from
 * Razorpay directly (its webhook), so this must never read as "payment failed".
 */
export class PaymentUnconfirmedError extends Error {
  constructor(
    message = 'Your payment went through, but we could not confirm it just now. Your wallet will be updated shortly — please do not pay again.',
  ) {
    super(message);
    this.name = 'PaymentUnconfirmedError';
  }
}

/**
 * What the checkout SDK's numeric codes mean. They are the native SDKs' own,
 * and the two platforms disagree: Android's `Checkout.PAYMENT_CANCELED` is 0
 * and its `NETWORK_ERROR` is 2, while iOS reports a cancel as 2 and a network
 * error as 0.
 */
const CANCEL_CODES: ReadonlyArray<number> = Platform.select({ android: [0], ios: [2], default: [0, 2] });
const NETWORK_CODES: ReadonlyArray<number> = Platform.select({ android: [2], ios: [0], default: [] });

/** How long to wait before asking the server to confirm a second time. */
const CONFIRM_RETRY_MS = 1500;
/** `payment.failureReason` is a note for whoever reads the ledger, not a transcript. */
const MAX_REASON_LENGTH = 200;

/** One checkout at a time: a second tap must not open a second order behind the first. */
let paying = false;

type CheckoutFailure = {
  kind: 'cancelled' | 'network' | 'failed' | 'unavailable';
  description: string;
  code?: number;
  reason?: string;
};

/**
 * Reads whatever the checkout rejected with.
 *
 * The SDK rejects with its event payload, `{ code, description, … }`, where
 * `description` is either prose or — from the newer native SDKs — a JSON
 * string wrapping Razorpay's `{ error: { description, reason, … } }`; some
 * versions attach that `error` object directly as well. An actual `Error`
 * means the call itself threw: the native module is not in this binary.
 */
function readCheckoutFailure(error: unknown): CheckoutFailure {
  if (error instanceof Error || error === null || typeof error !== 'object') {
    return { kind: 'unavailable', description: '' };
  }

  const payload = error as { code?: unknown; description?: unknown; reason?: unknown; error?: unknown };
  let detail: { description?: unknown; reason?: unknown } | undefined;
  let description = typeof payload.description === 'string' ? payload.description.trim() : '';

  if (payload.error !== null && typeof payload.error === 'object') {
    detail = payload.error as { description?: unknown; reason?: unknown };
  } else if (description.startsWith('{')) {
    try {
      const parsed = JSON.parse(description);
      detail = parsed?.error ?? parsed;
    } catch {
      /** Not JSON after all — it is shown as the prose it is. */
    }
  }
  if (detail) {
    description = typeof detail.description === 'string' ? detail.description.trim() : '';
  }

  const rawReason = detail?.reason ?? payload.reason;
  const reason = typeof rawReason === 'string' ? rawReason : undefined;
  const numeric = Number(payload.code);
  const code = payload.code !== undefined && payload.code !== null && Number.isFinite(numeric) ? numeric : undefined;

  if (reason === 'payment_cancelled' || /cancel/i.test(description) || (code !== undefined && CANCEL_CODES.includes(code))) {
    return { kind: 'cancelled', description, code, reason };
  }
  if (code !== undefined && NETWORK_CODES.includes(code)) {
    return { kind: 'network', description, code, reason };
  }
  return { kind: 'failed', description, code, reason };
}

/** Closing the pending row is housekeeping; it must never replace the error the seeker is about to be shown. */
async function closePendingTopUp(transactionId: string, reason: string) {
  try {
    await cancelTopUp(transactionId, reason.slice(0, MAX_REASON_LENGTH));
  } catch {
    /** The row stays pending — nothing is credited for a pending row, so nothing is lost. */
  }
}

/** A refusal the server will repeat however often it is asked — as opposed to one that never arrived. */
function isRefusal(error: unknown): boolean {
  return (
    error instanceof ApiError &&
    error.status !== undefined &&
    error.status >= 400 &&
    error.status < 500 &&
    error.status !== 408 &&
    error.status !== 429
  );
}

/**
 * Hands the checkout's three ids to the server. By this point the seeker has
 * paid, so a request that merely failed to arrive is asked once more (the
 * server's confirm is idempotent) before giving up as "unconfirmed" — never as
 * "failed", and never by cancelling the row.
 */
async function confirmPaid(transactionId: string, payment: RazorpayPayment): Promise<TopUpTransaction> {
  try {
    return await confirmTopUp(transactionId, payment);
  } catch (error) {
    if (isRefusal(error)) {
      throw error;
    }
  }

  await new Promise<void>(resolve => setTimeout(resolve, CONFIRM_RETRY_MS));

  try {
    return await confirmTopUp(transactionId, payment);
  } catch (error) {
    if (isRefusal(error)) {
      throw error;
    }
    throw new PaymentUnconfirmedError();
  }
}

async function payThroughRazorpay(
  transactionId: string,
  order: RazorpayOrder,
  method?: CheckoutMethod,
): Promise<TopUpTransaction> {
  let sdk: RazorpaySdk;
  try {
    sdk = await import('react-native-razorpay');
  } catch {
    await closePendingTopUp(transactionId, 'checkout_unavailable');
    throw new PaymentUnavailableError();
  }

  const prefill = { ...order.prefill, ...(method ? { method } : null) };
  const options: RazorpayCheckoutOptions = {
    key: order.keyId,
    order_id: order.orderId,
    amount: order.amount,
    currency: order.currency,
    name: order.name,
    description: order.description,
    ...(Object.keys(prefill).length > 0 ? { prefill } : null),
    /** The orange the app's own primary buttons start from. */
    theme: { color: colors.gradient.from },
  };

  let result: Awaited<ReturnType<RazorpaySdk['default']['open']>>;
  try {
    result = await sdk.default.open(options);
  } catch (error) {
    const failure = readCheckoutFailure(error);

    if (failure.kind === 'unavailable') {
      await closePendingTopUp(transactionId, 'checkout_unavailable');
      throw new PaymentUnavailableError();
    }
    if (failure.kind === 'cancelled') {
      await closePendingTopUp(transactionId, 'checkout_dismissed');
      throw new PaymentCancelledError();
    }
    if (failure.kind === 'network') {
      /**
       * The checkout lost its connection, which says nothing about whether the
       * bank took the money. The row is left pending rather than marked failed
       * so that, if it did, the server can still credit it when Razorpay
       * reports the capture.
       */
      throw new PaymentFailedError(
        failure.description || 'Could not reach the payment gateway. Check your connection and try again.',
        failure.code,
        failure.reason,
      );
    }
    const description = failure.description || 'The payment did not go through. Please try again.';
    await closePendingTopUp(transactionId, description);
    throw new PaymentFailedError(description, failure.code, failure.reason);
  }

  if (!result?.razorpay_payment_id || !result.razorpay_signature) {
    /** Paid, by the checkout's account, but with nothing the server could verify — left for the webhook. */
    throw new PaymentUnconfirmedError();
  }

  return confirmPaid(transactionId, {
    razorpayPaymentId: result.razorpay_payment_id,
    razorpayOrderId: result.razorpay_order_id ?? order.orderId,
    razorpaySignature: result.razorpay_signature,
  });
}

/**
 * Adds `amount` rupees to the wallet and resolves with the settled transaction.
 *
 * Rejects with:
 *  - `PaymentCancelledError` — the checkout was closed; the pending row has been cancelled.
 *  - `PaymentFailedError` — the payment did not go through; `message` is Razorpay's description.
 *  - `PaymentUnavailableError` — this build cannot open the checkout.
 *  - `PaymentUnconfirmedError` — paid, but the server could not be told yet.
 *  - `ApiError` — the server refused to start or to confirm the top-up.
 *
 * `describePaymentError` turns any of them into a dialog.
 */
export async function payTopUp({ amount, couponCode, method, methodLabel }: PayTopUpOptions): Promise<TopUpTransaction> {
  if (paying) {
    throw new PaymentFailedError('A payment is already in progress.');
  }
  paying = true;

  try {
    const order = await startTopUp(amount, couponCode);

    if (order.gateway !== 'razorpay') {
      /** No gateway on this server: there is nothing to pay through, so the order is confirmed as it stands. */
      return await confirmTopUp(order.transactionId, undefined, methodLabel);
    }
    if (!order.razorpay) {
      await closePendingTopUp(order.transactionId, 'checkout_details_missing');
      throw new PaymentFailedError('The payment could not be started. Please try again.');
    }
    return await payThroughRazorpay(order.transactionId, order.razorpay, method);
  } finally {
    paying = false;
  }
}

/** Razorpay's method ids, as a receipt should print them. */
const METHOD_LABELS: Record<string, string> = {
  upi: 'UPI',
  card: 'Credit / Debit Card',
  netbanking: 'Net Banking',
  wallet: 'Wallet',
  emi: 'EMI',
  paylater: 'Pay Later',
};

/**
 * How a settled top-up was paid, for the receipt. A Razorpay payment prints
 * the method Razorpay reported — which may not be the one picked before the
 * checkout opened — and never the pick in its place.
 */
export function paidWithLabel(transaction: TopUpTransaction, picked?: string): string {
  const reported = transaction.payment?.method ?? transaction.method;
  if (transaction.payment?.gateway === 'razorpay') {
    return reported ? METHOD_LABELS[reported] ?? reported : 'Razorpay';
  }
  return reported ?? picked ?? '—';
}

/**
 * The dialog for a `payTopUp` rejection. `cancelled` is set for a closed
 * checkout, which a screen may prefer to let pass without a dialog at all.
 */
export function describePaymentError(error: unknown): { cancelled: boolean; dialog: DialogRequest } {
  if (error instanceof PaymentCancelledError) {
    return {
      cancelled: true,
      dialog: { title: 'Payment cancelled', tone: 'info', message: 'Nothing was added to your wallet.' },
    };
  }
  if (error instanceof PaymentUnconfirmedError) {
    return { cancelled: false, dialog: { title: 'Payment received', tone: 'warning', message: error.message } };
  }
  if (error instanceof PaymentUnavailableError) {
    return { cancelled: false, dialog: { title: 'Payments unavailable', tone: 'error', message: error.message } };
  }
  return {
    cancelled: false,
    dialog: {
      title: 'Payment failed',
      tone: 'error',
      message:
        error instanceof ApiError || error instanceof PaymentFailedError
          ? error.message
          : 'Something went wrong. Please try again.',
    },
  };
}
