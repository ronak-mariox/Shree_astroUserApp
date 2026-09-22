import React from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  type StyleProp,
  type TextStyle,
  type ViewStyle,
} from 'react-native';

import { colors, hairline, radius, typography } from '../theme';

const BUTTON_HEIGHT = 49.992;

type SecondaryButtonProps = {
  label: string;
  onPress?: () => void;
  /** Dims the button and stops it responding, same behaviour as PrimaryButton's. */
  disabled?: boolean;
  /** Defaults to the 16pt label; tighter layouts pass a smaller token. */
  labelStyle?: StyleProp<TextStyle>;
  style?: StyleProp<ViewStyle>;
};

/** Hairline-outlined CTA used for the lower-emphasis action. */
export function SecondaryButton({
  label,
  onPress,
  disabled = false,
  labelStyle,
  style,
}: SecondaryButtonProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        disabled && styles.buttonDisabled,
        pressed && !disabled && styles.pressed,
        style,
      ]}
    >
      <Text style={[styles.label, disabled && styles.labelDisabled, labelStyle]}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    height: BUTTON_HEIGHT,
    borderRadius: radius.buttonOutline,
    borderWidth: hairline,
    borderColor: colors.border.strong,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonDisabled: {
    borderColor: colors.border.subtle,
  },
  pressed: {
    opacity: 0.6,
  },
  label: {
    ...typography.button,
    color: colors.border.strong,
    textAlign: 'center',
  },
  labelDisabled: {
    color: colors.text.disabled,
  },
});
