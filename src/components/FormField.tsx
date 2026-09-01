import React from 'react';
import {
  StyleSheet,
  Text,
  TextInput,
  View,
  type StyleProp,
  type TextInputProps,
  type ViewStyle,
} from 'react-native';

import { colors, hairline, radius, spacing, typography } from '../theme';

const FIELD_HEIGHT = 49.992;

type FormFieldProps = TextInputProps & {
  label: string;
  /** Shown before the label, as the birth-details fields do — an icon element,
      or (legacy) a plain emoji string. */
  labelIcon?: React.ReactNode;
  /** Helper line under the field. */
  hint?: string;
  /** What is wrong with the value — replaces the hint and reddens the outline. */
  error?: string;
  containerStyle?: StyleProp<ViewStyle>;
};

/**
 * Labelled text field used throughout the onboarding wizard
 * (Figma nodes 180:88670, 180:88838).
 */
export function FormField({
  label,
  labelIcon,
  hint,
  error,
  containerStyle,
  style,
  ...inputProps
}: FormFieldProps) {
  return (
    <View style={containerStyle}>
      <View style={styles.labelRow}>
        {typeof labelIcon === 'string' ? (
          <Text style={styles.label}>{labelIcon}</Text>
        ) : (
          labelIcon
        )}
        <Text style={styles.label}>{label}</Text>
      </View>

      <TextInput
        accessibilityLabel={label}
        // Read out with the field, so the message is not sight-only.
        accessibilityHint={error ?? hint}
        placeholderTextColor={colors.text.placeholder}
        style={[styles.input, error !== undefined && styles.inputInvalid, style]}
        {...inputProps}
      />

      {error !== undefined ? (
        <Text style={styles.error}>{error}</Text>
      ) : (
        hint !== undefined && <Text style={styles.hint}>{hint}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingBottom: spacing.sm,
  },
  label: {
    ...typography.fieldLabel,
    color: colors.text.primary,
  },
  input: {
    ...typography.input,
    height: FIELD_HEIGHT,
    borderRadius: radius.input,
    borderWidth: hairline,
    borderColor: colors.border.subtle,
    backgroundColor: colors.surface,
    color: colors.text.primary,
    paddingLeft: 16.755,
    paddingRight: 16.755,
    paddingVertical: 0,
  },
  inputInvalid: {
    borderColor: colors.status.debit,
  },
  hint: {
    ...typography.caption,
    color: colors.text.muted,
    paddingTop: 6,
  },
  error: {
    ...typography.caption,
    color: colors.status.debit,
    paddingTop: 6,
  },
});
