/**
 * The "Call" and "Chat" minute tiles on an astrologer's profile.
 *
 * They read the astrologer's real consulted minutes (the backend's
 * metrics.chatMinutes / metrics.callMinutes, which every ended consultation adds
 * to). They used to be printed as `Math.round(minutes / 1000)` with a hardcoded
 * "K", so every astrologer actually on the platform read "0K Mins" — 88 minutes
 * of consultations rounds to zero thousand. Only the seeded fixtures, with their
 * tens of thousands, ever looked right.
 */
import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { AstrologerDetailScreen } from '../src/screens/AstrologerDetailScreen';
import * as api from '../src/services/api';

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

const mounted: ReactTestRenderer.ReactTestRenderer[] = [];

const render = async (element: React.ReactElement) => {
  let tree!: ReactTestRenderer.ReactTestRenderer;
  await ReactTestRenderer.act(() => {
    tree = ReactTestRenderer.create(<SafeAreaProvider initialMetrics={METRICS}>{element}</SafeAreaProvider>);
  });
  await ReactTestRenderer.act(async () => {
    for (let i = 0; i < 5; i += 1) await Promise.resolve();
  });
  mounted.push(tree);
  return tree;
};

afterEach(async () => {
  await ReactTestRenderer.act(() => {
    mounted.splice(0).forEach(tree => tree.unmount());
  });
  jest.restoreAllMocks();
});

describe('minutesLabel', () => {
  test('hundreds of minutes are minutes — not "0K"', () => {
    expect(api.minutesLabel(88)).toBe('88 Mins');
    expect(api.minutesLabel(6)).toBe('6 Mins');
    expect(api.minutesLabel(999)).toBe('999 Mins');
  });

  test('an astrologer who has not consulted yet reads as none, honestly', () => {
    expect(api.minutesLabel(0)).toBe('0 Mins');
    expect(api.minutesLabel(undefined)).toBe('0 Mins');
  });

  test('one minute is a minute', () => {
    expect(api.minutesLabel(1)).toBe('1 Min');
  });

  test('thousands carry a decimal until there are ten of them', () => {
    expect(api.minutesLabel(1000)).toBe('1K Mins');
    expect(api.minutesLabel(1250)).toBe('1.3K Mins');
    expect(api.minutesLabel(9800)).toBe('9.8K Mins');
  });

  test('past that, whole thousands — a decimal on 42K is noise', () => {
    expect(api.minutesLabel(42000)).toBe('42K Mins');
    expect(api.minutesLabel(120000)).toBe('120K Mins');
  });

  test('nothing negative or nonsense gets through', () => {
    expect(api.minutesLabel(-5)).toBe('0 Mins');
    expect(api.minutesLabel(NaN)).toBe('0 Mins');
  });
});

describe('the profile tiles', () => {
  test('show what this astrologer has really consulted for', async () => {
    /** The live numbers for the platform's busiest astrologer today. */
    jest.spyOn(api, 'fetchAstrologer').mockResolvedValue({
      id: 'a-rajesh',
      name: 'Rajesh Singh',
      online: true,
      experienceYears: 12,
      languages: ['hindi'],
      chatMinutes: 88,
      callMinutes: 0,
      services: [{ type: 'chat', ratePerMinute: 20, isEnabled: true }],
    } as never);

    const tree = await render(
      <AstrologerDetailScreen astrologer={{ id: 'a-rajesh', name: 'Rajesh Singh' } as never} />,
    );
    const text = textOf(tree);

    expect(text).toContain('88 Mins');
    /** What it printed before: every real astrologer, chat and call alike. */
    expect(text).not.toContain('0K Mins');
    /** No calls taken yet, said plainly rather than dressed up. */
    expect(text).toContain('0 Mins');
  });
});
