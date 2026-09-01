import React, { useMemo, useState } from 'react';
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

import { BrandGradient } from '../components/BrandGradient';
import {
  BackArrowIcon,
  CallNowIcon,
  CallRateIcon,
  ChatNowIcon,
  ChatRateIcon,
  FollowIcon,
  KebabIcon,
  LanguageIcon,
  WalletBadgeIcon,
} from '../components/icons/DetailIcons';
import {
  detailPalette as palette,
  TAG_FILLS,
  type AstrologerProfile,
  type AstrologerSummary,
} from '../data/astrologerProfile';
import { useApi } from '../hooks/useApi';
import { useResponsive } from '../hooks/useResponsive';
import * as api from '../services/api';
import { portraitOf } from '../utils/images';
import {
  colors,
  designFrame,
  fontFamily,
  hairline,
  radius,
  spacing,
} from '../theme';

/** Top padding Figma drew, measured from the top of the status bar. */
const DESIGN_PADDING_TOP = 53.63;
const PORTRAIT = 81.824;
const MEDIA_TILE = 82.719;
const CTA_HEIGHT = 49;

type AstrologerDetailScreenProps = {
  /** Whoever was tapped in the list; omitted, the pinned profile is shown. */
  astrologer?: AstrologerSummary;
  onBack?: () => void;
  /** The kebab in the header — report, share, block. */
  onMoreOptions?: () => void;
  onFollow?: () => void;
  onChat?: () => void;
  onCall?: () => void;
};

/**
 * Full astrologer profile: identity, rates, media, specialities and bio.
 * Figma: node 180:164498.
 *
 * The frame is drawn in its own visual language, so its greys, pastel pills
 * and wide radii come from `detailPalette` rather than the shared theme.
 */
export function AstrologerDetailScreen({
  astrologer,
  onBack,
  onMoreOptions,
  onFollow,
  onChat,
  onCall,
}: AstrologerDetailScreenProps) {
  const insets = useSafeAreaInsets();
  const { px, contentWidth, isTablet } = useResponsive();
  const styles = useMemo(
    () => createStyles(px, contentWidth, isTablet),
    [px, contentWidth, isTablet],
  );

  /** The pill in the header shows the seeker's own balance. */
  const wallet = useApi(() => api.fetchWallet(), []);

  /** The full record, fetched by id. The card's own fields paint until it lands. */
  const detail = useApi(
    () => api.fetchAstrologer(astrologer!.id),
    [astrologer?.id],
    { skip: !astrologer?.id },
  );

  const profile = useMemo<AstrologerProfile>(() => {
    const row = detail.data;

    /** Before the fetch lands, everything comes from the card that was tapped. */
    const rates = row?.rates?.chat
      ? { was: `₹${row.rates.chat.was}/min`, now: `₹${row.rates.chat.now}/min` }
      : astrologer?.rates ?? { was: '', now: astrologer?.rate ?? '—' };
    const callRates = row?.rates?.call
      ? { was: `₹${row.rates.call.was}/min`, now: `₹${row.rates.call.now}/min` }
      : rates;

    const expertise: string[] = row?.expertise ?? [];
    const tags = (expertise.length
      ? expertise.map(api.titleCase)
      : (astrologer?.specialities ?? '')
          .split(/[,·]/)
          .map(part => part.trim())
          .filter(Boolean)
    ).map((label, index) => ({ label, fill: TAG_FILLS[index % TAG_FILLS.length] }));

    return {
      name: row?.name ?? astrologer?.name ?? '',
      online: row?.online ?? astrologer?.online ?? false,
      waitTime:
        row?.busy && row?.waitSeconds
          ? `Wait ${Math.ceil(row.waitSeconds / 60)} Min`
          : astrologer?.wait ?? '',
      languages: row ? api.joinLabels(row.languages) : astrologer?.languages ?? '',
      photo: portraitOf(row?.photo) ?? astrologer?.photo,
      tags,
      stats: [
        {
          value: row?.experienceYears
            ? `${row.experienceYears} Years`
            : astrologer?.experience ?? '—',
          label: 'Experience',
        },
        { value: `${Math.round((row?.callMinutes ?? 0) / 1000)}K Mins`, label: 'Call' },
        { value: `${Math.round((row?.chatMinutes ?? 0) / 1000)}K Mins`, label: 'Chat' },
      ],
      rates: { chat: rates, call: callRates },
      media: (row?.gallery ?? []).map((url: string) => ({ uri: url })),
      specializations: row?.specializations ?? [],
      about: row?.about ?? '',
    };
  }, [detail.data, astrologer]);
  // Following and the About card both work off local state — neither needs a
  // backend to be useful.
  const [following, setFollowing] = useState(false);
  const [aboutExpanded, setAboutExpanded] = useState(false);

  return (
    <View style={styles.screen}>
      <StatusBar barStyle="dark-content" />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: spacing.section }}
      >
        <View
          style={[
            styles.header,
            {
              paddingTop:
                insets.top + px(DESIGN_PADDING_TOP - designFrame.statusBarHeight),
            },
          ]}
        >
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Go back"
            onPress={onBack}
            style={({ pressed }) => [styles.back, pressed && styles.pressed]}
          >
            <BackArrowIcon size={px(22.1414)} />
          </Pressable>

          <View style={styles.walletPill}>
            <WalletBadgeIcon size={px(20)} />
            <Text style={styles.walletLabel}>{api.rupees(wallet.data?.balance)}</Text>
          </View>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="More options"
            onPress={onMoreOptions}
            style={({ pressed }) => [styles.kebab, pressed && styles.pressed]}
          >
            <KebabIcon size={px(5.26353)} />
          </Pressable>
        </View>

        <Text style={styles.waitTime}>{profile.waitTime}</Text>

        <View style={styles.body}>
          <View style={styles.profileCard}>
            <View style={styles.identity}>
              <Image
                source={profile.photo}
                style={styles.portrait}
                resizeMode="cover"
              />

              <View style={styles.identityCopy}>
                <View style={styles.nameRow}>
                  <Text style={styles.name}>{profile.name}</Text>
                  {profile.online && <View style={styles.onlineDot} />}
                </View>

                <View style={styles.tags}>
                  {profile.tags.map(tag => (
                    <View
                      key={tag.label}
                      style={[styles.tag, { backgroundColor: tag.fill }]}
                    >
                      <Text style={styles.tagLabel}>{tag.label}</Text>
                    </View>
                  ))}
                </View>

                <View style={styles.languageRow}>
                  <LanguageIcon size={px(12.2314)} />
                  <Text style={styles.languages}>{profile.languages}</Text>
                </View>
              </View>
            </View>

            <View style={styles.stats}>
              {profile.stats.map((stat, index) => (
                <React.Fragment key={stat.label}>
                  {index > 0 && <View style={styles.statDivider} />}
                  <View style={styles.stat}>
                    <Text style={styles.statValue}>{stat.value}</Text>
                    <Text style={styles.statLabel}>{stat.label}</Text>
                  </View>
                </React.Fragment>
              ))}
            </View>
          </View>

          <View style={styles.rateCard}>
            <View style={styles.rate}>
              <ChatRateIcon size={px(23)} />
              <View>
                <Text style={styles.rateWas}>{profile.rates.chat.was}</Text>
                <Text style={styles.rateNow}>{profile.rates.chat.now}</Text>
              </View>
            </View>

            <View style={styles.rateDivider} />

            <View style={styles.rate}>
              <View style={styles.callRateBox}>
                <CallRateIcon size={px(14.3)} />
              </View>
              <View>
                <Text style={styles.rateWas}>{profile.rates.call.was}</Text>
                <Text style={styles.rateNow}>{profile.rates.call.now}</Text>
              </View>
            </View>

            <View style={styles.rateDivider} />

            <Pressable
              accessibilityRole="button"
              accessibilityLabel={
                following ? `Unfollow ${profile.name}` : `Follow ${profile.name}`
              }
              accessibilityState={{ selected: following }}
              onPress={() => {
                setFollowing(current => !current);
                onFollow?.();
              }}
              style={({ pressed }) => [styles.follow, pressed && styles.pressed]}
            >
              <FollowIcon size={px(20.8333)} />
              <Text style={styles.followLabel}>
                {following ? 'Following' : 'Follow'}
              </Text>
            </Pressable>
          </View>

          <Text style={styles.sectionTitle}>Astro Media</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.media}
          >
            {profile.media.map((source, index) => (
              <Image
                // Figma repeats one still across the strip.
                key={index}
                source={source}
                style={styles.mediaTile}
                resizeMode="cover"
              />
            ))}
          </ScrollView>

          <Text style={styles.sectionTitle}>Specialization</Text>
          <View style={styles.specializations}>
            {profile.specializations.map(item => (
              <View key={item} style={styles.specTag}>
                <Text style={styles.specLabel}>{item}</Text>
              </View>
            ))}
          </View>

          <View style={styles.aboutCard}>
            <Text style={styles.aboutTitle}>About Us</Text>
            <Text
              style={styles.aboutBody}
              numberOfLines={aboutExpanded ? undefined : 3}
            >
              {profile.about}
            </Text>
            <Text
              accessibilityRole="button"
              accessibilityLabel={aboutExpanded ? 'Read less' : 'Read more'}
              onPress={() => setAboutExpanded(current => !current)}
              style={styles.readMore}
            >
              {aboutExpanded ? 'Read Less' : 'Read More'}
            </Text>
          </View>
        </View>
      </ScrollView>

      <View style={[styles.ctaBar, { paddingBottom: spacing.md + insets.bottom }]}>
        <Pressable
          accessibilityRole="button"
          onPress={onChat}
          style={({ pressed }) => [
            styles.cta,
            styles.ctaChat,
            pressed && styles.pressed,
          ]}
        >
          <BrandGradient radius={radius.button} />
          <ChatNowIcon size={px(26.178)} />
          <Text style={styles.ctaLabel}>Chat Now</Text>
        </Pressable>

        <Pressable
          accessibilityRole="button"
          onPress={onCall}
          style={({ pressed }) => [
            styles.cta,
            styles.ctaCall,
            pressed && styles.pressed,
          ]}
        >
          <BrandGradient radius={radius.button} />
          <CallNowIcon size={px(26)} />
          <Text style={styles.ctaLabel}>Call Now</Text>
        </Pressable>
      </View>
    </View>
  );
}

/**
 * This frame draws its own visual language (own greys, pill radii, inline
 * type) rather than the shared theme, so `px` scales its literal sizes and
 * font metrics directly. On a tablet the card column and CTA bar are capped
 * and centred (`contentWidth`/`isTablet`) instead of stretching edge to edge.
 */
function createStyles(px: (value: number) => number, contentWidth: number, isTablet: boolean) {
  return StyleSheet.create({
    screen: {
      flex: 1,
      backgroundColor: palette.page,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
      backgroundColor: colors.brandYellow,
      paddingHorizontal: spacing.section,
      paddingBottom: spacing.md,
    },
    back: {
      flex: 1,
      alignItems: 'flex-start',
    },
    pressed: {
      opacity: 0.7,
    },
    walletPill: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      height: px(35.66),
      borderRadius: radius.chip - 2,
      backgroundColor: colors.surface,
      paddingHorizontal: px(10),
    },
    walletLabel: {
      fontFamily: fontFamily.medium,
      fontSize: px(12),
      letterSpacing: -0.25,
      color: colors.text.ink,
    },
    kebab: {
      width: px(24),
      alignItems: 'center',
    },
    waitTime: {
      fontFamily: fontFamily.regular,
      fontSize: px(10),
      color: colors.text.onYellow,
      backgroundColor: colors.brandYellow,
      paddingLeft: px(44),
      paddingBottom: spacing.rowGap,
    },

    body: {
      alignSelf: 'center',
      width: '100%',
      maxWidth: isTablet ? contentWidth : undefined,
      paddingHorizontal: spacing.section,
      marginTop: -spacing.xxl,
      gap: spacing.section,
    },
    profileCard: {
      borderRadius: radius.card,
      backgroundColor: colors.surface,
      padding: spacing.section,
      // 0 8px 24px rgba(0, 0, 0, 0.06)
      ...Platform.select({
        ios: {
          shadowColor: colors.shadow,
          shadowOffset: { width: 0, height: 8 },
          shadowOpacity: 0.06,
          shadowRadius: 24,
        },
        android: { elevation: 4 },
        default: {},
      }),
    },
    identity: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: spacing.md,
    },
    portrait: {
      width: px(PORTRAIT),
      height: px(PORTRAIT),
      borderRadius: px(PORTRAIT) / 2,
      borderWidth: 1,
      borderColor: palette.star,
    },
    identityCopy: {
      flex: 1,
      gap: 6,
    },
    nameRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    name: {
      fontFamily: fontFamily.semiBold,
      fontSize: px(14),
      color: palette.ink,
    },
    onlineDot: {
      width: px(8),
      height: px(8),
      borderRadius: px(4),
      backgroundColor: colors.success.accent,
    },
    tags: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 5,
    },
    tag: {
      height: px(16),
      borderRadius: 44,
      justifyContent: 'center',
      paddingHorizontal: px(7),
    },
    tagLabel: {
      fontFamily: fontFamily.medium,
      fontSize: px(8),
      color: palette.ink,
    },
    languageRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
    },
    languages: {
      fontFamily: fontFamily.regular,
      fontSize: px(10),
      color: palette.ink,
    },

    stats: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingTop: spacing.section,
    },
    stat: {
      flex: 1,
      alignItems: 'center',
      gap: 2,
    },
    statDivider: {
      width: hairline,
      height: px(30),
      backgroundColor: colors.border.subtle,
    },
    statValue: {
      fontFamily: fontFamily.medium,
      fontSize: px(10),
      color: palette.ink,
    },
    statLabel: {
      fontFamily: fontFamily.regular,
      fontSize: px(10),
      color: palette.inkStrong,
    },

    rateCard: {
      flexDirection: 'row',
      alignItems: 'center',
      height: px(55.613),
      borderRadius: radius.badge,
      borderWidth: 1,
      borderColor: palette.cardBorder,
      backgroundColor: colors.surface,
      paddingHorizontal: spacing.section,
      // 0 2px 4px rgba(210, 210, 210, 0.87)
      ...Platform.select({
        ios: {
          shadowColor: palette.cardShadow,
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 1,
          shadowRadius: 4,
        },
        android: { elevation: 2 },
        default: {},
      }),
    },
    rate: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
    },
    callRateBox: {
      width: px(26),
      height: px(26),
      borderRadius: radius.bubbleTail,
      borderWidth: 1,
      borderColor: '#407FEE',
      alignItems: 'center',
      justifyContent: 'center',
    },
    rateWas: {
      fontFamily: fontFamily.regular,
      fontSize: px(10),
      color: palette.muted,
      textDecorationLine: 'line-through',
    },
    rateNow: {
      fontFamily: fontFamily.medium,
      fontSize: px(13),
      color: palette.ink,
    },
    rateDivider: {
      width: hairline,
      height: px(18.399),
      backgroundColor: colors.border.subtle,
      marginHorizontal: spacing.sm,
    },
    follow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      borderRadius: radius.tag,
      paddingHorizontal: px(10),
      paddingVertical: px(5),
    },
    followLabel: {
      fontFamily: fontFamily.regular,
      fontSize: px(14),
      color: palette.ink,
    },

    sectionTitle: {
      fontFamily: fontFamily.medium,
      fontSize: px(16),
      color: palette.ink,
    },
    media: {
      gap: spacing.sm,
    },
    mediaTile: {
      width: px(MEDIA_TILE),
      height: px(MEDIA_TILE),
      borderRadius: radius.badge,
    },

    specializations: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: spacing.sm,
    },
    specTag: {
      borderRadius: 50,
      backgroundColor: colors.surface,
      padding: px(5),
    },
    specLabel: {
      fontFamily: fontFamily.regular,
      fontSize: px(10),
      color: palette.inkTag,
    },

    aboutCard: {
      borderRadius: radius.badge,
      borderWidth: 1,
      borderColor: palette.aboutBorder,
      backgroundColor: palette.aboutFill,
      padding: spacing.md,
      gap: 6,
    },
    aboutTitle: {
      fontFamily: fontFamily.medium,
      fontSize: px(14),
      color: palette.ink,
    },
    aboutBody: {
      fontFamily: fontFamily.regular,
      fontSize: px(10),
      lineHeight: px(17),
      color: palette.ink,
    },
    readMore: {
      fontFamily: fontFamily.regular,
      fontSize: px(10),
      lineHeight: px(17),
      color: palette.link,
    },

    ctaBar: {
      alignSelf: 'center',
      width: '100%',
      maxWidth: isTablet ? contentWidth : undefined,
      flexDirection: 'row',
      gap: spacing.md,
      backgroundColor: palette.page,
      paddingHorizontal: spacing.section,
      paddingTop: spacing.md,
    },
    cta: {
      height: px(CTA_HEIGHT),
      borderRadius: radius.button,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: spacing.sm,
      overflow: 'hidden',
    },
    ctaChat: {
      flex: 167,
    },
    ctaCall: {
      flex: 178,
    },
    ctaLabel: {
      fontFamily: fontFamily.medium,
      fontSize: px(16),
      color: colors.text.inverse,
    },
  });
}
