import React from 'react';
import Svg, { ClipPath, Defs, G, Path, Rect } from 'react-native-svg';

import { colors } from '../../theme';

type BellIconProps = {
  size?: number;
  color?: string;
  /** 1.3495 on the home header, 1.49945 on the profile menu tile. */
  strokeWidth?: number;
};

/**
 * Notification bell, exported from Figma (nodes 291:4756, 180:163725).
 * Source vector kept alongside at src/assets/icons/bell.svg.
 */
export function BellIcon({
  size = 17.993,
  color = colors.border.strong,
  strokeWidth = 1.3495,
}: BellIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 17.9934 17.9934" fill="none">
      <Defs>
        <ClipPath id="bell-clip">
          <Rect width={17.9934} height={17.9934} fill="white" />
        </ClipPath>
      </Defs>
      <G clipPath="url(#bell-clip)">
        <Path
          d="M10.2937 15.7442C10.1619 15.9715 9.97272 16.1601 9.7451 16.2912C9.51747 16.4223 9.25939 16.4913 8.9967 16.4913C8.73401 16.4913 8.47593 16.4223 8.2483 16.2912C8.02068 16.1601 7.83149 15.9715 7.69968 15.7442M13.495 5.9978C13.495 4.80476 13.0211 3.66059 12.1775 2.81699C11.3339 1.97338 10.1897 1.49945 8.9967 1.49945C7.80366 1.49945 6.65949 1.97338 5.81589 2.81699C4.97228 3.66059 4.49835 4.80476 4.49835 5.9978C4.49835 11.2459 2.24918 12.7453 2.24918 12.7453H15.7442C15.7442 12.7453 13.495 11.2459 13.495 5.9978Z"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
        />
      </G>
    </Svg>
  );
}
