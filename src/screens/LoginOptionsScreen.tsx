import React from 'react';
import { StatusBar, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BackButton } from '../components/BackButton';
import { LoginOptionRow } from '../components/LoginOptionRow';
import { OrDivider } from '../components/OrDivider';
import { SocialAuthButtons } from '../components/SocialAuthButtons';
import { MailIcon } from '../components/icons/MailIcon';
import { SmartphoneIcon } from '../components/icons/SmartphoneIcon';
import { colors, designFrame, spacing, typography } from '../theme';

/** Top padding Figma drew, measured from the top of the status bar. */
const DESIGN_PADDING_TOP = 56;

type LoginOptionsScreenProps = {
  onBack?: () => void;
  onContinueWithOtp?: () => void;
  onContinueWithEmail?: () => void;
  onGooglePress?: () => void;
  onApplePress?: () => void;
  onRegister?: () => void;
};

/**
 * Lets a returning user pick how to sign in — OTP, email, or a social
 * provider. Figma: node 180:88408.
 */
export function LoginOptionsScreen({
  onBack,
  onContinueWithOtp,
  onContinueWithEmail,
  onGooglePress,
  onApplePress,
  onRegister,
}: LoginOptionsScreenProps) {
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.screen}>
      <StatusBar barStyle="dark-content" />

      <View
        style={[
          styles.content,
          {
            paddingTop:
              insets.top + (DESIGN_PADDING_TOP - designFrame.statusBarHeight),
            paddingBottom: spacing.huge + insets.bottom,
          },
        ]}
      >
        <BackButton onPress={onBack} style={styles.back} />

        <View style={styles.header}>
          <Text style={styles.heading}>Welcome Back ✨</Text>
          <Text style={styles.subtitle}>Choose how you want to continue</Text>
        </View>

        <View style={styles.options}>
          <LoginOptionRow
            highlighted
            title="Continue with OTP"
            subtitle="Verify via mobile number"
            icon={<SmartphoneIcon color={colors.text.inverse} />}
            onPress={onContinueWithOtp}
          />
          <LoginOptionRow
            title="Continue with Email"
            subtitle="Login with your email"
            icon={<MailIcon color={colors.text.primary} />}
            onPress={onContinueWithEmail}
          />

          <OrDivider />

          <SocialAuthButtons
            style={styles.social}
            onGooglePress={onGooglePress}
            onApplePress={onApplePress}
          />
        </View>

        <View style={styles.footer}>
          <Text style={styles.footnote}>
            Don't have an account?{' '}
            <Text
              accessibilityRole="link"
              onPress={onRegister}
              style={styles.footnoteAction}
            >
              Register
            </Text>
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.xl,
  },
  back: {
    marginBottom: spacing.xxxl,
  },
  header: {
    paddingBottom: spacing.huge,
  },
  heading: {
    ...typography.heading,
    color: colors.text.primary,
  },
  subtitle: {
    ...typography.subtitle,
    color: colors.text.secondary,
    paddingTop: 6,
  },
  options: {
    gap: spacing.rowGap,
  },
  social: {
    // Sits 16pt clear of the divider, on top of the 14pt group gap.
    marginTop: spacing.section,
  },
  footer: {
    flex: 1,
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingTop: spacing.lg,
  },
  footnote: {
    ...typography.footnote,
    color: colors.text.secondary,
    textAlign: 'center',
  },
  footnoteAction: {
    ...typography.footnoteStrong,
    color: colors.border.strong,
  },
});
