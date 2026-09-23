import React, { useState } from 'react';
import {
  ActivityIndicator,
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
import { SegmentedTabs } from '../components/SegmentedTabs';
import { useApi } from '../hooks/useApi';
import * as api from '../services/api';
import {
  colors,
  designFrame,
  fontFamily,
  hairline,
  radius,
  spacing,
  typography,
} from '../theme';

/** Top padding Figma drew for a titled screen, measured from the top of the status bar. */
const DESIGN_PADDING_TOP = 56;

/** Which day's reading — exactly what GET /horoscope/daily's `day` accepts. */
const DAYS = [
  { key: 'previous', label: 'Yesterday' },
  { key: 'today', label: 'Today' },
  { key: 'next', label: 'Tomorrow' },
] as const;

type DayKey = (typeof DAYS)[number]['key'];

/**
 * The six areas the provider writes about, in the order they are read: how the
 * day feels first, then what it asks of you, then the practical notes.
 *
 * Keys match services/horoscopeNormalize.js's own `sections`, so a section the
 * provider leaves empty simply isn't drawn rather than showing a blank card.
 */
const SECTIONS = [
  { key: 'emotions', title: 'Emotions', glyph: '🌙', blurb: 'How the day is likely to feel' },
  { key: 'personal_life', title: 'Personal Life', glyph: '💞', blurb: 'Family, friends and relationships' },
  { key: 'profession', title: 'Work & Money', glyph: '💼', blurb: 'Career, study and earnings' },
  { key: 'health', title: 'Health', glyph: '🌿', blurb: 'Body, rest and energy' },
  { key: 'travel', title: 'Travel', glyph: '🧭', blurb: 'Journeys and movement' },
  { key: 'luck', title: 'Luck', glyph: '✨', blurb: 'Where the day favours you' },
] as const;

/** "2026-09-23" -> "Tue, 23 Sep 2026". Read as UTC, which is the day the API names. */
function readableDate(value?: string): string {
  if (!value) return '';
  const date = new Date(`${value}T00:00:00.000Z`);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleDateString('en-GB', {
    weekday: 'short',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  });
}

type DailyHoroscopeScreenProps = {
  /**
   * The seeker's own sign, as the Home card knows it. Absent until their birth
   * details have been read into a rashi, and this screen says so rather than
   * guessing a sign to fetch.
   */
  sign?: string;
  onBack?: () => void;
  activeTab?: TabKey;
  onSelectTab?: (tab: TabKey) => void;
};

/**
 * The full reading behind Home's Daily Horoscope card.
 *
 * The card shows three highlights and a trimmed paragraph; this is the whole of
 * what the same request already returns — the day in one line, the three
 * highlights as tiles, and the provider's six areas as their own cards. Nothing
 * here is invented for the sake of filling a screen: an area the provider left
 * empty is left out.
 *
 * Yesterday and tomorrow are one tap away because the endpoint takes a day and
 * caches per sign per day, so paging costs nothing after the first look.
 */
export function DailyHoroscopeScreen({
  sign,
  onBack,
  activeTab = 'home',
  onSelectTab,
}: DailyHoroscopeScreenProps) {
  const insets = useSafeAreaInsets();
  const [day, setDay] = useState<DayKey>('today');

  const reading = useApi(
    () => (sign ? api.fetchDailyHoroscope(sign, day === 'today' ? undefined : day) : Promise.resolve(null)),
    [sign, day],
    { skip: !sign },
  );

  const data = reading.data;
  const highlights = [
    { label: 'Lucky Number', value: data?.lucky_number !== undefined ? String(data.lucky_number) : '—' },
    { label: 'Lucky Colour', value: data?.lucky_color || '—' },
    { label: 'Energy', value: data?.energy || '—' },
  ];

  return (
    <View style={styles.screen}>
      <StatusBar barStyle="dark-content" />

      <View
        style={[
          styles.header,
          { paddingTop: insets.top + (DESIGN_PADDING_TOP - designFrame.statusBarHeight) },
        ]}
      >
        <View style={styles.headerRow}>
          <BackButton onPress={onBack} backgroundColor="transparent" iconColor={colors.border.strong} />
          <View>
            <Text style={styles.title}>Daily Horoscope</Text>
            <Text style={styles.subtitle}>
              {sign ? `${sign} · ${readableDate(data?.date) || 'reading for you'}` : 'Your rashi is on its way'}
            </Text>
          </View>
        </View>

        {sign ? (
          <SegmentedTabs segments={DAYS} active={day} onSelect={setDay} style={styles.segments} />
        ) : null}
      </View>

      <ScrollView
        contentContainerStyle={[styles.body, { paddingBottom: spacing.section + insets.bottom }]}
        showsVerticalScrollIndicator={false}
      >
        {!sign && (
          <View style={styles.state}>
            <Text style={styles.stateGlyph}>🔮</Text>
            <Text style={styles.stateTitle}>Reading not ready yet</Text>
            <Text style={styles.stateText}>
              Your rashi is worked out from your birth details. Add them, and today’s reading appears here.
            </Text>
          </View>
        )}

        {sign && reading.loading && !data && (
          <ActivityIndicator color={colors.border.strong} style={styles.spinner} />
        )}

        {sign && !reading.loading && reading.error && (
          <View style={styles.state}>
            <Text style={styles.stateTitle}>Could not load the reading</Text>
            <Text style={styles.stateText}>{reading.error.message}</Text>
            <Pressable accessibilityRole="button" accessibilityLabel="Try again" onPress={reading.reload}>
              <Text style={styles.stateLink}>Try again</Text>
            </Pressable>
          </View>
        )}

        {data && (
          <>
            {/** The day in one line, over the brand gradient — the one thing to read if nothing else. */}
            <View style={styles.hero}>
              <BrandGradient radius={radius.panel} />
              <Text style={styles.heroSign}>{data.sign}</Text>
              <Text style={styles.heroDate}>{readableDate(data.date)}</Text>
              {data.summary ? <Text style={styles.heroSummary}>{data.summary}</Text> : null}
            </View>

            <View style={styles.highlights}>
              {highlights.map(item => (
                <View key={item.label} style={styles.highlight}>
                  <Text style={styles.highlightLabel}>{item.label}</Text>
                  <Text style={styles.highlightValue} numberOfLines={1}>
                    {item.value}
                  </Text>
                </View>
              ))}
            </View>

            {SECTIONS.map(section => {
              const text = data.sections?.[section.key];
              if (!text) {
                return null;
              }

              return (
                <View key={section.key} style={styles.card}>
                  <View style={styles.cardHeader}>
                    <View style={styles.glyphTile}>
                      <Text style={styles.glyph}>{section.glyph}</Text>
                    </View>
                    <View style={styles.cardHeading}>
                      <Text style={styles.cardTitle}>{section.title}</Text>
                      <Text style={styles.cardBlurb}>{section.blurb}</Text>
                    </View>
                  </View>
                  <Text style={styles.cardText}>{text}</Text>
                </View>
              );
            })}

            <Text style={styles.footnote}>
              Sun-sign reading for {data.sign}, refreshed once a day.
            </Text>
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
    paddingHorizontal: spacing.section,
    paddingBottom: spacing.lg,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  title: {
    ...typography.pageTitle,
    color: colors.text.primary,
  },
  subtitle: {
    ...typography.caption,
    color: colors.text.secondary,
  },
  segments: {
    marginTop: spacing.lg,
  },
  body: {
    paddingHorizontal: spacing.section,
    paddingTop: spacing.lg,
    gap: spacing.md,
  },
  spinner: {
    marginTop: spacing.xl,
  },
  hero: {
    borderRadius: radius.panel,
    padding: spacing.lg,
    overflow: 'hidden',
  },
  heroSign: {
    ...typography.heading,
    color: colors.text.primary,
  },
  heroDate: {
    ...typography.caption,
    color: colors.text.secondary,
  },
  heroSummary: {
    ...typography.body,
    color: colors.text.primary,
    marginTop: spacing.sm,
  },
  highlights: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  highlight: {
    flex: 1,
    borderRadius: radius.card,
    borderWidth: hairline,
    borderColor: colors.border.soft,
    backgroundColor: colors.surfaceSubtle,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    alignItems: 'center',
    gap: 2,
  },
  highlightLabel: {
    ...typography.caption,
    color: colors.text.secondary,
    textAlign: 'center',
  },
  highlightValue: {
    fontFamily: fontFamily.semiBold,
    fontSize: 15,
    color: colors.text.primary,
    textAlign: 'center',
  },
  card: {
    borderRadius: radius.panel,
    borderWidth: hairline,
    borderColor: colors.border.soft,
    backgroundColor: colors.surface,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  glyphTile: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceMuted,
  },
  glyph: {
    fontSize: 20,
  },
  cardHeading: {
    flex: 1,
  },
  cardTitle: {
    ...typography.listTitle,
    color: colors.text.primary,
  },
  cardBlurb: {
    ...typography.caption,
    color: colors.text.secondary,
  },
  cardText: {
    ...typography.bodySmall,
    color: colors.text.primary,
  },
  footnote: {
    ...typography.caption,
    color: colors.text.muted,
    textAlign: 'center',
    paddingTop: spacing.sm,
  },
  state: {
    alignItems: 'center',
    gap: spacing.sm,
    paddingTop: spacing.xl,
    paddingHorizontal: spacing.lg,
  },
  stateGlyph: {
    fontSize: 34,
  },
  stateTitle: {
    ...typography.subheading,
    color: colors.text.primary,
    textAlign: 'center',
  },
  stateText: {
    ...typography.bodySmall,
    color: colors.text.secondary,
    textAlign: 'center',
  },
  stateLink: {
    ...typography.listTitle,
    color: colors.text.primary,
    textDecorationLine: 'underline',
  },
});
