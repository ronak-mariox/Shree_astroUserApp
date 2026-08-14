import React from 'react';
import Svg, { ClipPath, Defs, G, Path, Rect } from 'react-native-svg';

import { colors } from '../../theme';

type CameraIconProps = {
  size?: number;
  color?: string;
};

/**
 * Camera glyph on the avatar's edit badge, exported from Figma
 * (node 180:88718). Source kept at src/assets/icons/camera.svg.
 */
export function CameraIcon({
  size = 13.994,
  color = colors.text.inverse,
}: CameraIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 13.9936 13.9936" fill="none">
      <Defs>
        <ClipPath id="camera-clip">
          <Rect width={13.9936} height={13.9936} fill="white" />
        </ClipPath>
      </Defs>
      <G clipPath="url(#camera-clip)">
        <Path
          d="M13.4105 11.0783C13.4105 11.3875 13.2877 11.6842 13.069 11.9028C12.8503 12.1215 12.5537 12.2444 12.2444 12.2444H1.7492C1.43992 12.2444 1.14331 12.1215 0.924619 11.9028C0.705927 11.6842 0.583067 11.3875 0.583067 11.0783V4.66453C0.583067 4.35526 0.705927 4.05865 0.924619 3.83995C1.14331 3.62126 1.43992 3.4984 1.7492 3.4984H4.08147L5.2476 1.7492H8.746L9.91213 3.4984H12.2444C12.5537 3.4984 12.8503 3.62126 13.069 3.83995C13.2877 4.05865 13.4105 4.35526 13.4105 4.66453V11.0783Z"
          stroke={color}
          strokeWidth={1.16613}
          strokeLinecap="round"
        />
        <Path
          d="M6.9968 9.91213C8.28488 9.91213 9.32907 8.86794 9.32907 7.57987C9.32907 6.29179 8.28488 5.2476 6.9968 5.2476C5.70872 5.2476 4.66453 6.29179 4.66453 7.57987C4.66453 8.86794 5.70872 9.91213 6.9968 9.91213Z"
          stroke={color}
          strokeWidth={1.16613}
          strokeLinecap="round"
        />
      </G>
    </Svg>
  );
}
