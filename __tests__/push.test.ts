/**
 * services/push.ts — getting this device's FCM token onto the signed-in
 * account, and handing pushes to whoever enabled it.
 *
 * Firebase is the stub in __tests__/helpers/firebaseMessagingMock.ts (a device
 * that grants permission and has a token, unless a test says otherwise) and
 * the server is services/api.ts's stub — so what is asserted here is what is
 * asked of each, and in which order. That the server files, moves and prunes
 * tokens correctly is the backend's own suite (tests/push-devices.test.js).
 *
 * push.ts keeps its state in the module (one token, one set of listeners), so
 * every test loads a fresh copy of it and of everything it talks to.
 *
 * The last block runs the real services/api.ts against a stubbed HTTP client,
 * for the request bodies the backend's contract names.
 */

type Push = typeof import('../src/services/push');
type MessagingMock = typeof import('./helpers/firebaseMessagingMock');
type ReactNative = typeof import('react-native');

/** Flipped by the "no native module" tests: the SDK then fails to load at all, as it does in a binary built before it was linked. */
let mockNativeModuleMissing = false;

jest.mock('@react-native-firebase/messaging', () => {
  if (mockNativeModuleMissing) {
    throw new Error("Invariant Violation: TurboModuleRegistry.getEnforcing(...): 'NativeRNFBTurboMessaging' could not be found.");
  }
  return require('./helpers/firebaseMessagingMock');
});

let push: Push;
let messaging: MessagingMock;
let api: { registerDevice: jest.Mock; unregisterDevice: jest.Mock };
let RN: ReactNative;

const load = () => {
  jest.resetModules();
  RN = require('react-native');
  api = require('../src/services/api');
  push = require('../src/services/push');
  if (!mockNativeModuleMissing) {
    messaging = require('@react-native-firebase/messaging');
  }
};

/** The phone this run pretends to be. Jest's React Native is an iPhone unless told otherwise. */
const onAndroid = (apiLevel: number, answer: 'granted' | 'denied' | 'never_ask_again' = 'granted') => {
  RN.Platform.OS = 'android';
  Object.defineProperty(RN.Platform, 'Version', { configurable: true, get: () => apiLevel });
  return jest.spyOn(RN.PermissionsAndroid, 'request').mockResolvedValue(answer);
};

/** What FCM hands the app for one of the server's notifications. */
const REMOTE_MESSAGE = {
  messageId: 'm-1',
  notification: { title: 'Wallet credited', body: '₹500 was added to your wallet.' },
  data: { notificationId: 'n-42', type: 'wallet_credit', action: '{"screen":"wallets"}' },
};

beforeEach(() => {
  mockNativeModuleMissing = false;
  load();
});

afterEach(() => {
  jest.restoreAllMocks();
  jest.useRealTimers();
});

describe('enablePush — permission and the token', () => {
  test('Android 13+: asks for POST_NOTIFICATIONS, and once granted files the token under the account', async () => {
    const ask = onAndroid(34);

    await push.enablePush();

    expect(ask).toHaveBeenCalledTimes(1);
    expect(ask).toHaveBeenCalledWith('android.permission.POST_NOTIFICATIONS');
    expect(api.registerDevice).toHaveBeenCalledTimes(1);
    expect(api.registerDevice).toHaveBeenCalledWith('fcm-token-1', 'android');
  });

  test('Android 12 and older need no prompt: the token is registered without asking anything', async () => {
    const ask = onAndroid(31);

    await push.enablePush();

    expect(ask).not.toHaveBeenCalled();
    expect(api.registerDevice).toHaveBeenCalledWith('fcm-token-1', 'android');
  });

  test.each(['denied', 'never_ask_again'] as const)(
    'Android permission %s: no token is fetched, nothing is registered, and it resolves quietly',
    async answer => {
      const ask = onAndroid(34, answer);
      const onForeground = jest.fn();

      await expect(push.enablePush({ onForeground })).resolves.toEqual(expect.any(Function));

      expect(messaging.getToken).not.toHaveBeenCalled();
      expect(api.registerDevice).not.toHaveBeenCalled();
      expect(messaging.__listenerCount('message')).toBe(0);

      /** No nagging: enabling again in the same run does not put the prompt back up. */
      await push.enablePush({ onForeground });
      expect(ask).toHaveBeenCalledTimes(1);
      expect(api.registerDevice).not.toHaveBeenCalled();
    },
  );

  test('iOS: asks through Firebase, and an authorised device is registered as ios', async () => {
    const ask = jest.spyOn(RN.PermissionsAndroid, 'request');

    await push.enablePush();

    expect(messaging.requestPermission).toHaveBeenCalledTimes(1);
    expect(ask).not.toHaveBeenCalled();
    expect(api.registerDevice).toHaveBeenCalledWith('fcm-token-1', 'ios');
  });

  test('iOS permission denied: nothing is registered', async () => {
    messaging.requestPermission.mockResolvedValue(messaging.AuthorizationStatus.DENIED);

    await push.enablePush();

    expect(messaging.getToken).not.toHaveBeenCalled();
    expect(api.registerDevice).not.toHaveBeenCalled();
  });

  test('a token refresh registers the new token; the same token again does not', async () => {
    await push.enablePush();
    expect(api.registerDevice).toHaveBeenCalledTimes(1);

    messaging.__emit('token', 'fcm-token-2');
    await Promise.resolve();
    expect(api.registerDevice).toHaveBeenCalledTimes(2);
    expect(api.registerDevice).toHaveBeenLastCalledWith('fcm-token-2', 'ios');

    await new Promise<void>(resolve => setImmediate(resolve));
    messaging.__emit('token', 'fcm-token-2');
    await Promise.resolve();
    expect(api.registerDevice).toHaveBeenCalledTimes(2);
  });

  test('a registration the server could not take is not an error, and is retried the next time push is enabled', async () => {
    api.registerDevice.mockRejectedValueOnce(new Error('Cannot reach the server.'));

    await expect(push.enablePush()).resolves.toEqual(expect.any(Function));
    expect(api.registerDevice).toHaveBeenCalledTimes(1);

    await push.enablePush();
    expect(api.registerDevice).toHaveBeenCalledTimes(2);
    expect(messaging.getToken).toHaveBeenCalledTimes(1);

    /** …and once it is through, it is not sent again. */
    await push.enablePush();
    expect(api.registerDevice).toHaveBeenCalledTimes(2);
  });
});

describe('enablePush — what arrives', () => {
  test('a push with the app open reaches onForeground with its title, body and data', async () => {
    const onForeground = jest.fn();
    await push.enablePush({ onForeground });

    messaging.__emit('message', REMOTE_MESSAGE);

    expect(onForeground).toHaveBeenCalledTimes(1);
    expect(onForeground).toHaveBeenCalledWith({
      title: 'Wallet credited',
      body: '₹500 was added to your wallet.',
      data: { notificationId: 'n-42', type: 'wallet_credit', action: '{"screen":"wallets"}' },
    });
  });

  test('data values are always strings, and a data-only message takes its title and body from the data', async () => {
    const onForeground = jest.fn();
    await push.enablePush({ onForeground });

    messaging.__emit('message', { data: { title: 'Hello', body: 'From data', action: { screen: 'wallet' } } });

    expect(onForeground).toHaveBeenCalledWith({
      title: 'Hello',
      body: 'From data',
      data: { title: 'Hello', body: 'From data', action: '{"screen":"wallet"}' },
    });
  });

  test('a notification tapped in the tray (app in the background) reaches onOpen with its data', async () => {
    const onOpen = jest.fn();
    const onForeground = jest.fn();
    await push.enablePush({ onForeground, onOpen });
    expect(onOpen).not.toHaveBeenCalled();

    messaging.__emit('opened', REMOTE_MESSAGE);

    expect(onOpen).toHaveBeenCalledTimes(1);
    expect(onOpen).toHaveBeenCalledWith(REMOTE_MESSAGE.data);
    expect(onForeground).not.toHaveBeenCalled();
  });

  test('a notification that launched the app (app not running) reaches onOpen once push is enabled', async () => {
    messaging.getInitialNotification.mockResolvedValue(REMOTE_MESSAGE);
    const onOpen = jest.fn();

    await push.enablePush({ onOpen });

    expect(onOpen).toHaveBeenCalledTimes(1);
    expect(onOpen).toHaveBeenCalledWith(REMOTE_MESSAGE.data);
  });
});

describe('pushActionOf — reading data.action', () => {
  test('a JSON action comes back as the object it describes', () => {
    expect(push.pushActionOf({ action: '{"screen":"wallets"}' })).toEqual({ screen: 'wallets' });
    expect(push.pushActionOf({ action: '{"screen":"chat","id":"chat-9"}' })).toEqual({ screen: 'chat', id: 'chat-9' });
  });

  test.each([
    ['the empty string the server sends for "no action"', { action: '' }],
    ['no action key at all', {}],
    ['text that is not JSON', { action: 'wallets' }],
    ['JSON that is not an object', { action: '"wallets"' }],
    ['JSON null', { action: 'null' }],
    ['an object with no screen', { action: '{"id":"chat-9"}' }],
  ])('%s is no action — the caller opens the notifications list', (_label, data) => {
    expect(push.pushActionOf(data as Record<string, string>)).toBeUndefined();
  });
});

describe('enablePush — idempotent', () => {
  test('a second call replaces the handlers and registers nothing twice', async () => {
    const first = jest.fn();
    const second = jest.fn();

    await push.enablePush({ onForeground: first });
    await push.enablePush({ onForeground: second });

    expect(messaging.getToken).toHaveBeenCalledTimes(1);
    expect(api.registerDevice).toHaveBeenCalledTimes(1);
    expect(messaging.__listenerCount('message')).toBe(1);
    expect(messaging.__listenerCount('opened')).toBe(1);
    expect(messaging.__listenerCount('token')).toBe(1);

    messaging.__emit('message', REMOTE_MESSAGE);
    expect(first).not.toHaveBeenCalled();
    expect(second).toHaveBeenCalledTimes(1);
  });

  test('two calls at once share one permission prompt and one registration', async () => {
    const ask = onAndroid(34);
    const second = jest.fn();

    await Promise.all([push.enablePush({ onForeground: jest.fn() }), push.enablePush({ onForeground: second })]);

    expect(ask).toHaveBeenCalledTimes(1);
    expect(api.registerDevice).toHaveBeenCalledTimes(1);
    messaging.__emit('message', REMOTE_MESSAGE);
    expect(second).toHaveBeenCalledTimes(1);
  });

  test('the returned unsubscribe detaches its own handlers — and only its own', async () => {
    const first = jest.fn();
    const second = jest.fn();

    const detachFirst = await push.enablePush({ onForeground: first });
    const detachSecond = await push.enablePush({ onForeground: second });

    /** The first caller cleaning up late must not silence the one that replaced it. */
    detachFirst();
    messaging.__emit('message', REMOTE_MESSAGE);
    expect(second).toHaveBeenCalledTimes(1);

    detachSecond();
    messaging.__emit('message', REMOTE_MESSAGE);
    expect(second).toHaveBeenCalledTimes(1);
    expect(first).not.toHaveBeenCalled();
    /** Detaching handlers is not signing out: the token stays on the account. */
    expect(api.unregisterDevice).not.toHaveBeenCalled();
  });
});

describe('disablePush', () => {
  test('tells the server to forget the token, then deletes it, and stops listening', async () => {
    const onForeground = jest.fn();
    await push.enablePush({ onForeground });

    await push.disablePush();

    expect(api.unregisterDevice).toHaveBeenCalledTimes(1);
    expect(api.unregisterDevice).toHaveBeenCalledWith('fcm-token-1');
    expect(messaging.deleteToken).toHaveBeenCalledTimes(1);
    /** The server first — while the caller still has a session to say whose device it is. */
    expect(api.unregisterDevice.mock.invocationCallOrder[0]).toBeLessThan(
      messaging.deleteToken.mock.invocationCallOrder[0],
    );

    expect(messaging.__listenerCount('message')).toBe(0);
    expect(messaging.__listenerCount('opened')).toBe(0);
    expect(messaging.__listenerCount('token')).toBe(0);
    messaging.__emit('message', REMOTE_MESSAGE);
    expect(onForeground).not.toHaveBeenCalled();
  });

  test('unregisters the token FCM last rotated to, not the one it started with', async () => {
    await push.enablePush();
    messaging.__emit('token', 'fcm-token-2');
    await new Promise<void>(resolve => setImmediate(resolve));

    await push.disablePush();

    expect(api.unregisterDevice).toHaveBeenCalledWith('fcm-token-2');
  });

  test('both steps are best-effort: a server that cannot be reached still leaves the token deleted', async () => {
    await push.enablePush();
    api.unregisterDevice.mockRejectedValue(new Error('Cannot reach the server.'));
    messaging.deleteToken.mockRejectedValue(new Error('SERVICE_NOT_AVAILABLE'));

    await expect(push.disablePush()).resolves.toBeUndefined();

    expect(messaging.deleteToken).toHaveBeenCalledTimes(1);
  });

  test('a server that never answers holds logout up for five seconds, not for ever', async () => {
    await push.enablePush();
    jest.useFakeTimers();
    api.unregisterDevice.mockReturnValue(new Promise(() => {}));

    let done = false;
    const disabling = push.disablePush().then(() => {
      done = true;
    });
    await jest.advanceTimersByTimeAsync(4999);
    expect(done).toBe(false);
    await jest.advanceTimersByTimeAsync(1);
    await disabling;

    expect(done).toBe(true);
    expect(messaging.deleteToken).toHaveBeenCalledTimes(1);
  });

  test('with push never enabled (or already disabled) it does nothing at all', async () => {
    await push.disablePush();
    expect(api.unregisterDevice).not.toHaveBeenCalled();
    expect(messaging.getMessaging).not.toHaveBeenCalled();

    await push.enablePush();
    await push.disablePush();
    await push.disablePush();
    expect(api.unregisterDevice).toHaveBeenCalledTimes(1);
    expect(messaging.deleteToken).toHaveBeenCalledTimes(1);
  });

  test('a logout that lands while the permission prompt is still up registers nothing', async () => {
    onAndroid(34);
    let answer!: (status: 'granted') => void;
    jest.spyOn(RN.PermissionsAndroid, 'request').mockReturnValue(
      new Promise(resolve => {
        answer = resolve;
      }),
    );

    const enabling = push.enablePush({ onForeground: jest.fn() });
    /** Far enough in for the prompt to be on screen. */
    await new Promise<void>(resolve => setImmediate(resolve));
    await push.disablePush();
    answer('granted');
    await enabling;

    expect(api.registerDevice).not.toHaveBeenCalled();
    expect(messaging.__listenerCount('message')).toBe(0);
  });

  test('the next sign-in after a logout starts over: a fresh token, registered again', async () => {
    await push.enablePush();
    await push.disablePush();
    messaging.getToken.mockResolvedValue('fcm-token-3');

    const onForeground = jest.fn();
    await push.enablePush({ onForeground });

    expect(api.registerDevice).toHaveBeenCalledTimes(2);
    expect(api.registerDevice).toHaveBeenLastCalledWith('fcm-token-3', 'ios');
    messaging.__emit('message', REMOTE_MESSAGE);
    expect(onForeground).toHaveBeenCalledTimes(1);
  });
});

describe('a build with no Firebase in it', () => {
  test('the native module is missing: enablePush resolves quietly and registers nothing', async () => {
    mockNativeModuleMissing = true;
    load();
    const ask = onAndroid(34);

    const detach = await push.enablePush({ onForeground: jest.fn(), onOpen: jest.fn() });

    expect(detach).toEqual(expect.any(Function));
    expect(() => detach()).not.toThrow();
    expect(api.registerDevice).not.toHaveBeenCalled();
    /** Nobody is asked for a permission that nothing could use. */
    expect(ask).not.toHaveBeenCalled();

    await expect(push.disablePush()).resolves.toBeUndefined();
    expect(api.unregisterDevice).not.toHaveBeenCalled();
  });

  test('no Firebase app configured (iOS without GoogleService-Info.plist): the same — quiet, no prompt', async () => {
    messaging.getMessaging.mockImplementation(() => {
      throw new Error("No Firebase App '[DEFAULT]' has been created - call firebase.initializeApp()");
    });

    await expect(push.enablePush()).resolves.toEqual(expect.any(Function));

    expect(messaging.requestPermission).not.toHaveBeenCalled();
    expect(api.registerDevice).not.toHaveBeenCalled();
  });

  test('registerBackgroundHandler does not throw either', () => {
    mockNativeModuleMissing = true;
    load();

    expect(() => push.registerBackgroundHandler()).not.toThrow();
  });
});

describe('registerBackgroundHandler', () => {
  test('gives FCM a handler for messages that arrive with the app closed', async () => {
    push.registerBackgroundHandler();

    expect(messaging.setBackgroundMessageHandler).toHaveBeenCalledTimes(1);
    const handler = messaging.setBackgroundMessageHandler.mock.calls[0][1];
    /** Nothing to do: the system tray draws notification messages by itself. */
    await expect(handler(REMOTE_MESSAGE)).resolves.toBeUndefined();
  });
});

describe('services/api.ts — the requests behind it', () => {
  type Api = typeof import('../src/services/api');
  let real: Api;
  let client: typeof import('../src/services/client').client;

  beforeEach(() => {
    real = jest.requireActual('../src/services/api');
    client = require('../src/services/client').client;
  });

  test('registerDevice posts the token and platform to /devices, with the app version only when there is one', async () => {
    const post = jest.spyOn(client, 'post').mockResolvedValue({ data: { ok: true, devices: 2 } });

    await expect(real.registerDevice('fcm-token-1', 'android')).resolves.toEqual({ ok: true, devices: 2 });
    expect(post).toHaveBeenLastCalledWith('/devices', { fcmToken: 'fcm-token-1', platform: 'android' });

    await real.registerDevice('fcm-token-1', 'ios', '1.4.0');
    expect(post).toHaveBeenLastCalledWith('/devices', { fcmToken: 'fcm-token-1', platform: 'ios', appVersion: '1.4.0' });
  });

  test('sendTestPush posts to /devices/test with no body and returns the per-device outcome', async () => {
    const outcome = { ok: true, devices: 2, push: [{ sent: true }, { sent: false, reason: 'invalid_token' }] };
    const post = jest.spyOn(client, 'post').mockResolvedValue({ data: outcome });

    await expect(real.sendTestPush()).resolves.toEqual(outcome);
    expect(post).toHaveBeenCalledWith('/devices/test');
  });

  test('unregisterDevice sends DELETE /devices with the token in the body', async () => {
    const remove = jest.spyOn(client, 'delete').mockResolvedValue({ data: { ok: true } });

    await expect(real.unregisterDevice('fcm-token-1')).resolves.toEqual({ ok: true });
    expect(remove).toHaveBeenCalledWith('/devices', { data: { fcmToken: 'fcm-token-1' } });
  });
});
