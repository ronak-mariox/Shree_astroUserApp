import React, { useState } from 'react';
import {
  ActivityIndicator,
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
import { analysisTabs, type AnalysisTab } from '../data/analysis';
import { useApi } from '../hooks/useApi';
import * as api from '../services/api';
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

/** "2011-10-25T02:43:00.000Z" – "2031-10-25T02:43:00.000Z" -> "2011 – 2031". */
function yearsOf(period: { start: string; end: string }): string {
  const startYear = new Date(period.start).getUTCFullYear();
  const endYear = new Date(period.end).getUTCFullYear();
  return `${Number.isNaN(startYear) ? '—' : startYear} – ${Number.isNaN(endYear) ? '—' : endYear}`;
}

/** "8 yrs 5 mo" until a period ends — only meaningful for the one currently running. */
function remainingOf(period: { end: string; current?: boolean }): string | undefined {
  if (period.current !== true) {
    return undefined;
  }
  const end = new Date(period.end).getTime();
  const ms = end - Date.now();
  if (!Number.isFinite(end) || ms <= 0) {
    return undefined;
  }
  const totalMonths = Math.floor(ms / (1000 * 60 * 60 * 24 * 30.44));
  const years = Math.floor(totalMonths / 12);
  const months = totalMonths % 12;
  if (years === 0) {
    return `${months} mo`;
  }
  return months === 0 ? `${years} yr${years === 1 ? '' : 's'}` : `${years} yr${years === 1 ? '' : 's'} ${months} mo`;
}

type AstrologyAnalysisScreenProps = {
  profileId: string;
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
 *
 * Yogas has no backend source yet (out of scope for the AstrologyAPI
 * integration) — its tab shows a placeholder rather than the design
 * fixture's sample data.
 */
export function AstrologyAnalysisScreen({
  profileId,
  onBack,
  initialTab = 'dasha',
  activeTab = 'home',
  onSelectTab,
}: AstrologyAnalysisScreenProps) {
  const insets = useSafeAreaInsets();
  const [tab, setTab] = useState<AnalysisTab>(initialTab);

  const dasha = useApi(() => api.fetchKundliDasha(profileId), [profileId]);
  const doshas = useApi(() => api.fetchKundliDoshas(profileId), [profileId]);

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
            {dasha.loading && !dasha.data && (
              <ActivityIndicator color={colors.border.strong} style={styles.spinner} />
            )}
            {!dasha.loading && dasha.error && (
              <Text style={styles.centeredText}>{dasha.error.message}</Text>
            )}
            {dasha.data && (
              <>
                <Text style={styles.sectionTitle}>Mahadasha (Major Periods)</Text>
                <View style={styles.periodList}>
                  {dasha.data.mahadasha.map(period => (
                    <View
                      key={period.lord}
                      style={[
                        styles.periodCard,
                        period.current === true
                          ? styles.cardSelected
                          : styles.cardIdle,
                      ]}
                    >
                      <View style={styles.periodCopy}>
                        <View style={styles.periodHeading}>
                          <Text style={styles.periodName}>{`${period.lord} Dasha`}</Text>
                          {period.current === true && (
                            <View style={styles.activeBadge}>
                              <Text style={styles.activeLabel}>ACTIVE</Text>
                            </View>
                          )}
                        </View>
                        <Text style={styles.periodYears}>{yearsOf(period)}</Text>
                      </View>

                      {remainingOf(period) !== undefined && (
                        <View style={styles.remaining}>
                          <Text style={styles.remainingLabel}>Remaining</Text>
                          <Text style={styles.remainingValue}>
                            {remainingOf(period)}
                          </Text>
                        </View>
                      )}
                    </View>
                  ))}
                </View>

                <Text style={[styles.sectionTitle, styles.subSection]}>
                  Antardasha (Sub-periods of the current Mahadasha)
                </Text>
                <View style={styles.subPeriodList}>
                  {dasha.data.currentAntardasha.map(sub => (
                    <View
                      key={sub.lord}
                      style={[
                        styles.subPeriodRow,
                        sub.current === true ? styles.cardSelected : styles.cardIdle,
                      ]}
                    >
                      <View
                        style={[
                          styles.marker,
                          sub.current === true
                            ? styles.markerActive
                            : styles.markerIdle,
                        ]}
                      />
                      <View>
                        <Text style={styles.subPeriodName}>{sub.lord}</Text>
                        <Text style={styles.subPeriodDates}>{yearsOf(sub)}</Text>
                      </View>
                    </View>
                  ))}
                </View>
              </>
            )}
          </>
        )}

        {tab === 'yogas' && (
          <View style={styles.placeholder}>
            <Text style={styles.placeholderText}>
              Yoga analysis is coming soon.
            </Text>
          </View>
        )}

        {tab === 'doshas' && (
          <>
            {doshas.loading && !doshas.data && (
              <ActivityIndicator color={colors.border.strong} style={styles.spinner} />
            )}
            {!doshas.loading && doshas.error && (
              <Text style={styles.centeredText}>{doshas.error.message}</Text>
            )}
            {doshas.data && (
              <View style={styles.cardList}>
                {doshas.data.doshas.map(dosha => (
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
          </>
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

  spinner: {
    marginTop: spacing.xxl,
  },
  centeredText: {
    ...typography.body,
    color: colors.text.secondary,
    textAlign: 'center',
    marginTop: spacing.xxl,
  },
  placeholder: {
    alignItems: 'center',
    paddingVertical: spacing.xxl,
  },
  placeholderText: {
    ...typography.body,
    color: colors.text.secondary,
    textAlign: 'center',
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
