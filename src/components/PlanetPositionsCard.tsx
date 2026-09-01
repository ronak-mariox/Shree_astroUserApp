import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { colors, hairline, radius, spacing, typography } from '../theme';
import { BrandGradient } from './BrandGradient';
import { PLANET_ICONS } from './icons/PlanetIcons';

const CHIP_HEIGHT = 93;

/**
 * Warm gradient card listing where each planet sits today
 * (Figma node 180:89115). The chips scroll sideways — Figma clips them at the
 * card's edge, so the row is wider than the frame by design.
 */
export type PlanetPositions = {
  date: string;
  planets: ReadonlyArray<{ glyph: string; name: string; sign: string }>;
};

type PlanetPositionsCardProps = {
  positions?: PlanetPositions | null;
};

export function PlanetPositionsCard({ positions }: PlanetPositionsCardProps) {
  const planetPositions = positions ?? { date: '', planets: [] };

  return (
    <View style={styles.card}>
      <BrandGradient
        radius={radius.summary}
        angle="toRight"
        from={colors.gradient.summaryFrom}
        to={colors.gradient.summaryTo}
      />

      <View style={styles.header}>
        <Text style={styles.title}>Planet Positions</Text>
        <Text style={styles.date}>{planetPositions.date}</Text>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chips}
        style={styles.chipScroller}
      >
        {planetPositions.planets.map(planet => {
          const Icon = PLANET_ICONS[planet.name];
          return (
            <View key={planet.name} style={styles.chip}>
              <View style={styles.glyph}>
                {Icon ? <Icon /> : <Text style={styles.glyphFallback}>{planet.glyph}</Text>}
              </View>
              <Text style={styles.name}>{planet.name}</Text>
              <Text style={styles.sign}>{planet.sign}</Text>
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.summary,
    padding: 18,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    ...typography.cardTitle,
    color: colors.text.inverse,
  },
  date: {
    ...typography.footnoteSmall,
    color: colors.text.onGradientSoft,
  },
  chipScroller: {
    /** A horizontal ScrollView doesn't reliably inherit its children's height
        (worse under Fabric) — pinned explicitly so the chips get room. */
    height: CHIP_HEIGHT,
    marginTop: spacing.rowGap,
  },
  chips: {
    gap: 10,
  },
  chip: {
    height: CHIP_HEIGHT,
    alignItems: 'center',
    borderRadius: radius.input,
    borderWidth: hairline,
    borderColor: colors.border.onGradient,
    backgroundColor: colors.glass.chip,
    paddingHorizontal: 10.755,
    paddingVertical: 12.755,
    minWidth: 58.394,
  },
  glyph: {
    height: typography.symbol.lineHeight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  glyphFallback: {
    ...typography.symbol,
    color: colors.text.inverse,
    textAlign: 'center',
  },
  name: {
    ...typography.planetName,
    color: colors.text.inverse,
    textAlign: 'center',
    paddingTop: spacing.xs,
  },
  sign: {
    ...typography.microLabel,
    color: colors.text.onGradientSoft,
    textAlign: 'center',
    paddingTop: 2,
  },
});
