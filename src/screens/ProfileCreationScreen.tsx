import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
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
import {
  isFormValid,
  validateEmail,
  validateName,
  validatePhone,
  type FieldError,
} from '../utils/validation';
import { colors, designFrame, spacing, typography } from '../theme';

/** Top padding Figma drew, measured from the top of the status bar. */
const DESIGN_PADDING_TOP = 56;

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
};

/**
 * Step 1 of account creation: who the user is.
 * Figma: nodes 180:88665 (nothing chosen) and 180:88740 ("Male" chosen).
 */
export function ProfileCreationScreen({
  onContinue,
  onPickPhoto,
}: ProfileCreationScreenProps) {
  const insets = useSafeAreaInsets();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [gender, setGender] = useState<Gender>();
  /** Errors stay hidden until Continue is pressed, then follow every keystroke. */
  const [submitted, setSubmitted] = useState(false);
  /** The chosen photo, carried to the register call at the end of the wizard. */
  const [photo, setPhoto] = useState<PhotoAsset>();

  const errors: Record<string, FieldError> = {
    fullName: validateName(fullName),
    email: validateEmail(email),
    phoneNumber: validatePhone(phoneNumber),
    gender: gender === undefined ? 'Select a gender' : undefined,
  };
  const shown = (field: keyof typeof errors) =>
    submitted ? errors[field] : undefined;

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
    setSubmitted(true);
    if (!isFormValid(errors)) {
      return;
    }
    onContinue?.(
      { fullName: fullName.trim(), email: email.trim(), phoneNumber, gender },
      photo,
    );
  };

  return (
    <View style={styles.screen}>
      <StatusBar barStyle="dark-content" />

      <KeyboardAvoidingView
        style={styles.screen}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
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

          <View style={styles.form}>
            <FormField
              label="Full Name"
              value={fullName}
              onChangeText={setFullName}
              placeholder="Arjun Sharma"
              autoComplete="name"
              textContentType="name"
              error={shown('fullName')}
            />
            <FormField
              label="Email Address"
              value={email}
              onChangeText={setEmail}
              placeholder="arjun@example.com"
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              textContentType="emailAddress"
              error={shown('email')}
            />
            <FormField
              label="Phone Number"
              value={phoneNumber}
              onChangeText={setPhoneNumber}
              placeholder="+91 98765 43210"
              keyboardType="phone-pad"
              autoComplete="tel"
              textContentType="telephoneNumber"
              error={shown('phoneNumber')}
            />

            <View>
              <Text style={styles.genderLabel}>Gender</Text>
              <GenderSelector
                value={gender}
                onChange={setGender}
                style={styles.genderOptions}
              />
              {shown('gender') !== undefined && (
                <Text style={styles.error}>{errors.gender}</Text>
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
