import React from 'react';
import Svg, { Path } from 'react-native-svg';

import { colors } from '../../theme';

type ArrowLeftIconProps = {
  size?: number;
  color?: string;
};

/**
 * Back arrow, exported from Figma (node 180:88412).
 * Source vector kept alongside at src/assets/icons/arrow-left.svg.
 */
export function ArrowLeftIcon({
  size = 19.999,
  color = colors.text.primary,
}: ArrowLeftIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 19.9993 19.9993" fill="none">
      <Path
        d="M15.8328 9.99965H4.16652M9.99965 15.8328L4.16652 9.99965L9.99965 4.16652"
        stroke={color}
        strokeWidth={1.66661}
        strokeLinecap="round"
      />
    </Svg>
  );
}
