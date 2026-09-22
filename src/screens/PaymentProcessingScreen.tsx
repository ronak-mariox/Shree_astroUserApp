import React, { useEffect } from 'react';
import { StatusBar, StyleSheet, Text, View } from 'react-native';

import { colors, hairline, radius, spacing, typography } from '../theme';

const RING_SIZE = 80;
const RING_WIDTH = 3.776;
/**
 * How long the interstitial is held before moving on — a deliberate UX beat,
 * not a wait on anything real. There is no gateway to actually settle with
 * yet (see wallet.service.js on the backend): `onSettled` below is what
 * confirms the top-up, and it would resolve almost instantly without this.
 */
const DWELL_MS = 2000;

type PaymentProcessingScreenProps = {
  /** Confirms the top-up. A rejection is read as failure — see onFailed. */
  onSettled?: () => Promise<void> | void;
  onFailed?: (message: string) => void;
};

/**
 * Interstitial shown while the top-up settles. Figma: node 180:163391.
 *
 * The mockup draws the ring rotated 78°, but its stroke is a single flat grey
 * so the rotation reads as static — it is kept that way rather than invented
 * into an animation.
 */
export function PaymentProcessingScreen({
  onSettled,
  onFailed,
}: PaymentProcessingScreenProps) {
  useEffect(() => {
    let live = true;

    const timer = setTimeout(async () => {
      try {
        await onSettled?.();
      } catch (error) {
        if (live) {
          onFailed?.(
            error instanceof Error ? error.message : 'Something went wrong. Please try again.',
          );
        }
      }
    }, DWELL_MS);

    return () => {
      live = false;
      clearTimeout(timer);
    };
  }, [onSettled, onFailed]);

  return (
    <View style={styles.screen}>
      <StatusBar barStyle="dark-content" />

      <View style={styles.ring} />

      <View>
        <Text style={styles.title}>Processing Payment</Text>
        <Text style={styles.subtitle}>Please do not close this screen</Text>
      </View>

      <View style={styles.badge}>
        <Text style={styles.badgeLabel}>256-bit encrypted</Text>
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
