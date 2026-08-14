import React from 'react';
import { Platform, Pressable, StyleSheet, View } from 'react-native';

import { colors, radius } from '../theme';
import { CameraIcon } from './icons/CameraIcon';
import { UserIcon } from './icons/UserIcon';

const TILE_SIZE = 87.997;
const TILE_BORDER = 2.265;
const BADGE_SIZE = 27.999;
const BADGE_OFFSET = 64;

type AvatarPickerProps = {
  onPress?: () => void;
};

/**
 * Rounded avatar tile with a camera badge clipped to its bottom-right corner
 * (Figma node 180:88712). Renders the placeholder glyph until a photo is
 * chosen; the badge is the tap target for picking one.
 */
export function AvatarPicker({ onPress }: AvatarPickerProps) {
  return (
    <View style={styles.wrapper}>
      <View style={styles.tile}>
        <UserIcon />
      </View>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Change profile photo"
        onPress={onPress}
        style={({ pressed }) => [styles.badge, pressed && styles.pressed]}
      >
        <CameraIcon />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    width: TILE_SIZE,
    height: TILE_SIZE,
  },
  tile: {
    width: TILE_SIZE,
    height: TILE_SIZE,
    borderRadius: radius.avatar,
    borderWidth: TILE_BORDER,
    borderColor: colors.border.soft,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    // drop-shadow(0 8px 12px rgba(255, 140, 0, 0.4))
    ...Platform.select({
      ios: {
        shadowColor: colors.cosmos.accent,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.4,
        shadowRadius: 12,
      },
      android: { elevation: 8 },
      default: {},
    }),
  },
  badge: {
    position: 'absolute',
    left: BADGE_OFFSET,
    top: BADGE_OFFSET,
    width: BADGE_SIZE,
    height: BADGE_SIZE,
    borderRadius: radius.badge,
    backgroundColor: colors.surfaceInk,
    alignItems: 'center',
    justifyContent: 'center',
    // drop-shadow(0 2px 4px rgba(0, 0, 0, 0.15))
    ...Platform.select({
      ios: {
        shadowColor: colors.shadow,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 4,
      },
      android: { elevation: 4 },
      default: {},
    }),
  },
  pressed: {
    opacity: 0.8,
  },
});
