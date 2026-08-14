import React from 'react';
import {
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import { colors } from '../theme';

const BAR_HEIGHT = 4;

type StepIndicatorProps = {
  /** 1-based index of the step being shown. */
  step: number;
  totalSteps?: number;
  style?: StyleProp<ViewStyle>;
};

/**
 * Segmented progress bar across the top of the onboarding wizard
 * (Figma nodes 180:88707, 180:88827). Every completed step stays filled.
 */
export function StepIndicator({
  step,
  totalSteps = 3,
  style,
}: StepIndicatorProps) {
  return (
    <View
      accessibilityRole="progressbar"
      accessibilityValue={{ min: 1, max: totalSteps, now: step }}
      style={[styles.row, style]}
    >
      {Array.from({ length: totalSteps }, (_, index) => (
        <View
          key={index}
          style={[styles.bar, index < step ? styles.filled : styles.track]}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: 6,
  },
  bar: {
    flex: 1,
    height: BAR_HEIGHT,
    borderRadius: BAR_HEIGHT,
  },
  filled: {
    backgroundColor: colors.border.strong,
  },
  track: {
    backgroundColor: colors.progressTrack,
  },
});
