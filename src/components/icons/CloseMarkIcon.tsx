import React from 'react';
import Svg, { Path } from 'react-native-svg';

import { colors } from '../../theme';

type CloseMarkIconProps = {
  size?: number;
  color?: string;
};

/**
 * The dismiss cross on the current-status sheet and the connecting card
 * (Figma nodes 180:162843 and 180:105067).
 */
export function CloseMarkIcon({
  size = 19.675,
  color = colors.text.muted,
}: CloseMarkIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 20 20" fill="none">
      <Path
        d="M2 2L18 18M18 2L2 18"
        stroke={color}
        strokeWidth={2.5}
        strokeLinecap="round"
      />
    </Svg>
  );
}
