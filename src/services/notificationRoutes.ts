/**
 * Where a notification leads when it is tapped — in the tray (a push) or in
 * the Notifications list (a row). One table for both, so the two can never
 * disagree.
 *
 * The server attaches an `action` to most notifications: `{ screen, id? }`
 * (backend/services/*.service.js, wherever `notificationService.notify` is
 * called). `routeForAction` turns that into one of the few places this app can
 * actually open; the shell (App.tsx's `openNotification`) does the opening.
 *
 * `undefined` means "this app has no screen for it": a tapped push then opens
 * the Notifications list, where it is listed, and a tapped row stays where it
 * is. That covers the website's features (`order`, `puja_booking`,
 * `application`), the ones the app has not built yet (`support`, `referral`,
 * `loyalty`), the astrologer app's own (`profileEdit`, `dashboard`,
 * `astrologer`), and anything a newer server sends that this build has never
 * heard of.
 */

/** The feed's `action` (`NotificationRow` in services/api.ts) and a push's parsed `data.action` (`PushAction` in services/push.ts) are both this. */
export type NotificationAction = { screen?: string; id?: string };

export type NotificationDestination =
  /** The Wallet tab. */
  | { route: 'wallet'; params: Record<string, never> }
  /**
   * One consultation. The shell asks the server where it stands before
   * opening anything: the live consultation screen while the session is
   * `active`, the consultation history otherwise (ended, declined, missed).
   */
  | { route: 'consultation'; params: { chatId: string } }
  /** The consultation history. */
  | { route: 'consultations'; params: Record<string, never> };

export type NotificationRoute = NotificationDestination['route'];

/**
 * `action.screen` → where it goes. A Map rather than an object literal, so a
 * screen named "constructor" or "toString" finds nothing instead of something
 * inherited.
 */
const ROUTES = new Map<string, NotificationRoute>([
  /** The server says `wallet` to a seeker and `wallets` to an astrologer; a seeker's build accepts both. */
  ['wallet', 'wallet'],
  ['wallets', 'wallet'],
  /** "Your astrologer is ready" — the session has started. */
  ['consultationChat', 'consultation'],
  /** For a seeker: the request was accepted, declined, or went unanswered. */
  ['consultation', 'consultation'],
  /** The app's own fixtures (services/dummyData.ts) name the history screen outright. */
  ['consultationHistory', 'consultations'],
]);

/** The screens `routeForAction` knows, for whoever wants to list them (the tests do). */
export const ROUTED_SCREENS: ReadonlyArray<string> = [...ROUTES.keys()];

/**
 * Pure: the same action always gives the same answer, and nothing is read
 * from the app or the network. A consultation with no chat id cannot be
 * looked up, so it goes to the history, where it will be listed.
 */
export function routeForAction(action?: NotificationAction | null): NotificationDestination | undefined {
  const screen = action?.screen;
  if (typeof screen !== 'string' || screen === '') {
    return undefined;
  }

  const route = ROUTES.get(screen);
  if (route === undefined) {
    return undefined;
  }

  if (route === 'consultation') {
    const chatId = typeof action?.id === 'string' ? action.id : '';
    return chatId !== '' ? { route, params: { chatId } } : { route: 'consultations', params: {} };
  }
  return { route, params: {} };
}
