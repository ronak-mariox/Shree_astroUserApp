import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import { colors, spacing, typography } from '../theme';

type OrDividerProps = {
  label?: string;
  style?: StyleProp<ViewStyle>;
};

/** Hairline rules flanking a label (Figma nodes 180:88444, 180:88535). */
export function OrDivider({
  label = 'or continue with',
  style,
}: OrDividerProps) {
  return (
    <View style={[styles.row, style]}>
      <View style={styles.rule} />
      <Text style={styles.label}>{label}</Text>
      <View style={styles.rule} />
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.xs,
  },
  rule: {
    flex: 1,
    height: 0.991,
    backgroundColor: colors.border.subtle,
  },
  label: {
    ...typography.caption,
    color: colors.text.muted,
  },
});
