import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type TextStyle,
  type ViewStyle,
} from 'react-native';

import { colors, typography } from '../theme';

type SectionHeaderProps = {
  title: string;
  /** Trailing link, e.g. "See All →". Omit for a title-only section. */
  action?: string;
  onActionPress?: () => void;
  /** Overrides the default bold-black link, e.g. the wallet's orange one. */
  actionStyle?: StyleProp<TextStyle>;
  titleStyle?: StyleProp<TextStyle>;
  style?: StyleProp<ViewStyle>;
};

/** Section title with an optional trailing action (Figma node 180:89034). */
export function SectionHeader({
  title,
  action,
  onActionPress,
  actionStyle,
  titleStyle,
  style,
}: SectionHeaderProps) {
  return (
    <View style={[styles.row, style]}>
      <Text style={[styles.title, titleStyle]}>{title}</Text>
      {action !== undefined && (
        <Text
          accessibilityRole="link"
          onPress={onActionPress}
          style={[styles.action, actionStyle]}
        >
          {action}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    ...typography.sectionTitle,
    color: colors.text.primary,
  },
  action: {
    ...typography.footnoteStrong,
    color: colors.border.strong,
  },
});
