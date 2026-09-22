import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { formatCountdown } from '../data/consultPackages';
import { rupees } from '../services/api';
import { colors, fontFamily, spacing } from '../theme';

type PackageTimerBannerProps = {
  /** Seconds left on the package, measured on the server's clock. */
  secondsLeft: number;
  /** What the session is billed at once the package runs out. */
  ratePerMinute: number;
};

/**
 * Under the chat header of a package session in its last ~30 seconds: the
 * package is ending and the chat will carry on per-minute. Informational
 * only — when the wallet can't cover per-minute, the existing
 * LowBalanceBanner (and its Recharge popup) is shown instead of this.
 */
export function PackageTimerBanner({ secondsLeft, ratePerMinute }: PackageTimerBannerProps) {
  const timeUp = secondsLeft <= 0;

  return (
    <View accessibilityRole="alert" style={styles.banner}>
      <Text style={styles.label}>
        {timeUp ? (
          'Package time is over'
        ) : (
          <>
            Package ending in <Text style={styles.strong}>{formatCountdown(secondsLeft)}</Text>
          </>
        )}
      </Text>
      <Text style={styles.note}>
        {timeUp ? `Continuing at ${rupees(ratePerMinute)}/min` : `Then ${rupees(ratePerMinute)}/min`}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    minHeight: 55,
    justifyContent: 'center',
    paddingHorizontal: spacing.section,
    paddingVertical: spacing.sm,
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    backgroundColor: colors.recharge.banner,
  },
  label: {
    fontFamily: fontFamily.medium,
    fontSize: 14,
    color: colors.text.inverse,
  },
  strong: {
    fontFamily: fontFamily.bold,
  },
  note: {
    fontFamily: fontFamily.regular,
    fontSize: 12,
    color: colors.text.inverse,
  },
});
