import React from 'react';
import { Image } from 'react-native';
import Svg, { Circle, Line, Path } from 'react-native-svg';

import { colors } from '../../theme';

export type PlanetIconProps = {
  size?: number;
  color?: string;
};

/**
 * The planet glyphs on the Planet Positions card (Figma node 180:89115).
 *
 * Figma draws Sun/Moon/Mars/Jupiter/Venus as emoji-backed text (☀ ☽ ♂ ♃ ♀) —
 * not real vector glyphs, so there is no path data to port. These five are
 * Figma's own rendering exported as an image and matted to transparency
 * (the export always comes back composited over its card's background), so
 * they are pixel-identical to the design rather than a redrawn approximation.
 * Mercury and Saturn aren't in this Figma frame at all, so those stay
 * hand-drawn.
 */

const ASPECT = {
  sun: 80 / 80,
  moon: 37 / 56,
  mars: 42 / 43,
  jupiter: 47 / 57,
  venus: 34 / 53,
} as const;

export function SunIcon({ size = 20 }: PlanetIconProps) {
  return (
    <Image
      source={require('../../assets/images/planet-sun.png')}
      style={{ width: size * ASPECT.sun, height: size }}
      resizeMode="contain"
    />
  );
}

export function MoonIcon({ size = 20 }: PlanetIconProps) {
  return (
    <Image
      source={require('../../assets/images/planet-moon.png')}
      style={{ width: size * ASPECT.moon, height: size }}
      resizeMode="contain"
    />
  );
}

export function MarsIcon({ size = 20 }: PlanetIconProps) {
  return (
    <Image
      source={require('../../assets/images/planet-mars.png')}
      style={{ width: size * ASPECT.mars, height: size }}
      resizeMode="contain"
    />
  );
}

export function JupiterIcon({ size = 20 }: PlanetIconProps) {
  return (
    <Image
      source={require('../../assets/images/planet-jupiter.png')}
      style={{ width: size * ASPECT.jupiter, height: size }}
      resizeMode="contain"
    />
  );
}

export function VenusIcon({ size = 20 }: PlanetIconProps) {
  return (
    <Image
      source={require('../../assets/images/planet-venus.png')}
      style={{ width: size * ASPECT.venus, height: size }}
      resizeMode="contain"
    />
  );
}

export function MercuryIcon({ size = 20, color = colors.text.inverse }: PlanetIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 20 20" fill="none">
      <Path
        d="M7.7 3.3A2.5 2.5 0 0 0 12.3 3.3"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
      />
      <Circle cx={10} cy={9} r={3.8} stroke={color} strokeWidth={1.5} />
      <Line x1={10} y1={12.8} x2={10} y2={17} stroke={color} strokeWidth={1.5} strokeLinecap="round" />
      <Line x1={7} y1={15} x2={13} y2={15} stroke={color} strokeWidth={1.5} strokeLinecap="round" />
    </Svg>
  );
}

export function SaturnIcon({ size = 20, color = colors.text.inverse }: PlanetIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 20 20" fill="none">
      <Line x1={8} y1={2} x2={8} y2={17} stroke={color} strokeWidth={1.5} strokeLinecap="round" />
      <Line x1={5} y1={6} x2={11} y2={6} stroke={color} strokeWidth={1.5} strokeLinecap="round" />
      <Path
        d="M8 12Q8 16 12 16Q15 16 15 13"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

/** Keyed by the planet name the fixture data already carries. */
export const PLANET_ICONS: Record<string, React.ComponentType<PlanetIconProps>> = {
  Sun: SunIcon,
  Moon: MoonIcon,
  Mercury: MercuryIcon,
  Venus: VenusIcon,
  Mars: MarsIcon,
  Jupiter: JupiterIcon,
  Saturn: SaturnIcon,
};
