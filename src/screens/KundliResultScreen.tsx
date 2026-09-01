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
import { BrandGradient } from '../components/BrandGradient';
import { KundliSection } from '../components/KundliSection';
import { NorthIndianChart } from '../components/NorthIndianChart';
import { REMEDY_ICONS } from '../components/icons/RemedyIcons';
import { SearchIcon } from '../components/icons/SearchIcon';
import { ZODIAC_ICONS } from '../components/icons/ZodiacIcons';
import {
  dashas,
  keyPositions,
  planetaryPositions,
  positiveDignities,
  remedies,
  shadbala,
  yogas,
  type Dignity,
} from '../data/kundli';
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
const BAR_HEIGHT = 5.994;
const DASHA_BAR_HEIGHT = 4;

/** Figma colours a Shadbala score green above 70, yellow below 50. */
function strengthColor(strength: number): string {
  if (strength >= 70) {
    return colors.status.positive;
  }
  return strength >= 50 ? colors.border.strong : colors.status.caution;
}

function dignityColor(dignity: Dignity): string {
  return positiveDignities.includes(dignity)
    ? colors.status.positive
    : colors.status.negative;
}

type KundliResultScreenProps = {
  onBack?: () => void;
  onDeepAnalysis?: () => void;
  activeTab?: TabKey;
  onSelectTab?: (tab: TabKey) => void;
};

/**
 * The generated birth chart: the North Indian square, the placements behind
 * it, the running dasha, the yogas it forms, planetary strengths and the
 * remedies they suggest. Figma: node 180:89330.
 */
export function KundliResultScreen({
  onBack,
  onDeepAnalysis,
  activeTab = 'kundli',
  onSelectTab,
}: KundliResultScreenProps) {
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
          <View style={styles.chartCard}>
            <NorthIndianChart />
          </View>

          <View style={[styles.keyCard, styles.section]}>
            <Text style={styles.keyTitle}>Key Positions</Text>
            <View style={styles.keyGrid}>
              {keyPositions.map(position => {
                const Glyph = ZODIAC_ICONS[position.sign];
                return (
                  <View key={position.label} style={styles.keyTile}>
                    {Glyph ? (
                      <View style={styles.keyGlyphIcon}>
                        <Glyph size={18} />
                      </View>
                    ) : (
                      <Text style={styles.keyGlyph}>{position.glyph}</Text>
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
              {planetaryPositions.map(row => (
                <View key={row.planet} style={styles.tableRow}>
                  <Text style={styles.rowPlanet}>{row.planet}</Text>
                  <Text style={styles.rowSign}>{row.sign}</Text>
                  <Text style={styles.rowHouse}>{row.house}</Text>
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

          <KundliSection
            title="Vimshottari Dasha"
            subtitle="Current & Upcoming Mahadasha"
            style={styles.section}
          >
            <View style={styles.dashaList}>
              {dashas.map(dasha => (
                <View key={dasha.name} style={styles.dashaRow}>
                  <View style={styles.dashaTile}>
                    <Text style={styles.dashaGlyph}>{dasha.glyph}</Text>
                  </View>

                  <View style={styles.dashaCopy}>
                    <View style={styles.dashaHeading}>
                      <Text style={styles.dashaName}>{dasha.name}</Text>
                      {dasha.current === true && (
                        <View style={styles.currentBadge}>
                          <Text style={styles.currentLabel}>CURRENT</Text>
                        </View>
                      )}
                    </View>
                    <Text style={styles.dashaYears}>{dasha.years}</Text>
                    <View style={styles.dashaTrack}>
                      <View
                        style={[
                          styles.dashaFill,
                          { width: `${dasha.progress * 100}%` },
                        ]}
                      />
                    </View>
                  </View>
                </View>
              ))}
            </View>
          </KundliSection>

          <KundliSection title="Yogas in Chart" style={styles.section}>
            <View style={styles.yogaList}>
              {yogas.map(yoga => {
                const auspicious = yoga.verdict === 'Auspicious';

                return (
                  <View
                    key={yoga.name}
                    style={[
                      styles.yogaCard,
                      auspicious ? styles.yogaPositive : styles.yogaNegative,
                    ]}
                  >
                    <View style={styles.yogaHeading}>
                      <Text style={styles.yogaName}>{yoga.name}</Text>
                      <View
                        style={[
                          styles.verdictBadge,
                          {
                            backgroundColor: auspicious
                              ? colors.status.positive
                              : colors.status.negative,
                          },
                        ]}
                      >
                        <Text style={styles.verdictLabel}>{yoga.verdict}</Text>
                      </View>
                    </View>
                    <Text style={styles.yogaDescription}>
                      {yoga.description}
                    </Text>
                  </View>
                );
              })}
            </View>
          </KundliSection>

          <KundliSection
            title="Planetary Strength (Shadbala)"
            style={styles.section}
          >
            <View style={styles.strengthList}>
              {shadbala.map(entry => (
                <View key={entry.planet} style={styles.strengthRow}>
                  <View style={styles.strengthHeading}>
                    <Text style={styles.strengthPlanet}>{entry.planet}</Text>
                    <Text
                      style={[
                        styles.strengthValue,
                        { color: strengthColor(entry.strength) },
                      ]}
                    >
                      {entry.strength}%
                    </Text>
                  </View>
                  <View style={styles.strengthTrack}>
                    <View
                      style={[
                        styles.strengthFill,
                        { width: `${entry.strength}%` },
                      ]}
                    />
                  </View>
                </View>
              ))}
            </View>
          </KundliSection>

          <View style={[styles.remediesCard, styles.section]}>
            <Text style={styles.remediesTitle}>Recommended Remedies</Text>
            <Text style={styles.remediesSubtitle}>
              Based on your chart analysis
            </Text>

            <View style={styles.remedyList}>
              {remedies.map(remedy => {
                const Glyph = REMEDY_ICONS[remedy.name];
                return (
                  <View key={remedy.name} style={styles.remedyRow}>
                    {Glyph ? (
                      <Glyph size={28} />
                    ) : (
                      <Text style={styles.remedyGlyph}>{remedy.glyph}</Text>
                    )}
                    <View style={styles.remedyCopy}>
                      <Text style={styles.remedyName}>{remedy.name}</Text>
                      <Text style={styles.remedyDescription}>
                        {remedy.description}
                      </Text>
                      <Text style={styles.remedySchedule}>{remedy.schedule}</Text>
                    </View>
                  </View>
                );
              })}
            </View>
          </View>

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

  yogaList: {
    paddingTop: spacing.rowGap,
    gap: 10,
  },
  yogaCard: {
    borderRadius: radius.field,
    borderWidth: hairline,
    padding: 14.755,
  },
  yogaPositive: {
    backgroundColor: colors.status.positiveTint,
    borderColor: colors.status.positiveTintBorder,
  },
  yogaNegative: {
    backgroundColor: colors.status.negativeTint,
    borderColor: colors.status.negativeTintBorder,
  },
  yogaHeading: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  yogaName: {
    ...typography.rowTitle,
    color: colors.text.primary,
    flex: 1,
  },
  verdictBadge: {
    borderRadius: radius.chip,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
  },
  verdictLabel: {
    ...typography.chipLabel,
    color: colors.text.inverse,
  },
  yogaDescription: {
    ...typography.caption,
    color: colors.text.secondary,
    paddingTop: 6,
  },

  strengthList: {
    paddingTop: spacing.rowGap,
  },
  strengthRow: {
    paddingTop: spacing.md,
  },
  strengthHeading: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  strengthPlanet: {
    ...typography.captionStrong,
    color: colors.text.primary,
  },
  strengthValue: {
    ...typography.captionBold,
  },
  strengthTrack: {
    height: BAR_HEIGHT,
    borderRadius: radius.progress,
    backgroundColor: colors.track,
    overflow: 'hidden',
    marginTop: 5,
  },
  strengthFill: {
    height: BAR_HEIGHT,
    borderRadius: radius.progress,
    backgroundColor: colors.brandYellow,
  },

  remediesCard: {
    borderRadius: radius.card,
    backgroundColor: colors.brandTint,
    padding: 18,
  },
  remediesTitle: {
    ...typography.cardTitle,
    color: colors.border.strong,
  },
  remediesSubtitle: {
    ...typography.caption,
    color: colors.text.onTint,
    paddingTop: spacing.xs,
  },
  remedyList: {
    paddingTop: spacing.rowGap,
    gap: spacing.rowGap,
  },
  remedyRow: {
    flexDirection: 'row',
    gap: spacing.md,
    borderRadius: radius.field,
    borderWidth: hairline,
    borderColor: colors.border.onTint,
    backgroundColor: colors.glass.row,
    padding: 12.755,
  },
  remedyGlyph: {
    ...typography.symbolLarge,
    color: colors.border.strong,
  },
  remedyCopy: {
    flex: 1,
  },
  remedyName: {
    ...typography.rowTitle,
    color: colors.border.strong,
  },
  remedyDescription: {
    ...typography.caption,
    color: colors.text.remedy,
    paddingTop: 2,
  },
  remedySchedule: {
    ...typography.priceLabel,
    color: colors.border.strong,
    paddingTop: spacing.xs,
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
