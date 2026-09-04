import React from 'react';
import {
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BackButton } from '../components/BackButton';
import {
  ConsultationCompletedIcon,
  ConsultationReminderIcon,
} from '../components/icons/NotificationIcons';
import { TotalAddedIcon } from '../components/icons/WalletIcons';
import { useApi } from '../hooks/useApi';
import * as api from '../services/api';
import { type NotificationTint } from '../data/profile';
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
const TILE_SIZE = 45.992;
const DOT_SIZE = 8;

const TINTS: Record<NotificationTint, string> = {
  warm: colors.status.infoTint,
  lilac: colors.status.lilacTint,
  mint: colors.status.positiveBadge,
};

/**
 * Look and feel per backend `Notification.type` (see
 * `backend/models/Notification.js`'s `NOTIFICATION_TYPES`). Only a few types
 * have a bespoke vector — Figma drew a handful of sample alerts, not one per
 * type — so everything else falls back to a plain glyph, the same way
 * "Mercury goes Direct" did in the original design fixture.
 */
const TYPE_META: Record<
  string,
  { tint: NotificationTint; glyph: string; Icon?: React.ComponentType<{ size?: number }> }
> = {
  consultation_request: { tint: 'lilac', glyph: '⏰', Icon: ConsultationReminderIcon },
  consultation_started: { tint: 'lilac', glyph: '⏰', Icon: ConsultationReminderIcon },
  consultation_ended: { tint: 'lilac', glyph: '✅', Icon: ConsultationCompletedIcon },
  message: { tint: 'warm', glyph: '💬' },
  wallet_credit: {
    tint: 'mint',
    glyph: '💰',
    Icon: props => <TotalAddedIcon {...props} color="#388753" />,
  },
  wallet_debit: { tint: 'warm', glyph: '💸' },
  withdrawal: { tint: 'warm', glyph: '🏦' },
  review: { tint: 'mint', glyph: '⭐' },
  application: { tint: 'lilac', glyph: '📄' },
  promotion: { tint: 'mint', glyph: '🎁' },
  system: { tint: 'warm', glyph: '🔔' },
};
const DEFAULT_META = { tint: 'warm' as NotificationTint, glyph: '🔔' };

type NotificationsScreenProps = {
  onBack?: () => void;
};

/** Alert feed, unread items tinted warm. Figma: node 180:163797. */
export function NotificationsScreen({ onBack }: NotificationsScreenProps) {
  const insets = useSafeAreaInsets();
  const { data, loading, setData } = useApi(() => api.fetchNotifications(), []);

  const items = data?.items ?? [];
  const unreadCount = data?.unread ?? 0;

  const markAllRead = async () => {
    if (unreadCount === 0) return;
    try {
      await api.markNotificationsRead();
      setData(current =>
        current
          ? {
              ...current,
              unread: 0,
              items: current.items.map(item => ({
                ...item,
                readAt: item.readAt ?? new Date().toISOString(),
              })),
            }
          : current,
      );
    } catch {
      /** Best effort — a re-open of this screen will show the true state. */
    }
  };

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
            backgroundColor={colors.glass.dim}
            iconColor={colors.border.strong}
          />
          <View>
            <Text style={styles.title}>Notifications</Text>
            <Text style={styles.subtitle}>
              {loading && !data ? 'Loading…' : `${unreadCount} unread`}
            </Text>
          </View>
        </View>

        <Pressable
          accessibilityRole="button"
          onPress={markAllRead}
          style={({ pressed }) => [styles.markAll, pressed && styles.pressed]}
        >
          <Text style={styles.markAllLabel}>Mark all read</Text>
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.body,
          { paddingBottom: spacing.md + insets.bottom },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {!loading && items.length === 0 && (
          <Text style={styles.empty}>You're all caught up — no notifications yet.</Text>
        )}

        {items.map(item => {
          const unread = !item.readAt;
          const meta = TYPE_META[item.type] ?? DEFAULT_META;
          const Icon = meta.Icon;

          return (
            <View
              key={item.id}
              style={[styles.card, unread ? styles.cardUnread : styles.cardRead]}
            >
              <View style={[styles.tile, { backgroundColor: TINTS[meta.tint] }]}>
                {Icon ? (
                  <Icon size={24} />
                ) : (
                  <Text style={styles.tileGlyph}>{meta.glyph}</Text>
                )}
              </View>

              <View style={styles.copy}>
                <View style={styles.titleRow}>
                  <Text
                    style={unread ? styles.titleUnread : styles.titleRead}
                  >
                    {item.title}
                  </Text>
                  {unread && <View style={styles.dot} />}
                </View>
                {item.body ? <Text style={styles.body_}>{item.body}</Text> : null}
                <Text style={styles.time}>{api.timeAgo(item.createdAt)}</Text>
              </View>
            </View>
          );
        })}
      </ScrollView>
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
    justifyContent: 'space-between',
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
    ...typography.pageTitleSmall,
    color: colors.text.onYellow,
  },
  subtitle: {
    ...typography.caption,
    color: colors.text.onYellowMuted,
  },
  markAll: {
    borderRadius: radius.badge,
    borderWidth: hairline,
    borderColor: colors.border.soft,
    backgroundColor: colors.glass.light,
    paddingHorizontal: 12.755,
    paddingVertical: 6.755,
  },
  markAllLabel: {
    ...typography.caption,
    color: colors.text.onYellow,
    textAlign: 'center',
  },
  pressed: {
    opacity: 0.7,
  },

  body: {
    paddingHorizontal: spacing.section,
    paddingTop: spacing.md,
    gap: 10,
  },
  empty: {
    ...typography.caption,
    color: colors.text.muted,
    textAlign: 'center',
    paddingTop: spacing.xl,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
    borderRadius: radius.input,
    borderWidth: hairline,
    padding: 14.755,
  },
  cardUnread: {
    backgroundColor: colors.status.infoTint,
    borderColor: colors.status.unreadTintBorder,
  },
  cardRead: {
    backgroundColor: colors.surface,
    borderColor: colors.border.subtle,
  },
  tile: {
    width: TILE_SIZE,
    height: TILE_SIZE,
    borderRadius: radius.field,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tileGlyph: {
    ...typography.symbolEmoji,
    color: colors.text.onYellow,
  },
  copy: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  titleUnread: {
    ...typography.rowTitle,
    color: colors.text.primary,
    flex: 1,
  },
  titleRead: {
    ...typography.detailValue,
    color: colors.text.primary,
    flex: 1,
  },
  dot: {
    width: DOT_SIZE,
    height: DOT_SIZE,
    borderRadius: DOT_SIZE / 2,
    backgroundColor: colors.cosmos.accent,
    marginTop: 3,
  },
  body_: {
    ...typography.caption,
    color: colors.text.secondary,
    paddingTop: spacing.xs,
  },
  time: {
    ...typography.footnoteSmall,
    color: colors.text.muted,
    paddingTop: 5,
  },
});
