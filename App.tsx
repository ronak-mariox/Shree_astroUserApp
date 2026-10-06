/**
 * Shree Astro
 *
 * @format
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import type { TabKey } from './src/components/BottomTabBar';
import type { BirthDetails } from './src/screens/BirthDetailsScreen';
import type { Profile } from './src/screens/ProfileCreationScreen';
import type { Receipt } from './src/screens/PaymentSuccessScreen';
import { register, signOut, type AuthSession, type PhotoAsset } from './src/services/auth';
import {
  cancelChat,
  connectLiveUpdates,
  createBirthProfile,
  searchPlaces,
  fetchCurrentKundli,
  disconnectLiveUpdates,
  fetchConsultations,
  fetchProfile,
  getChatState,
  precheckSession,
  requestChat,
  rupees,
  saveProfile,
  subscribeToRequest,
  type Intake,
} from './src/services/api';
import { toPackageBooking, type PackageQuote } from './src/data/consultPackages';
import { busyForLabel } from './src/data/availability';
import { ApiError } from './src/services/client';
import {
  PaymentUnconfirmedError,
  describePaymentError,
  paidWithLabel,
  payTopUp,
} from './src/services/payments';
import { paymentMethods, type PaymentMethodId } from './src/data/wallet';
import { routeForAction, type NotificationAction } from './src/services/notificationRoutes';
import { disablePush, enablePush, pushActionOf, type PushData, type PushMessage } from './src/services/push';
import {
  onSessionChange,
  restoreSession,
  updateUser,
  type Session,
} from './src/services/session';
import {
  clearKundliProfileId,
  restoreKundliProfileId,
  saveKundliProfileId,
} from './src/services/kundliProfile';
import { colors } from './src/theme';
import { pickProfilePhoto } from './src/services/photoPicker';
import { portraitOf } from './src/utils/images';
import type { AstrologerSummary } from './src/data/astrologerProfile';
import { AddMoneyScreen } from './src/screens/AddMoneyScreen';
import { AiAstrologyChatScreen } from './src/screens/AiAstrologyChatScreen';
import { AstrologerDetailScreen } from './src/screens/AstrologerDetailScreen';
import { AstrologyAnalysisScreen } from './src/screens/AstrologyAnalysisScreen';
import { DailyHoroscopeScreen } from './src/screens/DailyHoroscopeScreen';
import { AppDialog } from './src/components/AppDialog';
import { useDialog } from './src/hooks/useDialog';
import { AvailableAstrologersScreen } from './src/screens/AvailableAstrologersScreen';
import { ConsultationHistoryScreen } from './src/screens/ConsultationHistoryScreen';
import { EditProfileScreen, type ProfileChanges } from './src/screens/EditProfileScreen';
import { EmailLoginScreen } from './src/screens/EmailLoginScreen';
import { ComingSoonScreen } from './src/screens/ComingSoonScreen';
import { ChatIntakeScreen } from './src/screens/ChatIntakeScreen';
import { ConsultationChatScreen } from './src/screens/ConsultationChatScreen';
import {
  AstrologerBusyDialog,
  DeclineChatDialog,
} from './src/components/AstrologerBusyDialog';
import { ConnectingDialog } from './src/components/ConnectingDialog';
import { formatBirthDateFromIso, intakeSummary, topicSlugFor, type ChatIntake } from './src/data/chatIntake';
import { FindAstrologersScreen } from './src/screens/FindAstrologersScreen';
import { BirthDetailsScreen, formatTimeForDisplay } from './src/screens/BirthDetailsScreen';
import { HomeScreen } from './src/screens/HomeScreen';
import { KundliResultScreen } from './src/screens/KundliResultScreen';
import { KundliScreen } from './src/screens/KundliScreen';
import { LoginOptionsScreen } from './src/screens/LoginOptionsScreen';
import { OtpLoginScreen } from './src/screens/OtpLoginScreen';
import { NotificationsScreen } from './src/screens/NotificationsScreen';
import { PaymentProcessingScreen } from './src/screens/PaymentProcessingScreen';
import { PaymentScreen } from './src/screens/PaymentScreen';
import { PaymentSuccessScreen } from './src/screens/PaymentSuccessScreen';
import { ProfileCreationScreen } from './src/screens/ProfileCreationScreen';
import { ProfileScreen } from './src/screens/ProfileScreen';
import { TransactionHistoryScreen } from './src/screens/TransactionHistoryScreen';
import { WalletScreen } from './src/screens/WalletScreen';
import { WelcomeScreen } from './src/screens/WelcomeScreen';

/**
 * Onboarding is two straight lines out of the welcome screen — log in (pick a
 * method → verify) or sign up (profile → birth details) — and both land on the
 * signed-in shell, so the app is driven by a single route value rather than a
 * navigation library. Swap this for a navigator as the shell grows.
 *
 * 'restoring' is the state before the keystore has been read: the app does not
 * yet know whether anyone is signed in. It cannot be entered again once left.
 */
type Route =
  | 'restoring'
  | 'welcome'
  | 'loginOptions'
  | 'otpLogin'
  | 'emailLogin'
  | 'profileCreation'
  | 'birthDetails'
  | 'home'
  | 'kundli'
  | 'kundliResult'
  | 'astrologyAnalysis'
  | 'dailyHoroscope'
  | 'aiChat'
  | 'wallet'
  | 'addMoney'
  | 'payment'
  | 'paymentProcessing'
  | 'paymentSuccess'
  | 'profile'
  | 'editProfile'
  | 'transactionHistory'
  | 'consultationHistory'
  | 'pushedConsultations'
  | 'notifications'
  | 'findAstrologers'
  | 'astrologerDetail'
  | 'availableAstrologers'
  | 'comingSoon'
  | 'chatIntake'
  | 'consultationChat';

/**
 * Where a signed-in seeker lands: the Consult tab, with its own tab selected
 * — the astrologers they can talk to, rather than Home. Used by every way in
 * (signing in, finishing sign-up, and reopening the app with a session
 * already saved), so the first screen is the same however they arrive.
 */
const LANDING_ROUTE: Route = 'availableAstrologers';

/** The bottom-navigation tabs that have a screen behind them so far. */
const TAB_ROUTES: Partial<Record<TabKey, Route>> = {
  home: 'home',
  kundli: 'kundli',
  consult: 'availableAstrologers',
  wallet: 'wallet',
  profile: 'profile',
};

/** The intake form's own shape -> what POST /chats expects (services/api.ts's `Intake`). */
const toApiIntake = (intake: ChatIntake): Intake => ({
  topic: topicSlugFor(intake.topic),
  summary: intakeSummary(intake).join('\n'),
  birthDetails: {
    fullName: intake.fullName,
    gender: intake.gender,
    dateOfBirth: intake.dateOfBirth,
    timeOfBirth: intake.timeOfBirth,
    place: { formatted: intake.birthPlace },
  },
});

/**
 * Routes reachable without a session: everything up to signing in or
 * registering, plus the coming-soon screen (its Google/Apple buttons are
 * reachable from those same pre-login screens). Every other route is only
 * ever set from a place in this file that already checked `session` first —
 * this is the backstop for anything that stops being true as the app grows.
 */
const PUBLIC_ROUTES = new Set<Route>([
  'restoring',
  'welcome',
  'loginOptions',
  'otpLogin',
  'emailLogin',
  'profileCreation',
  'birthDetails',
  'comingSoon',
]);

/**
 * Screens a push must not talk over or pull the seeker away from: a
 * consultation that is being billed by the minute, and a payment whose
 * checkout is open. The notification is in the feed either way.
 */
const UNINTERRUPTIBLE_ROUTES = new Set<Route>(['consultationChat', 'paymentProcessing']);

/** Screens whose own Back already reads `pushedOrigin` — opening Notifications (or the history) from one keeps that origin rather than pointing it at themselves. */
const PUSHED_ROUTES = new Set<Route>(['notifications', 'transactionHistory', 'pushedConsultations']);

/** "1999-08-15T00:00:00.000Z" -> "15/08/1999". Read as UTC fields, since a birth date is stored at UTC midnight precisely so no local timezone can shift the day. */
function dobFromIso(value?: string): string {
  if (!value) {
    return '';
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '';
  }
  const day = String(date.getUTCDate()).padStart(2, '0');
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  return `${day}/${month}/${date.getUTCFullYear()}`;
}

const SHORT_MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** "1999-08-15T00:00:00.000Z" -> "15 Aug 1999" — the kundli chart's centre label. Same UTC-field care as dobFromIso. */
function prettyDobFromIso(value?: string): string {
  if (!value) {
    return '';
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '';
  }
  return `${date.getUTCDate()} ${SHORT_MONTHS[date.getUTCMonth()]} ${date.getUTCFullYear()}`;
}

function App() {
  const [route, setRoute] = useState<Route>('restoring');
  /** Who is signed in, mirrored from the session store for the shell to read. */
  const [session, setSession] = useState<Session | null>(null);
  /**
   * The rest of GET /users/me — wallet, stats, birth details — that the
   * session itself does not carry. Profile and Edit Profile both read this;
   * it is `undefined` until the first fetch resolves, in which case those
   * screens fall back to their design fixtures rather than showing nothing.
   */
  const [profile, setProfile] = useState<any>();
  /**
   * Re-reads GET /users/me — the Profile tab's wallet, consult and kundli
   * counts change elsewhere (a top-up, a finished consultation, a new kundli),
   * so the tab reads them fresh each time it opens and on pull-to-refresh.
   */
  const refreshProfile = useCallback(async () => {
    try {
      setProfile(await fetchProfile());
    } catch {
      /** Keep what is on screen; the next open or pull tries again. */
    }
  }, []);
  const profileOwnerId = session?.user?.id;
  useEffect(() => {
    if (route === 'profile' && profileOwnerId) {
      refreshProfile();
    }
  }, [route, profileOwnerId, refreshProfile]);
  /** The rashi Home resolved, carried into the full reading so it need not be looked up twice. */
  const [horoscopeSign, setHoroscopeSign] = useState<string>();
  /**
   * Every message this file used to hand to `Alert.alert`, in the app's own
   * dialog. Destructured because `show` never changes, so an effect that raises
   * a message can depend on it without restarting on every open and close.
   */
  const { request: dialogRequest, show: showDialog, dismiss: dismissDialog } = useDialog();
  /**
   * The route and the open dialog as of the latest render, for the push
   * handlers below: they are registered once per sign-in and fire at any
   * later moment, so they read these rather than the values they closed over.
   */
  const routeRef = useRef(route);
  routeRef.current = route;
  const dialogRef = useRef(dialogRequest);
  dialogRef.current = dialogRequest;
  const sessionRef = useRef(session);
  sessionRef.current = session;
  /**
   * Bumped whenever a push says the notifications have changed. Nothing in
   * this file holds the feed or the unread count — Home reads the count with
   * the rest of GET /home and the Notifications screen loads its own list —
   * so this is handed to both as the cue to read again.
   */
  const [notificationsVersion, setNotificationsVersion] = useState(0);
  /** Amount carried through the wallet top-up flow. */
  const [topUp, setTopUp] = useState(200);
  /** What `payTopUp` came back with, for the receipt screen to print. */
  const [topUpReceipt, setTopUpReceipt] = useState<Receipt>();
  /** Whoever was tapped in a listing, and the screen to go back to. */
  const [astrologer, setAstrologer] = useState<AstrologerSummary>();
  const [astrologerOrigin, setAstrologerOrigin] = useState<Route>('home');
  /** What the coming-soon screen is standing in for, and where it came from. */
  const [pending, setPending] = useState<{
    title: string;
    detail?: string;
    glyph?: string;
  }>({ title: 'This feature' });
  const [pendingOrigin, setPendingOrigin] = useState<Route>('home');
  /** Where the notifications / history screens were pushed from. */
  const [pushedOrigin, setPushedOrigin] = useState<Route>('profile');
  /**
   * The signed-in user's own generated kundli — persisted on-device (see
   * services/kundliProfile.ts) so Generate Kundli only ever calls
   * POST /birth-profiles once per birth per device; every screen after that
   * reads from GET /kundli/:profileId..., which is cache-backed and free.
   */
  /**
   * The generated kundli for the seeker's CURRENT birth details. Restored
   * from the device for a fast first paint, then confirmed against the server
   * (GET /kundli/me) whenever the Kundli tab opens or the profile changes —
   * so editing the date, time or place of birth stops pointing at the old
   * chart and the tab offers to generate the new one, while details left
   * alone keep resolving to the same stored chart.
   */
  const [kundliProfileId, setKundliProfileId] = useState<string>();
  /** Birth Details is reached from sign-up and from the Kundli tab; each Back goes to a different place. */
  const [birthDetailsOrigin, setBirthDetailsOrigin] = useState<Route>('profileCreation');
  /** Whatever was on screen in Birth Details the last time it was left via Back, unfinished — so re-entering it (e.g. after backing up to Create Profile and returning) doesn't start from blank fields. */
  const [birthDetailsDraft, setBirthDetailsDraft] = useState<BirthDetails>();
  /**
   * What the account already has on file, in the form's own shapes —
   * undefined for a brand-new sign-up (no birthDetails yet), populated for an
   * existing user opening Birth Details fresh from the Kundli tab. `placeId`
   * is never set here: a saved profile only ever has the typed place text
   * (see backend/models/common.js's birthPlaceSchema), never a resolved
   * /places/search id, so "Generate Kundli" still needs the place re-picked
   * from the dropdown even though its text is already filled in.
   */
  const profileBirthDetails: BirthDetails | undefined = profile?.birthDetails?.dateOfBirth
    ? {
        dateOfBirth: dobFromIso(profile.birthDetails.dateOfBirth),
        timeOfBirth: profile.birthDetails.timeOfBirth
          ? formatTimeForDisplay(profile.birthDetails.timeOfBirth)
          : '',
        placeOfBirth: profile.birthDetails.place?.formatted ?? '',
      }
    : undefined;
  /**
   * The same birth details, in the chat intake form's own display shape
   * ("15 August 1999" rather than Birth Details' "15/08/1999") — so a chat
   * request casts against the exact birth details already on file instead of
   * whatever the form's fixture defaults happen to be.
   */
  const chatIntakeProfile = {
    fullName: profile?.name ?? session?.user.name ?? '',
    dateOfBirth: formatBirthDateFromIso(profile?.birthDetails?.dateOfBirth),
    timeOfBirth: profile?.birthDetails?.timeOfBirth
      ? formatTimeForDisplay(profile.birthDetails.timeOfBirth)
      : '',
  };
  /**
   * The chat request in flight: who it is for, whether they are still counting
   * down a wait, and where the flow was entered from.
   */
  const [chatWith, setChatWith] = useState<{
    id: string;
    name: string;
    photo?: AstrologerSummary['photo'];
    /** "Wait ~7 min" — set only while they're in another consultation. */
    wait?: string;
    /** The estimate behind `wait`, in seconds, for the busy sheet's own sentence. */
    waitSeconds?: number;
  }>();
  const [chatOrigin, setChatOrigin] = useState<Route>('availableAstrologers');
  /** Chat or voice call: which of the astrologer's two rates the request is priced at, and which layout the consultation opens in. */
  const [chatChannel, setChatChannel] = useState<'chat' | 'call'>('chat');
  const [busyShown, setBusyShown] = useState(false);
  const [connecting, setConnecting] = useState(false);
  /** Raised by the cross under the connecting card. */
  const [declining, setDeclining] = useState(false);
  /** Seconds left on the request, so declining "No" resumes where it paused. */
  const [waitLeft, setWaitLeft] = useState(0);
  /**
   * The chat POST /chats created: set once "Connect With …" asks for it,
   * kept once the astrologer accepts, and cleared only once the session is
   * fully done with (ended and left, or the request itself fell through).
   */
  const [requestedChatId, setRequestedChatId] = useState<string>();
  /**
   * The intake form's pricing for `chatWith`: the real per-minute rate, the
   * package quotes the server priced from it, and the wallet balance they
   * were checked against — all from POST /chats/precheck, refreshed every
   * time the form opens (see the effect below), so a price shown there is
   * never computed from a guess.
   */
  const [chatQuote, setChatQuote] = useState<{ ratePerMinute: number; packages?: PackageQuote[]; balance?: number }>();
  /** True while "Connect With …" is being sent — the form's button is disabled so a double tap can't send it twice. */
  const [submittingChat, setSubmittingChat] = useState(false);
  /**
   * The intake form's unsaved answers (including the package picked), kept
   * per astrologer so leaving the form to recharge and coming back restores
   * them. Cleared once the request actually goes out.
   */
  const [intakeDraft, setIntakeDraft] = useState<{ astrologerId: string; draft: Partial<ChatIntake> }>();
  /**
   * Where a top-up should hand the seeker back to once it's done (or backed
   * out of): the chat intake form when "Recharge Wallet" was pressed because
   * a chat or package couldn't be afforded. Unset for an ordinary top-up
   * from the wallet, which keeps its usual Wallet / Home endings.
   */
  const [rechargeReturnTo, setRechargeReturnTo] = useState<Route>();
  /**
   * The chat request as of the latest render, for `openNotification` below:
   * which chat the shell is holding, and whether the seeker is still waiting
   * on its answer (the connecting card, or the "decline?" sheet over it).
   */
  const chatRequestRef = useRef<{ chatId?: string; waiting: boolean }>({ waiting: false });
  chatRequestRef.current = { chatId: requestedChatId, waiting: connecting || declining };
  /** Bumped by every tapped notification, so a slow lookup for an earlier tap cannot navigate after a later one has. */
  const openAttempt = useRef(0);

  /** "Recharge Wallet" from the chat flow: top up (pre-filled with what's missing), then come back to the intake form. */
  const rechargeForChat = (shortfall?: number) => {
    setRechargeReturnTo('chatIntake');
    if (shortfall !== undefined && shortfall > 0) {
      setTopUp(Math.ceil(shortfall));
    }
    setRoute('addMoney');
  };
  /**
   * What Create Profile collected. Registration is one request at the end of
   * the wizard, so step one is held here until birth details are saved.
   */
  const [signUp, setSignUp] = useState<{ profile: Profile; photo?: PhotoAsset }>();

  /**
   * The keystore is read once, at startup, and decides the first screen.
   *
   * Nothing is drawn until it answers — routing to the welcome screen first and
   * correcting a moment later would flash the login flow at an already
   * signed-in user on every single launch.
   */
  useEffect(() => {
    let live = true;

    restoreKundliProfileId().then(id => {
      if (live) setKundliProfileId(id ?? undefined);
    });

    restoreSession().then(restored => {
      if (!live) {
        return;
      }
      setSession(restored);
      if (!restored) {
        setRoute('welcome');
      } else {
        /**
         * `!== false` rather than a truthy check: a session saved before this
         * field existed has no `profileComplete` at all, and `undefined`
         * should read as "nothing known to be missing", not "incomplete" — an
         * already-complete user should never be shoved into Edit Profile
         * just because the app was updated since they last signed in.
         */
        setRoute(restored.user.profileComplete !== false ? LANDING_ROUTE : 'editProfile');
      }
    });

    return () => {
      live = false;
    };
  }, []);

  /**
   * A session can also end without anyone pressing anything: a refresh token
   * that turns out to be expired is cleared by the axios interceptor, from
   * wherever the user happened to be. Listening here is what turns that into
   * navigation, so no screen has to check whether it is still allowed to exist.
   */
  useEffect(
    () =>
      onSessionChange(next => {
        setSession(next);
        if (next) {
          /** Live chat ticks, messages, and request answers all arrive over this. */
          connectLiveUpdates();
        } else {
          disconnectLiveUpdates();
          /**
           * Logout has already done this, with the token still valid (see
           * handleLogout) — this is for the session that ended by itself. The
           * server can no longer be told, but deleting the FCM token here
           * still stops the previous account's pushes reaching this phone.
           */
          disablePush();
          /**
           * A kundli belongs to one account, not to the device — cleared here
           * rather than only on the Logout button, so a forced sign-out (an
           * expired refresh token, say) can never leave the next account to
           * sign in on this device looking at a `hasKundli: true` that was
           * really the previous account's.
           */
          clearKundliProfileId();
          setKundliProfileId(undefined);
          setRoute(current => (current === 'restoring' ? current : 'welcome'));
        }
      }),
    [],
  );

  /**
   * A defensive backstop, not the app's actual gate: nothing today routes to
   * a protected screen without a session behind it already, but as more
   * screens and entry points are added that could stop being true, and a
   * signed-out session should never be one stray `setRoute` away from a
   * protected screen staying on-screen.
   */
  useEffect(() => {
    if (route !== 'restoring' && !session && !PUBLIC_ROUTES.has(route)) {
      setRoute('welcome');
    }
  }, [route, session]);

  /**
   * The rest of the account — wallet, stats, birth details — for Profile and
   * Edit Profile. Refetched whenever a different account signs in; a token
   * refresh alone does not change `session.user.id`, so it does not retrigger
   * this.
   */
  useEffect(() => {
    if (!session) {
      setProfile(undefined);
      return;
    }
    let live = true;
    fetchProfile()
      .then(data => {
        if (live) {
          setProfile(data);
        }
      })
      .catch(error => {
        /** The profile screens fall back to their fixture; nothing to show the user for this. */
        console.warn('fetchProfile failed, Profile tab will show placeholder stats:', error);
      });
    return () => {
      live = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.user.id]);

  /**
   * Signing in from any flow lands here. Register and OTP login always leave
   * `profileComplete: true` (the wizard collects everything up front, and OTP
   * sign-in never opens a new account), so this always routes them to the
   * landing screen. A first-time Apple/Google sign-in can come back `false`
   * — that account was opened with only what the provider handed over,
   * nothing astrology related — so this sends it to Edit Profile instead,
   * pre-filled with whatever is known, to collect the rest first.
   */
  const afterSignIn = (signedIn: AuthSession) => {
    setRoute(signedIn.user.profileComplete !== false ? LANDING_ROUTE : 'editProfile');
  };

  /**
   * Clears the keystore first, so "logged out" is true before it is drawn.
   * `signOut()` ends the session, which the `onSessionChange` listener above
   * turns into the rest of sign-out — clearing the kundli pointer included —
   * the same way it does for a forced sign-out.
   */
  const handleLogout = async () => {
    /**
     * Before the session goes: taking this device's push token off the
     * account is an authenticated call. Best-effort and time-boxed inside
     * `disablePush`, so it can delay a logout but never prevent one.
     */
    await disablePush();
    await signOut();
    setRoute('welcome');
  };

  /**
   * The Notifications list or the consultation history, on top of wherever
   * the seeker is: both read `pushedOrigin` for their Back, so it is pointed
   * at the screen being left — unless that screen is itself one of them, in
   * which case the origin it already has is the one worth keeping.
   */
  const openPushed = useCallback((next: 'notifications' | 'pushedConsultations') => {
    const current = routeRef.current;
    if (current === next) {
      return;
    }
    if (!PUSHED_ROUTES.has(current)) {
      setPushedOrigin(current);
    }
    setRoute(next);
  }, []);

  /**
   * A notification about one consultation. The server is asked where the
   * session stands rather than trusting what the notification said when it
   * was sent: still `active` opens the live consultation; anything else —
   * ended, declined, never answered, or a session that cannot be read at all
   * — opens the history.
   *
   * The live screen needs who the session is with, which the notification
   * does not carry, so it is read from the session's own row in GET /chats.
   * A row that cannot be read costs the name ("your astrologer"), not the
   * consultation.
   */
  const openConsultation = useCallback(
    async (chatId: string, attempt: number) => {
      let live: { channel: 'chat' | 'call'; with?: { id?: string; name: string; photo?: string } } | undefined;
      try {
        const state = await getChatState(chatId);
        if (state.status === 'active') {
          live = { channel: state.channel === 'call' ? 'call' : 'chat' };
          try {
            const row = (await fetchConsultations('active')).find(entry => entry.id === chatId);
            if (row) {
              live.with = { id: row.astrologerId, name: row.astrologer, photo: row.photo };
            }
          } catch {
            /** The session is live either way; only the name is missing. */
          }
        }
      } catch {
        /** Unreachable, or not this account's session: the history is where it would be listed. */
      }

      /** Looked up over the network — the seeker may have tapped something else, started a consultation or signed out since. */
      const current = routeRef.current;
      if (attempt !== openAttempt.current || !sessionRef.current || UNINTERRUPTIBLE_ROUTES.has(current)) {
        return;
      }

      const request = chatRequestRef.current;
      if (live && request.chatId === chatId) {
        /** The very request the shell is holding (the connecting card may still be up): it already knows who it is with. */
        setConnecting(false);
        setDeclining(false);
        setRoute('consultationChat');
        return;
      }
      if (!live || request.waiting) {
        /** Not live — or the seeker is mid-request for another session, which is not dropped for this one. */
        openPushed('pushedConsultations');
        return;
      }

      setChatWith({
        id: live.with?.id ?? '',
        name: live.with?.name ?? 'your astrologer',
        photo: live.with ? portraitOf(live.with.photo) : undefined,
      });
      setChatChannel(live.channel);
      /** Where ending the consultation returns to. The intake form is for whoever `chatWith` was, so it is not somewhere to come back to. */
      setChatOrigin(current === 'chatIntake' ? LANDING_ROUTE : current);
      setRequestedChatId(chatId);
      setRoute('consultationChat');
    },
    [openPushed],
  );

  /**
   * Where a notification leads when it is tapped — a push in the tray
   * (including the one that launched the app) and a row in the Notifications
   * list both come through here, and services/notificationRoutes.ts decides
   * the destination for both. An action this app has no screen for opens the
   * Notifications list, where the notification is listed.
   *
   * Never away from a live consultation or an open checkout.
   */
  const openNotification = useCallback(
    (action?: NotificationAction) => {
      const attempt = (openAttempt.current += 1);
      if (UNINTERRUPTIBLE_ROUTES.has(routeRef.current)) {
        return;
      }

      const destination = routeForAction(action);
      if (!destination) {
        openPushed('notifications');
      } else if (destination.route === 'wallet') {
        setRoute('wallet');
      } else if (destination.route === 'consultations') {
        openPushed('pushedConsultations');
      } else {
        openConsultation(destination.params.chatId, attempt);
      }
    },
    [openConsultation, openPushed],
  );

  /**
   * A push tapped in the tray: its `data.action` is JSON ("" when there is
   * none); empty or unreadable means the list. The feed and the unread count
   * are re-read either way — the push is news to both.
   */
  const openPush = useCallback(
    (data: PushData) => {
      setNotificationsVersion(version => version + 1);
      openNotification(pushActionOf(data));
    },
    [openNotification],
  );

  /**
   * A push that arrives with the app open is not drawn by the system, so it
   * is shown in the app's own dialog — and the unread count is re-read either
   * way. It stays quiet where the dialog would be in the way: over a live
   * consultation or an open checkout, on top of a dialog that is waiting for
   * an answer, and for consultation events, which the live socket has already
   * put on screen (the connecting card, "No answer", the chat itself).
   */
  const showPush = useCallback(
    (message: PushMessage) => {
      setNotificationsVersion(version => version + 1);
      if (!message.title && !message.body) {
        return;
      }
      if (UNINTERRUPTIBLE_ROUTES.has(routeRef.current) || dialogRef.current?.actions?.length) {
        return;
      }
      if (message.data.type?.startsWith('consultation_')) {
        return;
      }
      showDialog({
        title: message.title || 'Notification',
        message: message.body || undefined,
        tone: 'info',
      });
    },
    [showDialog],
  );

  /**
   * Push follows the account: on once someone is signed in — at launch with a
   * saved session, or the moment a sign-in or sign-up completes — and off
   * again in the logout path above. Held back until the keystore has been
   * read, so a tap that launched the app is not routed before the shell has
   * decided where it starts.
   */
  const signedInUserId = session?.user.id;
  const restoring = route === 'restoring';
  useEffect(() => {
    if (!signedInUserId || restoring) {
      return;
    }
    let live = true;
    let detach: (() => void) | undefined;
    enablePush({ onForeground: showPush, onOpen: openPush }).then(unsubscribe => {
      if (live) {
        detach = unsubscribe;
      } else {
        unsubscribe();
      }
    });
    return () => {
      live = false;
      detach?.();
    };
  }, [signedInUserId, restoring, showPush, openPush]);

  /**
   * Saves an Edit Profile change. `saveProfile` already knows to send
   * multipart only when a photo actually came with it (see services/api.ts).
   * The session's cached user is refreshed too, since that is what the
   * Profile header and the app shell itself read between fetches — including
   * `profileComplete`, which is how a just-completed Apple/Google account
   * stops being routed back to Edit Profile on its next sign-in.
   */
  const saveProfileChanges = async (changes: ProfileChanges, photo?: PhotoAsset) => {
    const updated = await saveProfile({ ...changes, photo });
    setProfile(updated);
    if (session) {
      await updateUser({
        ...session.user,
        name: updated?.name ?? session.user.name,
        email: updated?.email ?? session.user.email,
        avatarUrl: updated?.avatarUrl ?? session.user.avatarUrl,
        profileComplete: updated?.profileComplete ?? session.user.profileComplete,
      });
    }
  };

  /**
   * Add Money → Payment → Processing → Success.
   *
   * Add Money only settles the amount; nothing is opened on the server until
   * "Pay" is pressed, so backing out of the Payment screen leaves no pending
   * order behind.
   */
  const beginTopUp = (amount: number) => {
    setTopUp(amount);
    setRoute('payment');
  };

  /**
   * "Pay ₹X Securely". `payTopUp` (services/payments.ts) does the whole
   * thing — opens the order, puts the Razorpay checkout on top of the
   * Processing screen, and has the server verify and credit the payment —
   * and the receipt is printed from what it returns. The method picked on
   * the Payment screen is a preference: the checkout opens on it, and the
   * receipt prints whatever was actually used.
   */
  const payForTopUp = async (method: PaymentMethodId) => {
    const methodLabel = paymentMethods.find(option => option.id === method)?.name ?? '—';
    setRoute('paymentProcessing');

    try {
      const transaction = await payTopUp({ amount: topUp, method, methodLabel });
      const amount = transaction.amount ?? topUp;
      const balanceAfter = transaction.balanceAfter ?? amount;

      setTopUpReceipt({
        transactionId: transaction.reference ?? transaction.id ?? transaction._id ?? '—',
        method: paidWithLabel(transaction, methodLabel),
        dateTime: new Date().toLocaleString('en-GB', {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          hour12: true,
        }),
        previousBalance: rupees(balanceAfter - amount),
        newBalance: rupees(balanceAfter),
      });
      setRoute('paymentSuccess');
    } catch (error) {
      /** A closed checkout gets a word too: the seeker is dropped back on the Payment screen and should know why. */
      showDialog(describePaymentError(error).dialog);
      /**
       * Back to the Payment screen to try again — except when the money has
       * already moved and only the confirmation is outstanding, where "try
       * again" would be paying twice: that one lands on the wallet instead.
       */
      setRoute(error instanceof PaymentUnconfirmedError ? 'wallet' : 'payment');
    }
  };

  /**
   * Saving birth details registers the account when the user got here through
   * sign-up; reached from the Kundli tab (or the profile) instead, it is an
   * edit, so the new details are written to the account — a save that only
   * navigated away would silently lose them. Errors are left to reject so the
   * screen can keep the user on the form and print them.
   *
   * Changing any of these means the kundli already generated no longer
   * describes this birth: the Kundli tab re-checks against the account's
   * details on open (GET /kundli/me) and offers to generate the new chart.
   */
  const saveBirthDetails = async (details: BirthDetails) => {
    if (signUp) {
      await register({ profile: signUp.profile, birth: details, photo: signUp.photo });
      setSignUp(undefined);
      setRoute(LANDING_ROUTE);
      return;
    }

    const updated = await saveProfile({
      dateOfBirth: details.dateOfBirth,
      timeOfBirth: details.timeOfBirth,
      placeOfBirth: details.placeOfBirth,
    });
    setProfile(updated);
    /** Saved — nothing half-typed left to restore if this screen is opened again. */
    setBirthDetailsDraft(undefined);
    setRoute(birthDetailsOrigin === 'birthDetails' ? LANDING_ROUTE : birthDetailsOrigin);
  };

  /**
   * Generating calls the real backend — `details.placeId` is guaranteed set by
   * the time this runs (BirthDetailsScreen refuses to call it otherwise), so
   * lat/lon come from that geocode, never from the typed text. The same birth
   * is cached server-side, so this is safe to call again later without
   * spending another credit; the id is kept on-device purely so it usually
   * doesn't have to be called again at all.
   *
   * Reachable from sign-up too (this screen shows "Generate Kundli" right
   * alongside "Save & Continue"), where there is no account — and therefore
   * no auth token — yet. Registering first, exactly like Save & Continue
   * does, is what makes the call after it authenticated instead of a 401.
   */
  const generateKundli = async (details: BirthDetails) => {
    if (!details.placeId) {
      return;
    }
    if (signUp) {
      await register({ profile: signUp.profile, birth: details, photo: signUp.photo });
      setSignUp(undefined);
    }
    const created = await createBirthProfile({
      fullName: signUp?.profile.fullName ?? profile?.name ?? session?.user.name ?? '',
      gender: signUp?.profile.gender ?? profile?.gender,
      dateOfBirth: details.dateOfBirth,
      timeOfBirth: details.timeOfBirth,
      placeId: details.placeId,
    });
    setKundliProfileId(created.id);
    await saveKundliProfileId(created.id);
    /** The generated chart's own details are now what the account has on file. */
    fetchProfile().then(setProfile).catch(() => {});
    setRoute('kundliResult');
  };

  /**
   * The Kundli tab's "Generate Kundli": when the account already has a full
   * date, time and place of birth on file, the chart is generated straight
   * from them — no form. The saved place is only text, so it is matched
   * against the place search (the same search the form uses) to get the id
   * the server needs. Anything missing or unmatched falls back to the Birth
   * Details form, as before, so the user can fix it there.
   */
  const [generatingFromSaved, setGeneratingFromSaved] = useState(false);
  const openBirthDetailsForm = () => {
    setBirthDetailsDraft(undefined);
    setBirthDetailsOrigin('kundli');
    setRoute('birthDetails');
  };
  const generateFromSavedDetails = async () => {
    const saved = profileBirthDetails;
    if (generatingFromSaved) {
      return;
    }
    if (!saved?.dateOfBirth || !saved.timeOfBirth || !saved.placeOfBirth) {
      openBirthDetailsForm();
      return;
    }
    setGeneratingFromSaved(true);
    try {
      const wanted = saved.placeOfBirth.trim().toLowerCase();
      const city = saved.placeOfBirth.split(',')[0].trim();
      const suggestions = await searchPlaces(city.length >= 3 ? city : saved.placeOfBirth);
      const match =
        suggestions.find(item => item.formatted.trim().toLowerCase() === wanted) ?? suggestions[0];
      if (!match) {
        openBirthDetailsForm();
        return;
      }
      await generateKundli({ ...saved, placeId: match.id });
    } catch (error) {
      showDialog({
        title: 'Could not generate your kundli',
        tone: 'error',
        message:
          error instanceof ApiError ? error.message : 'Something went wrong. Please try again in a moment.',
      });
    } finally {
      setGeneratingFromSaved(false);
    }
  };

  /**
   * Confirms which chart belongs to the birth details on file. A changed
   * detail means no stored chart matches, so the tab shows "Generate Kundli"
   * again; generating then casts a new one and caches it server-side.
   */
  const refreshCurrentKundli = async () => {
    try {
      const current = await fetchCurrentKundli();
      if (current.found) {
        setKundliProfileId(current.profileId);
        await saveKundliProfileId(current.profileId);
      } else {
        setKundliProfileId(undefined);
        await clearKundliProfileId();
      }
    } catch {
      /** Offline or a hiccup — leave whatever was restored from the device; opening the chart would fail loudly anyway. */
    }
  };

  useEffect(() => {
    if (session && (route === 'kundli' || route === 'home')) {
      refreshCurrentKundli();
    }
  }, [route, session, profile?.birthDetails?.dateOfBirth, profile?.birthDetails?.timeOfBirth, profile?.birthDetails?.place?.formatted]);

  /** Screens reachable from more than one place go back where they came from. */
  const push = (next: Route, from: Route) => {
    setPushedOrigin(from);
    setRoute(next);
  };

  /** Every listing opens the same profile, on top of wherever it was opened from. */
  const openAstrologer = (summary: AstrologerSummary, from: Route) => {
    setAstrologer(summary);
    setAstrologerOrigin(from);
    setRoute('astrologerDetail');
  };

  /**
   * Buttons whose destination is designed but not built yet — live chat and
   * voice consultations, social sign-in, photo upload — land on the
   * coming-soon screen instead of doing nothing.
   */
  const comeBackLater = (
    from: Route,
    title: string,
    detail?: string,
    glyph?: string,
  ) => {
    setPending({ title, detail, glyph });
    setPendingOrigin(from);
    setRoute('comingSoon');
  };

  /**
   * A chat starts one of two ways: an astrologer still counting down a wait
   * asks whether to hold on (Figma node 180:162837), and a free one goes
   * straight to the intake form (node 180:93411) — but only once the seeker's
   * balance is actually enough to open one, checked here before the form is
   * even shown so a "you need more balance" never comes as a surprise after
   * it has been filled in. Mirrors POST /chats' own check exactly (see
   * services/chat.service.js's precheckSession), so nothing shown here can
   * disagree with what "Connect With …" is about to do.
   */
  const startChat = async (
    from: Route,
    target: {
      /** Who the request goes to. */
      id: string;
      name: string;
      photo?: AstrologerSummary['photo'];
      /** "Wait ~7 min" — set only while they're in another consultation. */
      wait?: string;
      /** The estimate behind `wait`, in seconds, for the busy sheet's sentence. */
      waitSeconds?: number;
    },
    /** 'call' prices the request at the astrologer's call rate and opens the consultation in the voice-call layout. */
    channel: 'chat' | 'call' = 'chat',
  ) => {
    setChatWith(target);
    setChatOrigin(from);
    setChatChannel(channel);
    if (target.wait !== undefined && target.wait !== '') {
      setBusyShown(true);
      return;
    }

    try {
      const check = await precheckSession(target.id, channel);
      if (!check.astrologerAvailable) {
        setBusyShown(true);
        return;
      }
      if (!check.ok) {
        const minuteWord = check.minSessionMinutes === 1 ? 'minute' : 'minutes';
        showDialog({
          title: 'Insufficient Balance',
          tone: 'wallet',
          message: `You need at least ${rupees(check.shortfallAmount)} more in your wallet to start this ${channel} (minimum ${check.minSessionMinutes} ${minuteWord}).`,
          actions: [
            { label: 'Cancel', variant: 'secondary' },
            { label: 'Recharge Wallet', onPress: () => rechargeForChat(check.shortfallAmount) },
          ],
        });
        return;
      }
    } catch {
      /** The check itself is a courtesy — "Connect With …" makes the exact same call for real and will refuse there if something is actually wrong. */
    }

    setRoute('chatIntake');
  };

  /**
   * "Connect With …" on the intake form: asks the astrologer for a chat, then
   * waits on the connecting card for them to answer.
   *
   * `startChat`'s own precheck above already tries to catch a short wallet
   * before the form is even shown, but that check is only a courtesy (it
   * swallows its own failures) and can still go stale between then and now —
   * a race with something else spending the balance, or simply a slow typist.
   * This is the request that actually matters, so an insufficient-balance
   * refusal here gets its own dedicated popup with a way to fix it right
   * away, not just a dismissible error.
   */
  const connectChat = async (intake: ChatIntake) => {
    if (!chatWith || submittingChat) {
      return;
    }

    /** Per-minute sends no `billing` at all, so its request is byte-for-byte what it always was. */
    const billing = toPackageBooking(intake.consultation);

    setSubmittingChat(true);
    try {
      const request = await requestChat(chatWith.id, toApiIntake(intake), chatChannel, billing);
      setIntakeDraft(undefined);
      setRequestedChatId(request.chatId);
      setWaitLeft(request.expiresInSeconds);
      setConnecting(true);
    } catch (error) {
      if (billing && error instanceof ApiError && error.code === 'insufficient_balance') {
        const shortfall = Number(error.details?.shortfallAmount ?? 0);
        const price = Number(error.details?.price ?? billing.quotedPrice);
        showDialog({
          title: 'Insufficient Balance',
          tone: 'wallet',
          message: `The ${billing.packageMinutes}-minute package costs ${rupees(price)}. You need ${rupees(shortfall)} more in your wallet.`,
          actions: [
            { label: 'Cancel', variant: 'secondary' },
            { label: 'Recharge Wallet', onPress: () => rechargeForChat(shortfall) },
          ],
        });
        return;
      }
      if (billing && error instanceof ApiError && error.code === 'price_changed') {
        /**
         * The astrologer's rate changed after the form was opened. The server
         * refused rather than charge a price the seeker never saw — show the
         * new one and let them confirm it (the form re-prices too).
         */
        const newPrice = Number(error.details?.price);
        refreshChatQuote(chatWith.id);
        showDialog({
          title: 'Price updated',
          tone: 'info',
          message: `The ${billing.packageMinutes}-minute package now costs ${rupees(newPrice)}.`,
          actions: [
            { label: 'Cancel', variant: 'secondary' },
            {
              label: `Pay ${rupees(newPrice)}`,
              onPress: () => {
                connectChat({ ...intake, consultation: { mode: 'package', minutes: billing.packageMinutes, price: newPrice } });
              },
            },
          ],
        });
        return;
      }
      if (error instanceof ApiError && error.code === 'insufficient_balance') {
        showDialog({
          title: 'Insufficient Balance',
          tone: 'wallet',
          message: 'There is not enough in your wallet to start this consultation.',
          actions: [
            { label: 'Cancel', variant: 'secondary' },
            { label: 'Recharge Wallet', onPress: () => rechargeForChat(chatQuote?.ratePerMinute) },
          ],
        });
        return;
      }
      showDialog({
        title: `Could not start ${chatChannel}`,
        tone: 'error',
        message: error instanceof ApiError ? error.message : 'Something went wrong. Please try again.',
      });
    } finally {
      setSubmittingChat(false);
    }
  };

  /** Re-reads the rate, package quotes and balance the intake form prices from — at the chat or call rate, whichever was chosen. A failed read just leaves the form per-minute only. */
  const refreshChatQuote = useCallback(
    (astrologerId: string) => {
      precheckSession(astrologerId, chatChannel)
        .then(check => {
          setChatQuote(
            check.ratePerMinute > 0
              ? { ratePerMinute: check.ratePerMinute, packages: check.packages, balance: check.balance }
              : undefined,
          );
        })
        .catch(() => setChatQuote(undefined));
    },
    [chatChannel],
  );

  /** Fresh pricing every time the form opens — including after a recharge, or via the busy sheet's "Wait". */
  useEffect(() => {
    if (route === 'chatIntake' && chatWith?.id) {
      /** Never show a previous astrologer's (or a stale) price while the fresh one loads. */
      setChatQuote(undefined);
      refreshChatQuote(chatWith.id);
    }
  }, [route, chatWith?.id, refreshChatQuote]);

  /**
   * While the connecting card is up, find out how the astrologer answered.
   * The socket event is the fast path; the poll alongside it is only a
   * backstop for a dropped connection — it reads the same server state the
   * event would have carried, never a client guess, so the two can never
   * disagree about what "answered" means.
   */
  useEffect(() => {
    if (!connecting || !requestedChatId) {
      return;
    }

    const chatId = requestedChatId;

    const settle = (next: Route) => {
      setConnecting(false);
      setRequestedChatId(current => (current === chatId ? undefined : current));
      setRoute(next);
    };

    const unsubscribe = subscribeToRequest(chatId, {
      onAccepted: () => {
        setConnecting(false);
        setRoute('consultationChat');
      },
      onRejected: reason => {
        showDialog({
          title: 'Request declined',
          tone: 'info',
          message: reason || `${chatWith?.name ?? 'The astrologer'} is not available right now.`,
        });
        settle(chatOrigin);
      },
      onMissed: () => {
        showDialog({
          title: 'No answer',
          tone: 'info',
          message: `${chatWith?.name ?? 'The astrologer'} did not respond in time.`,
        });
        settle(chatOrigin);
      },
    });

    const poll = setInterval(async () => {
      try {
        const state = await getChatState(chatId);
        if (state.status === 'active') {
          setConnecting(false);
          setRoute('consultationChat');
        } else if (state.status !== 'requested') {
          settle(chatOrigin);
        }
      } catch {
        /** Transient — the next poll, or the socket event, will catch up. */
      }
    }, 5000);

    return () => {
      unsubscribe();
      clearInterval(poll);
    };
  }, [connecting, requestedChatId, chatOrigin, chatWith?.name, showDialog]);

  /**
   * A call is the same flow as a chat — the intake form, the request, the
   * wait for an answer — priced at the astrologer's call rate; once accepted,
   * the consultation opens in the voice-call layout instead of the transcript.
   */
  const startCall = (from: Route, target: Parameters<typeof startChat>[1]) =>
    startChat(from, target, 'call');

  /** Tabs without a screen yet stay put rather than routing nowhere. */
  const selectTab = (tab: TabKey) => {
    const next = TAB_ROUTES[tab];
    if (next) {
      setRoute(next);
    }
  };

  /** Held while the keystore is read; see the effect above. */
  if (route === 'restoring') {
    return (
      <SafeAreaProvider>
        <View style={styles.splash}>
          <ActivityIndicator color={colors.border.strong} />
        </View>
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      {route === 'welcome' && (
        <WelcomeScreen
          onLogin={() => setRoute('loginOptions')}
          onCreateAccount={() => setRoute('profileCreation')}
        />
      )}

      {route === 'loginOptions' && (
        <LoginOptionsScreen
          onBack={() => setRoute('welcome')}
          onContinueWithOtp={() => setRoute('otpLogin')}
          onContinueWithEmail={() => setRoute('emailLogin')}
          onRegister={() => setRoute('profileCreation')}
          onGooglePress={() =>
            comeBackLater('loginOptions', 'Google Sign-In', undefined, '🔑')
          }
          onApplePress={() =>
            comeBackLater('loginOptions', 'Apple Sign-In', undefined, '🔑')
          }
        />
      )}

      {route === 'otpLogin' && (
        <OtpLoginScreen
          onBack={() => setRoute('loginOptions')}
          onVerified={afterSignIn}
          onRegister={() => setRoute('profileCreation')}
          onGooglePress={() =>
            comeBackLater('otpLogin', 'Google Sign-In', undefined, '🔑')
          }
          onApplePress={() =>
            comeBackLater('otpLogin', 'Apple Sign-In', undefined, '🔑')
          }
        />
      )}

      {route === 'emailLogin' && (
        <EmailLoginScreen
          onBack={() => setRoute('loginOptions')}
          onVerified={afterSignIn}
          onRegister={() => setRoute('profileCreation')}
          onGooglePress={() =>
            comeBackLater('emailLogin', 'Google Sign-In', undefined, '🔑')
          }
          onApplePress={() =>
            comeBackLater('emailLogin', 'Apple Sign-In', undefined, '🔑')
          }
        />
      )}

      {route === 'profileCreation' && (
        <ProfileCreationScreen
          onContinue={(created, photo) => {
            setSignUp({ profile: created, photo });
            setBirthDetailsOrigin('profileCreation');
            setRoute('birthDetails');
          }}
          onPickPhoto={pickProfilePhoto}
          initialProfile={signUp?.profile}
          initialPhoto={signUp?.photo}
        />
      )}

      {route === 'birthDetails' && (
        <BirthDetailsScreen
          onBack={details => {
            setBirthDetailsDraft(details);
            setRoute(birthDetailsOrigin);
          }}
          onSave={saveBirthDetails}
          onGenerateKundli={generateKundli}
          initialDetails={birthDetailsDraft ?? profileBirthDetails}
        />
      )}

      {route === 'home' && (
        <HomeScreen
          activeTab="home"
          onSelectTab={selectTab}
          onSelectAstrologer={picked =>
            openAstrologer(
              {
                id: picked.id,
                name: picked.name,
                photo: picked.photo,
                online: picked.online,
                experience: picked.experience,
                rate: picked.rate,
                specialities: picked.speciality,
              },
              'home',
            )
          }
          onSeeAllAstrologers={() => setRoute('findAstrologers')}
          onSearchPress={() => setRoute('findAstrologers')}
          onNotificationsPress={() => push('notifications', 'home')}
          refreshKey={notificationsVersion}
          onProfilePress={() => setRoute('profile')}
          onAddFunds={() => {
            setRechargeReturnTo(undefined);
            setRoute('addMoney');
          }}
          onViewAllConsultations={() => push('pushedConsultations', 'home')}
          onSelectConsultation={() => push('pushedConsultations', 'home')}
          onOpenHoroscope={sign => {
            setHoroscopeSign(sign);
            setRoute('dailyHoroscope');
          }}
          onQuickAction={action => {
            if (action.id === 'generate-kundli') {
              setRoute('kundli');
            } else if (action.id === 'ai-astrology') {
              setRoute('aiChat');
            } else if (action.id === 'talk-to-astro') {
              setRoute('findAstrologers');
            }
          }}
        />
      )}

      {route === 'findAstrologers' && (
        <FindAstrologersScreen
          activeTab="home"
          onSelectTab={selectTab}
          onSelectAstrologer={picked =>
            openAstrologer(
              {
                id: picked.id,
                name: picked.name,
                photo: picked.photo,
                online: picked.online,
                experience: picked.experience,
                languages: picked.languages,
                rate: picked.rate,
                specialities: picked.specialities,
              },
              'findAstrologers',
            )
          }
          onChat={picked =>
            startChat('findAstrologers', {
              id: picked.id,
              name: picked.name,
              photo: picked.photo,
              wait: picked.wait,
              waitSeconds: picked.waitSeconds,
            })
          }
          onCall={picked =>
            startCall('findAstrologers', {
              id: picked.id,
              name: picked.name,
              photo: picked.photo,
              wait: picked.wait,
              waitSeconds: picked.waitSeconds,
            })
          }
        />
      )}

      {route === 'availableAstrologers' && (
        <AvailableAstrologersScreen
          activeTab="consult"
          onSelectTab={selectTab}
          onBack={() => setRoute('home')}
          onSelectAstrologer={picked =>
            openAstrologer(
              {
                id: picked.id,
                name: picked.name,
                photo: picked.photo,
                online: picked.online,
                experience: picked.experience,
                languages: picked.languages,
                rates: { was: picked.was, now: picked.now },
                wait: picked.wait,
              },
              'availableAstrologers',
            )
          }
          onSearch={() => setRoute('findAstrologers')}
          onConsult={(picked, mode) =>
            startChat(
              'availableAstrologers',
              {
                id: picked.id,
                name: picked.name,
                photo: picked.photo,
                wait: picked.wait,
                waitSeconds: picked.waitSeconds,
              },
              mode,
            )
          }
        />
      )}

      {route === 'astrologerDetail' && (
        <AstrologerDetailScreen
          astrologer={astrologer}
          onBack={() => setRoute(astrologerOrigin)}
          onChat={() =>
            startChat('astrologerDetail', {
              id: astrologer?.id ?? '',
              name: astrologer?.name ?? 'your astrologer',
              photo: astrologer?.photo,
              wait: astrologer?.wait,
              waitSeconds: astrologer?.waitSeconds,
            })
          }
          onCall={() =>
            startCall('astrologerDetail', {
              id: astrologer?.id ?? '',
              name: astrologer?.name ?? 'your astrologer',
              photo: astrologer?.photo,
              wait: astrologer?.wait,
              waitSeconds: astrologer?.waitSeconds,
            })
          }
        />
      )}

      {route === 'dailyHoroscope' && (
        <DailyHoroscopeScreen
          /** The rashi Home already worked out from their birth details. */
          sign={horoscopeSign}
          onBack={() => setRoute('home')}
          activeTab="home"
          onSelectTab={selectTab}
        />
      )}

      {route === 'aiChat' && (
        <AiAstrologyChatScreen onBack={() => setRoute('home')} />
      )}

      {route === 'wallet' && (
        <WalletScreen
          activeTab="wallet"
          onSelectTab={selectTab}
          onAddMoney={amount => {
            if (amount !== undefined) {
              setTopUp(amount);
            }
            setRechargeReturnTo(undefined);
            setRoute('addMoney');
          }}
          onViewAllTransactions={() => push('transactionHistory', 'wallet')}
        />
      )}

      {route === 'addMoney' && (
        <AddMoneyScreen
          initialAmount={topUp}
          onBack={() => {
            /** Backing out of a recharge started from the chat flow returns there, not to the wallet. */
            setRoute(rechargeReturnTo === 'chatIntake' && chatWith ? 'chatIntake' : 'wallet');
            setRechargeReturnTo(undefined);
          }}
          onProceed={amount => {
            beginTopUp(amount);
          }}
        />
      )}

      {route === 'payment' && (
        <PaymentScreen
          amount={topUp}
          onBack={() => setRoute('addMoney')}
          onPay={payForTopUp}
        />
      )}

      {route === 'paymentProcessing' && (
        <PaymentProcessingScreen />
      )}

      {route === 'profile' && (
        <ProfileScreen
          user={session?.user}
          profile={profile}
          onRefresh={refreshProfile}
          activeTab="profile"
          onSelectTab={selectTab}
          onLogout={handleLogout}
          onSelectMenu={key => {
            const destinations: Record<typeof key, Route> = {
              editProfile: 'editProfile',
              wallet: 'wallet',
              transactions: 'transactionHistory',
              consultations: 'pushedConsultations',
              notifications: 'notifications',
              aiAssistant: 'aiChat',
            };
            push(destinations[key], 'profile');
          }}
        />
      )}

      {route === 'editProfile' && (
        <EditProfileScreen
          initial={
            (profile || session) && {
              fullName: profile?.name ?? session?.user.name ?? '',
              email: profile?.email ?? session?.user.email ?? '',
              phone: profile?.phone ?? session?.user.phone ?? '',
              dateOfBirth: dobFromIso(profile?.birthDetails?.dateOfBirth),
              timeOfBirth: profile?.birthDetails?.timeOfBirth ?? '',
              placeOfBirth: profile?.birthDetails?.place?.formatted ?? '',
              gender: profile?.gender,
              avatarUrl: profile?.avatarUrl ?? session?.user.avatarUrl,
            }
          }
          onBack={() => setRoute('profile')}
          onSave={async (changes, photo) => {
            await saveProfileChanges(changes, photo);
            setRoute('profile');
          }}
          onPickPhoto={pickProfilePhoto}
        />
      )}

      {route === 'transactionHistory' && (
        <TransactionHistoryScreen onBack={() => setRoute(pushedOrigin)} />
      )}

      {/* The Consult tab: no back button, the bar is the way out. */}
      {route === 'consultationHistory' && (
        <ConsultationHistoryScreen
          activeTab="consult"
          onSelectTab={selectTab}
        />
      )}

      {/* Pushed from Home or the Profile menu, so it keeps that tab lit. */}
      {route === 'pushedConsultations' && (
        <ConsultationHistoryScreen
          activeTab={pushedOrigin === 'home' ? 'home' : 'profile'}
          onSelectTab={selectTab}
          onBack={() => setRoute(pushedOrigin)}
        />
      )}

      {route === 'notifications' && (
        <NotificationsScreen
          onBack={() => setRoute(pushedOrigin)}
          refreshKey={notificationsVersion}
          onOpen={openNotification}
        />
      )}

      {route === 'paymentSuccess' && (
        <PaymentSuccessScreen
          amount={topUp}
          receipt={topUpReceipt}
          onGoToWallet={() => {
            setRechargeReturnTo(undefined);
            setRoute('wallet');
          }}
          onBackToHome={() => {
            setRechargeReturnTo(undefined);
            setRoute('home');
          }}
          continueLabel={`Continue with ${chatWith?.name ?? 'your consultation'}`}
          onContinue={
            rechargeReturnTo === 'chatIntake' && chatWith
              ? () => {
                  setRechargeReturnTo(undefined);
                  /** Back to the form as it was — the pricing refreshes against the new balance on open. */
                  setRoute('chatIntake');
                }
              : undefined
          }
        />
      )}

      {route === 'kundli' && (
        <KundliScreen
          activeTab="kundli"
          onSelectTab={selectTab}
          onBack={() => setRoute('home')}
          /**
           * Always the account's own, never a stand-in: the name is known from
           * the restored session before the profile request has even been sent,
           * and anything still unknown is a dash. Gating the whole card on
           * `profile` is what left the tab showing the design fixture's person
           * until that request came back.
           */
          birthDetails={[
            { label: 'Name', value: profile?.name ?? session?.user.name ?? '—' },
            { label: 'Date', value: dobFromIso(profile?.birthDetails?.dateOfBirth) || '—' },
            { label: 'Time', value: profile?.birthDetails?.timeOfBirth || '—' },
            { label: 'Place', value: profile?.birthDetails?.place?.formatted || '—' },
          ]}
          hasKundli={Boolean(kundliProfileId)}
          generating={generatingFromSaved}
          onEditBirthDetails={() => {
            /**
             * `birthDetailsDraft` remembers an unsaved edit from the sign-up
             * wizard's own back-step (Birth Details -> Create Profile ->
             * back) — irrelevant here, and worse, would otherwise WIN over
             * `profileBirthDetails` below even when it's just an empty
             * object left over from an earlier, unrelated visit (`??` only
             * falls through on null/undefined, not on "has no real data").
             * Clearing it is what lets the account's real saved details
             * show through instead.
             */
            setBirthDetailsDraft(undefined);
            setBirthDetailsOrigin('kundli');
            setRoute('birthDetails');
          }}
          onGenerateKundli={() => {
            /** Already generated on this device — view it, at no extra cost, rather than asking the birth details again. */
            if (kundliProfileId) {
              setRoute('kundliResult');
              return;
            }
            generateFromSavedDetails();
          }}
        />
      )}

      {route === 'kundliResult' && kundliProfileId && (
        <KundliResultScreen
          profileId={kundliProfileId}
          activeTab="kundli"
          onSelectTab={selectTab}
          onBack={() => setRoute('kundli')}
          onDeepAnalysis={() => setRoute('astrologyAnalysis')}
          native={
            profile && {
              name: (profile.name ?? session?.user.name ?? '').split(' ')[0] || '',
              date: prettyDobFromIso(profile.birthDetails?.dateOfBirth),
              place: profile.birthDetails?.place?.city || profile.birthDetails?.place?.formatted || '',
            }
          }
        />
      )}

      {route === 'chatIntake' && (
        <ChatIntakeScreen
          astrologerName={chatWith?.name ?? 'your astrologer'}
          fullName={chatIntakeProfile.fullName || undefined}
          dateOfBirth={chatIntakeProfile.dateOfBirth || undefined}
          timeOfBirth={chatIntakeProfile.timeOfBirth || undefined}
          onBack={() => setRoute(chatOrigin)}
          onMyOrders={() => push('pushedConsultations', 'chatIntake')}
          onConnect={connectChat}
          channel={chatChannel}
          ratePerMinute={chatQuote?.ratePerMinute}
          packageQuotes={chatQuote?.packages}
          walletBalance={chatQuote?.balance}
          submitting={submittingChat}
          draft={chatWith && intakeDraft?.astrologerId === chatWith.id ? intakeDraft.draft : undefined}
          onDraftChange={draft => {
            if (chatWith) {
              setIntakeDraft({ astrologerId: chatWith.id, draft });
            }
          }}
        />
      )}

      {/* Asked before the form when the astrologer is still counting down. */}
      <AstrologerBusyDialog
        visible={busyShown}
        name={chatWith?.name ?? 'This astrologer'}
        busyFor={busyForLabel({ busy: true, waitSeconds: chatWith?.waitSeconds })}
        onWait={() => {
          setBusyShown(false);
          setRoute('chatIntake');
        }}
        onChooseOthers={() => {
          setBusyShown(false);
          setRoute('availableAstrologers');
        }}
        onDismiss={() => setBusyShown(false)}
      />

      {/*
       * Raised once "Connect With …" has asked the astrologer for a chat.
       * `seconds`/`onTick` are cosmetic — the countdown they draw is just how
       * long the request is allowed to sit unanswered; what actually ends the
       * wait is one of the three events the effect above listens for.
       */}
      <ConnectingDialog
        visible={connecting}
        name={chatWith?.name ?? 'your astrologer'}
        photo={chatWith?.photo}
        seconds={waitLeft}
        channel={chatChannel}
        onCancel={() => {
          // The design shows the decline sheet over the form, not the card.
          setConnecting(false);
          setDeclining(true);
        }}
        onTick={setWaitLeft}
      />

      {/* The cross under the connecting card asks before dropping the request. */}
      <DeclineChatDialog
        visible={declining}
        onStay={() => {
          setDeclining(false);
          setConnecting(true);
        }}
        onDecline={() => {
          setDeclining(false);
          setConnecting(false);
          if (requestedChatId) {
            const cancelledChatId = requestedChatId;
            setRequestedChatId(undefined);
            cancelChat(cancelledChatId).catch(() => {
              /** Nothing the seeker can do about it — the server ages the request out on its own either way. */
            });
          }
          setRoute(chatOrigin);
        }}
        onDismiss={() => setDeclining(false)}
      />

      {route === 'consultationChat' && requestedChatId && (
        <ConsultationChatScreen
          chatId={requestedChatId}
          astrologerName={chatWith?.name ?? 'your astrologer'}
          photo={chatWith?.photo}
          onEnd={() => {
            setRequestedChatId(undefined);
            setRoute(chatOrigin);
          }}
          onStartNewChat={() => {
            setRequestedChatId(undefined);
            /** A session reopened from a notification may not know who it was with (see openConsultation) — nobody to send a new request to. */
            if (chatWith?.id) {
              startChat(chatOrigin, chatWith, chatChannel);
            } else {
              setRoute(chatOrigin);
            }
          }}
        />
      )}

      {route === 'comingSoon' && (
        <ComingSoonScreen
          title={pending.title}
          detail={pending.detail}
          glyph={pending.glyph}
          onBack={() => setRoute(pendingOrigin)}
          onBackToHome={() => setRoute('home')}
        />
      )}

      {route === 'astrologyAnalysis' && kundliProfileId && (
        <AstrologyAnalysisScreen
          profileId={kundliProfileId}
          onSelectTab={selectTab}
          onBack={() => setRoute('kundliResult')}
        />
      )}

      {/**
        * Last in the tree, so it sits over whichever screen is showing: one
        * dialog for every message this file used to hand to the OS.
        */}
      <AppDialog request={dialogRequest} onDismiss={dismissDialog} />
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  splash: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
  },
});

export default App;
