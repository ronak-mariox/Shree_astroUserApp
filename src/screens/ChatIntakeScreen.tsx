import React, { useEffect, useRef, useState } from 'react';
import {
  KeyboardAvoidingView,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BrandGradient } from '../components/BrandGradient';
import { ConsultationTypePicker } from '../components/ConsultationTypePicker';
import { OptionPickerDialog } from '../components/OptionPickerDialog';
import { WheelPickerDialog } from '../components/WheelPickerDialog';
import { ArrowLeftIcon } from '../components/icons/ArrowLeftIcon';
import { account } from '../data/profile';
import {
  DAY_COLUMN,
  HOUR_COLUMN,
  MERIDIEM_COLUMN,
  MINUTE_COLUMN,
  MONTH_COLUMN,
  SECOND_COLUMN,
  TOPICS,
  YEAR_COLUMN,
  formatBirthDate,
  formatBirthTime,
  type ChatIntake,
} from '../data/chatIntake';
import {
  PER_MINUTE,
  resolveQuotes,
  type ConsultationChoice,
  type PackageQuote,
} from '../data/consultPackages';
import { useApi } from '../hooks/useApi';
import { fetchRecentIntakeContacts, rupees } from '../services/api';
import {
  validateName,
  validatePlace,
  validateRequired,
  isFormValid,
  type FieldError,
} from '../utils/validation';
import {
  colors,
  designFrame,
  hairline,
  radius,
  spacing,
  typography,
} from '../theme';

/** Top padding Figma drew, measured from the top of the status bar. */
const DESIGN_PADDING_TOP = 58.78;
const FIELD_HEIGHT = 48;
const AVATAR_SIZE = 45.704;
const CTA_HEIGHT = 51;

type ChatIntakeScreenProps = {
  /** Who the intake is for — printed on the CTA. */
  astrologerName: string;
  /**
   * Already on file from the signed-in profile — filled in and locked rather
   * than left open to retyping, since a mismatch here would cast the chart
   * against different birth details than the ones on record. An account
   * without one of these yet (birth details never filed) leaves that field
   * open, same as before.
   */
  fullName?: string;
  dateOfBirth?: string;
  timeOfBirth?: string;
  onBack?: () => void;
  onMyOrders?: () => void;
  /** Fired with the completed form (including the chosen `consultation` type) when "Connect With …" is pressed. */
  onConnect?: (intake: ChatIntake) => void;
  /** 'chat' or 'call' — which of the astrologer's rates the packages are priced at. */
  channel?: 'chat' | 'call';
  /**
   * The astrologer's real per-minute rate for `channel` (from POST
   * /chats/precheck). Without one no price can be shown, so the
   * "Choose consultation type" section stays hidden and the request is
   * per-minute, exactly as before.
   */
  ratePerMinute?: number;
  /** The server's own package quotes for this astrologer — preferred over computing locally. */
  packageQuotes?: PackageQuote[];
  walletBalance?: number;
  /** True while the request is in flight — the button is disabled so a double tap can't send it twice. */
  submitting?: boolean;
  /**
   * What the seeker had already filled in (and which consultation type they
   * picked) the last time this form was open — restored on mount, so a trip
   * to recharge the wallet and back doesn't wipe the form.
   */
  draft?: Partial<ChatIntake>;
  /** Called with the form's current answers whenever they change — the caller keeps them as `draft`. */
  onDraftChange?: (draft: Partial<ChatIntake>) => void;
};

/**
 * The form a chat starts from: who the reading is for, their birth details,
 * what they want to talk about, and how long the session should run.
 * Figma: node 180:93411 — the minute windows are ours, the rest is the frame.
 */
export function ChatIntakeScreen({
  astrologerName,
  fullName: profileFullName,
  dateOfBirth: profileDateOfBirth,
  timeOfBirth: profileTimeOfBirth,
  onBack,
  onMyOrders,
  onConnect,
  channel = 'chat',
  ratePerMinute,
  packageQuotes,
  walletBalance,
  submitting = false,
  draft,
  onDraftChange,
}: ChatIntakeScreenProps) {
  const insets = useSafeAreaInsets();
  const recentContacts = useApi(() => fetchRecentIntakeContacts(), []);
  const [fullName, setFullName] = useState(profileFullName || draft?.fullName || account.name);
  const [dateOfBirth, setDateOfBirth] = useState(profileDateOfBirth || draft?.dateOfBirth || '08 February 1999');
  const [timeOfBirth, setTimeOfBirth] = useState(profileTimeOfBirth || draft?.timeOfBirth || '10 : 30 PM');
  const [gender, setGender] = useState<'male' | 'female'>(draft?.gender ?? 'male');

  /** The profile can still be loading on first mount; pick these up the moment it lands. */
  useEffect(() => {
    if (profileFullName) setFullName(profileFullName);
  }, [profileFullName]);
  useEffect(() => {
    if (profileDateOfBirth) setDateOfBirth(profileDateOfBirth);
  }, [profileDateOfBirth]);
  useEffect(() => {
    if (profileTimeOfBirth) setTimeOfBirth(profileTimeOfBirth);
  }, [profileTimeOfBirth]);

  /** Locked the moment the profile actually has one to show — see the prop doc above. */
  const fullNameLocked = Boolean(profileFullName);
  const dateOfBirthLocked = Boolean(profileDateOfBirth);
  const timeOfBirthLocked = Boolean(profileTimeOfBirth);
  const [birthPlace, setBirthPlace] = useState(draft?.birthPlace ?? '');
  const [topic, setTopic] = useState(draft?.topic ?? '');
  const [picker, setPicker] = useState<'date' | 'time' | 'topic' | null>(null);
  const [consultation, setConsultation] = useState<ConsultationChoice>(draft?.consultation ?? PER_MINUTE);

  /** Every answer, handed up as it changes so leaving (to recharge, say) and coming back restores it. */
  const draftListener = useRef(onDraftChange);
  draftListener.current = onDraftChange;
  useEffect(() => {
    draftListener.current?.({ fullName, dateOfBirth, timeOfBirth, gender, birthPlace, topic, consultation });
  }, [fullName, dateOfBirth, timeOfBirth, gender, birthPlace, topic, consultation]);
  const quotes = resolveQuotes(packageQuotes, ratePerMinute, walletBalance);
  const offersPackages = ratePerMinute !== undefined && ratePerMinute > 0 && quotes.length > 0;
  /** A re-priced quote (the rate changed and the screen was handed new quotes) replaces a stale selected price. */
  const selectedConsultation: ConsultationChoice =
    consultation.mode === 'package' && offersPackages
      ? (() => {
          const quote = quotes.find(entry => entry.minutes === consultation.minutes);
          return quote ? { mode: 'package', minutes: quote.minutes, price: quote.price } : PER_MINUTE;
        })()
      : PER_MINUTE;
  /** Errors stay hidden until Connect is pressed, then follow every keystroke — same convention as ProfileCreationScreen. */
  const [submitted, setSubmitted] = useState(false);

  const errors: Record<string, FieldError> = {
    fullName: validateName(fullName),
    dateOfBirth: validateRequired(dateOfBirth, 'Date of birth'),
    timeOfBirth: validateRequired(timeOfBirth, 'Time of birth'),
    birthPlace: validatePlace(birthPlace, 'Birth place'),
    topic: validateRequired(topic, 'Topic of concern'),
  };
  const shown = (field: keyof typeof errors) => (submitted ? errors[field] : undefined);

  const connect = () => {
    if (submitting) {
      return;
    }
    setSubmitted(true);
    if (!isFormValid(errors)) {
      return;
    }
    onConnect?.({
      fullName: fullName.trim(),
      dateOfBirth,
      timeOfBirth,
      gender,
      birthPlace: birthPlace.trim(),
      topic,
      consultation: selectedConsultation,
    });
  };

  return (
    <View style={styles.screen}>
      <StatusBar barStyle="dark-content" />

      <View
        style={[
          styles.header,
          {
            paddingTop:
              insets.top + (DESIGN_PADDING_TOP - designFrame.statusBarHeight),
          },
        ]}
      >
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Go back"
          onPress={onBack}
          style={({ pressed }) => pressed && styles.pressed}
        >
          <ArrowLeftIcon />
        </Pressable>

        <Text style={styles.headerTitle}>{channel === 'call' ? 'Call Intake Form' : 'Chat Intake Form'}</Text>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="My Orders"
          onPress={onMyOrders}
          style={({ pressed }) => [styles.orders, pressed && styles.pressed]}
        >
          <Text style={styles.ordersLabel}>My Orders</Text>
        </Pressable>
      </View>

      <KeyboardAvoidingView
        style={styles.body}
        behavior="padding"
      >
        <ScrollView
          contentContainerStyle={[
            styles.bodyContent,
            { paddingBottom: spacing.xl + insets.bottom },
          ]}
          keyboardShouldPersistTaps="handled"
        >
          {recentContacts.data !== null && recentContacts.data.length > 0 && (
            <>
              <Text style={styles.sectionTitle}>Recent Chats</Text>
              <View style={styles.recent}>
                {recentContacts.data.map(person => (
                  <Pressable
                    key={person.id}
                    accessibilityRole="button"
                    accessibilityLabel={`Use ${person.fullName}'s details again`}
                    onPress={() => {
                      if (!fullNameLocked) setFullName(person.fullName);
                      if (!dateOfBirthLocked && person.dateOfBirth) setDateOfBirth(person.dateOfBirth);
                      if (!timeOfBirthLocked && person.timeOfBirth) setTimeOfBirth(person.timeOfBirth);
                      if (person.gender) setGender(person.gender);
                      if (person.birthPlace) setBirthPlace(person.birthPlace);
                    }}
                    style={({ pressed }) => [
                      styles.recentPerson,
                      pressed && styles.pressed,
                    ]}
                  >
                    <View style={styles.recentAvatar}>
                      <Text style={styles.recentInitial}>
                        {person.fullName.slice(0, 1)}
                      </Text>
                    </View>
                    <Text style={styles.recentName} numberOfLines={1}>
                      {person.fullName}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </>
          )}

          <View style={styles.form}>
            <Field label="Full Name" error={shown('fullName')}>
              <TextInput
                accessibilityLabel="Full Name"
                value={fullName}
                onChangeText={setFullName}
                editable={!fullNameLocked}
                placeholder="Mithu Kumar"
                placeholderTextColor={colors.text.intakeLabel}
                style={[styles.input, fullNameLocked && styles.inputLocked]}
              />
            </Field>

            <View style={styles.row}>
              <Field label="Date of Birth" style={styles.rowItem} error={shown('dateOfBirth')}>
                <SelectBox
                  label="Date of Birth"
                  value={dateOfBirth}
                  disabled={dateOfBirthLocked}
                  onPress={() => setPicker('date')}
                />
              </Field>
              <Field label="Time of Birth" style={styles.rowItem} error={shown('timeOfBirth')}>
                <SelectBox
                  label="Time of Birth"
                  value={timeOfBirth}
                  disabled={timeOfBirthLocked}
                  onPress={() => setPicker('time')}
                />
              </Field>
            </View>

            <Field label="Gender">
              <View style={styles.row}>
                {(['male', 'female'] as const).map(option => {
                  const selected = gender === option;

                  return (
                    <Pressable
                      key={option}
                      accessibilityRole="radio"
                      accessibilityState={{ selected }}
                      accessibilityLabel={option === 'male' ? 'Male' : 'Female'}
                      onPress={() => setGender(option)}
                      style={({ pressed }) => [
                        styles.genderOption,
                        selected && styles.genderSelected,
                        pressed && styles.pressed,
                      ]}
                    >
                      <Text style={styles.genderGlyph}>
                        {option === 'male' ? '♂' : '♀'}
                      </Text>
                      <Text
                        style={[
                          styles.genderLabel,
                          selected && styles.genderLabelSelected,
                        ]}
                      >
                        {option === 'male' ? 'Male' : 'Female'}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </Field>

            <Field label="Birth Place" error={shown('birthPlace')}>
              <TextInput
                accessibilityLabel="Birth Place"
                value={birthPlace}
                onChangeText={setBirthPlace}
                placeholder="Noida 62"
                placeholderTextColor={colors.text.intakeLabel}
                style={styles.input}
              />
            </Field>

            <Field label="Topic of concern" error={shown('topic')}>
              <SelectBox
                label="Topic of concern"
                value={topic}
                placeholder="Choose a topic"
                caret
                onPress={() => setPicker('topic')}
              />
            </Field>
          </View>

          {offersPackages && (
            <View style={styles.consultation}>
              <ConsultationTypePicker
                channel={channel}
                ratePerMinute={ratePerMinute}
                quotes={quotes}
                walletBalance={walletBalance}
                value={selectedConsultation}
                onChange={setConsultation}
              />
            </View>
          )}

          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Connect With ${astrologerName}`}
            accessibilityState={{ disabled: submitting, busy: submitting }}
            disabled={submitting}
            onPress={connect}
            style={({ pressed }) => [styles.cta, (pressed || submitting) && styles.pressed]}
          >
            <BrandGradient radius={radius.field} />
            <Text style={styles.ctaLabel}>
              {submitting
                ? 'Connecting…'
                : selectedConsultation.mode === 'package'
                  ? `Pay ${rupees(selectedConsultation.price)} & Connect With ${astrologerName} →`
                  : `Connect With ${astrologerName} →`}
            </Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>

      <WheelPickerDialog
        visible={picker === 'date'}
        title="Select Date"
        columns={[
          { key: 'day', values: DAY_COLUMN },
          { key: 'month', values: MONTH_COLUMN },
          { key: 'year', values: YEAR_COLUMN },
        ]}
        value={{ day: '05', month: 'Jan', year: '2000' }}
        onCancel={() => setPicker(null)}
        onSubmit={chosen => {
          setDateOfBirth(
            formatBirthDate(chosen.day, chosen.month, chosen.year),
          );
          setPicker(null);
        }}
      />

      <WheelPickerDialog
        visible={picker === 'time'}
        title="Select Time"
        columns={[
          { key: 'hour', values: HOUR_COLUMN },
          { key: 'minute', values: MINUTE_COLUMN, separator: ':' },
          { key: 'second', values: SECOND_COLUMN, separator: ':' },
          { key: 'meridiem', values: MERIDIEM_COLUMN, narrow: true },
        ]}
        value={{ hour: '06', minute: '28', second: '55', meridiem: 'PM' }}
        onCancel={() => setPicker(null)}
        onSubmit={chosen => {
          setTimeOfBirth(
            formatBirthTime(chosen.hour, chosen.minute, chosen.meridiem),
          );
          setPicker(null);
        }}
      />

      <OptionPickerDialog
        visible={picker === 'topic'}
        title="Topic of concern"
        options={TOPICS}
        value={topic}
        onCancel={() => setPicker(null)}
        onSubmit={chosen => {
          setTopic(chosen);
          setPicker(null);
        }}
      />
    </View>
  );
}

/** A labelled row on the form (Figma nodes 180:94996 and siblings). */
function Field({
  label,
  style,
  error,
  children,
}: {
  label: string;
  style?: object;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <View style={style}>
      <Text style={styles.label}>{label}</Text>
      {children}
      {error !== undefined && <Text style={styles.error}>{error}</Text>}
    </View>
  );
}

/** A field that opens a picker rather than the keyboard. */
function SelectBox({
  label,
  value,
  placeholder,
  caret = false,
  disabled = false,
  onPress,
}: {
  label: string;
  value: string;
  placeholder?: string;
  caret?: boolean;
  disabled?: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityValue={{ text: value || 'Not set' }}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.input,
        styles.select,
        disabled && styles.inputLocked,
        pressed && styles.pressed,
      ]}
    >
      <Text style={styles.selectValue} numberOfLines={1}>
        {value || placeholder || label}
      </Text>
      {caret && !disabled && <Text style={styles.caret}>⌄</Text>}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.canvas,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.section,
    backgroundColor: colors.brandYellow,
    paddingHorizontal: spacing.section,
    paddingBottom: spacing.section,
  },
  headerTitle: {
    ...typography.screenTitle,
    color: colors.text.onYellow,
    flex: 1,
  },
  orders: {
    borderWidth: 1,
    borderColor: colors.text.onYellow,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: 4,
  },
  ordersLabel: {
    ...typography.ordersLabel,
    color: colors.text.onYellow,
  },
  body: {
    flex: 1,
  },
  bodyContent: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
  },
  sectionTitle: {
    ...typography.screenTitle,
    color: colors.text.onYellow,
  },
  recent: {
    flexDirection: 'row',
    gap: spacing.md,
    paddingTop: spacing.md,
  },
  recentPerson: {
    alignItems: 'center',
    gap: 6,
  },
  recentAvatar: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
    borderWidth: hairline,
    borderColor: colors.border.subtle,
    backgroundColor: colors.surfaceBlush,
    alignItems: 'center',
    justifyContent: 'center',
  },
  recentInitial: {
    ...typography.recentInitial,
    color: colors.text.onYellow,
  },
  recentName: {
    ...typography.caption,
    color: colors.text.onYellow,
  },
  form: {
    gap: spacing.section,
    paddingTop: spacing.xl,
  },
  label: {
    ...typography.intakeLabel,
    color: colors.text.intakeLabel,
    paddingBottom: spacing.md,
  },
  input: {
    ...typography.intakeValue,
    height: FIELD_HEIGHT,
    justifyContent: 'center',
    paddingHorizontal: spacing.section,
    paddingVertical: 0,
    borderRadius: radius.tag,
    borderWidth: 1,
    borderColor: colors.border.intakeField,
    backgroundColor: colors.surface,
    color: colors.text.onYellow,
  },
  /** Already on file and not up for retyping here — see the prop doc on `fullName`. */
  inputLocked: {
    backgroundColor: colors.surfaceMuted,
    color: colors.text.disabled,
  },
  select: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  selectValue: {
    ...typography.intakeValue,
    flex: 1,
    color: colors.text.intakeLabel,
  },
  caret: {
    ...typography.intakeValue,
    color: colors.text.intakeLabel,
  },
  row: {
    flexDirection: 'row',
    gap: spacing.lg,
  },
  rowItem: {
    flex: 1,
  },
  genderOption: {
    flex: 1,
    height: FIELD_HEIGHT,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    borderRadius: radius.tag,
    borderWidth: 1,
    borderColor: colors.border.intakeField,
    backgroundColor: colors.surface,
  },
  genderSelected: {
    borderColor: colors.border.intakeSelected,
    borderRadius: radius.field,
  },
  genderGlyph: {
    ...typography.genderGlyph,
    color: colors.text.intakeLabel,
  },
  genderLabel: {
    ...typography.intakeOption,
    color: colors.text.intakeLabel,
  },
  genderLabelSelected: {
    color: colors.border.intakeSelected,
  },
  error: {
    ...typography.caption,
    color: colors.status.debit,
    paddingTop: spacing.xs,
  },
  consultation: {
    paddingTop: spacing.xl,
  },
  cta: {
    height: CTA_HEIGHT,
    marginTop: spacing.xl,
    borderRadius: radius.field,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  ctaLabel: {
    ...typography.ctaLabel,
    color: colors.text.inverse,
  },
  pressed: {
    opacity: 0.8,
  },
});
