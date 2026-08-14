import React from 'react';
import Svg, { Path } from 'react-native-svg';

import { colors } from '../../theme';

type SmartphoneLargeIconProps = {
  size?: number;
  color?: string;
};

/**
 * Handset badge in the Mobile Verification header, exported from Figma
 * (node 180:88493). Drawn on a 26pt grid with a heavier home-button dot than
 * {@link SmartphoneIcon}, so it is kept as its own asset rather than scaled.
 * Source kept at src/assets/icons/smartphone-large.svg.
 */
export function SmartphoneLargeIcon({
  size = 25.993,
  color = colors.border.strong,
}: SmartphoneLargeIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 25.9931 25.9931" fill="none">
      <Path
        d="M18.4118 2.16609H7.58132C6.38502 2.16609 5.41523 3.13588 5.41523 4.33218V21.6609C5.41523 22.8572 6.38502 23.827 7.58132 23.827H18.4118C19.6081 23.827 20.5779 22.8572 20.5779 21.6609V4.33218C20.5779 3.13588 19.6081 2.16609 18.4118 2.16609Z"
        stroke={color}
        strokeWidth={2.16609}
        strokeLinecap="round"
      />
      <Path
        d="M12.9965 19.4948H13.0065"
        stroke={color}
        strokeWidth={3.24914}
        strokeLinecap="round"
      />
    </Svg>
  );
}
