import React from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import { colors, radius, spacing, typography } from '../theme';
import { BrandGradient } from './BrandGradient';

const SEGMENT_HEIGHT = 35.999;

type SegmentedTabsProps<T extends string> = {
  segments: ReadonlyArray<{ key: T; label: string }>;
  active: T;
  onSelect: (key: T) => void;
  style?: StyleProp<ViewStyle>;
};

/**
 * Pill-shaped tab switcher riding on the yellow header, with the selected
 * segment filled by the brand gradient (Figma node 180:89770).
 */
export function SegmentedTabs<T extends string>({
  segments,
  active,
  onSelect,
  style,
}: SegmentedTabsProps<T>) {
  return (
    <View style={[styles.track, style]}>
      {segments.map(segment => {
        const selected = segment.key === active;

        return (
          <Pressable
            key={segment.key}
            accessibilityRole="tab"
            /** Named, so a screen reader announces the tab rather than only its inner text. */
            accessibilityLabel={segment.label}
            accessibilityState={{ selected }}
            onPress={() => onSelect(segment.key)}
            style={[
              styles.segment,
              selected ? styles.segmentActive : styles.segmentIdle,
            ]}
          >
            {selected && <BrandGradient radius={radius.button} />}
            <Text
              style={selected ? styles.labelActive : styles.labelIdle}
              numberOfLines={1}
            >
              {segment.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    flexDirection: 'row',
    gap: spacing.xs,
    borderRadius: radius.field,
    backgroundColor: colors.glass.segment,
    padding: spacing.xs,
  },
  segment: {
    flex: 1,
    height: SEGMENT_HEIGHT,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  segmentActive: {
    borderRadius: radius.button,
  },
  segmentIdle: {
    borderRadius: radius.badge,
  },
  labelActive: {
    ...typography.footnoteStrong,
    color: colors.text.inverse,
    textAlign: 'center',
  },
  labelIdle: {
    ...typography.footnote,
    color: colors.text.onYellowSubtle,
    textAlign: 'center',
  },
});
