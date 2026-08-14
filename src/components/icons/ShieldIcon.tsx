import React from 'react';
import Svg, { ClipPath, Defs, G, Path, Rect } from 'react-native-svg';

import { colors } from '../../theme';

type ShieldIconProps = {
  size?: number;
  color?: string;
};

/**
 * Security shield, exported from Figma (node 180:163369). The SSL note uses
 * the same glyph at 13.994 — Figma exports it scaled, so one asset covers
 * both. Source vector kept alongside at src/assets/icons/shield.svg.
 */
export function ShieldIcon({
  size = 17.993,
  color = colors.text.inverse,
}: ShieldIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 17.9934 17.9934" fill="none">
      <Defs>
        <ClipPath id="shield-clip">
          <Rect width={17.9934} height={17.9934} fill="white" />
        </ClipPath>
      </Defs>
      <G clipPath="url(#shield-clip)">
        <Path
          d="M8.9967 16.4939C8.9967 16.4939 14.9945 13.495 14.9945 8.9967V3.74863L8.9967 1.49945L2.9989 3.74863V8.9967C2.9989 13.495 8.9967 16.4939 8.9967 16.4939Z"
          stroke={color}
          strokeWidth={1.49945}
          strokeLinecap="round"
        />
      </G>
    </Svg>
  );
}
