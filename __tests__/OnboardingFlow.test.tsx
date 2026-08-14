import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { PrimaryButton } from '../src/components/PrimaryButton';
import { TextInput } from 'react-native';

import { GenderSelector } from '../src/components/GenderSelector';
import { AddMoneyScreen } from '../src/screens/AddMoneyScreen';
import { AiAstrologyChatScreen } from '../src/screens/AiAstrologyChatScreen';
import { AstrologerDetailScreen } from '../src/screens/AstrologerDetailScreen';
import { AstrologyAnalysisScreen } from '../src/screens/AstrologyAnalysisScreen';
import { AvailableAstrologersScreen } from '../src/screens/AvailableAstrologersScreen';
import { ConsultationHistoryScreen } from '../src/screens/ConsultationHistoryScreen';
import { EditProfileScreen } from '../src/screens/EditProfileScreen';
import { FindAstrologersScreen } from '../src/screens/FindAstrologersScreen';
import { NotificationsScreen } from '../src/screens/NotificationsScreen';
import { ProfileScreen } from '../src/screens/ProfileScreen';
import { TransactionHistoryScreen } from '../src/screens/TransactionHistoryScreen';
import { BirthDetailsScreen } from '../src/screens/BirthDetailsScreen';
import { HomeScreen } from '../src/screens/HomeScreen';
import { KundliResultScreen } from '../src/screens/KundliResultScreen';
import { KundliScreen } from '../src/screens/KundliScreen';
import { LoginOptionsScreen } from '../src/screens/LoginOptionsScreen';
import { OtpLoginScreen } from '../src/screens/OtpLoginScreen';
import { PaymentProcessingScreen } from '../src/screens/PaymentProcessingScreen';
import { PaymentScreen } from '../src/screens/PaymentScreen';
import { PaymentSuccessScreen } from '../src/screens/PaymentSuccessScreen';
import { ProfileCreationScreen } from '../src/screens/ProfileCreationScreen';
import { WalletScreen } from '../src/screens/WalletScreen';

const METRICS = {
  frame: { x: 0, y: 0, width: 390, height: 844 },
  insets: { top: 47, left: 0, right: 0, bottom: 34 },
};

/** Concatenated visible text — interpolated values render as split children. */
const textOf = (tree: ReactTestRenderer.ReactTestRenderer): string => {
  const walk = (node: any): string => {
    if (node === null || node === undefined) return '';
    if (typeof node === 'string') return node;
    if (Array.isArray(node)) return node.map(walk).join('');
    if (typeof node === 'object') return walk(node.children);
    return '';
  };
  return walk(tree.toJSON());
};

/**
 * The five bottom-navigation tabs. Host views only (Pressable also surfaces the
 * role on its composite node), and the last five — some screens carry their own
 * in-page tabs, which render above the bar.
 */
const findTabs = (tree: ReactTestRenderer.ReactTestRenderer) =>
  tree.root
    .findAll(
      n => typeof n.type === 'string' && n.props.accessibilityRole === 'tab',
    )
    .slice(-5);

const render = async (element: React.ReactElement) => {
  let tree!: ReactTestRenderer.ReactTestRenderer;
  await ReactTestRenderer.act(() => {
    tree = ReactTestRenderer.create(
      <SafeAreaProvider initialMetrics={METRICS}>{element}</SafeAreaProvider>,
    );
  });
  return tree;
};

test('login options renders every method', async () => {
  const tree = await render(<LoginOptionsScreen />);
  const dump = JSON.stringify(tree.toJSON());
  expect(dump).toContain('Welcome Back');
  expect(dump).toContain('Continue with OTP');
  expect(dump).toContain('Continue with Email');
  expect(dump).toContain('Continue with Google');
  expect(dump).toContain('Continue with Apple');
});

test('otp screen moves from the inert state to the sent state', async () => {
  const tree = await render(<OtpLoginScreen />);
  expect(JSON.stringify(tree.toJSON())).toContain(
    'Send OTP first to enable this section',
  );

  const buttons = tree.root.findAllByType(PrimaryButton);
  expect(buttons[1].props.disabled).toBe(true); // Verify & Continue

  await ReactTestRenderer.act(() => {
    buttons[0].props.onPress(); // Send OTP
  });

  const dump = JSON.stringify(tree.toJSON());
  expect(dump).toContain('6-digit code sent to +91');
  expect(dump).toContain('OTP Sent');
  expect(tree.root.findAllByType(PrimaryButton)[1].props.disabled).toBe(false);
});

test('profile creation renders and selects a gender', async () => {
  const tree = await render(<ProfileCreationScreen />);
  const dump = JSON.stringify(tree.toJSON());
  expect(dump).toContain('Create Profile');
  expect(dump).toContain('Tell us about yourself');
  expect(dump).toContain('Continue →');

  const male = tree.root
    .findAllByType(GenderSelector)[0]
    .findAll(n => n.props.accessibilityRole === 'radio')[0];
  expect(male.props.accessibilityState.selected).toBe(false);

  await ReactTestRenderer.act(() => {
    male.props.onPress();
  });

  expect(
    tree.root
      .findAllByType(GenderSelector)[0]
      .findAll(n => n.props.accessibilityRole === 'radio')[0].props
      .accessibilityState.selected,
  ).toBe(true);
});

test('birth details renders its fields and summary', async () => {
  const tree = await render(<BirthDetailsScreen />);
  const dump = JSON.stringify(tree.toJSON());
  expect(dump).toContain('Birth Details');
  expect(dump).toContain('Date of Birth');
  expect(dump).toContain('Time of Birth');
  expect(dump).toContain('Place of Birth');
  expect(dump).toContain('BIRTH DETAILS SUMMARY');
  expect(dump).toContain('IST (UTC+5:30)');
  expect(dump).toContain('Generate Kundli');
  expect(dump).toContain('Save & Continue →');
});

test('home renders every section', async () => {
  const tree = await render(<HomeScreen />);
  const dump = JSON.stringify(tree.toJSON());
  expect(dump).toContain('Arjun Sharma');
  expect(dump).toContain('WALLET BALANCE');
  expect(dump).toContain('₹ 1,250');
  expect(dump).toContain('Daily Horoscope');
  expect(dump).toContain('Quick Actions');
  expect(dump).toContain('Top Astrologers');
  expect(dump).toContain('Planet Positions');
  expect(dump).toContain('Recent Consultations');
  // Bottom navigation, with Home selected.
  const tabs = findTabs(tree);
  expect(tabs).toHaveLength(5);
  expect(tabs[0].props.accessibilityState.selected).toBe(true);
  expect(tabs[1].props.accessibilityState.selected).toBe(false);
});

test('kundli renders the stored birth details', async () => {
  const tree = await render(<KundliScreen />);
  const dump = JSON.stringify(tree.toJSON());
  expect(dump).toContain('Birth Chart');
  expect(dump).toContain('Birth Details');
  expect(dump).toContain('15 August 1995');
  expect(dump).toContain('06:30 AM IST');
  expect(dump).toContain('Mumbai, Maharashtra');
  expect(dump).toContain('Edit Birth Details');
  expect(dump).toContain('Generate Kundli');

  const tabs = findTabs(tree);
  expect(tabs[1].props.accessibilityState.selected).toBe(true);
});

/** Composite Pressable nodes carry onPress; host views only mirror the a11y props. */
const findPressable = (
  tree: ReactTestRenderer.ReactTestRenderer,
  label: string,
) =>
  tree.root.findAll(
    n =>
      typeof n.type !== 'string' &&
      typeof n.props.onPress === 'function' &&
      n.props.accessibilityLabel === label,
  )[0];

const sendState = (tree: ReactTestRenderer.ReactTestRenderer) =>
  tree.root.findAll(
    n => typeof n.type === 'string' && n.props.accessibilityLabel === 'Send',
  )[0].props.accessibilityState.disabled;

test('ai chat greets and offers starter prompts', async () => {
  const tree = await render(<AiAstrologyChatScreen />);
  const dump = JSON.stringify(tree.toJSON());
  expect(dump).toContain('AI Astrology Assistant');
  expect(dump).toContain('Online');
  expect(dump).toContain('Namaste!');
  expect(dump).toContain('What does my Jupiter placement mean?');
  expect(dump).toContain('Tell me about my Lagna lord');
  expect(dump).toContain('Ask about your stars...');
});

test('send stays disabled until the draft has content, then posts it', async () => {
  const tree = await render(<AiAstrologyChatScreen />);
  expect(sendState(tree)).toBe(true);

  const input = tree.root.findAllByType(TextInput)[0];
  await ReactTestRenderer.act(() => {
    input.props.onChangeText('Will Mercury retrograde affect me?');
  });
  expect(sendState(tree)).toBe(false);

  await ReactTestRenderer.act(() => {
    findPressable(tree, 'Send').props.onPress();
  });

  expect(JSON.stringify(tree.toJSON())).toContain(
    'Will Mercury retrograde affect me?',
  );
  // Draft cleared, so the composer falls back to disabled.
  expect(sendState(tree)).toBe(true);
});

test('tapping a suggested prompt appends it to the transcript', async () => {
  const tree = await render(<AiAstrologyChatScreen />);
  const prompt = 'Is 2026 good for career growth?';

  const chip = tree.root.findAll(
    n =>
      typeof n.type !== 'string' &&
      typeof n.props.onPress === 'function' &&
      n.props.children?.props?.children === prompt,
  )[0];

  await ReactTestRenderer.act(() => {
    chip.props.onPress();
  });

  // Once as the chip, once as the posted message.
  const dump = JSON.stringify(tree.toJSON());
  expect(dump.split(prompt)).toHaveLength(3);
});

test('generated kundli renders every analysis block', async () => {
  const tree = await render(<KundliResultScreen />);
  const dump = JSON.stringify(tree.toJSON());

  // Chart: house numbers, planet abbreviations and the native's details.
  expect(dump).toContain('Arjun');
  expect(dump).toContain('15 Aug 1995');
  expect(dump).toContain('Mumbai');
  expect(dump).toContain('As');
  expect(dump).toContain('Ke');

  expect(dump).toContain('Key Positions');
  expect(dump).toContain('Sagittarius');
  expect(dump).toContain('Planetary Positions');
  expect(dump).toContain('Debilitated');
  expect(dump).toContain('Vimshottari Dasha');
  expect(dump).toContain('Current & Upcoming Mahadasha');
  expect(dump).toContain('CURRENT');
  expect(dump).toContain('Yogas in Chart');
  expect(dump).toContain('Kemadruma Yoga');
  expect(dump).toContain('Challenging');
  expect(dump).toContain('Planetary Strength (Shadbala)');
  expect(dump).toContain('91%');
  expect(dump).toContain('Recommended Remedies');
  expect(dump).toContain('Vishnu Sahasranama');
  expect(dump).toContain('Deep Astrology Analysis');

  const tabs = findTabs(tree);
  expect(tabs[1].props.accessibilityState.selected).toBe(true);
});

test('astrology analysis switches between its three readings', async () => {
  const tree = await render(<AstrologyAnalysisScreen />);
  const segments = () =>
    tree.root.findAll(
      n =>
        typeof n.type !== 'string' &&
        typeof n.props.onPress === 'function' &&
        n.props.accessibilityRole === 'tab',
    );

  // Dasha is the default tab.
  let dump = JSON.stringify(tree.toJSON());
  expect(dump).toContain('Astrology Analysis');
  expect(dump).toContain('Mahadasha (Major Periods)');
  expect(dump).toContain('ACTIVE');
  expect(dump).toContain('8 yrs 5 mo');
  expect(dump).toContain('Antardasha (Sub-periods)');
  expect(dump).toContain('Jupiter–Ketu');
  expect(segments()[0].props.accessibilityState.selected).toBe(true);

  await ReactTestRenderer.act(() => {
    segments()[1].props.onPress();
  });
  dump = JSON.stringify(tree.toJSON());
  expect(dump).toContain('Gaja Kesari Yoga');
  expect(dump).toContain('Beneficial');
  expect(dump).toContain('Challenging');
  expect(dump).not.toContain('Mahadasha (Major Periods)');

  await ReactTestRenderer.act(() => {
    segments()[2].props.onPress();
  });
  dump = JSON.stringify(tree.toJSON());
  expect(dump).toContain('Mangal Dosha');
  expect(dump).toContain('Present');
  expect(dump).toContain('Absent');
  expect(dump).toContain('Moderate');
  expect(dump).not.toContain('Gaja Kesari Yoga');
});

test('wallet renders balance, quick add, totals and the ledger', async () => {
  const tree = await render(<WalletScreen />);
  const text = textOf(tree);
  expect(text).toContain('Wallet');
  expect(text).toContain('AVAILABLE BALANCE');
  expect(text).toContain('₹ 1,250');
  expect(text).toContain('62 mins of chat consultation');
  expect(text).toContain('+ Add Money');
  expect(text).toContain('Quick Add');
  expect(text).toContain('₹2000');
  expect(text).toContain('Total Spent');
  expect(text).toContain('₹4,500');
  expect(text).toContain('Recent Transactions');
  expect(text).toContain('Chat – Dr. Suresh Patel');
  expect(findTabs(tree)[3].props.accessibilityState.selected).toBe(true);
});

test('add money edits the amount and carries it to the CTA', async () => {
  const tree = await render(<AddMoneyScreen />);
  expect(textOf(tree)).toContain('Add Money');
  expect(textOf(tree)).toContain('Min ₹100 · Max ₹50,000');
  expect(textOf(tree)).toContain('Proceed to Pay ₹200');
  expect(textOf(tree)).toContain('Secure Payments via Razorpay');

  // Picking ₹1K updates both the field and the button.
  const chip = tree.root.findAll(
    n =>
      typeof n.type !== 'string' &&
      typeof n.props.onPress === 'function' &&
      n.props.children?.props?.children === '₹1K',
  )[0];
  await ReactTestRenderer.act(() => {
    chip.props.onPress();
  });
  expect(textOf(tree)).toContain('Proceed to Pay ₹1000');
});

test('payment lists methods and switches the selected one', async () => {
  const tree = await render(<PaymentScreen amount={500} />);
  const text = textOf(tree);
  expect(text).toContain('AMOUNT TO PAY');
  expect(text).toContain('₹500');
  expect(text).toContain('Shree Astro Wallet Top-up');
  expect(text).toContain('Pay ₹500 Securely');
  expect(text).toContain('256-bit SSL encryption');

  const radios = () =>
    tree.root.findAll(
      n => typeof n.type === 'string' && n.props.accessibilityRole === 'radio',
    );
  expect(radios()[0].props.accessibilityState.selected).toBe(true);
  expect(radios()[2].props.accessibilityState.selected).toBe(false);

  const netBanking = tree.root.findAll(
    n =>
      typeof n.type !== 'string' &&
      typeof n.props.onPress === 'function' &&
      n.props.accessibilityRole === 'radio',
  )[2];
  await ReactTestRenderer.act(() => {
    netBanking.props.onPress();
  });
  expect(radios()[2].props.accessibilityState.selected).toBe(true);
  expect(radios()[0].props.accessibilityState.selected).toBe(false);
});

test('processing settles into the receipt', async () => {
  jest.useFakeTimers();
  const onSettled = jest.fn();
  const tree = await render(<PaymentProcessingScreen onSettled={onSettled} />);
  expect(textOf(tree)).toContain('Processing Payment');
  expect(textOf(tree)).toContain('Powered by Razorpay');
  expect(onSettled).not.toHaveBeenCalled();

  await ReactTestRenderer.act(() => {
    jest.advanceTimersByTime(2000);
  });
  expect(onSettled).toHaveBeenCalled();
  jest.useRealTimers();
});

test('success shows the receipt', async () => {
  const tree = await render(<PaymentSuccessScreen amount={500} />);
  const text = textOf(tree);
  expect(text).toContain('Payment Successful!');
  expect(text).toContain('AMOUNT ADDED');
  expect(text).toContain('₹500');
  expect(text).toContain('TXN26071312345');
  expect(text).toContain('UPI (GPay)');
  expect(text).toContain('Previous Balance');
  expect(text).toContain('Go to Wallet');
  expect(text).toContain('Back to Home');
});

test('profile renders the account, stats and menu', async () => {
  const tree = await render(<ProfileScreen />);
  const text = textOf(tree);
  expect(text).toContain('Arjun Sharma');
  expect(text).toContain('arjun@example.com');
  expect(text).toContain('Leo · 15 Aug 1995 · Mumbai');
  expect(text).toContain('Consults');
  expect(text).toContain('Edit Profile');
  expect(text).toContain('Transaction History');
  expect(text).toContain('AI Astrology Assistant');
  expect(text).toContain('Logout');
  expect(text).toContain('Shree Astro v1.0.0');
  // Profile is the selected tab, and it reads green.
  const tabs = findTabs(tree);
  expect(tabs[4].props.accessibilityState.selected).toBe(true);
});

test('the selected Profile tab is green, not black', async () => {
  const tree = await render(<ProfileScreen />);
  const label = tree.root
    .findAll(n => String(n.type) === 'Text')
    .find(n => n.props.children === 'Profile');
  const style = Object.assign(
    {},
    ...[label?.props.style].flat().filter(Boolean),
  );
  expect(style.color).toBe('#22C55E');
});

test('edit profile prefills the stored details', async () => {
  const tree = await render(<EditProfileScreen />);
  const text = textOf(tree);
  expect(text).toContain('Edit Profile');
  expect(text).toContain('Date of Birth');
  expect(text).toContain('Save Changes');
  const values = tree.root.findAllByType(TextInput).map(i => i.props.value);
  expect(values).toContain('Arjun Sharma');
  expect(values).toContain('Mumbai, Maharashtra');
});

test('transaction history filters by direction', async () => {
  const tree = await render(<TransactionHistoryScreen />);
  expect(textOf(tree)).toContain('71312345');
  expect(textOf(tree)).toContain('Chat Consultation');

  const chip = (label: string) =>
    tree.root.findAll(
      n =>
        typeof n.type !== 'string' &&
        n.props.accessibilityRole === 'tab' &&
        typeof n.props.onPress === 'function',
    )[['All', '↑ Added', '↓ Spent'].indexOf(label)];

  await ReactTestRenderer.act(() => {
    chip('↑ Added').props.onPress();
  });
  expect(textOf(tree)).toContain('Wallet Top-up');
  expect(textOf(tree)).not.toContain('Chat Consultation');
});

test('consultation history filters by channel', async () => {
  const tree = await render(<ConsultationHistoryScreen />);
  expect(textOf(tree)).toContain('Pt. Rajesh Sharma');
  expect(textOf(tree)).toContain('Kavita Joshi');
  expect(textOf(tree)).toContain('✓ Completed');

  const voice = tree.root.findAll(
    n =>
      typeof n.type !== 'string' &&
      n.props.accessibilityRole === 'tab' &&
      typeof n.props.onPress === 'function',
  )[2];
  await ReactTestRenderer.act(() => {
    voice.props.onPress();
  });
  expect(textOf(tree)).toContain('Kavita Joshi');
  expect(textOf(tree)).not.toContain('Pt. Rajesh Sharma');
});

test('notifications count unread and clear on mark all read', async () => {
  const tree = await render(<NotificationsScreen />);
  expect(textOf(tree)).toContain('2 unread');
  expect(textOf(tree)).toContain('Mercury goes Direct today!');

  // The back button has no handler wired in this test, so this is the only
  // pressable with an onPress.
  const markAll = tree.root.findAll(
    n =>
      typeof n.type !== 'string' &&
      typeof n.props.onPress === 'function' &&
      n.props.accessibilityRole === 'button',
  )[0];
  await ReactTestRenderer.act(() => {
    markAll.props.onPress();
  });
  expect(textOf(tree)).toContain('0 unread');
});

test('consultation history is a pushed page when opened from Profile', async () => {
  // Consult tab: no back button, Consult lit.
  const asTab = await render(<ConsultationHistoryScreen />);
  expect(
    asTab.root.findAll(
      n =>
        typeof n.type === 'string' &&
        n.props.accessibilityLabel === 'Go back',
    ),
  ).toHaveLength(0);
  expect(findTabs(asTab)[2].props.accessibilityState.selected).toBe(true);

  // From Profile: back button present, Profile stays lit.
  const onBack = jest.fn();
  const pushed = await render(
    <ConsultationHistoryScreen activeTab="profile" onBack={onBack} />,
  );
  const back = pushed.root.findAll(
    n =>
      typeof n.type !== 'string' &&
      n.props.accessibilityLabel === 'Go back' &&
      typeof n.props.onPress === 'function',
  )[0];
  await ReactTestRenderer.act(() => {
    back.props.onPress();
  });
  expect(onBack).toHaveBeenCalled();
  expect(findTabs(pushed)[4].props.accessibilityState.selected).toBe(true);
  expect(findTabs(pushed)[2].props.accessibilityState.selected).toBe(false);
});

test('find astrologers lists, filters and searches', async () => {
  const tree = await render(<FindAstrologersScreen />);
  let text = textOf(tree);
  expect(text).toContain('Find Astrologers');
  expect(text).toContain('200+ expert astrologers online');
  expect(text).toContain('Pt. Rajesh Sharma');
  expect(text).toContain('Vedic Astrology, KP System');
  expect(text).toContain('18 yrs exp');
  expect(text).toContain('4,820 consults');
  expect(text).toContain('Guru Prakash Das');

  // The Tarot chip narrows the list to Kavita.
  const chip = (index: number) =>
    tree.root.findAll(
      n =>
        typeof n.type !== 'string' &&
        n.props.accessibilityRole === 'tab' &&
        typeof n.props.onPress === 'function',
    )[index];
  await ReactTestRenderer.act(() => {
    chip(3).props.onPress();
  });
  text = textOf(tree);
  expect(text).toContain('Kavita Joshi');
  expect(text).not.toContain('Pt. Rajesh Sharma');

  // Searching within a filter still applies both.
  await ReactTestRenderer.act(() => {
    chip(0).props.onPress();
  });
  await ReactTestRenderer.act(() => {
    tree.root.findAllByType(TextInput)[0].props.onChangeText('palmistry');
  });
  text = textOf(tree);
  expect(text).toContain('Anita Krishnan');
  expect(text).not.toContain('Kavita Joshi');
});

test('tapping an astrologer card reports the selection', async () => {
  const onSelectAstrologer = jest.fn();
  const tree = await render(
    <FindAstrologersScreen onSelectAstrologer={onSelectAstrologer} />,
  );
  const card = tree.root.findAll(
    n =>
      typeof n.type !== 'string' &&
      typeof n.props.onPress === 'function' &&
      String(n.props.accessibilityLabel).startsWith('Pt. Rajesh Sharma.'),
  )[0];
  await ReactTestRenderer.act(() => {
    card.props.onPress();
  });
  expect(onSelectAstrologer).toHaveBeenCalledWith(
    expect.objectContaining({ id: 'rajesh' }),
  );
});

test('astrologer detail renders every section', async () => {
  const tree = await render(<AstrologerDetailScreen />);
  const text = textOf(tree);
  expect(text).toContain('Astro Ragini');
  expect(text).toContain('₹ 1000');
  expect(text).toContain('Wait 5Min');
  expect(text).toContain('English, Hindi');
  expect(text).toContain('Numerology');
  expect(text).toContain('8 Years');
  expect(text).toContain('2K Mins');
  expect(text).toContain('₹19/min');
  expect(text).toContain('Follow');
  expect(text).toContain('Astro Media');
  expect(text).toContain('Specialization');
  expect(text).toContain('Break-up & Divorce');
  expect(text).toContain('About Us');
  expect(text).toContain('Read More');
  expect(text).toContain('Rating and Review');
  expect(text).toContain('4.7');
  expect(text).toContain('2.5k');
  expect(text).toContain('Anonymous');
  expect(text).toContain('Nidhi Kumari');
  expect(text).toContain('Chat Now');
  expect(text).toContain('Call Now');
});

test('the detail back button returns to the directory', async () => {
  const onBack = jest.fn();
  const tree = await render(<AstrologerDetailScreen onBack={onBack} />);
  const back = tree.root.findAll(
    n =>
      typeof n.type !== 'string' &&
      n.props.accessibilityLabel === 'Go back' &&
      typeof n.props.onPress === 'function',
  )[0];
  await ReactTestRenderer.act(() => {
    back.props.onPress();
  });
  expect(onBack).toHaveBeenCalled();
});

test('available astrologers renders and filters by category', async () => {
  const tree = await render(<AvailableAstrologersScreen />);
  let text = textOf(tree);
  expect(text).toContain('Available Astrologers');
  expect(text).toContain('Chat');
  expect(text).toContain('Call');
  // The promo banner is one exported image, so its headline is the a11y label.
  expect(
    tree.root.findAll(
      n =>
        typeof n.type === 'string' &&
        n.props.accessibilityLabel === 'When Will I Get Marriage ?',
    ).length,
  ).toBe(1);
  expect(text).toContain('Astro Ragini');
  expect(text).toContain('English, Hindi');
  expect(text).toContain('Numerology');
  expect(text).toContain('8 Years');
  expect(text).toContain('1000+');
  expect(text).toContain('(4.5/5)');
  expect(text).toContain('Wait 00:01:21');
  expect(text).toContain('₹21/min');
  expect(text).toContain('Free');
  expect(text).toContain('₹15/Min');

  // Education narrows to the one astrologer tagged with it.
  const tabs = tree.root.findAll(
    n =>
      typeof n.type !== 'string' &&
      n.props.accessibilityRole === 'tab' &&
      typeof n.props.onPress === 'function',
  );
  // 0,1 are the Chat/Call modes; 2.. are the category chips
  // (all, love, education, marriage, wealth, health).
  await ReactTestRenderer.act(() => {
    tabs[7].props.onPress(); // Health — matches only the third astrologer.
  });
  text = textOf(tree);
  expect(text).toContain('₹15/Min');
  expect(text).not.toContain('Free');
  expect(text).not.toContain('Wait 00:01:21');
});

test('the Chat / Call mode toggle switches', async () => {
  const tree = await render(<AvailableAstrologersScreen />);
  const modes = () =>
    tree.root.findAll(
      n => typeof n.type === 'string' && n.props.accessibilityRole === 'tab',
    );
  expect(modes()[0].props.accessibilityState.selected).toBe(true);
  expect(modes()[1].props.accessibilityState.selected).toBe(false);

  const callMode = tree.root.findAll(
    n =>
      typeof n.type !== 'string' &&
      n.props.accessibilityRole === 'tab' &&
      typeof n.props.onPress === 'function',
  )[1];
  await ReactTestRenderer.act(() => {
    callMode.props.onPress();
  });
  expect(modes()[1].props.accessibilityState.selected).toBe(true);
  expect(modes()[0].props.accessibilityState.selected).toBe(false);
});
