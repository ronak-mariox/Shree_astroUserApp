import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Image,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  type TextProps,
  useWindowDimensions,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BottomTabBar, type TabKey } from '../components/BottomTabBar';
import { BrandGradient } from '../components/BrandGradient';
import { ConsultFilterAppliedDialog } from '../components/ConsultFilterAppliedDialog';
import { useApi } from '../hooks/useApi';
import * as api from '../services/api';
import { portraitOf } from '../utils/images';
import { ConsultFilterSheet } from '../components/ConsultFilterSheet';
import { ArrowLeftIcon } from '../components/icons/ArrowLeftIcon';
import {
  CarouselDotsIcon,
  ChatMarkBody,
  ChatMarkDot1,
  ChatMarkDot2,
  ChatMarkDot3,
  ChatMarkTail,
  ChipAllIcon,
  ChipEducationIcon,
  ChipHealthIcon,
  ChipLoveIcon,
  ChipMarriageIcon,
  ChipWealthIcon,
  LanguageIcon,
  SlidersIcon,
  StarIcon,
  ToggleCallIcon,
  ToggleChatIcon,
  type ConsultIconProps,
} from '../components/icons/ConsultIcons';
import { SearchIcon } from '../components/icons/SearchIcon';
import {
  consultBanner,
  consultCategories,
  consultPalette,
  consultTags,
  type ConsultAstrologer,
  type ConsultCategory,
  type ConsultMode,
} from '../data/consult';
import {
  defaultConsultFilters,
  sortConsultAstrologers,
  type ConsultFilterSelection,
} from '../data/consultFilters';
import { colors, fontFamily, radius } from '../theme';

/**
 * Figma drew this screen on a 402 x 1086 frame (node 180:90120) whose status
 * bar is 43.945pt tall. Every number below is that frame's, and the whole
 * screen is scaled by the device's width over 402 so the proportions Figma
 * drew — a 369pt card carrying three fixed stat columns — survive intact on
 * narrower and wider phones alike.
 */
/**
 * The category chips are the seeker's words; the API stores the topic ids from
 * models/constants.js.
 */
const CATEGORY_TOPICS: Record<Exclude<ConsultCategory, 'all'>, string> = {
  love: 'love-relationship',
  education: 'education',
  marriage: 'marriage',
  wealth: 'wealth-finance',
  health: 'health',
};

const DESIGN_WIDTH = 402;
const DESIGN_STATUS_BAR = 43.945;
/** Top of the header row, measured from the top of the status bar. */
const DESIGN_HEADER_ROW_TOP = 52.523;
const HEADER_ROW_HEIGHT = 40;
const HEADER_HEIGHT = 105;

/** Natural width of each mark, so every icon keeps its drawn proportions. */
const ICON = {
  back: 19.999,
  sliders: 20.902,
  slidersHeight: 16.357,
  search: 15.999,
  toggleChat: 21.5002,
  toggleCall: 17.8125,
  star: 9.99729,
  language: 12.2314,
  dots: 45.7364,
  chatBody: 9.69247,
  chatTail: 8.50782,
  chatDot1: 1.077,
  chatDot2: 1.07695,
  chatDot3: 1.07706,
} as const;

const CHIPS: Record<
  ConsultCategory,
  { Icon: (props: ConsultIconProps) => React.JSX.Element; width: number }
> = {
  all: { Icon: ChipAllIcon, width: 8 },
  love: { Icon: ChipLoveIcon, width: 9.65492 },
  education: { Icon: ChipEducationIcon, width: 8 },
  marriage: { Icon: ChipMarriageIcon, width: 8.04297 },
  wealth: { Icon: ChipWealthIcon, width: 8 },
  health: { Icon: ChipHealthIcon, width: 10 },
};

/**
 * The card packs three fixed-width stat columns into 240pt, so its type has
 * to stay at the size Figma drew it — a device set to a larger or smaller
 * system font would reflow the row. Every label on this screen is set with
 * this component rather than Text.
 */
function Label({ style, children, ...rest }: TextProps) {
  return (
    <Text allowFontScaling={false} style={style} {...rest}>
      {children}
    </Text>
  );
}

type AvailableAstrologersScreenProps = {
  onBack?: () => void;
  onSearch?: () => void;
  onOpenFilters?: () => void;
  onSelectAstrologer?: (astrologer: ConsultAstrologer) => void;
  /** Fired by a card's action button, in whichever mode is selected. */
  onConsult?: (astrologer: ConsultAstrologer, mode: ConsultMode) => void;
  activeTab?: TabKey;
  onSelectTab?: (tab: TabKey) => void;
};

/**
 * The Consult tab — astrologers taking consultations right now, filtered by
 * the question the user came with. Figma: node 180:90120.
 */
export function AvailableAstrologersScreen({
  onBack,
  onSearch,
  onOpenFilters,
  onSelectAstrologer,
  onConsult,
  activeTab = 'consult',
  onSelectTab,
}: AvailableAstrologersScreenProps) {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const scale = width / DESIGN_WIDTH;
  const styles = useMemo(() => createStyles(scale), [scale]);

  const [mode, setMode] = useState<ConsultMode>('chat');
  const [category, setCategory] = useState<ConsultCategory>('all');

  /** The Sort & Filter sheet, and the receipt it leaves behind on Apply. */
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [applied, setApplied] = useState<ConsultFilterSelection>(
    defaultConsultFilters,
  );
  const [appliedShown, setAppliedShown] = useState(false);
  const receipt = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(
    () => () => {
      if (receipt.current !== undefined) {
        clearTimeout(receipt.current);
      }
    },
    [],
  );

  /**
   * The sheet's selections are ids the API already understands, so the whole
   * filter runs on the server rather than over one page of rows.
   *
   * `experience`, `price` and `ratings` arrive as bucket ids like "5-10" or
   * "under-20"; only their lower/upper bound is meaningful to the API.
   */
  const lowestOf = (values: readonly string[]) => {
    const numbers = values.flatMap(value => (value.match(/\d+/g) ?? []).map(Number));
    return numbers.length ? Math.min(...numbers) : undefined;
  };
  const highestOf = (values: readonly string[]) => {
    const numbers = values.flatMap(value => (value.match(/\d+/g) ?? []).map(Number));
    return numbers.length ? Math.max(...numbers) : undefined;
  };

  const directory = useApi(
    () =>
      api.fetchAstrologers({
        expertise: applied.expertise.length ? [...applied.expertise] : undefined,
        languages: applied.language.length ? [...applied.language] : undefined,
        /** The category row above the list — "love", "marriage", and so on. */
        topics: category === 'all' ? undefined : [CATEGORY_TOPICS[category]],
        badges: applied.top.length ? [...applied.top] : undefined,
        gender: applied.gender[0],
        online: applied.status.includes('online') ? true : undefined,
        minExperience: lowestOf(applied.experience),
        maxRate: highestOf(applied.price),
        minRating: lowestOf(applied.ratings),
        limit: 50,
      }),
    [JSON.stringify(applied), category],
  );

  /** One card, in the words this screen prints. */
  const cards = (directory.data?.items ?? []).map(row => {
    const service = mode === 'call' ? row.rates.call : row.rates.chat;

    return {
      id: row.id,
      name: row.name,
      photo: portraitOf(row.photo),
      online: row.online,
      languages: api.joinLabels(row.languages) || '—',
      experience: row.experienceYears ? `${row.experienceYears} Yrs` : '—',
      orders: row.consultations.toLocaleString('en-IN'),
      rating: row.rating ? row.rating.toFixed(1) : '—',
      /** A busy astrologer shows a countdown where the button would be. */
      wait: row.busy && row.waitSeconds ? `Wait ${Math.ceil(row.waitSeconds / 60)} min` : undefined,
      was: service ? `₹${service.was}/min` : '',
      now: row.freeMinutes > 0 ? 'Free' : service ? `₹${service.now}/min` : '—',
    };
  });

  /** The sheet's two sorts are the only part still applied on the client. */
  const results = sortConsultAstrologers(cards, applied);

  return (
    <View style={styles.screen}>
      <StatusBar barStyle="dark-content" />

      <View
        style={[
          styles.header,
          {
            paddingTop:
              insets.top + (DESIGN_HEADER_ROW_TOP - DESIGN_STATUS_BAR) * scale,
          },
        ]}
      >
        <View style={styles.headerRow}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Go back"
            onPress={onBack}
            style={({ pressed }) => [styles.backTile, pressed && styles.dimmed]}
          >
            <ArrowLeftIcon
              size={ICON.back * scale}
              color={colors.border.strong}
            />
          </Pressable>

          <Label style={styles.headerTitle}>Available Astrologers</Label>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Filter astrologers"
            onPress={() => {
              onOpenFilters?.();
              setFiltersOpen(true);
            }}
            style={({ pressed }) => [
              styles.headerIcon,
              pressed && styles.dimmed,
            ]}
          >
            <SlidersIcon
              size={ICON.sliders * scale}
              height={ICON.slidersHeight * scale}
            />
          </Pressable>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Search astrologers"
            onPress={onSearch}
            style={({ pressed }) => [
              styles.headerIcon,
              styles.headerIconLast,
              pressed && styles.dimmed,
            ]}
          >
            <SearchIcon
              size={ICON.search * scale}
              color={colors.border.strong}
            />
          </Pressable>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 20 * scale + insets.bottom }}
      >
        <View style={styles.modes}>
          {(['chat', 'call'] as const).map(option => {
            const selected = option === mode;
            const label = option === 'chat' ? 'Chat' : 'Call';
            const tint = selected
              ? colors.text.inverse
              : consultPalette.callAccent;

            return (
              <Pressable
                key={option}
                accessibilityRole="tab"
                accessibilityState={{ selected }}
                accessibilityLabel={`${label} consultations`}
                onPress={() => setMode(option)}
                style={({ pressed }) => [
                  styles.mode,
                  selected ? styles.modeOn : styles.modeOff,
                  pressed && styles.dimmed,
                ]}
              >
                {selected && (
                  <BrandGradient
                    radius={radius.button * scale}
                    angle="horizontal"
                  />
                )}
                {option === 'chat' ? (
                  <ToggleChatIcon
                    size={ICON.toggleChat * scale}
                    color={tint}
                  />
                ) : (
                  <ToggleCallIcon
                    size={ICON.toggleCall * scale}
                    color={tint}
                  />
                )}
                <Label style={[styles.modeLabel, { color: tint }]}>{label}</Label>
              </Pressable>
            );
          })}
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chips}
        >
          {consultCategories.map(option => {
            const selected = option.key === category;
            const { Icon, width: iconWidth } = CHIPS[option.key];

            return (
              <Pressable
                key={option.key}
                accessibilityRole="tab"
                accessibilityState={{ selected }}
                onPress={() => setCategory(option.key)}
                style={[
                  styles.chip,
                  { width: option.width * scale },
                  selected ? styles.chipOn : styles.chipOff,
                ]}
              >
                <Icon size={iconWidth * scale} />
                <Label
                  numberOfLines={1}
                  style={selected ? styles.chipLabelOn : styles.chipLabelOff}
                >
                  {option.label}
                </Label>
              </Pressable>
            );
          })}
        </ScrollView>

        <View style={styles.banner}>
          <View style={styles.bannerFrame}>
            <Image
              source={consultBanner.image}
              style={styles.bannerImage}
              accessibilityLabel={consultBanner.headline}
              accessible
            />
          </View>
          <View style={styles.dots}>
            <CarouselDotsIcon size={ICON.dots * scale} />
          </View>
        </View>

        <View style={styles.list}>
          {results.length === 0 ? (
            <Label style={styles.empty}>
              No astrologers match these filters.
            </Label>
          ) : (
            results.map(astrologer => (
              <AstrologerCard
                key={astrologer.id}
                astrologer={astrologer}
                mode={mode}
                scale={scale}
                styles={styles}
                onPress={() => onSelectAstrologer?.(astrologer)}
                onConsult={() => onConsult?.(astrologer, mode)}
              />
            ))
          )}
        </View>
      </ScrollView>

      <BottomTabBar active={activeTab} onSelect={onSelectTab} />

      <ConsultFilterSheet
        visible={filtersOpen}
        value={applied}
        onClose={() => setFiltersOpen(false)}
        onApply={selection => {
          setApplied(selection);
          setFiltersOpen(false);
          // Let the sheet finish sliding out before the receipt takes its
          // place — iOS refuses to present a modal over one still dismissing.
          receipt.current = setTimeout(() => setAppliedShown(true), 220);
        }}
      />

      <ConsultFilterAppliedDialog
        visible={appliedShown}
        onDismiss={() => setAppliedShown(false)}
      />
    </View>
  );
}

type AstrologerCardProps = {
  astrologer: ConsultAstrologer;
  mode: ConsultMode;
  scale: number;
  styles: ReturnType<typeof createStyles>;
  onPress?: () => void;
  onConsult?: () => void;
};

/** One row of the directory (Figma nodes 180:90179, 180:90390). */
function AstrologerCard({
  astrologer,
  mode,
  scale,
  styles,
  onPress,
  onConsult,
}: AstrologerCardProps) {
  const { online } = astrologer;
  const actionLabel = mode === 'call' ? 'Call' : 'Chat';
  const markColor = online ? colors.border.strong : consultPalette.disabled;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${astrologer.name}, ${astrologer.languages}, ${astrologer.experience} experience`}
      onPress={onPress}
      style={({ pressed }) => [styles.card, pressed && styles.dimmed]}
    >
      <View style={styles.cardTop}>
        {/* The asset is already cropped to Figma's window, and Figma squeezes
            that square crop into a taller tile — hence "stretch". It runs the
            full 90 x 111 of the tile, under the stroke rather than inside it. */}
        <View style={styles.photoFrame}>
          <Image
            source={astrologer.photo}
            style={styles.photo}
            resizeMode="stretch"
          />
        </View>

        <View style={styles.column}>
          <View style={styles.nameRow}>
            <Label style={styles.name}>{astrologer.name}</Label>
            {online ? (
              <View style={styles.onlineHalo}>
                <View style={styles.onlineCore} />
              </View>
            ) : (
              <View style={styles.offlineDot} />
            )}
          </View>

          <View style={styles.languages}>
            <LanguageIcon size={ICON.language * scale} />
            <Label style={styles.languagesLabel}>{astrologer.languages}</Label>
          </View>

          <View style={styles.tags}>
            {consultTags.map((tag, index) => (
              <View
                key={tag.label}
                style={[
                  styles.tag,
                  { backgroundColor: tag.fill, width: tag.width * scale },
                  index === consultTags.length - 1 && styles.tagOverflow,
                ]}
              >
                <Label numberOfLines={1} style={styles.tagLabel}>
                  {tag.label}
                </Label>
              </View>
            ))}
          </View>

          <View style={styles.stats}>
            <View style={styles.statExperience}>
              <Label style={styles.statValue}>{astrologer.experience}</Label>
              <Label style={styles.statLabel}>Experience</Label>
            </View>

            <View style={styles.statDivider} />

            <View style={styles.statOrders}>
              <Label style={styles.statValue}>{astrologer.orders}</Label>
              <Label style={styles.statLabel}>Orders</Label>
            </View>

            <View style={styles.statDivider} />

            <View style={styles.statRating}>
              <View style={styles.ratingRow}>
                {online && <StarIcon size={ICON.star * scale} />}
                <Label style={styles.statValue}>{astrologer.rating}</Label>
              </View>
              <Label style={styles.statLabel}>Star Ratings</Label>
            </View>
          </View>
        </View>
      </View>

      <View style={styles.footer}>
        <View style={styles.waitSlot}>
          {astrologer.wait !== undefined && (
            <Label style={styles.wait}>{astrologer.wait}</Label>
          )}
        </View>

        <Label style={styles.was}>{astrologer.was}</Label>
        <Label
          style={[
            styles.now,
            astrologer.now === 'Free' ? styles.nowFree : styles.nowPaid,
          ]}
        >
          {astrologer.now}
        </Label>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`${actionLabel} with ${astrologer.name}`}
          accessibilityState={{ disabled: !online }}
          disabled={!online}
          onPress={onConsult}
          style={({ pressed }) => [
            styles.action,
            { borderColor: markColor },
            pressed && styles.dimmed,
          ]}
        >
          {mode === 'call' ? (
            <ToggleCallIcon
              size={ICON.chatBody * scale}
              color={markColor}
            />
          ) : (
            <View style={styles.chatMark}>
              <ChatMarkBody size={ICON.chatBody * scale} color={markColor} />
              <View style={styles.chatMarkTail}>
                <ChatMarkTail size={ICON.chatTail * scale} color={markColor} />
              </View>
              <View style={styles.chatMarkDot1}>
                <ChatMarkDot1 size={ICON.chatDot1 * scale} color={markColor} />
              </View>
              <View style={styles.chatMarkDot2}>
                <ChatMarkDot2 size={ICON.chatDot2 * scale} color={markColor} />
              </View>
              <View style={styles.chatMarkDot3}>
                <ChatMarkDot3 size={ICON.chatDot3 * scale} color={markColor} />
              </View>
            </View>
          )}
          <Label style={[styles.actionLabel, { color: markColor }]}>
            {actionLabel}
          </Label>
        </Pressable>
      </View>
    </Pressable>
  );
}

function createStyles(scale: number) {
  /** A Figma measurement, in device points. */
  const px = (value: number) => value * scale;

  return StyleSheet.create({
    screen: {
      flex: 1,
      backgroundColor: consultPalette.canvas,
    },
    dimmed: {
      opacity: 0.85,
    },

    header: {
      backgroundColor: colors.brandYellow,
      paddingLeft: px(16),
      paddingRight: px(16.5),
      // The 105pt header, less the row sitting at its top.
      paddingBottom: px(HEADER_HEIGHT - DESIGN_HEADER_ROW_TOP - HEADER_ROW_HEIGHT),
    },
    headerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      height: px(HEADER_ROW_HEIGHT),
    },
    backTile: {
      width: px(28),
      height: px(28),
      alignItems: 'center',
      justifyContent: 'center',
    },
    headerTitle: {
      fontFamily: fontFamily.regular,
      fontSize: px(18),
      lineHeight: px(HEADER_ROW_HEIGHT),
      color: colors.text.onYellow,
      flex: 1,
      paddingLeft: px(5),
    },
    headerIcon: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: px(5),
      marginRight: px(9.1),
    },
    headerIconLast: {
      marginRight: px(-5),
    },

    modes: {
      flexDirection: 'row',
      gap: px(20),
      paddingHorizontal: px(16),
      // 120.119 down the frame, with the header ending at 105.
      paddingTop: px(15.118),
    },
    mode: {
      flex: 1,
      height: px(48),
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      overflow: 'hidden',
    },
    modeOn: {
      borderRadius: px(radius.button),
      gap: px(3),
    },
    modeOff: {
      borderRadius: px(radius.icon),
      borderWidth: 1,
      borderColor: consultPalette.callBorder,
      gap: px(8),
      opacity: 0.88,
    },
    modeLabel: {
      fontFamily: fontFamily.medium,
      fontSize: px(16),
      lineHeight: px(24),
    },

    chips: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: px(7.446),
      paddingHorizontal: px(16),
      // 183.119 down the frame, with the toggles ending at 168.119.
      paddingTop: px(15),
    },
    /** Width comes from the category, so the row measures Figma's 373.2. */
    chip: {
      height: px(24),
      flexDirection: 'row',
      alignItems: 'center',
      gap: px(4),
      paddingLeft: px(5),
      borderRadius: px(71),
      backgroundColor: colors.surface,
    },
    chipOn: {
      borderWidth: 0.5,
      borderColor: colors.border.strong,
    },
    chipOff: {
      borderWidth: 1,
      borderColor: consultPalette.chipBorder,
    },
    chipLabelOn: {
      fontFamily: fontFamily.medium,
      fontSize: px(10),
      lineHeight: px(15),
      color: colors.border.strong,
    },
    chipLabelOff: {
      fontFamily: fontFamily.regular,
      fontSize: px(10),
      lineHeight: px(15),
      color: consultPalette.chipIdleText,
    },

    banner: {
      alignItems: 'center',
      // 223.345 down the frame, with the chips ending at 207.119.
      paddingTop: px(16.226),
    },
    /** The export is 370 x 102.27, but its art stops at 55.667. */
    bannerFrame: {
      width: px(370.035),
      height: px(55.667),
      overflow: 'hidden',
    },
    bannerImage: {
      width: px(370.035),
      height: px(102.275),
    },
    dots: {
      paddingTop: px(8.62),
    },

    list: {
      alignItems: 'center',
      // 296.319 down the frame, with the pagination ending at 291.632.
      paddingTop: px(4.687),
      gap: px(16),
    },
    /** Stands in for the cards when the filters sift everyone out. */
    empty: {
      fontFamily: fontFamily.regular,
      fontSize: px(13),
      lineHeight: px(20),
      color: consultPalette.ink,
      paddingTop: px(40),
    },
    card: {
      width: px(369),
      borderRadius: px(10),
      borderWidth: px(1),
      borderColor: consultPalette.cardBorder,
      backgroundColor: colors.surface,
      // Figma strokes sit on the box edge; RN's sit inside it, so every
      // padding is short by the border it now has to clear.
      paddingTop: px(12),
      paddingLeft: px(12.163),
      paddingRight: px(7.5),
      paddingBottom: px(10.44),
    },
    cardTop: {
      flexDirection: 'row',
    },
    photoFrame: {
      width: px(90),
      height: px(111),
      borderRadius: px(11),
      borderWidth: px(1),
      borderColor: consultPalette.photoBorder,
      backgroundColor: colors.surface,
      overflow: 'hidden',
    },
    photo: {
      position: 'absolute',
      left: px(-1),
      top: px(-1),
      width: px(90),
      height: px(111),
    },
    /** The photo ends at 103.163; the copy column starts at 117. */
    column: {
      flex: 1,
      marginLeft: px(13.837),
    },
    nameRow: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    name: {
      fontFamily: fontFamily.medium,
      fontSize: px(14),
      lineHeight: px(21),
      color: consultPalette.ink,
      /** Figma's own 85pt box, so the bead beside it lands on 204.57. */
      minWidth: px(85),
    },
    onlineHalo: {
      width: px(11.76),
      height: px(11.76),
      borderRadius: px(5.88),
      backgroundColor: consultPalette.onlineHalo,
      alignItems: 'center',
      justifyContent: 'center',
      marginLeft: px(4.1),
    },
    onlineCore: {
      width: px(6.8),
      height: px(6.8),
      borderRadius: px(3.4),
      backgroundColor: consultPalette.online,
    },
    offlineDot: {
      width: px(12),
      height: px(12),
      borderRadius: px(6),
      backgroundColor: consultPalette.offline,
      marginLeft: px(4),
    },
    languages: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: px(7.814),
      height: px(15),
      marginTop: px(2.971),
    },
    languagesLabel: {
      fontFamily: fontFamily.regular,
      fontSize: px(10),
      lineHeight: px(15),
      color: consultPalette.ink,
    },

    /** 246 wide, which overhangs the copy column exactly as Figma drew it. */
    tags: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: px(2),
      width: px(246),
      height: px(16),
      marginTop: px(9.235),
      overflow: 'hidden',
    },
    tag: {
      height: px(16),
      borderRadius: px(44),
      alignItems: 'center',
      justifyContent: 'center',
    },
    /** The "+2" counter is clipped by the row, so only its left end is round. */
    tagOverflow: {
      alignItems: 'flex-start',
      paddingLeft: px(3.754),
      borderTopRightRadius: 0,
      borderBottomRightRadius: 0,
    },
    tagLabel: {
      fontFamily: fontFamily.medium,
      fontSize: px(8),
      lineHeight: px(12),
      color: consultPalette.ink,
    },

    /**
     * Figma centres the three figures on 148 / 236 / 327 and rules the gaps
     * at 197 and 275. The cells run a little wider than the labels they hold
     * so Poppins Regular can stand in for the Light weight Figma used.
     */
    stats: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: px(13.229),
      marginLeft: px(1),
    },
    statExperience: {
      width: px(60),
      alignItems: 'center',
    },
    statOrders: {
      width: px(40),
      alignItems: 'center',
    },
    statRating: {
      width: px(62),
      alignItems: 'center',
    },
    statDivider: {
      width: 1,
      height: px(30),
      borderRadius: 0.5,
      backgroundColor: colors.border.rule,
      marginHorizontal: px(19),
    },
    ratingRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: px(1.621),
      height: px(15),
    },
    statValue: {
      fontFamily: fontFamily.medium,
      fontSize: px(10),
      lineHeight: px(15),
      color: colors.border.strong,
    },
    statLabel: {
      fontFamily: fontFamily.regular,
      fontSize: px(10),
      lineHeight: px(15),
      color: consultPalette.inkStrong,
    },

    footer: {
      flexDirection: 'row',
      alignItems: 'center',
      height: px(26.664),
      // The photo ends at 124; the action button starts at 135.895.
      marginTop: px(11.895),
      paddingLeft: px(9.5),
    },
    waitSlot: {
      width: px(94.337),
    },
    wait: {
      fontFamily: fontFamily.regular,
      fontSize: px(12),
      lineHeight: px(18),
      color: consultPalette.wait,
    },
    was: {
      fontFamily: fontFamily.regular,
      fontSize: px(12),
      lineHeight: px(18),
      color: consultPalette.wait,
      textDecorationLine: 'line-through',
      /** 117 to 174 — the new price starts on its own mark, not after it. */
      width: px(57),
    },
    now: {
      fontFamily: fontFamily.medium,
      fontSize: px(16),
      lineHeight: px(21),
    },
    nowFree: {
      color: consultPalette.free,
    },
    nowPaid: {
      color: colors.border.strong,
    },

    action: {
      width: px(90),
      height: px(26.664),
      borderRadius: px(8),
      borderWidth: 1,
      backgroundColor: colors.surface,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: px(7.485),
      marginLeft: 'auto',
    },
    actionLabel: {
      fontFamily: fontFamily.medium,
      fontSize: px(14),
      lineHeight: px(21),
    },
    chatMark: {
      width: px(13.785),
      height: px(12.931),
    },
    chatMarkTail: {
      position: 'absolute',
      left: px(5.281),
      top: px(3.235),
    },
    chatMarkDot1: {
      position: 'absolute',
      left: px(1.51),
      top: px(3.235),
    },
    chatMarkDot2: {
      position: 'absolute',
      left: px(3.66),
      top: px(3.235),
    },
    chatMarkDot3: {
      position: 'absolute',
      left: px(5.82),
      top: px(3.235),
    },
  });
}
