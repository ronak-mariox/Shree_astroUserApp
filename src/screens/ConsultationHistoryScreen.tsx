import React, { useState } from 'react';
import {
  Image,
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
import { consultationFilters, type Channel } from '../data/profile';
import { useApi } from '../hooks/useApi';
import * as api from '../services/api';
import { portraitOf } from '../utils/images';
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
const AVATAR_SIZE = 51.998;
const SEGMENT_HEIGHT = 33.993;

type Filter = 'all' | Channel;

type ConsultationHistoryScreenProps = {
  /**
   * Set when the screen is pushed from the Profile menu rather than opened as
   * the Consult tab — Figma's frame is the tab version, which has no back
   * button because the bar is the way out.
   */
  onBack?: () => void;
  activeTab?: TabKey;
  onSelectTab?: (tab: TabKey) => void;
};

/** Past sessions, filterable by channel. Figma: node 180:164348. */
export function ConsultationHistoryScreen({
  onBack,
  activeTab = 'consult',
  onSelectTab,
}: ConsultationHistoryScreenProps) {
  const insets = useSafeAreaInsets();
  const [filter, setFilter] = useState<Filter>('all');

  /** Only completed sessions — the card always shows a "✓ Completed" badge, so this keeps that honest. */
  const history = useApi(() => api.fetchConsultations('ended'), []);

  const sessions = (history.data ?? []).filter(
    session => filter === 'all' || session.channel === filter,
  );

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
          {onBack !== undefined && (
            <BackButton
              onPress={onBack}
              backgroundColor={colors.glass.dim}
              iconColor={colors.border.strong}
            />
          )}
          <View>
            <Text style={styles.title}>Consultations</Text>
            <Text style={styles.subtitle}>Your consultation history</Text>
          </View>
        </View>

        <View style={styles.segments}>
          {consultationFilters.map(option => {
            const selected = option.key === filter;

            return (
              <Pressable
                key={option.key}
                accessibilityRole="tab"
                accessibilityState={{ selected }}
                onPress={() => setFilter(option.key)}
                style={[
                  styles.segment,
                  selected && styles.segmentSelected,
                ]}
              >
                <Text
                  style={selected ? styles.segmentOn : styles.segmentOff}
                  numberOfLines={1}
                >
                  {option.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.body}
        showsVerticalScrollIndicator={false}
      >
        {history.loading && !history.data && (
          <Text style={styles.empty}>Loading…</Text>
        )}
        {!history.loading && sessions.length === 0 && (
          <Text style={styles.empty}>No consultations yet.</Text>
        )}

        {sessions.map(session => {
          const chat = session.channel === 'chat';

          return (
            <View key={session.id} style={styles.card}>
              <View style={styles.cardTop}>
                <View style={styles.avatar}>
                  <BrandGradient
                    radius={radius.iconLarge}
                    from={colors.status.infoTint}
                    to={colors.gradient.avatarFrom}
                  />
                  <Image
                    source={portraitOf(session.photo)}
                    style={styles.avatarImage}
                    resizeMode="cover"
                  />
                </View>

                <View style={styles.copy}>
                  <Text style={styles.astrologer}>{session.astrologer}</Text>
                  <Text style={styles.topic}>{session.topic}</Text>
                  <Text style={styles.timestamp}>{session.timestamp}</Text>
                </View>

                <View style={styles.amountColumn}>
                  <Text style={styles.amount}>{session.amount}</Text>
                  <Text style={styles.duration}>{session.duration}</Text>
                </View>
              </View>

              <View style={styles.tags}>
                <View
                  style={[
                    styles.channelTag,
                    chat ? styles.chatTag : styles.voiceTag,
                  ]}
                >
                  <Text
                    style={[
                      styles.channelLabel,
                      {
                        color: chat
                          ? colors.cosmos.accent
                          : colors.gradient.avatarTo,
                      },
                    ]}
                  >
                    {chat ? 'Chat' : 'Voice'}
                  </Text>
                </View>

                <View style={styles.statusTag}>
                  <Text style={styles.statusLabel}>✓ Completed</Text>
                </View>
              </View>
            </View>
          );
        })}
      </ScrollView>

      <BottomTabBar active={activeTab} onSelect={onSelectTab} />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.canvas,
  },
  header: {
    backgroundColor: colors.brandYellow,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  title: {
    ...typography.pageTitle,
    color: colors.text.onYellow,
  },
  subtitle: {
    ...typography.footnote,
    color: colors.text.onYellowMuted,
    paddingTop: spacing.xs,
  },
  segments: {
    flexDirection: 'row',
    gap: spacing.xs,
    borderRadius: radius.icon,
    backgroundColor: colors.glass.dimSoft,
    padding: spacing.xs,
    marginTop: spacing.section,
  },
  segment: {
    flex: 1,
    height: SEGMENT_HEIGHT,
    borderRadius: radius.tag,
    alignItems: 'center',
    justifyContent: 'center',
  },
  segmentSelected: {
    backgroundColor: colors.brandYellow,
  },
  segmentOn: {
    ...typography.footnoteStrong,
    color: colors.text.onYellow,
    textAlign: 'center',
  },
  segmentOff: {
    ...typography.footnote,
    color: colors.text.onYellowSubtle,
    textAlign: 'center',
  },

  body: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.section,
    gap: spacing.md,
  },
  empty: {
    ...typography.caption,
    color: colors.text.muted,
    textAlign: 'center',
    paddingTop: spacing.xl,
  },
  card: {
    borderRadius: radius.card,
    borderWidth: hairline,
    borderColor: colors.border.subtle,
    backgroundColor: colors.surface,
    padding: 16.755,
    // drop-shadow(0 2px 5px rgba(0, 0, 0, 0.04))
    ...Platform.select({
      ios: {
        shadowColor: colors.shadow,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04,
        shadowRadius: 5,
      },
      android: { elevation: 2 },
      default: {},
    }),
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
  },
  avatar: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: radius.iconLarge,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarImage: {
    width: AVATAR_SIZE - 1,
    height: AVATAR_SIZE - 1,
    borderRadius: radius.iconLarge - 2,
  },
  copy: {
    flex: 1,
  },
  astrologer: {
    ...typography.label,
    color: colors.text.primary,
  },
  topic: {
    ...typography.caption,
    color: colors.text.secondary,
    paddingTop: 2,
  },
  timestamp: {
    ...typography.footnoteSmall,
    color: colors.text.muted,
    paddingTop: 2,
  },
  amountColumn: {
    alignItems: 'flex-end',
  },
  amount: {
    ...typography.cardTitle,
    color: colors.status.debit,
    textAlign: 'right',
  },
  duration: {
    ...typography.footnoteSmall,
    color: colors.text.muted,
    textAlign: 'right',
    paddingTop: 3,
  },

  tags: {
    flexDirection: 'row',
    gap: spacing.sm,
    paddingTop: spacing.md,
  },
  channelTag: {
    borderRadius: radius.tag,
    borderWidth: hairline,
    paddingHorizontal: 10.755,
    paddingVertical: 4.755,
  },
  chatTag: {
    backgroundColor: colors.status.infoTint,
    borderColor: colors.border.current,
  },
  voiceTag: {
    backgroundColor: colors.status.voiceTint,
    borderColor: colors.status.voiceTintBorder,
  },
  channelLabel: {
    ...typography.priceLabel,
    fontFamily: typography.cardMeta.fontFamily,
  },
  statusTag: {
    borderRadius: radius.tag,
    backgroundColor: colors.status.positiveBadge,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  statusLabel: {
    ...typography.cardMeta,
    color: colors.status.positive,
  },
});
