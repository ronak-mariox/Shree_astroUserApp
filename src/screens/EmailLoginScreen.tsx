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
import { MailIcon } from '../components/icons/MailIcon';
import { useOtpLogin } from '../hooks/useOtpLogin';
import type { AuthSession } from '../services/auth';
import { validateCode, validateEmail } from '../utils/validation';
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
const CODE_LENGTH = 6;
const FIELD_HEIGHT = 49.992;
const BADGE_SIZE = 51.998;
const BADGE_ICON = 25.993;
const SENT_BADGE_SIZE = 19.999;

type EmailLoginScreenProps = {
  onBack?: () => void;
  /** Handed the session once the code checks out and the user is signed in. */
  onVerified?: (session: AuthSession) => void;
  /** Offered when the address turns out to have no account behind it. */
  onRegister?: () => void;
  onGooglePress?: () => void;
  onApplePress?: () => void;
};

/**
 * Signs a user in with a code emailed to them — the same two-step card the
 * mobile flow uses (see {@link OtpLoginScreen}), with an address in place of a
 * number: the code card stays dimmed and inert until a code has actually been
 * sent. Both screens run the same {@link useOtpLogin}, so they cannot drift.
 */
export function EmailLoginScreen({
  onBack,
  onVerified,
  onRegister,
  onGooglePress,
  onApplePress,
}: EmailLoginScreenProps) {
  const insets = useSafeAreaInsets();
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const login = useOtpLogin(onVerified);

  const address = email.trim();
  const emailError = validateEmail(address);
  const codeError = validateCode(code, CODE_LENGTH);
  const codeSent = login.sent !== undefined;
  const busy = login.sending || login.verifying;

  /** The identifier every call in this flow is made against. */
  const identifier = { channel: 'email', email: address } as const;

  const handleSendCode = () => {
    if (emailError === undefined && !busy) {
      login.send(identifier);
    }
  };

  const handleResend = () => {
    if (login.resendIn === 0 && !busy) {
      setCode('');
      login.send(identifier);
    }
  };

  const handleVerify = () => {
    if (codeError === undefined && !busy) {
      login.verify(identifier, code);
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
              <MailIcon size={BADGE_ICON} color={colors.border.strong} />
            </View>
            <View>
              <Text style={styles.headerTitle}>Email Verification</Text>
              <Text style={styles.headerSubtitle}>
                Secure login with your email
              </Text>
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
            <Text style={styles.cardLabel}>Email Address</Text>

            <TextInput
              value={email}
              onChangeText={text => {
                setEmail(text);
                // A changed address invalidates the code already sent to the
                // old one.
                setCode('');
                login.reset();
              }}
              placeholder="you@example.com"
              placeholderTextColor={colors.text.placeholder}
              keyboardType="email-address"
              textContentType="emailAddress"
              autoCapitalize="none"
              autoCorrect={false}
              accessibilityLabel="Email address"
              style={[
                styles.emailInput,
                // Only complain once there is something to complain about.
                email.length > 0 && emailError !== undefined && styles.inputInvalid,
              ]}
            />

            {email.length > 0 && emailError !== undefined && (
              <Text style={styles.fieldError}>{emailError}</Text>
            )}

            {codeSent && (
              <View style={styles.sentRow}>
                <View style={styles.sentBadge}>
                  <CheckIcon color={colors.border.strong} />
                </View>
                <Text style={styles.sentLabel}>Code sent to {address}</Text>
              </View>
            )}

            {/**
             * No mail transport is wired up yet, so the server hands the code
             * back in development to make the flow testable. It is never
             * present in a production build — see deliverOtp on the server.
             */}
            {login.sent?.devCode !== undefined && (
              <Text style={styles.devCode}>Dev code: {login.sent.devCode}</Text>
            )}

            <PrimaryButton
              label={
                login.sending ? 'Sending…' : codeSent ? 'Code Sent ✓' : 'Send Code'
              }
              labelStyle={typography.buttonSmall}
              disabled={emailError !== undefined || busy}
              onPress={handleSendCode}
              style={styles.cardButton}
            />
          </View>

          <View
            style={[
              styles.card,
              styles.codeCard,
              codeSent ? styles.codeCardActive : styles.codeCardInactive,
            ]}
          >
            <Text style={styles.cardLabel}>Enter Code</Text>
            <Text style={styles.cardHint}>
              {codeSent
                ? `${CODE_LENGTH}-digit code sent to ${address}`
                : 'Send the code first to enable this section'}
            </Text>

            <OtpInput
              value={code}
              onChange={setCode}
              length={CODE_LENGTH}
              disabled={!codeSent}
              style={styles.codeRow}
            />

            <Text style={styles.resend}>
              Didn't receive?{' '}
              <Text
                accessibilityRole="link"
                onPress={codeSent && login.resendIn === 0 ? handleResend : undefined}
                style={[
                  styles.resendAction,
                  (!codeSent || login.resendIn > 0) && styles.resendActionDisabled,
                ]}
              >
                {login.resendIn > 0
                  ? `Resend in ${login.resendIn}s`
                  : 'Resend Code'}
              </Text>
            </Text>

            {login.error !== undefined && (
              <Text style={styles.formError}>{login.error}</Text>
            )}

            {/** An unregistered address is a wrong turn, not a wrong code. */}
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
              disabled={!codeSent || codeError !== undefined || busy}
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
  emailInput: {
    ...typography.input,
    height: FIELD_HEIGHT,
    marginTop: spacing.md,
    borderRadius: radius.field,
    borderWidth: hairline,
    borderColor: colors.border.subtle,
    backgroundColor: colors.surface,
    color: colors.text.primary,
    paddingHorizontal: 16.755,
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
    flex: 1,
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
  codeCard: {
    marginTop: spacing.section,
  },
  codeCardActive: {
    borderColor: colors.border.active,
  },
  codeCardInactive: {
    opacity: 0.55,
  },
  cardHint: {
    ...typography.caption,
    color: colors.text.secondary,
    paddingTop: 6,
  },
  codeRow: {
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
