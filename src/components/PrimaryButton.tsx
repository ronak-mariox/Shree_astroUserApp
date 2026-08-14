import React from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  type StyleProp,
  type TextStyle,
  type ViewStyle,
} from 'react-native';

import { colors, radius, typography } from '../theme';
import { BrandGradient } from './BrandGradient';

const BUTTON_HEIGHT = 49.992;

type PrimaryButtonProps = {
  label: string;
  onPress?: () => void;
  /** Greys the button out and stops it responding (Figma node 180:88532). */
  disabled?: boolean;
  /** Defaults to the 16pt label; cards use `typography.buttonSmall`. */
  labelStyle?: StyleProp<TextStyle>;
  style?: StyleProp<ViewStyle>;
};

/**
 * Filled CTA carrying the brand gradient.
 *
 * Figma paints it with `linear-gradient(261.86deg, #F55102 0%, #FFBC01 100%)`,
 * projected from the top-right corner (#F55102) to the bottom-left (#FFBC01) —
 * see {@link BrandGradient}. The disabled variant drops the gradient for a flat
 * grey fill and a softer, wider corner.
 */
export function PrimaryButton({
  label,
  onPress,
  disabled = false,
  labelStyle,
  style,
}: PrimaryButtonProps) {
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
      {!disabled && <BrandGradient radius={radius.button} />}
      <Text
        style={[styles.label, disabled && styles.labelDisabled, labelStyle]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    height: BUTTON_HEIGHT,
    borderRadius: radius.button,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  buttonDisabled: {
    backgroundColor: colors.surfaceDisabled,
    borderRadius: radius.field,
  },
  pressed: {
    opacity: 0.9,
  },
  label: {
    ...typography.button,
    color: colors.text.inverse,
    textAlign: 'center',
  },
  labelDisabled: {
    color: colors.text.disabled,
  },
});
