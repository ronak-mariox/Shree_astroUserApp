import React, { useState } from 'react';
import {
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BackButton } from '../components/BackButton';
import { BottomTabBar, type TabKey } from '../components/BottomTabBar';
import { SegmentedTabs } from '../components/SegmentedTabs';
import {
  analysisTabs,
  analysisYogas,
  antardashas,
  doshas,
  mahadashas,
  type AnalysisTab,
} from '../data/analysis';
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
const MARKER_SIZE = 8;

type AstrologyAnalysisScreenProps = {
  onBack?: () => void;
  /** Which reading to open on. */
  initialTab?: AnalysisTab;
  activeTab?: TabKey;
  onSelectTab?: (tab: TabKey) => void;
};

/**
 * Deep reading of the birth chart, split across three tabs: the running
 * planetary periods, the yogas the chart forms, and the doshas it carries.
 * Figma: nodes 180:89757 (Dasha), 180:89892 (Yogas), 180:90009 (Doshas).
 */
export function AstrologyAnalysisScreen({
  onBack,
  initialTab = 'dasha',
  activeTab = 'home',
  onSelectTab,
}: AstrologyAnalysisScreenProps) {
  const insets = useSafeAreaInsets();
  const [tab, setTab] = useState<AnalysisTab>(initialTab);

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
        <View style={styles.headerRow}>
          <BackButton
            onPress={onBack}
            backgroundColor="transparent"
            iconColor={colors.border.strong}
          />
          <View>
            <Text style={styles.title}>Astrology Analysis</Text>
            <Text style={styles.subtitle}>
              Deep insights from your birth chart
            </Text>
          </View>
        </View>

        <SegmentedTabs
          segments={analysisTabs}
          active={tab}
          onSelect={setTab}
          style={styles.segments}
        />
      </View>

      <ScrollView
        contentContainerStyle={styles.body}
        showsVerticalScrollIndicator={false}
      >
        {tab === 'dasha' && (
          <>
            <Text style={styles.sectionTitle}>Mahadasha (Major Periods)</Text>
            <View style={styles.periodList}>
              {mahadashas.map(period => (
                <View
                  key={period.name}
                  style={[
                    styles.periodCard,
                    period.active === true
                      ? styles.cardSelected
                      : styles.cardIdle,
                  ]}
                >
                  <View style={styles.periodCopy}>
                    <View style={styles.periodHeading}>
                      <Text style={styles.periodName}>{period.name}</Text>
                      {period.active === true && (
                        <View style={styles.activeBadge}>
                          <Text style={styles.activeLabel}>ACTIVE</Text>
                        </View>
                      )}
                    </View>
                    <Text style={styles.periodYears}>{period.years}</Text>
                  </View>

                  {period.remaining !== undefined && (
                    <View style={styles.remaining}>
                      <Text style={styles.remainingLabel}>Remaining</Text>
                      <Text style={styles.remainingValue}>
                        {period.remaining}
                      </Text>
                    </View>
                  )}
                </View>
              ))}
            </View>

            <Text style={[styles.sectionTitle, styles.subSection]}>
              Antardasha (Sub-periods)
            </Text>
            <View style={styles.subPeriodList}>
              {antardashas.map(sub => (
                <View
                  key={sub.name}
                  style={[
                    styles.subPeriodRow,
                    sub.active === true ? styles.cardSelected : styles.cardIdle,
                  ]}
                >
                  <View
                    style={[
                      styles.marker,
                      sub.active === true
                        ? styles.markerActive
                        : styles.markerIdle,
                    ]}
                  />
                  <View>
                    <Text style={styles.subPeriodName}>{sub.name}</Text>
                    <Text style={styles.subPeriodDates}>{sub.period}</Text>
                  </View>
                </View>
              ))}
            </View>
          </>
        )}

        {tab === 'yogas' && (
          <View style={styles.cardList}>
            {analysisYogas.map(yoga => {
              const beneficial = yoga.verdict === 'Beneficial';

              return (
                <View key={yoga.name} style={styles.yogaCard}>
                  <View style={styles.readingHeading}>
                    <Text style={styles.readingName}>{yoga.name}</Text>
                    <View style={styles.badges}>
                      <View
                        style={[
                          styles.badge,
                          beneficial
                            ? styles.badgePositive
                            : styles.badgeNegative,
                        ]}
                      >
                        <Text
                          style={[
                            styles.badgeLabel,
                            {
                              color: beneficial
                                ? colors.status.positive
                                : colors.status.negative,
                            },
                          ]}
                        >
                          {yoga.verdict}
                        </Text>
                      </View>
                      <View style={[styles.badge, styles.badgePlain]}>
                        <Text style={styles.badgePlainLabel}>
                          {yoga.strength}
                        </Text>
                      </View>
                    </View>
                  </View>
                  <Text style={styles.readingDescription}>
                    {yoga.description}
                  </Text>
                </View>
              );
            })}
          </View>
        )}

        {tab === 'doshas' && (
          <View style={styles.cardList}>
            {doshas.map(dosha => (
              <View
                key={dosha.name}
                style={[
                  styles.doshaCard,
                  dosha.present ? styles.doshaPresent : styles.doshaAbsent,
                ]}
              >
                <View style={styles.readingHeading}>
                  <Text style={styles.readingName}>{dosha.name}</Text>
                  <View style={styles.badges}>
                    <View
                      style={[
                        styles.statusBadge,
                        dosha.present
                          ? styles.badgeNegative
                          : styles.badgePositive,
                      ]}
                    >
                      <Text
                        style={[
                          styles.statusLabel,
                          {
                            color: dosha.present
                              ? colors.status.negative
                              : colors.status.positive,
                          },
                        ]}
                      >
                        {dosha.present ? 'Present' : 'Absent'}
                      </Text>
                    </View>
                    {dosha.severity !== undefined && (
                      <View style={[styles.statusBadge, styles.badgePlain]}>
                        <Text style={styles.severityLabel}>
                          {dosha.severity}
                        </Text>
                      </View>
                    )}
                  </View>
                </View>
                <Text style={styles.readingDescription}>
                  {dosha.description}
                </Text>
              </View>
            ))}
          </View>
        )}
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
  segments: {
    marginTop: spacing.lg,
  },
  body: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xxl,
  },

  sectionTitle: {
    ...typography.label,
    color: colors.text.primary,
  },
  subSection: {
    paddingTop: spacing.lg,
  },
  cardSelected: {
    borderColor: colors.border.strong,
  },
  cardIdle: {
    borderColor: colors.border.subtle,
  },

  periodList: {
    paddingTop: spacing.md,
    gap: 10,
  },
  periodCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: radius.input,
    borderWidth: hairline,
    backgroundColor: colors.surface,
    padding: 14.755,
  },
  periodCopy: {
    flex: 1,
  },
  periodHeading: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  periodName: {
    ...typography.label,
    color: colors.text.primary,
  },
  activeBadge: {
    borderRadius: radius.chip,
    backgroundColor: colors.border.strong,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  activeLabel: {
    ...typography.badgeLabel,
    color: colors.text.inverse,
  },
  periodYears: {
    ...typography.caption,
    color: colors.text.secondary,
    paddingTop: 3,
  },
  remaining: {
    alignItems: 'flex-end',
  },
  remainingLabel: {
    ...typography.captionMedium,
    color: colors.border.strong,
    textAlign: 'right',
  },
  remainingValue: {
    ...typography.captionBold,
    color: colors.border.strong,
    textAlign: 'right',
  },

  subPeriodList: {
    paddingTop: spacing.md,
    gap: spacing.sm,
  },
  subPeriodRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    borderRadius: radius.field,
    borderWidth: hairline,
    backgroundColor: colors.surface,
    paddingHorizontal: 14.755,
    paddingVertical: 10.755,
  },
  marker: {
    width: MARKER_SIZE,
    height: MARKER_SIZE,
    borderRadius: MARKER_SIZE / 2,
  },
  markerActive: {
    backgroundColor: colors.border.strong,
  },
  markerIdle: {
    backgroundColor: colors.text.inactive,
  },
  subPeriodName: {
    ...typography.detailValue,
    color: colors.text.primary,
  },
  subPeriodDates: {
    ...typography.caption,
    color: colors.text.muted,
  },

  cardList: {
    gap: spacing.md,
  },
  yogaCard: {
    borderRadius: radius.input,
    borderWidth: hairline,
    borderColor: colors.border.subtle,
    backgroundColor: colors.surface,
    padding: 16.755,
    // drop-shadow(0 2px 4px rgba(0, 0, 0, 0.04))
    ...Platform.select({
      ios: {
        shadowColor: colors.shadow,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04,
        shadowRadius: 4,
      },
      android: { elevation: 1 },
      default: {},
    }),
  },
  doshaCard: {
    borderRadius: radius.input,
    borderWidth: hairline,
    padding: 16.755,
  },
  doshaPresent: {
    backgroundColor: colors.status.warningTint,
    borderColor: colors.status.warningTintBorder,
  },
  doshaAbsent: {
    backgroundColor: colors.status.positiveTint,
    borderColor: colors.status.positiveTintBorderSoft,
  },
  readingHeading: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  readingName: {
    ...typography.label,
    color: colors.text.primary,
    flexShrink: 1,
  },
  badges: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
  },
  badge: {
    borderRadius: radius.chip,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
  },
  statusBadge: {
    borderRadius: radius.chip,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  badgePositive: {
    backgroundColor: colors.status.positiveBadge,
  },
  badgeNegative: {
    backgroundColor: colors.status.negativeTint,
  },
  badgePlain: {
    backgroundColor: colors.surface,
  },
  badgeLabel: {
    ...typography.badgeLabel,
  },
  badgePlainLabel: {
    ...typography.microLabel,
    color: colors.border.strong,
  },
  statusLabel: {
    ...typography.priceLabel,
  },
  severityLabel: {
    ...typography.footnoteSmall,
    color: colors.border.strong,
  },
  readingDescription: {
    ...typography.bodySmall,
    color: colors.text.secondary,
    paddingTop: spacing.sm,
  },
});
