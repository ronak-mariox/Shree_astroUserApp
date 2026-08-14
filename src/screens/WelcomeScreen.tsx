import React from 'react';
import { Platform, StatusBar, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { PrimaryButton } from '../components/PrimaryButton';
import { SecondaryButton } from '../components/SecondaryButton';
import { StarField } from '../components/StarField';
import { ZodiacWheel } from '../components/ZodiacWheel';
import { colors, radius, spacing, typography } from '../theme';

type WelcomeScreenProps = {
  onLogin?: () => void;
  onCreateAccount?: () => void;
};

/**
 * Onboarding entry point: a yellow cosmic hero above a white sheet that
 * carries the value proposition and the two account actions.
 * Figma: node 180:88319.
 */
export function WelcomeScreen({
  onLogin,
  onCreateAccount,
}: WelcomeScreenProps) {
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.screen}>
      {/* Both platforms draw edge-to-edge, so the hero fills the status bar
          area and the clock/indicators sit on the yellow. */}
      <StatusBar barStyle="dark-content" />

      <View style={styles.hero}>
        <StarField />
        <View style={styles.heroContent}>
          <Text style={styles.wordmark}>Shree Astro</Text>
          <ZodiacWheel />
        </View>
      </View>

      <View
        style={[
          styles.sheet,
          { paddingBottom: spacing.huge + insets.bottom },
        ]}
      >
        <Text style={styles.title}>
          Discover Your{'\n'}
          <Text style={styles.titleAccent}>Cosmic Destiny</Text>
        </Text>

        <Text style={styles.body}>
          Connect with expert astrologers, explore your Kundli, and uncover the
          secrets written in the stars.
        </Text>

        <View style={styles.actions}>
          <PrimaryButton label="Login" onPress={onLogin} />
          <SecondaryButton label="Create Account" onPress={onCreateAccount} />
        </View>

        <Text style={styles.legal}>
          By continuing, you agree to our Terms &amp; Privacy Policy
        </Text>
      </View>
    </View>
  );
}

const SHEET_OVERLAP = 30;

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.canvas,
  },
  hero: {
    flex: 1,
    backgroundColor: colors.brandYellow,
    overflow: 'hidden',
  },
  heroContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  wordmark: {
    ...typography.wordmark,
    color: colors.text.onYellow,
    textAlign: 'center',
    marginBottom: spacing.xxl,
  },
  sheet: {
    marginTop: -SHEET_OVERLAP,
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.sheet,
    borderTopRightRadius: radius.sheet,
    paddingTop: spacing.xxxl,
    paddingHorizontal: spacing.xl,
    // drop-shadow(0 -4px 10px rgba(0, 0, 0, 0.08))
    ...Platform.select({
      ios: {
        shadowColor: colors.shadow,
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.08,
        shadowRadius: 10,
      },
      android: { elevation: 16 },
      default: {},
    }),
  },
  title: {
    ...typography.title,
    color: colors.text.primary,
    textAlign: 'center',
  },
  titleAccent: {
    color: colors.brandYellow,
  },
  body: {
    ...typography.body,
    color: colors.text.secondary,
    textAlign: 'center',
    paddingTop: 10,
  },
  actions: {
    paddingTop: spacing.xxl,
    gap: spacing.md,
  },
  legal: {
    ...typography.caption,
    color: colors.text.muted,
    textAlign: 'center',
    paddingTop: spacing.lg,
  },
});
