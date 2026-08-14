import React from 'react';
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
  AnonymousIcon,
  BackArrowIcon,
  CallNowIcon,
  CallRateIcon,
  CaretDownIcon,
  ChatNowIcon,
  ChatRateIcon,
  FollowIcon,
  KebabIcon,
  LanguageIcon,
  StarRowIcon,
  WalletBadgeIcon,
} from '../components/icons/DetailIcons';
import {
  astrologerProfile as profile,
  detailPalette as palette,
} from '../data/astrologerProfile';
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
const BAR_TRACK = 205.4;
const BAR_HEIGHT = 5;
const CTA_HEIGHT = 49;
const REVIEW_AVATAR = 30;

type AstrologerDetailScreenProps = {
  onBack?: () => void;
  onFollow?: () => void;
  onChat?: () => void;
  onCall?: () => void;
};

/**
 * Full astrologer profile: identity, rates, media, specialities, bio and
 * reviews. Figma: node 180:164498.
 *
 * The frame is drawn in its own visual language, so its greys, pastel pills
 * and wide radii come from `detailPalette` rather than the shared theme.
 */
export function AstrologerDetailScreen({
  onBack,
  onFollow,
  onChat,
  onCall,
}: AstrologerDetailScreenProps) {
  const insets = useSafeAreaInsets();

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
                insets.top + (DESIGN_PADDING_TOP - designFrame.statusBarHeight),
            },
          ]}
        >
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Go back"
            onPress={onBack}
            style={({ pressed }) => [styles.back, pressed && styles.pressed]}
          >
            <BackArrowIcon />
          </Pressable>

          <View style={styles.walletPill}>
            <WalletBadgeIcon />
            <Text style={styles.walletLabel}>{profile.walletBalance}</Text>
          </View>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="More options"
            style={({ pressed }) => [styles.kebab, pressed && styles.pressed]}
          >
            <KebabIcon />
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
                  <LanguageIcon />
                  <Text style={styles.languages}>{profile.languages}</Text>
                </View>
              </View>
            </View>

            <View style={styles.stats}>
              {profile.stats.map((stat, index) => (
                <React.Fragment key={stat.label}>
                  {index > 0 && <View style={styles.statDivider} />}
                  <View style={styles.stat}>
                    {stat.stars === true && <StarRowIcon size={59} />}
                    <Text style={styles.statValue}>{stat.value}</Text>
                    <Text style={styles.statLabel}>{stat.label}</Text>
                  </View>
                </React.Fragment>
              ))}
            </View>
          </View>

          <View style={styles.rateCard}>
            <View style={styles.rate}>
              <ChatRateIcon />
              <View>
                <Text style={styles.rateWas}>{profile.rates.chat.was}</Text>
                <Text style={styles.rateNow}>{profile.rates.chat.now}</Text>
              </View>
            </View>

            <View style={styles.rateDivider} />

            <View style={styles.rate}>
              <View style={styles.callRateBox}>
                <CallRateIcon />
              </View>
              <View>
                <Text style={styles.rateWas}>{profile.rates.call.was}</Text>
                <Text style={styles.rateNow}>{profile.rates.call.now}</Text>
              </View>
            </View>

            <View style={styles.rateDivider} />

            <Pressable
              accessibilityRole="button"
              onPress={onFollow}
              style={({ pressed }) => [styles.follow, pressed && styles.pressed]}
            >
              <FollowIcon />
              <Text style={styles.followLabel}>Follow</Text>
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
            <Text style={styles.aboutBody}>
              {profile.about}
              <Text style={styles.readMore}>Read More</Text>
            </Text>
          </View>

          <View style={styles.reviewHeader}>
            <Text style={styles.reviewTitle}>Rating and Review</Text>
            <Pressable
              accessibilityRole="button"
              style={({ pressed }) => [
                styles.reviewFilter,
                pressed && styles.pressed,
              ]}
            >
              <Text style={styles.reviewFilterLabel}>All</Text>
              <View style={styles.caret}>
                <CaretDownIcon />
              </View>
            </Pressable>
          </View>

          <View style={styles.summary}>
            <View style={styles.score}>
              <Text style={styles.scoreValue}>
                {profile.score.value}
                <Text style={styles.scoreOutOf}> {profile.score.outOf}</Text>
              </Text>
              <StarRowIcon size={59} />
            </View>

            <View style={styles.histogram}>
              {profile.histogram.map(row => (
                <View key={row.rating} style={styles.histogramRow}>
                  <Text style={styles.histogramRating}>{row.rating}</Text>
                  <View style={styles.barTrack}>
                    <View
                      style={[
                        styles.barFill,
                        {
                          width: `${row.ratio * 100}%`,
                          backgroundColor: row.color,
                        },
                      ]}
                    />
                  </View>
                  <Text style={styles.histogramCount}>{row.count}</Text>
                </View>
              ))}
            </View>
          </View>

          {profile.reviews.map(review => (
            <View key={review.id} style={styles.review}>
              <View style={styles.reviewTop}>
                {review.avatar === undefined ? (
                  <View style={styles.reviewAvatarPlaceholder}>
                    <AnonymousIcon />
                  </View>
                ) : (
                  <Image
                    source={review.avatar}
                    style={styles.reviewAvatar}
                    resizeMode="cover"
                  />
                )}

                <View style={styles.reviewCopy}>
                  <Text style={styles.reviewAuthor}>{review.author}</Text>
                  <StarRowIcon size={59} />
                </View>

                <Text style={styles.reviewDate}>{review.date}</Text>
              </View>

              <Text style={styles.reviewBody}>{review.body}</Text>

              {review.reply !== undefined && (
                <View style={styles.reply}>
                  <View style={styles.replyAccent} />
                  <View style={styles.replyBody}>
                    <Text style={styles.replyAuthor}>
                      {review.reply.author}
                    </Text>
                    <Text style={styles.replyText}>{review.reply.body}</Text>
                  </View>
                </View>
              )}
            </View>
          ))}
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
          <ChatNowIcon />
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
          <CallNowIcon />
          <Text style={styles.ctaLabel}>Call Now</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
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
    height: 35.66,
    borderRadius: radius.chip - 2,
    backgroundColor: colors.surface,
    paddingHorizontal: 10,
  },
  walletLabel: {
    fontFamily: fontFamily.medium,
    fontSize: 12,
    letterSpacing: -0.25,
    color: colors.text.ink,
  },
  kebab: {
    width: 24,
    alignItems: 'center',
  },
  waitTime: {
    fontFamily: fontFamily.regular,
    fontSize: 10,
    color: colors.text.onYellow,
    backgroundColor: colors.brandYellow,
    paddingLeft: 44,
    paddingBottom: spacing.rowGap,
  },

  body: {
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
    width: PORTRAIT,
    height: PORTRAIT,
    borderRadius: PORTRAIT / 2,
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
    fontSize: 14,
    color: palette.ink,
  },
  onlineDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.success.accent,
  },
  tags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 5,
  },
  tag: {
    height: 16,
    borderRadius: 44,
    justifyContent: 'center',
    paddingHorizontal: 7,
  },
  tagLabel: {
    fontFamily: fontFamily.medium,
    fontSize: 8,
    color: palette.ink,
  },
  languageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  languages: {
    fontFamily: fontFamily.regular,
    fontSize: 10,
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
    height: 30,
    backgroundColor: colors.border.subtle,
  },
  statValue: {
    fontFamily: fontFamily.medium,
    fontSize: 10,
    color: palette.ink,
  },
  statLabel: {
    fontFamily: fontFamily.regular,
    fontSize: 10,
    color: palette.inkStrong,
  },

  rateCard: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 55.613,
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
    width: 26,
    height: 26,
    borderRadius: radius.bubbleTail,
    borderWidth: 1,
    borderColor: '#407FEE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  rateWas: {
    fontFamily: fontFamily.regular,
    fontSize: 10,
    color: palette.muted,
    textDecorationLine: 'line-through',
  },
  rateNow: {
    fontFamily: fontFamily.medium,
    fontSize: 13,
    color: palette.ink,
  },
  rateDivider: {
    width: hairline,
    height: 18.399,
    backgroundColor: colors.border.subtle,
    marginHorizontal: spacing.sm,
  },
  follow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: radius.tag,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  followLabel: {
    fontFamily: fontFamily.regular,
    fontSize: 14,
    color: palette.ink,
  },

  sectionTitle: {
    fontFamily: fontFamily.medium,
    fontSize: 16,
    color: palette.ink,
  },
  media: {
    gap: spacing.sm,
  },
  mediaTile: {
    width: MEDIA_TILE,
    height: MEDIA_TILE,
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
    padding: 5,
  },
  specLabel: {
    fontFamily: fontFamily.regular,
    fontSize: 10,
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
    fontSize: 14,
    color: palette.ink,
  },
  aboutBody: {
    fontFamily: fontFamily.regular,
    fontSize: 10,
    lineHeight: 17,
    color: palette.ink,
  },
  readMore: {
    color: palette.link,
  },

  reviewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  reviewTitle: {
    fontFamily: fontFamily.medium,
    fontSize: 14,
    color: palette.ink,
  },
  reviewFilter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    height: 29.639,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: palette.filterBorder,
    backgroundColor: palette.aboutFill,
    paddingHorizontal: 11.85,
  },
  reviewFilterLabel: {
    fontFamily: fontFamily.medium,
    fontSize: 12,
    color: palette.ink,
  },
  caret: {
    transform: [{ rotate: '90deg' }],
  },

  summary: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  score: {
    alignItems: 'center',
    gap: 4,
  },
  scoreValue: {
    fontFamily: fontFamily.semiBold,
    fontSize: 30,
    color: palette.inkScore,
  },
  scoreOutOf: {
    fontSize: 18,
  },
  histogram: {
    flex: 1,
    gap: 4,
  },
  histogramRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  histogramRating: {
    fontFamily: fontFamily.regular,
    fontSize: 12,
    color: palette.muted,
    width: 10,
  },
  barTrack: {
    flex: 1,
    maxWidth: BAR_TRACK,
    height: BAR_HEIGHT,
    borderRadius: BAR_HEIGHT / 2,
    backgroundColor: palette.barTrack,
    overflow: 'hidden',
  },
  barFill: {
    height: BAR_HEIGHT,
    borderRadius: BAR_HEIGHT / 2,
  },
  histogramCount: {
    fontFamily: fontFamily.regular,
    fontSize: 12,
    color: palette.muted,
    width: 30,
    textAlign: 'right',
  },

  review: {
    borderTopWidth: hairline,
    borderTopColor: colors.border.subtle,
    paddingTop: spacing.md,
    gap: 6,
  },
  reviewTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  reviewAvatar: {
    width: REVIEW_AVATAR,
    height: REVIEW_AVATAR,
    borderRadius: REVIEW_AVATAR / 2,
  },
  reviewAvatarPlaceholder: {
    width: REVIEW_AVATAR,
    height: REVIEW_AVATAR,
    borderRadius: REVIEW_AVATAR / 2,
    backgroundColor: colors.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  reviewCopy: {
    flex: 1,
    gap: 2,
  },
  reviewAuthor: {
    fontFamily: fontFamily.medium,
    fontSize: 10,
    color: palette.inkTag,
  },
  reviewDate: {
    fontFamily: fontFamily.regular,
    fontSize: 10,
    color: palette.ink,
    opacity: 0.6,
  },
  reviewBody: {
    fontFamily: fontFamily.regular,
    fontSize: 10,
    color: palette.ink,
    opacity: 0.6,
  },
  reply: {
    flexDirection: 'row',
    height: 34,
    borderRadius: 5,
    overflow: 'hidden',
    marginLeft: REVIEW_AVATAR + spacing.sm,
  },
  replyAccent: {
    width: 2,
    backgroundColor: palette.replyAccent,
  },
  replyBody: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: palette.replyFill,
    paddingHorizontal: spacing.sm,
  },
  replyAuthor: {
    fontFamily: fontFamily.medium,
    fontSize: 10,
    color: palette.inkTag,
  },
  replyText: {
    // Figma sets this in Poppins Light; only four weights are bundled, so the
    // nearest available (Regular) is used.
    fontFamily: fontFamily.regular,
    fontSize: 10,
    color: palette.ink,
  },

  ctaBar: {
    flexDirection: 'row',
    gap: spacing.md,
    backgroundColor: palette.page,
    paddingHorizontal: spacing.section,
    paddingTop: spacing.md,
  },
  cta: {
    height: CTA_HEIGHT,
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
    fontSize: 16,
    color: colors.text.inverse,
  },
});
