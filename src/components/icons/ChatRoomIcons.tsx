import React from 'react';
import Svg, { Circle, Path, Rect } from 'react-native-svg';

import { colors } from '../../theme';

type IconProps = {
  size?: number;
  color?: string;
};

/** The pair of ticks stamped beside a message's time (Figma node 180:118760). */
export function DoubleTickIcon({
  size = 8,
  color = colors.status.sent,
}: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 16 16" fill="none">
      <Path
        d="M1 8.5L4.5 12L11 4"
        stroke={color}
        strokeWidth={1.6}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M6 11.5L7 12.5L15 4"
        stroke={color}
        strokeWidth={1.6}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

/** The smile that opens the composer (node 180:121952). */
export function EmojiIcon({
  size = 21.91,
  color = colors.text.muted,
}: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx={12} cy={12} r={9.5} stroke={color} strokeWidth={1.5} />
      <Circle cx={9} cy={10} r={1.1} fill={color} />
      <Circle cx={15} cy={10} r={1.1} fill={color} />
      <Path
        d="M8 14.5C8.9 15.8 10.35 16.6 12 16.6C13.65 16.6 15.1 15.8 16 14.5"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
      />
    </Svg>
  );
}

/** Records a voice note (node 180:121947). */
export function MicIcon({
  size = 25,
  color = colors.text.onYellow,
}: IconProps) {
  return (
    <Svg width={size * 0.72} height={size} viewBox="0 0 18 25" fill="none">
      <Rect
        x={5.4}
        y={1}
        width={7.2}
        height={12.6}
        rx={3.6}
        stroke={color}
        strokeWidth={1.6}
      />
      <Path
        d="M1.8 11.2C1.8 15.2 5 17.8 9 17.8C13 17.8 16.2 15.2 16.2 11.2"
        stroke={color}
        strokeWidth={1.6}
        strokeLinecap="round"
      />
      <Path
        d="M9 17.8V23.5"
        stroke={color}
        strokeWidth={1.6}
        strokeLinecap="round"
      />
    </Svg>
  );
}

/** Attaches a file (node 180:121953). */
export function PaperclipIcon({
  size = 24.33,
  color = colors.text.onYellow,
}: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M17.5 8.5L9.7 16.3C8.5 17.5 6.6 17.5 5.5 16.3C4.3 15.2 4.3 13.3 5.5 12.1L14.1 3.5C14.8 2.7 16.1 2.7 16.9 3.5C17.7 4.2 17.7 5.5 16.9 6.3L8.8 14.4C8.5 14.7 8 14.7 7.7 14.4C7.4 14.1 7.4 13.6 7.7 13.3L15 6"
        stroke={color}
        strokeWidth={1.6}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

/** The wallet inside the header's balance pill (node 180:121935). */
export function WalletPillIcon({
  size = 20,
  color = colors.text.inverse,
}: IconProps) {
  return (
    <Svg width={size} height={size * 0.95} viewBox="0 0 20 19" fill="none">
      <Rect
        x={1}
        y={3.5}
        width={18}
        height={14}
        rx={3}
        stroke={color}
        strokeWidth={1.6}
      />
      <Path
        d="M1 7.5H14.5C15.6 7.5 16.5 8.4 16.5 9.5V11.5C16.5 12.6 15.6 13.5 14.5 13.5H1"
        stroke={color}
        strokeWidth={1.6}
        strokeLinejoin="round"
      />
      <Circle cx={13.6} cy={10.5} r={1.1} fill={color} />
    </Svg>
  );
}
