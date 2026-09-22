import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import {
  type ConsultationChoice,
  type PackageQuote,
  canAfford,
  isDiscounted,
  shortfallFor,
} from '../data/consultPackages';
import { rupees } from '../services/api';
import { colors, fontFamily, radius, spacing, typography } from '../theme';

type ConsultationTypePickerProps = {
  /** 'chat' or 'call' — only changes the wording; the quotes are already priced for it. */
  channel: 'chat' | 'call';
  ratePerMinute: number;
  /** Every package priced at this astrologer's real rate (server quotes — see data/consultPackages.ts's resolveQuotes). */
  quotes: PackageQuote[];
  /** The wallet balance, when known — marks packages it can't cover. */
  walletBalance?: number;
  value: ConsultationChoice;
  onChange: (choice: ConsultationChoice) => void;
};

/**
 * "Choose consultation type" on the intake form: per-minute (the default,
 * unchanged behaviour) or a fixed-length package, each priced at the
 * astrologer's own rate, with the selected total spelled out underneath.
 */
export function ConsultationTypePicker({
  channel,
  ratePerMinute,
  quotes,
  walletBalance,
  value,
  onChange,
}: ConsultationTypePickerProps) {
  const selectedQuote = value.mode === 'package' ? quotes.find(quote => quote.minutes === value.minutes) : undefined;
  const noun = channel === 'call' ? 'call' : 'chat';

  return (
    <View style={styles.section}>
      <Text style={styles.heading}>Choose consultation type</Text>

      <Pressable
        accessibilityRole="radio"
        accessibilityState={{ selected: value.mode === 'per_minute' }}
        accessibilityLabel={`Per-minute, ${rupees(ratePerMinute)} per minute`}
        onPress={() => onChange({ mode: 'per_minute' })}
        style={({ pressed }) => [
          styles.perMinute,
          value.mode === 'per_minute' && styles.selected,
          pressed && styles.pressed,
        ]}
      >
        <View style={[styles.radio, value.mode === 'per_minute' && styles.radioOn]} />
        <View style={styles.perMinuteText}>
          <Text style={styles.optionTitle}>Per-minute</Text>
          <Text style={styles.optionMeta}>Pay as you go · {rupees(ratePerMinute)}/min</Text>
        </View>
      </Pressable>

      <Text style={styles.subheading}>Packages</Text>
      <View style={styles.grid}>
        {quotes.map(quote => {
          const selected = value.mode === 'package' && value.minutes === quote.minutes;
          const affordable = quote.affordable ?? canAfford(quote.price, walletBalance);
          const discounted = isDiscounted(quote);

          return (
            <Pressable
              key={quote.minutes}
              accessibilityRole="radio"
              accessibilityState={{ selected }}
              accessibilityLabel={
                discounted
                  ? `${quote.minutes} min package, ${rupees(quote.price)}, was ${rupees(quote.originalPrice)}, ${quote.discountPercent}% off`
                  : `${quote.minutes} min package, ${rupees(quote.price)}`
              }
              onPress={() => onChange({ mode: 'package', minutes: quote.minutes, price: quote.price })}
              style={({ pressed }) => [styles.tile, selected && styles.selected, pressed && styles.pressed]}
            >
              {discounted && (
                <View style={styles.offBadge}>
                  <Text style={styles.offLabel}>{quote.discountPercent}% OFF</Text>
                </View>
              )}
              <Text style={styles.tileMinutes}>{quote.minutes} min</Text>
              <View style={styles.priceRow}>
                {discounted && <Text style={styles.tileOriginal}>{rupees(quote.originalPrice)}</Text>}
                <Text style={styles.tilePrice}>{rupees(quote.price)}</Text>
              </View>
              {!affordable && <Text style={styles.tileShort}>Low balance</Text>}
            </Pressable>
          );
        })}
      </View>

      <View style={styles.summary}>
        {selectedQuote ? (
          <>
            <Text style={styles.summaryLine}>
              {selectedQuote.minutes}-minute {noun} package: {selectedQuote.minutes} × {rupees(ratePerMinute)}
              {isDiscounted(selectedQuote) ? ` = ${rupees(selectedQuote.originalPrice)}` : ''}
            </Text>
            {isDiscounted(selectedQuote) && (
              <Text style={styles.summarySaving}>
                {selectedQuote.discountPercent}% package discount: −
                {rupees((selectedQuote.originalPrice ?? selectedQuote.price) - selectedQuote.price)}
              </Text>
            )}
            <Text accessibilityLabel={`Total ${rupees(selectedQuote.price)}`} style={styles.summaryTotal}>
              Total {rupees(selectedQuote.price)}
            </Text>
            <Text style={styles.summaryNote}>Charged once when the astrologer accepts. Nothing is charged per minute.</Text>
            {walletBalance !== undefined && !canAfford(selectedQuote.price, walletBalance) && (
              <Text style={styles.summaryShort}>
                You need {rupees(shortfallFor(selectedQuote.price, walletBalance))} more in your wallet.
              </Text>
            )}
          </>
        ) : (
          <Text style={styles.summaryLine}>
            {rupees(ratePerMinute)}/min, charged each minute while you {noun}.
          </Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    gap: spacing.md,
  },
  heading: {
    ...typography.intakeLabel,
    color: colors.text.intakeLabel,
  },
  subheading: {
    ...typography.caption,
    color: colors.text.intakeLabel,
  },
  perMinute: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    minHeight: 56,
    paddingHorizontal: spacing.section,
    borderRadius: radius.tag,
    borderWidth: 1,
    borderColor: colors.border.intakeField,
    backgroundColor: colors.surface,
  },
  perMinuteText: {
    flex: 1,
  },
  radio: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 1.5,
    borderColor: colors.border.intakeField,
  },
  radioOn: {
    borderWidth: 5,
    borderColor: colors.border.intakeSelected,
  },
  optionTitle: {
    ...typography.intakeOption,
    color: colors.text.onYellow,
  },
  optionMeta: {
    ...typography.caption,
    color: colors.text.intakeLabel,
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
  selected: {
    borderWidth: 2,
    borderColor: colors.border.intakeSelected,
    backgroundColor: colors.surfaceBlush,
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
  /** The full price, struck through, beside the discounted one. */
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
  summarySaving: {
    ...typography.caption,
    color: colors.status.positive,
  },
  tileShort: {
    ...typography.caption,
    color: colors.status.debit,
  },
  summary: {
    gap: spacing.xs,
    padding: spacing.md,
    borderRadius: radius.tag,
    backgroundColor: colors.surfaceMuted,
  },
  summaryLine: {
    ...typography.caption,
    color: colors.text.onYellow,
  },
  summaryTotal: {
    fontFamily: fontFamily.bold,
    fontSize: 18,
    color: colors.text.onYellow,
  },
  summaryNote: {
    ...typography.caption,
    color: colors.text.intakeLabel,
  },
  summaryShort: {
    ...typography.caption,
    color: colors.status.debit,
  },
  pressed: {
    opacity: 0.8,
  },
});
