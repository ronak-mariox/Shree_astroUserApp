import React, { useEffect, useRef, useState } from 'react';
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
import { useFormValidation } from '../hooks/useFormValidation';
import {
  EMAIL_MAX_LENGTH,
  NAME_MAX_LENGTH,
  PLACE_MAX_LENGTH,
  normaliseEmail,
  normaliseName,
  serverFieldErrors,
  validateDateOfBirth,
  validateEmail,
  validateName,
  validatePlace,
  validateTimeOfBirth,
  type FieldError,
} from '../utils/validation';

type Field = 'fullName' | 'email' | 'dateOfBirth' | 'timeOfBirth' | 'placeOfBirth';
const FIELDS: readonly Field[] = ['fullName', 'email', 'dateOfBirth', 'timeOfBirth', 'placeOfBirth'];
/** "06 : 30 AM" is 10 characters; a little room past that for a stray space. */
const TIME_MAX_LENGTH = 12;
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
  /** True while the change is being sent, so Save cannot be pressed twice. */
  const [saving, setSaving] = useState(false);
  /** What the server refused with — a duplicate email, or being unreachable. */
  const [saveError, setSaveError] = useState<string>();
  /** Whether the Date of Birth wheel is open. */
  const [datePickerOpen, setDatePickerOpen] = useState(false);

  /**
   * `useState(initial?.fullName ?? account.name)` above only reads `initial`
   * on the very first render — the real profile (`GET /users/me`) is fetched
   * asynchronously in the app shell, so if this screen is reached before that
   * resolves, every field would otherwise lock onto the design fixture
   * forever, even after the real data arrives a moment later. This hydrates
   * the form once real data shows up — guarded so it never fires again after
   * that (a fresh `initial` object identity on every parent render would
   * otherwise wipe out whatever the user is mid-typing).
   */
  const hydrated = useRef(Boolean(initial));
  useEffect(() => {
    if (hydrated.current || !initial) {
      return;
    }
    hydrated.current = true;
    setFullName(initial.fullName);
    setEmail(initial.email);
    setDateOfBirth(initial.dateOfBirth);
    setTimeOfBirth(initial.timeOfBirth);
    setPlaceOfBirth(initial.placeOfBirth);
    setGender(initial.gender ?? 'male');
  }, [initial]);

  const errors: Record<Field, FieldError> = {
    fullName: validateName(fullName),
    email: validateEmail(email),
    dateOfBirth: validateDateOfBirth(dateOfBirth),
    timeOfBirth: validateTimeOfBirth(timeOfBirth),
    placeOfBirth: validatePlace(placeOfBirth),
  };
  /** Errors show once a field is left or Save is pressed, then follow every keystroke. */
  const form = useFormValidation<Field>(
    { fullName, email, dateOfBirth, timeOfBirth, placeOfBirth },
    errors,
  );
  const shown = form.error;

  const handlePickPhoto = async () => {
    const picked = await onPickPhoto?.();
    if (picked) {
      setPhoto(picked);
    }
  };

  const handleSave = async () => {
    setSaveError(undefined);
    if (saving || !form.submit()) {
      return;
    }

    setSaving(true);
    try {
      await onSave?.(
        {
          fullName: normaliseName(fullName),
          email: normaliseEmail(email),
          gender,
          dateOfBirth,
          timeOfBirth: timeOfBirth.trim(),
          placeOfBirth: placeOfBirth.trim(),
        },
        photo,
      );
    } catch (error) {
      /** A field the server named (a taken email, say) is marked under that field. */
      const fields = serverFieldErrors(error, FIELDS);
      form.setServerErrors(fields);
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

          <View style={styles.form} onLayout={form.locateContainer}>
            <FormField
              label="Full Name"
              value={fullName}
              onChangeText={setFullName}
              onBlur={() => {
                setFullName(normaliseName(fullName));
                form.touch('fullName');
              }}
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
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete="email"
              textContentType="emailAddress"
              maxLength={EMAIL_MAX_LENGTH}
              returnKeyType="next"
              submitBehavior="submit"
              onSubmitEditing={() => form.focus('timeOfBirth')}
              inputRef={form.inputRef('email')}
              onContainerLayout={form.locate('email').onLayout}
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
              {...form.locate('dateOfBirth')}
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
              onBlur={() => form.touch('timeOfBirth')}
              placeholder="06:30 AM"
              hint="Enter approximate time if exact time is unknown"
              autoCapitalize="characters"
              autoCorrect={false}
              maxLength={TIME_MAX_LENGTH}
              returnKeyType="next"
              submitBehavior="submit"
              onSubmitEditing={() => form.focus('placeOfBirth')}
              inputRef={form.inputRef('timeOfBirth')}
              onContainerLayout={form.locate('timeOfBirth').onLayout}
              error={shown('timeOfBirth')}
            />
            <FormField
              label="Place of Birth"
              labelIcon={<LocationPinIcon size={14} />}
              value={placeOfBirth}
              onChangeText={setPlaceOfBirth}
              onBlur={() => form.touch('placeOfBirth')}
              autoCapitalize="words"
              autoCorrect={false}
              maxLength={PLACE_MAX_LENGTH}
              returnKeyType="done"
              inputRef={form.inputRef('placeOfBirth')}
              onContainerLayout={form.locate('placeOfBirth').onLayout}
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
        onCancel={() => {
          setDatePickerOpen(false);
          form.touch('dateOfBirth');
        }}
        onSubmit={chosen => {
          setDateOfBirth(formatDob(chosen.day, chosen.month, chosen.year));
          setDatePickerOpen(false);
          form.touch('dateOfBirth');
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
