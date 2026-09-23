/**
 * "This consultant is busy for about N min" — the estimated wait a seeker
 * sees on an astrologer who is already in a consultation, and nothing at all
 * when they are free.
 *
 * The number itself comes from the server (GET /astrologers' `waitSeconds`,
 * backend services/astrologer.service.js); these are the words the apps put
 * around it.
 */
import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { AstrologerBusyDialog } from '../src/components/AstrologerBusyDialog';
import { AvailableAstrologersScreen } from '../src/screens/AvailableAstrologersScreen';
import { FindAstrologersScreen } from '../src/screens/FindAstrologersScreen';
import { busyForLabel, waitLabel, waitMinutes } from '../src/data/availability';
import * as api from '../src/services/api';

const METRICS = { frame: { x: 0, y: 0, width: 390, height: 844 }, insets: { top: 47, left: 0, right: 0, bottom: 34 } };

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
  mounted.push(tree);
  await ReactTestRenderer.act(async () => {
    for (let i = 0; i < 5; i += 1) await Promise.resolve();
  });
  return tree;
};

afterEach(async () => {
  await ReactTestRenderer.act(() => {
    mounted.splice(0).forEach(tree => tree.unmount());
  });
  jest.restoreAllMocks();
});

/** One busy astrologer (≈7 min left) and one free, as the directory returns them. */
const directory = () => ({
  items: [
    {
      id: 'a-busy', name: 'Pt. Rajesh Sharma', photo: undefined, online: true, busy: true, waitSeconds: 400,
      expertise: ['vedic'], languages: ['hindi'], topics: ['career-job'], experienceYears: 18, consultations: 4820, badges: [],
      rates: { chat: { was: 20, now: 20 }, call: { was: 30, now: 30 } },
    },
    {
      id: 'a-free', name: 'Kavita Joshi', photo: undefined, online: true, busy: false, waitSeconds: 0,
      expertise: ['tarot'], languages: ['english'], topics: ['marriage'], experienceYears: 9, consultations: 3210, badges: [],
      rates: { chat: { was: 15, now: 15 }, call: { was: 25, now: 25 } },
    },
  ],
  total: 2,
});

describe('wait wording', () => {
  test('rounds up to whole minutes and marks the number as an estimate', () => {
    expect(waitMinutes({ busy: true, waitSeconds: 400 })).toBe(7);
    expect(waitLabel({ busy: true, waitSeconds: 400 })).toBe('Wait ~7 min');
    expect(waitLabel({ busy: true, waitSeconds: 400 }, 'Min')).toBe('Wait ~7 Min');
    expect(busyForLabel({ busy: true, waitSeconds: 400 })).toBe('busy for about 7 min');
  });

  test('a few seconds still reads as a minute — never "0 min"', () => {
    expect(waitLabel({ busy: true, waitSeconds: 4 })).toBe('Wait ~1 min');
  });

  test('a free consultant has no wait at all', () => {
    expect(waitMinutes({ busy: false, waitSeconds: 0 })).toBe(0);
    expect(waitLabel({ busy: false, waitSeconds: 0 })).toBeUndefined();
    // Busy flag without an estimate (an older server) also stays quiet rather than guessing.
    expect(waitLabel({ busy: true })).toBeUndefined();
    // An estimate left over on a freed astrologer is ignored.
    expect(waitLabel({ busy: false, waitSeconds: 400 })).toBeUndefined();
    expect(busyForLabel({ busy: false, waitSeconds: 0 })).toBeUndefined();
  });
});

describe('the consult list', () => {
  test('shows the estimate on a busy consultant and nothing on a free one', async () => {
    jest.spyOn(api, 'fetchAstrologers').mockImplementation(async () => directory() as never);
    const tree = await render(<AvailableAstrologersScreen />);
    const text = textOf(tree);
    expect(text).toContain('Pt. Rajesh Sharma');
    expect(text).toContain('Wait ~7 min');
    expect(text).toContain('Kavita Joshi');
    // Only the busy one carries a wait.
    expect(text.match(/Wait ~/g)).toHaveLength(1);
  });

  test('the estimate travels with the astrologer that "Chat" hands over', async () => {
    jest.spyOn(api, 'fetchAstrologers').mockImplementation(async () => directory() as never);
    const onConsult = jest.fn();
    const tree = await render(<AvailableAstrologersScreen onConsult={onConsult} />);
    const chat = tree.root.findAll(
      n => typeof n.type !== 'string' && typeof n.props.onPress === 'function'
        && /Chat with Pt. Rajesh Sharma/.test(String(n.props.accessibilityLabel)),
    )[0];
    await ReactTestRenderer.act(() => {
      chat.props.onPress();
    });
    expect(onConsult).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'Pt. Rajesh Sharma', wait: 'Wait ~7 min', waitSeconds: 400 }),
      'chat',
    );
  });
});

describe('find astrologers', () => {
  test('busy consultants carry the estimate there too', async () => {
    jest.spyOn(api, 'fetchAstrologers').mockImplementation(async () => directory() as never);
    const tree = await render(<FindAstrologersScreen />);
    const text = textOf(tree);
    expect(text).toContain('Wait ~7 min');
    expect(text.match(/Wait ~/g)).toHaveLength(1);
  });
});

describe('the busy sheet', () => {
  test('says how long, and that it is only an estimate', async () => {
    const tree = await render(
      <AstrologerBusyDialog
        visible
        name="Pt. Rajesh Sharma"
        busyFor={busyForLabel({ busy: true, waitSeconds: 400 })}
        onWait={() => {}}
        onChooseOthers={() => {}}
        onDismiss={() => {}}
      />,
    );
    const text = textOf(tree);
    expect(text).toContain('Pt. Rajesh Sharma');
    expect(text).toContain('busy for about 7 min');
    expect(text).toContain('Estimated — it may free up sooner or later.');
    expect(text).toContain('Yes, Wait');
  });

  test('without an estimate it reads as before', async () => {
    const tree = await render(
      <AstrologerBusyDialog visible name="Pt. Rajesh Sharma" onWait={() => {}} onChooseOthers={() => {}} onDismiss={() => {}} />,
    );
    const text = textOf(tree);
    expect(text).toContain('is busy with other customer.');
    expect(text).not.toContain('Estimated —');
  });
});
