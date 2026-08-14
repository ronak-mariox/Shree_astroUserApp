import React, { useRef } from 'react';
import {
  StyleSheet,
  TextInput,
  View,
  type StyleProp,
  type TextInputKeyPressEvent,
  type ViewStyle,
} from 'react-native';

type TextInputHandle = React.ComponentRef<typeof TextInput>;

import { colors, radius, spacing, stroke, typography } from '../theme';

const BOX_HEIGHT = 53.992;

type OtpInputProps = {
  /** The digits entered so far, shortest-first; never longer than `length`. */
  value: string;
  onChange: (value: string) => void;
  length?: number;
  /** Greys the boxes out and blocks entry until an OTP has been sent. */
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
};

/**
 * Row of single-digit boxes for the verification code
 * (Figma nodes 180:88522 disabled, 180:88616 enabled).
 *
 * Typing advances to the next box and backspace steps back, so the six inputs
 * behave like one field.
 */
export function OtpInput({
  value,
  onChange,
  length = 6,
  disabled = false,
  style,
}: OtpInputProps) {
  const inputs = useRef<Array<TextInputHandle | null>>([]);
  const digits = value.padEnd(length, ' ').slice(0, length).split('');

  const setDigit = (index: number, raw: string) => {
    const digit = raw.replace(/\D/g, '').slice(-1);
    const next = digits.map((d, i) => (i === index ? digit || ' ' : d));
    onChange(next.join('').trimEnd());

    if (digit && index < length - 1) {
      inputs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (index: number, event: TextInputKeyPressEvent) => {
    if (event.nativeEvent.key === 'Backspace' && !digits[index].trim()) {
      inputs.current[index - 1]?.focus();
    }
  };

  return (
    <View style={[styles.row, style]}>
      {digits.map((digit, index) => (
        <TextInput
          // Boxes are positional, so the index is the stable identity here.
          key={index}
          ref={element => {
            inputs.current[index] = element;
          }}
          value={digit.trim()}
          onChangeText={raw => setDigit(index, raw)}
          onKeyPress={event => handleKeyPress(index, event)}
          editable={!disabled}
          keyboardType="number-pad"
          textContentType="oneTimeCode"
          autoComplete="sms-otp"
          maxLength={1}
          selectTextOnFocus
          accessibilityLabel={`Digit ${index + 1} of ${length}`}
          style={[styles.box, disabled ? styles.boxDisabled : styles.boxActive]}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  box: {
    ...typography.buttonSmall,
    flex: 1,
    height: BOX_HEIGHT,
    borderRadius: radius.field,
    borderWidth: stroke,
    backgroundColor: colors.surface,
    color: colors.text.primary,
    textAlign: 'center',
    // Android centres poorly without this; iOS ignores it.
    padding: 0,
  },
  boxActive: {
    borderColor: colors.border.subtle,
  },
  boxDisabled: {
    borderColor: colors.border.muted,
  },
});
