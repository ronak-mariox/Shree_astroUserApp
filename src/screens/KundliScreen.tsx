import React from 'react';
import {
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BackButton } from '../components/BackButton';
import { BottomTabBar, type TabKey } from '../components/BottomTabBar';
import { PrimaryButton } from '../components/PrimaryButton';
import { birthDetails } from '../data/home';
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
const CTA_HEIGHT = 55.998;
const EDIT_BUTTON_HEIGHT = 35.999;

type KundliScreenProps = {
  onBack?: () => void;
  onEditBirthDetails?: () => void;
  onGenerateKundli?: () => void;
  activeTab?: TabKey;
  onSelectTab?: (tab: TabKey) => void;
};

/**
 * Birth chart entry point: the stored birth details plus the action that turns
 * them into a Kundli. Figma: node 180:89241.
 */
export function KundliScreen({
  onBack,
  onEditBirthDetails,
  onGenerateKundli,
  activeTab = 'kundli',
  onSelectTab,
}: KundliScreenProps) {
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.screen}>
      <StatusBar barStyle="dark-content" />

      <ScrollView showsVerticalScrollIndicator={false}>
        <View
          style={[
            styles.header,
            {
              paddingTop:
                insets.top + (DESIGN_PADDING_TOP - designFrame.statusBarHeight),
            },
          ]}
        >
          <View style={styles.headerRow}>
            <BackButton
              onPress={onBack}
              backgroundColor="transparent"
              iconColor={colors.border.strong}
            />
            <View>
              <Text style={styles.title}>Kundli</Text>
              <Text style={styles.subtitle}>Birth Chart &amp; Analysis</Text>
            </View>
          </View>
        </View>

        <View style={styles.body}>
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Birth Details</Text>

            <View style={styles.rows}>
              {birthDetails.map(detail => (
                <View key={detail.label} style={styles.row}>
                  <Text style={styles.rowLabel}>{detail.label}</Text>
                  <Text style={styles.rowValue}>{detail.value}</Text>
                </View>
              ))}
            </View>

            <Pressable
              accessibilityRole="button"
              onPress={onEditBirthDetails}
              style={({ pressed }) => [
                styles.editButton,
                pressed && styles.pressed,
              ]}
            >
              <Text style={styles.editLabel}>Edit Birth Details</Text>
            </Pressable>
          </View>

          <PrimaryButton
            label="Generate Kundli"
            labelStyle={typography.buttonLarge}
            style={styles.cta}
            onPress={onGenerateKundli}
          />
        </View>
      </ScrollView>

      <BottomTabBar active={activeTab} onSelect={onSelectTab} />
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
    paddingBottom: spacing.xl,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
  },
  title: {
    ...typography.pageTitle,
    color: colors.text.onYellowStrong,
  },
  subtitle: {
    ...typography.footnote,
    color: colors.text.onYellowMuted,
    paddingTop: spacing.xs,
  },
  body: {
    padding: spacing.lg,
  },
  card: {
    borderRadius: radius.card,
    borderWidth: hairline,
    borderColor: colors.border.subtle,
    backgroundColor: colors.surface,
    padding: 18.755,
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
  cardTitle: {
    ...typography.label,
    color: colors.text.primary,
  },
  rows: {
    paddingTop: spacing.rowGap,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    borderBottomWidth: hairline,
    borderBottomColor: colors.border.row,
    paddingTop: spacing.sm,
    paddingBottom: 8.755,
  },
  rowLabel: {
    ...typography.footnote,
    color: colors.text.secondary,
  },
  rowValue: {
    ...typography.detailValue,
    color: colors.text.primary,
  },
  editButton: {
    height: EDIT_BUTTON_HEIGHT,
    borderRadius: radius.badge,
    borderWidth: hairline,
    borderColor: colors.border.strong,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.md,
  },
  pressed: {
    opacity: 0.7,
  },
  editLabel: {
    ...typography.detailValue,
    color: colors.border.strong,
    textAlign: 'center',
  },
  cta: {
    height: CTA_HEIGHT,
    marginTop: spacing.section,
  },
});
