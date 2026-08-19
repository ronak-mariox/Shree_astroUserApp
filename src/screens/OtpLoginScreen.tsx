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
import { useOtpLogin } from '../hooks/useOtpLogin';
import { loginPhoneOf, type AuthSession } from '../services/auth';
import { validateCode, validatePhone } from '../utils/validation';
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
  /** Handed the session once the code checks out and the user is signed in. */
  onVerified?: (session: AuthSession) => void;
  /** Offered when the number turns out to have no account behind it. */
  onRegister?: () => void;
  onGooglePress?: () => void;
  onApplePress?: () => void;
};

/**
 * Signs a user in with a one-time password.
 *
 * The screen has two designed states: before the code is requested the OTP
 * card is dimmed and inert (Figma node 180:88483), and after "Send OTP" it
 * lights up with a yellow outline and live actions (node 180:88571). Which one
 * is showing is now the server's answer — the card opens when a code has
 * actually been sent, not when the button was pressed.
 *
 * The flow itself is in {@link useOtpLogin}, shared with the email screen.
 */
export function OtpLoginScreen({
  onBack,
  onVerified,
  onRegister,
  onGooglePress,
  onApplePress,
}: OtpLoginScreenProps) {
  const insets = useSafeAreaInsets();
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otp, setOtp] = useState('');
  const login = useOtpLogin(onVerified);

  const fullNumber = `${DIAL_CODE} ${phoneNumber}`;
  const phoneError = validatePhone(phoneNumber);
  const otpError = validateCode(otp, OTP_LENGTH);
  const otpSent = login.sent !== undefined;
  const busy = login.sending || login.verifying;

  /** The identifier every call in this flow is made against. */
  const identifier = { channel: 'phone', phone: loginPhoneOf(phoneNumber) } as const;

  const handleSendOtp = () => {
    if (phoneError === undefined && !busy) {
      login.send(identifier);
    }
  };

  /** A resend is the same request again; the old code is dead either way. */
  const handleResend = () => {
    if (login.resendIn === 0 && !busy) {
      setOtp('');
      login.send(identifier);
    }
  };

  const handleVerify = () => {
    if (otpError === undefined && !busy) {
      login.verify(identifier, otp);
    }
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
                onChangeText={text => {
                  setPhoneNumber(text.replace(/\D/g, ''));
                  /** A different number invalidates the code sent to the old one. */
                  setOtp('');
                  login.reset();
                }}
                placeholder="98765 43210"
                placeholderTextColor={colors.text.placeholder}
                keyboardType="phone-pad"
                textContentType="telephoneNumber"
                maxLength={10}
                accessibilityLabel="Mobile number"
                style={[
                  styles.phoneInput,
                  // Only complain once there is something to complain about.
                  phoneNumber.length > 0 &&
                    phoneError !== undefined &&
                    styles.inputInvalid,
                ]}
              />
            </View>

            {phoneNumber.length > 0 && phoneError !== undefined && (
              <Text style={styles.fieldError}>{phoneError}</Text>
            )}

            {otpSent && (
              <View style={styles.sentRow}>
                <View style={styles.sentBadge}>
                  <CheckIcon color={colors.border.strong} />
                </View>
                <Text style={styles.sentLabel}>OTP sent to {fullNumber}</Text>
              </View>
            )}

            {/**
             * No SMS provider is wired up yet, so the server hands the code
             * back in development to make the flow testable. It is never
             * present in a production build — see deliverOtp on the server.
             */}
            {login.sent?.devCode !== undefined && (
              <Text style={styles.devCode}>Dev code: {login.sent.devCode}</Text>
            )}

            <PrimaryButton
              label={
                login.sending ? 'Sending…' : otpSent ? 'OTP Sent ✓' : 'Send OTP'
              }
              labelStyle={typography.buttonSmall}
              disabled={phoneError !== undefined || busy}
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
                onPress={otpSent && login.resendIn === 0 ? handleResend : undefined}
                style={[
                  styles.resendAction,
                  (!otpSent || login.resendIn > 0) && styles.resendActionDisabled,
                ]}
              >
                {login.resendIn > 0
                  ? `Resend in ${login.resendIn}s`
                  : 'Resend OTP'}
              </Text>
            </Text>

            {login.error !== undefined && (
              <Text style={styles.formError}>{login.error}</Text>
            )}

            {/** An unregistered number is a wrong turn, not a wrong code. */}
            {login.notRegistered && (
              <Text style={styles.formError}>
                <Text
                  accessibilityRole="link"
                  onPress={onRegister}
                  style={styles.formErrorAction}
                >
                  Create an account
                </Text>{' '}
                to continue.
              </Text>
            )}

            <PrimaryButton
              label={login.verifying ? 'Verifying…' : 'Verify & Continue'}
              labelStyle={typography.buttonSmall}
              disabled={!otpSent || otpError !== undefined || busy}
              onPress={handleVerify}
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
  inputInvalid: {
    borderColor: colors.status.debit,
  },
  fieldError: {
    ...typography.caption,
    color: colors.status.debit,
    paddingTop: 6,
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
  devCode: {
    ...typography.captionStrong,
    color: colors.text.secondary,
    paddingTop: 6,
  },
  formError: {
    ...typography.caption,
    color: colors.status.debit,
    textAlign: 'center',
    paddingBottom: spacing.md,
  },
  formErrorAction: {
    ...typography.captionStrong,
    color: colors.border.active,
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
