import React from 'react';
import Svg, { Path } from 'react-native-svg';

import { colors } from '../../theme';

type ChevronRightIconProps = {
  size?: number;
  color?: string;
  /** Figma draws it at 1.33328 on list rows and 1.6666 on the horoscope card. */
  strokeWidth?: number;
};

/**
 * Disclosure chevron, exported from Figma (nodes 180:88430, 180:88991).
 * Source vector kept alongside at src/assets/icons/chevron-right.svg.
 */
export function ChevronRightIcon({
  size = 15.999,
  color = colors.border.strong,
  strokeWidth = 1.33328,
}: ChevronRightIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 15.9994 15.9994" fill="none">
      <Path
        d="M5.99977 11.9995L9.99962 7.9997L5.99977 3.99985"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
      />
    </Svg>
  );
}
