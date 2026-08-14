/**
 * Shree Astro
 *
 * @format
 */

import React, { useState } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import type { TabKey } from './src/components/BottomTabBar';
import { AddMoneyScreen } from './src/screens/AddMoneyScreen';
import { AiAstrologyChatScreen } from './src/screens/AiAstrologyChatScreen';
import { AstrologerDetailScreen } from './src/screens/AstrologerDetailScreen';
import { AstrologyAnalysisScreen } from './src/screens/AstrologyAnalysisScreen';
import { AvailableAstrologersScreen } from './src/screens/AvailableAstrologersScreen';
import { ConsultationHistoryScreen } from './src/screens/ConsultationHistoryScreen';
import { EditProfileScreen } from './src/screens/EditProfileScreen';
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
 */
type Route =
  | 'welcome'
  | 'loginOptions'
  | 'otpLogin'
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
  | 'profileConsultations'
  | 'notifications'
  | 'findAstrologers'
  | 'astrologerDetail'
  | 'availableAstrologers';

/** The bottom-navigation tabs that have a screen behind them so far. */
const TAB_ROUTES: Partial<Record<TabKey, Route>> = {
  home: 'home',
  kundli: 'kundli',
  consult: 'availableAstrologers',
  wallet: 'wallet',
  profile: 'profile',
};

function App() {
  const [route, setRoute] = useState<Route>('welcome');
  /** Amount carried through the wallet top-up flow. */
  const [topUp, setTopUp] = useState(200);

  /** Tabs without a screen yet stay put rather than routing nowhere. */
  const selectTab = (tab: TabKey) => {
    const next = TAB_ROUTES[tab];
    if (next) {
      setRoute(next);
    }
  };

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
          onRegister={() => setRoute('profileCreation')}
        />
      )}

      {route === 'otpLogin' && (
        <OtpLoginScreen
          onBack={() => setRoute('loginOptions')}
          onVerified={() => setRoute('home')}
        />
      )}

      {route === 'profileCreation' && (
        <ProfileCreationScreen onContinue={() => setRoute('birthDetails')} />
      )}

      {route === 'birthDetails' && (
        <BirthDetailsScreen
          onBack={() => setRoute('profileCreation')}
          onSave={() => setRoute('home')}
          onGenerateKundli={() => setRoute('kundli')}
        />
      )}

      {route === 'home' && (
        <HomeScreen
          activeTab="home"
          onSelectTab={selectTab}
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
          onSelectAstrologer={() => setRoute('astrologerDetail')}
        />
      )}

      {route === 'availableAstrologers' && (
        <AvailableAstrologersScreen
          activeTab="consult"
          onSelectTab={selectTab}
          onBack={() => setRoute('home')}
          onSelectAstrologer={() => setRoute('astrologerDetail')}
        />
      )}

      {route === 'astrologerDetail' && (
        <AstrologerDetailScreen onBack={() => setRoute('findAstrologers')} />
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
          activeTab="profile"
          onSelectTab={selectTab}
          onLogout={() => setRoute('welcome')}
          onSelectMenu={key => {
            const destinations: Record<typeof key, Route> = {
              editProfile: 'editProfile',
              wallet: 'wallet',
              transactions: 'transactionHistory',
              consultations: 'profileConsultations',
              notifications: 'notifications',
              aiAssistant: 'aiChat',
            };
            setRoute(destinations[key]);
          }}
        />
      )}

      {route === 'editProfile' && (
        <EditProfileScreen
          onBack={() => setRoute('profile')}
          onSave={() => setRoute('profile')}
        />
      )}

      {route === 'transactionHistory' && (
        <TransactionHistoryScreen onBack={() => setRoute('profile')} />
      )}

      {/* The Consult tab: no back button, the bar is the way out. */}
      {route === 'consultationHistory' && (
        <ConsultationHistoryScreen
          activeTab="consult"
          onSelectTab={selectTab}
        />
      )}

      {/* Pushed from the Profile menu, so it keeps Profile lit and goes back. */}
      {route === 'profileConsultations' && (
        <ConsultationHistoryScreen
          activeTab="profile"
          onSelectTab={selectTab}
          onBack={() => setRoute('profile')}
        />
      )}

      {route === 'notifications' && (
        <NotificationsScreen onBack={() => setRoute('profile')} />
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

      {route === 'astrologyAnalysis' && (
        <AstrologyAnalysisScreen
          onSelectTab={selectTab}
          onBack={() => setRoute('kundliResult')}
        />
      )}
    </SafeAreaProvider>
  );
}

export default App;
