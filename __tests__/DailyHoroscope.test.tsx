/**
 * Home's Daily Horoscope card, and the reading behind it.
 *
 * The card shows three highlights and a trimmed paragraph; tapping it used to
 * open a "Coming Soon" screen. It now opens the whole of what the same provider
 * request already returns — the day in one line, those highlights, and the six
 * areas it writes about. Today's only: the provider writes one reading a day per
 * sign, the backend keeps it in Mongo (models/HoroscopeCache, unique on sign +
 * period + date), and there is nothing to page through.
 */
import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { DailyHoroscopeScreen } from '../src/screens/DailyHoroscopeScreen';
import { HomeScreen } from '../src/screens/HomeScreen';
import * as api from '../src/services/api';

const METRICS = {
  frame: { x: 0, y: 0, width: 390, height: 844 },
  insets: { top: 47, left: 0, right: 0, bottom: 34 },
};

type Tree = ReactTestRenderer.ReactTestRenderer;

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
    for (let i = 0; i < 8; i += 1) await Promise.resolve();
  });
};

const mounted: Tree[] = [];

const render = async (element: React.ReactElement) => {
  let tree!: Tree;
  await ReactTestRenderer.act(() => {
    tree = ReactTestRenderer.create(<SafeAreaProvider initialMetrics={METRICS}>{element}</SafeAreaProvider>);
  });
  await flush();
  mounted.push(tree);
  return tree;
};

const pressLabel = async (tree: Tree, label: string | RegExp) => {
  const target = tree.root.findAll(
    n =>
      typeof n.type !== 'string' &&
      typeof n.props.onPress === 'function' &&
      typeof n.props.accessibilityLabel === 'string' &&
      (typeof label === 'string' ? n.props.accessibilityLabel === label : label.test(n.props.accessibilityLabel)),
  )[0];
  if (!target) throw new Error(`nothing pressable labelled ${label}`);
  await ReactTestRenderer.act(async () => {
    await target.props.onPress();
  });
  await flush();
};

beforeEach(() => {
  (api.fetchDailyHoroscope as jest.Mock).mockClear();
});

afterEach(async () => {
  await ReactTestRenderer.act(() => {
    mounted.splice(0).forEach(tree => tree.unmount());
  });
  jest.restoreAllMocks();
});

test('the Home card hands the reading the rashi it already worked out', async () => {
  const onOpenHoroscope = jest.fn();
  const tree = await render(<HomeScreen onOpenHoroscope={onOpenHoroscope} />);

  await pressLabel(tree, /^Daily Horoscope/);

  /** Home knows the sign from its own request — the reading must not look it up again. */
  expect(onOpenHoroscope).toHaveBeenCalledWith('Leo');
});

test('the reading shows the whole of what the card is cut down from', async () => {
  const tree = await render(<DailyHoroscopeScreen sign="Leo" />);

  expect(api.fetchDailyHoroscope).toHaveBeenCalledWith('Leo');

  const text = textOf(tree);
  /** The day in one line, and the three highlights the card shows. */
  expect(text).toContain('A steady day that rewards patience.');
  expect(text).toContain('Lucky Number');
  expect(text).toContain('7');
  expect(text).toContain('Gold');
  expect(text).toContain('High');

  /** And the five areas that came back with something in them. */
  expect(text).toContain('Emotions');
  expect(text).toContain('You feel lighter than yesterday.');
  expect(text).toContain('Work & Money');
  expect(text).toContain('A senior notices work you did quietly.');
  expect(text).toContain('Health');
  expect(text).toContain('Luck');

  /** The sixth came back empty, so it is not drawn as a blank card. */
  expect(text).not.toContain('Journeys and movement');
});

test('today only — no other day is offered, and none is asked for', async () => {
  const tree = await render(<DailyHoroscopeScreen sign="Leo" />);

  /** Loose on the month's short form — ICU says "Sep" on some platforms and "Sept" on others. */
  expect(textOf(tree)).toMatch(/23 Sept? 2026/);
  expect(textOf(tree)).toContain('one new reading a day');

  for (const other of ['Yesterday', 'Tomorrow']) {
    expect(tree.root.findAll(n => n.props.accessibilityLabel === other)).toHaveLength(0);
    expect(textOf(tree)).not.toContain(other);
  }

  /** One request, for today, with no day argument behind it. */
  expect(api.fetchDailyHoroscope).toHaveBeenCalledTimes(1);
  expect((api.fetchDailyHoroscope as jest.Mock).mock.calls[0]).toEqual(['Leo']);
});

test('with no rashi yet it says why, and asks for nothing from the server', async () => {
  const tree = await render(<DailyHoroscopeScreen />);

  expect(api.fetchDailyHoroscope).not.toHaveBeenCalled();
  const text = textOf(tree);
  expect(text).toContain('Your rashi is on its way');
  expect(text).toContain('birth details');
});

test('a reading that fails to load says so, and offers another go', async () => {
  (api.fetchDailyHoroscope as jest.Mock).mockRejectedValueOnce(new Error('You are offline.'));
  const tree = await render(<DailyHoroscopeScreen sign="Leo" />);

  const text = textOf(tree);
  expect(text).toContain('Could not load the reading');
  expect(text).toContain('You are offline.');

  /** Retrying asks again rather than leaving the seeker stuck on the message. */
  await pressLabel(tree, 'Try again');
  expect((api.fetchDailyHoroscope as jest.Mock).mock.calls.length).toBeGreaterThan(1);
  expect(textOf(tree)).toContain('A steady day that rewards patience.');
});
