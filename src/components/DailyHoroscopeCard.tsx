import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { horoscope } from '../data/home';
import { colors, hairline, radius, spacing, typography } from '../theme';
import { BrandGradient } from './BrandGradient';
import { ChevronRightIcon } from './icons/ChevronRightIcon';
import { HoroscopeIcon } from './icons/HoroscopeIcon';

const TILE_SIZE = 45.992;
const GLYPH_SIZE = 31;

type DailyHoroscopeCardProps = {
  onPress?: () => void;
};

/** Today's reading with its three highlights (Figma node 180:88974). */
export function DailyHoroscopeCard({ onPress }: DailyHoroscopeCardProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${horoscope.title}. ${horoscope.meta}`}
      onPress={onPress}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
    >
      <View style={styles.header}>
        <View style={styles.tile}>
          <BrandGradient radius={radius.button} angle="horizontal" />
          <HoroscopeIcon size={GLYPH_SIZE} />
        </View>

        <View style={styles.headerCopy}>
          <Text style={styles.title}>{horoscope.title}</Text>
          <Text style={styles.meta}>{horoscope.meta}</Text>
        </View>

        <ChevronRightIcon strokeWidth={1.6666} />
      </View>

      <Text style={styles.reading}>{horoscope.reading}</Text>

      <View style={styles.stats}>
        {horoscope.stats.map(stat => (
          <View key={stat.label}>
            <Text style={styles.statLabel}>{stat.label}</Text>
            <Text style={styles.statValue}>{stat.value}</Text>
          </View>
        ))}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.panel,
    borderWidth: hairline,
    borderColor: colors.border.soft,
    backgroundColor: colors.surface,
    padding: 16.755,
    overflow: 'hidden',
  },
  pressed: {
    opacity: 0.9,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  tile: {
    width: TILE_SIZE,
    height: TILE_SIZE,
    borderRadius: radius.button,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  headerCopy: {
    flex: 1,
  },
  title: {
    ...typography.cardTitle,
    color: colors.text.primary,
  },
  meta: {
    ...typography.cardMeta,
    color: colors.text.onYellow,
    paddingTop: 1,
  },
  reading: {
    ...typography.bodyRelaxed,
    color: colors.text.secondary,
    paddingTop: 10,
  },
  stats: {
    flexDirection: 'row',
    gap: spacing.lg,
    paddingTop: spacing.rowGap,
  },
  statLabel: {
    ...typography.microLabel,
    color: colors.text.muted,
  },
  statValue: {
    ...typography.microValue,
    color: colors.text.primary,
    paddingTop: 1,
  },
});
