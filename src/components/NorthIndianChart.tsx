import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { chartHouses, chartNative } from '../data/kundli';
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
 * North Indian birth chart (Figma node 180:89343): a 3 x 4 grid with the four
 * corner cells split diagonally, house numbers in each cell, the planets that
 * occupy them, and the native's details at the centre.
 */
export function NorthIndianChart() {
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

      {chartHouses.map(house => (
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
        <Text style={styles.nativeName}>{chartNative.name}</Text>
        <Text style={styles.nativeMeta}>{chartNative.date}</Text>
        <Text style={styles.nativeMeta}>{chartNative.place}</Text>
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
