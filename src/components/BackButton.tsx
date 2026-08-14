import React from 'react';
import {
  Pressable,
  StyleSheet,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import { colors, radius } from '../theme';
import { ArrowLeftIcon } from './icons/ArrowLeftIcon';

const SIZE = 39.999;
const ICON_SIZE = 19.999;

type BackButtonProps = {
  onPress?: () => void;
  /** Tile fill — neutral on white screens, mint on the yellow header. */
  backgroundColor?: string;
  iconColor?: string;
  style?: StyleProp<ViewStyle>;
};

/** Rounded 40pt tile holding the back arrow (Figma nodes 180:88411, 180:88487). */
export function BackButton({
  onPress,
  backgroundColor = colors.surfaceMuted,
  iconColor = colors.text.primary,
  style,
}: BackButtonProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Go back"
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        { backgroundColor },
        pressed && styles.pressed,
        style,
      ]}
    >
      <ArrowLeftIcon size={ICON_SIZE} color={iconColor} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    width: SIZE,
    height: SIZE,
    borderRadius: radius.icon,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: {
    opacity: 0.6,
  },
});
