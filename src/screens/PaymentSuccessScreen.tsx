import React from 'react';
import {
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BrandGradient } from '../components/BrandGradient';
import { PrimaryButton } from '../components/PrimaryButton';
import { CheckLargeIcon } from '../components/icons/CheckLargeIcon';
import { confetti, receipt } from '../data/wallet';
import {
  colors,
  hairline,
  radius,
  spacing,
  typography,
} from '../theme';

const BADGE_SIZE = 120;
const CHECK_SIZE = 51.998;
const CONFETTI_SIZE = 8;
const CTA_HEIGHT = 53.992;
const CARD_WIDTH = 341.993;

type PaymentSuccessScreenProps = {
  amount: number;
  onGoToWallet?: () => void;
  onBackToHome?: () => void;
};

/** One label/value line on the receipt. */
function ReceiptRow({
  label,
  value,
  highlight = false,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <View style={styles.receiptRow}>
      <Text style={styles.receiptLabel}>{label}</Text>
      <Text style={highlight ? styles.receiptTotal : styles.receiptValue}>
        {value}
      </Text>
    </View>
  );
}

/**
 * Confirmation and receipt for a completed top-up. Figma: node 180:163421.
 */
export function PaymentSuccessScreen({
  amount,
  onGoToWallet,
  onBackToHome,
}: PaymentSuccessScreenProps) {
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.screen}>
      <StatusBar barStyle="dark-content" />

      {confetti.map(dot => (
        <View
          key={`${dot.left}-${dot.top}-${dot.color}`}
          pointerEvents="none"
          style={[
            styles.confetti,
            {
              left: `${dot.left}%`,
              top: `${dot.top}%`,
              backgroundColor: dot.color,
            },
          ]}
        />
      ))}

      <ScrollView
        contentContainerStyle={[
          styles.body,
          { paddingBottom: spacing.xl + insets.bottom },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.badge}>
          <BrandGradient
            radius={BADGE_SIZE / 2}
            from={colors.gradient.successFrom}
            to={colors.gradient.successTo}
          />
          <CheckLargeIcon size={CHECK_SIZE} />
        </View>

        <Text style={styles.title}>Payment Successful! 🎉</Text>
        <Text style={styles.subtitle}>Your wallet has been topped up</Text>

        <View style={styles.receipt}>
          <View style={styles.receiptHeader}>
            <BrandGradient
              radius={radius.summary}
              angle="toRight"
              from={colors.gradient.summaryFrom}
              to={colors.gradient.summaryTo}
            />
            <Text style={styles.receiptEyebrow}>AMOUNT ADDED</Text>
            <Text style={styles.receiptAmount}>₹{amount}</Text>
          </View>

          <View style={styles.receiptBody}>
            <ReceiptRow label="Transaction ID" value={receipt.transactionId} />
            <ReceiptRow label="Payment Method" value={receipt.method} />
            <ReceiptRow label="Date & Time" value={receipt.dateTime} />
            <ReceiptRow
              label="Previous Balance"
              value={receipt.previousBalance}
            />
            <ReceiptRow label="New Balance" value={receipt.newBalance} highlight />
          </View>
        </View>

        <PrimaryButton
          label="Go to Wallet"
          style={styles.cta}
          onPress={onGoToWallet}
        />

        <Text
          accessibilityRole="link"
          onPress={onBackToHome}
          style={styles.backHome}
        >
          Back to Home
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.canvas,
  },
  confetti: {
    position: 'absolute',
    width: CONFETTI_SIZE,
    height: CONFETTI_SIZE,
    borderRadius: CONFETTI_SIZE / 2,
    opacity: 0.7,
  },
  body: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  badge: {
    width: BADGE_SIZE,
    height: BADGE_SIZE,
    borderRadius: BADGE_SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    marginBottom: spacing.xl,
    // drop-shadow(0 20px 30px rgba(34, 197, 94, 0.3))
    ...Platform.select({
      ios: {
        shadowColor: colors.success.accent,
        shadowOffset: { width: 0, height: 20 },
        shadowOpacity: 0.3,
        shadowRadius: 30,
      },
      android: { elevation: 12 },
      default: {},
    }),
  },
  title: {
    ...typography.celebration,
    color: colors.text.primary,
    textAlign: 'center',
    paddingBottom: spacing.sm,
  },
  subtitle: {
    ...typography.subtitle,
    color: colors.text.secondary,
    textAlign: 'center',
    paddingBottom: spacing.xxxl,
  },

  receipt: {
    width: CARD_WIDTH,
    maxWidth: '100%',
    borderRadius: radius.balance,
    borderWidth: hairline,
    borderColor: colors.border.subtle,
    backgroundColor: colors.surface,
    overflow: 'hidden',
    marginBottom: spacing.xxl,
    // 0 4px 24px rgba(0, 0, 0, 0.06)
    ...Platform.select({
      ios: {
        shadowColor: colors.shadow,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.06,
        shadowRadius: 24,
      },
      android: { elevation: 4 },
      default: {},
    }),
  },
  receiptHeader: {
    borderTopLeftRadius: radius.summary,
    borderTopRightRadius: radius.summary,
    padding: 18,
    overflow: 'hidden',
  },
  receiptEyebrow: {
    ...typography.overlineLight,
    color: colors.text.onGradient,
    textAlign: 'center',
    opacity: 0.8,
  },
  receiptAmount: {
    ...typography.displayMedium,
    color: colors.text.onGradient,
    textAlign: 'center',
    paddingTop: spacing.xs,
  },
  receiptBody: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.section,
  },
  receiptRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing.md,
    borderBottomWidth: hairline,
    borderBottomColor: colors.border.row,
    paddingTop: 9,
    paddingBottom: 9.755,
  },
  receiptLabel: {
    ...typography.caption,
    color: colors.text.secondary,
  },
  receiptValue: {
    ...typography.captionMedium,
    color: colors.text.primary,
  },
  receiptTotal: {
    ...typography.captionBold,
    color: colors.success.accent,
  },

  cta: {
    width: CARD_WIDTH,
    maxWidth: '100%',
    height: CTA_HEIGHT,
  },
  backHome: {
    ...typography.subtitle,
    color: colors.text.secondary,
    textAlign: 'center',
    paddingTop: spacing.md,
  },
});
