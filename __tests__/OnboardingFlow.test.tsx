import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { PrimaryButton } from '../src/components/PrimaryButton';
import { Animated, TextInput } from 'react-native';

import { ConsultationRow } from '../src/components/ConsultationRow';
import { DailyHoroscopeCard } from '../src/components/DailyHoroscopeCard';
import { AvatarPicker } from '../src/components/AvatarPicker';
import { GenderSelector } from '../src/components/GenderSelector';
import { OtpInput } from '../src/components/OtpInput';
import { AddMoneyScreen } from '../src/screens/AddMoneyScreen';
import { AiAstrologyChatScreen } from '../src/screens/AiAstrologyChatScreen';
import { AstrologerDetailScreen } from '../src/screens/AstrologerDetailScreen';
import { AstrologyAnalysisScreen } from '../src/screens/AstrologyAnalysisScreen';
import { AvailableAstrologersScreen } from '../src/screens/AvailableAstrologersScreen';
import {
  AstrologerBusyDialog,
  DeclineChatDialog,
} from '../src/components/AstrologerBusyDialog';
import { ConnectingDialog } from '../src/components/ConnectingDialog';
import { OptionPickerDialog } from '../src/components/OptionPickerDialog';
import { WheelPickerDialog } from '../src/components/WheelPickerDialog';
import { ChatIntakeScreen } from '../src/screens/ChatIntakeScreen';
import { fireAstrologerLeft, fireAstrologerJoined, fireLowBalance, fireTick } from './helpers/apiMock';
import { ConsultationChatScreen } from '../src/screens/ConsultationChatScreen';
import { ComingSoonScreen } from '../src/screens/ComingSoonScreen';
import { ConsultationHistoryScreen } from '../src/screens/ConsultationHistoryScreen';
import { EditProfileScreen } from '../src/screens/EditProfileScreen';
import { EmailLoginScreen } from '../src/screens/EmailLoginScreen';
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
import { astrologers } from '../src/data/home';

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

  /**
   * The signed-in screens fetch on mount and settle on a later microtask, so
   * one more pass is needed before a test can look for anything.
   *
   * Microtasks rather than a timer: several of these screens run a countdown,
   * and advancing the clock here would start it mid-render.
   */
  await ReactTestRenderer.act(async () => {
    for (let i = 0; i < 5; i += 1) {
      await Promise.resolve();
    }
  });

  return tree;
};

/** Lets a refetch settle after a filter or a search changes. */
const flush = async () => {
  await ReactTestRenderer.act(async () => {
    for (let i = 0; i < 5; i += 1) {
      await Promise.resolve();
    }
  });
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

  const buttons = () => tree.root.findAllByType(PrimaryButton);
  // Nothing typed yet, so neither card can act.
  expect(buttons()[0].props.disabled).toBe(true); // Send OTP
  expect(buttons()[1].props.disabled).toBe(true); // Verify & Continue

  const number = tree.root.findAll(
    n => typeof n.type === 'string' && n.props.accessibilityLabel === 'Mobile number',
  )[0];
  await ReactTestRenderer.act(() => {
    number.props.onChangeText('12345');
  });
  expect(JSON.stringify(tree.toJSON())).toContain('Enter a 10-digit mobile number');
  expect(buttons()[0].props.disabled).toBe(true);

  await ReactTestRenderer.act(() => {
    number.props.onChangeText('9876543210');
  });
  expect(buttons()[0].props.disabled).toBe(false);

  await ReactTestRenderer.act(() => {
    buttons()[0].props.onPress(); // Send OTP
  });

  const dump = JSON.stringify(tree.toJSON());
  expect(dump).toContain('6-digit code sent to +91');
  expect(dump).toContain('OTP Sent');
  // Sent, but the code still has to be six digits long.
  expect(buttons()[1].props.disabled).toBe(true);

  await ReactTestRenderer.act(() => {
    tree.root.findByType(OtpInput).props.onChange('123456');
  });
  expect(buttons()[1].props.disabled).toBe(false);
});

test('email screen mirrors the otp flow, from inert to sent', async () => {
  const onVerified = jest.fn();
  const tree = await render(<EmailLoginScreen onVerified={onVerified} />);
  expect(JSON.stringify(tree.toJSON())).toContain(
    'Send the code first to enable this section',
  );

  const buttons = () => tree.root.findAllByType(PrimaryButton);
  // Nothing typed yet, so neither card can act.
  expect(buttons()[0].props.disabled).toBe(true); // Send Code
  expect(buttons()[1].props.disabled).toBe(true); // Verify & Continue

  const field = tree.root.findAll(
    n => typeof n.type === 'string' && n.props.accessibilityLabel === 'Email address',
  )[0];
  await ReactTestRenderer.act(() => {
    field.props.onChangeText('arjun@example.com');
  });
  expect(buttons()[0].props.disabled).toBe(false);

  await ReactTestRenderer.act(() => {
    buttons()[0].props.onPress(); // Send Code
  });

  const dump = JSON.stringify(tree.toJSON());
  expect(dump).toContain('6-digit code sent to arjun@example.com');
  expect(dump).toContain('Code Sent');
  // Sent, but the code still has to be six digits long.
  expect(buttons()[1].props.disabled).toBe(true);

  await ReactTestRenderer.act(() => {
    tree.root.findByType(OtpInput).props.onChange('123456');
  });
  expect(buttons()[1].props.disabled).toBe(false);

  await ReactTestRenderer.act(() => {
    buttons()[1].props.onPress(); // Verify & Continue
  });
  /** The screen hands over the whole session, not just the address. */
  expect(onVerified).toHaveBeenCalledWith(
    expect.objectContaining({ user: expect.objectContaining({ email: 'arjun@example.com' }) }),
  );
});

test('editing the address takes the sent code back down', async () => {
  const tree = await render(<EmailLoginScreen />);
  const field = tree.root.findAll(
    n => typeof n.type === 'string' && n.props.accessibilityLabel === 'Email address',
  )[0];

  await ReactTestRenderer.act(() => {
    field.props.onChangeText('arjun@example.com');
  });
  await ReactTestRenderer.act(() => {
    tree.root.findAllByType(PrimaryButton)[0].props.onPress();
  });
  expect(JSON.stringify(tree.toJSON())).toContain('Code Sent');

  await ReactTestRenderer.act(() => {
    field.props.onChangeText('arjun@example.co');
  });
  const dump = JSON.stringify(tree.toJSON());
  expect(dump).toContain('Send the code first to enable this section');
  expect(tree.root.findAllByType(PrimaryButton)[1].props.disabled).toBe(true);
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

test('profile creation survives a back-step: initialProfile/initialPhoto pre-fill instead of starting blank', async () => {
  const tree = await render(
    <ProfileCreationScreen
      initialProfile={{
        fullName: 'Arjun Sharma',
        email: 'arjun@example.com',
        phoneNumber: '9876543210',
        gender: 'male',
      }}
      initialPhoto={{ uri: 'file:///photo.jpg' }}
    />,
  );
  const dump = JSON.stringify(tree.toJSON());
  expect(dump).toContain('Arjun Sharma');
  expect(dump).toContain('arjun@example.com');
  expect(dump).toContain('9876543210');

  const male = tree.root
    .findAllByType(GenderSelector)[0]
    .findAll(n => n.props.accessibilityRole === 'radio')[0];
  expect(male.props.accessibilityState.selected).toBe(true);
});

test('birth details survives a back-step: initialDetails pre-fills instead of starting blank, and onBack reports the current fields', async () => {
  const onBack = jest.fn();
  const tree = await render(
    <BirthDetailsScreen
      onBack={onBack}
      initialDetails={{
        dateOfBirth: '15/08/1995',
        timeOfBirth: '06:30 AM',
        placeOfBirth: 'Mumbai, Maharashtra',
        placeId: 'place:mumbai#0',
      }}
    />,
  );
  const dump = JSON.stringify(tree.toJSON());
  expect(dump).toContain('15/08/1995');
  expect(dump).toContain('06:30 AM');
  expect(dump).toContain('Mumbai, Maharashtra');

  await ReactTestRenderer.act(() => {
    findPressable(tree, 'Go back').props.onPress();
  });
  expect(onBack).toHaveBeenCalledWith({
    dateOfBirth: '15/08/1995',
    timeOfBirth: '06:30 AM',
    placeOfBirth: 'Mumbai, Maharashtra',
    placeId: 'place:mumbai#0',
  });
});

test('birth details hydrates from the account\'s saved details once they load, even if it mounted before that', async () => {
  // Reached from the Kundli tab, App.tsx passes initialDetails derived from GET /users/me —
  // fetched asynchronously in the app shell, so it can easily still be undefined at mount.
  // Deliberately distinct from every static placeholder on the form ("15/08/1999", "06 : 30 AM",
  // "Mumbai, Maharashtra"), so a match only ever means real hydration happened.
  const tree = await render(<BirthDetailsScreen />);
  let dump = JSON.stringify(tree.toJSON());
  expect(dump).not.toContain('22/11/1998');

  await ReactTestRenderer.act(() => {
    tree.update(
      <SafeAreaProvider initialMetrics={METRICS}>
        <BirthDetailsScreen
          initialDetails={{
            dateOfBirth: '22/11/1998',
            timeOfBirth: '02 : 30 PM',
            placeOfBirth: 'Jaipur, Rajasthan',
          }}
        />
      </SafeAreaProvider>,
    );
  });

  dump = JSON.stringify(tree.toJSON());
  expect(dump).toContain('22/11/1998');
  expect(dump).toContain('02 : 30 PM');
  expect(dump).toContain('Jaipur, Rajasthan');
});

test('home renders every section', async () => {
  const tree = await render(<HomeScreen />);
  const dump = JSON.stringify(tree.toJSON());
  expect(dump).toContain('Arjun Sharma');
  expect(dump).toContain('WALLET BALANCE');
  expect(dump).toContain('₹1,250');
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

const fieldNamed = (
  tree: ReactTestRenderer.ReactTestRenderer,
  label: string,
) =>
  tree.root.findAll(
    n => typeof n.type === 'string' && n.props.accessibilityLabel === label,
  )[0];

test('profile creation blocks Continue until every field is valid', async () => {
  const onContinue = jest.fn();
  const tree = await render(<ProfileCreationScreen onContinue={onContinue} />);

  const submit = () => tree.root.findAllByType(PrimaryButton)[0].props.onPress();
  await ReactTestRenderer.act(submit);

  let text = textOf(tree);
  expect(onContinue).not.toHaveBeenCalled();
  expect(text).toContain('Full name is required');
  expect(text).toContain('Email address is required');
  expect(text).toContain('Phone number is required');
  expect(text).toContain('Select a gender');

  // Bad values are called out as they are typed, now that the form is live.
  await ReactTestRenderer.act(() => {
    fieldNamed(tree, 'Full Name').props.onChangeText('A');
    fieldNamed(tree, 'Email Address').props.onChangeText('arjun@');
    fieldNamed(tree, 'Phone Number').props.onChangeText('12345');
  });
  text = textOf(tree);
  expect(text).toContain('Full name must be at least 2 characters');
  expect(text).toContain('Enter a valid email address');
  expect(text).toContain('Enter a 10-digit mobile number');

  await ReactTestRenderer.act(() => {
    fieldNamed(tree, 'Full Name').props.onChangeText('Arjun Sharma');
    fieldNamed(tree, 'Email Address').props.onChangeText('arjun@example.com');
    fieldNamed(tree, 'Phone Number').props.onChangeText('98765 43210');
  });
  await ReactTestRenderer.act(() => {
    tree.root
      .findAllByType(GenderSelector)[0]
      .findAll(n => n.props.accessibilityRole === 'radio')[0]
      .props.onPress();
  });
  await ReactTestRenderer.act(submit);

  // Step one hands its values up with the photo beside them; nothing is sent
  // to the server until birth details are saved.
  expect(onContinue).toHaveBeenCalledWith(
    expect.objectContaining({
      fullName: 'Arjun Sharma',
      email: 'arjun@example.com',
      gender: 'male',
    }),
    undefined,
  );
});

test('profile creation stops accepting digits well past a real phone number', async () => {
  const tree = await render(<ProfileCreationScreen />);
  const phoneField = () => fieldNamed(tree, 'Phone Number');

  // A bare number types in freely, right up to ten digits.
  await ReactTestRenderer.act(() => phoneField().props.onChangeText('9876543210'));
  expect(phoneField().props.value).toBe('9876543210');

  // The +91 country code is also accepted — twelve digits total, same as validatePhone itself allows.
  await ReactTestRenderer.act(() => phoneField().props.onChangeText('919876543210'));
  expect(phoneField().props.value).toBe('919876543210');

  // A thirteenth digit is refused outright — the field does not just wait for Continue to say so.
  await ReactTestRenderer.act(() => phoneField().props.onChangeText('9198765432109'));
  expect(phoneField().props.value).toBe('919876543210');
});

test('profile creation carries a picked photo through to Continue', async () => {
  const photo = { uri: 'file:///tmp/IMG_0042.heic', type: 'image/heic' };
  const onContinue = jest.fn();
  const onPickPhoto = jest.fn().mockResolvedValue(photo);
  const tree = await render(
    <ProfileCreationScreen onContinue={onContinue} onPickPhoto={onPickPhoto} />,
  );

  await ReactTestRenderer.act(() =>
    tree.root
      .findAllByType(AvatarPicker)[0]
      .findAll(node => node.props.accessibilityRole === 'button')[0]
      .props.onPress(),
  );
  expect(onPickPhoto).toHaveBeenCalled();
  // The tile swaps its placeholder glyph for what was chosen.
  expect(tree.root.findAllByType(AvatarPicker)[0].props.uri).toBe(photo.uri);

  await ReactTestRenderer.act(() => {
    fieldNamed(tree, 'Full Name').props.onChangeText('Arjun Sharma');
    fieldNamed(tree, 'Email Address').props.onChangeText('arjun@example.com');
    fieldNamed(tree, 'Phone Number').props.onChangeText('98765 43210');
  });
  await ReactTestRenderer.act(() => {
    tree.root
      .findAllByType(GenderSelector)[0]
      .findAll(n => n.props.accessibilityRole === 'radio')[0]
      .props.onPress();
  });
  await ReactTestRenderer.act(() =>
    tree.root.findAllByType(PrimaryButton)[0].props.onPress(),
  );

  expect(onContinue).toHaveBeenCalledWith(expect.anything(), photo);
});

test('birth details rejects impossible dates and picks a well-formed time from its wheel', async () => {
  const onSave = jest.fn();
  const tree = await render(<BirthDetailsScreen onSave={onSave} />);

  const save = () => tree.root.findAllByType(PrimaryButton)[0].props.onPress();
  await ReactTestRenderer.act(save);

  expect(onSave).not.toHaveBeenCalled();
  expect(textOf(tree)).toContain('Date of birth is required');
  // Time of Birth is also a wheel now — nothing has been picked yet, so it's just as required.
  expect(textOf(tree)).toContain('Time of birth is required');

  // Date of Birth and Time of Birth both open a wheel rather than taking typed text.
  const openWheel = () =>
    tree.root.findAllByType(WheelPickerDialog).filter(w => w.props.visible)[0];
  const pickDate = async (day: string, month: string, year: string) => {
    await ReactTestRenderer.act(() => {
      findPressable(tree, 'Date of Birth').props.onPress();
    });
    await ReactTestRenderer.act(() => {
      openWheel().props.onSubmit({ day, month, year });
    });
  };
  const pickTime = async (hour: string, minute: string, meridiem: string) => {
    await ReactTestRenderer.act(() => {
      findPressable(tree, 'Time of Birth').props.onPress();
    });
    await ReactTestRenderer.act(() => {
      openWheel().props.onSubmit({ hour, minute, meridiem });
    });
  };

  await pickDate('31', 'Feb', '1999');
  await ReactTestRenderer.act(() => {
    fieldNamed(tree, 'Place of Birth').props.onChangeText('M');
  });
  let text = textOf(tree);
  expect(text).toContain('2/1999 has 28 days');
  expect(text).toContain('Place of birth must be at least 2 characters');

  // The wheel's years run only to 2026, so the last day of that year stands
  // in for "unambiguously future" — it is always after whenever this runs.
  await pickDate('31', 'Dec', '2026');
  expect(textOf(tree)).toContain('Date of birth cannot be in the future');

  await pickDate('15', 'Aug', '1999');
  await pickTime('06', '30', 'AM');
  await ReactTestRenderer.act(() => {
    fieldNamed(tree, 'Place of Birth').props.onChangeText('Mumbai, Maharashtra');
  });
  // A wheel can only ever land on a value it actually offers — "25:00" or "Hour 13" simply cannot be picked, unlike free-typed text.
  expect(textOf(tree)).not.toContain('required');
  await ReactTestRenderer.act(save);

  expect(onSave).toHaveBeenCalledWith({
    dateOfBirth: '15/08/1999',
    timeOfBirth: '06 : 30 AM',
    placeOfBirth: 'Mumbai, Maharashtra',
  });
});

test('the wheel picker is a real scrolling list: settling on a row commits it, out-of-range clamps, and Submit hands back the current draft', async () => {
  const YEARS = ['2015', '2016', '2017', '2018', '2019', '2020', '2021', '2022', '2023', '2024', '2025'];
  const ROW_HEIGHT = 56; // matches WheelPickerDialog's internal row height
  const onSubmit = jest.fn();
  const tree = await render(
    <WheelPickerDialog
      visible
      title="Select Year"
      columns={[{ key: 'year', values: YEARS }]}
      value={{ year: '2020' }}
      onCancel={() => {}}
      onSubmit={onSubmit}
    />,
  );

  // The outer wheel column carries the current selection as its own accessibility label,
  // distinct from each row's "Select year <value>" tap target.
  const selectedYear = () =>
    tree.root.findAll(n => typeof n.props.accessibilityLabel === 'string' && n.props.accessibilityLabel.startsWith('year '))[0]
      .props.accessibilityLabel;
  const yearList = () => tree.root.findAllByType(Animated.FlatList)[0];

  expect(selectedYear()).toBe('year 2020');

  // A flick that settles (momentum finishing) on row index 8 -> "2023" commits that value.
  await ReactTestRenderer.act(() => {
    yearList().props.onMomentumScrollEnd({ nativeEvent: { contentOffset: { y: ROW_HEIGHT * 8 } } });
  });
  expect(selectedYear()).toBe('year 2023');

  // A slow drag that never enters a momentum phase still commits via onScrollEndDrag.
  await ReactTestRenderer.act(() => {
    yearList().props.onScrollEndDrag({ nativeEvent: { contentOffset: { y: ROW_HEIGHT * 3 } } });
  });
  expect(selectedYear()).toBe('year 2018');

  // An overshoot past the last row clamps to the last value instead of picking undefined.
  await ReactTestRenderer.act(() => {
    yearList().props.onMomentumScrollEnd({ nativeEvent: { contentOffset: { y: ROW_HEIGHT * 999 } } });
  });
  expect(selectedYear()).toBe('year 2025');

  await ReactTestRenderer.act(() => {
    findPressable(tree, 'Submit').props.onPress();
  });
  expect(onSubmit).toHaveBeenCalledWith({ year: '2025' });
});

test('add money holds the CTA to the wallet limits', async () => {
  const onProceed = jest.fn();
  const tree = await render(
    <AddMoneyScreen initialAmount={200} onProceed={onProceed} />,
  );

  const cta = () => tree.root.findAllByType(PrimaryButton)[0];
  expect(cta().props.disabled).toBe(false);

  const amount = fieldNamed(tree, 'Amount to add');
  await ReactTestRenderer.act(() => {
    amount.props.onChangeText('5');
  });
  expect(textOf(tree)).toContain('Minimum top-up is ₹10');
  expect(cta().props.disabled).toBe(true);

  await ReactTestRenderer.act(() => {
    amount.props.onChangeText('200000');
  });
  expect(textOf(tree)).toContain('Maximum top-up is ₹1,00,000');
  expect(cta().props.disabled).toBe(true);

  await ReactTestRenderer.act(() => {
    amount.props.onChangeText('1500');
  });
  expect(cta().props.disabled).toBe(false);
  await ReactTestRenderer.act(() => {
    cta().props.onPress();
  });
  expect(onProceed).toHaveBeenCalledWith(1500);
});

test('edit profile refuses to save a broken field', async () => {
  const onSave = jest.fn();
  const tree = await render(<EditProfileScreen onSave={onSave} />);

  const save = () => tree.root.findAllByType(PrimaryButton)[0].props.onPress();
  // The stored account is valid, so it saves as it stands.
  await ReactTestRenderer.act(save);
  expect(onSave).toHaveBeenCalledTimes(1);

  await ReactTestRenderer.act(() => {
    fieldNamed(tree, 'Email Address').props.onChangeText('arjun@@example.com');
  });
  await ReactTestRenderer.act(save);

  expect(onSave).toHaveBeenCalledTimes(1);
  expect(textOf(tree)).toContain('Enter a valid email address');
});

test('coming soon names what it stands in for', async () => {
  const onBack = jest.fn();
  const onBackToHome = jest.fn();
  const tree = await render(
    <ComingSoonScreen
      title="Chat with Astro Ragini"
      detail="Live chat consultations are being built."
      glyph="💬"
      onBack={onBack}
      onBackToHome={onBackToHome}
    />,
  );

  const text = textOf(tree);
  expect(text).toContain('Coming Soon');
  expect(text).toContain('Chat with Astro Ragini');
  expect(text).toContain('Live chat consultations are being built.');

  await ReactTestRenderer.act(() => {
    findPressable(tree, 'Go back').props.onPress();
  });
  expect(onBack).toHaveBeenCalled();
});

test('home header buttons and feed rows all report a press', async () => {
  const handlers = {
    onSearchPress: jest.fn(),
    onNotificationsPress: jest.fn(),
    onProfilePress: jest.fn(),
    onAddFunds: jest.fn(),
    onOpenHoroscope: jest.fn(),
    onViewAllConsultations: jest.fn(),
    onSelectConsultation: jest.fn(),
  };
  const tree = await render(<HomeScreen {...handlers} />);

  const press = (label: string) =>
    ReactTestRenderer.act(() => {
      findPressable(tree, label).props.onPress();
    });

  await press('Search');
  await press('Notifications');
  await press('Your profile');
  expect(handlers.onSearchPress).toHaveBeenCalled();
  expect(handlers.onNotificationsPress).toHaveBeenCalled();
  expect(handlers.onProfilePress).toHaveBeenCalled();

  // The horoscope card and the first consultation row are pressable too.
  await ReactTestRenderer.act(() => {
    tree.root.findByType(DailyHoroscopeCard).props.onPress();
  });
  await ReactTestRenderer.act(() => {
    tree.root.findAllByType(ConsultationRow)[0].props.onPress();
  });
  expect(handlers.onOpenHoroscope).toHaveBeenCalled();
  expect(handlers.onSelectConsultation).toHaveBeenCalledWith(
    expect.objectContaining({ id: 'c-1' }),
  );
});

test('the directory chat and call buttons hand over the astrologer', async () => {
  const onChat = jest.fn();
  const onCall = jest.fn();
  const tree = await render(
    <FindAstrologersScreen onChat={onChat} onCall={onCall} />,
  );

  await ReactTestRenderer.act(() => {
    findPressable(tree, 'Chat with Pt. Rajesh Sharma').props.onPress();
  });
  await ReactTestRenderer.act(() => {
    findPressable(tree, 'Call Pt. Rajesh Sharma').props.onPress();
  });

  expect(onChat).toHaveBeenCalledWith(expect.objectContaining({ id: 'a-rajesh' }));
  expect(onCall).toHaveBeenCalledWith(expect.objectContaining({ id: 'a-rajesh' }));
});

test('the astrologer profile follows and expands its About card', async () => {
  const tree = await render(
    <AstrologerDetailScreen
      astrologer={{ id: 'a-rajesh', name: 'Pt. Rajesh Sharma', photo: astrologers[0].photo }}
    />,
  );
  expect(textOf(tree)).toContain('Follow');

  await ReactTestRenderer.act(() => {
    findPressable(tree, 'Follow Pt. Rajesh Sharma').props.onPress();
  });
  expect(textOf(tree)).toContain('Following');

  await ReactTestRenderer.act(() => {
    findPressable(tree, 'Read more').props.onPress();
  });
  expect(textOf(tree)).toContain('Read Less');
});

test('the busy sheet offers waiting or choosing someone else', async () => {
  const onWait = jest.fn();
  const onChooseOthers = jest.fn();
  const tree = await render(
    <AstrologerBusyDialog
      visible
      name="Astro Ragini"
      onWait={onWait}
      onChooseOthers={onChooseOthers}
      onDismiss={jest.fn()}
    />,
  );

  const text = textOf(tree);
  expect(text).toContain('Current Status');
  expect(text).toContain('is busy with other customer.');

  await ReactTestRenderer.act(() => {
    findPressable(tree, 'Yes, Wait').props.onPress();
  });
  await ReactTestRenderer.act(() => {
    findPressable(tree, 'Choose Others').props.onPress();
  });
  expect(onWait).toHaveBeenCalled();
  expect(onChooseOthers).toHaveBeenCalled();
});

test('the decline sheet confirms before dropping a chat request', async () => {
  const onStay = jest.fn();
  const onDecline = jest.fn();
  const tree = await render(
    <DeclineChatDialog
      visible
      onStay={onStay}
      onDecline={onDecline}
      onDismiss={jest.fn()}
    />,
  );

  const text = textOf(tree);
  expect(text).toContain('Decline Call Request');
  expect(text).toContain('Do you want to decline the');
  expect(text).toContain('Chat request?');

  await ReactTestRenderer.act(() => {
    findPressable(tree, 'No, Stay Here').props.onPress();
  });
  expect(onStay).toHaveBeenCalled();
  expect(onDecline).not.toHaveBeenCalled();

  await ReactTestRenderer.act(() => {
    findPressable(tree, 'Yes, Decline').props.onPress();
  });
  expect(onDecline).toHaveBeenCalled();
});

test('the intake form requires every field before it will submit', async () => {
  const onConnect = jest.fn();
  const tree = await render(
    <ChatIntakeScreen astrologerName="Astro Ragini" onConnect={onConnect} />,
  );

  const text = textOf(tree);
  expect(text).toContain('Chat Intake Form');
  expect(text).toContain('Recent Chats');
  expect(text).toContain('Connect With Astro Ragini');
  // The per-minute package/duration picker is gone — nothing left to book upfront.
  expect(text).not.toContain('Chat Duration');
  expect(text).not.toContain('3 min');

  // Birth Place and Topic start empty — pressing Connect surfaces both as errors rather than silently proceeding.
  await ReactTestRenderer.act(() => {
    findPressable(tree, 'Connect With Astro Ragini').props.onPress();
  });
  expect(onConnect).not.toHaveBeenCalled();
  expect(textOf(tree)).toContain('Birth place is required');
  expect(textOf(tree)).toContain('Topic of concern is required');

  // The time field opens the wheel, and Submit writes it back.
  await ReactTestRenderer.act(() => {
    findPressable(tree, 'Time of Birth').props.onPress();
  });
  const wheels = () =>
    tree.root.findAllByType(WheelPickerDialog).filter(w => w.props.visible);
  expect(wheels()).toHaveLength(1);
  expect(wheels()[0].props.title).toBe('Select Time');

  await ReactTestRenderer.act(() => {
    wheels()[0].props.onSubmit({
      hour: '07',
      minute: '15',
      second: '00',
      meridiem: 'AM',
    });
  });
  expect(textOf(tree)).toContain('07 : 15 AM');

  const birthPlace = tree.root.findAll(
    n => typeof n.type === 'string' && n.props.accessibilityLabel === 'Birth Place',
  )[0];
  await ReactTestRenderer.act(() => {
    birthPlace.props.onChangeText('Noida');
  });

  await ReactTestRenderer.act(() => {
    findPressable(tree, 'Topic of concern').props.onPress();
  });
  const topicDialog = tree.root
    .findAllByType(OptionPickerDialog)
    .filter(d => d.props.visible)[0];
  await ReactTestRenderer.act(() => {
    topicDialog.props.onSubmit('Career & Job');
  });

  await ReactTestRenderer.act(() => {
    findPressable(tree, 'Connect With Astro Ragini').props.onPress();
  });

  expect(onConnect).toHaveBeenCalledWith(
    expect.objectContaining({
      timeOfBirth: '07 : 15 AM',
      birthPlace: 'Noida',
      topic: 'Career & Job',
    }),
  );
  // Every field is filled now, so its error clears on the successful resubmit.
  expect(textOf(tree)).not.toContain('Birth place is required');
  expect(textOf(tree)).not.toContain('Topic of concern is required');
});

test('birth details already on the profile are pre-filled and locked from editing', async () => {
  const tree = await render(
    <ChatIntakeScreen
      astrologerName="Astro Ragini"
      fullName="Priya Verma"
      dateOfBirth="15 August 1999"
      timeOfBirth="06 : 30 AM"
    />,
  );

  const text = textOf(tree);
  expect(text).toContain('15 August 1999');
  expect(text).toContain('06 : 30 AM');

  const fullNameInput = tree.root.findAll(
    n => typeof n.type === 'string' && n.props.accessibilityLabel === 'Full Name',
  )[0];
  // A TextInput's value is a prop, not a text child, so it never shows up in textOf's walk.
  expect(fullNameInput.props.value).toBe('Priya Verma');
  expect(fullNameInput.props.editable).toBe(false);

  expect(findPressable(tree, 'Date of Birth').props.disabled).toBe(true);
  expect(findPressable(tree, 'Date of Birth').props.accessibilityState.disabled).toBe(true);
  expect(findPressable(tree, 'Time of Birth').props.disabled).toBe(true);
  expect(findPressable(tree, 'Time of Birth').props.accessibilityState.disabled).toBe(true);
});

test('birth details missing from the profile leave the field open, same as before', async () => {
  const tree = await render(<ChatIntakeScreen astrologerName="Astro Ragini" />);

  const fullNameInput = tree.root.findAll(
    n => typeof n.type === 'string' && n.props.accessibilityLabel === 'Full Name',
  )[0];
  expect(fullNameInput.props.editable).toBe(true);

  expect(findPressable(tree, 'Date of Birth').props.disabled).toBe(false);
  expect(findPressable(tree, 'Time of Birth').props.disabled).toBe(false);
});

test('the connecting card counts its wait down and can be cancelled', async () => {
  jest.useFakeTimers();
  const onCancel = jest.fn();
  const tree = await render(
    <ConnectingDialog
      visible
      name="Astro Roshni"
      seconds={2}
      onCancel={onCancel}
    />,
  );

  let text = textOf(tree);
  expect(text).toContain('Connecting With ');
  expect(text).toContain('Astro Roshni');
  expect(text).toContain('Connecting, Please Wait...');
  expect(text).toContain('Wait Time - ');
  expect(text).toContain('00:02');

  await ReactTestRenderer.act(() => {
    jest.advanceTimersByTime(1000);
  });
  expect(textOf(tree)).toContain('00:01');

  // Reaching zero is just the display bottoming out — nothing here decides
  // the card is done; that comes from outside, off however the request was
  // actually answered.
  await ReactTestRenderer.act(() => {
    jest.advanceTimersByTime(1000);
  });
  expect(textOf(tree)).toContain('00:00');

  await ReactTestRenderer.act(() => {
    findPressable(tree, 'Cancel the request').props.onPress();
  });
  expect(onCancel).toHaveBeenCalled();
  jest.useRealTimers();
});

test('the consultation room opens on the intake and sends a reply', async () => {
  jest.useFakeTimers();
  const onEnd = jest.fn();
  const tree = await render(
    <ConsultationChatScreen
      chatId="chat-1"
      astrologerName="Astro Rakesh"
      onEnd={onEnd}
    />,
  );

  let text = textOf(tree);
  expect(text).toContain('Astro Rakesh');
  // The wallet pill reads the real balance, from services/api.ts's fetchWallet.
  expect(text).toContain('₹1,250');
  // The seeker's own intake opens the conversation — requestChat posts it as
  // the transcript's first message, delivered here the same way as any other
  // (see the subscribeToConsultation mock in helpers/apiMock.ts).
  expect(text).toContain('Name: Mithu');
  // The header counts the session up from zero — services/api.ts's getChatState
  // is what actually supplies startedAt, so this is that mock's own clock.
  expect(text).toContain('(00:00 mins)');

  await ReactTestRenderer.act(() => {
    jest.advanceTimersByTime(2000);
  });
  expect(textOf(tree)).toContain('(00:02 mins)');

  const send = () => findPressable(tree, 'Send');
  expect(send().props.disabled).toBe(true);

  const input = tree.root.findAll(
    n => typeof n.type === 'string' && n.props.accessibilityLabel === 'Type message',
  )[0];
  await ReactTestRenderer.act(() => {
    input.props.onChangeText('When is a good day to travel?');
  });
  expect(send().props.disabled).toBe(false);

  await ReactTestRenderer.act(() => {
    send().props.onPress();
  });
  expect(textOf(tree)).toContain('When is a good day to travel?');

  await ReactTestRenderer.act(() => {
    findPressable(tree, 'End the consultation').props.onPress();
  });
  expect(textOf(tree)).toContain('End Chat ?');
  expect(onEnd).not.toHaveBeenCalled();

  // "No, Stay Here" just closes the confirm sheet — the session keeps going.
  await ReactTestRenderer.act(() => {
    findPressable(tree, 'No, Stay Here').props.onPress();
  });
  expect(textOf(tree)).not.toContain('End Chat ?');
  expect(onEnd).not.toHaveBeenCalled();

  await ReactTestRenderer.act(() => {
    findPressable(tree, 'End the consultation').props.onPress();
  });
  await ReactTestRenderer.act(() => {
    findPressable(tree, 'Yes, End Chat').props.onPress();
  });
  expect(textOf(tree)).toContain('More Guidance Awaits You');
  expect(onEnd).not.toHaveBeenCalled();

  // "Yes, Start Chat" backs out of ending — the session is still live.
  await ReactTestRenderer.act(() => {
    findPressable(tree, 'Yes, Start Chat').props.onPress();
  });
  expect(textOf(tree)).not.toContain('More Guidance Awaits You');
  expect(onEnd).not.toHaveBeenCalled();

  await ReactTestRenderer.act(() => {
    findPressable(tree, 'End the consultation').props.onPress();
  });
  await ReactTestRenderer.act(() => {
    findPressable(tree, 'Yes, End Chat').props.onPress();
  });
  await ReactTestRenderer.act(() => {
    findPressable(tree, 'No').props.onPress();
  });
  expect(onEnd).toHaveBeenCalled();
  jest.useRealTimers();
});

test('the astrologer disconnecting and reconnecting shows as a system line, not an alert', async () => {
  const tree = await render(
    <ConsultationChatScreen chatId="chat-1" astrologerName="Astro Rakesh" />,
  );

  await ReactTestRenderer.act(() => {
    fireAstrologerLeft({ chatId: 'chat-1', reconnectSeconds: 60 });
  });
  expect(textOf(tree)).toContain(
    'Astro Rakesh disconnected. Waiting up to 60s for them to reconnect…',
  );

  await ReactTestRenderer.act(() => {
    fireAstrologerJoined({ chatId: 'chat-1' });
  });
  expect(textOf(tree)).toContain('Astro Rakesh is back.');
});

test('low balance shows a banner (not an alert), and Recharge opens the popup through to a real top-up', async () => {
  const tree = await render(
    <ConsultationChatScreen chatId="chat-1" astrologerName="Astro Rakesh" />,
  );

  await ReactTestRenderer.act(() => {
    fireLowBalance({ chatId: 'chat-1', exhausted: false, minutesRemaining: 1, balanceRemaining: 40 });
  });
  let text = textOf(tree);
  expect(text).toContain('Low Balance:');
  // The payload's own balanceRemaining is pushed straight into wallet state — no reload round-trip needed.
  expect(text).toContain('40');
  expect(text).toContain('₹40');

  // While the banner is up, the composer can't send — the seeker has to recharge first.
  const send = () => findPressable(tree, 'Send');
  const input = () =>
    tree.root.findAll(
      n => typeof n.type === 'string' && n.props.accessibilityLabel === 'Type message',
    )[0];
  await ReactTestRenderer.act(() => {
    input().props.onChangeText('Still here?');
  });
  expect(send().props.disabled).toBe(true);
  expect(input().props.editable).toBe(false);

  await ReactTestRenderer.act(() => {
    findPressable(tree, 'Recharge wallet').props.onPress();
  });
  text = textOf(tree);
  expect(text).toContain('Recharge Now');
  expect(text).toContain("Don't let low balance interrupt your chat");
  // services/api.ts's getChatState mock rate (₹20/min) — the popup's own minimum-to-continue line.
  expect(text).toContain('Minimum balance need to talk is');
  expect(text).toContain('₹ 20');
  // The ₹500 tile is selected by default (Figma's "Most Popular").
  expect(text).toContain('★ Most Popular');
  expect(text).toContain("You'll get");
  expect(text).toContain('₹ 750');
  expect(text).toContain('on the recharge of');
  expect(text).toContain('Total Amount');
  expect(text).toContain('₹ 590');

  // A cheaper tile recomputes the whole breakdown.
  await ReactTestRenderer.act(() => {
    findPressable(tree, '₹100, get ₹50 extra').props.onPress();
  });
  text = textOf(tree);
  expect(text).toContain('You\'ll get');
  expect(text).toContain('₹ 150');
  expect(text).toContain('on the recharge of');
  expect(text).toContain('₹ 100');
  expect(text).toContain('GST (18%)');
  expect(text).toContain('₹ 18');
  expect(text).toContain('₹ 118');

  await ReactTestRenderer.act(async () => {
    await findPressable(tree, 'Pay Now').props.onPress();
  });
  // services/api.ts's startTopUp/confirmTopUp mocks resolve immediately — the popup and banner both close once the credit lands.
  expect(textOf(tree)).not.toContain('Recharge Now');
  expect(textOf(tree)).not.toContain('Low Balance:');

  // A normal tick on its own also clears a standing low-balance banner, and its own balanceRemaining lands on the wallet pill.
  await ReactTestRenderer.act(() => {
    fireLowBalance({ chatId: 'chat-1', exhausted: true, graceSeconds: 15 });
  });
  expect(textOf(tree)).toContain('Low Balance:');
  await ReactTestRenderer.act(() => {
    fireTick({ minutesBilled: 3, minutesRemaining: 10, balanceRemaining: 980 });
  });
  expect(textOf(tree)).not.toContain('Low Balance:');
  expect(textOf(tree)).toContain('₹980');
  // Balance is fine again, so the composer is usable once more (the earlier "Still here?" draft was never sent).
  expect(findPressable(tree, 'Send').props.disabled).toBe(false);
});

test('an actual balance pause freezes the running clock, and a resume picks it back up', async () => {
  jest.useFakeTimers();
  const tree = await render(
    <ConsultationChatScreen chatId="chat-1" astrologerName="Astro Rakesh" />,
  );

  await ReactTestRenderer.act(() => {
    jest.advanceTimersByTime(5000);
  });
  expect(textOf(tree)).toContain('(00:05 mins)');

  // The real cutoff pauses the session — not just a warning, the clock itself stops.
  await ReactTestRenderer.act(() => {
    fireLowBalance({ chatId: 'chat-1', exhausted: true, paused: true, balanceRemaining: 0 });
  });
  expect(textOf(tree)).toContain('Low Balance:');

  await ReactTestRenderer.act(() => {
    jest.advanceTimersByTime(10000);
  });
  expect(textOf(tree)).toContain('(00:05 mins)');
  expect(findPressable(tree, 'Send').props.disabled).toBe(true);

  // A top-up resumes it (chat.service.js's resumePausedSessionsForUser announces this the same way, paused: false).
  await ReactTestRenderer.act(() => {
    fireLowBalance({ chatId: 'chat-1', exhausted: false, paused: false, balanceRemaining: 40 });
  });
  expect(textOf(tree)).not.toContain('Low Balance:');

  await ReactTestRenderer.act(() => {
    jest.advanceTimersByTime(3000);
  });
  // Only the 3 seconds since resuming count — the 10 paused seconds never did.
  expect(textOf(tree)).toContain('(00:08 mins)');
  jest.useRealTimers();
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

  // Posting is now a real (mocked) askAi() round trip — one more act() pass
  // lets that promise, and the reply it appends, settle before asserting.
  await ReactTestRenderer.act(async () => {
    findPressable(tree, 'Send').props.onPress();
    for (let i = 0; i < 5; i += 1) {
      await Promise.resolve();
    }
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

  await ReactTestRenderer.act(async () => {
    chip.props.onPress();
    for (let i = 0; i < 5; i += 1) {
      await Promise.resolve();
    }
  });

  // Once as the chip, once as the posted message.
  const dump = JSON.stringify(tree.toJSON());
  expect(dump.split(prompt)).toHaveLength(3);
});

test('generated kundli renders the chart, key positions, planetary table and dasha', async () => {
  const tree = await render(<KundliResultScreen profileId="profile-1" />);
  const dump = JSON.stringify(tree.toJSON());

  expect(dump).toContain('Key Positions');
  expect(dump).toContain('Cancer');
  expect(dump).toContain('Planetary Positions');
  expect(dump).toContain('Debilitated');
  expect(dump).toContain('Vimshottari Dasha');
  expect(dump).toContain('Current & Upcoming Mahadasha');
  expect(dump).toContain('Venus Dasha');
  expect(dump).toContain('CURRENT');
  expect(dump).toContain('Planetary Strength (Shadbala)');
  expect(dump).toContain('116%');
  expect(dump).toContain('Recommended Remedies');
  expect(dump).toContain('Nakshatra Pujan');
  expect(dump).toContain('Yellow Sapphire');
  expect(dump).toContain('Thursday');
  expect(dump).toContain('Deep Astrology Analysis');

  const tabs = findTabs(tree);
  expect(tabs[1].props.accessibilityState.selected).toBe(true);
});

test('astrology analysis switches between its three readings', async () => {
  const tree = await render(<AstrologyAnalysisScreen profileId="profile-1" />);
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
  expect(dump).toContain('Venus Dasha');
  expect(dump).toContain('ACTIVE');
  expect(dump).toContain('Antardasha (Sub-periods of the current Mahadasha)');
  expect(dump).toContain('Saturn');
  expect(segments()[0].props.accessibilityState.selected).toBe(true);

  await ReactTestRenderer.act(() => {
    segments()[1].props.onPress();
  });
  dump = JSON.stringify(tree.toJSON());
  expect(dump).toContain('Yoga analysis is coming soon.');
  expect(dump).not.toContain('Mahadasha (Major Periods)');

  await ReactTestRenderer.act(() => {
    segments()[2].props.onPress();
  });
  dump = JSON.stringify(tree.toJSON());
  expect(dump).toContain('Kaal Sarp Dosha');
  expect(dump).toContain('Sade Sati');
  expect(dump).toContain('Present');
  expect(dump).toContain('Absent');
  expect(dump).toContain('Middle Phase');
  expect(dump).not.toContain('Yoga analysis is coming soon.');
});

test('wallet renders balance, quick add, totals and the ledger', async () => {
  const tree = await render(<WalletScreen />);
  const text = textOf(tree);
  expect(text).toContain('Wallet');
  expect(text).toContain('AVAILABLE BALANCE');
  expect(text).toContain('₹1,250');
  expect(text).toContain('62 mins of chat consultation');
  expect(text).toContain('+ Add Money');
  expect(text).toContain('Quick Add');
  expect(text).toContain('₹2000');
  expect(text).toContain('Total Spent');
  expect(text).toContain('₹1,750');
  expect(text).toContain('Total Added');
  expect(text).toContain('₹3,000');
  expect(text).toContain('Recent Transactions');
  expect(text).toContain('Chat Consultation');
  expect(findTabs(tree)[3].props.accessibilityState.selected).toBe(true);
});

test('add money edits the amount and carries it to the CTA', async () => {
  const tree = await render(<AddMoneyScreen />);
  expect(textOf(tree)).toContain('Add Money');
  expect(textOf(tree)).toContain('Min ₹10 · Max ₹1,00,000');
  expect(textOf(tree)).toContain('Proceed to Pay ₹200');
  expect(textOf(tree)).toContain('Secure Payments');

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
  expect(textOf(tree)).toContain('256-bit encrypted');
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

test('profile shows the real rashi — the Moon sign, not a Sun sign or the design fixture', async () => {
  const treeWithRashi = await render(
    <ProfileScreen
      user={{ name: 'Priya Nair', email: 'priya@example.com' }}
      profile={{
        zodiac: { moonSign: 'Cancer' },
        birthDetails: { dateOfBirth: '1998-04-02T00:00:00.000Z', place: { formatted: 'Pune, Maharashtra' } },
        wallet: { balance: 500 },
        stats: { consultations: 2, kundlis: 1 },
      }}
    />,
  );
  const textWithRashi = textOf(treeWithRashi);
  expect(textWithRashi).toContain('Cancer');
  expect(textWithRashi).toContain('Pune, Maharashtra');
  // Never the dummy fixture's Sun sign once a real profile is on hand.
  expect(textWithRashi).not.toContain('Leo · 15 Aug 1995 · Mumbai');

  // A real profile whose rashi hasn't resolved yet (birth details still pending) — never a fallback to a Sun sign either.
  const treeWithoutRashi = await render(
    <ProfileScreen user={{ name: 'Priya Nair', email: 'priya@example.com' }} profile={{}} />,
  );
  expect(textOf(treeWithoutRashi)).toContain('Your rashi will appear here soon');
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

test('edit profile hydrates once the real account loads, even if it mounted before that', async () => {
  // The app shell renders this screen before GET /users/me necessarily resolves —
  // `initial` starts undefined and arrives a tick later.
  const tree = await render(<EditProfileScreen />);
  expect(tree.root.findAllByType(TextInput).map(i => i.props.value)).toContain('Arjun Sharma');

  await ReactTestRenderer.act(() => {
    tree.update(
      <SafeAreaProvider initialMetrics={METRICS}>
        <EditProfileScreen
          initial={{
            fullName: 'Priya Verma',
            email: 'priya@example.com',
            phone: '9998887776',
            dateOfBirth: '02/02/1992',
            timeOfBirth: '11:15 PM',
            placeOfBirth: 'Pune, Maharashtra',
            gender: 'female',
          }}
        />
      </SafeAreaProvider>,
    );
  });

  const values = tree.root.findAllByType(TextInput).map(i => i.props.value);
  expect(values).toContain('Priya Verma');
  expect(values).toContain('Pune, Maharashtra');
  expect(values).not.toContain('Arjun Sharma');
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
  expect(text).toContain('2 expert astrologers');
  expect(text).toContain('Pt. Rajesh Sharma');
  expect(text).toContain('Vedic, Numerology');
  expect(text).toContain('18 yrs exp');
  expect(text).toContain('4,820 consults');

  // Every chip is a query the server answers, so the list is refetched.
  const chip = (index: number) =>
    tree.root.findAll(
      n =>
        typeof n.type !== 'string' &&
        n.props.accessibilityRole === 'tab' &&
        typeof n.props.onPress === 'function',
    )[index];

  // The Tarot chip narrows it to Kavita.
  await ReactTestRenderer.act(() => {
    chip(3).props.onPress();
  });
  await flush();
  text = textOf(tree);
  expect(text).toContain('Kavita Joshi');
  expect(text).not.toContain('Pt. Rajesh Sharma');

  // Searching goes to the server too.
  await ReactTestRenderer.act(() => {
    chip(0).props.onPress();
  });
  await ReactTestRenderer.act(() => {
    tree.root.findAllByType(TextInput)[0].props.onChangeText('rajesh');
  });
  await flush();
  text = textOf(tree);
  expect(text).toContain('Pt. Rajesh Sharma');
  expect(text).not.toContain('Kavita Joshi');

  // And a search that matches nobody falls back to the empty state.
  await ReactTestRenderer.act(() => {
    tree.root.findAllByType(TextInput)[0].props.onChangeText('nobody');
  });
  await flush();
  expect(textOf(tree)).toContain('No astrologers match');
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
    expect.objectContaining({ id: 'a-rajesh' }),
  );
});

test('astrologer detail renders every section', async () => {
  const tree = await render(
    <AstrologerDetailScreen
      astrologer={{ id: 'a-rajesh', name: 'Pt. Rajesh Sharma', photo: astrologers[0].photo }}
    />,
  );
  const text = textOf(tree);
  expect(text).toContain('Pt. Rajesh Sharma');
  /** The pill shows the seeker's own wallet, not the astrologer's. */
  expect(text).toContain('₹1,250');
  expect(text).toContain('Hindi, English');
  expect(text).toContain('Numerology');
  expect(text).toContain('18 Years');
  expect(text).toContain('2K Mins');
  expect(text).toContain('₹20/min');
  // A struck-through "was" ₹10 over the real rate sits beside it, same as the listing card.
  expect(text).toContain('₹30/min');
  expect(text).toContain('Follow');
  expect(text).toContain('Astro Media');
  /** The Specialization section lists the astrologer's own declared expertise. */
  expect(text).toContain('Specialization');
  expect(text).toContain('Vedic');
  expect(text).toContain('Languages Known');
  expect(text).toContain('English');
  expect(text).toContain('About Us');
  expect(text).toContain('Read More');
  expect(text).toContain('Chat Now');
  expect(text).toContain('Call Now');
});

test('a home carousel card opens the astrologer it names', async () => {
  const onSelectAstrologer = jest.fn();
  const tree = await render(
    <HomeScreen onSelectAstrologer={onSelectAstrologer} />,
  );

  const card = tree.root.findAll(
    n =>
      typeof n.type !== 'string' &&
      typeof n.props.onPress === 'function' &&
      n.props.accessibilityLabel?.startsWith('Pt. Rajesh Sharma'),
  )[0];
  await ReactTestRenderer.act(() => {
    card.props.onPress();
  });

  expect(onSelectAstrologer).toHaveBeenCalledWith(
    expect.objectContaining({ id: 'a-rajesh' }),
  );

  // Chat and Call start on the same profile.
  await ReactTestRenderer.act(() => {
    findPressable(tree, 'Chat with Kavita Joshi').props.onPress();
  });
  await ReactTestRenderer.act(() => {
    findPressable(tree, 'Call Kavita Joshi').props.onPress();
  });
  expect(onSelectAstrologer).toHaveBeenCalledTimes(3);
});

test('the detail screen prints the astrologer it was handed', async () => {
  const tree = await render(
    <AstrologerDetailScreen
      astrologer={{
        id: 'a-kavita',
        name: 'Kavita Joshi',
        photo: astrologers[1].photo,
        online: true,
        experience: 'Exp-12 yrs',
        rate: '₹15/min',
        specialities: 'Tarot · Numerology',
      }}
    />,
  );
  const text = textOf(tree);

  /**
   * The card that was tapped paints the header, and the fetch by id fills in
   * the rest — so the screen shows the record, not the summary it was handed.
   */
  expect(text).toContain('Kavita Joshi');
  expect(text).toContain('Tarot');
  expect(text).toContain('12 Years');
  expect(text).toContain('₹15/min');
  // A struck-through "was" ₹10 over the real rate sits beside it, same as the listing card.
  expect(text).toContain('₹25/min');
  expect(text).toContain('Chat Now');
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
  expect(text).toContain('Pt. Rajesh Sharma');
  expect(text).toContain('Hindi, English');
  expect(text).toContain('Numerology');
  expect(text).toContain('18 Yrs');
  expect(text).toContain('4,820');
  // The real rate always shows — no "Free" tag.
  expect(text).toContain('₹20/min');
  expect(text).toContain('₹15/min');
  // A struck-through "was" ₹10 over the real rate sits beside it.
  expect(text).toContain('₹30/min');
  expect(text).toContain('₹25/min');
  expect(text).not.toContain('Free');

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
  expect(text).toContain('₹15/min');
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

/** The header's sliders button, which is what raises the Sort & Filter sheet. */
const openFilters = async (tree: ReactTestRenderer.ReactTestRenderer) => {
  const button = tree.root.find(
    n =>
      typeof n.type !== 'string' &&
      n.props.accessibilityLabel === 'Filter astrologers' &&
      typeof n.props.onPress === 'function',
  );
  await ReactTestRenderer.act(() => {
    button.props.onPress();
  });
};

/** A checkbox row inside the sheet's option panel. */
const optionRow = (tree: ReactTestRenderer.ReactTestRenderer, label: string) =>
  tree.root.find(
    n =>
      typeof n.type !== 'string' &&
      n.props.accessibilityRole === 'checkbox' &&
      n.props.accessibilityLabel === label,
  );

/** Lets the sheet finish sliding out, so its exit lands inside act(). */
const settle = async (ms = 260) => {
  await ReactTestRenderer.act(async () => {
    await new Promise<void>(resolve => {
      setTimeout(resolve, ms);
    });
  });
};

const pressLabelled = async (
  tree: ReactTestRenderer.ReactTestRenderer,
  label: string,
) => {
  const node = tree.root.find(
    n =>
      typeof n.type !== 'string' &&
      n.props.accessibilityLabel === label &&
      typeof n.props.onPress === 'function',
  );
  await ReactTestRenderer.act(() => {
    node.props.onPress();
  });
};

test('the filter sheet opens with Figma\'s expertise ticks', async () => {
  const tree = await render(<AvailableAstrologersScreen />);
  expect(textOf(tree)).not.toContain('Sort & Filter');

  await openFilters(tree);
  const text = textOf(tree);
  expect(text).toContain('Sort & Filter');
  // Every section on the rail.
  for (const section of [
    'Expertise',
    'Language',
    'Experience',
    'Sort By Price',
    'Gender',
    'Status',
    'Top Astrologers',
  ]) {
    expect(text).toContain(section);
  }
  expect(text).toContain('Select all');
  expect(text).toContain('Clear');
  expect(text).toContain('Apply');

  // The five Figma ticks, and the five it leaves empty.
  for (const label of [
    'Numerology',
    'Vastu',
    'Face Reading',
    'Nadi',
    'Krishnamurti Paddhati',
  ]) {
    expect(optionRow(tree, label).props.accessibilityState.checked).toBe(true);
  }
  for (const label of ['Tarot', 'Vedic', 'Palmistry', 'Life Coach', 'Prashna']) {
    expect(optionRow(tree, label).props.accessibilityState.checked).toBe(false);
  }
});

test('switching sections swaps the option panel', async () => {
  const tree = await render(<AvailableAstrologersScreen />);
  await openFilters(tree);
  // Not "Numerology" — the cards behind the sheet carry that as a tag too.
  expect(textOf(tree)).toContain('Krishnamurti Paddhati');

  await pressLabelled(tree, 'Status filters');

  const text = textOf(tree);
  expect(text).toContain('Online');
  expect(text).toContain('Busy');
  expect(text).toContain('Offline');
  expect(text).not.toContain('Krishnamurti Paddhati');
});

test('applying a status filter narrows the directory and shows the receipt', async () => {
  const tree = await render(<AvailableAstrologersScreen />);
  // Both mocked astrologers are listed before anything is filtered.
  expect(textOf(tree)).toContain('Pt. Rajesh Sharma');
  expect(textOf(tree)).toContain('Kavita Joshi');

  await openFilters(tree);
  await pressLabelled(tree, 'Clear Expertise');
  await pressLabelled(tree, 'Status filters');
  await pressLabelled(tree, 'Online');
  await pressLabelled(tree, 'Apply filters');
  await settle();

  const text = textOf(tree);
  expect(text).toContain('Successfully Applied!');
  expect(text).not.toContain('Sort & Filter');
  // Only the online one survives — the filter ran on the server.
  expect(text).toContain('Pt. Rajesh Sharma');
  expect(text).not.toContain('Kavita Joshi');
});

test('a filter that matches nobody falls back to the empty state', async () => {
  const tree = await render(<AvailableAstrologersScreen />);

  // Tarot narrows it to Kavita, who is offline…
  await openFilters(tree);
  await pressLabelled(tree, 'Clear Expertise');
  await pressLabelled(tree, 'Tarot');
  await pressLabelled(tree, 'Apply filters');
  await settle();
  expect(textOf(tree)).toContain('Kavita Joshi');

  // …so pairing it with Online empties the list entirely.
  await openFilters(tree);
  await pressLabelled(tree, 'Status filters');
  await pressLabelled(tree, 'Online');
  await pressLabelled(tree, 'Apply filters');
  await settle();

  const text = textOf(tree);
  expect(text).toContain('No astrologers match these filters.');
  expect(text).not.toContain('Kavita Joshi');
});

test('closing the sheet drops the draft instead of applying it', async () => {
  const tree = await render(<AvailableAstrologersScreen />);
  await openFilters(tree);
  await pressLabelled(tree, 'Clear Expertise');
  await pressLabelled(tree, 'Close filters');
  await settle();
  expect(textOf(tree)).not.toContain('Successfully Applied!');

  await openFilters(tree);
  expect(optionRow(tree, 'Numerology').props.accessibilityState.checked).toBe(
    true,
  );
});

test('the sort sections take one answer at a time', async () => {
  const tree = await render(<AvailableAstrologersScreen />);
  await openFilters(tree);
  await pressLabelled(tree, 'Sort By Price filters');

  await pressLabelled(tree, 'Low to High');
  expect(optionRow(tree, 'Low to High').props.accessibilityState.checked).toBe(
    true,
  );
  await pressLabelled(tree, 'High to Low');
  expect(optionRow(tree, 'Low to High').props.accessibilityState.checked).toBe(
    false,
  );
  expect(optionRow(tree, 'High to Low').props.accessibilityState.checked).toBe(
    true,
  );
});
