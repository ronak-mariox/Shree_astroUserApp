import React from 'react';
import Svg, { ClipPath, Defs, G, Path, Rect } from 'react-native-svg';

import { colors } from '../../theme';

const SIZE = 10.997;
const VIEW_BOX = '0 0 10.9966 10.9966';
const STROKE = 0.916383;

export type MetaIconProps = {
  size?: number;
  color?: string;
};

/**
 * The 11pt glyphs on an astrologer card's meta chips, exported from Figma
 * (nodes 180:163948, 180:163953, 180:163959). Sources kept at
 * src/assets/icons/{clock,globe,file-lines}.svg.
 */

/** Clock — years of experience. */
export function ClockIcon({
  size = SIZE,
  color = colors.text.muted,
}: MetaIconProps) {
  return (
    <Svg width={size} height={size} viewBox={VIEW_BOX} fill="none">
      <Defs>
        <ClipPath id="clock-clip">
          <Rect width={10.9966} height={10.9966} fill="white" />
        </ClipPath>
      </Defs>
      <G clipPath="url(#clock-clip)">
        <Path
          d="M5.4983 10.0802C8.02882 10.0802 10.0802 8.02882 10.0802 5.4983C10.0802 2.96778 8.02882 0.916383 5.4983 0.916383C2.96778 0.916383 0.916383 2.96778 0.916383 5.4983C0.916383 8.02882 2.96778 10.0802 5.4983 10.0802Z"
          stroke={color}
          strokeWidth={STROKE}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <Path
          d="M5.4983 2.74915V5.4983L7.33107 6.41468"
          stroke={color}
          strokeWidth={STROKE}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </G>
    </Svg>
  );
}

/** Globe — spoken languages. */
export function GlobeIcon({
  size = SIZE,
  color = colors.text.muted,
}: MetaIconProps) {
  const line = {
    stroke: color,
    strokeWidth: STROKE,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
  };

  return (
    <Svg width={size} height={size} viewBox={VIEW_BOX} fill="none">
      <Defs>
        <ClipPath id="globe-clip">
          <Rect width={10.9966} height={10.9966} fill="white" />
        </ClipPath>
      </Defs>
      <G clipPath="url(#globe-clip)">
        <Path
          d="M5.4983 10.0802C8.02882 10.0802 10.0802 8.02882 10.0802 5.4983C10.0802 2.96778 8.02882 0.916383 5.4983 0.916383C2.96778 0.916383 0.916383 2.96778 0.916383 5.4983C0.916383 8.02882 2.96778 10.0802 5.4983 10.0802Z"
          {...line}
        />
        <Path d="M0.916383 5.4983H10.0802" {...line} />
        <Path
          d="M7.2029 5.4983C7.2029 3.81593 6.59789 2.18967 5.4983 0.916383C4.39871 2.18967 3.7937 3.81593 3.7937 5.4983C3.7937 7.18067 4.39871 8.80693 5.4983 10.0802C6.59789 8.80693 7.2029 7.18067 7.2029 5.4983Z"
          {...line}
        />
      </G>
    </Svg>
  );
}

/** Page with two rules — consultations completed. */
export function FileLinesIcon({
  size = SIZE,
  color = colors.text.muted,
}: MetaIconProps) {
  const line = {
    stroke: color,
    strokeWidth: STROKE,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
  };

  return (
    <Svg width={size} height={size} viewBox={VIEW_BOX} fill="none">
      <Defs>
        <ClipPath id="file-lines-clip">
          <Rect width={10.9966} height={10.9966} fill="white" />
        </ClipPath>
      </Defs>
      <G clipPath="url(#file-lines-clip)">
        <Path
          d="M6.41468 0.916383H2.74915C2.50611 0.916383 2.27302 1.01293 2.10117 1.18479C1.92931 1.35664 1.83277 1.58973 1.83277 1.83277V9.16383C1.83277 9.40687 1.92931 9.63996 2.10117 9.81181C2.27302 9.98367 2.50611 10.0802 2.74915 10.0802H8.24745C8.49049 10.0802 8.72358 9.98367 8.89543 9.81181C9.06729 9.63996 9.16383 9.40687 9.16383 9.16383V3.66553L6.41468 0.916383Z"
          {...line}
        />
        <Path d="M6.41468 0.916383V3.66553H9.16383" {...line} />
        <Path d="M7.33107 5.95649H3.66553" {...line} />
        <Path d="M7.33107 7.78926H3.66553" {...line} />
      </G>
    </Svg>
  );
}

/**
 * Handset on the astrologer card's Call button (node 180:163971). Drawn on a
 * 14pt grid with a proportionally lighter stroke than the 10pt
 * {@link PhoneIcon}, so it is its own asset.
 * Source kept at src/assets/icons/phone-large.svg.
 */
export function PhoneLargeIcon({
  size = 13.994,
  color = colors.text.inverse,
}: MetaIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 13.9936 13.9936" fill="none">
      <Defs>
        <ClipPath id="phone-large-clip">
          <Rect width={13.9936} height={13.9936} fill="white" />
        </ClipPath>
      </Defs>
      <G clipPath="url(#phone-large-clip)">
        <Path
          d="M12.8275 9.86549V11.6147C12.8281 11.7771 12.7949 11.9378 12.7298 12.0866C12.6648 12.2354 12.5693 12.3689 12.4497 12.4787C12.33 12.5885 12.1888 12.6721 12.0349 12.7241C11.8811 12.7761 11.7181 12.7954 11.5564 12.7808C9.76219 12.5859 8.03874 11.9728 6.52452 10.9908C4.5128 9.93447 2.86373 8.29962 1.79001 6.29712C0.804619 4.77602 0.191388 3.04419 2.92613e-07 1.24193C-0.0103826 1.08254 0.0120912 0.922711 0.0660279 0.772361C0.119965 0.622012 0.204214 0.484346 0.313552 0.367901C0.42289 0.251456 0.554985 0.158715 0.701645 0.0954293C0.848305 0.0321436 1.0064 -0.000337521 1.16613 2.92587e-07H2.91533C3.1983 -0.00278469 3.47262 0.0974183 3.68717 0.281932C3.90173 0.466446 4.04186 0.72268 4.08147 1.00287C4.15552 1.56262 4.29195 2.11245 4.48961 2.64129C4.56806 2.84999 4.58504 3.07679 4.53854 3.29484C4.49203 3.51289 4.384 3.71303 4.22723 3.87156L3.55088 4.61206C4.3809 6.07179 5.58954 7.28043 7.04928 8.11046L7.78977 7.36996C7.9483 7.2132 8.14845 7.10516 8.36649 7.05866C8.58454 7.01216 8.81135 7.02914 9.02004 7.10758C9.54888 7.30524 10.0987 7.44168 10.6585 7.51573C10.8154 7.2281 11.0802 7.01461 11.3946 6.92221C11.7089 6.82981 12.0471 6.86608 12.3348 7.02304C12.6224 7.18 12.8359 7.44479 12.9283 7.75916C13.0207 8.07353 12.9844 8.41173 12.8275 8.69935V9.86549Z"
          stroke={color}
          strokeWidth={1.16613}
          strokeLinecap="round"
        />
      </G>
    </Svg>
  );
}
