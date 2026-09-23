/**
 * Leaving a live consultation, on the seeker's side.
 *
 * Android's back button used to be unclaimed by this screen, so pressing it did
 * what an unhandled back does — left the app, mid-consultation, with the meter
 * running and nothing recorded about whether that was meant. It asks now,
 * exactly as the header's red cross does.
 *
 * Closing or killing the app is handled on the server instead (the socket drops
 * and the session ends after a short grace rather than billing an app that is
 * gone) — see the backend's tests/user-disconnect.test.js.
 */
import React from 'react';
import { BackHandler } from 'react-native';
import ReactTestRenderer from 'react-test-renderer';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { EndChatDialog } from '../src/components/AstrologerBusyDialog';
import { ChatEndedDialog } from '../src/components/ChatEndedDialog';
import { ConsultationChatScreen } from '../src/screens/ConsultationChatScreen';
import * as api from '../src/services/api';
import { fireEnded } from './helpers/apiMock';

const METRICS = {
  frame: { x: 0, y: 0, width: 390, height: 844 },
  insets: { top: 47, left: 0, right: 0, bottom: 34 },
};

type Tree = ReactTestRenderer.ReactTestRenderer;

const flush = async () => {
  await ReactTestRenderer.act(async () => {
    for (let i = 0; i < 5; i += 1) await Promise.resolve();
  });
};

const mounted: Tree[] = [];

/** Whatever the screen registered for the hardware back button. */
let onHardwareBack: (() => boolean) | undefined;

const render = async (element: React.ReactElement) => {
  let tree!: Tree;
  await ReactTestRenderer.act(() => {
    tree = ReactTestRenderer.create(<SafeAreaProvider initialMetrics={METRICS}>{element}</SafeAreaProvider>);
  });
  mounted.push(tree);
  await flush();
  return tree;
};

/** Presses Android's back button, and answers whether the screen claimed it. */
const pressBack = async () => {
  if (!onHardwareBack) throw new Error('the screen never registered a back handler');
  let handled = false;
  await ReactTestRenderer.act(async () => {
    handled = onHardwareBack!();
  });
  await flush();
  return handled;
};

const dialog = (tree: Tree) => tree.root.findByType(EndChatDialog);

beforeEach(() => {
  onHardwareBack = undefined;
  /**
   * Captured rather than fired through react-native's own mock, so the test
   * presses exactly what this screen registered and nothing else.
   */
  jest.spyOn(BackHandler, 'addEventListener').mockImplementation(((event: string, handler: () => boolean) => {
    if (event === 'hardwareBackPress') onHardwareBack = handler;
    return { remove: () => {} };
  }) as never);
});

afterEach(async () => {
  await ReactTestRenderer.act(async () => {
    mounted.forEach(tree => tree.unmount());
  });
  mounted.length = 0;
  jest.restoreAllMocks();
});

test('back during a live consultation asks, and does not end anything by itself', async () => {
  const end = jest.spyOn(api, 'endChat');
  const tree = await render(<ConsultationChatScreen chatId="chat-1" astrologerName="Astro Rakesh" />);
  expect(dialog(tree).props.visible).toBe(false);

  const handled = await pressBack();
  expect(handled).toBe(true); // the screen keeps the press — the app does not close
  expect(dialog(tree).props.visible).toBe(true);
  expect(end).not.toHaveBeenCalled();
});

test('...and confirming it ends the consultation', async () => {
  const end = jest.spyOn(api, 'endChat');
  const tree = await render(<ConsultationChatScreen chatId="chat-1" astrologerName="Astro Rakesh" />);

  await pressBack();
  await ReactTestRenderer.act(async () => {
    await dialog(tree).props.onEndChat();
  });
  await flush();

  expect(end).toHaveBeenCalledWith('chat-1', 'user_ended');
  expect(dialog(tree).props.visible).toBe(false);
});

test('...or staying keeps the consultation running', async () => {
  const end = jest.spyOn(api, 'endChat');
  const tree = await render(<ConsultationChatScreen chatId="chat-1" astrologerName="Astro Rakesh" />);

  await pressBack();
  await ReactTestRenderer.act(() => {
    dialog(tree).props.onStay();
  });
  await flush();

  expect(dialog(tree).props.visible).toBe(false);
  expect(end).not.toHaveBeenCalled();
});

test('back again while it is asking backs out of the question, not the consultation', async () => {
  const end = jest.spyOn(api, 'endChat');
  const tree = await render(<ConsultationChatScreen chatId="chat-1" astrologerName="Astro Rakesh" />);

  await pressBack();
  expect(dialog(tree).props.visible).toBe(true);

  const handled = await pressBack();
  expect(handled).toBe(true);
  expect(dialog(tree).props.visible).toBe(false);
  expect(end).not.toHaveBeenCalled();
});

test('once the consultation is over, back leaves the chat instead of the app', async () => {
  const onEnd = jest.fn();
  const tree = await render(
    <ConsultationChatScreen chatId="chat-1" astrologerName="Astro Rakesh" onEnd={onEnd} />,
  );

  /** The session ends from the server's side — the astrologer, or the meter. */
  await ReactTestRenderer.act(async () => {
    fireEnded({ reason: 'astrologer_ended' });
  });
  await flush();
  expect(tree.root.findByType(ChatEndedDialog).props.visible).toBe(true);

  const handled = await pressBack();
  expect(handled).toBe(true);
  expect(onEnd).toHaveBeenCalled();
  /** And it does not re-ask about ending something already ended. */
  expect(dialog(tree).props.visible).toBe(false);
});
