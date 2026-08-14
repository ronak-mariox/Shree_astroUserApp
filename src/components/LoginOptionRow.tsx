import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, hairline, radius, spacing, typography } from '../theme';
import { BrandGradient } from './BrandGradient';
import { ChevronRightIcon } from './icons/ChevronRightIcon';

const ROW_HEIGHT = 61.992;
const TILE_SIZE = 39.999;
const CHEVRON_SIZE = 15.999;

type LoginOptionRowProps = {
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  onPress?: () => void;
  /**
   * Marks the recommended option: green outline, gradient icon tile and a
   * solid chevron (Figma node 180:88420). Otherwise the row is neutral
   * (node 180:88432).
   */
  highlighted?: boolean;
};

/** Tall tappable row offering one way to sign in. */
export function LoginOptionRow({
  title,
  subtitle,
  icon,
  onPress,
  highlighted = false,
}: LoginOptionRowProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${title}. ${subtitle}`}
      onPress={onPress}
      style={({ pressed }) => [
        styles.row,
        highlighted ? styles.rowHighlighted : styles.rowNeutral,
        pressed && styles.pressed,
      ]}
    >
      <View
        style={[styles.tile, !highlighted && styles.tileNeutral]}
      >
        {highlighted && (
          <BrandGradient radius={radius.button} angle="horizontal" />
        )}
        {icon}
      </View>

      <View style={styles.copy}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.subtitle}>{subtitle}</Text>
      </View>

      <ChevronRightIcon
        size={CHEVRON_SIZE}
        color={highlighted ? colors.border.strong : colors.text.muted}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    height: ROW_HEIGHT,
    borderRadius: radius.iconLarge,
    borderWidth: hairline,
    backgroundColor: colors.surface,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.section,
    paddingHorizontal: 10.755,
  },
  rowHighlighted: {
    borderColor: colors.border.success,
  },
  rowNeutral: {
    borderColor: colors.border.subtle,
  },
  pressed: {
    opacity: 0.7,
  },
  tile: {
    width: TILE_SIZE,
    height: TILE_SIZE,
    borderRadius: radius.button,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  tileNeutral: {
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.icon,
  },
  copy: {
    flex: 1,
  },
  title: {
    ...typography.optionTitle,
    color: colors.text.primary,
  },
  subtitle: {
    ...typography.caption,
    color: colors.text.secondary,
  },
});
