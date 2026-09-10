import React, { useMemo, useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BrandGradient } from './BrandGradient';
import { CloseMarkIcon } from './icons/CloseMarkIcon';
import {
  RECHARGE_GST_PERCENT,
  rechargeOptions,
  type RechargeOption,
} from '../data/wallet';
import { colors, fontFamily, radius, spacing } from '../theme';

const CLOSE_SIZE = 16;
const TILE_GAP = 10;
const PAY_HEIGHT = 52;

/** "₹ 1,250" — this popup's own spacing, matching the Figma copy exactly. */
const rupeeAmount = (value: number) => `₹ ${Math.round(value).toLocaleString('en-IN')}`;

type RechargePopupProps = {
  visible: boolean;
  /** The rate the seeker is being warned they can no longer cover — Figma's "Minimum balance need to talk is ₹25". Omitted outside a live consultation. */
  minRequired?: number;
  onDismiss?: () => void;
  /** Fired with the chosen tile once "Pay Now" is pressed. */
  onPay: (option: RechargeOption) => void | Promise<void>;
  /** True while a previous onPay is still settling — disables the button and swaps its label. */
  loading?: boolean;
};

/**
 * The recharge tiers, what each pays out, and the payment breakdown — opened
 * from the low-balance banner's "Recharge" button.
 * Figma: node 180:148242 ("Low Balence"), the sheet at 180:151497.
 */
export function RechargePopup({
  visible,
  minRequired,
  onDismiss,
  onPay,
  loading = false,
}: RechargePopupProps) {
  const insets = useSafeAreaInsets();
  const [selected, setSelected] = useState<RechargeOption>(
    () => rechargeOptions.find(option => option.popular) ?? rechargeOptions[0],
  );

  const gst = useMemo(() => Math.round((selected.amount * RECHARGE_GST_PERCENT) / 100), [selected.amount]);
  const payable = selected.amount + gst;
  const credited = selected.amount + selected.bonus;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onDismiss}
      statusBarTranslucent
    >
      <View style={styles.stage}>
        <Pressable accessibilityLabel="Close recharge" style={styles.scrim} onPress={onDismiss} />

        <View style={[styles.sheet, { paddingBottom: spacing.lg + insets.bottom }]}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Dismiss"
            onPress={onDismiss}
            hitSlop={spacing.sm}
            style={({ pressed }) => [styles.close, pressed && styles.pressed]}
          >
            <CloseMarkIcon size={CLOSE_SIZE} color={colors.text.secondary} />
          </Pressable>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
            <View style={styles.titleRow}>
              <Text style={styles.title}>Recharge Now</Text>
              <View style={styles.titleUnderline} />
            </View>

            <Text style={styles.subtitle}>Don't let low balance interrupt your chat</Text>

            {minRequired !== undefined && minRequired > 0 && (
              <Text style={styles.minWarning}>
                Minimum balance need to talk is{' '}
                <Text style={styles.minWarningStrong}>{rupeeAmount(minRequired)}</Text>
              </Text>
            )}

            <Text style={styles.sectionLabel}>Choose Recharge Amount</Text>

            <View style={styles.grid}>
              {rechargeOptions.map(option => {
                const isSelected = option.amount === selected.amount;

                return (
                  <Pressable
                    key={option.amount}
                    accessibilityRole="radio"
                    accessibilityState={{ selected: isSelected }}
                    accessibilityLabel={`₹${option.amount}, get ₹${option.bonus} extra`}
                    onPress={() => setSelected(option)}
                    style={styles.tileSlot}
                  >
                    {option.popular && (
                      <View style={styles.popularBadge}>
                        <Text style={styles.popularLabel}>★ Most Popular</Text>
                      </View>
                    )}
                    <View style={[styles.tile, isSelected && styles.tileSelected]}>
                      <Text style={styles.tileAmount}>{rupeeAmount(option.amount)}</Text>
                      <View style={styles.bonusStrip}>
                        <Text style={styles.bonusLabel}>Get {rupeeAmount(option.bonus)} Extra</Text>
                      </View>
                    </View>
                  </Pressable>
                );
              })}
            </View>

            <View style={styles.congrats}>
              <View style={styles.congratsBar} />
              <View style={styles.congratsCopy}>
                <Text style={styles.congratsTitle}>Congratulations 🎉</Text>
                <Text style={styles.congratsBody}>
                  You'll get <Text style={styles.congratsAmount}>{rupeeAmount(credited)}</Text> on the recharge of{' '}
                  <Text style={styles.congratsAmount}>{rupeeAmount(selected.amount)}</Text>
                </Text>
              </View>
            </View>

            <View style={styles.paymentCard}>
              <Text style={styles.paymentTitle}>Payment Details</Text>

              <View style={styles.paymentRow}>
                <Text style={styles.paymentLabel}>Recharge Amount</Text>
                <Text style={styles.paymentValue}>{rupeeAmount(selected.amount)}</Text>
              </View>
              <View style={styles.paymentRow}>
                <Text style={styles.paymentLabel}>GST ({RECHARGE_GST_PERCENT}%)</Text>
                <Text style={styles.paymentValue}>{rupeeAmount(gst)}</Text>
              </View>

              <View style={styles.paymentDivider} />

              <View style={styles.paymentRow}>
                <Text style={styles.totalLabel}>Total Amount</Text>
                <Text style={styles.totalValue}>{rupeeAmount(payable)}</Text>
              </View>
            </View>

            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Pay Now"
              accessibilityState={{ disabled: loading }}
              disabled={loading}
              onPress={() => onPay(selected)}
              style={({ pressed }) => [styles.payButton, pressed && styles.pressed]}
            >
              <BrandGradient radius={radius.action} />
              <Text style={styles.payLabel}>{loading ? 'Processing…' : 'Pay Now'}</Text>
            </Pressable>
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
    maxHeight: '88%',
    borderTopLeftRadius: radius.sheet,
    borderTopRightRadius: radius.sheet,
    backgroundColor: colors.surface,
  },
  content: {
    paddingTop: spacing.xl,
    paddingHorizontal: spacing.xl,
  },
  titleRow: {
    alignItems: 'center',
  },
  title: {
    fontFamily: fontFamily.bold,
    fontSize: 18,
    color: colors.text.primary,
  },
  titleUnderline: {
    marginTop: 4,
    width: 118,
    height: 1,
    backgroundColor: colors.text.primary,
  },
  close: {
    position: 'absolute',
    zIndex: 1,
    right: spacing.lg,
    top: spacing.lg,
  },
  subtitle: {
    fontFamily: fontFamily.medium,
    fontSize: 14,
    color: colors.text.primary,
    textAlign: 'center',
    paddingTop: spacing.lg,
  },
  minWarning: {
    fontFamily: fontFamily.regular,
    fontSize: 14,
    color: colors.status.debit,
    textAlign: 'center',
    paddingTop: spacing.sm,
  },
  minWarningStrong: {
    fontFamily: fontFamily.bold,
  },
  sectionLabel: {
    fontFamily: fontFamily.medium,
    fontSize: 14,
    color: colors.text.primary,
    textAlign: 'center',
    paddingTop: spacing.xl,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: TILE_GAP,
    paddingTop: spacing.md,
  },
  tileSlot: {
    width: '31.5%',
    flexGrow: 1,
    paddingTop: 8,
  },
  popularBadge: {
    position: 'absolute',
    top: 0,
    alignSelf: 'center',
    zIndex: 1,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.pill,
    backgroundColor: colors.text.primary,
  },
  popularLabel: {
    fontFamily: fontFamily.semiBold,
    fontSize: 8,
    color: colors.recharge.selected,
  },
  tile: {
    height: 63,
    borderRadius: radius.action,
    borderWidth: 1,
    borderColor: colors.border.subtle,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  tileSelected: {
    borderColor: colors.recharge.selected,
    backgroundColor: colors.recharge.selectedTintTo,
  },
  tileAmount: {
    fontFamily: fontFamily.bold,
    fontSize: 16,
    color: colors.text.primary,
  },
  bonusStrip: {
    position: 'absolute',
    left: 1,
    right: 1,
    bottom: 1,
    height: 20,
    borderBottomLeftRadius: radius.action - 1,
    borderBottomRightRadius: radius.action - 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.recharge.bonusStripVia,
  },
  bonusLabel: {
    fontFamily: fontFamily.regular,
    fontSize: 10,
    color: colors.text.primary,
  },
  congrats: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.xl,
    padding: spacing.md,
    borderRadius: radius.field,
    backgroundColor: colors.status.positiveTint,
    borderWidth: 1,
    borderColor: colors.status.positiveTintBorder,
    overflow: 'hidden',
  },
  congratsBar: {
    width: 4,
    borderRadius: 2,
    backgroundColor: colors.status.positive,
  },
  congratsCopy: {
    flex: 1,
  },
  congratsTitle: {
    fontFamily: fontFamily.bold,
    fontSize: 14,
    color: colors.text.primary,
  },
  congratsBody: {
    fontFamily: fontFamily.regular,
    fontSize: 14,
    color: colors.text.primary,
    paddingTop: 4,
  },
  congratsAmount: {
    fontFamily: fontFamily.semiBold,
    fontSize: 16,
    color: colors.status.positive,
  },
  paymentCard: {
    marginTop: spacing.xl,
    padding: spacing.lg,
    borderRadius: radius.field,
    borderWidth: 1,
    borderColor: colors.border.subtle,
    backgroundColor: colors.surface,
  },
  paymentTitle: {
    fontFamily: fontFamily.medium,
    fontSize: 14,
    color: colors.text.primary,
    paddingBottom: spacing.md,
  },
  paymentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  paymentLabel: {
    fontFamily: fontFamily.regular,
    fontSize: 14,
    color: colors.text.primary,
  },
  paymentValue: {
    fontFamily: fontFamily.semiBold,
    fontSize: 14,
    color: colors.text.primary,
  },
  paymentDivider: {
    marginVertical: spacing.sm,
    borderTopWidth: 1,
    borderStyle: 'dashed',
    borderColor: colors.border.subtle,
  },
  totalLabel: {
    fontFamily: fontFamily.regular,
    fontSize: 14,
    color: colors.text.primary,
  },
  totalValue: {
    fontFamily: fontFamily.bold,
    fontSize: 16,
    color: colors.text.primary,
  },
  payButton: {
    height: PAY_HEIGHT,
    marginTop: spacing.xl,
    borderRadius: radius.action,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  payLabel: {
    fontFamily: fontFamily.medium,
    fontSize: 16,
    color: colors.text.inverse,
  },
  pressed: {
    opacity: 0.8,
  },
});
