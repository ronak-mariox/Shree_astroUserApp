import React from 'react';
import Svg, { Path, Rect } from 'react-native-svg';

import { colors } from '../../theme';

type IconProps = {
  size?: number;
  color?: string;
};

/** The live microphone on the voice call's Mute control. */
export function MicOnIcon({ size = 26, color = colors.text.onYellow }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x={9} y={3} width={6} height={11} rx={3} stroke={color} strokeWidth={1.8} />
      <Path
        d="M5.5 11.5C5.5 15.1 8.4 18 12 18C15.6 18 18.5 15.1 18.5 11.5"
        stroke={color}
        strokeWidth={1.8}
        strokeLinecap="round"
      />
      <Path d="M12 18V21.5" stroke={color} strokeWidth={1.8} strokeLinecap="round" />
      <Path d="M8.5 21.5H15.5" stroke={color} strokeWidth={1.8} strokeLinecap="round" />
    </Svg>
  );
}

/** The same microphone, struck through — the Mute control while muted. */
export function MicOffIcon({ size = 26, color = colors.text.inverse }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x={9} y={3} width={6} height={11} rx={3} stroke={color} strokeWidth={1.8} />
      <Path
        d="M5.5 11.5C5.5 15.1 8.4 18 12 18C15.6 18 18.5 15.1 18.5 11.5"
        stroke={color}
        strokeWidth={1.8}
        strokeLinecap="round"
      />
      <Path d="M12 18V21.5" stroke={color} strokeWidth={1.8} strokeLinecap="round" />
      <Path d="M8.5 21.5H15.5" stroke={color} strokeWidth={1.8} strokeLinecap="round" />
      <Path d="M4 3.5L20 20.5" stroke={color} strokeWidth={1.8} strokeLinecap="round" />
    </Svg>
  );
}

/** A loudspeaker with two sound waves — the Speaker control. */
export function SpeakerIcon({ size = 26, color = colors.text.onYellow }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M4 9.5V14.5H7.5L12.5 18.5V5.5L7.5 9.5H4Z"
        stroke={color}
        strokeWidth={1.8}
        strokeLinejoin="round"
      />
      <Path
        d="M15.5 9C16.8 10.6 16.8 13.4 15.5 15"
        stroke={color}
        strokeWidth={1.8}
        strokeLinecap="round"
      />
      <Path
        d="M18.5 6.5C21 9.5 21 14.5 18.5 17.5"
        stroke={color}
        strokeWidth={1.8}
        strokeLinecap="round"
      />
    </Svg>
  );
}

/** A handset laid on its cradle — the red End control. */
export function HangUpIcon({ size = 28, color = colors.text.inverse }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M2.6 13.9C7.9 8.8 16.1 8.8 21.4 13.9C21.8 14.3 21.8 14.9 21.5 15.3L19.6 17.6C19.2 18.1 18.5 18.2 18 17.9L15.5 16.4C15 16.1 14.8 15.6 14.9 15L15.1 13.5C13.1 12.9 10.9 12.9 8.9 13.5L9.1 15C9.2 15.6 9 16.1 8.5 16.4L6 17.9C5.5 18.2 4.8 18.1 4.4 17.6L2.5 15.3C2.2 14.9 2.2 14.3 2.6 13.9Z"
        fill={color}
      />
    </Svg>
  );
}
