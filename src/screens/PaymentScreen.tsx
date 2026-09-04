import React, { useState } from 'react';
import {
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BackButton } from '../components/BackButton';
import { BrandGradient } from '../components/BrandGradient';
import { ShieldIcon } from '../components/icons/ShieldIcon';
import { paymentMethods, type PaymentMethodId } from '../data/wallet';
import {
  colors,
  designFrame,
  hairline,
  radius,
  spacing,
  stroke,
  typography,
} from '../theme';

/** Top padding Figma drew, measured from the top of the status bar. */
const DESIGN_PADDING_TOP = 56;
const TILE_SIZE = 43.998;
const RADIO_SIZE = 19.999;
const RADIO_DOT = 9.994;
const CTA_HEIGHT = 53.992;
const SSL_ICON = 13.994;
const CTA_ICON = 17.993;

type PaymentScreenProps = {
  amount: number;
  onBack?: () => void;
  onPay?: (method: PaymentMethodId) => void;
};

/**
 * Checkout: confirm the amount and pick how to pay it.
 * Figma: node 180:163307.
 */
export function PaymentScreen({ amount, onBack, onPay }: PaymentScreenProps) {
  const insets = useSafeAreaInsets();
  const [method, setMethod] = useState<PaymentMethodId>('upi');

  return (
    <View style={styles.screen}>
      <StatusBar barStyle="dark-content" />

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
          <Text style={styles.title}>Payment</Text>
          <Text style={styles.subtitle}>Secure checkout</Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.body,
          { paddingBottom: spacing.lg + insets.bottom },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.amountCard}>
          <BrandGradient
            radius={radius.summary}
            angle="toRight"
            from={colors.gradient.summaryFrom}
            to={colors.gradient.summaryTo}
          />
          <Text style={styles.amountLabel}>AMOUNT TO PAY</Text>
          <Text style={styles.amount}>₹{amount}</Text>
          <Text style={styles.amountFor}>Shree Astro Wallet Top-up</Text>
        </View>

        <Text style={styles.sectionTitle}>Payment Method</Text>

        <View style={styles.methods}>
          {paymentMethods.map(option => {
            const selected = option.id === method;

            return (
              <Pressable
                key={option.id}
                accessibilityRole="radio"
                accessibilityState={{ selected }}
                accessibilityLabel={`${option.name}. ${option.detail}`}
                onPress={() => setMethod(option.id)}
                style={[
                  styles.method,
                  selected ? styles.methodSelected : styles.methodIdle,
                ]}
              >
                <View
                  style={[
                    styles.methodTile,
                    selected ? styles.tileSelected : styles.tileIdle,
                  ]}
                >
                  <Text style={styles.methodGlyph}>{option.glyph}</Text>
                </View>

                <View style={styles.methodCopy}>
                  <Text style={styles.methodName}>{option.name}</Text>
                  <Text style={styles.methodDetail}>{option.detail}</Text>
                </View>

                <View
                  style={[
                    styles.radio,
                    selected ? styles.radioOn : styles.radioOff,
                  ]}
                >
                  {selected && <View style={styles.radioDot} />}
                </View>
              </Pressable>
            );
          })}
        </View>

        <View style={styles.ssl}>
          <ShieldIcon size={SSL_ICON} color={colors.success.accent} />
          <Text style={styles.sslLabel}>
            256-bit SSL encryption · PCI DSS compliant
          </Text>
        </View>

        <Pressable
          accessibilityRole="button"
          onPress={() => onPay?.(method)}
          style={({ pressed }) => [styles.cta, pressed && styles.pressed]}
        >
          <BrandGradient radius={radius.button} />
          <ShieldIcon size={CTA_ICON} color={colors.text.inverse} />
          <Text style={styles.ctaLabel}>Pay ₹{amount} Securely</Text>
        </Pressable>
      </ScrollView>
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
    paddingBottom: spacing.xl,
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
    padding: spacing.lg,
  },

  amountCard: {
    borderRadius: radius.summary,
    padding: 18,
    overflow: 'hidden',
  },
  amountLabel: {
    ...typography.overlineLight,
    color: colors.text.onGradientFaint,
    textAlign: 'center',
  },
  amount: {
    ...typography.displayLarge,
    color: colors.text.inverse,
    textAlign: 'center',
    paddingTop: 6,
  },
  amountFor: {
    ...typography.caption,
    color: colors.text.onGradientMuted,
    textAlign: 'center',
    paddingTop: spacing.xs,
  },

  sectionTitle: {
    ...typography.label,
    color: colors.text.primary,
    paddingTop: spacing.lg,
  },
  methods: {
    paddingTop: spacing.md,
    gap: 10,
  },
  method: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    borderRadius: radius.input,
    borderWidth: hairline,
    backgroundColor: colors.surface,
    padding: 14.755,
  },
  methodIdle: {
    borderColor: colors.border.subtle,
  },
  methodSelected: {
    borderColor: colors.status.positive,
  },
  methodTile: {
    width: TILE_SIZE,
    height: TILE_SIZE,
    borderRadius: radius.field,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tileIdle: {
    backgroundColor: colors.surfaceMuted,
  },
  tileSelected: {
    backgroundColor: colors.status.infoTint,
  },
  methodGlyph: {
    ...typography.symbolEmoji,
    color: colors.text.onYellow,
  },
  methodCopy: {
    flex: 1,
  },
  methodName: {
    ...typography.listTitle,
    color: colors.text.primary,
  },
  methodDetail: {
    ...typography.caption,
    color: colors.text.muted,
  },
  radio: {
    width: RADIO_SIZE,
    height: RADIO_SIZE,
    borderRadius: radius.badge,
    borderWidth: stroke,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioOn: {
    borderColor: colors.border.strong,
  },
  radioOff: {
    borderColor: colors.border.subtle,
  },
  radioDot: {
    width: RADIO_DOT,
    height: RADIO_DOT,
    borderRadius: RADIO_DOT / 2,
    backgroundColor: colors.border.strong,
  },

  ssl: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingTop: spacing.lg,
  },
  sslLabel: {
    ...typography.caption,
    color: colors.text.secondary,
  },

  cta: {
    height: CTA_HEIGHT,
    borderRadius: radius.button,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    marginTop: spacing.lg,
    overflow: 'hidden',
  },
  pressed: {
    opacity: 0.9,
  },
  ctaLabel: {
    ...typography.button,
    color: colors.text.inverse,
    textAlign: 'center',
  },
});
