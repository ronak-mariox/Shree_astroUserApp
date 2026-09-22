import React from 'react';
import { ActivityIndicator, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BrandGradient } from './BrandGradient';
import { formatCountdown, isDiscounted, type PackageQuote } from '../data/consultPackages';
import { rupees } from '../services/api';
import { colors, fontFamily, radius, spacing, typography } from '../theme';

type ExtendConsultationDialogProps = {
  visible: boolean;
  /** The package options, priced at the session's own frozen rate and flagged against the wallet (server-sent). */
  quotes: PackageQuote[];
  ratePerMinute: number;
  /** Whether the wallet covers the one per-minute minute charged upfront on switching. */
  perMinuteAffordable: boolean;
  balance?: number;
  /** Seconds left to answer before the session ends by itself (server's clock). */
  secondsLeft: number;
  /** True while an answer is being sent — every button is disabled so it can't be sent twice. */
  busy?: boolean;
  onExtend: (quote: PackageQuote) => void;
  onPerMinute: () => void;
  onEnd: () => void;
};

/**
 * "Extend consultation?" — opened the moment a package's time is up. The
 * session is frozen (and nothing is charged) while this is open; left
 * unanswered, the server ends the session when the countdown runs out.
 * Deliberately not dismissable by tapping outside: one of the three answers
 * is required.
 */
export function ExtendConsultationDialog({
  visible,
  quotes,
  ratePerMinute,
  perMinuteAffordable,
  balance,
  secondsLeft,
  busy = false,
  onExtend,
  onPerMinute,
  onEnd,
}: ExtendConsultationDialogProps) {
  const insets = useSafeAreaInsets();

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={() => {}} statusBarTranslucent>
      <View style={styles.stage}>
        <View style={styles.scrim} />

        <View style={[styles.sheet, { paddingBottom: spacing.lg + insets.bottom }]}>
          <Text style={styles.title}>Your package time is over</Text>
          <Text style={styles.body}>Extend consultation?</Text>
          <Text accessibilityLabel={`Ends automatically in ${secondsLeft} seconds`} style={styles.countdown}>
            Ends automatically in {formatCountdown(secondsLeft)}
          </Text>
          {balance !== undefined && <Text style={styles.balance}>Wallet balance: {rupees(balance)}</Text>}

          <Text style={styles.sectionLabel}>Extend with another package</Text>
          <View style={styles.grid}>
            {quotes.map(quote => {
              const affordable = quote.affordable !== false;
              const discounted = isDiscounted(quote);
              return (
                <Pressable
                  key={quote.minutes}
                  accessibilityRole="button"
                  accessibilityLabel={`Extend ${quote.minutes} min for ${rupees(quote.price)}`}
                  accessibilityState={{ disabled: busy }}
                  disabled={busy}
                  onPress={() => onExtend(quote)}
                  style={({ pressed }) => [styles.tile, !affordable && styles.tileShort, pressed && styles.pressed]}
                >
                  {discounted && (
                    <View style={styles.offBadge}>
                      <Text style={styles.offLabel}>{quote.discountPercent}% OFF</Text>
                    </View>
                  )}
                  <Text style={styles.tileMinutes}>+{quote.minutes} min</Text>
                  <View style={styles.priceRow}>
                    {discounted && <Text style={styles.tileOriginal}>{rupees(quote.originalPrice)}</Text>}
                    <Text style={styles.tilePrice}>{rupees(quote.price)}</Text>
                  </View>
                  {!affordable && <Text style={styles.tileHint}>Recharge {rupees(quote.shortfallAmount)}</Text>}
                </Pressable>
              );
            })}
          </View>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Continue per-minute at ${rupees(ratePerMinute)} per minute`}
            accessibilityState={{ disabled: busy }}
            disabled={busy}
            onPress={onPerMinute}
            style={({ pressed }) => [styles.action, pressed && styles.pressed]}
          >
            <BrandGradient radius={radius.action} />
            <Text style={styles.actionLabel}>
              Continue per-minute · {rupees(ratePerMinute)}/min{perMinuteAffordable ? '' : ' (recharge needed)'}
            </Text>
          </Pressable>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="End consultation"
            accessibilityState={{ disabled: busy }}
            disabled={busy}
            onPress={onEnd}
            style={({ pressed }) => [styles.action, styles.endAction, pressed && styles.pressed]}
          >
            <Text style={styles.endLabel}>End consultation</Text>
          </Pressable>

          {busy && <ActivityIndicator style={styles.spinner} color={colors.text.onYellow} />}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  stage: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  scrim: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    backgroundColor: colors.scrim,
  },
  sheet: {
    alignSelf: 'center',
    width: '100%',
    maxWidth: 480,
    borderTopLeftRadius: radius.sheet,
    borderTopRightRadius: radius.sheet,
    backgroundColor: colors.surface,
    paddingTop: spacing.xl,
    paddingHorizontal: spacing.xl,
    gap: spacing.sm,
  },
  title: {
    ...typography.dialogTitle,
    fontFamily: fontFamily.bold,
    color: colors.text.onYellow,
    textAlign: 'center',
  },
  body: {
    ...typography.dialogBody,
    color: colors.text.onYellow,
    textAlign: 'center',
  },
  countdown: {
    fontFamily: fontFamily.semiBold,
    fontSize: 14,
    color: colors.status.debit,
    textAlign: 'center',
  },
  balance: {
    ...typography.caption,
    color: colors.text.intakeLabel,
    textAlign: 'center',
  },
  sectionLabel: {
    ...typography.caption,
    color: colors.text.intakeLabel,
    paddingTop: spacing.sm,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  tile: {
    flexBasis: '47%',
    flexGrow: 1,
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderRadius: radius.tag,
    borderWidth: 1,
    borderColor: colors.border.intakeField,
    backgroundColor: colors.surface,
  },
  tileShort: {
    borderColor: colors.status.debitTintBorderStrong,
    backgroundColor: colors.status.negativeTint,
  },
  tileMinutes: {
    fontFamily: fontFamily.semiBold,
    fontSize: 15,
    color: colors.text.onYellow,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: spacing.xs,
  },
  tilePrice: {
    fontFamily: fontFamily.bold,
    fontSize: 16,
    color: colors.border.intakeSelected,
  },
  tileOriginal: {
    fontFamily: fontFamily.regular,
    fontSize: 13,
    color: colors.text.intakeLabel,
    textDecorationLine: 'line-through',
  },
  offBadge: {
    position: 'absolute',
    top: -8,
    right: spacing.sm,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: radius.chip,
    backgroundColor: colors.status.positive,
  },
  offLabel: {
    fontFamily: fontFamily.semiBold,
    fontSize: 10,
    color: colors.text.inverse,
  },
  tileHint: {
    ...typography.caption,
    color: colors.status.debit,
  },
  action: {
    height: 52,
    marginTop: spacing.sm,
    borderRadius: radius.action,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  actionLabel: {
    ...typography.dialogAction,
    color: colors.text.inverse,
  },
  endAction: {
    borderWidth: 1,
    borderColor: colors.text.onYellow,
    backgroundColor: colors.surface,
  },
  endLabel: {
    ...typography.dialogAction,
    color: colors.text.onYellow,
  },
  spinner: {
    paddingTop: spacing.sm,
  },
  pressed: {
    opacity: 0.8,
  },
});
