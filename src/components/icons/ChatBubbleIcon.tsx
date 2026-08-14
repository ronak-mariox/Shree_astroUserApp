import React from 'react';
import Svg, { ClipPath, Defs, G, Path, Rect } from 'react-native-svg';

import { colors } from '../../theme';

type ChatBubbleIconProps = {
  size?: number;
  color?: string;
};

/**
 * Speech bubble on the astrologer card's Chat button, exported from Figma
 * (node 180:89059). Source kept at src/assets/icons/chat-bubble.svg.
 */
export function ChatBubbleIcon({
  size = 9.994,
  color = colors.text.ink,
}: ChatBubbleIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 9.99373 9.99373" fill="none">
      <Defs>
        <ClipPath id="chat-bubble-clip">
          <Rect width={9.99373} height={9.99373} fill="white" />
        </ClipPath>
      </Defs>
      <G clipPath="url(#chat-bubble-clip)">
        <Path
          d="M8.74451 6.24608C8.74451 6.70413 8.36975 7.07889 7.9117 7.07889H2.91484L1.24922 8.74451V2.08203C1.24922 1.62398 1.62398 1.24922 2.08203 1.24922H7.9117C8.36975 1.24922 8.74451 1.62398 8.74451 2.08203V6.24608Z"
          stroke={color}
          strokeWidth={1.04101}
          strokeLinecap="round"
        />
      </G>
    </Svg>
  );
}
