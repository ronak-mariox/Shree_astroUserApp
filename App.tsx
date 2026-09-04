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
import { confirmTopUp, fetchProfile, rupees, saveProfile, startTopUp } from './src/services/api';
import { ApiError } from './src/services/client';
import { paymentMethods, type PaymentMethodId } from './src/data/wallet';
import {
  onSessionChange,
  restoreSession,
  updateUser,
  type Session,
} from './src/services/session';
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
import { intakeSummary, waitSeconds } from './src/data/chatIntake';
import { wallet } from './src/data/wallet';
import { FindAstrologersScreen } from './src/screens/FindAstrologersScreen';
import { BirthDetailsScreen } from './src/screens/BirthDetailsScreen';
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
   * The chat request in flight: who it is for, whether they are still counting
   * down a wait, and where the flow was entered from.
   */
  const [chatWith, setChatWith] = useState<{
    id: string;
    name: string;
    photo?: AstrologerSummary['photo'];
    wait?: string;
  }>();
  const [chatOrigin, setChatOrigin] = useState<Route>('availableAstrologers');
  const [busyShown, setBusyShown] = useState(false);
  const [connecting, setConnecting] = useState(false);
  /** Raised by the cross under the connecting card. */
  const [declining, setDeclining] = useState(false);
  /** Seconds left on the request, so declining "No" resumes where it paused. */
  const [waitLeft, setWaitLeft] = useState(0);
  /** The birth details the intake filed, opening the conversation. */
  const [intakeLines, setIntakeLines] = useState<ReadonlyArray<string>>();
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
        if (!next) {
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

  /** Clears the keystore first, so "logged out" is true before it is drawn. */
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
   * straight to the intake form (node 180:93411).
   */
  const startChat = (
    from: Route,
    target: {
      /** Who the request goes to. */
      id: string;
      name: string;
      photo?: AstrologerSummary['photo'];
      wait?: string;
    },
  ) => {
    setChatWith(target);
    setChatOrigin(from);
    if (target.wait !== undefined && target.wait !== '') {
      setBusyShown(true);
      return;
    }
    setRoute('chatIntake');
  };

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
            setRoute('birthDetails');
          }}
          onPickPhoto={pickProfilePhoto}
        />
      )}

      {route === 'birthDetails' && (
        <BirthDetailsScreen
          onBack={() => setRoute('profileCreation')}
          onSave={saveBirthDetails}
          onGenerateKundli={() => setRoute('kundli')}
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
          onAddFunds={() => setRoute('addMoney')}
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
            setRoute('addMoney');
          }}
          onViewAllTransactions={() => push('transactionHistory', 'wallet')}
        />
      )}

      {route === 'addMoney' && (
        <AddMoneyScreen
          initialAmount={topUp}
          onBack={() => setRoute('wallet')}
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
          onGoToWallet={() => setRoute('wallet')}
          onBackToHome={() => setRoute('home')}
        />
      )}

      {route === 'kundli' && (
        <KundliScreen
          activeTab="kundli"
          onSelectTab={selectTab}
          onBack={() => setRoute('home')}
          onEditBirthDetails={() => setRoute('birthDetails')}
          onGenerateKundli={() => setRoute('kundliResult')}
        />
      )}

      {route === 'kundliResult' && (
        <KundliResultScreen
          activeTab="kundli"
          onSelectTab={selectTab}
          onBack={() => setRoute('kundli')}
          onDeepAnalysis={() => setRoute('astrologyAnalysis')}
        />
      )}

      {route === 'chatIntake' && (
        <ChatIntakeScreen
          astrologerName={chatWith?.name ?? 'your astrologer'}
          onBack={() => setRoute(chatOrigin)}
          onMyOrders={() => push('pushedConsultations', 'chatIntake')}
          onConnect={intake => {
            setIntakeLines(intakeSummary(intake));
            setWaitLeft(waitSeconds(chatWith?.wait));
            setConnecting(true);
          }}
        />
      )}

      {/* Asked before the form when the astrologer is still counting down. */}
      <AstrologerBusyDialog
        visible={busyShown}
        name={chatWith?.name ?? 'This astrologer'}
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

      {/* Raised by the form's "Connect With …" button. */}
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
        onConnected={() => {
          setConnecting(false);
          setRoute('consultationChat');
        }}
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
          setRoute(chatOrigin);
        }}
        onDismiss={() => setDeclining(false)}
      />

      {route === 'consultationChat' && (
        <ConsultationChatScreen
          astrologerName={chatWith?.name ?? 'your astrologer'}
          photo={chatWith?.photo}
          walletBalance={wallet.balance}
          intakeLines={intakeLines}
          onWalletPress={() => push('wallet', 'consultationChat')}
          onEnd={() => setRoute(chatOrigin)}
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

      {route === 'astrologyAnalysis' && (
        <AstrologyAnalysisScreen
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
