import React, { useEffect } from 'react';
import { StatusBar, StyleSheet, Text, View } from 'react-native';

import { colors, hairline, radius, spacing, typography } from '../theme';

const RING_SIZE = 80;
const RING_WIDTH = 3.776;
/** How long Figma's interstitial is shown before the receipt appears. */
const DWELL_MS = 2000;

type PaymentProcessingScreenProps = {
  onSettled?: () => void;
};

/**
 * Interstitial shown while the gateway settles. Figma: node 180:163391.
 *
 * The mockup draws the ring rotated 78°, but its stroke is a single flat grey
 * so the rotation reads as static — it is kept that way rather than invented
 * into an animation.
 */
export function PaymentProcessingScreen({
  onSettled,
}: PaymentProcessingScreenProps) {
  useEffect(() => {
    const timer = setTimeout(() => onSettled?.(), DWELL_MS);
    return () => clearTimeout(timer);
  }, [onSettled]);

  return (
    <View style={styles.screen}>
      <StatusBar barStyle="dark-content" />

      <View style={styles.ring} />

      <View>
        <Text style={styles.title}>Processing Payment</Text>
        <Text style={styles.subtitle}>Please do not close this screen</Text>
      </View>

      <View style={styles.badge}>
        <Text style={styles.badgeLabel}>Powered by Razorpay</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.canvas,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xl,
  },
  ring: {
    width: RING_SIZE,
    height: RING_SIZE,
    borderRadius: RING_SIZE / 2,
    borderWidth: RING_WIDTH,
    borderColor: colors.border.subtle,
    transform: [{ rotate: '77.99deg' }],
  },
  title: {
    ...typography.titleSmall,
    color: colors.text.primary,
    textAlign: 'center',
  },
  subtitle: {
    ...typography.footnote,
    color: colors.text.secondary,
    textAlign: 'center',
    paddingTop: 6,
  },
  badge: {
    borderRadius: radius.field,
    borderWidth: hairline,
    borderColor: colors.status.infoTintBorder,
    backgroundColor: colors.status.infoTint,
    paddingHorizontal: 20.755,
    paddingVertical: 10.755,
  },
  badgeLabel: {
    ...typography.detailValue,
    color: colors.cosmos.accent,
  },
});
