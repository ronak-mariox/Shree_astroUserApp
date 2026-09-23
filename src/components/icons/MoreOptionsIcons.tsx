import React from 'react';
import Svg, { Circle, Line, Path } from 'react-native-svg';

import { colors } from '../../theme';

type MoreOptionsIconProps = {
  size?: number;
  color?: string;
};

/**
 * The two glyphs on the astrologer profile's More Options sheet.
 *
 * Drawn here rather than exported from Figma, which has no frame for this menu:
 * same 24pt box, same 1.5 stroke, round caps and joins as the rest of the app's
 * line icons (see ShieldIcon, FollowIcon), so they sit beside them without
 * looking borrowed from somewhere else.
 */

/** Three nodes joined by two lines — "send this on". */
export function ShareIcon({ size = 20, color = colors.text.primary }: MoreOptionsIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx={18} cy={5} r={3} stroke={color} strokeWidth={1.5} />
      <Circle cx={6} cy={12} r={3} stroke={color} strokeWidth={1.5} />
      <Circle cx={18} cy={19} r={3} stroke={color} strokeWidth={1.5} />
      <Line x1={8.59} y1={13.51} x2={15.42} y2={17.49} stroke={color} strokeWidth={1.5} strokeLinecap="round" />
      <Line x1={15.41} y1={6.51} x2={8.59} y2={10.49} stroke={color} strokeWidth={1.5} strokeLinecap="round" />
    </Svg>
  );
}

/** A raised flag — "this needs looking at". */
export function ReportIcon({ size = 20, color = colors.text.primary }: MoreOptionsIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V4s-1 1-4 1-5-2-8-2-4 1-4 1Z"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Line x1={4} y1={22} x2={4} y2={15} stroke={color} strokeWidth={1.5} strokeLinecap="round" />
    </Svg>
  );
}
