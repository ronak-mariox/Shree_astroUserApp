import React from 'react';
import {
  ActivityIndicator,
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
import { BrandGradient } from '../components/BrandGradient';
import { KundliSection } from '../components/KundliSection';
import { NorthIndianChart } from '../components/NorthIndianChart';
import { SearchIcon } from '../components/icons/SearchIcon';
import { ZODIAC_ICONS } from '../components/icons/ZodiacIcons';
import { positiveDignities, type Dignity } from '../data/kundli';
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
const CTA_HEIGHT = 53.992;
const CTA_ICON = 17.993;
const DASHA_TILE = 39.999;
const DASHA_BAR_HEIGHT = 4;
const STRENGTH_TILE = 33.997;
const STRENGTH_BAR_HEIGHT = 6;

/** Remedy glyph by type — the provider gives no icon, only the two known types. */
const REMEDY_GLYPHS: Record<'puja' | 'gemstone', string> = {
  puja: '🕉',
  gemstone: '💎',
};

/** Glyphs for the nine grahas — the backend gives plain planet names; only the display needs the symbol. */
const PLANET_GLYPHS: Record<string, string> = {
  Sun: '☀',
  Moon: '☽',
  Mars: '♂',
  Mercury: '☿',
  Jupiter: '♃',
  Venus: '♀',
  Saturn: '♄',
  Rahu: '☊',
  Ketu: '☋',
};

/** 2 -> "2nd", 11 -> "11th". */
function ordinal(value: number): string {
  const suffixes = ['th', 'st', 'nd', 'rd'];
  const remainder = value % 100;
  return `${value}${suffixes[(remainder - 20) % 10] ?? suffixes[remainder] ?? suffixes[0]}`;
}

/** How far a period has run, clamped — 0 for a future one, 1 for one already over. */
function progressOf(period: { start: string; end: string }): number {
  const start = new Date(period.start).getTime();
  const end = new Date(period.end).getTime();
  if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) {
    return 0;
  }
  return Math.min(1, Math.max(0, (Date.now() - start) / (end - start)));
}

/** "2011-10-25T02:43:00.000Z" – "2031-10-25T02:43:00.000Z" -> "2011 – 2031". */
function yearsOf(period: { start: string; end: string }): string {
  const startYear = new Date(period.start).getUTCFullYear();
  const endYear = new Date(period.end).getUTCFullYear();
  return `${Number.isNaN(startYear) ? '—' : startYear} – ${Number.isNaN(endYear) ? '—' : endYear}`;
}

function dignityColor(dignity: Dignity): string {
  return positiveDignities.includes(dignity)
    ? colors.status.positive
    : colors.status.negative;
}

type KundliResultScreenProps = {
  profileId: string;
  onBack?: () => void;
  onDeepAnalysis?: () => void;
  activeTab?: TabKey;
  onSelectTab?: (tab: TabKey) => void;
  /** Shown at the chart's centre; falls back to the design fixture's sample native when not given. */
  native?: { name: string; date: string; place: string };
};

/**
 * The generated birth chart: the North Indian square, the placements behind
 * it, the running dasha, planetary strength, and recommended remedies.
 * Figma: node 180:89330.
 *
 * Yogas were part of the original design fixture but have no backend source
 * yet (out of scope for the AstrologyAPI integration) — see
 * AstrologyAnalysisScreen's Yogas tab, which shows a placeholder instead.
 */
export function KundliResultScreen({
  profileId,
  onBack,
  onDeepAnalysis,
  activeTab = 'kundli',
  onSelectTab,
  native,
}: KundliResultScreenProps) {
  const insets = useSafeAreaInsets();

  const overview = useApi(() => api.fetchKundliOverview(profileId), [profileId]);
  const dasha = useApi(() => api.fetchKundliDasha(profileId), [profileId]);
  const strength = useApi(() => api.fetchKundliStrength(profileId), [profileId]);
  const remedies = useApi(() => api.fetchKundliRemedies(profileId), [profileId]);

  const loading = (overview.loading && !overview.data) || (dasha.loading && !dasha.data);
  const failed = overview.error ?? dasha.error;

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

        <View style={styles.body}>
          {loading && (
            <View style={styles.centered}>
              <ActivityIndicator color={colors.border.strong} />
              <Text style={styles.centeredText}>Loading your kundli…</Text>
            </View>
          )}

          {!loading && failed && (
            <View style={styles.centered}>
              <Text style={styles.centeredText}>{failed.message}</Text>
              <Pressable
                accessibilityRole="button"
                onPress={() => {
                  overview.reload();
                  dasha.reload();
                  strength.reload();
                  remedies.reload();
                }}
              >
                <Text style={styles.retryLabel}>Try again</Text>
              </Pressable>
            </View>
          )}

          {!loading && !failed && overview.data && (
            <>
              <View style={styles.chartCard}>
                <NorthIndianChart planets={overview.data.planetaryPositions} native={native} />
              </View>

              <View style={[styles.keyCard, styles.section]}>
                <Text style={styles.keyTitle}>Key Positions</Text>
                <View style={styles.keyGrid}>
                  {overview.data.keyPositions.map(position => {
                    const Glyph = ZODIAC_ICONS[position.sign];
                    return (
                      <View key={position.label} style={styles.keyTile}>
                        {Glyph ? (
                          <View style={styles.keyGlyphIcon}>
                            <Glyph size={18} />
                          </View>
                        ) : (
                          <Text style={styles.keyGlyph}>✦</Text>
                        )}
                        <Text style={styles.keyLabel}>{position.label}</Text>
                        <Text style={styles.keySign}>{position.sign}</Text>
                      </View>
                    );
                  })}
                </View>
              </View>

              <KundliSection title="Planetary Positions" style={styles.section}>
                <View style={styles.table}>
                  {overview.data.planetaryPositions.map(row => (
                    <View key={row.planet} style={styles.tableRow}>
                      <Text style={styles.rowPlanet}>{row.planet}</Text>
                      <Text style={styles.rowSign}>{row.sign}</Text>
                      <Text style={styles.rowHouse}>{ordinal(row.house)}</Text>
                      <View style={styles.rowBadgeSlot}>
                        {row.dignity !== undefined && (
                          <View style={styles.dignityBadge}>
                            <Text
                              style={[
                                styles.dignityLabel,
                                { color: dignityColor(row.dignity) },
                              ]}
                            >
                              {row.dignity}
                            </Text>
                          </View>
                        )}
                      </View>
                    </View>
                  ))}
                </View>
              </KundliSection>

              {dasha.data && (
                <KundliSection
                  title="Vimshottari Dasha"
                  subtitle="Current & Upcoming Mahadasha"
                  style={styles.section}
                >
                  <View style={styles.dashaList}>
                    {dasha.data.mahadasha.map(period => (
                      <View key={period.lord} style={styles.dashaRow}>
                        <View style={styles.dashaTile}>
                          <Text style={styles.dashaGlyph}>
                            {PLANET_GLYPHS[period.lord] ?? '✦'}
                          </Text>
                        </View>

                        <View style={styles.dashaCopy}>
                          <View style={styles.dashaHeading}>
                            <Text style={styles.dashaName}>{`${period.lord} Dasha`}</Text>
                            {period.current === true && (
                              <View style={styles.currentBadge}>
                                <Text style={styles.currentLabel}>CURRENT</Text>
                              </View>
                            )}
                          </View>
                          <Text style={styles.dashaYears}>{yearsOf(period)}</Text>
                          <View style={styles.dashaTrack}>
                            <View
                              style={[
                                styles.dashaFill,
                                { width: `${progressOf(period) * 100}%` },
                              ]}
                            />
                          </View>
                        </View>
                      </View>
                    ))}
                  </View>
                </KundliSection>
              )}

              {strength.data && strength.data.strength.length > 0 && (
                <KundliSection title="Planetary Strength (Shadbala)" style={styles.section}>
                  <View style={styles.strengthList}>
                    {strength.data.strength.map(row => (
                      <View key={row.planet} style={styles.strengthRow}>
                        <View style={styles.strengthTile}>
                          <Text style={styles.strengthGlyph}>{row.symbol}</Text>
                        </View>
                        <View style={styles.strengthCopy}>
                          <View style={styles.strengthHeading}>
                            <Text style={styles.strengthName}>{row.planet}</Text>
                            <Text style={styles.strengthValue}>{`${row.percentage}%`}</Text>
                          </View>
                          <View style={styles.strengthTrack}>
                            <View
                              style={[
                                styles.strengthFill,
                                { width: `${Math.min(100, row.percentage)}%` },
                              ]}
                            />
                          </View>
                        </View>
                      </View>
                    ))}
                  </View>
                </KundliSection>
              )}

              {remedies.data && remedies.data.remedies.length > 0 && (
                <KundliSection title="Recommended Remedies" style={styles.section}>
                  <View style={styles.remedyList}>
                    {remedies.data.remedies.map((remedy, index) => (
                      <View key={`${remedy.type}-${index}`} style={styles.remedyCard}>
                        <View style={styles.remedyTile}>
                          <Text style={styles.remedyGlyph}>{REMEDY_GLYPHS[remedy.type]}</Text>
                        </View>
                        <View style={styles.remedyCopy}>
                          <Text style={styles.remedyName}>{remedy.title}</Text>
                          <Text style={styles.remedyDescription}>{remedy.description}</Text>
                          {remedy.frequency !== undefined && (
                            <Text style={styles.remedySchedule}>{remedy.frequency}</Text>
                          )}
                        </View>
                      </View>
                    ))}
                  </View>
                </KundliSection>
              )}

              <Pressable
                accessibilityRole="button"
                onPress={onDeepAnalysis}
                style={({ pressed }) => [
                  styles.cta,
                  styles.section,
                  pressed && styles.pressed,
                ]}
              >
                <BrandGradient radius={radius.button} />
                <SearchIcon size={CTA_ICON} color={colors.text.inverse} />
                <Text style={styles.ctaLabel}>Deep Astrology Analysis</Text>
              </Pressable>
            </>
          )}
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
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
    backgroundColor: colors.brandYellow,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
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
  section: {
    marginTop: spacing.section,
  },
  centered: {
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.xxl,
  },
  centeredText: {
    ...typography.body,
    color: colors.text.secondary,
    textAlign: 'center',
  },
  retryLabel: {
    ...typography.footnoteStrong,
    color: colors.border.strong,
  },

  chartCard: {
    borderRadius: radius.card,
    borderWidth: hairline,
    borderColor: colors.border.subtle,
    backgroundColor: colors.surface,
    padding: 16.755,
    marginTop: spacing.lg,
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

  keyCard: {
    borderRadius: radius.card,
    borderWidth: hairline,
    borderColor: colors.border.hairlineSoft,
    backgroundColor: colors.surfaceRecessed,
    padding: 18.755,
  },
  keyTitle: {
    ...typography.cardTitle,
    color: colors.text.primary,
  },
  keyGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    paddingTop: spacing.rowGap,
  },
  keyTile: {
    // Three per row, sharing the two 10pt gutters.
    width: '31.5%',
    flexGrow: 1,
    alignItems: 'center',
    borderRadius: radius.icon,
    backgroundColor: colors.surface,
    paddingHorizontal: 6,
    paddingVertical: 10,
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
  keyGlyph: {
    ...typography.symbolMedium,
    color: colors.border.strong,
    textAlign: 'center',
  },
  keyGlyphIcon: {
    height: typography.symbolMedium.lineHeight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  keyLabel: {
    ...typography.microLabel,
    color: colors.text.muted,
    textAlign: 'center',
    paddingTop: 2,
  },
  keySign: {
    ...typography.captionBold,
    color: colors.border.strong,
    textAlign: 'center',
    paddingTop: 2,
  },

  table: {
    paddingTop: spacing.rowGap,
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: hairline,
    borderBottomColor: colors.border.row,
    paddingTop: 10,
    paddingBottom: 10.755,
  },
  rowPlanet: {
    ...typography.footnoteStrong,
    color: colors.text.primary,
    width: '29%',
  },
  rowSign: {
    ...typography.caption,
    color: colors.text.secondary,
    flex: 1,
  },
  rowHouse: {
    ...typography.caption,
    color: colors.text.muted,
    width: 36,
  },
  rowBadgeSlot: {
    alignItems: 'flex-end',
    minWidth: 60,
  },
  dignityBadge: {
    borderRadius: radius.chip,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
  },
  dignityLabel: {
    ...typography.badgeLabel,
  },

  dashaList: {
    paddingTop: spacing.rowGap,
  },
  dashaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.rowGap,
    borderBottomWidth: hairline,
    borderBottomColor: colors.border.row,
    paddingTop: spacing.md,
    paddingBottom: 12.755,
  },
  dashaTile: {
    width: DASHA_TILE,
    height: DASHA_TILE,
    borderRadius: radius.field,
    backgroundColor: colors.brandYellow,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dashaGlyph: {
    ...typography.symbolMedium,
    color: colors.border.strong,
  },
  dashaCopy: {
    flex: 1,
  },
  dashaHeading: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dashaName: {
    ...typography.cardTitle,
    color: colors.text.primary,
  },
  currentBadge: {
    borderRadius: radius.chip,
    borderWidth: hairline,
    borderColor: colors.border.current,
    backgroundColor: colors.surface,
    paddingHorizontal: 8.755,
    paddingVertical: 2.755,
  },
  currentLabel: {
    ...typography.chipLabel,
    color: colors.border.strong,
  },
  dashaYears: {
    ...typography.caption,
    color: colors.text.muted,
    paddingTop: 3,
  },
  dashaTrack: {
    height: DASHA_BAR_HEIGHT,
    borderRadius: DASHA_BAR_HEIGHT / 2,
    backgroundColor: colors.track,
    overflow: 'hidden',
    marginTop: spacing.sm,
  },
  dashaFill: {
    height: DASHA_BAR_HEIGHT,
    borderRadius: DASHA_BAR_HEIGHT / 2,
    backgroundColor: colors.brandYellow,
  },

  strengthList: {
    paddingTop: spacing.rowGap,
    gap: spacing.md,
  },
  strengthRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.rowGap,
  },
  strengthTile: {
    width: STRENGTH_TILE,
    height: STRENGTH_TILE,
    borderRadius: radius.field,
    backgroundColor: colors.surfaceRecessed,
    alignItems: 'center',
    justifyContent: 'center',
  },
  strengthGlyph: {
    ...typography.symbolMedium,
    color: colors.border.strong,
  },
  strengthCopy: {
    flex: 1,
  },
  strengthHeading: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  strengthName: {
    ...typography.footnoteStrong,
    color: colors.text.primary,
  },
  strengthValue: {
    ...typography.captionBold,
    color: colors.border.strong,
  },
  strengthTrack: {
    height: STRENGTH_BAR_HEIGHT,
    borderRadius: STRENGTH_BAR_HEIGHT / 2,
    backgroundColor: colors.track,
    overflow: 'hidden',
    marginTop: spacing.sm,
  },
  strengthFill: {
    height: STRENGTH_BAR_HEIGHT,
    borderRadius: STRENGTH_BAR_HEIGHT / 2,
    backgroundColor: colors.brandYellow,
  },

  remedyList: {
    paddingTop: spacing.rowGap,
    gap: spacing.md,
  },
  remedyCard: {
    flexDirection: 'row',
    gap: spacing.rowGap,
    borderRadius: radius.input,
    borderWidth: hairline,
    borderColor: colors.border.subtle,
    backgroundColor: colors.surface,
    padding: 14.755,
  },
  remedyTile: {
    width: DASHA_TILE,
    height: DASHA_TILE,
    borderRadius: radius.field,
    backgroundColor: colors.surfaceRecessed,
    alignItems: 'center',
    justifyContent: 'center',
  },
  remedyGlyph: {
    ...typography.symbolMedium,
  },
  remedyCopy: {
    flex: 1,
  },
  remedyName: {
    ...typography.footnoteStrong,
    color: colors.text.primary,
  },
  remedyDescription: {
    ...typography.caption,
    color: colors.text.secondary,
    paddingTop: 2,
  },
  remedySchedule: {
    ...typography.captionMedium,
    color: colors.border.strong,
    paddingTop: spacing.sm,
  },

  cta: {
    height: CTA_HEIGHT,
    borderRadius: radius.button,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
    overflow: 'hidden',
  },
  pressed: {
    opacity: 0.9,
  },
  ctaLabel: {
    ...typography.buttonSmall,
    color: colors.text.inverse,
    textAlign: 'center',
  },
});
