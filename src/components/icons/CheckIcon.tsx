import React from 'react';
import Svg, { Path } from 'react-native-svg';

import { colors } from '../../theme';

type CheckIconProps = {
  size?: number;
  color?: string;
};

/**
 * Confirmation tick, exported from Figma (node 180:88603).
 * Source vector kept alongside at src/assets/icons/check.svg.
 */
export function CheckIcon({
  size = 10.997,
  color = colors.border.strong,
}: CheckIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 10.9966 10.9966" fill="none">
      <Path
        d="M9.16383 2.74915L4.12372 7.78926L1.83277 5.4983"
        stroke={color}
        strokeWidth={1.37458}
        strokeLinecap="round"
      />
    </Svg>
  );
}
