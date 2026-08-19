import React from 'react';
import {
  Platform,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BackButton } from '../components/BackButton';
import { PrimaryButton } from '../components/PrimaryButton';
import { SecondaryButton } from '../components/SecondaryButton';
import {
  colors,
  designFrame,
  hairline,
  radius,
  spacing,
  typography,
} from '../theme';

/** Top padding Figma draws on the other pushed screens. */
const DESIGN_PADDING_TOP = 52;
const BADGE_SIZE = 96;

type ComingSoonScreenProps = {
  /** What is on its way — "Chat with Astro Ragini", "Google Sign-In", … */
  title: string;
  /** One line on what it will do once it lands. */
  detail?: string;
  /** Emoji on the badge; defaults to the hourglass. */
  glyph?: string;
  onBack?: () => void;
  onBackToHome?: () => void;
};

/**
 * Placeholder for the parts of the product that are designed but not built yet
 * — live chat and voice consultations, social sign-in, photo upload.
 *
 * Every button in the app leads somewhere; the ones whose destination does not
 * exist yet land here rather than doing nothing.
 */
export function ComingSoonScreen({
  title,
  detail,
  glyph = '⏳',
  onBack,
  onBackToHome,
}: ComingSoonScreenProps) {
  const insets = useSafeAreaInsets();

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
          backgroundColor={colors.success.tint}
          iconColor={colors.success.accent}
        />
        <View>
          <Text style={styles.headerTitle}>Coming Soon</Text>
          <Text style={styles.headerSubtitle}>We are building this next</Text>
        </View>
      </View>

      <View style={[styles.body, { paddingBottom: spacing.xl + insets.bottom }]}>
        <View style={styles.card}>
          <View style={styles.badge}>
            <Text style={styles.glyph}>{glyph}</Text>
          </View>

          <Text style={styles.title}>{title}</Text>
          <Text style={styles.detail}>
            {detail ??
              'This part of the app is on its way. Everything else is ready to explore in the meantime.'}
          </Text>

          <View style={styles.actions}>
            <PrimaryButton
              label="Go Back"
              labelStyle={typography.buttonSmall}
              onPress={onBack}
            />
            {onBackToHome !== undefined && (
              <SecondaryButton
                label="Back to Home"
                labelStyle={typography.buttonSocial}
                onPress={onBackToHome}
              />
            )}
          </View>
        </View>
      </View>
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
  headerTitle: {
    ...typography.pageTitleSmall,
    color: colors.text.onYellow,
  },
  headerSubtitle: {
    ...typography.footnote,
    color: colors.text.onYellowMuted,
  },
  body: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
  },
  card: {
    alignItems: 'center',
    borderRadius: radius.card,
    borderWidth: hairline,
    borderColor: colors.border.subtle,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.huge,
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
  badge: {
    width: BADGE_SIZE,
    height: BADGE_SIZE,
    borderRadius: BADGE_SIZE / 2,
    backgroundColor: colors.status.infoTint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  glyph: {
    fontSize: 40,
    lineHeight: 52,
  },
  title: {
    ...typography.headingSmall,
    color: colors.text.primary,
    textAlign: 'center',
    paddingTop: spacing.lg,
  },
  detail: {
    ...typography.footnote,
    color: colors.text.secondary,
    textAlign: 'center',
    paddingTop: spacing.sm,
  },
  actions: {
    alignSelf: 'stretch',
    paddingTop: spacing.xl,
    gap: spacing.md,
  },
});
