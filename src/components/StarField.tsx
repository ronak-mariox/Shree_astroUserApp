import React from 'react';
import { StyleSheet, View } from 'react-native';

import { colors, designFrame } from '../theme';

type Star = {
  x: number;
  y: number;
  w: number;
  h: number;
  opacity: number;
};

/**
 * Scattered stars in the welcome hero. Coordinates are the raw Figma positions
 * on the 390 x 484 artboard; they are converted to percentages at render time
 * so the scatter keeps its shape on taller or narrower screens.
 */
export const HERO_STARS: ReadonlyArray<Star> = [
  { x: 367.22, y: 267.45, w: 1.994, h: 1.994, opacity: 1.0 },
  { x: 47.89, y: 60.79, w: 1.994, h: 1.994, opacity: 0.57 },
  { x: 66.56, y: 120.99, w: 1.994, h: 1.994, opacity: 0.63 },
  { x: 359.96, y: 205.41, w: 1.994, h: 1.994, opacity: 0.75 },
  { x: 113.92, y: 464.04, w: 1.994, h: 1.994, opacity: 0.77 },
  { x: 78.79, y: 126.5, w: 1.994, h: 1.994, opacity: 0.98 },
  { x: 318.71, y: 422.27, w: 2.997, h: 2.997, opacity: 0.68 },
  { x: 148.86, y: 270.82, w: 1.994, h: 1.994, opacity: 0.64 },
  { x: 169.29, y: 188.97, w: 1.994, h: 1.994, opacity: 0.91 },
  { x: 382.69, y: 240.57, w: 2.997, h: 1.994, opacity: 0.79 },
  { x: 388.04, y: 339.99, w: 2.997, h: 1.994, opacity: 0.42 },
  { x: 144.01, y: 266.55, w: 1.994, h: 1.994, opacity: 0.5 },
  { x: 137.34, y: 30.38, w: 1.994, h: 1.994, opacity: 0.78 },
  { x: 340.62, y: 373.39, w: 1.994, h: 1.994, opacity: 0.65 },
  { x: 159.82, y: 313.55, w: 1.994, h: 1.994, opacity: 0.63 },
  { x: 118.58, y: 392.91, w: 1.994, h: 1.994, opacity: 0.6 },
  { x: 17.92, y: 276.5, w: 2.997, h: 2.997, opacity: 0.52 },
  { x: 303.15, y: 390.05, w: 1.994, h: 1.994, opacity: 0.6 },
  { x: 73.6, y: 269.22, w: 1.994, h: 1.994, opacity: 0.88 },
  { x: 173.74, y: 302.28, w: 2.997, h: 1.994, opacity: 0.64 },
  { x: 323.41, y: 456.67, w: 1.994, h: 1.994, opacity: 0.58 },
  { x: 347.54, y: 317.18, w: 2.997, h: 1.994, opacity: 0.75 },
  { x: 65.35, y: 196.98, w: 1.994, h: 2.997, opacity: 0.9 },
  { x: 300.02, y: 70.35, w: 2.997, h: 2.997, opacity: 0.74 },
  { x: 158.93, y: 344.4, w: 1.994, h: 1.994, opacity: 0.99 },
  { x: 282.18, y: 150.15, w: 1.994, h: 1.994, opacity: 0.8 },
  { x: 70.45, y: 378.79, w: 2.997, h: 2.997, opacity: 0.5 },
  { x: 82.31, y: 341.59, w: 1.994, h: 1.994, opacity: 0.95 },
  { x: 380.58, y: 153.66, w: 1.994, h: 1.994, opacity: 0.5 },
  { x: 38.17, y: 355.62, w: 1.994, h: 2.997, opacity: 0.63 },
];

/**
 * Sparser black dots drifting across the home screen's yellow header, laid out
 * on the 390 x 288 header artboard (Figma nodes 180:88925 – 180:88944).
 */
export const HEADER_STARS: ReadonlyArray<Star> = [
  { x: 27.29, y: 14.39, w: 2.997, h: 2.997, opacity: 0.2 },
  { x: 148.2, y: 149.74, w: 1.994, h: 1.994, opacity: 0.32 },
  { x: 269.09, y: 54.71, w: 1.994, h: 1.994, opacity: 0.44 },
  { x: 0, y: 190.05, w: 1.994, h: 1.994, opacity: 0.56 },
  { x: 120.89, y: 95.02, w: 2.997, h: 2.997, opacity: 0.2 },
  { x: 241.78, y: 0, w: 1.994, h: 1.994, opacity: 0.32 },
  { x: 362.69, y: 135.33, w: 1.994, h: 1.994, opacity: 0.44 },
  { x: 93.59, y: 40.31, w: 1.994, h: 1.994, opacity: 0.56 },
  { x: 214.49, y: 175.65, w: 2.997, h: 2.997, opacity: 0.2 },
  { x: 335.39, y: 80.62, w: 1.994, h: 1.994, opacity: 0.32 },
  { x: 66.3, y: 215.97, w: 1.994, h: 1.994, opacity: 0.44 },
  { x: 187.19, y: 120.94, w: 1.994, h: 1.994, opacity: 0.56 },
  { x: 308.08, y: 25.91, w: 2.997, h: 2.997, opacity: 0.2 },
  { x: 39, y: 161.26, w: 1.994, h: 1.994, opacity: 0.32 },
  { x: 159.89, y: 66.23, w: 1.994, h: 1.994, opacity: 0.44 },
  { x: 280.79, y: 201.57, w: 1.994, h: 1.994, opacity: 0.56 },
  { x: 11.69, y: 106.54, w: 2.997, h: 2.997, opacity: 0.2 },
  { x: 132.6, y: 11.52, w: 1.994, h: 1.994, opacity: 0.32 },
  { x: 253.49, y: 146.86, w: 1.994, h: 1.994, opacity: 0.44 },
  { x: 374.38, y: 51.83, w: 1.994, h: 1.994, opacity: 0.56 },
];

type StarFieldProps = {
  stars?: ReadonlyArray<Star>;
  color?: string;
  /** Height of the artboard `stars` were measured on. */
  frameHeight?: number;
};

export function StarField({
  stars = HERO_STARS,
  color = colors.cosmos.star,
  frameHeight = designFrame.heroHeight,
}: StarFieldProps) {
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      {stars.map(star => (
        <View
          key={`${star.x}-${star.y}`}
          style={[
            styles.star,
            {
              left: `${(star.x / designFrame.width) * 100}%`,
              top: `${(star.y / frameHeight) * 100}%`,
              width: star.w,
              height: star.h,
              // Square stars are drawn as dots, the stretched ones as slivers.
              borderRadius: star.w === star.h ? star.w / 2 : 0,
              opacity: star.opacity,
              backgroundColor: color,
            },
          ]}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  star: {
    position: 'absolute',
  },
});
