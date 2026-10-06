/**
 * A stand-in for `@react-native-firebase/messaging` — the modular API
 * services/push.ts uses — as a device that says yes: permission is granted
 * and there is a token.
 *
 * A test that wants a refusal or a failure changes the one function it cares
 * about, and delivers events through `__emit`, the way the native side would:
 * 'message' (a push with the app open), 'opened' (a tray tap with the app in
 * the background) and 'token' (FCM rotated the token).
 */

type Kind = 'message' | 'opened' | 'token';
type Listener = (payload: any) => unknown;

const listeners: Record<Kind, Set<Listener>> = {
  message: new Set(),
  opened: new Set(),
  token: new Set(),
};

const subscribe = (kind: Kind) =>
  jest.fn((_messaging: unknown, listener: Listener) => {
    listeners[kind].add(listener);
    return () => {
      listeners[kind].delete(listener);
    };
  });

export const AuthorizationStatus = {
  NOT_DETERMINED: -1,
  DENIED: 0,
  AUTHORIZED: 1,
  PROVISIONAL: 2,
  EPHEMERAL: 3,
};

export const getMessaging = jest.fn(() => ({ app: { name: '[DEFAULT]' } }));
export const requestPermission = jest.fn(async (_messaging: unknown) => AuthorizationStatus.AUTHORIZED);
export const getToken = jest.fn(async (_messaging: unknown) => 'fcm-token-1');
export const deleteToken = jest.fn(async (_messaging: unknown) => {});
export const getInitialNotification = jest.fn(async (_messaging: unknown): Promise<unknown> => null);
export const onMessage = subscribe('message');
export const onNotificationOpenedApp = subscribe('opened');
export const onTokenRefresh = subscribe('token');
export const setBackgroundMessageHandler = jest.fn((_messaging: unknown, _handler: Listener) => {});

/** Test-only: fires whatever is subscribed. */
export const __emit = (kind: Kind, payload: unknown) => {
  for (const listener of [...listeners[kind]]) {
    listener(payload);
  }
};
/** Test-only: how many listeners are attached — one each while push is on, none after `disablePush`. */
export const __listenerCount = (kind: Kind) => listeners[kind].size;
