import React from 'react';
import Svg, { Path, Rect } from 'react-native-svg';

import { colors } from '../../theme';

/**
 * Vectors used only by the Sort & Filter sheet, transcribed from their Figma
 * exports (node 180:90953). Sources kept at src/assets/icons/filter-*.svg.
 */
type FilterIconProps = {
  size?: number;
  color?: string;
};

/** Ringed dismiss mark on the sheet's green header (node I180:90953;295:4879). */
export function FilterCloseIcon({
  size = 22.6687,
  color = colors.text.inverse,
}: FilterIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 22.6687 22.6687" fill="none">
      <Path
        d="M11.3344 0C5.0746 0 0 5.0746 0 11.3344C0 17.5945 5.0746 22.6687 11.3344 22.6687C17.5945 22.6687 22.6687 17.5945 22.6687 11.3344C22.6687 5.0746 17.5945 0 11.3344 0ZM11.3344 21.2742C5.86588 21.2742 1.41679 16.8028 1.41679 11.3343C1.41679 5.86584 5.86588 1.41675 11.3344 1.41675C16.8028 1.41675 21.2519 5.86586 21.2519 11.3343C21.2519 16.8028 16.8028 21.2742 11.3344 21.2742ZM15.3414 7.3273C15.0648 7.05067 14.6164 7.05067 14.3397 7.3273L11.3344 10.3327L8.32898 7.3273C8.05235 7.05067 7.60393 7.05067 7.32695 7.3273C7.05032 7.60393 7.05032 8.05235 7.32695 8.32898L10.3323 11.3344L7.32695 14.3397C7.05032 14.616 7.05032 15.0651 7.32695 15.3414C7.60358 15.618 8.05199 15.618 8.32898 15.3414L11.3344 12.336L14.3397 15.3414C14.6164 15.618 15.0648 15.618 15.3414 15.3414C15.618 15.0651 15.618 14.616 15.3414 14.3397L12.336 11.3344L15.3414 8.32898C15.6184 8.05199 15.6184 7.60358 15.3414 7.3273Z"
        fill={color}
      />
    </Svg>
  );
}

type FilterCheckboxProps = FilterIconProps & {
  checked?: boolean;
};

/**
 * The option checkbox — Figma draws the ticked state as a filled 12pt SVG
 * (node I180:90953;295:4835) and the empty one as a 1pt outline on a slightly
 * squarer corner, so both are kept on the same 12pt grid here.
 */
export function FilterCheckbox({
  size = 12,
  checked = false,
  color = colors.text.ink,
}: FilterCheckboxProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 12 12" fill="none">
      <Rect
        x={0.5}
        y={0.5}
        width={11}
        height={11}
        rx={checked ? 1.5 : 2}
        fill={checked ? color : 'transparent'}
        stroke={color}
      />
      {checked && (
        <Path
          d="M10 3.63087L4.51429 9L2 6.53915L2.64457 5.90828L4.51429 7.73378L9.35543 3L10 3.63087Z"
          fill={colors.text.inverse}
        />
      )}
    </Svg>
  );
}
