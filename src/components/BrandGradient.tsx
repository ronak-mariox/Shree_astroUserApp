import React, { useId } from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';

import { colors } from '../theme';

/**
 * Figma paints the brand gradient at ~262deg on buttons and ~269deg on the
 * small icon tile — both run from the right edge to the left, and `diagonal`
 * adds the slight downward drift the buttons have. `toRight` is the plain
 * left-to-right ramp the birth-details summary card uses.
 */
const direction = {
  diagonal: { x1: '100%', y1: '1%', x2: '0%', y2: '99%' },
  horizontal: { x1: '100%', y1: '0%', x2: '0%', y2: '2%' },
  toRight: { x1: '0%', y1: '0%', x2: '100%', y2: '0%' },
} as const;

type BrandGradientProps = {
  /** Corner radius of the painted rectangle. */
  radius: number;
  angle?: keyof typeof direction;
  /** Colour at the gradient's start — defaults to the brand ramp. */
  from?: string;
  to?: string;
};

/** Absolutely-filled brand gradient — drop it into any positioned parent. */
export function BrandGradient({
  radius,
  angle = 'diagonal',
  from = colors.gradient.from,
  to = colors.gradient.to,
}: BrandGradientProps) {
  // Scoped so several gradients can coexist without their <Defs> colliding.
  const gradientId = `brand-gradient-${useId()}`;
  const { x1, y1, x2, y2 } = direction[angle];

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <Svg width="100%" height="100%">
        <Defs>
          <LinearGradient id={gradientId} x1={x1} y1={y1} x2={x2} y2={y2}>
            <Stop offset="0" stopColor={from} />
            <Stop offset="1" stopColor={to} />
          </LinearGradient>
        </Defs>
        <Rect
          x="0"
          y="0"
          width="100%"
          height="100%"
          rx={radius}
          fill={`url(#${gradientId})`}
        />
      </Svg>
    </View>
  );
}
