import { useMemo } from 'react';
import { useWindowDimensions } from 'react-native';

/** The Figma frame every phone screen was measured against. */
export const DESIGN_WIDTH = 402;

/**
 * Screens at or above this width get tablet treatment: content reflows
 * (grids gain columns, detail copy sits in a centred column, sheets stop
 * running edge-to-edge) instead of just scaling a phone layout up.
 */
export const TABLET_BREAKPOINT = 600;

/** Floor so a small phone doesn't shrink Figma type past legibility. */
const MIN_SCALE = 0.85;
/** Ceiling so a tablet's extra width doesn't blow icons/type up 2-3x — past
 *  this, screens should reflow (more columns, wider content cap) instead of
 *  scaling further. */
const MAX_SCALE = 1.15;

/** A comfortable reading/column width to cap content at on wide screens. */
const MAX_CONTENT_WIDTH = 720;

export type Responsive = {
  width: number;
  height: number;
  /** True at or past `TABLET_BREAKPOINT` — screens should reflow, not just scale. */
  isTablet: boolean;
  /** Scales a Figma-measured pixel value for the current window width, clamped between `MIN_SCALE` and `MAX_SCALE`. */
  px: (value: number) => number;
  /** The raw scale factor `px` multiplies by, for call sites that need it directly (e.g. passing to a child's `createStyles`). */
  scale: number;
  /** The width a screen's content should lay out in: the full window on a phone, a capped and centred column on a tablet. */
  contentWidth: number;
};

function clampScale(width: number): number {
  return Math.min(MAX_SCALE, Math.max(MIN_SCALE, width / DESIGN_WIDTH));
}

/**
 * The app's one shared responsive primitive. Every screen was built by
 * pixel-matching Figma at `DESIGN_WIDTH` — this scales those measurements
 * sanely across phone sizes and caps growth on tablets, where screens should
 * reflow (see `isTablet`/`contentWidth`) rather than keep scaling up.
 */
export function useResponsive(): Responsive {
  const { width, height } = useWindowDimensions();

  return useMemo(() => {
    const scale = clampScale(width);
    const isTablet = width >= TABLET_BREAKPOINT;

    return {
      width,
      height,
      isTablet,
      scale,
      px: (value: number) => value * scale,
      contentWidth: isTablet ? Math.min(width, MAX_CONTENT_WIDTH) : width,
    };
  }, [width, height]);
}
