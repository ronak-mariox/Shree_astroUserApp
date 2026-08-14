import React from 'react';
import Svg, { Path } from 'react-native-svg';

import { colors } from '../../theme';

type StarIconProps = {
  size?: number;
  color?: string;
};

/**
 * Five-pointed star, exported from Figma (node 180:88374).
 * Source vector kept alongside at src/assets/icons/star.svg.
 */
export function StarIcon({
  size = 49.992,
  color = colors.cosmos.star,
}: StarIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 49.9923 49.9923" fill="none">
      <Path
        opacity={0.95}
        d="M24.9961 6.24904L29.6829 17.1849H42.181L32.0263 24.215L35.932 35.932L24.9961 28.9018L14.0603 35.932L17.966 24.215L7.8113 17.1849H20.3094L24.9961 6.24904Z"
        fill={color}
      />
    </Svg>
  );
}
