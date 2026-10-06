/**
 * Every form's field validation, end to end on the real screens: a message
 * appears only once a field is left or Submit is pressed, a bad submit never
 * reaches the API (or the caller that would call it), a good one does with the
 * values tidied, and a server 422's `fields` land under the field they are about.
 */

import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import { TextInput } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { GenderSelector } from '../src/components/GenderSelector';
import { OptionPickerDialog } from '../src/components/OptionPickerDialog';
import { OtpInput } from '../src/components/OtpInput';
import { PrimaryButton } from '../src/components/PrimaryButton';
import { SecondaryButton } from '../src/components/SecondaryButton';
import { AddMoneyScreen } from '../src/screens/AddMoneyScreen';
import { AiAstrologyChatScreen } from '../src/screens/AiAstrologyChatScreen';
import { BirthDetailsScreen } from '../src/screens/BirthDetailsScreen';
import { ChatIntakeScreen } from '../src/screens/ChatIntakeScreen';
import { EditProfileScreen } from '../src/screens/EditProfileScreen';
import { EmailLoginScreen } from '../src/screens/EmailLoginScreen';
import { OtpLoginScreen } from '../src/screens/OtpLoginScreen';
import { ProfileCreationScreen } from '../src/screens/ProfileCreationScreen';
import { requestLoginOtp } from '../src/services/auth';
import { ApiError } from '../src/services/client';
import { MESSAGE_MAX_LENGTH } from '../src/utils/validation';

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
 * The test TextInput's `focus` is one jest.fn shared by every instance, so
 * which fields were focused is read off the `this` of each call.
 */
const focusOf = (tree: ReactTestRenderer.ReactTestRenderer): jest.Mock =>
  tree.root.findAll(n => n.type === TextInput)[0].instance.focus;
const focusedFields = (tree: ReactTestRenderer.ReactTestRenderer): string[] =>
  focusOf(tree).mock.contexts.map((input: any) => input.props.accessibilityLabel);

const render = async (element: React.ReactElement) => {
  let tree!: ReactTestRenderer.ReactTestRenderer;
  await ReactTestRenderer.act(() => {
    tree = ReactTestRenderer.create(
      <SafeAreaProvider initialMetrics={METRICS}>{element}</SafeAreaProvider>,
    );
  });
  await flush();
  focusOf(tree).mockClear();
  return tree;
};

const flush = async () => {
  await ReactTestRenderer.act(async () => {
    for (let i = 0; i < 5; i += 1) {
      await Promise.resolve();
    }
  });
};

const fieldNamed = (tree: ReactTestRenderer.ReactTestRenderer, label: string) =>
  tree.root.findAll(
    n => typeof n.type === 'string' && n.props.accessibilityLabel === label,
  )[0];

const findPressable = (tree: ReactTestRenderer.ReactTestRenderer, label: string) =>
  tree.root.findAll(
    n =>
      typeof n.type !== 'string' &&
      typeof n.props.onPress === 'function' &&
      n.props.accessibilityLabel === label,
  )[0];

const type = async (tree: ReactTestRenderer.ReactTestRenderer, label: string, text: string) => {
  await ReactTestRenderer.act(() => {
    fieldNamed(tree, label).props.onChangeText(text);
  });
};

const blur = async (tree: ReactTestRenderer.ReactTestRenderer, label: string) => {
  await ReactTestRenderer.act(() => {
    fieldNamed(tree, label).props.onBlur?.();
  });
};

/* ------------------------------------------------------------ Create Profile */

describe('Create Profile', () => {
  const pickMale = async (tree: ReactTestRenderer.ReactTestRenderer) => {
    await ReactTestRenderer.act(() => {
      tree.root
        .findAllByType(GenderSelector)[0]
        .findAll(n => n.props.accessibilityRole === 'radio')[0]
        .props.onPress();
    });
  };
  const submit = (tree: ReactTestRenderer.ReactTestRenderer) =>
    ReactTestRenderer.act(() => tree.root.findAllByType(PrimaryButton)[0].props.onPress());

  it('shows a field’s message once it is left, not while typing, and clears it when fixed', async () => {
    const tree = await render(<ProfileCreationScreen />);

    await type(tree, 'Full Name', 'A');
    expect(textOf(tree)).not.toContain('Full name must be at least 2 characters');

    await blur(tree, 'Full Name');
    expect(textOf(tree)).toContain('Full name must be at least 2 characters');

    await type(tree, 'Full Name', 'Arjun 2');
    expect(textOf(tree)).toContain('Full name can only contain letters');

    await type(tree, 'Full Name', 'Arjun');
    expect(textOf(tree)).not.toContain('Full name');
    // Fields not yet visited stay quiet.
    expect(textOf(tree)).not.toContain('Email address is required');
  });

  it('a bad submit shows every error, reveals the first bad field and hands nothing up', async () => {
    const onContinue = jest.fn();
    const tree = await render(<ProfileCreationScreen onContinue={onContinue} />);

    await type(tree, 'Full Name', 'Arjun Sharma');
    await type(tree, 'Email Address', 'arjun@example');
    await type(tree, 'Phone Number', '5876543210');
    await submit(tree);

    expect(onContinue).not.toHaveBeenCalled();
    const text = textOf(tree);
    expect(text).toContain('Enter a valid email address');
    expect(text).toContain('Mobile numbers start with 6, 7, 8 or 9');
    expect(text).toContain('Select a gender');
    expect(text).not.toContain('Full name');
    // The first invalid field is the email: it gets the cursor.
    expect(focusedFields(tree)).toEqual(['Email Address']);
  });

  it('a good submit hands up tidy values: Hindi name collapsed, email lowercased, phone as ten digits', async () => {
    const onContinue = jest.fn();
    const tree = await render(<ProfileCreationScreen onContinue={onContinue} />);

    await type(tree, 'Full Name', '  अर्जुन   शर्मा ');
    await type(tree, 'Email Address', ' Arjun@Example.COM ');
    await type(tree, 'Phone Number', '+91 98765 43210');
    await pickMale(tree);
    await submit(tree);

    expect(onContinue).toHaveBeenCalledWith(
      { fullName: 'अर्जुन शर्मा', email: 'arjun@example.com', phoneNumber: '9876543210', gender: 'male' },
      undefined,
    );
  });

  it('caps the name at 50 characters and offers the right keyboards', async () => {
    const tree = await render(<ProfileCreationScreen />);
    expect(fieldNamed(tree, 'Full Name').props.maxLength).toBe(50);
    expect(fieldNamed(tree, 'Email Address').props.keyboardType).toBe('email-address');
    expect(fieldNamed(tree, 'Email Address').props.autoCapitalize).toBe('none');
    expect(fieldNamed(tree, 'Phone Number').props.keyboardType).toBe('number-pad');
  });
});

/* ------------------------------------------------------------- Birth Details */

describe('Birth Details', () => {
  const pick = async (
    tree: ReactTestRenderer.ReactTestRenderer,
    label: 'Date of Birth' | 'Time of Birth',
    value: Record<string, string>,
  ) => {
    await ReactTestRenderer.act(() => {
      findPressable(tree, label).props.onPress();
    });
    await ReactTestRenderer.act(() => {
      tree.root
        .findAll(n => n.props.visible === true && typeof n.props.onSubmit === 'function')[0]
        .props.onSubmit(value);
    });
  };

  const fillValid = async (tree: ReactTestRenderer.ReactTestRenderer) => {
    await pick(tree, 'Date of Birth', { day: '29', month: 'Feb', year: '2000' });
    await pick(tree, 'Time of Birth', { hour: '06', minute: '30', meridiem: 'AM' });
    await type(tree, 'Place of Birth', 'Mumbai, Maharashtra');
  };

  it('Generate Kundli needs the place picked from the search; Save takes it as typed', async () => {
    const onGenerateKundli = jest.fn();
    const onSave = jest.fn();
    const tree = await render(
      <BirthDetailsScreen onGenerateKundli={onGenerateKundli} onSave={onSave} />,
    );
    await fillValid(tree);

    await ReactTestRenderer.act(() =>
      tree.root.findAllByType(SecondaryButton)[0].props.onPress(),
    );
    expect(onGenerateKundli).not.toHaveBeenCalled();
    expect(textOf(tree)).toContain('Select your birth place from the list');
    expect(focusedFields(tree)).toEqual(['Place of Birth']);

    await ReactTestRenderer.act(() =>
      tree.root.findAllByType(PrimaryButton)[0].props.onPress(),
    );
    expect(onSave).toHaveBeenCalledWith(
      expect.objectContaining({ dateOfBirth: '29/02/2000', placeOfBirth: 'Mumbai, Maharashtra' }),
    );
  });

  it('refuses Feb 29 outside a leap year and a year before 1900', async () => {
    const onSave = jest.fn();
    const tree = await render(<BirthDetailsScreen onSave={onSave} />);
    await fillValid(tree);
    await pick(tree, 'Date of Birth', { day: '29', month: 'Feb', year: '1999' });
    expect(textOf(tree)).toContain('2/1999 has 28 days');

    await ReactTestRenderer.act(() =>
      tree.root.findAllByType(PrimaryButton)[0].props.onPress(),
    );
    expect(onSave).not.toHaveBeenCalled();
  });

  it('a 422 from the server lands under the field it names, and editing that field clears it', async () => {
    const onSave = jest
      .fn()
      .mockRejectedValueOnce(
        new ApiError('Please check the form.', 422, { placeOfBirth: 'Enter your place of birth.' }),
      );
    const tree = await render(<BirthDetailsScreen onSave={onSave} />);
    await fillValid(tree);

    await ReactTestRenderer.act(async () => {
      await tree.root.findAllByType(PrimaryButton)[0].props.onPress();
    });
    expect(onSave).toHaveBeenCalledTimes(1);
    expect(textOf(tree)).toContain('Enter your place of birth.');
    // Said under the field, not repeated as a banner.
    expect(textOf(tree)).not.toContain('Please check the form.');

    await type(tree, 'Place of Birth', 'Pune, Maharashtra');
    expect(textOf(tree)).not.toContain('Enter your place of birth.');
  });
});

/* -------------------------------------------------------------- Edit Profile */

describe('Edit Profile', () => {
  const save = (tree: ReactTestRenderer.ReactTestRenderer) =>
    ReactTestRenderer.act(async () => {
      await tree.root.findAllByType(PrimaryButton)[0].props.onPress();
    });

  it('does not save a broken field, and focuses it', async () => {
    const onSave = jest.fn();
    const tree = await render(<EditProfileScreen onSave={onSave} />);

    await type(tree, 'Time of Birth', '25:00');
    await save(tree);

    expect(onSave).not.toHaveBeenCalled();
    expect(textOf(tree)).toContain('Hour must be between 00 and 23');
    expect(focusedFields(tree)).toEqual(['Time of Birth']);
  });

  it('saves tidy values', async () => {
    const onSave = jest.fn();
    const tree = await render(<EditProfileScreen onSave={onSave} />);

    await type(tree, 'Full Name', '  Priya   Verma ');
    await type(tree, 'Email Address', ' Priya@Example.com ');
    await save(tree);

    expect(onSave).toHaveBeenCalledWith(
      expect.objectContaining({ fullName: 'Priya Verma', email: 'priya@example.com' }),
      undefined,
    );
  });

  it('marks a taken email under the email field until it is changed', async () => {
    const onSave = jest
      .fn()
      .mockRejectedValueOnce(new ApiError('That email is already in use.', 409, { email: 'Already in use.' }));
    const tree = await render(<EditProfileScreen onSave={onSave} />);

    await save(tree);
    expect(textOf(tree)).toContain('Already in use.');
    expect(focusedFields(tree)).toEqual(['Email Address']);

    await type(tree, 'Email Address', 'another@example.com');
    expect(textOf(tree)).not.toContain('Already in use.');
  });
});

/* --------------------------------------------------------------- Chat Intake */

describe('Chat intake', () => {
  const connect = (tree: ReactTestRenderer.ReactTestRenderer) =>
    ReactTestRenderer.act(() => {
      findPressable(tree, 'Connect With Astro Ragini').props.onPress();
    });
  const pickTopic = async (tree: ReactTestRenderer.ReactTestRenderer) => {
    await ReactTestRenderer.act(() => {
      findPressable(tree, 'Topic of concern').props.onPress();
    });
    await ReactTestRenderer.act(() => {
      tree.root
        .findAllByType(OptionPickerDialog)
        .filter(d => d.props.visible)[0]
        .props.onSubmit('Career & Job');
    });
  };

  it('refuses a name with digits and a one-letter place, and connects once they are fixed', async () => {
    const onConnect = jest.fn();
    const tree = await render(<ChatIntakeScreen astrologerName="Astro Ragini" onConnect={onConnect} />);

    await type(tree, 'Full Name', 'Mithu 99');
    await type(tree, 'Birth Place', 'N');
    await pickTopic(tree);
    await connect(tree);

    expect(onConnect).not.toHaveBeenCalled();
    expect(textOf(tree)).toContain('Full name can only contain letters');
    expect(textOf(tree)).toContain('Birth place must be at least 2 characters');
    expect(focusedFields(tree)).toEqual(['Full Name']);

    await type(tree, 'Full Name', ' Mithu   Kumar ');
    await type(tree, 'Birth Place', 'Noida');
    await connect(tree);
    expect(onConnect).toHaveBeenCalledWith(
      expect.objectContaining({
        fullName: 'Mithu Kumar',
        // The intake's own worded date passes the same calendar rules.
        dateOfBirth: '08 February 1999',
        birthPlace: 'Noida',
        topic: 'Career & Job',
      }),
    );
  });

  it('does not re-check what is locked to the profile', async () => {
    const onConnect = jest.fn();
    const tree = await render(
      <ChatIntakeScreen
        astrologerName="Astro Ragini"
        fullName="Arjun S. 2nd"
        dateOfBirth="15 August 1999"
        timeOfBirth="06 : 30 AM"
        onConnect={onConnect}
      />,
    );
    await type(tree, 'Birth Place', 'Mumbai');
    await pickTopic(tree);
    await connect(tree);
    expect(onConnect).toHaveBeenCalledWith(expect.objectContaining({ fullName: 'Arjun S. 2nd' }));
  });
});

/* ----------------------------------------------------------------- Add Money */

describe('Add Money', () => {
  it('keeps whole rupees without leading zeros, however they are typed or pasted', async () => {
    const onProceed = jest.fn();
    const tree = await render(<AddMoneyScreen initialAmount={200} onProceed={onProceed} />);
    const amount = () => fieldNamed(tree, 'Amount to add');

    await type(tree, 'Amount to add', '007');
    expect(amount().props.value).toBe('7');
    expect(tree.root.findAllByType(PrimaryButton)[0].props.disabled).toBe(true);

    await type(tree, 'Amount to add', '₹1,500');
    expect(amount().props.value).toBe('1500');
    expect(amount().props.keyboardType).toBe('number-pad');

    await ReactTestRenderer.act(() => tree.root.findAllByType(PrimaryButton)[0].props.onPress());
    expect(onProceed).toHaveBeenCalledWith(1500);
  });
});

/* ------------------------------------------------------------- Sign-in (OTP) */

describe('Mobile sign-in', () => {
  const sendButton = (tree: ReactTestRenderer.ReactTestRenderer) =>
    tree.root.findAllByType(PrimaryButton)[0];

  it('a pasted +91 number becomes its ten digits and is what gets sent', async () => {
    const tree = await render(<OtpLoginScreen />);
    await type(tree, 'Mobile number', '+91 98765 43210');
    expect(fieldNamed(tree, 'Mobile number').props.value).toBe('9876543210');

    await ReactTestRenderer.act(async () => {
      await sendButton(tree).props.onPress();
    });
    expect(requestLoginOtp).toHaveBeenLastCalledWith({ channel: 'phone', phone: '9876543210' });
  });

  it('ten digits that are not a mobile number say so without waiting for a blur, and cannot be sent', async () => {
    const tree = await render(<OtpLoginScreen />);
    await type(tree, 'Mobile number', '1234567890');
    expect(textOf(tree)).toContain('Mobile numbers start with 6, 7, 8 or 9');
    expect(sendButton(tree).props.disabled).toBe(true);
  });

  it('the server’s message about the number shows under the number', async () => {
    (requestLoginOtp as jest.Mock).mockRejectedValueOnce(
      new ApiError('Please check the form.', 422, { phone: 'Enter a 10-digit mobile number.' }),
    );
    const tree = await render(<OtpLoginScreen />);
    await type(tree, 'Mobile number', '9876543210');
    await ReactTestRenderer.act(async () => {
      await sendButton(tree).props.onPress();
    });
    expect(textOf(tree)).toContain('Enter a 10-digit mobile number.');

    // Editing the number takes it away again.
    await type(tree, 'Mobile number', '987654321');
    expect(textOf(tree)).not.toContain('Enter a 10-digit mobile number.');
  });

  it('a pasted code is spread across the boxes, and Verify waits for all six', async () => {
    const tree = await render(<OtpLoginScreen />);
    await type(tree, 'Mobile number', '9876543210');
    await ReactTestRenderer.act(async () => {
      await sendButton(tree).props.onPress();
    });
    const verify = () => tree.root.findAllByType(PrimaryButton)[1];
    expect(verify().props.disabled).toBe(true);

    await type(tree, 'Digit 1 of 6', '12345');
    expect(tree.root.findByType(OtpInput).props.value).toBe('12345');
    expect(verify().props.disabled).toBe(true);

    await type(tree, 'Digit 1 of 6', '123456');
    expect(tree.root.findByType(OtpInput).props.value).toBe('123456');
    expect(verify().props.disabled).toBe(false);
  });
});

describe('Email sign-in', () => {
  it('says nothing while the address is typed, complains once it is left, and sends it lowercased', async () => {
    const tree = await render(<EmailLoginScreen />);

    await type(tree, 'Email address', 'Arjun@');
    expect(textOf(tree)).not.toContain('Enter a valid email address');
    await blur(tree, 'Email address');
    expect(textOf(tree)).toContain('Enter a valid email address');

    await type(tree, 'Email address', ' Arjun@Example.com ');
    expect(textOf(tree)).not.toContain('Enter a valid email address');
    await ReactTestRenderer.act(async () => {
      await tree.root.findAllByType(PrimaryButton)[0].props.onPress();
    });
    expect(requestLoginOtp).toHaveBeenLastCalledWith({ channel: 'email', email: 'arjun@example.com' });
  });
});

/* ----------------------------------------------------------------- Composers */

describe('Message composers', () => {
  it('the AI chat caps a message at the server’s limit and will not send a blank one', async () => {
    const tree = await render(<AiAstrologyChatScreen />);
    const input = fieldNamed(tree, 'Ask about your stars');
    expect(input.props.maxLength).toBe(MESSAGE_MAX_LENGTH);

    await type(tree, 'Ask about your stars', '   \n  ');
    expect(findPressable(tree, 'Send').props.disabled).toBe(true);
  });
});
