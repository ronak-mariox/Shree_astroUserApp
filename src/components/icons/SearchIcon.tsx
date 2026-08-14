import React from 'react';
import Svg, { Path } from 'react-native-svg';

import { colors } from '../../theme';

type SearchIconProps = {
  size?: number;
  color?: string;
};

/**
 * Magnifier, exported from Figma (node 180:88958).
 * Source vector kept alongside at src/assets/icons/search.svg.
 */
export function SearchIcon({
  size = 15.999,
  color = colors.border.strong,
}: SearchIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 15.9994 15.9994" fill="none">
      <Path
        d="M7.33306 12.6662C10.2785 12.6662 12.6662 10.2785 12.6662 7.33306C12.6662 4.38765 10.2785 1.99993 7.33306 1.99993C4.38765 1.99993 1.99993 4.38765 1.99993 7.33306C1.99993 10.2785 4.38765 12.6662 7.33306 12.6662Z"
        stroke={color}
        strokeWidth={1.33328}
        strokeLinecap="round"
      />
      <Path
        d="M13.9995 13.9995L11.0996 11.0996"
        stroke={color}
        strokeWidth={1.33328}
        strokeLinecap="round"
      />
    </Svg>
  );
}
