/**
 * Shree Astro
 *
 * @format
 */

import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import type { TabKey } from './src/components/BottomTabBar';
import type { BirthDetails } from './src/screens/BirthDetailsScreen';
import type { Profile } from './src/screens/ProfileCreationScreen';
import type { Receipt } from './src/screens/PaymentSuccessScreen';
import { register, signOut, type AuthSession, type PhotoAsset } from './src/services/auth';
import {
  cancelChat,
  confirmTopUp,
  connectLiveUpdates,
  createBirthProfile,
  fetchCurrentKundli,
  disconnectLiveUpdates,
  fetchProfile,
  getChatState,
  precheckSession,
  requestChat,
  rupees,
  saveProfile,
  startTopUp,
  subscribeToRequest,
  type Intake,
} from './src/services/api';
import { toPackageBooking, type PackageQuote } from './src/data/consultPackages';
import { busyForLabel } from './src/data/availability';
import { ApiError } from './src/services/client';
import { paymentMethods, type PaymentMethodId } from './src/data/wallet';
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
import type { AstrologerSummary } from './src/data/astrologerProfile';
import { AddMoneyScreen } from './src/screens/AddMoneyScreen';
import { AiAstrologyChatScreen } from './src/screens/AiAstrologyChatScreen';
import { AstrologerDetailScreen } from './src/screens/AstrologerDetailScreen';
import { AstrologyAnalysisScreen } from './src/screens/AstrologyAnalysisScreen';
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
  /** Amount carried through the wallet top-up flow. */
  const [topUp, setTopUp] = useState(200);
  /** The pending row `startTopUp` opened — what `confirmTopUp` settles. */
  const [topUpTransactionId, setTopUpTransactionId] = useState<string>();
  /** Cosmetic today (no gateway to actually route through) but recorded on the transaction. */
  const [topUpMethod, setTopUpMethod] = useState<PaymentMethodId>();
  /** What `confirmTopUp` came back with, for the receipt screen to print. */
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
        setRoute(restored.user.profileComplete !== false ? 'home' : 'editProfile');
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
   * sign-in never opens a new account), so this always routes them to Home.
   * A first-time Apple/Google sign-in can come back `false` — that account
   * was opened with only what the provider handed over, nothing astrology
   * related — so this sends it to Edit Profile instead, pre-filled with
   * whatever is known, to collect the rest before Home.
   */
  const afterSignIn = (signedIn: AuthSession) => {
    setRoute(signedIn.user.profileComplete !== false ? 'home' : 'editProfile');
  };

  /**
   * Clears the keystore first, so "logged out" is true before it is drawn.
   * `signOut()` ends the session, which the `onSessionChange` listener above
   * turns into the rest of sign-out — clearing the kundli pointer included —
   * the same way it does for a forced sign-out.
   */
  const handleLogout = async () => {
    await signOut();
    setRoute('welcome');
  };

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
   * There is no payment gateway behind this yet — see the doc comment on
   * services/wallet.service.js on the backend — so `startTopUp` opens a
   * pending row and `confirmTopUp` (called from PaymentProcessingScreen's
   * `onSettled`) credits the wallet immediately. Both calls exist as the
   * two-step shape a real gateway would need, so wiring one in later is
   * filling the gap between them, not a rewrite.
   */
  const beginTopUp = async (amount: number) => {
    try {
      const order = await startTopUp(amount);
      setTopUpTransactionId(order.transactionId);
      setTopUp(amount);
      setRoute('payment');
    } catch (error) {
      Alert.alert(
        'Could not start top-up',
        error instanceof ApiError ? error.message : 'Something went wrong. Please try again.',
      );
    }
  };

  /** Called by PaymentProcessingScreen once its interstitial beat is done. */
  const settleTopUp = async () => {
    if (!topUpTransactionId) {
      setRoute('payment');
      return;
    }

    const methodLabel = paymentMethods.find(option => option.id === topUpMethod)?.name ?? '—';
    const transaction = await confirmTopUp(topUpTransactionId, undefined, methodLabel);
    const amount = transaction.amount ?? topUp;
    const balanceAfter = transaction.balanceAfter ?? amount;

    setTopUpReceipt({
      transactionId: transaction.reference ?? transaction.id ?? topUpTransactionId,
      method: transaction.method ?? methodLabel,
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
    setTopUpTransactionId(undefined);
    setRoute('paymentSuccess');
  };

  /** A confirmTopUp failure — the interstitial's beat already ran; explain and go back. */
  const failTopUp = (message: string) => {
    Alert.alert('Payment failed', message);
    setRoute('payment');
  };

  /**
   * Saving birth details registers the account when the user got here through
   * sign-up; reached from the profile instead, it is only an edit. Errors are
   * left to reject so the screen can keep the user on the form and print them.
   */
  const saveBirthDetails = async (details: BirthDetails) => {
    if (signUp) {
      await register({ profile: signUp.profile, birth: details, photo: signUp.photo });
      setSignUp(undefined);
    }
    setRoute('home');
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
  ) => {
    setChatWith(target);
    setChatOrigin(from);
    if (target.wait !== undefined && target.wait !== '') {
      setBusyShown(true);
      return;
    }

    try {
      const check = await precheckSession(target.id, 'chat');
      if (!check.astrologerAvailable) {
        setBusyShown(true);
        return;
      }
      if (!check.ok) {
        const minuteWord = check.minSessionMinutes === 1 ? 'minute' : 'minutes';
        Alert.alert(
          'Insufficient Balance',
          `You need at least ${rupees(check.shortfallAmount)} more in your wallet to start this chat (minimum ${check.minSessionMinutes} ${minuteWord}). Please recharge your wallet to continue.`,
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Recharge Wallet', onPress: () => rechargeForChat(check.shortfallAmount) },
          ],
        );
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
      const request = await requestChat(chatWith.id, toApiIntake(intake), 'chat', billing);
      setIntakeDraft(undefined);
      setRequestedChatId(request.chatId);
      setWaitLeft(request.expiresInSeconds);
      setConnecting(true);
    } catch (error) {
      if (billing && error instanceof ApiError && error.code === 'insufficient_balance') {
        const shortfall = Number(error.details?.shortfallAmount ?? 0);
        const price = Number(error.details?.price ?? billing.quotedPrice);
        Alert.alert(
          'Insufficient Balance',
          `The ${billing.packageMinutes}-minute package costs ${rupees(price)}. You need ${rupees(shortfall)} more in your wallet. Please recharge to continue.`,
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Recharge Wallet', onPress: () => rechargeForChat(shortfall) },
          ],
        );
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
        Alert.alert(
          'Price updated',
          `The ${billing.packageMinutes}-minute package now costs ${rupees(newPrice)}.`,
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: `Pay ${rupees(newPrice)}`,
              onPress: () => {
                connectChat({ ...intake, consultation: { mode: 'package', minutes: billing.packageMinutes, price: newPrice } });
              },
            },
          ],
        );
        return;
      }
      if (error instanceof ApiError && error.code === 'insufficient_balance') {
        Alert.alert(
          'Insufficient Balance',
          'You have insufficient funds to start this consultation. Please recharge your wallet to continue.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Recharge Wallet', onPress: () => rechargeForChat(chatQuote?.ratePerMinute) },
          ],
        );
        return;
      }
      Alert.alert(
        'Could not start chat',
        error instanceof ApiError ? error.message : 'Something went wrong. Please try again.',
      );
    } finally {
      setSubmittingChat(false);
    }
  };

  /** Re-reads the rate, package quotes and balance the intake form prices from. A failed read just leaves the form per-minute only. */
  const refreshChatQuote = (astrologerId: string) => {
    precheckSession(astrologerId, 'chat')
      .then(check => {
        setChatQuote(
          check.ratePerMinute > 0
            ? { ratePerMinute: check.ratePerMinute, packages: check.packages, balance: check.balance }
            : undefined,
        );
      })
      .catch(() => setChatQuote(undefined));
  };

  /** Fresh pricing every time the form opens — including after a recharge, or via the busy sheet's "Wait". */
  useEffect(() => {
    if (route === 'chatIntake' && chatWith?.id) {
      /** Never show a previous astrologer's (or a stale) price while the fresh one loads. */
      setChatQuote(undefined);
      refreshChatQuote(chatWith.id);
    }
  }, [route, chatWith?.id]);

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
        Alert.alert('Request declined', reason || `${chatWith?.name ?? 'The astrologer'} is not available right now.`);
        settle(chatOrigin);
      },
      onMissed: () => {
        Alert.alert('No answer', `${chatWith?.name ?? 'The astrologer'} did not respond in time.`);
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
  }, [connecting, requestedChatId, chatOrigin, chatWith?.name]);

  /** Call is still the same promise wherever it is pressed. */
  const startCall = (from: Route, name?: string) =>
    comeBackLater(
      from,
      `Call ${name ?? 'your astrologer'}`,
      'Voice consultations are being built. You will be able to call an astrologer straight from here.',
      '📞',
    );

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
          onContinue={(profile, photo) => {
            setSignUp({ profile, photo });
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
          onProfilePress={() => setRoute('profile')}
          onAddFunds={() => {
            setRechargeReturnTo(undefined);
            setRoute('addMoney');
          }}
          onViewAllConsultations={() => push('pushedConsultations', 'home')}
          onSelectConsultation={() => push('pushedConsultations', 'home')}
          onOpenHoroscope={() =>
            comeBackLater(
              'home',
              'Daily Horoscope',
              'The full reading for your sign gets its own screen soon. The highlights are on the home card meanwhile.',
              '🔮',
            )
          }
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
          onCall={picked => startCall('findAstrologers', picked.name)}
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
            mode === 'chat'
              ? startChat('availableAstrologers', {
                  id: picked.id,
                  name: picked.name,
                  photo: picked.photo,
                  wait: picked.wait,
                  waitSeconds: picked.waitSeconds,
                })
              : startCall('availableAstrologers', picked.name)
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
          onCall={() => startCall('astrologerDetail', astrologer?.name)}
          onMoreOptions={() =>
            comeBackLater(
              'astrologerDetail',
              'More Options',
              'Sharing, reporting and blocking an astrologer arrive with the consultation release.',
              '⋯',
            )
          }
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
          onPay={method => {
            setTopUpMethod(method);
            setRoute('paymentProcessing');
          }}
        />
      )}

      {route === 'paymentProcessing' && (
        <PaymentProcessingScreen onSettled={settleTopUp} onFailed={failTopUp} />
      )}

      {route === 'profile' && (
        <ProfileScreen
          user={session?.user}
          profile={profile}
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
        <NotificationsScreen onBack={() => setRoute(pushedOrigin)} />
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
          birthDetails={
            profile && [
              { label: 'Name', value: profile.name ?? session?.user.name ?? '—' },
              { label: 'Date', value: dobFromIso(profile.birthDetails?.dateOfBirth) || '—' },
              { label: 'Time', value: profile.birthDetails?.timeOfBirth || '—' },
              { label: 'Place', value: profile.birthDetails?.place?.formatted || '—' },
            ]
          }
          hasKundli={Boolean(kundliProfileId)}
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
            setBirthDetailsDraft(undefined);
            setBirthDetailsOrigin('kundli');
            setRoute('birthDetails');
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
          channel="chat"
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
            if (chatWith) {
              startChat(chatOrigin, chatWith);
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
