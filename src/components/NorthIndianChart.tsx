import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { chartHouses, chartNative, type ChartHouse } from '../data/kundli';
import { colors, hairline, radius, typography } from '../theme';

/** The artboard the grid was drawn on (Figma node 180:89343). */
const CHART = { width: 317, height: 296 };

/**
 * The nine rules that divide the chart, transcribed from the exported vectors
 * (src/assets/icons/chart-line-*.svg) at their Figma positions. Each is a plain
 * 1px stroke, so they are drawn as one Svg rather than nine images.
 */
const GRID = [
  // Verticals splitting the frame into three columns.
  'M106.99 0V296',
  'M212.66 0V296',
  // Horizontals splitting it into four rows.
  'M0 74.76H317',
  'M0 148.76H317',
  'M0 222.76H317',
  // Corner diagonals, which turn the outer cells into the classic triangles.
  'M107.27 1.16L1.61 75.17',
  'M212.94 1.16L318.61 75.17',
  'M1.61 223.17L107.27 297.18',
  'M318.61 223.17L212.94 297.18',
];

/**
 * Where each house sits in the grid — a fixed template, the same for every
 * chart ever drawn: a North Indian chart's house *positions* never change,
 * only which sign/planets occupy each one does. Lifted from the design
 * fixture's own house 1-4/6-12 percentages (house 5 was missing there — the
 * fixture never had a chart with a planet in it — filled in here at the one
 * grid slot the existing rhythm leaves free, between houses 11 and 3).
 */
const HOUSE_LAYOUT: Record<number, { top: number; left: number; planetTop: number }> = {
  1: { top: 2.28, left: 36.37, planetTop: 18.16 },
  2: { top: 2.28, left: 69.71, planetTop: 18.16 },
  3: { top: 27.28, left: 69.71, planetTop: 43.16 },
  4: { top: 52.28, left: 69.71, planetTop: 68.16 },
  5: { top: 27.28, left: 36.37, planetTop: 43.16 },
  6: { top: 77.29, left: 69.71, planetTop: 93.16 },
  7: { top: 77.29, left: 36.37, planetTop: 93.16 },
  8: { top: 77.29, left: 3.04, planetTop: 93.16 },
  9: { top: 52.28, left: 36.37, planetTop: 68.16 },
  10: { top: 52.28, left: 3.04, planetTop: 68.16 },
  11: { top: 27.28, left: 3.04, planetTop: 43.16 },
  12: { top: 2.28, left: 3.04, planetTop: 18.16 },
};

/** How far apart two planets sharing a house sit — the design fixture's own spacing (e.g. house 1's "As" at 36.37, "Ma" at 46.28). */
const PLANET_LEFT_STEP = 9.91;

/** Two-letter abbreviation and a fixed colour per graha, same palette the design fixture used. */
const PLANET_STYLE: Record<string, { abbr: string; color: string }> = {
  Sun: { abbr: 'Su', color: '#FF4E00' },
  Moon: { abbr: 'Mo', color: '#6366F1' },
  Mars: { abbr: 'Ma', color: '#EF4444' },
  Mercury: { abbr: 'Me', color: '#10B981' },
  Jupiter: { abbr: 'Ju', color: '#000000' },
  Venus: { abbr: 'Ve', color: '#EC4899' },
  Saturn: { abbr: 'Sa', color: '#6B7280' },
  Rahu: { abbr: 'Ra', color: '#7C3AED' },
  Ketu: { abbr: 'Ke', color: '#8B5CF6' },
};
/** The ascendant is always drawn in house 1 — that's what "house 1" means. */
const ASCENDANT_STYLE = { abbr: 'As', color: '#1F2937' };

type NorthIndianChartProps = {
  /** Real per-planet house placements — when given, these are drawn instead of the design fixture's sample chart. */
  planets?: ReadonlyArray<{ planet: string; house: number }>;
  /** The centre label — falls back to the design fixture's sample native when not given. */
  native?: { name: string; date: string; place: string };
};

/** Builds all 12 houses from real data, at the fixed template positions above. */
function realHouses(planets: ReadonlyArray<{ planet: string; house: number }>): ChartHouse[] {
  const byHouse = new Map<number, Array<{ abbr: string; color: string }>>();
  for (let house = 1; house <= 12; house += 1) {
    byHouse.set(house, []);
  }
  byHouse.get(1)?.push(ASCENDANT_STYLE);
  for (const row of planets) {
    const style = PLANET_STYLE[row.planet];
    if (style) {
      byHouse.get(row.house)?.push(style);
    }
  }

  return Array.from({ length: 12 }, (_, index) => {
    const houseNumber = index + 1;
    const layout = HOUSE_LAYOUT[houseNumber];
    const occupants = byHouse.get(houseNumber) ?? [];
    return {
      number: String(houseNumber),
      top: layout.top,
      left: layout.left,
      planetTop: layout.planetTop,
      planets: occupants.map((style, occupantIndex) => ({
        abbr: style.abbr,
        color: style.color,
        left: layout.left + occupantIndex * PLANET_LEFT_STEP,
      })),
    };
  });
}

/**
 * North Indian birth chart (Figma node 180:89343): a 3 x 4 grid with the four
 * corner cells split diagonally, house numbers in each cell, the planets that
 * occupy them, and the native's details at the centre.
 */
export function NorthIndianChart({ planets, native }: NorthIndianChartProps) {
  const houses = planets ? realHouses(planets) : chartHouses;
  const centre = native ?? chartNative;

  return (
    <View style={styles.chart}>
      <Svg
        width="100%"
        height="100%"
        viewBox={`0 0 ${CHART.width} ${CHART.height}`}
        preserveAspectRatio="none"
      >
        {GRID.map(d => (
          <Path key={d} d={d} stroke={colors.border.subtle} strokeWidth={1} />
        ))}
      </Svg>

      {houses.map(house => (
        <React.Fragment key={house.number}>
          <Text
            style={[
              styles.house,
              { top: `${house.top}%`, left: `${house.left}%` },
            ]}
          >
            {house.number}
          </Text>
          {house.planets.map(planet => (
            <Text
              key={planet.abbr}
              style={[
                styles.planet,
                {
                  top: `${house.planetTop}%`,
                  left: `${planet.left}%`,
                  color: planet.color,
                },
              ]}
            >
              {planet.abbr}
            </Text>
          ))}
        </React.Fragment>
      ))}

      <View style={styles.native} pointerEvents="none">
        <Text style={styles.nativeName}>{centre.name}</Text>
        <Text style={styles.nativeMeta}>{centre.date}</Text>
        <Text style={styles.nativeMeta}>{centre.place}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  chart: {
    width: '100%',
    aspectRatio: CHART.width / CHART.height,
    borderRadius: radius.chart,
    borderWidth: hairline,
    borderColor: colors.border.strong,
    overflow: 'hidden',
  },
  house: {
    ...typography.chartHouse,
    position: 'absolute',
    color: colors.text.muted,
  },
  planet: {
    ...typography.chartPlanet,
    position: 'absolute',
  },
  native: {
    position: 'absolute',
    top: '44.51%',
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  nativeName: {
    ...typography.chartName,
    color: colors.border.strong,
    textAlign: 'center',
  },
  nativeMeta: {
    ...typography.chartMeta,
    color: colors.text.muted,
    textAlign: 'center',
  },
});
