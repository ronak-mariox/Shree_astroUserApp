import React from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import { colors, hairline, radius, spacing, typography } from '../theme';
import { BrandGradient } from './BrandGradient';

const CHIP_HEIGHT = 33.993;

type FilterChipsProps<T extends string> = {
  filters: ReadonlyArray<{ key: T; label: string }>;
  active: T;
  onSelect: (key: T) => void;
  style?: StyleProp<ViewStyle>;
};

/**
 * Loose row of filter pills on the yellow header, the selected one filled with
 * the brand gradient (Figma node 180:164203). Unlike {@link SegmentedTabs}
 * these size to their label rather than sharing the width evenly.
 */
export function FilterChips<T extends string>({
  filters,
  active,
  onSelect,
  style,
}: FilterChipsProps<T>) {
  return (
    <View style={[styles.row, style]}>
      {filters.map(filter => {
        const selected = filter.key === active;

        return (
          <Pressable
            key={filter.key}
            accessibilityRole="tab"
            accessibilityState={{ selected }}
            onPress={() => onSelect(filter.key)}
            style={[
              styles.chip,
              selected ? styles.chipSelected : styles.chipIdle,
            ]}
          >
            {selected && <BrandGradient radius={radius.button} />}
            <Text style={selected ? styles.labelOn : styles.labelOff}>
              {filter.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  chip: {
    height: CHIP_HEIGHT,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  chipSelected: {
    borderRadius: radius.button,
    paddingHorizontal: spacing.section,
  },
  chipIdle: {
    borderRadius: radius.badge,
    borderWidth: hairline,
    borderColor: colors.border.faint,
    paddingHorizontal: 16.755,
  },
  labelOn: {
    ...typography.captionStrong,
    color: colors.canvas,
    textAlign: 'center',
  },
  labelOff: {
    ...typography.caption,
    color: colors.text.onYellowSubtle,
    textAlign: 'center',
  },
});
