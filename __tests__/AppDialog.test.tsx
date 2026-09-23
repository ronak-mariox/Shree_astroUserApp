/**
 * The app's own dialog, which replaced `Alert.alert` everywhere a seeker can see
 * one.
 *
 * Those were native OS boxes — the platform's grey card, type and buttons — in
 * the middle of an app that draws yellow sheets with gradient actions. The words
 * were right and the thing looked borrowed, worst of all on the message that
 * matters most: being told the wallet is short in the middle of booking.
 */
import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { AppDialog, type DialogRequest } from '../src/components/AppDialog';

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

const mounted: Tree[] = [];

const render = async (request: DialogRequest | undefined, onDismiss = jest.fn()) => {
  let tree!: Tree;
  await ReactTestRenderer.act(() => {
    tree = ReactTestRenderer.create(
      <SafeAreaProvider initialMetrics={METRICS}>
        <AppDialog request={request} onDismiss={onDismiss} />
      </SafeAreaProvider>,
    );
  });
  mounted.push(tree);
  return { tree, onDismiss };
};

const press = async (tree: Tree, label: string) => {
  const target = tree.root.findAll(
    n => typeof n.type !== 'string' && typeof n.props.onPress === 'function' && n.props.accessibilityLabel === label,
  )[0];
  if (!target) throw new Error(`nothing pressable labelled "${label}"`);
  await ReactTestRenderer.act(async () => {
    await target.props.onPress();
  });
};

afterEach(async () => {
  await ReactTestRenderer.act(() => {
    mounted.splice(0).forEach(tree => tree.unmount());
  });
});

test('nothing to say, nothing on screen', async () => {
  const { tree } = await render(undefined);
  expect(tree.root.findAllByType(require('react-native').Modal)[0].props.visible).toBe(false);
});

test('a message shows its title and body', async () => {
  const { tree } = await render({
    title: 'Insufficient Balance',
    message: 'You need ₹40 more in your wallet.',
    tone: 'wallet',
  });

  const text = textOf(tree);
  expect(text).toContain('Insufficient Balance');
  expect(text).toContain('You need ₹40 more in your wallet.');
});

test('with no actions given it offers one way out', async () => {
  const { tree, onDismiss } = await render({ title: 'Payment failed', message: 'Try again.' });

  await press(tree, 'OK');
  expect(onDismiss).toHaveBeenCalled();
});

test('two actions: the one that acts, and the way out', async () => {
  const recharge = jest.fn();
  const { tree, onDismiss } = await render({
    title: 'Insufficient Balance',
    tone: 'wallet',
    actions: [
      { label: 'Cancel', variant: 'secondary' },
      { label: 'Recharge Wallet', onPress: recharge },
    ],
  });

  await press(tree, 'Recharge Wallet');
  expect(recharge).toHaveBeenCalledTimes(1);
  /**
   * Closed before the handler runs, so a handler that opens the next screen
   * does not leave this sitting on top of it.
   */
  expect(onDismiss).toHaveBeenCalled();

  await press(tree, 'Cancel');
  expect(recharge).toHaveBeenCalledTimes(1);
});

test('tapping outside closes an ordinary message', async () => {
  const { tree, onDismiss } = await render({ title: 'No answer', message: 'They did not respond in time.' });

  await press(tree, 'Close No answer');
  expect(onDismiss).toHaveBeenCalled();
});

test('a message that must be answered cannot be tapped away', async () => {
  const { tree, onDismiss } = await render({
    title: 'Price updated',
    message: 'The package now costs ₹120.',
    dismissable: false,
    actions: [{ label: 'Cancel', variant: 'secondary' }, { label: 'Pay ₹120' }],
  });

  const scrim = tree.root.findAll(n => n.props.accessibilityLabel === 'Close Price updated')[0];
  expect(scrim.props.onPress).toBeUndefined();
  expect(onDismiss).not.toHaveBeenCalled();
});

test('it is the app drawing it, not the OS', async () => {
  const { tree } = await render({ title: 'Could not start chat', message: 'Something went wrong.' });

  /** The brand gradient behind the primary action is the tell. */
  const { BrandGradient } = require('../src/components/BrandGradient');
  expect(tree.root.findAllByType(BrandGradient).length).toBeGreaterThan(0);
  /** And the sheet sits at the bottom of the stage, as every other dialog in the app does. */
  expect(tree.root.findAllByType(require('react-native').Modal)[0].props.animationType).toBe('slide');
});
