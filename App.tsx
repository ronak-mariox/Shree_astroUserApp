/**
 * Shree Astro
 *
 * @format
 */

import React, { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import type { TabKey } from './src/components/BottomTabBar';
import type { BirthDetails } from './src/screens/BirthDetailsScreen';
import type { Profile } from './src/screens/ProfileCreationScreen';
import { register, signOut, type PhotoAsset } from './src/services/auth';
import {
  onSessionChange,
  restoreSession,
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
import { EditProfileScreen } from './src/screens/EditProfileScreen';
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

function App() {
  const [route, setRoute] = useState<Route>('restoring');
  /** Who is signed in, mirrored from the session store for the shell to read. */
  const [session, setSession] = useState<Session | null>(null);
  /** Amount carried through the wallet top-up flow. */
  const [topUp, setTopUp] = useState(200);
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
      setRoute(restored ? 'home' : 'welcome');
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

  /** Signing in from any flow lands in the same place. */
  const enterApp = () => setRoute('home');

  /** Clears the keystore first, so "logged out" is true before it is drawn. */
  const handleLogout = async () => {
    await signOut();
    setRoute('welcome');
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
          onVerified={enterApp}
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
          onVerified={enterApp}
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
            setTopUp(amount);
            setRoute('payment');
          }}
        />
      )}

      {route === 'payment' && (
        <PaymentScreen
          amount={topUp}
          onBack={() => setRoute('addMoney')}
          onPay={() => setRoute('paymentProcessing')}
        />
      )}

      {route === 'paymentProcessing' && (
        <PaymentProcessingScreen
          onSettled={() => setRoute('paymentSuccess')}
        />
      )}

      {route === 'profile' && (
        <ProfileScreen
          user={session?.user}
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
          onBack={() => setRoute('profile')}
          onSave={() => setRoute('profile')}
          onPickPhoto={() =>
            comeBackLater(
              'editProfile',
              'Profile Photo',
              'Uploading a photo from your camera or gallery is on its way.',
              '📷',
            )
          }
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
