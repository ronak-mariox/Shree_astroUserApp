import React from 'react';
import Svg, { ClipPath, Defs, G, Path, Rect } from 'react-native-svg';

import { colors } from '../../theme';

type SendIconProps = {
  size?: number;
  color?: string;
};

/**
 * Paper plane on the chat composer, exported from Figma (node 180:163529).
 * Source vector kept alongside at src/assets/icons/send.svg.
 */
export function SendIcon({
  size = 17.993,
  color = colors.text.muted,
}: SendIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 17.9934 17.9934" fill="none">
      <Defs>
        <ClipPath id="send-clip">
          <Rect width={17.9934} height={17.9934} fill="white" />
        </ClipPath>
      </Defs>
      <G clipPath="url(#send-clip)">
        <Path
          d="M16.4939 1.49945L8.24697 9.74643"
          stroke={color}
          strokeWidth={1.49945}
          strokeLinecap="round"
        />
        <Path
          d="M16.4939 1.49945L11.2459 16.4939L8.24698 9.74643L1.49945 6.74753L16.4939 1.49945Z"
          stroke={color}
          strokeWidth={1.49945}
          strokeLinecap="round"
        />
      </G>
    </Svg>
  );
}
