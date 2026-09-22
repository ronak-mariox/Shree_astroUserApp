import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { formatCountdown } from '../data/consultPackages';
import { colors, fontFamily, spacing } from '../theme';

type PackageTimerBannerProps = {
  /** Seconds left on the package, measured on the server's clock. */
  secondsLeft: number;
};

/**
 * Under the chat header of a package session in its last ~30 seconds, and
 * once its time is up while the extend prompt is on its way. Styled like
 * LowBalanceBanner so the two read as the same family of notices.
 */
export function PackageTimerBanner({ secondsLeft }: PackageTimerBannerProps) {
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
      <Text style={styles.note}>{timeUp ? 'Choose how to continue…' : "You'll be asked to extend."}</Text>
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
