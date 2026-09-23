import React, { useMemo } from 'react';
import {
  Image,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  AstrologerCard,
  type Astrologer,
} from '../components/AstrologerCard';
import { BottomTabBar, type TabKey } from '../components/BottomTabBar';
import { BrandGradient } from '../components/BrandGradient';
import {
  ConsultationRow,
  type Consultation,
} from '../components/ConsultationRow';
import { DailyHoroscopeCard } from '../components/DailyHoroscopeCard';
import { PlanetPositionsCard } from '../components/PlanetPositionsCard';
import { SectionHeader } from '../components/SectionHeader';
import { HEADER_STARS, StarField } from '../components/StarField';
import { BellIcon } from '../components/icons/BellIcon';
import { SearchIcon } from '../components/icons/SearchIcon';
import { ZODIAC_ICONS } from '../components/icons/ZodiacIcons';
import { quickActions, type QuickAction } from '../data/home';
import { useApi } from '../hooks/useApi';
import { useResponsive } from '../hooks/useResponsive';
import * as api from '../services/api';
import { avatarOf, portraitOf } from '../utils/images';
import {
  colors,
  designFrame,
  hairline,
  radius,
  spacing,
  typography,
} from '../theme';

/** Top padding Figma drew, measured from the top of the status bar. */
const DESIGN_PADDING_TOP = 52;
/** Header artboard the star scatter was measured on. */
const HEADER_HEIGHT = 287.966;
const ACTION_BUTTON_SIZE = 39.999;
const QUICK_ACTION_SIZE = 72;

type HomeScreenProps = {
  activeTab?: TabKey;
  onSelectTab?: (tab: TabKey) => void;
  onSearchPress?: () => void;
  onNotificationsPress?: () => void;
  onProfilePress?: () => void;
  onAddFunds?: () => void;
  onQuickAction?: (action: QuickAction) => void;
  /** Today's reading, tapped from the card under the header. */
  /** Handed the rashi this screen already resolved, so the reading opens without asking for it again. */
  onOpenHoroscope?: (sign?: string) => void;
  /** One past session in the Recent Consultations feed. */
  onSelectConsultation?: (consultation: Consultation) => void;
  /** Opens the tapped astrologer's profile — the card, or either of its actions. */
  onSelectAstrologer?: (astrologer: Astrologer) => void;
  onSeeAllAstrologers?: () => void;
  onViewAllConsultations?: () => void;
};

/**
 * Signed-in landing screen: greeting and wallet on the yellow header, then the
 * daily reading, shortcuts, astrologers, planet positions and history.
 * Figma: node 180:88920.
 */
export function HomeScreen({
  activeTab = 'home',
  onSelectTab,
  onSearchPress,
  onNotificationsPress,
  onProfilePress,
  onAddFunds,
  onQuickAction,
  onOpenHoroscope,
  onSelectConsultation,
  onSelectAstrologer,
  onSeeAllAstrologers,
  onViewAllConsultations,
}: HomeScreenProps) {
  /** Everything this screen prints, in one call. */
  const home = useApi(() => api.fetchHome(), []);
  /** The carousel is the directory's first few, most popular first. */
  const directory = useApi(() => api.fetchAstrologers({ sort: 'popular', limit: 8 }), []);

  const me = home.data?.profile;
  const balance = home.data?.wallet.balance ?? 0;

  /** The rashi line under the name, once the real Moon sign has resolved (see services/user.service.js's enrichZodiacFromBirthDetails on the backend). */
  const zodiacLine = me?.moonSign
    ? `${me.moonSign}${me.dateOfBirth ? ` · ${api.shortDate(me.dateOfBirth)}` : ''}`
    : 'Your rashi will appear here soon';
  const ZodiacGlyph = me?.moonSign ? ZODIAC_ICONS[me.moonSign] : undefined;

  /** Directory cards, in the shape the carousel draws. */
  const astrologers = (directory.data?.items ?? []).map(row => ({
    id: row.id,
    name: row.name,
    speciality: api.joinLabels(row.expertise) || 'Astrologer',
    experience: row.experienceYears ? `${row.experienceYears} yrs exp` : '',
    rate: row.rates.chat ? `₹${row.rates.chat.now}/min` : 'Rate not set',
    photo: portraitOf(row.photo),
    online: row.online,
  }));

  /** The last few sessions, in the shape the row draws. */
  const recentConsultations = (home.data?.recentConsultations ?? []).map(row => ({
    id: row.id,
    astrologer: row.astrologer ?? 'Astrologer',
    summary: `${row.channel === 'call' ? 'Voice' : 'Chat'} Consultation · ${api.minutesOf(
      row.durationSeconds,
    )}`,
    date: api.shortDate(row.endedAt),
    amount: api.rupees(row.amount),
    photo: portraitOf(row.photo),
  }));

  const insets = useSafeAreaInsets();
  const { px, contentWidth, isTablet } = useResponsive();
  const styles = useMemo(
    () => createStyles(px, contentWidth, isTablet),
    [px, contentWidth, isTablet],
  );

  return (
    <View style={styles.screen}>
      <StatusBar barStyle="dark-content" />

      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <StarField
            stars={HEADER_STARS}
            color={colors.border.strong}
            frameHeight={px(HEADER_HEIGHT)}
          />

          <View
            style={[
              styles.headerContent,
              {
                paddingTop:
                  insets.top +
                  px(DESIGN_PADDING_TOP - designFrame.statusBarHeight),
              },
            ]}
          >
            <View style={styles.identityRow}>
              <View style={styles.identity}>
                <Text style={styles.greeting}>✦ Namaste</Text>
                <Text style={styles.name}>{me?.name ?? ''}</Text>
                <View style={styles.zodiacRow}>
                  {me?.moonSign &&
                    (ZodiacGlyph ? (
                      <ZodiacGlyph size={px(12)} />
                    ) : (
                      <Text style={styles.zodiacGlyph}>✦</Text>
                    ))}
                  <Text style={styles.zodiacLine}>{zodiacLine}</Text>
                </View>
              </View>

              <View style={styles.headerActions}>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Search"
                  onPress={onSearchPress}
                  style={styles.glassButton}
                >
                  {/* Figma insets the 16pt glyph inside an 18pt box. */}
                  <SearchIcon />
                </Pressable>

                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Notifications"
                  onPress={onNotificationsPress}
                  style={styles.glassButton}
                >
                  <BellIcon />
                  {Boolean(home.data?.unreadNotifications) && (
                    <View style={styles.notificationDot} />
                  )}
                </Pressable>

                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Your profile"
                  onPress={onProfilePress}
                  style={styles.avatarButton}
                >
                  <BrandGradient
                    radius={radius.field}
                    angle="toRight"
                    from={colors.gradient.avatarFrom}
                    to={colors.gradient.avatarTo}
                  />
                  <Image
                    source={avatarOf(me?.avatarUrl)}
                    style={styles.avatar}
                    resizeMode="cover"
                  />
                </Pressable>
              </View>
            </View>

            <View style={styles.walletCard}>
              <View style={styles.walletCopy}>
                <Text style={styles.walletLabel}>WALLET BALANCE</Text>
                <Text style={styles.walletBalance}>{api.rupees(balance)}</Text>
                <Text style={styles.walletHint}>Available for consultations</Text>
              </View>

              <Pressable
                accessibilityRole="button"
                onPress={onAddFunds}
                style={({ pressed }) => [
                  styles.addButton,
                  pressed && styles.pressed,
                ]}
              >
                <BrandGradient radius={radius.button} />
                <Text style={styles.addLabel}>+ Add</Text>
              </Pressable>
            </View>
          </View>
        </View>

        <View style={styles.body}>
          <DailyHoroscopeCard
            horoscope={home.data?.horoscope}
            onPress={() => onOpenHoroscope?.(home.data?.horoscope?.sign)}
          />

          <View style={styles.section}>
            <SectionHeader title="Quick Actions" />
            <View style={styles.quickActions}>
              {quickActions.map(action => (
                <Pressable
                  key={action.id}
                  accessibilityRole="button"
                  accessibilityLabel={`${action.title}. ${action.subtitle}`}
                  onPress={() => onQuickAction?.(action)}
                  style={({ pressed }) => [
                    styles.quickAction,
                    pressed && styles.pressed,
                  ]}
                >
                  <Image
                    source={action.image}
                    style={[
                      styles.quickActionImage,
                      action.rounded
                        ? styles.quickActionRounded
                        : styles.quickActionCircle,
                    ]}
                    resizeMode="cover"
                  />
                  <Text style={styles.quickActionTitle}>{action.title}</Text>
                  <Text style={styles.quickActionSubtitle}>
                    {action.subtitle}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          <View style={styles.section}>
            <SectionHeader
              title="Top Astrologers"
              action="See All →"
              onActionPress={onSeeAllAstrologers}
            />
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.astrologers}
              style={styles.astrologerScroller}
            >
              {astrologers.map(astrologer => (
                <AstrologerCard
                  key={astrologer.id}
                  astrologer={astrologer}
                  onPress={() => onSelectAstrologer?.(astrologer)}
                  // Chat and Call both start on the profile, where the rates
                  // and the two "…Now" CTAs are.
                  onChatPress={() => onSelectAstrologer?.(astrologer)}
                  onCallPress={() => onSelectAstrologer?.(astrologer)}
                />
              ))}
            </ScrollView>
          </View>

          <View style={styles.section}>
            <PlanetPositionsCard positions={home.data?.planetPositions} />
          </View>

          <View style={styles.section}>
            <SectionHeader
              title="Recent Consultations"
              action="View All →"
              onActionPress={onViewAllConsultations}
            />
            <View style={styles.consultations}>
              {recentConsultations.map(consultation => (
                <ConsultationRow
                  key={consultation.id}
                  consultation={consultation}
                  onPress={() => onSelectConsultation?.(consultation)}
                />
              ))}
            </View>
          </View>
        </View>
      </ScrollView>

      <BottomTabBar active={activeTab} onSelect={onSelectTab} />
    </View>
  );
}

/**
 * `px` scales every Figma-measured size for the current window width (see
 * `useResponsive`); `contentWidth`/`isTablet` cap and centre the header and
 * body copy on a tablet instead of letting the phone layout stretch edge to
 * edge — horizontal scrollers (the astrologer rail) still use the full
 * window so they keep reading as a rail rather than a cramped column.
 */
function createStyles(px: (value: number) => number, contentWidth: number, isTablet: boolean) {
  return StyleSheet.create({
    screen: {
      flex: 1,
      backgroundColor: colors.surface,
    },
    header: {
      backgroundColor: colors.brandYellow,
      overflow: 'hidden',
    },
    headerContent: {
      alignSelf: 'center',
      width: '100%',
      maxWidth: isTablet ? contentWidth : undefined,
      paddingHorizontal: px(spacing.lg),
      paddingBottom: px(spacing.xl),
    },
    identityRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
    },
    identity: {
      flex: 1,
    },
    greeting: {
      ...typography.greeting,
      color: colors.text.onYellow,
    },
    name: {
      ...typography.pageTitle,
      color: colors.text.onYellow,
      paddingTop: 2,
    },
    zodiacRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
      paddingTop: 2,
    },
    zodiacGlyph: {
      ...typography.caption,
      color: colors.text.zodiac,
    },
    zodiacLine: {
      ...typography.caption,
      color: colors.text.onYellowFaint,
    },
    headerActions: {
      flexDirection: 'row',
      gap: px(10),
    },
    glassButton: {
      width: px(ACTION_BUTTON_SIZE),
      height: px(ACTION_BUTTON_SIZE),
      borderRadius: radius.field,
      borderWidth: hairline,
      borderColor: colors.border.glass,
      backgroundColor: colors.glass.button,
      alignItems: 'center',
      justifyContent: 'center',
    },
    notificationDot: {
      position: 'absolute',
      left: px(23.49),
      top: px(7),
      width: px(8),
      height: px(8),
      borderRadius: px(4),
      backgroundColor: colors.success.accent,
    },
    avatarButton: {
      width: px(ACTION_BUTTON_SIZE),
      height: px(ACTION_BUTTON_SIZE),
      borderRadius: radius.field,
      overflow: 'hidden',
    },
    avatar: {
      width: '100%',
      height: '100%',
    },
    walletCard: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      borderRadius: radius.panel,
      borderWidth: hairline,
      borderColor: colors.border.glassWarm,
      backgroundColor: colors.glass.card,
      paddingHorizontal: px(18.755),
      paddingVertical: px(16.755),
      marginTop: px(spacing.xl),
    },
    walletCopy: {
      flex: 1,
    },
    walletLabel: {
      ...typography.eyebrow,
      color: colors.text.onYellowStrongMuted,
    },
    walletBalance: {
      ...typography.heading,
      color: colors.text.onYellow,
      paddingTop: 2,
    },
    walletHint: {
      ...typography.footnoteSmall,
      color: colors.text.onYellowGhost,
      paddingTop: 2,
    },
    addButton: {
      width: px(71),
      height: px(37.993),
      borderRadius: radius.button,
      alignItems: 'center',
      justifyContent: 'center',
      overflow: 'hidden',
    },
    addLabel: {
      ...typography.footnoteStrong,
      color: colors.text.inverse,
      textAlign: 'center',
    },
    pressed: {
      opacity: 0.85,
    },
    body: {
      alignSelf: 'center',
      width: '100%',
      maxWidth: isTablet ? contentWidth : undefined,
      paddingHorizontal: px(spacing.section),
      paddingTop: px(spacing.lg),
      paddingBottom: px(10),
    },
    section: {
      paddingTop: px(22),
    },
    quickActions: {
      flexDirection: 'row',
      justifyContent: isTablet ? 'flex-start' : 'space-between',
      gap: isTablet ? px(spacing.xxxl) : 0,
      paddingHorizontal: px(spacing.section),
      paddingTop: px(11),
    },
    quickAction: {
      alignItems: 'center',
      width: isTablet ? undefined : px(QUICK_ACTION_SIZE) + px(spacing.xl),
    },
    quickActionImage: {
      width: px(QUICK_ACTION_SIZE),
      height: px(QUICK_ACTION_SIZE),
    },
    quickActionCircle: {
      borderRadius: px(QUICK_ACTION_SIZE) / 2,
    },
    quickActionRounded: {
      borderRadius: radius.sheet,
    },
    quickActionTitle: {
      ...typography.tileTitle,
      color: colors.text.primary,
      textAlign: 'center',
      paddingTop: spacing.sm,
    },
    quickActionSubtitle: {
      ...typography.footnoteSmall,
      color: colors.text.muted,
      textAlign: 'center',
    },
    astrologerScroller: {
      marginTop: px(spacing.rowGap),
      // Cards carry a soft drop shadow that the scroller must not clip.
      overflow: 'visible',
    },
    astrologers: {
      gap: px(spacing.md),
      paddingBottom: px(6),
    },
    consultations: {
      paddingTop: px(spacing.rowGap),
      gap: px(10),
    },
  });
}
