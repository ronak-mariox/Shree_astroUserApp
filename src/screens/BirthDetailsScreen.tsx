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

import { BackButton } from '../components/BackButton';
import { BrandGradient } from '../components/BrandGradient';
import { FormField } from '../components/FormField';
import { PrimaryButton } from '../components/PrimaryButton';
import { SecondaryButton } from '../components/SecondaryButton';
import { StepIndicator } from '../components/StepIndicator';
import {
  colors,
  designFrame,
  hairline,
  radius,
  spacing,
  typography,
} from '../theme';

/** Top padding Figma drew, measured from the top of the status bar. */
const DESIGN_PADDING_TOP = 56;
const SAVE_BUTTON_WIDTH = 175;
/** Fixed offset used to derive the summary's timezone line. */
const TIMEZONE = 'IST (UTC+5:30)';

export type BirthDetails = {
  dateOfBirth: string;
  timeOfBirth: string;
  placeOfBirth: string;
};

type BirthDetailsScreenProps = {
  onBack?: () => void;
  onGenerateKundli?: (details: BirthDetails) => void;
  onSave?: (details: BirthDetails) => void;
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
}: BirthDetailsScreenProps) {
  const insets = useSafeAreaInsets();
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [timeOfBirth, setTimeOfBirth] = useState('');
  const [placeOfBirth, setPlaceOfBirth] = useState('');

  const details = { dateOfBirth, timeOfBirth, placeOfBirth };
  const placeholder = '—';

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
              onPress={onBack}
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
            <FormField
              label="Date of Birth"
              labelIcon="📅"
              value={dateOfBirth}
              onChangeText={setDateOfBirth}
              placeholder="15/08/1999"
              keyboardType="numbers-and-punctuation"
            />
            <FormField
              label="Time of Birth"
              labelIcon="⏰"
              value={timeOfBirth}
              onChangeText={setTimeOfBirth}
              placeholder="06 : 30 AM"
              hint="Enter approximate time if exact time is unknown"
            />
            <FormField
              label="Place of Birth"
              labelIcon="📍"
              value={placeOfBirth}
              onChangeText={setPlaceOfBirth}
              placeholder="Mumbai, Maharashtra"
            />

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

            <View style={styles.actions}>
              <SecondaryButton
                label="Generate Kundli"
                labelStyle={typography.buttonSocial}
                style={styles.generateButton}
                onPress={() => onGenerateKundli?.(details)}
              />
              <PrimaryButton
                label="Save & Continue →"
                labelStyle={typography.buttonSmall}
                style={styles.saveButton}
                onPress={() => onSave?.(details)}
              />
            </View>
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
