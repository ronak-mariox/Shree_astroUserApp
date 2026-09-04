import React, { useState } from 'react';
import {
  Image,
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
import { WheelPickerDialog } from '../components/WheelPickerDialog';
import { CameraIcon } from '../components/icons/CameraIcon';
import { CalendarIcon, ClockIcon, LocationPinIcon } from '../components/icons/FormIcons';
import {
  DAY_COLUMN,
  MONTHS,
  MONTH_COLUMN,
  YEAR_COLUMN,
} from '../data/chatIntake';
import { account } from '../data/profile';
import type { PhotoAsset } from '../services/auth';
import { ApiError } from '../services/client';
import {
  isFormValid,
  validateDateOfBirth,
  validateEmail,
  validateName,
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

/** What the screen prefills from — the caller's real, signed-in profile. */
export type EditableProfile = {
  fullName: string;
  email: string;
  /** Display-only — the phone number is not editable here (see onSave doc). */
  phone: string;
  dateOfBirth: string;
  timeOfBirth: string;
  placeOfBirth: string;
  gender?: Gender;
  avatarUrl?: string;
};

/** The fields this screen is actually allowed to change. No `phone`: see onSave. */
export type ProfileChanges = {
  fullName: string;
  email: string;
  gender?: Gender;
  dateOfBirth: string;
  timeOfBirth: string;
  placeOfBirth: string;
};

const pad2 = (value: number) => String(value).padStart(2, '0');

/** "15/08/1999", the format {@link validateDateOfBirth} expects. */
const formatDob = (day: string, month: string, year: string) =>
  `${day}/${pad2(MONTHS.indexOf(month as (typeof MONTHS)[number]) + 1)}/${year}`;

/** The reverse of {@link formatDob} — falls back to a sensible default. */
const parseDob = (value: string) => {
  const match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(value);
  if (!match) {
    return { day: '01', month: 'Jan', year: '2000' };
  }
  const [, day, month, year] = match;
  return { day, month: MONTHS[Number(month) - 1] ?? 'Jan', year };
};

/** Top padding Figma drew, measured from the top of the status bar. */
const DESIGN_PADDING_TOP = 56;
const AVATAR_SIZE = 87.997;
const BADGE_SIZE = 29.993;
const BADGE_OFFSET = 62;

type EditProfileScreenProps = {
  /** The signed-in user's current details. Falls back to the design fixture when absent. */
  initial?: EditableProfile;
  onBack?: () => void;
  /**
   * Saves the form. `phone` is deliberately not part of `ProfileChanges` —
   * the backend does not let this endpoint touch it: changing a phone number
   * means proving the new one with an OTP, a flow of its own that does not
   * exist yet, so the field below is shown but not editable.
   */
  onSave?: (changes: ProfileChanges, photo?: PhotoAsset) => Promise<void> | void;
  onPickPhoto?: () => Promise<PhotoAsset | undefined>;
};

/**
 * Edits the stored account and birth details. Figma: node 180:163551.
 *
 * Same field set as {@link ProfileCreationScreen}, so it reuses FormField and
 * GenderSelector — the only difference is that the chosen gender reads orange
 * here rather than black.
 */
export function EditProfileScreen({
  initial,
  onBack,
  onSave,
  onPickPhoto,
}: EditProfileScreenProps) {
  const insets = useSafeAreaInsets();
  const [fullName, setFullName] = useState(initial?.fullName ?? account.name);
  const [email, setEmail] = useState(initial?.email ?? account.email);
  const phone = initial?.phone ?? account.phone;
  const [dateOfBirth, setDateOfBirth] = useState(initial?.dateOfBirth ?? account.dateOfBirth);
  const [timeOfBirth, setTimeOfBirth] = useState(initial?.timeOfBirth ?? account.timeOfBirth);
  const [placeOfBirth, setPlaceOfBirth] = useState(initial?.placeOfBirth ?? account.placeOfBirth);
  const [gender, setGender] = useState<Gender>(initial?.gender ?? 'male');
  /** A freshly picked photo, previewed here until Save sends it up. */
  const [photo, setPhoto] = useState<PhotoAsset>();
  /** Errors stay hidden until Save is pressed, then follow every keystroke. */
  const [submitted, setSubmitted] = useState(false);
  /** True while the change is being sent, so Save cannot be pressed twice. */
  const [saving, setSaving] = useState(false);
  /** What the server refused with — a duplicate email, or being unreachable. */
  const [saveError, setSaveError] = useState<string>();
  /** Whether the Date of Birth wheel is open. */
  const [datePickerOpen, setDatePickerOpen] = useState(false);

  const errors: Record<string, FieldError> = {
    fullName: validateName(fullName),
    email: validateEmail(email),
    dateOfBirth: validateDateOfBirth(dateOfBirth),
    timeOfBirth: validateTimeOfBirth(timeOfBirth),
    placeOfBirth: validatePlace(placeOfBirth),
  };
  const shown = (field: keyof typeof errors) =>
    submitted ? errors[field] : undefined;

  const handlePickPhoto = async () => {
    const picked = await onPickPhoto?.();
    if (picked) {
      setPhoto(picked);
    }
  };

  const handleSave = async () => {
    setSubmitted(true);
    setSaveError(undefined);
    if (!isFormValid(errors) || saving) {
      return;
    }

    setSaving(true);
    try {
      await onSave?.(
        { fullName, email, gender, dateOfBirth, timeOfBirth, placeOfBirth },
        photo,
      );
    } catch (error) {
      setSaveError(
        error instanceof ApiError
          ? error.message
          : 'Something went wrong. Please try again.',
      );
    } finally {
      setSaving(false);
    }
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
                <Image
                  source={
                    photo?.uri
                      ? { uri: photo.uri }
                      : initial?.avatarUrl
                      ? { uri: initial.avatarUrl }
                      : account.avatarPhoto
                  }
                  style={styles.avatarImage}
                  resizeMode="cover"
                />
              </View>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Change profile photo"
                onPress={handlePickPhoto}
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
              editable={false}
              hint="Changing your number needs a one-time verification, coming soon"
              keyboardType="phone-pad"
              autoComplete="tel"
            />
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Date of Birth"
              onPress={() => setDatePickerOpen(true)}
            >
              <View pointerEvents="none">
                <FormField
                  label="Date of Birth"
                  labelIcon={<CalendarIcon size={15} />}
                  value={dateOfBirth}
                  editable={false}
                  error={shown('dateOfBirth')}
                />
              </View>
            </Pressable>
            <FormField
              label="Time of Birth"
              labelIcon={<ClockIcon size={16} />}
              value={timeOfBirth}
              onChangeText={setTimeOfBirth}
              hint="Enter approximate time if exact time is unknown"
              error={shown('timeOfBirth')}
            />
            <FormField
              label="Place of Birth"
              labelIcon={<LocationPinIcon size={14} />}
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

            {saveError !== undefined && (
              <Text style={styles.saveError}>{saveError}</Text>
            )}

            <PrimaryButton
              label={saving ? 'Saving…' : 'Save Changes'}
              style={styles.save}
              onPress={handleSave}
              disabled={saving}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <WheelPickerDialog
        visible={datePickerOpen}
        title="Select Date"
        columns={[
          { key: 'day', values: DAY_COLUMN },
          { key: 'month', values: MONTH_COLUMN },
          { key: 'year', values: YEAR_COLUMN },
        ]}
        value={parseDob(dateOfBirth)}
        onCancel={() => setDatePickerOpen(false)}
        onSubmit={chosen => {
          setDateOfBirth(formatDob(chosen.day, chosen.month, chosen.year));
          setDatePickerOpen(false);
        }}
      />
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
  avatarImage: {
    width: 83,
    height: 84,
    borderRadius: 26,
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
  saveError: {
    ...typography.caption,
    color: colors.status.debit,
    textAlign: 'center',
  },
  save: {
    marginTop: spacing.sm,
  },
});
