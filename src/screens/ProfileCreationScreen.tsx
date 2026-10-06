import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AvatarPicker } from '../components/AvatarPicker';
import { FormField } from '../components/FormField';
import { GenderSelector, type Gender } from '../components/GenderSelector';
import { PrimaryButton } from '../components/PrimaryButton';
import { StepIndicator } from '../components/StepIndicator';
import type { PhotoAsset } from '../services/auth';
import { useFormValidation } from '../hooks/useFormValidation';
import {
  EMAIL_MAX_LENGTH,
  NAME_MAX_LENGTH,
  normaliseEmail,
  normaliseName,
  sanitizePhoneInput,
  validateEmail,
  validateName,
  validatePhone,
  type FieldError,
} from '../utils/validation';
import { colors, designFrame, spacing, typography } from '../theme';

/** Top padding Figma drew, measured from the top of the status bar. */
const DESIGN_PADDING_TOP = 56;

type Field = 'fullName' | 'email' | 'phoneNumber' | 'gender';

export type Profile = {
  fullName: string;
  email: string;
  phoneNumber: string;
  gender?: Gender;
};

type ProfileCreationScreenProps = {
  /** Hands step one up; nothing is sent until birth details are saved. */
  onContinue?: (profile: Profile, photo?: PhotoAsset) => void;
  /**
   * Opens the picker and resolves to whatever was chosen, or to nothing if the
   * user backed out. App.tsx passes `pickProfilePhoto`, which asks camera or
   * gallery and handles every refusal itself — so this screen only ever sees
   * an asset or `undefined`.
   */
  onPickPhoto?: () => Promise<PhotoAsset | undefined> | PhotoAsset | undefined | void;
  /**
   * What was already typed here, when the wizard's next step (Birth Details)
   * sent the user back — App.tsx keeps this screen's own values alive in its
   * lifted `signUp` state across the remount that happens every time the
   * route flips back to 'profileCreation'. Undefined the first time through.
   */
  initialProfile?: Profile;
  initialPhoto?: PhotoAsset;
};

/**
 * Step 1 of account creation: who the user is.
 * Figma: nodes 180:88665 (nothing chosen) and 180:88740 ("Male" chosen).
 */
export function ProfileCreationScreen({
  onContinue,
  onPickPhoto,
  initialProfile,
  initialPhoto,
}: ProfileCreationScreenProps) {
  const insets = useSafeAreaInsets();
  const [fullName, setFullName] = useState(initialProfile?.fullName ?? '');
  const [email, setEmail] = useState(initialProfile?.email ?? '');
  const [phoneNumber, setPhoneNumber] = useState(
    sanitizePhoneInput(initialProfile?.phoneNumber ?? ''),
  );
  const [gender, setGender] = useState<Gender | undefined>(initialProfile?.gender);
  /** The chosen photo, carried to the register call at the end of the wizard. */
  const [photo, setPhoto] = useState<PhotoAsset | undefined>(initialPhoto);

  const errors: Record<Field, FieldError> = {
    fullName: validateName(fullName),
    email: validateEmail(email),
    phoneNumber: validatePhone(phoneNumber),
    gender: gender === undefined ? 'Select a gender' : undefined,
  };
  /** Errors show once a field is left or Continue is pressed, then follow every keystroke. */
  const form = useFormValidation<Field>(
    { fullName, email, phoneNumber, gender },
    errors,
  );
  const shown = form.error;

  /** A pasted "+91 98765 43210" or "098765 43210" lands as its ten local digits; nothing past ten is kept. */
  const handlePhoneChange = (text: string) => setPhoneNumber(sanitizePhoneInput(text));

  const handlePickPhoto = async () => {
    /**
     * The picker reports its own failures, so there is nothing to show here —
     * but a rejection must not escape, or it becomes an unhandled promise and
     * the tap silently does nothing.
     */
    try {
      const picked = await onPickPhoto?.();
      if (picked) {
        setPhoto(picked);
      }
    } catch (error) {
      console.error('[ProfileCreation] picking a photo failed:', error);
    }
  };

  const handleContinue = () => {
    if (!form.submit()) {
      return;
    }
    onContinue?.(
      {
        fullName: normaliseName(fullName),
        email: normaliseEmail(email),
        phoneNumber,
        gender,
      },
      photo,
    );
  };

  return (
    <View style={styles.screen}>
      <StatusBar barStyle="dark-content" />

      <KeyboardAvoidingView
        style={styles.screen}
        behavior="padding"
      >
        <ScrollView
          ref={form.scrollRef}
          contentContainerStyle={{ paddingBottom: insets.bottom }}
          keyboardShouldPersistTaps="handled"
        >
          <View
            style={[
              styles.header,
              {
                paddingTop:
                  insets.top +
                  (DESIGN_PADDING_TOP - designFrame.statusBarHeight),
              },
            ]}
          >
            <Text style={styles.title}>Create Profile</Text>
            <Text style={styles.subtitle}>Tell us about yourself</Text>
            <StepIndicator step={1} style={styles.steps} />

            <View style={styles.avatar}>
              <AvatarPicker uri={photo?.uri} onPress={handlePickPhoto} />
            </View>
          </View>

          <View style={styles.form} onLayout={form.locateContainer}>
            <FormField
              label="Full Name"
              value={fullName}
              onChangeText={setFullName}
              onBlur={() => {
                setFullName(normaliseName(fullName));
                form.touch('fullName');
              }}
              placeholder="Arjun Sharma"
              autoComplete="name"
              textContentType="name"
              autoCapitalize="words"
              autoCorrect={false}
              maxLength={NAME_MAX_LENGTH}
              returnKeyType="next"
              submitBehavior="submit"
              onSubmitEditing={() => form.focus('email')}
              inputRef={form.inputRef('fullName')}
              onContainerLayout={form.locate('fullName').onLayout}
              error={shown('fullName')}
            />
            <FormField
              label="Email Address"
              value={email}
              onChangeText={setEmail}
              onBlur={() => {
                setEmail(email.trim());
                form.touch('email');
              }}
              placeholder="arjun@example.com"
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete="email"
              textContentType="emailAddress"
              maxLength={EMAIL_MAX_LENGTH}
              returnKeyType="next"
              submitBehavior="submit"
              onSubmitEditing={() => form.focus('phoneNumber')}
              inputRef={form.inputRef('email')}
              onContainerLayout={form.locate('email').onLayout}
              error={shown('email')}
            />
            <FormField
              label="Phone Number"
              value={phoneNumber}
              onChangeText={handlePhoneChange}
              onBlur={() => form.touch('phoneNumber')}
              placeholder="98765 43210"
              hint="10-digit Indian mobile number"
              keyboardType="number-pad"
              autoComplete="tel"
              textContentType="telephoneNumber"
              // Room for a pasted "+91 98765 43210"; the handler keeps only the ten digits.
              maxLength={16}
              returnKeyType="done"
              inputRef={form.inputRef('phoneNumber')}
              onContainerLayout={form.locate('phoneNumber').onLayout}
              error={shown('phoneNumber')}
            />

            <View {...form.locate('gender')}>
              <Text style={styles.genderLabel}>Gender</Text>
              <GenderSelector
                value={gender}
                onChange={setGender}
                style={styles.genderOptions}
              />
              {shown('gender') !== undefined && (
                <Text style={styles.error}>{shown('gender')}</Text>
              )}
            </View>

            <PrimaryButton
              label="Continue →"
              style={styles.continue}
              onPress={handleContinue}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  header: {
    backgroundColor: colors.brandYellow,
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.huge,
  },
  title: {
    ...typography.pageTitle,
    color: colors.text.onYellowStrong,
  },
  subtitle: {
    ...typography.footnote,
    color: colors.text.onYellowSubtle,
    paddingTop: spacing.xs,
  },
  steps: {
    marginTop: spacing.lg,
  },
  avatar: {
    alignItems: 'center',
    paddingTop: spacing.xl,
  },
  form: {
    padding: spacing.xl,
    gap: spacing.section,
  },
  genderLabel: {
    ...typography.fieldLabel,
    color: colors.text.primary,
  },
  genderOptions: {
    paddingTop: 10,
  },
  error: {
    ...typography.caption,
    color: colors.status.debit,
    paddingTop: 6,
  },
  continue: {
    marginTop: spacing.sm,
  },
});
