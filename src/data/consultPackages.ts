/**
 * Fixed-length consultation packages — the alternative to per-minute billing
 * on the intake form. When a package runs out the session simply carries on
 * per-minute (see PackageView).
 *
 * The server is the source of truth: POST /chats/precheck returns every
 * package already priced at the astrologer's real rate (backend
 * config/packages.js), and the server re-prices and re-checks the wallet on
 * submit. The list below mirrors that file only so the app can still price
 * packages from the precheck's own `ratePerMinute` when a server quote isn't
 * there (dummy mode, or an older server) — change both together.
 *
 * Discounts are set per package by an admin (panel → Settings → Platform)
 * and arrive already applied in the server's quotes: `originalPrice` is the
 * full minutes × rate (shown struck through) and `price` is the discounted
 * amount that is actually charged. The 0% defaults below only matter for
 * the local fallback.
 */

export type ConsultPackage = { minutes: number; discountPercent: number };

export const CONSULTATION_PACKAGES: ReadonlyArray<ConsultPackage> = [
  { minutes: 3, discountPercent: 0 },
  { minutes: 5, discountPercent: 0 },
  { minutes: 10, discountPercent: 0 },
  { minutes: 20, discountPercent: 0 },
];

/** One package, priced — the shape both the server's quotes and {@link quotePackages} produce. */
export type PackageQuote = {
  minutes: number;
  discountPercent: number;
  /** minutes × rate, before the admin's discount — the struck-through figure. */
  originalPrice?: number;
  /** What is actually charged (after the discount). */
  price: number;
  /** Present when priced against a known wallet balance. */
  affordable?: boolean;
  shortfallAmount?: number;
};

/** What the seeker picked on the intake form. Per-minute is the default. */
export type ConsultationChoice =
  | { mode: 'per_minute' }
  | { mode: 'package'; minutes: number; price: number };

export const PER_MINUTE: ConsultationChoice = { mode: 'per_minute' };

/** A package booking on POST /chats. Omitted entirely for per-minute — the request is then exactly what it always was. */
export type PackageBooking = {
  mode: 'package';
  packageMinutes: number;
  /** The price the seeker was shown and confirmed; the server re-prices and answers `price_changed` if it no longer matches. */
  quotedPrice: number;
};

/** The intake form's choice -> POST /chats' `billing`, or undefined for per-minute (no `billing` sent at all). */
export function toPackageBooking(choice: ConsultationChoice | undefined): PackageBooking | undefined {
  return choice?.mode === 'package'
    ? { mode: 'package', packageMinutes: choice.minutes, quotedPrice: choice.price }
    : undefined;
}

/** minutes × rate, less the package's own discount, in whole rupees — the same rule as the server's. */
export function packagePrice(ratePerMinute: number, pkg: ConsultPackage): number {
  const gross = ratePerMinute * pkg.minutes;
  const discount = Math.round((gross * (pkg.discountPercent || 0)) / 100);
  return Math.max(0, Math.round(gross - discount));
}

/** Every package priced at `ratePerMinute`, flagged against `balance` when one is known. */
export function quotePackages(ratePerMinute: number, balance?: number): PackageQuote[] {
  return CONSULTATION_PACKAGES.map(pkg => {
    const price = packagePrice(ratePerMinute, pkg);
    const originalPrice = Math.round(ratePerMinute * pkg.minutes);
    return balance === undefined
      ? { minutes: pkg.minutes, discountPercent: pkg.discountPercent, originalPrice, price }
      : {
          minutes: pkg.minutes,
          discountPercent: pkg.discountPercent,
          originalPrice,
          price,
          affordable: balance >= price,
          shortfallAmount: Math.max(0, price - balance),
        };
  });
}

/**
 * The quotes to show: the server's when it sent any (priced at the real
 * rate, server-side), otherwise computed from the rate it did send. No rate
 * at all means no prices can be shown, so no packages are offered.
 */
export function resolveQuotes(
  serverQuotes: PackageQuote[] | undefined,
  ratePerMinute: number | undefined,
  balance?: number,
): PackageQuote[] {
  if (serverQuotes && serverQuotes.length > 0) {
    return serverQuotes;
  }
  if (ratePerMinute === undefined || ratePerMinute === null || !(ratePerMinute > 0)) {
    return [];
  }
  return quotePackages(ratePerMinute, balance);
}

/** Whether a quote is actually discounted — i.e. there's a higher original price to strike through. */
export const isDiscounted = (quote: PackageQuote) =>
  quote.discountPercent > 0 && quote.originalPrice !== undefined && quote.originalPrice > quote.price;

/** How much more the wallet needs to cover `price` — 0 when it already does. */
export const shortfallFor = (price: number, balance: number) => Math.max(0, Math.round(price - balance));

/** Whether the wallet covers `price`. Unknown balance is treated as "let the server decide". */
export const canAfford = (price: number, balance?: number) => balance === undefined || balance >= price;

/** 125 -> "02:05". Never negative. */
export function formatCountdown(totalSeconds: number): string {
  const safe = Math.max(0, Math.floor(totalSeconds));
  return `${String(Math.floor(safe / 60)).padStart(2, '0')}:${String(safe % 60).padStart(2, '0')}`;
}

/**
 * How far the server's clock is ahead of this device's, in ms. Every package
 * countdown is measured against the server's time (`serverTime` on each
 * state/event), so a phone with a wrong clock still shows the right time left.
 */
export function clockOffsetMs(serverTime: string | undefined | null, deviceNow: number = Date.now()): number {
  if (!serverTime) {
    return 0;
  }
  const server = new Date(serverTime).getTime();
  return Number.isNaN(server) ? 0 : server - deviceNow;
}

/** Whole seconds until `iso` on the server's clock (0 once it has passed, or when there's no time). */
export function secondsUntil(iso: string | undefined | null, offsetMs: number, deviceNow: number = Date.now()): number {
  if (!iso) {
    return 0;
  }
  const target = new Date(iso).getTime();
  if (Number.isNaN(target)) {
    return 0;
  }
  return Math.max(0, Math.ceil((target - (deviceNow + offsetMs)) / 1000));
}

/**
 * Whole seconds elapsed since `startedAt` on the server's clock, less any
 * time spent paused — the per-minute header clock. astro_app's
 * src/utils/sessionClock.ts computes the astrologer's header the same way,
 * so both sides read the same number even when a phone's clock is off.
 */
export function elapsedSeconds(
  startedAt: string | undefined | null,
  offsetMs: number,
  pausedMs = 0,
  deviceNow: number = Date.now(),
): number {
  if (!startedAt) {
    return 0;
  }
  const started = new Date(startedAt).getTime();
  if (Number.isNaN(started)) {
    return 0;
  }
  return Math.max(0, Math.floor((deviceNow + offsetMs - started - pausedMs) / 1000));
}

/**
 * Where a package session stands — mirrors backend chat.service.js's
 * packageViewFor, fed by every state read, socket rejoin and package event.
 * `undefined` on a per-minute session. 'package' while package time lasts;
 * 'per_minute' once it has run out and the session is billed per minute
 * (with the ordinary low-balance banner / recharge flow).
 */
export type PackageView = {
  phase: 'package' | 'per_minute';
  endsAt?: string;
  warningSeconds?: number;
  perMinuteStartedAt?: string;
  requestedMinutes?: number;
  minutesPurchased?: number;
  amountCharged?: number;
};
