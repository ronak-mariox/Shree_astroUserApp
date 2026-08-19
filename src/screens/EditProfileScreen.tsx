import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BackButton } from '../components/BackButton';
import { FormField } from '../components/FormField';
import { GenderSelector, type Gender } from '../components/GenderSelector';
import { PrimaryButton } from '../components/PrimaryButton';
import { CameraIcon } from '../components/icons/CameraIcon';
import { account } from '../data/profile';
import {
  isFormValid,
  validateDateOfBirth,
  validateEmail,
  validateName,
  validatePhone,
  validatePlace,
  validateTimeOfBirth,
  type FieldError,
} from '../utils/validation';
import {
  colors,
  designFrame,
  radius,
  spacing,
  typography,
} from '../theme';

/** Top padding Figma drew, measured from the top of the status bar. */
const DESIGN_PADDING_TOP = 56;
const AVATAR_SIZE = 87.997;
const BADGE_SIZE = 29.993;
const BADGE_OFFSET = 62;

type EditProfileScreenProps = {
  onBack?: () => void;
  onSave?: () => void;
  onPickPhoto?: () => void;
};

/**
 * Edits the stored account and birth details. Figma: node 180:163551.
 *
 * Same field set as {@link ProfileCreationScreen}, so it reuses FormField and
 * GenderSelector — the only difference is that the chosen gender reads orange
 * here rather than black.
 */
export function EditProfileScreen({
  onBack,
  onSave,
  onPickPhoto,
}: EditProfileScreenProps) {
  const insets = useSafeAreaInsets();
  const [fullName, setFullName] = useState(account.name);
  const [email, setEmail] = useState(account.email);
  const [phone, setPhone] = useState(account.phone);
  const [dateOfBirth, setDateOfBirth] = useState(account.dateOfBirth);
  const [timeOfBirth, setTimeOfBirth] = useState(account.timeOfBirth);
  const [placeOfBirth, setPlaceOfBirth] = useState(account.placeOfBirth);
  const [gender, setGender] = useState<Gender>('male');
  /** Errors stay hidden until Save is pressed, then follow every keystroke. */
  const [submitted, setSubmitted] = useState(false);

  const errors: Record<string, FieldError> = {
    fullName: validateName(fullName),
    email: validateEmail(email),
    phone: validatePhone(phone),
    dateOfBirth: validateDateOfBirth(dateOfBirth),
    timeOfBirth: validateTimeOfBirth(timeOfBirth),
    placeOfBirth: validatePlace(placeOfBirth),
  };
  const shown = (field: keyof typeof errors) =>
    submitted ? errors[field] : undefined;

  const handleSave = () => {
    setSubmitted(true);
    if (!isFormValid(errors)) {
      return;
    }
    onSave?.();
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
            <View style={styles.headerRow}>
              <BackButton
                onPress={onBack}
                backgroundColor={colors.glass.dim}
                iconColor={colors.border.strong}
              />
              <Text style={styles.title}>Edit Profile</Text>
            </View>

            <View style={styles.avatarWrapper}>
              <View style={styles.avatar}>
                <Text style={styles.avatarGlyph}>{account.avatarGlyph}</Text>
              </View>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Change profile photo"
                onPress={onPickPhoto}
                style={({ pressed }) => [
                  styles.badge,
                  pressed && styles.pressed,
                ]}
              >
                <CameraIcon />
              </Pressable>
            </View>
          </View>

          <View style={styles.form}>
            <FormField
              label="Full Name"
              value={fullName}
              onChangeText={setFullName}
              autoComplete="name"
              error={shown('fullName')}
            />
            <FormField
              label="Email Address"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              error={shown('email')}
            />
            <FormField
              label="Phone Number"
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
              autoComplete="tel"
              error={shown('phone')}
            />
            <FormField
              label="Date of Birth"
              labelIcon="📅"
              value={dateOfBirth}
              onChangeText={setDateOfBirth}
              keyboardType="numbers-and-punctuation"
              error={shown('dateOfBirth')}
            />
            <FormField
              label="Time of Birth"
              labelIcon="⏰"
              value={timeOfBirth}
              onChangeText={setTimeOfBirth}
              hint="Enter approximate time if exact time is unknown"
              error={shown('timeOfBirth')}
            />
            <FormField
              label="Place of Birth"
              labelIcon="📍"
              value={placeOfBirth}
              onChangeText={setPlaceOfBirth}
              error={shown('placeOfBirth')}
            />

            <View>
              <Text style={styles.genderLabel}>Gender</Text>
              <GenderSelector
                value={gender}
                onChange={setGender}
                accent={colors.cosmos.accent}
                style={styles.genderOptions}
              />
            </View>

            <PrimaryButton
              label="Save Changes"
              style={styles.save}
              onPress={handleSave}
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
    backgroundColor: colors.canvas,
  },
  header: {
    backgroundColor: colors.brandYellow,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxxl,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  title: {
    ...typography.pageTitleSmall,
    color: colors.text.onYellow,
  },
  avatarWrapper: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    alignSelf: 'center',
    marginTop: spacing.xl,
  },
  avatar: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: radius.avatar,
    borderWidth: 2.265,
    borderColor: colors.progressTrack,
    backgroundColor: colors.brandYellow,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarGlyph: {
    fontSize: 44,
    lineHeight: 66,
    color: colors.text.onYellow,
  },
  badge: {
    position: 'absolute',
    left: BADGE_OFFSET,
    top: BADGE_OFFSET,
    width: BADGE_SIZE,
    height: BADGE_SIZE,
    borderRadius: radius.badge,
    backgroundColor: colors.surfaceDark,
    alignItems: 'center',
    justifyContent: 'center',
    // drop-shadow(0 2px 4px rgba(0, 0, 0, 0.15))
    ...Platform.select({
      ios: {
        shadowColor: colors.shadow,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 4,
      },
      android: { elevation: 4 },
      default: {},
    }),
  },
  pressed: {
    opacity: 0.8,
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
  save: {
    marginTop: spacing.sm,
  },
});
