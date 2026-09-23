/**
 * Where a signed-in seeker lands: the Consult tab (the astrologers they can
 * talk to), with that tab selected — not Home. The same screen however they
 * arrive: signing in, finishing sign-up, or reopening the app with a session
 * already saved.
 */
import React from 'react';
import ReactTestRenderer from 'react-test-renderer';

import App from '../App';
import { AvailableAstrologersScreen } from '../src/screens/AvailableAstrologersScreen';
import { EditProfileScreen } from '../src/screens/EditProfileScreen';
import { HomeScreen } from '../src/screens/HomeScreen';
import { LoginOptionsScreen } from '../src/screens/LoginOptionsScreen';
import { OtpLoginScreen } from '../src/screens/OtpLoginScreen';
import { WelcomeScreen } from '../src/screens/WelcomeScreen';
import { clearSession, saveSession } from '../src/services/session';

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

const flush = async () => {
  await ReactTestRenderer.act(async () => {
    for (let i = 0; i < 10; i += 1) await Promise.resolve();
  });
};

let tree: ReactTestRenderer.ReactTestRenderer;

const renderApp = async () => {
  await ReactTestRenderer.act(async () => {
    tree = ReactTestRenderer.create(<App />);
  });
  /** The keystore read settles over a few ticks before the shell decides where to go. */
  for (let i = 0; i < 40; i += 1) {
    await flush();
    if (tree.root.findAllByType(WelcomeScreen).length + tree.root.findAllByType(AvailableAstrologersScreen).length
      + tree.root.findAllByType(EditProfileScreen).length > 0) break;
    await ReactTestRenderer.act(async () => {
      await new Promise<void>(resolve => setTimeout(() => resolve(), 50));
    });
  }
  return tree;
};

const session = (profileComplete?: boolean) => ({
  accessToken: 'test-access',
  refreshToken: 'test-refresh',
  user: {
    id: 'u-1',
    name: 'Arjun Sharma',
    email: 'arjun@example.com',
    phone: '9876543210',
    ...(profileComplete === undefined ? {} : { profileComplete }),
  },
});

afterEach(async () => {
  await ReactTestRenderer.act(() => {
    tree.unmount();
  });
  await clearSession();
});

test('signing in lands on the Consult tab, with Consult selected', async () => {
  await renderApp();
  expect(tree.root.findAllByType(WelcomeScreen)).toHaveLength(1);

  await ReactTestRenderer.act(() => {
    tree.root.findByType(WelcomeScreen).props.onLogin();
  });
  await ReactTestRenderer.act(() => {
    tree.root.findByType(LoginOptionsScreen).props.onContinueWithOtp();
  });
  /** Verifying the code saves the session (services/auth) and then hands it up. */
  await ReactTestRenderer.act(async () => {
    await saveSession(session(true) as never);
    await tree.root.findByType(OtpLoginScreen).props.onVerified(session(true));
  });
  await flush();

  const consult = tree.root.findByType(AvailableAstrologersScreen);
  expect(consult.props.activeTab).toBe('consult');
  expect(tree.root.findAllByType(HomeScreen)).toHaveLength(0);
});

test('reopening the app with a saved session lands there too', async () => {
  await saveSession(session(true) as never);
  await renderApp();

  expect(tree.root.findByType(AvailableAstrologersScreen).props.activeTab).toBe('consult');
  expect(tree.root.findAllByType(HomeScreen)).toHaveLength(0);
});

test('a session saved before profileComplete existed is not treated as incomplete', async () => {
  await saveSession(session() as never);
  await renderApp();

  expect(tree.root.findAllByType(AvailableAstrologersScreen)).toHaveLength(1);
  expect(tree.root.findAllByType(EditProfileScreen)).toHaveLength(0);
});

test('an incomplete profile still goes to Edit Profile first (unchanged)', async () => {
  await saveSession(session(false) as never);
  await renderApp();

  expect(tree.root.findAllByType(EditProfileScreen)).toHaveLength(1);
  expect(tree.root.findAllByType(AvailableAstrologersScreen)).toHaveLength(0);
});

test('Home is still reachable from the tab bar', async () => {
  await saveSession(session(true) as never);
  await renderApp();

  const home = tree.root.findAll(
    n => typeof n.type !== 'string' && typeof n.props.onPress === 'function' && n.props.accessibilityLabel === 'Home',
  )[0];
  await ReactTestRenderer.act(async () => {
    await home.props.onPress();
  });
  await flush();
  expect(tree.root.findAllByType(HomeScreen)).toHaveLength(1);
});
