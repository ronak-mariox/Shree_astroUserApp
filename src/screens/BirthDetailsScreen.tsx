import React, { useEffect, useRef, useState } from 'react';
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

import { searchPlaces, type PlaceSuggestion } from '../services/api';
import { ApiError } from '../services/client';
import { BackButton } from '../components/BackButton';
import { BrandGradient } from '../components/BrandGradient';
import { FormField } from '../components/FormField';
import { PrimaryButton } from '../components/PrimaryButton';
import { SecondaryButton } from '../components/SecondaryButton';
import { StepIndicator } from '../components/StepIndicator';
import { WheelPickerDialog } from '../components/WheelPickerDialog';
import { CalendarIcon, ClockIcon, LocationPinIcon } from '../components/icons/FormIcons';
import {
  DAY_COLUMN,
  HOUR_COLUMN,
  MERIDIEM_COLUMN,
  MINUTE_COLUMN,
  MONTHS,
  MONTH_COLUMN,
  YEAR_COLUMN,
  formatBirthTime,
} from '../data/chatIntake';
import {
  isFormValid,
  validateDateOfBirth,
  validatePlace,
  validateTimeOfBirth,
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

/**
 * The reverse of {@link formatBirthTime} — falls back to a sensible default.
 * Also accepts a bare 24-hour "HH:MM" with no AM/PM (what
 * {@link utils/validation.ts}'s validator has always allowed too, and what a
 * profile saved before this screen had a picker may still hold), converting
 * it to 12-hour so the wheel has something to select.
 */
const parseTime = (value: string) => {
  const match = /^(\d{1,2})\s*:\s*(\d{2})\s*([APap][Mm])?$/.exec(value.trim());
  if (!match) {
    return { hour: '06', minute: '00', meridiem: 'AM' };
  }
  const [, rawHour, minute, rawMeridiem] = match;
  const hourNum = Number(rawHour);

  if (rawMeridiem) {
    const hour12 = hourNum === 0 ? 12 : hourNum > 12 ? hourNum % 12 || 12 : hourNum;
    return { hour: pad2(hour12), minute, meridiem: rawMeridiem.toUpperCase() };
  }

  const meridiem = hourNum >= 12 ? 'PM' : 'AM';
  const hour12 = hourNum % 12 === 0 ? 12 : hourNum % 12;
  return { hour: pad2(hour12), minute, meridiem };
};

/**
 * Any accepted time string (this screen's own "06 : 30 AM", or the bare
 * 24-hour "HH:mm" the backend actually stores — see UserProfile's
 * birthDetailsSchema) -> this screen's own display format. Lets App.tsx
 * pre-fill from a saved profile without the field looking different from one
 * the wheel just produced.
 */
export function formatTimeForDisplay(value: string): string {
  const { hour, minute, meridiem } = parseTime(value);
  return formatBirthTime(hour, minute, meridiem);
}

/** Top padding Figma drew, measured from the top of the status bar. */
const DESIGN_PADDING_TOP = 56;
const SAVE_BUTTON_WIDTH = 175;
/** Fixed offset used to derive the summary's timezone line. */
const TIMEZONE = 'IST (UTC+5:30)';

export type BirthDetails = {
  dateOfBirth: string;
  timeOfBirth: string;
  placeOfBirth: string;
  /**
   * An id /places/search actually returned for `placeOfBirth`'s current text —
   * cleared the moment the text is edited again, so it can never point at a
   * place other than what's on screen. Required to Generate Kundli (the
   * backend resolves lat/lon from this, never from typed text); not required
   * to Save & Continue, which still stores `placeOfBirth` as plain text.
   */
  placeId?: string;
};

type BirthDetailsScreenProps = {
  /** Reports whatever is on screen right now, even if unfinished — so a caller can bring it back via `initialDetails` if this screen gets remounted (e.g. the wizard's step 1 sent the user back here). */
  onBack?: (details: BirthDetails) => void;
  /** Generating calls the real API and may reject — the screen holds the button and prints the refusal, same as onSave. */
  onGenerateKundli?: (details: BirthDetails) => void | Promise<void>;
  /**
   * Saving is what registers the account during sign-up, so this may be async
   * and may reject — the screen holds the button and prints the refusal.
   */
  onSave?: (details: BirthDetails) => void | Promise<void>;
  /**
   * What was already on screen when a later step sent the user back here —
   * this screen fully unmounts every time the wizard's route moves away from
   * it, so its own useState would otherwise reset to blank on return.
   */
  initialDetails?: BirthDetails;
};

/** One label/value pair inside the warm summary card. */
function SummaryItem({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.summaryItem}>
      <Text style={styles.summaryLabel}>{label}</Text>
      <Text style={styles.summaryValue} numberOfLines={1}>
        {value}
      </Text>
    </View>
  );
}

/**
 * Step 2 of account creation: when and where the user was born, which is what
 * the Kundli is calculated from. Figma: node 180:88815.
 */
export function BirthDetailsScreen({
  onBack,
  onGenerateKundli,
  onSave,
  initialDetails,
}: BirthDetailsScreenProps) {
  const insets = useSafeAreaInsets();
  const [dateOfBirth, setDateOfBirth] = useState(initialDetails?.dateOfBirth ?? '');
  const [timeOfBirth, setTimeOfBirth] = useState(initialDetails?.timeOfBirth ?? '');
  const [placeOfBirth, setPlaceOfBirth] = useState(initialDetails?.placeOfBirth ?? '');
  /** Set only by picking a suggestion below — cleared the instant the text is edited again. */
  const [placeId, setPlaceId] = useState<string | undefined>(initialDetails?.placeId);
  const [placeSuggestions, setPlaceSuggestions] = useState<PlaceSuggestion[]>([]);
  const [placeSearching, setPlaceSearching] = useState(false);
  /** Errors stay hidden until an action is pressed, then follow every keystroke. */
  const [submitted, setSubmitted] = useState(false);
  /** True while the account is being created, so it cannot be sent twice. */
  const [saving, setSaving] = useState(false);
  /** True while the kundli is being generated. */
  const [generating, setGenerating] = useState(false);
  /** What the server refused with — printed above the buttons regardless of which action hit it. */
  const [actionError, setActionError] = useState<string>();
  /** Whether the Date of Birth wheel is open. */
  const [datePickerOpen, setDatePickerOpen] = useState(false);
  /** Whether the Time of Birth wheel is open. */
  const [timePickerOpen, setTimePickerOpen] = useState(false);

  /**
   * `useState(initialDetails?.dateOfBirth ?? '')` above only reads
   * `initialDetails` on the very first render — when this screen is reached
   * from the Kundli tab, `initialDetails` comes from the account's real
   * profile (`GET /users/me`, fetched asynchronously in the app shell), so a
   * user who reaches "Generate Kundli" before that resolves would otherwise
   * be stuck looking at a permanently blank form even after the real data
   * arrives a moment later. This hydrates the form once real data shows up —
   * guarded so it never fires again after that (a fresh `initialDetails`
   * object identity on every parent render would otherwise wipe out whatever
   * the user is mid-typing).
   */
  const hydrated = useRef(Boolean(initialDetails));
  useEffect(() => {
    if (hydrated.current || !initialDetails) {
      return;
    }
    hydrated.current = true;
    setDateOfBirth(initialDetails.dateOfBirth);
    setTimeOfBirth(initialDetails.timeOfBirth);
    setPlaceOfBirth(initialDetails.placeOfBirth);
    setPlaceId(initialDetails.placeId);
  }, [initialDetails]);

  const details = { dateOfBirth, timeOfBirth, placeOfBirth, placeId };
  const placeholder = '—';

  const errors: Record<string, FieldError> = {
    dateOfBirth: validateDateOfBirth(dateOfBirth),
    timeOfBirth: validateTimeOfBirth(timeOfBirth),
    placeOfBirth: validatePlace(placeOfBirth),
  };
  const shown = (field: keyof typeof errors) =>
    submitted ? errors[field] : undefined;

  const onChangePlace = (text: string) => {
    setPlaceOfBirth(text);
    setPlaceId(undefined);
  };

  const selectPlace = (suggestion: PlaceSuggestion) => {
    setPlaceOfBirth(suggestion.formatted);
    setPlaceId(suggestion.id);
    setPlaceSuggestions([]);
  };

  /**
   * Debounced — a suggestion already picked (`placeId` set) means the text on
   * screen is exactly what was searched for, so there's nothing new to look up
   * until the user edits it again (which clears `placeId` above).
   */
  useEffect(() => {
    if (placeId) {
      return undefined;
    }
    const query = placeOfBirth.trim();
    /** AstrologyAPI's own minimum — it refuses anything shorter with a 405. */
    if (query.length < 3) {
      setPlaceSuggestions([]);
      return undefined;
    }

    let cancelled = false;
    setPlaceSearching(true);
    const timer = setTimeout(() => {
      searchPlaces(query)
        .then(results => {
          if (!cancelled) setPlaceSuggestions(results);
        })
        .catch(() => {
          if (!cancelled) setPlaceSuggestions([]);
        })
        .finally(() => {
          if (!cancelled) setPlaceSearching(false);
        });
    }, 350);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [placeOfBirth, placeId]);

  /**
   * Saving sends the whole wizard — this step and the profile behind it — so it
   * waits on the server and keeps the user here if it is refused.
   */
  const handleSave = async () => {
    setSubmitted(true);
    setActionError(undefined);
    if (!isFormValid(errors) || saving) {
      return;
    }

    setSaving(true);
    try {
      await onSave?.(details);
    } catch (error) {
      setActionError(
        error instanceof ApiError
          ? error.message
          : 'Something went wrong. Please try again.',
      );
    } finally {
      setSaving(false);
    }
  };

  /**
   * Generating calls AstrologyAPI through the backend — a placeId (not just
   * text) is required, since that's what makes lat/lon come from a real
   * geocode rather than whatever was typed.
   */
  const handleGenerateKundli = async () => {
    setSubmitted(true);
    setActionError(undefined);
    if (!isFormValid(errors) || generating || saving) {
      return;
    }
    if (!placeId) {
      setActionError('Select your birth place from the list.');
      return;
    }

    setGenerating(true);
    try {
      await onGenerateKundli?.(details);
    } catch (error) {
      setActionError(
        error instanceof ApiError
          ? error.message
          : 'Something went wrong. Please try again.',
      );
    } finally {
      setGenerating(false);
    }
  };

  return (
    <View style={styles.screen}>
      <StatusBar barStyle="dark-content" />

      <KeyboardAvoidingView
        style={styles.screen}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View
          style={[
            styles.header,
            {
              paddingTop:
                insets.top + (DESIGN_PADDING_TOP - designFrame.statusBarHeight),
            },
          ]}
        >
          <View style={styles.headerRow}>
            <BackButton
              onPress={() => onBack?.(details)}
              backgroundColor={colors.success.tint}
              iconColor={colors.success.accent}
            />
            <View>
              <Text style={styles.title}>Birth Details</Text>
              <Text style={styles.subtitle}>
                For accurate Kundli generation
              </Text>
            </View>
          </View>

          <StepIndicator step={2} style={styles.steps} />
        </View>

        <ScrollView
          style={styles.body}
          contentContainerStyle={[
            styles.bodyContent,
            { paddingBottom: spacing.xl + insets.bottom },
          ]}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.infoCard}>
            <Text style={styles.infoIcon}>⭐</Text>
            <Text style={styles.infoText}>
              Accurate birth details ensure precise Kundli calculations and
              astrological predictions.
            </Text>
          </View>

          <View style={styles.form}>
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
                  placeholder="15/08/1999"
                  editable={false}
                  error={shown('dateOfBirth')}
                />
              </View>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Time of Birth"
              onPress={() => setTimePickerOpen(true)}
            >
              <View pointerEvents="none">
                <FormField
                  label="Time of Birth"
                  labelIcon={<ClockIcon size={16} />}
                  value={timeOfBirth}
                  placeholder="06 : 30 AM"
                  editable={false}
                  hint="Pick your best estimate if the exact time is unknown"
                  error={shown('timeOfBirth')}
                />
              </View>
            </Pressable>
            <View style={styles.placeField}>
              <FormField
                label="Place of Birth"
                labelIcon={<LocationPinIcon size={14} />}
                value={placeOfBirth}
                onChangeText={onChangePlace}
                placeholder="Mumbai, Maharashtra"
                hint={placeSearching ? 'Searching…' : undefined}
                error={shown('placeOfBirth')}
              />
              {placeSuggestions.length > 0 && (
                <View style={styles.suggestions}>
                  {placeSuggestions.map(item => (
                    <Pressable
                      key={item.id}
                      accessibilityRole="button"
                      onPress={() => selectPlace(item)}
                      style={({ pressed }) => [
                        styles.suggestionRow,
                        pressed && styles.suggestionPressed,
                      ]}
                    >
                      <Text style={styles.suggestionText} numberOfLines={1}>
                        {item.formatted}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              )}
            </View>

            <View style={styles.summary}>
              <BrandGradient
                radius={radius.summary}
                angle="toRight"
                from={colors.gradient.summaryFrom}
                to={colors.gradient.summaryTo}
              />
              <Text style={styles.summaryHeading}>BIRTH DETAILS SUMMARY</Text>
              <View style={styles.summaryGrid}>
                <View style={styles.summaryRow}>
                  <SummaryItem
                    label="Date"
                    value={dateOfBirth || placeholder}
                  />
                  <SummaryItem
                    label="Time"
                    value={timeOfBirth || placeholder}
                  />
                </View>
                <View style={styles.summaryRow}>
                  <SummaryItem
                    label="Place"
                    value={placeOfBirth || placeholder}
                  />
                  <SummaryItem label="Timezone" value={TIMEZONE} />
                </View>
              </View>
            </View>

            {actionError !== undefined && (
              <Text style={styles.saveError}>{actionError}</Text>
            )}

            <View style={styles.actions}>
              <SecondaryButton
                label={generating ? 'Generating…' : 'Generate Kundli'}
                labelStyle={typography.buttonSocial}
                style={styles.generateButton}
                disabled={generating || saving}
                onPress={handleGenerateKundli}
              />
              <PrimaryButton
                label={saving ? 'Saving…' : 'Save & Continue →'}
                labelStyle={typography.buttonSmall}
                disabled={saving || generating}
                style={styles.saveButton}
                onPress={handleSave}
              />
            </View>
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

      <WheelPickerDialog
        visible={timePickerOpen}
        title="Select Time"
        columns={[
          { key: 'hour', values: HOUR_COLUMN },
          { key: 'minute', values: MINUTE_COLUMN, separator: ':' },
          { key: 'meridiem', values: MERIDIEM_COLUMN, narrow: true },
        ]}
        value={parseTime(timeOfBirth)}
        onCancel={() => setTimePickerOpen(false)}
        onSubmit={chosen => {
          setTimeOfBirth(formatBirthTime(chosen.hour, chosen.minute, chosen.meridiem));
          setTimePickerOpen(false);
        }}
      />
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
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  title: {
    ...typography.pageTitleSmall,
    color: colors.text.onYellowStrong,
  },
  subtitle: {
    ...typography.footnote,
    color: colors.text.onYellowSubtle,
  },
  steps: {
    marginTop: spacing.lg,
  },
  body: {
    flex: 1,
  },
  bodyContent: {
    padding: spacing.xl,
  },
  infoCard: {
    flexDirection: 'row',
    gap: spacing.md,
    borderRadius: radius.input,
    borderWidth: hairline,
    borderColor: colors.border.faint,
    backgroundColor: colors.surface,
    paddingHorizontal: 16.755,
    paddingVertical: 14.755,
  },
  infoIcon: {
    fontSize: 20,
    lineHeight: 30,
  },
  infoText: {
    ...typography.bodySmall,
    color: colors.text.secondary,
    flex: 1,
  },
  form: {
    paddingTop: spacing.xl,
    gap: 18,
  },
  placeField: {
    zIndex: 1,
  },
  suggestions: {
    marginTop: spacing.sm,
    borderRadius: radius.input,
    borderWidth: hairline,
    borderColor: colors.border.subtle,
    backgroundColor: colors.surface,
    overflow: 'hidden',
  },
  suggestionRow: {
    paddingHorizontal: 16.755,
    paddingVertical: 12,
    borderBottomWidth: hairline,
    borderBottomColor: colors.border.row,
  },
  suggestionPressed: {
    backgroundColor: colors.surfaceMuted,
  },
  suggestionText: {
    ...typography.input,
    color: colors.text.primary,
  },
  summary: {
    borderRadius: radius.summary,
    padding: 18,
    overflow: 'hidden',
    marginTop: spacing.sm,
  },
  summaryHeading: {
    ...typography.overline,
    color: colors.text.onGradient,
  },
  summaryGrid: {
    paddingTop: spacing.md,
    gap: spacing.md,
  },
  summaryRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  summaryItem: {
    flex: 1,
  },
  summaryLabel: {
    ...typography.summaryLabel,
    color: colors.text.onGradientMuted,
  },
  summaryValue: {
    ...typography.summaryValue,
    color: colors.text.inverse,
    paddingTop: 2,
  },
  /** The server's refusal, printed across the form rather than under a field. */
  saveError: {
    ...typography.caption,
    color: colors.status.debit,
    textAlign: 'center',
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  generateButton: {
    flex: 1,
    borderRadius: radius.button,
  },
  saveButton: {
    width: SAVE_BUTTON_WIDTH,
  },
});
