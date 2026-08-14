import React from 'react';
import Svg, { Path } from 'react-native-svg';

import { colors } from '../../theme';

type CheckLargeIconProps = {
  size?: number;
  color?: string;
};

/**
 * Success tick, exported from Figma (node 180:163425). Drawn on a 52pt grid
 * with a proportionally lighter stroke and mitred joins than the 11pt
 * {@link CheckIcon}, so it is kept as its own asset rather than scaled.
 * Source vector kept alongside at src/assets/icons/check-large.svg.
 */
export function CheckLargeIcon({
  size = 51.998,
  color = colors.text.inverse,
}: CheckLargeIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 51.9981 51.9981" fill="none">
      <Path
        d="M43.3318 12.9995L19.4993 36.832L8.66635 25.999"
        stroke={color}
        strokeWidth={5.41647}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}
