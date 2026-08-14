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
  onContinue?: (profile: Profile) => void;
  onPickPhoto?: () => void;
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
              <AvatarPicker onPress={onPickPhoto} />
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
            />
            <FormField
              label="Phone Number"
              value={phoneNumber}
              onChangeText={setPhoneNumber}
              placeholder="+91 98765 43210"
              keyboardType="phone-pad"
              autoComplete="tel"
              textContentType="telephoneNumber"
            />

            <View>
              <Text style={styles.genderLabel}>Gender</Text>
              <GenderSelector
                value={gender}
                onChange={setGender}
                style={styles.genderOptions}
              />
            </View>

            <PrimaryButton
              label="Continue →"
              style={styles.continue}
              onPress={() =>
                onContinue?.({ fullName, email, phoneNumber, gender })
              }
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
  continue: {
    marginTop: spacing.sm,
  },
});
