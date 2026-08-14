import React from 'react';
import Svg, { ClipPath, Defs, G, Path, Rect } from 'react-native-svg';

import { colors } from '../../theme';

type SmartphoneIconProps = {
  size?: number;
  color?: string;
};

/**
 * Handset used on the "Continue with OTP" tile, exported from Figma
 * (node 180:88422). Source kept at src/assets/icons/smartphone.svg.
 */
export function SmartphoneIcon({
  size = 19.999,
  color = colors.text.inverse,
}: SmartphoneIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 19.9993 19.9993" fill="none">
      <Defs>
        <ClipPath id="smartphone-clip">
          <Rect width={19.9993} height={19.9993} fill="white" />
        </ClipPath>
      </Defs>
      <G clipPath="url(#smartphone-clip)">
        <Path
          d="M14.1662 1.66661H5.83313C4.91269 1.66661 4.16652 2.41277 4.16652 3.33322V16.6661C4.16652 17.5865 4.91269 18.3327 5.83313 18.3327H14.1662C15.0866 18.3327 15.8328 17.5865 15.8328 16.6661V3.33322C15.8328 2.41277 15.0866 1.66661 14.1662 1.66661Z"
          stroke={color}
          strokeWidth={1.66661}
          strokeLinecap="round"
        />
        <Path
          d="M9.99965 14.9995H10.008"
          stroke={color}
          strokeWidth={1.66661}
          strokeLinecap="round"
        />
      </G>
    </Svg>
  );
}
