/**
 * Push notifications over FCM — the only file that touches Firebase.
 *
 * The server already writes every notification to the feed and sends it to
 * whatever devices the account has on file (backend/services/notification
 * .service.js); what was missing is the device. `enablePush` asks for
 * permission, gets this install's FCM token and files it under the signed-in
 * account (`registerDevice` in services/api.ts); `disablePush` takes it back
 * on logout. In between, the three ways a push can reach the app are handed
 * to whoever enabled it:
 *
 *   app open        → `onForeground({ title, body, data })` — FCM draws nothing itself here
 *   app in the tray → the system draws it; a tap comes back as `onOpen(data)`
 *   app not running → the same, picked up once at the next `enablePush`
 *
 * `data` is what the server attached, every value a string: `notificationId`,
 * `type` (the notification type), and `action` — a JSON string such as
 * `{"screen":"wallets"}` or `{"screen":"chat","id":"…"}`, or "" when the
 * notification has none. `pushActionOf` reads it.
 *
 * `@react-native-firebase/messaging` is loaded on first use rather than at
 * startup, the way services/voiceCall.ts loads Agora: a binary built before
 * the module was linked, or an iOS build with no GoogleService-Info.plist yet,
 * has no Firebase to talk to, and must come out of this as "no push" rather
 * than as an app that does not open. Nothing here throws, for the same reason
 * — push is never worth failing a sign-in or a sign-out over.
 */

import { PermissionsAndroid, Platform } from 'react-native';
import type { Messaging, RemoteMessage } from '@react-native-firebase/messaging';

import { registerDevice, unregisterDevice, type DevicePlatform } from './api';

type MessagingSdk = typeof import('@react-native-firebase/messaging');

/** FCM data is a flat map of strings; anything the SDK hands over as an object is re-serialised to match. */
export type PushData = Record<string, string>;

export type PushMessage = {
  title: string;
  body: string;
  data: PushData;
};

export type PushHandlers = {
  /** A push that arrived while the app was on screen. Nothing is drawn for it unless this draws it. */
  onForeground?: (message: PushMessage) => void;
  /** The seeker tapped a notification in the tray, with the app in the background or not running. */
  onOpen?: (data: PushData) => void;
};

/** Android 13: the first version where posting a notification needs the user's say-so. */
const ANDROID_RUNTIME_PERMISSION_API = 33;
/** Logout waits this long, at most, for the server to take the token back before moving on. */
const UNREGISTER_WAIT_MS = 5000;

/** Whoever enabled push last. The native listeners below read this on every event, so replacing it needs no re-subscribing. */
let handlers: PushHandlers = {};
/** The SDK and its messaging instance, once they have loaded. Never unset: a native module does not go away. */
let firebase: { sdk: MessagingSdk; messaging: Messaging } | null = null;
let subscriptions: Array<() => void> = [];
/** The start-up in flight, so two callers share one permission prompt and one registration. */
let starting: Promise<boolean> | null = null;
/** True once the token is known and the listeners are attached. */
let running = false;
/** This install's token, and the one the server is known to have — they differ only while a registration has yet to get through. */
let currentToken: string | null = null;
let registeredToken: string | null = null;
/** The seeker said no in this run of the app. They are not asked again until the next launch — and Android itself stops showing the prompt after a second refusal. */
let permissionRefused = false;
/**
 * Bumped by every `disablePush`. Starting up awaits a permission prompt and
 * the network; if a logout lands in between, the start notices its number is
 * stale and stops rather than filing the token under an account that has
 * just signed out.
 */
let generation = 0;

const devicePlatform = (): DevicePlatform =>
  Platform.OS === 'android' ? 'android' : Platform.OS === 'ios' ? 'ios' : 'web';

async function loadFirebase() {
  if (firebase) {
    return firebase;
  }
  try {
    const sdk = await import('@react-native-firebase/messaging');
    /** Throws when the native module is not in this binary, or (iOS) no Firebase app has been configured. */
    firebase = { sdk, messaging: sdk.getMessaging() };
  } catch {
    return null;
  }
  return firebase;
}

async function allowedToNotify(sdk: MessagingSdk, messaging: Messaging): Promise<boolean> {
  if (permissionRefused) {
    return false;
  }

  let granted: boolean;
  if (Platform.OS === 'android') {
    if (Number(Platform.Version) < ANDROID_RUNTIME_PERMISSION_API) {
      /** Granted at install time, by the manifest. */
      return true;
    }
    const status = await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS);
    granted = status === PermissionsAndroid.RESULTS.GRANTED;
  } else {
    const status = await sdk.requestPermission(messaging);
    granted = status === sdk.AuthorizationStatus.AUTHORIZED || status === sdk.AuthorizationStatus.PROVISIONAL;
  }

  permissionRefused = !granted;
  return granted;
}

function dataOf(message: RemoteMessage): PushData {
  const data: PushData = {};
  for (const [key, value] of Object.entries(message.data ?? {})) {
    data[key] = typeof value === 'string' ? value : JSON.stringify(value);
  }
  return data;
}

/** Where a notification says tapping it should lead — the feed's own `action` shape (`NotificationRow` in services/api.ts). */
export type PushAction = { screen: string; id?: string };

/**
 * Reads `data.action`. The server sends it as a JSON string, and as "" when
 * the notification has no destination; anything empty, unparseable or without
 * a screen comes back `undefined`, which a caller treats as "just open the
 * notifications list".
 */
export function pushActionOf(data: PushData): PushAction | undefined {
  const raw = data.action;
  if (!raw) {
    return undefined;
  }
  try {
    const parsed: unknown = JSON.parse(raw);
    if (parsed === null || typeof parsed !== 'object') {
      return undefined;
    }
    const { screen, id } = parsed as { screen?: unknown; id?: unknown };
    if (typeof screen !== 'string' || screen === '') {
      return undefined;
    }
    return typeof id === 'string' && id !== '' ? { screen, id } : { screen };
  } catch {
    return undefined;
  }
}

function toPushMessage(message: RemoteMessage): PushMessage {
  const data = dataOf(message);
  return {
    title: message.notification?.title ?? data.title ?? '',
    body: message.notification?.body ?? data.body ?? '',
    data,
  };
}

/** Files `token` under the signed-in account, once. A failure is left for the next `enablePush` (or token refresh) to retry. */
async function register(token: string) {
  if (!token) {
    return;
  }
  currentToken = token;
  if (token === registeredToken) {
    return;
  }
  try {
    await registerDevice(token, devicePlatform());
    /** Only if it is still the token in play — a logout or a refresh may have overtaken the request. */
    if (currentToken === token) {
      registeredToken = token;
    }
  } catch {
    /** Offline, or the server refused: the feed and the socket still work, and this is tried again. */
  }
}

async function start(attempt: number): Promise<boolean> {
  const loaded = await loadFirebase();
  if (!loaded || attempt !== generation) {
    return false;
  }
  const { sdk, messaging } = loaded;

  const allowed = await allowedToNotify(sdk, messaging);
  if (!allowed || attempt !== generation) {
    return false;
  }

  const token = await sdk.getToken(messaging);
  if (attempt !== generation) {
    return false;
  }

  subscriptions = [
    /** FCM rotates tokens on its own schedule; the server only ever reaches the newest. */
    sdk.onTokenRefresh(messaging, next => {
      register(next);
    }),
    sdk.onMessage(messaging, message => {
      handlers.onForeground?.(toPushMessage(message));
    }),
    sdk.onNotificationOpenedApp(messaging, message => {
      handlers.onOpen?.(dataOf(message));
    }),
  ];
  running = true;

  await register(token);

  try {
    /** The tap that launched the app, if one did. The SDK hands it over once. */
    const initial = await sdk.getInitialNotification(messaging);
    if (initial && attempt === generation) {
      handlers.onOpen?.(dataOf(initial));
    }
  } catch {
    /** Nothing opened the app, as far as anyone can tell. */
  }
  return true;
}

/**
 * Turns push on for the signed-in account: permission (Android 13+ and iOS
 * ask; older Androids need none), the FCM token registered with the server,
 * and the handlers attached. Call it once someone is signed in.
 *
 * Idempotent — a second call replaces the handlers and registers nothing
 * twice. Resolves with a function that detaches *these* handlers (the token
 * stays registered; that is `disablePush`'s job). Resolves just the same,
 * having done nothing, when permission is refused or this build has no
 * Firebase in it.
 */
export async function enablePush(next: PushHandlers = {}): Promise<() => void> {
  handlers = next;
  const unsubscribe = () => {
    if (handlers === next) {
      handlers = {};
    }
  };

  if (starting) {
    /** Already on its way up for an earlier caller — the new handlers are in place, and there is nothing to do twice. */
    await starting;
    return unsubscribe;
  }

  if (running) {
    /** A registration that failed earlier (the phone was offline) gets its second chance here. */
    if (currentToken) {
      await register(currentToken);
    }
    return unsubscribe;
  }

  const attempt = generation;
  starting = start(attempt)
    .catch(() => false)
    .then(started => {
      if (attempt === generation) {
        starting = null;
      }
      return started;
    });
  await starting;
  return unsubscribe;
}

/** Resolves with `work`, or with nothing once `ms` have passed — whichever is first. Rejects only if `work` does. */
function withinMs<T>(work: Promise<T>, ms: number): Promise<T | void> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => resolve(), ms);
    work.then(
      value => {
        clearTimeout(timer);
        resolve(value);
      },
      error => {
        clearTimeout(timer);
        reject(error);
      },
    );
  });
}

/**
 * Turns push off for whoever is signed in: the server is told to forget this
 * device's token, then the token itself is deleted so FCM stops delivering to
 * it. Both are best-effort. Call it on logout **before** the session is
 * cleared — the first step needs the access token to say whose device it is.
 *
 * Safe to call with push never enabled, and any number of times.
 */
export async function disablePush(): Promise<void> {
  generation += 1;
  handlers = {};
  for (const unsubscribe of subscriptions.splice(0)) {
    try {
      unsubscribe();
    } catch {
      /** The native side is already gone. */
    }
  }

  const token = currentToken;
  const wasOn = running || starting !== null;
  running = false;
  starting = null;
  currentToken = null;
  registeredToken = null;

  if (token) {
    try {
      await withinMs(unregisterDevice(token), UNREGISTER_WAIT_MS);
    } catch {
      /** Unreachable, or the session is already gone: the server prunes the token itself once FCM reports it dead. */
    }
  }
  if (firebase && (token || wasOn)) {
    try {
      /** The next sign-in on this phone gets a fresh token, and nothing sent to the old one arrives. */
      await firebase.sdk.deleteToken(firebase.messaging);
    } catch {
      /** Best-effort. */
    }
  }
}

/**
 * For index.js, at module scope: FCM wakes the JS engine for a message that
 * arrives with the app in the background or killed, and warns when nothing
 * is registered to receive it. The handler does nothing — the server sends
 * notification-type messages, which the system tray draws by itself.
 *
 * A plain `require` rather than `await import`: the handler has to be in
 * place before that headless task runs, not a tick later. It is still inside
 * a function and a `try`, so a binary without the module skips it quietly.
 */
export function registerBackgroundHandler() {
  try {
    const sdk = require('@react-native-firebase/messaging') as MessagingSdk;
    sdk.setBackgroundMessageHandler(sdk.getMessaging(), async () => {});
  } catch {
    /** No Firebase in this build — there will be no background messages either. */
  }
}
