import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
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
import { OptionPickerDialog } from '../components/OptionPickerDialog';
import { WheelPickerDialog } from '../components/WheelPickerDialog';
import { ArrowLeftIcon } from '../components/icons/ArrowLeftIcon';
import { account } from '../data/profile';
import {
  CHAT_WINDOWS,
  DAY_COLUMN,
  HOUR_COLUMN,
  MERIDIEM_COLUMN,
  MINUTE_COLUMN,
  MONTH_COLUMN,
  RECENT_CHATS,
  SECOND_COLUMN,
  TOPICS,
  YEAR_COLUMN,
  formatBirthDate,
  formatBirthTime,
  type ChatIntake,
} from '../data/chatIntake';
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
  onBack?: () => void;
  onMyOrders?: () => void;
  /** Fired with the completed form when "Connect With …" is pressed. */
  onConnect?: (intake: ChatIntake) => void;
};

/**
 * The form a chat starts from: who the reading is for, their birth details,
 * what they want to talk about, and how long the session should run.
 * Figma: node 180:93411 — the minute windows are ours, the rest is the frame.
 */
export function ChatIntakeScreen({
  astrologerName,
  onBack,
  onMyOrders,
  onConnect,
}: ChatIntakeScreenProps) {
  const insets = useSafeAreaInsets();
  const [fullName, setFullName] = useState(account.name);
  const [dateOfBirth, setDateOfBirth] = useState('08 February 1999');
  const [timeOfBirth, setTimeOfBirth] = useState('10 : 30 PM');
  const [gender, setGender] = useState<'male' | 'female'>('male');
  const [birthPlace, setBirthPlace] = useState('');
  const [topic, setTopic] = useState('');
  const [minutes, setMinutes] = useState<number>(CHAT_WINDOWS[1]);
  const [picker, setPicker] = useState<'date' | 'time' | 'topic' | null>(null);

  const connect = () =>
    onConnect?.({
      fullName: fullName.trim(),
      dateOfBirth,
      timeOfBirth,
      gender,
      birthPlace: birthPlace.trim(),
      topic,
      minutes,
    });

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

        <Text style={styles.headerTitle}>Chat Intake Form</Text>

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
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={[
            styles.bodyContent,
            { paddingBottom: spacing.xl + insets.bottom },
          ]}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={styles.sectionTitle}>Recent Chats</Text>
          <View style={styles.recent}>
            {RECENT_CHATS.map(person => (
              <Pressable
                key={person.id}
                accessibilityRole="button"
                accessibilityLabel={`Chat with ${person.name} again`}
                onPress={() => setFullName(person.name)}
                style={({ pressed }) => [
                  styles.recentPerson,
                  pressed && styles.pressed,
                ]}
              >
                <View style={styles.recentAvatar}>
                  <Text style={styles.recentInitial}>
                    {person.name.slice(0, 1)}
                  </Text>
                </View>
                <Text style={styles.recentName}>{person.name}</Text>
              </Pressable>
            ))}
          </View>

          <View style={styles.form}>
            <Field label="Full Name">
              <TextInput
                accessibilityLabel="Full Name"
                value={fullName}
                onChangeText={setFullName}
                placeholder="Mithu Kumar"
                placeholderTextColor={colors.text.intakeLabel}
                style={styles.input}
              />
            </Field>

            <View style={styles.row}>
              <Field label="Date of Birth" style={styles.rowItem}>
                <SelectBox
                  label="Date of Birth"
                  value={dateOfBirth}
                  onPress={() => setPicker('date')}
                />
              </Field>
              <Field label="Time of Birth" style={styles.rowItem}>
                <SelectBox
                  label="Time of Birth"
                  value={timeOfBirth}
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

            <Field label="Birth Place">
              <TextInput
                accessibilityLabel="Birth Place"
                value={birthPlace}
                onChangeText={setBirthPlace}
                placeholder="Noida 62"
                placeholderTextColor={colors.text.intakeLabel}
                style={styles.input}
              />
            </Field>

            <Field label="Topic of concern">
              <SelectBox
                label="Topic of concern"
                value={topic}
                placeholder="Choose a topic"
                caret
                onPress={() => setPicker('topic')}
              />
            </Field>

            {/* The session window — how many minutes the chat is booked for. */}
            <Field label="Chat Duration">
              <View style={styles.windows}>
                {CHAT_WINDOWS.map(option => {
                  const selected = option === minutes;

                  return (
                    <Pressable
                      key={option}
                      accessibilityRole="radio"
                      accessibilityState={{ selected }}
                      accessibilityLabel={`${option} min`}
                      onPress={() => setMinutes(option)}
                      style={({ pressed }) => [
                        styles.window,
                        selected && styles.windowSelected,
                        pressed && styles.pressed,
                      ]}
                    >
                      <Text
                        style={[
                          styles.windowLabel,
                          selected && styles.windowLabelSelected,
                        ]}
                      >
                        {option} min
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </Field>
          </View>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Connect With ${astrologerName}`}
            onPress={connect}
            style={({ pressed }) => [styles.cta, pressed && styles.pressed]}
          >
            <BrandGradient radius={radius.field} />
            <Text style={styles.ctaLabel}>
              Connect With {astrologerName} →
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
  children,
}: {
  label: string;
  style?: object;
  children: React.ReactNode;
}) {
  return (
    <View style={style}>
      <Text style={styles.label}>{label}</Text>
      {children}
    </View>
  );
}

/** A field that opens a picker rather than the keyboard. */
function SelectBox({
  label,
  value,
  placeholder,
  caret = false,
  onPress,
}: {
  label: string;
  value: string;
  placeholder?: string;
  caret?: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityValue={{ text: value || 'Not set' }}
      onPress={onPress}
      style={({ pressed }) => [
        styles.input,
        styles.select,
        pressed && styles.pressed,
      ]}
    >
      <Text style={styles.selectValue} numberOfLines={1}>
        {value || placeholder || label}
      </Text>
      {caret && <Text style={styles.caret}>⌄</Text>}
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
  windows: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  window: {
    flex: 1,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.tag,
    borderWidth: 1,
    borderColor: colors.border.intakeField,
    backgroundColor: colors.surface,
  },
  windowSelected: {
    borderColor: colors.border.intakeSelected,
    backgroundColor: colors.status.negativeTint,
  },
  windowLabel: {
    ...typography.intakeOption,
    color: colors.text.intakeLabel,
  },
  windowLabelSelected: {
    color: colors.border.intakeSelected,
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
