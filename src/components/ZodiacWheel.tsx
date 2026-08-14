import React from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Defs, RadialGradient, Stop } from 'react-native-svg';

import { colors, cosmosOpacity, hairline, typography, withOpacity } from '../theme';
import { StarIcon } from './icons/StarIcon';

const WHEEL_SIZE = 220;
const INNER_RING_SIZE = 180;
const GLOW_SIZE = 140;
const BADGE_SIZE = 100;
const STAR_SIZE = 49.992;

/**
 * The twelve signs, laid out on the orbit exactly where Figma places them.
 * `︎` is the text-presentation selector — without it some platforms
 * substitute a colour emoji and drop the orange tint.
 */
const SIGNS: ReadonlyArray<{ glyph: string; label: string; x: number; y: number }> = [
  { glyph: '♈︎', label: 'Aries', x: 101.99, y: -0.51 },
  { glyph: '♉︎', label: 'Taurus', x: 151.99, y: 12.89 },
  { glyph: '♊︎', label: 'Gemini', x: 188.6, y: 49.49 },
  { glyph: '♋︎', label: 'Cancer', x: 201.99, y: 99.49 },
  { glyph: '♌︎', label: 'Leo', x: 188.6, y: 149.49 },
  { glyph: '♍︎', label: 'Virgo', x: 151.99, y: 186.1 },
  { glyph: '♎︎', label: 'Libra', x: 101.99, y: 199.49 },
  { glyph: '♏︎', label: 'Scorpio', x: 51.99, y: 186.1 },
  { glyph: '♐︎', label: 'Sagittarius', x: 15.39, y: 149.49 },
  { glyph: '♑︎', label: 'Capricorn', x: 1.99, y: 99.49 },
  { glyph: '♒︎', label: 'Aquarius', x: 15.39, y: 49.49 },
  { glyph: '♓︎', label: 'Pisces', x: 51.99, y: 12.89 },
];

/**
 * Concentric orbit rings with the zodiac around the rim and a glowing star
 * badge at the centre (Figma node 180:88369).
 */
export function ZodiacWheel() {
  return (
    <View style={styles.wheel}>
      <View style={styles.outerRing} />
      <View style={styles.innerRing} />

      {/* Soft radial bloom behind the badge. */}
      <View style={styles.glow} pointerEvents="none">
        <Svg width={GLOW_SIZE} height={GLOW_SIZE}>
          <Defs>
            <RadialGradient
              id="bloom"
              gradientUnits="userSpaceOnUse"
              cx={GLOW_SIZE / 2}
              cy={GLOW_SIZE / 2}
              r={99}
            >
              <Stop
                offset="0"
                stopColor={colors.cosmos.accent}
                stopOpacity={cosmosOpacity.glowInner}
              />
              <Stop
                offset="0.35"
                stopColor={colors.cosmos.glowMid}
                stopOpacity={cosmosOpacity.glowMid}
              />
              <Stop offset="0.7" stopColor={colors.cosmos.glowMid} stopOpacity={0} />
            </RadialGradient>
          </Defs>
          <Circle
            cx={GLOW_SIZE / 2}
            cy={GLOW_SIZE / 2}
            r={GLOW_SIZE / 2}
            fill="url(#bloom)"
          />
        </Svg>
      </View>

      <View style={styles.badge}>
        <StarIcon size={STAR_SIZE} />
      </View>

      {SIGNS.map(sign => (
        <Text
          key={sign.label}
          accessibilityLabel={sign.label}
          numberOfLines={1}
          style={[styles.glyph, { left: sign.x, top: sign.y }]}
        >
          {sign.glyph}
        </Text>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  wheel: {
    width: WHEEL_SIZE,
    height: WHEEL_SIZE,
  },
  outerRing: {
    position: 'absolute',
    left: 0,
    top: 0,
    width: WHEEL_SIZE,
    height: WHEEL_SIZE,
    borderRadius: WHEEL_SIZE / 2,
    borderWidth: hairline,
    borderColor: withOpacity(colors.cosmos.accent, cosmosOpacity.outerRing),
  },
  innerRing: {
    position: 'absolute',
    left: (WHEEL_SIZE - INNER_RING_SIZE) / 2,
    top: (WHEEL_SIZE - INNER_RING_SIZE) / 2,
    width: INNER_RING_SIZE,
    height: INNER_RING_SIZE,
    borderRadius: INNER_RING_SIZE / 2,
    borderWidth: hairline,
    borderColor: withOpacity(colors.cosmos.accent, cosmosOpacity.innerRing),
  },
  glow: {
    position: 'absolute',
    left: (WHEEL_SIZE - GLOW_SIZE) / 2,
    top: (WHEEL_SIZE - GLOW_SIZE) / 2,
    width: GLOW_SIZE,
    height: GLOW_SIZE,
  },
  badge: {
    position: 'absolute',
    left: (WHEEL_SIZE - BADGE_SIZE) / 2,
    top: (WHEEL_SIZE - BADGE_SIZE) / 2,
    width: BADGE_SIZE,
    height: BADGE_SIZE,
    borderRadius: BADGE_SIZE / 2,
    backgroundColor: colors.cosmos.badge,
    alignItems: 'center',
    justifyContent: 'center',
    // drop-shadow(0 0 15px rgba(255, 140, 0, 0.5))
    ...Platform.select({
      ios: {
        shadowColor: colors.cosmos.accent,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: cosmosOpacity.badgeGlow,
        shadowRadius: 15,
      },
      android: {
        shadowColor: colors.cosmos.accent,
        elevation: 12,
      },
      default: {},
    }),
  },
  glyph: {
    ...typography.glyph,
    position: 'absolute',
    color: withOpacity(colors.cosmos.accent, cosmosOpacity.zodiacGlyph),
  },
});
