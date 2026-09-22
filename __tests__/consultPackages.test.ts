/**
 * The pure package logic behind the intake form and the package countdown
 * (src/data/consultPackages.ts). The money itself is decided server-side —
 * see backend tests/chat-packages.test.js — this is what the app shows and
 * what it sends.
 */
import {
  CONSULTATION_PACKAGES,
  PER_MINUTE,
  canAfford,
  clockOffsetMs,
  elapsedSeconds,
  isDiscounted,
  formatCountdown,
  packagePrice,
  quotePackages,
  resolveQuotes,
  secondsUntil,
  shortfallFor,
  toPackageBooking,
} from '../src/data/consultPackages';

describe('package price calculation', () => {
  test('the offered durations live in one list: 3, 5, 10, 20 minutes; the built-in default is no discount (admin sets real ones)', () => {
    expect(CONSULTATION_PACKAGES.map(p => p.minutes)).toEqual([3, 5, 10, 20]);
    expect(CONSULTATION_PACKAGES.every(p => p.discountPercent === 0)).toBe(true);
  });

  test('price = minutes × the astrologer\'s own rate', () => {
    expect(quotePackages(20).map(q => q.price)).toEqual([60, 100, 200, 400]);
    expect(quotePackages(37).map(q => q.price)).toEqual([111, 185, 370, 740]);
  });

  test('the chat and call rates price differently for the same astrologer', () => {
    expect(quotePackages(20)[1].price).toBe(100);
    expect(quotePackages(30)[1].price).toBe(150);
  });

  test('the discount hook applies when set, rounded to whole rupees', () => {
    expect(packagePrice(20, { minutes: 10, discountPercent: 10 })).toBe(180);
    expect(packagePrice(15, { minutes: 3, discountPercent: 15 })).toBe(38);
    expect(packagePrice(20, { minutes: 5, discountPercent: 0 })).toBe(100);
  });

  test('server quotes win over local computation; no rate means no packages', () => {
    const server = [{ minutes: 3, discountPercent: 0, price: 75 }];
    expect(resolveQuotes(server, 20)).toBe(server);
    expect(resolveQuotes(undefined, 20).map(q => q.price)).toEqual([60, 100, 200, 400]);
    expect(resolveQuotes([], 20)).toHaveLength(4);
    expect(resolveQuotes(undefined, undefined)).toEqual([]);
    expect(resolveQuotes(undefined, 0)).toEqual([]);
  });
});

describe('admin package discounts', () => {
  test('local quotes carry the full price as originalPrice', () => {
    expect(quotePackages(20)[1]).toEqual(expect.objectContaining({ originalPrice: 100, price: 100 }));
  });

  test('a quote is discounted only when there is a higher original to strike through', () => {
    expect(isDiscounted({ minutes: 5, discountPercent: 10, originalPrice: 100, price: 90 })).toBe(true);
    expect(isDiscounted({ minutes: 5, discountPercent: 0, originalPrice: 100, price: 100 })).toBe(false);
    expect(isDiscounted({ minutes: 5, discountPercent: 10, price: 90 })).toBe(false);
  });

  test('the discounted price is what gets booked', () => {
    expect(toPackageBooking({ mode: 'package', minutes: 5, price: 90 })).toEqual({
      mode: 'package',
      packageMinutes: 5,
      quotedPrice: 90,
    });
  });
});

describe('wallet sufficiency', () => {
  test('each package is flagged against the balance, with the exact shortfall', () => {
    const quotes = quotePackages(20, 100);
    expect(quotes.map(q => q.affordable)).toEqual([true, true, false, false]);
    expect(quotes.map(q => q.shortfallAmount)).toEqual([0, 0, 100, 300]);
  });

  test('an exactly equal balance is enough', () => {
    expect(canAfford(100, 100)).toBe(true);
    expect(canAfford(100, 99)).toBe(false);
    expect(shortfallFor(100, 99)).toBe(1);
    expect(shortfallFor(100, 250)).toBe(0);
  });

  test('an unknown balance never blocks on the client — the server decides', () => {
    expect(canAfford(400, undefined)).toBe(true);
  });
});

describe('package vs per-minute request', () => {
  test('per-minute sends no billing at all, so the request is unchanged', () => {
    expect(toPackageBooking(PER_MINUTE)).toBeUndefined();
    expect(toPackageBooking(undefined)).toBeUndefined();
  });

  test('a package sends its minutes and the price the seeker confirmed', () => {
    expect(toPackageBooking({ mode: 'package', minutes: 5, price: 100 })).toEqual({
      mode: 'package',
      packageMinutes: 5,
      quotedPrice: 100,
    });
  });
});

describe('package countdown', () => {
  test('countdowns format as mm:ss and never go negative', () => {
    expect(formatCountdown(125)).toBe('02:05');
    expect(formatCountdown(0)).toBe('00:00');
    expect(formatCountdown(-4)).toBe('00:00');
    expect(formatCountdown(20 * 60)).toBe('20:00');
  });

  test('time left is measured on the server\'s clock, not the device\'s', () => {
    const deviceNow = Date.parse('2026-01-01T10:00:00.000Z');
    /** The device is 90s slow compared to the server. */
    const offset = clockOffsetMs('2026-01-01T10:01:30.000Z', deviceNow);
    expect(offset).toBe(90_000);
    /** The package ends 3 minutes after the server's "now". */
    expect(secondsUntil('2026-01-01T10:04:30.000Z', offset, deviceNow)).toBe(180);
    expect(secondsUntil('2026-01-01T10:04:30.000Z', 0, deviceNow)).toBe(270);
  });

  test('elapsed time is measured on the server\'s clock, less paused time', () => {
    const deviceNow = Date.parse('2026-01-01T10:00:00.000Z');
    const offset = clockOffsetMs('2026-01-01T10:10:00.000Z', deviceNow);
    expect(elapsedSeconds('2026-01-01T10:07:55.000Z', offset, 0, deviceNow)).toBe(125);
    expect(elapsedSeconds('2026-01-01T10:07:55.000Z', offset, 5_000, deviceNow)).toBe(120);
    expect(elapsedSeconds(undefined, offset, 0, deviceNow)).toBe(0);
  });

  test('a finished package, or a missing time, reads as 0 seconds left', () => {
    expect(secondsUntil('2020-01-01T00:00:00.000Z', 0)).toBe(0);
    expect(secondsUntil(undefined, 0)).toBe(0);
    expect(secondsUntil('not a date', 0)).toBe(0);
    expect(clockOffsetMs(undefined)).toBe(0);
  });
});
