/**
 * services/notificationRoutes.ts — the one table that says where a tapped
 * notification leads, for a push in the tray and a row in the list alike.
 *
 * The actions here are the ones the backend really sends (every
 * `action: { screen: … }` under backend/services), plus the app's own
 * fixtures. What the shell then does with a destination is PushWiring.test.tsx.
 */
import { ROUTED_SCREENS, routeForAction } from '../src/services/notificationRoutes';

describe('actions this app has a screen for', () => {
  test.each([
    ['wallet (a seeker: referral reward, refund)', { screen: 'wallet' }, { route: 'wallet', params: {} }],
    ['wallets (the astrologer spelling)', { screen: 'wallets', id: 'a-1' }, { route: 'wallet', params: {} }],
    [
      'consultationChat — the session has started',
      { screen: 'consultationChat', id: 'chat-1' },
      { route: 'consultation', params: { chatId: 'chat-1' } },
    ],
    [
      'consultation — accepted, declined or unanswered',
      { screen: 'consultation', id: 'chat-2' },
      { route: 'consultation', params: { chatId: 'chat-2' } },
    ],
    ['consultationHistory (the fixtures)', { screen: 'consultationHistory', id: 'chat-hist-1' }, { route: 'consultations', params: {} }],
  ])('%s', (_label, action, destination) => {
    expect(routeForAction(action)).toEqual(destination);
  });

  test('a consultation with no chat id cannot be looked up, so it goes to the history', () => {
    expect(routeForAction({ screen: 'consultation' })).toEqual({ route: 'consultations', params: {} });
    expect(routeForAction({ screen: 'consultationChat', id: '' })).toEqual({ route: 'consultations', params: {} });
  });

  test('the table is exactly these screens', () => {
    expect([...ROUTED_SCREENS].sort()).toEqual(['consultation', 'consultationChat', 'consultationHistory', 'wallet', 'wallets']);
  });
});

describe('actions with nowhere to go in this app (a push opens Notifications; a row stays put)', () => {
  test.each([
    /** Website features. */
    ['order', { screen: 'order', id: 'o-1' }],
    ['puja_booking', { screen: 'puja_booking', id: 'p-1' }],
    ['application', { screen: 'application', id: 'app-1' }],
    /** Sent to a seeker, but the app has not built the screen yet. */
    ['support', { screen: 'support', id: 't-1' }],
    ['referral', { screen: 'referral' }],
    ['loyalty', { screen: 'loyalty' }],
    /** The astrologer app's own. */
    ['profileEdit', { screen: 'profileEdit' }],
    ['dashboard', { screen: 'dashboard' }],
    ['astrologer', { screen: 'astrologer', id: 'a-1' }],
    /** A newer server, or nonsense. */
    ['a screen nobody has heard of', { screen: 'somethingNew', id: 'x' }],
    ['a name every object inherits', { screen: 'constructor' }],
    ['a differently-cased name', { screen: 'Wallet' }],
    ['an empty screen', { screen: '' }],
    ['no screen at all', { id: 'chat-1' }],
  ])('%s', (_label, action) => {
    expect(routeForAction(action)).toBeUndefined();
  });

  test.each([
    ['undefined', undefined],
    ['null', null],
    ['a screen that is not a string', { screen: 42 } as never],
  ])('%s', (_label, action) => {
    expect(routeForAction(action)).toBeUndefined();
  });
});

test('pure: the action is not changed, and asking twice gives the same answer', () => {
  const action = Object.freeze({ screen: 'consultationChat', id: 'chat-1' });

  expect(routeForAction(action)).toEqual(routeForAction(action));
  expect(action).toEqual({ screen: 'consultationChat', id: 'chat-1' });
});
