import React from 'react';
import Svg, { ClipPath, Defs, G, Path, Rect } from 'react-native-svg';

import { colors } from '../../theme';

type MailIconProps = {
  size?: number;
  color?: string;
};

/**
 * Envelope, exported from Figma (node 180:88434).
 * Source vector kept alongside at src/assets/icons/mail.svg.
 */
export function MailIcon({
  size = 19.999,
  color = colors.text.primary,
}: MailIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 19.9993 19.9993" fill="none">
      <Defs>
        <ClipPath id="mail-clip">
          <Rect width={19.9993} height={19.9993} fill="white" />
        </ClipPath>
      </Defs>
      <G clipPath="url(#mail-clip)">
        <Path
          d="M16.6661 3.33322H3.33322C2.41277 3.33322 1.66661 4.07938 1.66661 4.99983V14.9995C1.66661 15.9199 2.41277 16.6661 3.33322 16.6661H16.6661C17.5865 16.6661 18.3327 15.9199 18.3327 14.9995V4.99983C18.3327 4.07938 17.5865 3.33322 16.6661 3.33322Z"
          stroke={color}
          strokeWidth={1.66661}
          strokeLinecap="round"
        />
        <Path
          d="M18.3327 5.83313L9.99965 10.833L1.66661 5.83313"
          stroke={color}
          strokeWidth={1.66661}
          strokeLinecap="round"
        />
      </G>
    </Svg>
  );
}
