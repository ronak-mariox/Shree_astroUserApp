import React from 'react';
import {
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import { colors, hairline, radius, typography } from '../theme';
import { AppleIcon } from './icons/AppleIcon';
import { GoogleIcon } from './icons/GoogleIcon';

const BUTTON_HEIGHT = 49.992;
const ICON_SIZE = 19.999;

type SocialAuthButtonsProps = {
  onGooglePress?: () => void;
  onApplePress?: () => void;
  style?: StyleProp<ViewStyle>;
};

/**
 * Google and Apple sign-in buttons — the identical pair that closes all three
 * login screens (Figma nodes 180:88449, 180:88540, 180:88634).
 */
export function SocialAuthButtons({
  onGooglePress,
  onApplePress,
  style,
}: SocialAuthButtonsProps) {
  return (
    <View style={[styles.group, style]}>
      <Pressable
        accessibilityRole="button"
        onPress={onGooglePress}
        style={({ pressed }) => [
          styles.button,
          styles.googleButton,
          pressed && styles.pressed,
        ]}
      >
        <GoogleIcon size={ICON_SIZE} />
        <Text style={[styles.label, styles.googleLabel]}>
          Continue with Google
        </Text>
      </Pressable>

      <Pressable
        accessibilityRole="button"
        onPress={onApplePress}
        style={({ pressed }) => [
          styles.button,
          styles.appleButton,
          pressed && styles.pressed,
        ]}
      >
        <AppleIcon size={ICON_SIZE} color={colors.text.inverse} />
        <Text style={[styles.label, styles.appleLabel]}>
          Continue with Apple
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  group: {
    gap: 10,
  },
  button: {
    height: BUTTON_HEIGHT,
    borderRadius: radius.field,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  googleButton: {
    backgroundColor: colors.surface,
    borderWidth: hairline,
    borderColor: colors.border.subtle,
    // drop-shadow(0 2px 4px rgba(0, 0, 0, 0.05))
    ...Platform.select({
      ios: {
        shadowColor: colors.shadow,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
      },
      android: { elevation: 2 },
      default: {},
    }),
  },
  appleButton: {
    backgroundColor: colors.surfaceDark,
  },
  pressed: {
    opacity: 0.8,
  },
  label: {
    ...typography.buttonSocial,
    textAlign: 'center',
  },
  googleLabel: {
    color: colors.text.primary,
  },
  appleLabel: {
    color: colors.text.inverse,
  },
});
