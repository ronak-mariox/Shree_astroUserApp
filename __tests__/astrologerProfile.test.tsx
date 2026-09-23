/**
 * An astrologer's profile screen: the minute tiles, and the header's kebab.
 *
 * The tiles read the astrologer's real consulted minutes (the backend's
 * metrics.chatMinutes / metrics.callMinutes, which every ended consultation adds
 * to). They used to be printed as `Math.round(minutes / 1000)` with a hardcoded
 * "K", so every astrologer actually on the platform read "0K Mins" — 88 minutes
 * of consultations rounds to zero thousand. Only the seeded fixtures, with their
 * tens of thousands, ever looked right.
 */
import React from 'react';
import { Share } from 'react-native';
import ReactTestRenderer from 'react-test-renderer';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { AppDialog } from '../src/components/AppDialog';
import { MoreOptionsSheet } from '../src/components/MoreOptionsSheet';
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

/**
 * The kebab in the profile header. It used to open a "Coming Soon" screen
 * promising sharing, reporting and blocking; these two do the real thing now.
 * Blocking is still not offered, because nothing on the server can block an
 * astrologer for one seeker — an option that quietly does nothing would be
 * worse than one that isn't there.
 */
describe('the header\'s More Options', () => {
  const openMenu = async (tree: ReactTestRenderer.ReactTestRenderer) => {
    const kebab = tree.root.findAll(
      n => typeof n.type !== 'string' && typeof n.props.onPress === 'function' && n.props.accessibilityLabel === 'More options',
    )[0];
    await ReactTestRenderer.act(async () => {
      await kebab.props.onPress();
    });
  };

  /** The sheet currently on screen, of the two the header can open. */
  const openSheet = (tree: ReactTestRenderer.ReactTestRenderer) =>
    tree.root.findAllByType(MoreOptionsSheet).filter(d => d.props.visible)[0];

  /** Taps the row itself — a menu acts on the first tap, with no Submit to press. */
  const choose = async (tree: ReactTestRenderer.ReactTestRenderer, option: string) => {
    const row = openSheet(tree).findAll(
      n => typeof n.type !== 'string' && typeof n.props.onPress === 'function' && n.props.accessibilityLabel === option,
    )[0];
    if (!row) throw new Error(`no "${option}" row on the open sheet`);
    await ReactTestRenderer.act(async () => {
      await row.props.onPress();
    });
    await ReactTestRenderer.act(async () => {
      for (let i = 0; i < 5; i += 1) await Promise.resolve();
    });
  };

  const detailScreen = () => (
    <AstrologerDetailScreen astrologer={{ id: 'a-rajesh', name: 'Pt. Rajesh Sharma' } as never} />
  );

  test('offers only what actually works', async () => {
    const tree = await render(detailScreen());
    await openMenu(tree);

    expect(openSheet(tree).props.title).toBe('More Options');
    expect(openSheet(tree).props.options.map((o: { label: string }) => o.label)).toEqual([
      'Share Profile',
      'Report Astrologer',
    ]);
    /** Each row says what pressing it does, rather than leaving it to be guessed. */
    expect(textOf(tree)).toContain('Send this astrologer to a friend');
    expect(textOf(tree)).toContain('Tell our team about a problem');
    /** What it used to do instead. */
    expect(textOf(tree)).not.toContain('Coming Soon');
  });

  test('a caller can take the kebab over, and then nothing opens in place', async () => {
    const onMoreOptions = jest.fn();
    const tree = await render(
      <AstrologerDetailScreen
        astrologer={{ id: 'a-rajesh', name: 'Pt. Rajesh Sharma' } as never}
        onMoreOptions={onMoreOptions}
      />,
    );

    await openMenu(tree);

    expect(onMoreOptions).toHaveBeenCalledTimes(1);
    /** Its own sheet stays shut — the caller decided what happens instead. */
    expect(tree.root.findAllByType(MoreOptionsSheet).filter(d => d.props.visible)).toHaveLength(0);
  });

  test('one tap is enough — a menu has nothing to confirm', async () => {
    const tree = await render(detailScreen());
    await openMenu(tree);

    const sheet = openSheet(tree);
    /** The form-field vocabulary — pick, then Submit — does not belong on a menu. */
    expect(
      sheet.findAll(n => typeof n.props.accessibilityLabel === 'string' && n.props.accessibilityLabel === 'Submit'),
    ).toHaveLength(0);
    /** Backing out is still one tap away. */
    expect(sheet.findAll(n => n.props.accessibilityLabel === 'Cancel').length).toBeGreaterThan(0);
  });

  test('Share Profile hands the profile to the phone', async () => {
    const share = jest.spyOn(Share, 'share').mockResolvedValue({ action: 'sharedAction' } as never);
    const tree = await render(detailScreen());

    await openMenu(tree);
    await choose(tree, 'Share Profile');

    expect(share).toHaveBeenCalledTimes(1);
    const message = (share.mock.calls[0][0] as { message: string }).message;
    expect(message).toContain('Pt. Rajesh Sharma');
    expect(message).toContain('Shree Astro');
    /** No link: there is no page for an astrologer, and a dead URL is worse than none. */
    expect(message).not.toMatch(/https?:\/\//);
  });

  /** What the app's own dialog is currently saying, if anything. */
  const dialogText = (tree: ReactTestRenderer.ReactTestRenderer) => {
    const shown = tree.root.findAllByType(AppDialog)[0]?.props.request;
    return shown ? `${shown.title} ${shown.message ?? ''}` : '';
  };

  test('Report Astrologer asks what happened, then files it as a dispute', async () => {
    (api.raiseTicket as jest.Mock).mockClear();
    const tree = await render(detailScreen());

    await openMenu(tree);
    await choose(tree, 'Report Astrologer');

    /** A second sheet, naming who is being reported. */
    expect(openSheet(tree).props.title).toBe('What went wrong?');
    expect(textOf(tree)).toContain('Reporting Pt. Rajesh Sharma');
    expect(openSheet(tree).props.options.map((o: { label: string }) => o.label)).toContain(
      'Asked for payment outside the app',
    );

    await choose(tree, 'Rude or inappropriate behaviour');

    expect(api.raiseTicket).toHaveBeenCalledTimes(1);
    const [issueType, description] = (api.raiseTicket as jest.Mock).mock.calls[0];
    /** The category the admin panel's Disputes tab groups it under. */
    expect(issueType).toBe('astrologer');
    /** The ticket has no astrologer field, so who it is about has to be in the words. */
    expect(description).toContain('Rude or inappropriate behaviour');
    expect(description).toContain('Pt. Rajesh Sharma');
    expect(description).toContain('a-rajesh');

    /** Confirmed in the app's own dialog, not an OS alert box. */
    expect(dialogText(tree)).toContain('Report sent');
    expect(dialogText(tree)).toContain('look into it');
    /** And the sheets are done with. */
    expect(tree.root.findAllByType(MoreOptionsSheet).filter(d => d.props.visible)).toHaveLength(0);
  });

  test('a report that fails to send says so, rather than pretending', async () => {
    (api.raiseTicket as jest.Mock).mockRejectedValueOnce(new Error('You are offline.'));
    const tree = await render(detailScreen());

    await openMenu(tree);
    await choose(tree, 'Report Astrologer');
    await choose(tree, 'Something else');

    expect(dialogText(tree)).toContain('Could not send the report');
    expect(dialogText(tree)).toContain('You are offline.');
  });

  test('backing out of the menu files nothing', async () => {
    (api.raiseTicket as jest.Mock).mockClear();
    const tree = await render(detailScreen());

    await openMenu(tree);
    await ReactTestRenderer.act(() => {
      openSheet(tree).props.onClose();
    });

    expect(tree.root.findAllByType(MoreOptionsSheet).filter(d => d.props.visible)).toHaveLength(0);
    expect(api.raiseTicket).not.toHaveBeenCalled();
  });
});
