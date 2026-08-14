import React from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import { colors, hairline, radius, typography } from '../theme';

const OPTION_HEIGHT = 43.998;

export type Gender = 'male' | 'female' | 'other';

const OPTIONS: ReadonlyArray<{ value: Gender; label: string }> = [
  { value: 'male', label: '♂ Male' },
  { value: 'female', label: '♀ Female' },
  { value: 'other', label: '⚧ Other' },
];

type GenderSelectorProps = {
  value?: Gender;
  onChange: (value: Gender) => void;
  /** Tint of the chosen option — black on signup, orange when editing. */
  accent?: string;
  style?: StyleProp<ViewStyle>;
};

/**
 * Three-up segmented control. The chosen option swaps its hairline for a black
 * outline and its label to semibold (Figma nodes 180:88692 unselected,
 * 180:88767 with "Male" chosen).
 */
export function GenderSelector({
  value,
  onChange,
  accent = colors.border.strong,
  style,
}: GenderSelectorProps) {
  return (
    <View style={[styles.row, style]}>
      {OPTIONS.map(option => {
        const selected = option.value === value;

        return (
          <Pressable
            key={option.value}
            accessibilityRole="radio"
            accessibilityState={{ selected }}
            onPress={() => onChange(option.value)}
            style={({ pressed }) => [
              styles.option,
              selected ? { borderColor: accent } : styles.optionIdle,
              pressed && styles.pressed,
            ]}
          >
            <Text
              style={[
                styles.label,
                selected
                  ? [styles.labelSelected, { color: accent }]
                  : styles.labelIdle,
              ]}
            >
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: 10,
  },
  option: {
    flex: 1,
    height: OPTION_HEIGHT,
    borderRadius: radius.field,
    borderWidth: hairline,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionIdle: {
    borderColor: colors.border.subtle,
  },
  pressed: {
    opacity: 0.7,
  },
  label: {
    textAlign: 'center',
  },
  labelIdle: {
    ...typography.footnote,
    color: colors.text.secondary,
  },
  labelSelected: {
    ...typography.footnoteStrong,
  },
});
