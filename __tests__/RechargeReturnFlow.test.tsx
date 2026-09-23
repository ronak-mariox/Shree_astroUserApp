/**
 * The whole App, driven the way a seeker taps through it:
 *
 *   Consult tab → "Chat with …" → intake form → pick a package → not enough
 *   balance → "Recharge Wallet" → Add Money → Pay → success →
 *   "Continue with …" → back on the SAME intake form, answers and package
 *   still filled in, ready to connect.
 *
 * Also: backing out of Add Money from that flow returns to the form, and an
 * ordinary wallet top-up still ends on Wallet / Home as before.
 */
import React from 'react';
import ReactTestRenderer from 'react-test-renderer';

import App from '../App';
import { AppDialog } from '../src/components/AppDialog';
import { OptionPickerDialog } from '../src/components/OptionPickerDialog';
import { ChatIntakeScreen } from '../src/screens/ChatIntakeScreen';
import * as api from '../src/services/api';
import { ApiError } from '../src/services/client';
import { clearSession, saveSession } from '../src/services/session';

/**
 * App.tsx mounts its own SafeAreaProvider, which renders nothing in a test
 * run until it's handed a frame — give it the same fixed phone frame every
 * screen test uses.
 */
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
    for (let i = 0; i < 10; i += 1) await Promise.resolve();
  });
};

/** Presses whatever pressable carries this accessibility label. */
const pressLabel = async (tree: Tree, label: string | RegExp) => {
  const matches = tree.root.findAll(
    n =>
      typeof n.type !== 'string' &&
      typeof n.props.onPress === 'function' &&
      typeof n.props.accessibilityLabel === 'string' &&
      (typeof label === 'string' ? n.props.accessibilityLabel === label : label.test(n.props.accessibilityLabel)),
  );
  if (matches.length === 0) {
    const labels = tree.root
      .findAll(n => typeof n.props.onPress === 'function' && typeof n.props.accessibilityLabel === 'string')
      .map(n => n.props.accessibilityLabel);
    throw new Error(`Nothing pressable labelled ${label}. On screen: ${[...new Set(labels)].join(' | ')}`);
  }
  await ReactTestRenderer.act(async () => {
    await matches[0].props.onPress();
  });
  await flush();
};

/** Presses the nearest pressable around a piece of visible text. */
const pressText = async (tree: Tree, text: string) => {
  const joined = (children: unknown) => (Array.isArray(children) ? children.join('') : children);
  const node = tree.root.findAll(n => typeof n.type === 'string' && joined(n.props.children) === text)[0];
  if (!node) throw new Error(`No text "${text}" on screen`);
  let current: ReactTestRenderer.ReactTestInstance | null = node;
  while (current && typeof current.props.onPress !== 'function') current = current.parent;
  if (!current) throw new Error(`"${text}" is not pressable`);
  const target = current;
  await ReactTestRenderer.act(async () => {
    await target.props.onPress();
  });
  await flush();
};

/**
 * The app's own dialog, in place of the OS alert these flows used to raise —
 * read and pressed the way a finger does, by what is on screen.
 */
const dialogText = (tree: Tree) => {
  const sheet = tree.root.findAllByType(AppDialog)[0];
  return sheet?.props.request ? `${sheet.props.request.title} ${sheet.props.request.message ?? ''}` : '';
};
const pressDialogButton = async (tree: Tree, label: string) => {
  await pressLabel(tree, label);
};

const intake = (tree: Tree) => tree.root.findByType(ChatIntakeScreen);

let tree: Tree;

beforeEach(async () => {
  await saveSession({
    accessToken: 'test-access',
    refreshToken: 'test-refresh',
    user: { id: 'u-1', name: 'Arjun Sharma', email: 'arjun@example.com', phone: '9876543210' } as never,
  });
  await ReactTestRenderer.act(async () => {
    tree = ReactTestRenderer.create(<App />);
  });
  /** Restoring the session from the keystore settles over a few ticks — wait for the signed-in shell's tab bar. */
  for (let i = 0; i < 40; i += 1) {
    await flush();
    const tabs = tree.root.findAll(n => typeof n.props.onPress === 'function' && n.props.accessibilityLabel === 'Consult');
    if (tabs.length > 0) break;
    await ReactTestRenderer.act(async () => {
      await new Promise<void>(resolve => setTimeout(() => resolve(), 50));
    });
  }
});

afterEach(async () => {
  await ReactTestRenderer.act(() => {
    tree.unmount();
  });
  await clearSession();
  jest.restoreAllMocks();
});

/** Consult tab → Chat → the intake form, filled in, 5-minute package picked, Connect pressed while the wallet is short. */
async function reachIntakeAndBePoor() {
  await pressLabel(tree, 'Consult');
  await pressLabel(tree, /^Chat with /);
  expect(tree.root.findAllByType(ChatIntakeScreen)).toHaveLength(1);

  const birthPlace = tree.root.findAll(n => typeof n.type === 'string' && n.props.accessibilityLabel === 'Birth Place')[0];
  await ReactTestRenderer.act(() => {
    birthPlace.props.onChangeText('Noida');
  });
  await pressLabel(tree, 'Topic of concern');
  const topicDialog = tree.root.findAllByType(OptionPickerDialog).filter(d => d.props.visible)[0];
  await ReactTestRenderer.act(() => {
    topicDialog.props.onSubmit('Career & Job');
  });
  await pressLabel(tree, '5 min package, ₹100');
  expect(textOf(tree)).toContain('Total ₹100');

  jest.spyOn(api, 'requestChat').mockRejectedValueOnce(
    new ApiError('Not enough balance.', 400, undefined, 'insufficient_balance', undefined, {
      packageMinutes: 5, price: 100, balance: 60, shortfallAmount: 40,
    }),
  );
  await pressLabel(tree, /^Connect With /);
  expect(dialogText(tree)).toContain('Insufficient Balance');
  expect(dialogText(tree)).toContain('You need ₹40 more');
}

test('recharging from the intake form comes back to the same form, answers and package intact', async () => {
  await reachIntakeAndBePoor();

  await pressDialogButton(tree, 'Recharge Wallet');
  await flush();
  // Add Money, pre-filled with exactly what was missing.
  expect(textOf(tree)).toContain('Proceed to Pay ₹40');

  await pressText(tree, 'Proceed to Pay ₹40');
  expect(textOf(tree)).toContain('Pay ₹40 Securely');
  await pressText(tree, 'Pay ₹40 Securely');

  // The processing interstitial dwells ~2s before confirming the top-up.
  await ReactTestRenderer.act(async () => {
    await new Promise<void>(resolve => setTimeout(() => resolve(), 2300));
  });
  await flush();
  expect(textOf(tree)).toContain('Payment Successful!');
  expect(textOf(tree)).toContain('Continue with Pt. Rajesh Sharma');

  await pressText(tree, 'Continue with Pt. Rajesh Sharma');

  // Back on the intake form — not Home, not Wallet — with everything still there.
  expect(tree.root.findAllByType(ChatIntakeScreen)).toHaveLength(1);
  expect(textOf(tree)).not.toContain('Payment Successful!');
  const birthPlace = tree.root.findAll(n => typeof n.type === 'string' && n.props.accessibilityLabel === 'Birth Place')[0];
  expect(birthPlace.props.value).toBe('Noida');
  expect(textOf(tree)).toContain('Career & Job');
  expect(textOf(tree)).toContain('Total ₹100');
  expect(textOf(tree)).toContain('Pay ₹100 & Connect With Pt. Rajesh Sharma');

  // And now connecting goes through.
  const request = jest.spyOn(api, 'requestChat');
  await pressLabel(tree, /^Connect With /);
  expect(request).toHaveBeenCalledWith(
    expect.any(String),
    expect.objectContaining({ topic: 'career-job' }),
    'chat',
    { mode: 'package', packageMinutes: 5, quotedPrice: 100 },
  );
});

test('backing out of Add Money from the chat flow returns to the form, not the wallet', async () => {
  await reachIntakeAndBePoor();
  await pressDialogButton(tree, 'Recharge Wallet');
  await flush();
  expect(textOf(tree)).toContain('Proceed to Pay ₹40');

  await pressLabel(tree, /back/i);
  expect(tree.root.findAllByType(ChatIntakeScreen)).toHaveLength(1);
  expect(intake(tree).props.draft).toEqual(expect.objectContaining({ birthPlace: 'Noida', topic: 'Career & Job' }));
  expect(textOf(tree)).toContain('Total ₹100');
});

test('an ordinary wallet top-up still ends on the usual Wallet / Home choices', async () => {
  await pressLabel(tree, 'Wallet');
  await pressText(tree, '+ Add Money').catch(async () => {
    await pressLabel(tree, /add money/i);
  });
  await flush();
  const proceed = tree.root.findAll(n => typeof n.type === 'string' && typeof n.props.children === 'string' && n.props.children.startsWith('Proceed to Pay'))[0];
  await pressText(tree, proceed.props.children);
  const pay = tree.root.findAll(n => typeof n.type === 'string' && Array.isArray(n.props.children) && n.props.children.join('').endsWith('Securely'))[0];
  let target: ReactTestRenderer.ReactTestInstance | null = pay;
  while (target && typeof target.props.onPress !== 'function') target = target.parent;
  await ReactTestRenderer.act(async () => {
    await target!.props.onPress();
  });
  await ReactTestRenderer.act(async () => {
    await new Promise<void>(resolve => setTimeout(() => resolve(), 2300));
  });
  await flush();
  expect(textOf(tree)).toContain('Payment Successful!');
  expect(textOf(tree)).toContain('Go to Wallet');
  expect(textOf(tree)).toContain('Back to Home');
  expect(textOf(tree)).not.toContain('Continue with');
});
