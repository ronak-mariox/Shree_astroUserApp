import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BackButton } from '../components/BackButton';
import { PrimaryButton } from '../components/PrimaryButton';
import {
  amountLimits as defaultAmountLimits,
  quickSelectAmounts,
} from '../data/wallet';
import { useApi } from '../hooks/useApi';
import { fetchSettings, fetchWallet, rupees } from '../services/api';
import { validateAmount } from '../utils/validation';
import {
  colors,
  designFrame,
  hairline,
  radius,
  spacing,
  typography,
} from '../theme';

/** Top padding Figma drew, measured from the top of the status bar. */
const DESIGN_PADDING_TOP = 56;
const AMOUNT_FIELD_WIDTH = 179.993;
const AMOUNT_FIELD_HEIGHT = 59.998;
const CHIP_HEIGHT = 43.998;
const CTA_HEIGHT = 53.992;

type AddMoneyScreenProps = {
  onBack?: () => void;
  onProceed?: (amount: number) => void;
  /** Pre-fills the field when arriving from a Quick Add chip. */
  initialAmount?: number;
};

/**
 * Choose how much to top the wallet up by. Figma: node 180:163233.
 */
export function AddMoneyScreen({
  onBack,
  onProceed,
  initialAmount = 200,
}: AddMoneyScreenProps) {
  const insets = useSafeAreaInsets();
  const [amount, setAmount] = useState(String(initialAmount));

  const wallet = useApi(() => fetchWallet(), []);
  /** The admin-configurable real limits; the fixture's values hold until these load. */
  const settings = useApi(() => fetchSettings(), []);
  const amountLimits = {
    min: settings.data?.minRecharge ?? defaultAmountLimits.min,
    max: settings.data?.maxRecharge ?? defaultAmountLimits.max,
  };

  const numericAmount = Number(amount) || 0;
  const amountError = validateAmount(numericAmount, amountLimits);

  return (
    <View style={styles.screen}>
      <StatusBar barStyle="dark-content" />

      <KeyboardAvoidingView
        style={styles.screen}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View
          style={[
            styles.header,
            {
              paddingTop:
                insets.top + (DESIGN_PADDING_TOP - designFrame.statusBarHeight),
            },
          ]}
        >
          <BackButton
            onPress={onBack}
            backgroundColor={colors.glass.dim}
            iconColor={colors.border.strong}
          />
          <View>
            <Text style={styles.title}>Add Money</Text>
            <Text style={styles.subtitle}>
              Current Balance: {rupees(wallet.data?.balance ?? 0)}
            </Text>
          </View>
        </View>

        <ScrollView
          contentContainerStyle={[
            styles.body,
            { paddingBottom: spacing.xl + insets.bottom },
          ]}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.amountCard}>
            <Text style={styles.amountLabel}>Enter Amount</Text>

            <View style={styles.amountRow}>
              <Text style={styles.rupee}>₹</Text>
              <TextInput
                value={amount}
                onChangeText={text => setAmount(text.replace(/\D/g, ''))}
                keyboardType="number-pad"
                accessibilityLabel="Amount to add"
                style={styles.amountInput}
              />
            </View>

            <View style={styles.rule} />

            {amountError === undefined ? (
              <Text style={styles.limits}>
                Min ₹{amountLimits.min} · Max ₹
                {amountLimits.max.toLocaleString('en-IN')}
              </Text>
            ) : (
              <Text style={styles.limitsInvalid}>{amountError}</Text>
            )}
          </View>

          <Text style={styles.quickSelectLabel}>Quick Select</Text>
          <View style={styles.quickSelect}>
            {quickSelectAmounts.map(option => {
              const selected = option.value === numericAmount;

              return (
                <Pressable
                  key={option.value}
                  accessibilityRole="button"
                  accessibilityState={{ selected }}
                  onPress={() => setAmount(String(option.value))}
                  style={[
                    styles.chip,
                    selected ? styles.chipSelected : styles.chipIdle,
                  ]}
                >
                  <Text
                    style={selected ? styles.chipLabelOn : styles.chipLabel}
                  >
                    {option.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <View style={styles.notice}>
            <Text style={styles.noticeGlyph}>💡</Text>
            <View style={styles.noticeCopy}>
              <Text style={styles.noticeTitle}>
                Secure Payments
              </Text>
              <Text style={styles.noticeDetail}>
                UPI, Credit/Debit Cards, Net Banking accepted
              </Text>
            </View>
          </View>

          <PrimaryButton
            label={`Proceed to Pay ₹${numericAmount}`}
            style={styles.cta}
            disabled={amountError !== undefined}
            onPress={() => {
              if (amountError === undefined) {
                onProceed?.(numericAmount);
              }
            }}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.canvas,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.brandYellow,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  title: {
    ...typography.pageTitleSmall,
    color: colors.text.onYellow,
  },
  subtitle: {
    ...typography.footnote,
    color: colors.text.onYellowMuted,
  },
  body: {
    padding: spacing.xl,
  },

  amountCard: {
    borderRadius: radius.card,
    borderWidth: hairline,
    borderColor: colors.border.subtle,
    backgroundColor: colors.surface,
    padding: 24.755,
    // drop-shadow(0 2px 6px rgba(0, 0, 0, 0.05))
    ...Platform.select({
      ios: {
        shadowColor: colors.shadow,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 6,
      },
      android: { elevation: 2 },
      default: {},
    }),
  },
  amountLabel: {
    ...typography.footnote,
    color: colors.text.secondary,
    textAlign: 'center',
  },
  amountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingTop: spacing.md,
  },
  rupee: {
    ...typography.displaySmall,
    color: colors.text.primary,
    textAlign: 'center',
  },
  amountInput: {
    ...typography.displayLarge,
    width: AMOUNT_FIELD_WIDTH,
    height: AMOUNT_FIELD_HEIGHT,
    color: colors.text.primary,
    textAlign: 'center',
    padding: 0,
  },
  rule: {
    height: 1.994,
    borderRadius: 1,
    backgroundColor: colors.border.rule,
    marginTop: spacing.sm,
  },
  limits: {
    ...typography.caption,
    color: colors.text.muted,
    textAlign: 'center',
    paddingTop: 10,
  },
  limitsInvalid: {
    ...typography.caption,
    color: colors.status.debit,
    textAlign: 'center',
    paddingTop: 10,
  },

  quickSelectLabel: {
    ...typography.detailValue,
    color: colors.text.secondary,
    paddingTop: spacing.lg,
  },
  quickSelect: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    paddingTop: spacing.md,
  },
  chip: {
    // Three per row, sharing the two 10pt gutters.
    width: '31.4%',
    flexGrow: 1,
    height: CHIP_HEIGHT,
    borderRadius: radius.field,
    borderWidth: hairline,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipIdle: {
    borderColor: colors.border.subtle,
  },
  chipSelected: {
    borderColor: colors.success.accent,
  },
  chipLabel: {
    ...typography.subtitle,
    color: colors.text.primary,
    textAlign: 'center',
  },
  chipLabelOn: {
    ...typography.label,
    color: colors.success.accent,
    textAlign: 'center',
  },

  notice: {
    flexDirection: 'row',
    gap: 10,
    borderRadius: radius.input,
    borderWidth: hairline,
    borderColor: colors.status.infoTintBorder,
    backgroundColor: colors.status.infoTint,
    paddingHorizontal: 16.755,
    paddingVertical: 14.755,
    marginVertical: spacing.xl,
  },
  noticeGlyph: {
    ...typography.symbolMedium,
    color: colors.text.onYellow,
  },
  noticeCopy: {
    flex: 1,
  },
  noticeTitle: {
    ...typography.detailValue,
    color: colors.text.primary,
  },
  noticeDetail: {
    ...typography.caption,
    color: colors.text.secondary,
    paddingTop: 3,
  },

  cta: {
    height: CTA_HEIGHT,
  },
});
