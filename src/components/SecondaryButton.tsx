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
  /** Defaults to the 16pt label; tighter layouts pass a smaller token. */
  labelStyle?: StyleProp<TextStyle>;
  style?: StyleProp<ViewStyle>;
};

/** Hairline-outlined CTA used for the lower-emphasis action. */
export function SecondaryButton({
  label,
  onPress,
  labelStyle,
  style,
}: SecondaryButtonProps) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        pressed && styles.pressed,
        style,
      ]}
    >
      <Text style={[styles.label, labelStyle]}>{label}</Text>
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
  pressed: {
    opacity: 0.6,
  },
  label: {
    ...typography.button,
    color: colors.border.strong,
    textAlign: 'center',
  },
});
