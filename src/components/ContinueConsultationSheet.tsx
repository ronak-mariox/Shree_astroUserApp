import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BrandGradient } from './BrandGradient';
import { ConsultationTypePicker } from './ConsultationTypePicker';
import { PER_MINUTE, canAfford, type ConsultationChoice, type PackageQuote } from '../data/consultPackages';
import { rupees } from '../services/api';
import { colors, fontFamily, radius, spacing, typography } from '../theme';

type ContinueConsultationSheetProps = {
  visible: boolean;
  ratePerMinute: number;
  /** The packages, priced at the session's frozen rate and current discounts, flagged against the wallet. */
  quotes: PackageQuote[];
  balance?: number;
  /** True while the choice is being sent — the buttons are disabled so it can't be sent twice. */
  busy?: boolean;
  /** Called with the choice once "Continue" is pressed. An unaffordable choice is the caller's cue to recharge. */
  onContinue: (choice: ConsultationChoice) => void;
  onEnd: () => void;
};

/**
 * Shown when a package's time is over and the session is paused: the seeker
 * approves how to go on — per-minute, or another package — using the very
 * same picker as the intake form (per-minute rate, package prices with any
 * admin discount struck through). Nothing is charged until they press
 * Continue; they can also end the consultation. Not dismissable by tapping
 * outside — the session stays paused until one of those two.
 */
export function ContinueConsultationSheet({
  visible,
  ratePerMinute,
  quotes,
  balance,
  busy = false,
  onContinue,
  onEnd,
}: ContinueConsultationSheetProps) {
  const insets = useSafeAreaInsets();
  const [choice, setChoice] = useState<ConsultationChoice>(PER_MINUTE);

  /** Re-priced options (a recharge, a discount change) replace a stale selected price. */
  useEffect(() => {
    setChoice(current => {
      if (current.mode !== 'package') return current;
      const quote = quotes.find(entry => entry.minutes === current.minutes);
      return quote ? { mode: 'package', minutes: quote.minutes, price: quote.price } : PER_MINUTE;
    });
  }, [quotes]);

  const price = choice.mode === 'package' ? choice.price : ratePerMinute;
  const affordable = canAfford(price, balance);
  const label = affordable
    ? choice.mode === 'package'
      ? `Continue · Pay ${rupees(choice.price)}`
      : `Continue per-minute · ${rupees(ratePerMinute)}/min`
    : `Recharge to continue (${rupees(Math.max(0, price - (balance ?? 0)))} more)`;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={() => {}} statusBarTranslucent>
      <View style={styles.stage}>
        <View style={styles.scrim} />
        <View style={[styles.sheet, { paddingBottom: spacing.lg + insets.bottom }]}>
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
            <Text style={styles.title}>Your package time is over</Text>
            <Text style={styles.body}>
              The consultation is paused. How would you like to continue?
            </Text>
            {balance !== undefined && <Text style={styles.balance}>Wallet balance: {rupees(balance)}</Text>}

            <ConsultationTypePicker
              channel="chat"
              heading="Continue with"
              ratePerMinute={ratePerMinute}
              quotes={quotes}
              walletBalance={balance}
              value={choice}
              onChange={setChoice}
              packageNote="Charged now. Nothing is charged per minute during the package."
              perMinuteNote={`${rupees(ratePerMinute)}/min — the first minute is charged now, then each minute.`}
            />

            <Pressable
              accessibilityRole="button"
              accessibilityLabel={label}
              accessibilityState={{ disabled: busy }}
              disabled={busy}
              onPress={() => onContinue(choice)}
              style={({ pressed }) => [styles.action, pressed && styles.pressed]}
            >
              <BrandGradient radius={radius.action} />
              <Text style={styles.actionLabel}>{label}</Text>
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
          </ScrollView>
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
    maxHeight: '90%',
    borderTopLeftRadius: radius.sheet,
    borderTopRightRadius: radius.sheet,
    backgroundColor: colors.surface,
    paddingTop: spacing.xl,
  },
  content: {
    paddingHorizontal: spacing.xl,
    gap: spacing.md,
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
  balance: {
    ...typography.caption,
    color: colors.text.intakeLabel,
    textAlign: 'center',
  },
  action: {
    height: 52,
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
