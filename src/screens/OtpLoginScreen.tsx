import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BackButton } from '../components/BackButton';
import { OrDivider } from '../components/OrDivider';
import { OtpInput } from '../components/OtpInput';
import { PrimaryButton } from '../components/PrimaryButton';
import { SocialAuthButtons } from '../components/SocialAuthButtons';
import { CheckIcon } from '../components/icons/CheckIcon';
import { SmartphoneLargeIcon } from '../components/icons/SmartphoneLargeIcon';
import {
  colors,
  designFrame,
  hairline,
  radius,
  spacing,
  typography,
  withOpacity,
} from '../theme';

/** Top padding Figma drew, measured from the top of the status bar. */
const DESIGN_PADDING_TOP = 52;
const OTP_LENGTH = 6;
const DIAL_CODE = '+91';
const FIELD_HEIGHT = 49.992;
const BADGE_SIZE = 51.998;
const SENT_BADGE_SIZE = 19.999;

type OtpLoginScreenProps = {
  onBack?: () => void;
  /** Called once six digits have been entered and confirmed. */
  onVerified?: (phoneNumber: string) => void;
  onGooglePress?: () => void;
  onApplePress?: () => void;
};

/**
 * Signs a user in with a one-time password.
 *
 * The screen has two designed states: before the code is requested the OTP
 * card is dimmed and inert (Figma node 180:88483), and after "Send OTP" it
 * lights up with a yellow outline and live actions (node 180:88571).
 */
export function OtpLoginScreen({
  onBack,
  onVerified,
  onGooglePress,
  onApplePress,
}: OtpLoginScreenProps) {
  const insets = useSafeAreaInsets();
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);

  const fullNumber = `${DIAL_CODE} ${phoneNumber}`;

  const handleSendOtp = () => {
    setOtpSent(true);
  };

  const handleResend = () => {
    setOtp('');
  };

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
            backgroundColor={colors.success.tint}
            iconColor={colors.success.accent}
          />

          <View style={styles.headerRow}>
            <View style={styles.headerBadge}>
              <SmartphoneLargeIcon color={colors.border.strong} />
            </View>
            <View>
              <Text style={styles.headerTitle}>Mobile Verification</Text>
              <Text style={styles.headerSubtitle}>Secure login with OTP</Text>
            </View>
          </View>
        </View>

        <ScrollView
          style={styles.body}
          contentContainerStyle={[
            styles.bodyContent,
            { paddingBottom: spacing.xxxl + insets.bottom },
          ]}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.card}>
            <Text style={styles.cardLabel}>Mobile Number</Text>

            <View style={styles.numberRow}>
              <View style={styles.countryPill}>
                <Text style={styles.flag}>🇮🇳</Text>
                <Text style={styles.dialCode}>{DIAL_CODE}</Text>
              </View>
              <TextInput
                value={phoneNumber}
                onChangeText={text => setPhoneNumber(text.replace(/\D/g, ''))}
                placeholder="98765 43210"
                placeholderTextColor={colors.text.placeholder}
                keyboardType="phone-pad"
                textContentType="telephoneNumber"
                maxLength={10}
                accessibilityLabel="Mobile number"
                style={styles.phoneInput}
              />
            </View>

            {otpSent && (
              <View style={styles.sentRow}>
                <View style={styles.sentBadge}>
                  <CheckIcon color={colors.border.strong} />
                </View>
                <Text style={styles.sentLabel}>OTP sent to {fullNumber}</Text>
              </View>
            )}

            <PrimaryButton
              label={otpSent ? 'OTP Sent ✓' : 'Send OTP'}
              labelStyle={typography.buttonSmall}
              onPress={handleSendOtp}
              style={styles.cardButton}
            />
          </View>

          <View
            style={[
              styles.card,
              styles.otpCard,
              otpSent ? styles.otpCardActive : styles.otpCardInactive,
            ]}
          >
            <Text style={styles.cardLabel}>Enter OTP</Text>
            <Text style={styles.cardHint}>
              {otpSent
                ? `${OTP_LENGTH}-digit code sent to ${fullNumber}`
                : 'Send OTP first to enable this section'}
            </Text>

            <OtpInput
              value={otp}
              onChange={setOtp}
              length={OTP_LENGTH}
              disabled={!otpSent}
              style={styles.otpRow}
            />

            <Text style={styles.resend}>
              Didn't receive?{' '}
              <Text
                accessibilityRole="link"
                onPress={otpSent ? handleResend : undefined}
                style={[
                  styles.resendAction,
                  !otpSent && styles.resendActionDisabled,
                ]}
              >
                Resend OTP
              </Text>
            </Text>

            <PrimaryButton
              label="Verify & Continue"
              labelStyle={typography.buttonSmall}
              disabled={!otpSent}
              onPress={() => onVerified?.(fullNumber)}
            />
          </View>

          <OrDivider style={styles.divider} />

          <SocialAuthButtons
            style={styles.social}
            onGooglePress={onGooglePress}
            onApplePress={onApplePress}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  header: {
    backgroundColor: colors.brandYellow,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.rowGap,
    paddingTop: spacing.lg,
  },
  headerBadge: {
    width: BADGE_SIZE,
    height: BADGE_SIZE,
    borderRadius: radius.iconLarge,
    backgroundColor: withOpacity(colors.surface, 0.07),
    alignItems: 'center',
    justifyContent: 'center',
    // 0 4px 16px rgba(255, 78, 0, 0.3)
    ...Platform.select({
      ios: {
        shadowColor: colors.glow,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 16,
      },
      android: { elevation: 6 },
      default: {},
    }),
  },
  headerTitle: {
    ...typography.headingSmall,
    color: colors.text.onYellowStrong,
  },
  headerSubtitle: {
    ...typography.footnote,
    color: colors.text.onYellowMuted,
    paddingTop: spacing.xs,
  },
  body: {
    flex: 1,
  },
  bodyContent: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    borderWidth: hairline,
    borderColor: colors.border.subtle,
    padding: 20.755,
    // drop-shadow(0 2px 6px rgba(0, 0, 0, 0.04))
    ...Platform.select({
      ios: {
        shadowColor: colors.shadow,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04,
        shadowRadius: 6,
      },
      android: { elevation: 2 },
      default: {},
    }),
  },
  cardLabel: {
    ...typography.label,
    color: colors.text.primary,
  },
  numberRow: {
    flexDirection: 'row',
    gap: 10,
    paddingTop: spacing.md,
  },
  countryPill: {
    height: FIELD_HEIGHT,
    borderRadius: radius.field,
    borderWidth: hairline,
    borderColor: colors.border.subtle,
    backgroundColor: colors.surfaceSubtle,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14.755,
  },
  flag: {
    ...typography.flag,
    color: colors.text.onYellow,
  },
  dialCode: {
    ...typography.countryCode,
    color: colors.text.primary,
  },
  phoneInput: {
    ...typography.input,
    flex: 1,
    height: FIELD_HEIGHT,
    borderRadius: radius.field,
    borderWidth: hairline,
    borderColor: colors.border.subtle,
    backgroundColor: colors.surface,
    color: colors.text.primary,
    paddingLeft: 16.755,
    paddingRight: hairline,
    paddingVertical: 0,
  },
  sentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingTop: 10,
  },
  sentBadge: {
    width: SENT_BADGE_SIZE,
    height: SENT_BADGE_SIZE,
    borderRadius: SENT_BADGE_SIZE / 2,
    backgroundColor: colors.brandYellow,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sentLabel: {
    ...typography.captionStrong,
    color: colors.text.onYellow,
  },
  cardButton: {
    marginTop: spacing.rowGap,
  },
  otpCard: {
    marginTop: spacing.section,
  },
  otpCardActive: {
    borderColor: colors.border.active,
  },
  otpCardInactive: {
    opacity: 0.55,
  },
  cardHint: {
    ...typography.caption,
    color: colors.text.secondary,
    paddingTop: 6,
  },
  otpRow: {
    paddingTop: spacing.section,
  },
  resend: {
    ...typography.footnote,
    color: colors.text.secondary,
    textAlign: 'center',
    paddingVertical: spacing.section,
  },
  resendAction: {
    ...typography.footnoteStrong,
    color: colors.border.active,
  },
  resendActionDisabled: {
    color: colors.text.inactive,
  },
  divider: {
    marginTop: spacing.section,
  },
  social: {
    marginTop: spacing.section,
  },
});
