import React, { useId } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import Svg, {
  Circle,
  Defs,
  LinearGradient,
  RadialGradient,
  Rect,
  Stop,
} from 'react-native-svg';

import { type ConsultBannerSlide } from '../data/consult';
import { fontFamily } from '../theme';

/**
 * The two slides Figma never drew (only "When Will I Get Marriage ?" — node
 * 180:90174 — shipped as an export) are painted live instead of shipping a
 * matching PNG: a brand-gradient card, the same soft glow-and-swirl
 * background the marriage art uses, and a plain coloured glyph standing in
 * for a bespoke illustration.
 */
const THEMES: Record<string, { from: string; to: string; glyph: string; iconColor: string }> = {
  love: { from: '#EC4899', to: '#F472B6', glyph: '♥', iconColor: '#EC4899' },
  wealth: { from: '#FFBF01', to: '#FF4E01', glyph: '₹', iconColor: '#FF4E01' },
};

type ConsultBannerCardProps = {
  slide: ConsultBannerSlide;
  /** The visible card size — one page of the carousel. */
  width: number;
  height: number;
  /** The marriage export's natural height, taller than the card; see the screen's own note on why it's clipped. */
  imageNaturalHeight?: number;
};

export function ConsultBannerCard({
  slide,
  width,
  height,
  imageNaturalHeight,
}: ConsultBannerCardProps) {
  const gradientId = `consult-banner-bg-${useId()}`;
  const glowId = `consult-banner-glow-${useId()}`;
  const radius = height * 0.32;

  if (slide.image) {
    return (
      <View style={{ width, height, borderRadius: radius, overflow: 'hidden' }}>
        <Image
          source={slide.image}
          style={{ width, height: imageNaturalHeight ?? height }}
          accessibilityLabel={slide.headline}
          accessible
        />
      </View>
    );
  }

  const theme = THEMES[slide.id] ?? THEMES.love;
  const badgeSize = height * 0.64;

  return (
    <View
      style={[styles.card, { width, height, borderRadius: radius }]}
      accessibilityLabel={slide.headline}
      accessible
    >
      <Svg width={width} height={height} style={StyleSheet.absoluteFill}>
        <Defs>
          <LinearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0" stopColor={theme.from} />
            <Stop offset="1" stopColor={theme.to} />
          </LinearGradient>
          <RadialGradient id={glowId} cx="50%" cy="50%" r="50%">
            <Stop offset="0" stopColor="#FFFFFF" stopOpacity={0.4} />
            <Stop offset="1" stopColor="#FFFFFF" stopOpacity={0} />
          </RadialGradient>
        </Defs>
        <Rect x={0} y={0} width={width} height={height} rx={radius} fill={`url(#${gradientId})`} />
        <Circle cx={width * 0.94} cy={height * 0.02} r={height * 1.1} fill="#FFFFFF" opacity={0.05} />
        <Circle cx={width * 0.84} cy={height * 0.98} r={height * 0.8} fill="#FFFFFF" opacity={0.07} />
        <Circle cx={width * 0.855} cy={height * 0.5} r={height * 0.48} fill={`url(#${glowId})`} />
      </Svg>

      <Text
        style={[styles.headline, { fontSize: height * 0.24, maxWidth: width * 0.66 }]}
        numberOfLines={2}
      >
        {slide.headline}
      </Text>

      <View
        style={[
          styles.badge,
          {
            width: badgeSize,
            height: badgeSize,
            borderRadius: badgeSize / 2,
            right: width * 0.075,
          },
        ]}
      >
        <Text style={[styles.glyph, { fontSize: badgeSize * 0.5, color: theme.iconColor }]}>
          {theme.glyph}
        </Text>
      </View>
    </View>
  );
}

type ConsultBannerDotsProps = {
  count: number;
  activeIndex: number;
  /** Same scale factor the screen sizes everything else with. */
  scale?: number;
};

/** Pagination pills — a wider gold dash for the active slide, dim grey dashes for the rest. */
export function ConsultBannerDots({ count, activeIndex, scale = 1 }: ConsultBannerDotsProps) {
  return (
    <View style={[styles.dotsRow, { gap: 7.05 * scale }]}>
      {Array.from({ length: count }).map((_, index) => (
        <View
          key={index}
          style={{
            width: (index === activeIndex ? 14.2305 : 6.342) * scale,
            height: 4 * scale,
            borderRadius: 2 * scale,
            backgroundColor: index === activeIndex ? '#EEDF43' : '#5C5C5C',
            opacity: index === activeIndex ? 1 : 0.3,
          }}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    overflow: 'hidden',
    paddingLeft: '7%',
  },
  headline: {
    fontFamily: fontFamily.bold,
    color: '#FFFFFF',
    flexShrink: 1,
  },
  badge: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
  },
  glyph: {
    fontFamily: fontFamily.bold,
  },
  dotsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});
