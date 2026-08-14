import React from 'react';
import Svg, { Path } from 'react-native-svg';

import { colors } from '../../theme';

type UserIconProps = {
  size?: number;
  color?: string;
};

/**
 * Avatar placeholder, exported from Figma (node 180:88714).
 * Source vector kept alongside at src/assets/icons/user.svg.
 */
export function UserIcon({
  size = 39.999,
  color = colors.text.onYellowStrong,
}: UserIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 39.9985 39.9985" fill="none">
      <Path
        d="M19.9992 19.9992C23.681 19.9992 26.6657 17.0146 26.6657 13.3328C26.6657 9.65107 23.681 6.66642 19.9992 6.66642C16.3175 6.66642 13.3328 9.65107 13.3328 13.3328C13.3328 17.0146 16.3175 19.9992 19.9992 19.9992Z"
        stroke={color}
        strokeWidth={2.49991}
        strokeLinecap="round"
      />
      <Path
        d="M6.66642 33.3321C6.66642 26.6657 12.6662 21.6659 19.9992 21.6659C27.3323 21.6659 33.3321 26.6657 33.3321 33.3321"
        stroke={color}
        strokeWidth={2.49991}
        strokeLinecap="round"
      />
    </Svg>
  );
}
