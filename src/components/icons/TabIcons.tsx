import React from 'react';
import Svg, { G, Path } from 'react-native-svg';

import { colors } from '../../theme';

const SIZE = 21.993;
const VIEW_BOX = '0 0 21.9933 21.9933';
const STROKE = 1.37458;

export type TabIconProps = {
  active?: boolean;
  size?: number;
};

/**
 * Bottom-navigation glyphs, exported from Figma (nodes 180:89195 – 180:89211
 * for the resting states, 180:89284 – 180:89307 for the Kundli screen's).
 * Sources kept at src/assets/icons/tab-*.svg.
 *
 * Home and Kundli switch from an outline to a solid mark when selected — each
 * is its own export, so both renderings live here rather than being faked by
 * recolouring one path. The remaining three are outline-only and simply take
 * the active tint.
 */

/** Filled green house when selected (node 180:89195), outline when not. */
export function HomeTabIcon({ active = false, size = SIZE }: TabIconProps) {
  const d =
    'M2.74916 10.9966L10.9966 2.74916L19.2441 10.9966V19.2441H13.7458V13.7458H8.24749V19.2441H2.74916V10.9966Z';

  return (
    <Svg width={size} height={size} viewBox={VIEW_BOX} fill="none">
      <G>
        {active ? (
          <Path d={d} fill={colors.success.accent} />
        ) : (
          <Path
            d={d}
            stroke={colors.text.muted}
            strokeWidth={STROKE}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        )}
      </G>
    </Svg>
  );
}

/** Solid black chakra with white spokes when selected (node 180:89289). */
export function KundliTabIcon({ active = false, size = SIZE }: TabIconProps) {
  const wheel =
    'M10.9966 19.2441C15.5516 19.2441 19.2441 15.5516 19.2441 10.9966C19.2441 6.44169 15.5516 2.74916 10.9966 2.74916C6.44169 2.74916 2.74916 6.44169 2.74916 10.9966C2.74916 15.5516 6.44169 19.2441 10.9966 19.2441Z';
  const spokes =
    'M10.9966 2.74916V19.2441M2.74916 10.9966H19.2441M5.13177 5.13177L16.8615 16.8615M16.8615 5.13177L5.13177 16.8615';

  return (
    <Svg width={size} height={size} viewBox={VIEW_BOX} fill="none">
      <G>
        <Path
          d={wheel}
          fill={active ? colors.border.strong : 'none'}
          stroke={active ? colors.border.strong : colors.text.muted}
          strokeWidth={STROKE}
          strokeLinecap="round"
        />
        <Path
          d={spokes}
          stroke={active ? colors.text.inverse : colors.text.muted}
          strokeWidth={active ? 0.5 : STROKE}
          strokeLinecap="round"
        />
      </G>
    </Svg>
  );
}

/** Outline-only speech bubble (node 180:89206). */
export function ConsultTabIcon({ active = false, size = SIZE }: TabIconProps) {
  return (
    <Svg width={size} height={size} viewBox={VIEW_BOX} fill="none">
      <G>
        <Path
          d="M19.2441 13.7458C19.2441 14.2319 19.0511 14.698 18.7073 15.0418C18.3636 15.3855 17.8974 15.5786 17.4114 15.5786H6.41471L2.74916 19.2441V4.58194C2.74916 4.09586 2.94225 3.62968 3.28597 3.28597C3.62968 2.94225 4.09586 2.74916 4.58194 2.74916H17.4114C17.8974 2.74916 18.3636 2.94225 18.7073 3.28597C19.0511 3.62968 19.2441 4.09586 19.2441 4.58194V13.7458Z"
          // The selected bubble is filled, not just outlined (node 180:90473).
          fill={active ? colors.success.accent : 'none'}
          stroke={active ? colors.success.accent : colors.text.muted}
          strokeWidth={STROKE}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </G>
    </Svg>
  );
}

/** Outline-only card with a chip (node 180:89211). */
export function WalletTabIcon({ active = false, size = SIZE }: TabIconProps) {
  const tint = active ? colors.border.strong : colors.text.muted;

  return (
    <Svg width={size} height={size} viewBox={VIEW_BOX} fill="none">
      <G>
        <Path
          d="M18.3277 4.58194H3.66555C2.65334 4.58194 1.83277 5.4025 1.83277 6.41471V16.495C1.83277 17.5072 2.65334 18.3277 3.66555 18.3277H18.3277C19.34 18.3277 20.1605 17.5072 20.1605 16.495V6.41471C20.1605 5.4025 19.34 4.58194 18.3277 4.58194Z"
          stroke={tint}
          strokeWidth={STROKE}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <Path
          d="M14.6622 11.913C14.6622 12.4192 14.2519 12.8294 13.7458 12.8294C13.2397 12.8294 12.8294 12.4192 12.8294 11.913C12.8294 11.4069 13.2397 10.9966 13.7458 10.9966C14.2519 10.9966 14.6622 11.4069 14.6622 11.913Z"
          fill={tint}
          stroke={tint}
          strokeWidth={STROKE}
        />
        <Path d="M1.83277 8.24749H20.1605" stroke={tint} strokeWidth={STROKE} />
      </G>
    </Svg>
  );
}

/** Outline-only bust (node 180:89307), tinted green when selected. */
export function ProfileTabIcon({ active = false, size = SIZE }: TabIconProps) {
  const tint = active ? colors.success.accent : colors.text.muted;

  return (
    <Svg width={size} height={size} viewBox={VIEW_BOX} fill="none">
      <G>
        <Path
          d="M10.9966 10.9966C13.0211 10.9966 14.6622 9.35553 14.6622 7.3311C14.6622 5.30667 13.0211 3.66555 10.9966 3.66555C8.97222 3.66555 7.3311 5.30667 7.3311 7.3311C7.3311 9.35553 8.97222 10.9966 10.9966 10.9966Z"
          stroke={tint}
          strokeWidth={STROKE}
          strokeLinecap="round"
        />
        <Path
          d="M3.66555 18.3277C3.66555 15.7972 6.94779 13.7458 10.9966 13.7458C15.0455 13.7458 18.3277 15.7972 18.3277 18.3277"
          stroke={tint}
          strokeWidth={STROKE}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </G>
    </Svg>
  );
}
