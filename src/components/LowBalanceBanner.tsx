import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, fontFamily, radius, spacing } from '../theme';

type LowBalanceBannerProps = {
  /** The seeker's current wallet balance, live — services/api.ts's fetchWallet. */
  balance: number;
  onRecharge?: () => void;
};

/**
 * Sits directly under the chat header once the live tick warns the balance
 * won't cover much more — a standing notice with its own way out, rather
 * than a blocking alert that interrupts whatever the seeker is doing.
 * Figma: node 180:144988 ("Low Balence").
 */
export function LowBalanceBanner({ balance, onRecharge }: LowBalanceBannerProps) {
  return (
    <View style={styles.banner}>
      <Text style={styles.label}>
        Low Balance: <Text style={styles.amount}>₹ {Math.max(0, Math.round(balance)).toLocaleString('en-IN')}</Text>
      </Text>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Recharge wallet"
        onPress={onRecharge}
        style={({ pressed }) => [styles.action, pressed && styles.pressed]}
      >
        <Text style={styles.actionLabel}>Recharge</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
    minHeight: 55,
    paddingHorizontal: spacing.section,
    paddingVertical: spacing.sm,
    // Rounds into the yellow header above it (Figma node 180:148210).
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    backgroundColor: colors.recharge.banner,
  },
  label: {
    flex: 1,
    fontFamily: fontFamily.medium,
    fontSize: 14,
    color: colors.text.inverse,
  },
  amount: {
    fontFamily: fontFamily.bold,
  },
  action: {
    height: 36,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.chip,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
  },
  actionLabel: {
    fontFamily: fontFamily.regular,
    fontSize: 12,
    color: colors.recharge.banner,
  },
  pressed: {
    opacity: 0.8,
  },
});
