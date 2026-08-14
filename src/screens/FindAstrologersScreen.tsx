import React, { useState } from 'react';
import {
  Image,
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BottomTabBar, type TabKey } from '../components/BottomTabBar';
import { BrandGradient } from '../components/BrandGradient';
import { MessageIcon } from '../components/icons/MenuIcons';
import {
  ClockIcon,
  FileLinesIcon,
  GlobeIcon,
  PhoneLargeIcon,
} from '../components/icons/MetaIcons';
import { SearchIcon } from '../components/icons/SearchIcon';
import {
  directory,
  directoryFilters,
  type DirectoryAstrologer,
  type DirectoryFilter,
} from '../data/astrologers';
import {
  colors,
  designFrame,
  hairline,
  radius,
  spacing,
  stroke,
  typography,
} from '../theme';

/** Top padding Figma drew, measured from the top of the status bar. */
const DESIGN_PADDING_TOP = 56;
const SEARCH_HEIGHT = 45.992;
const SEARCH_ICON = 15.999;
const CHIP_HEIGHT = 33.993;
const CHIP_DOT = 6.997;
const AVATAR_SIZE = 59.998;
const STATUS_DOT = 12;
const META_ICON = 10.997;
const ACTION_HEIGHT = 37.993;
const ACTION_ICON = 13.994;

type FindAstrologersScreenProps = {
  onSelectAstrologer?: (astrologer: DirectoryAstrologer) => void;
  onChat?: (astrologer: DirectoryAstrologer) => void;
  onCall?: (astrologer: DirectoryAstrologer) => void;
  activeTab?: TabKey;
  onSelectTab?: (tab: TabKey) => void;
};

/**
 * Searchable directory of astrologers. Figma: node 180:163904.
 */
export function FindAstrologersScreen({
  onSelectAstrologer,
  onChat,
  onCall,
  activeTab = 'home',
  onSelectTab,
}: FindAstrologersScreenProps) {
  const insets = useSafeAreaInsets();
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<DirectoryFilter>('all');

  const term = query.trim().toLowerCase();
  const results = directory.filter(astrologer => {
    const matchesFilter =
      filter === 'all' || astrologer.tags.includes(filter);
    const matchesQuery =
      term.length === 0 ||
      astrologer.name.toLowerCase().includes(term) ||
      astrologer.specialities.toLowerCase().includes(term);
    return matchesFilter && matchesQuery;
  });

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
        <Text style={styles.title}>Find Astrologers</Text>
        <Text style={styles.subtitle}>200+ expert astrologers online</Text>

        <View style={styles.search}>
          <View style={styles.searchIcon} pointerEvents="none">
            <SearchIcon
              size={SEARCH_ICON}
              color={colors.text.onYellowGhost}
            />
          </View>
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Search astrologers, specializations..."
            placeholderTextColor={colors.text.onYellowMuted}
            accessibilityLabel="Search astrologers"
            style={styles.searchInput}
          />
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: spacing.md + insets.bottom }}
      >
        <View style={styles.filters}>
          {directoryFilters.map(option => {
            const selected = option.key === filter;

            return (
              <Pressable
                key={option.key}
                accessibilityRole="tab"
                accessibilityState={{ selected }}
                onPress={() => setFilter(option.key)}
                style={[
                  styles.chip,
                  selected ? styles.chipSelected : styles.chipIdle,
                ]}
              >
                {option.dot === true && <View style={styles.chipDot} />}
                <Text style={selected ? styles.chipOn : styles.chipOff}>
                  {option.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <View style={styles.list}>
          {results.map(astrologer => (
            <Pressable
              key={astrologer.id}
              accessibilityRole="button"
              accessibilityLabel={`${astrologer.name}. ${astrologer.specialities}`}
              onPress={() => onSelectAstrologer?.(astrologer)}
              style={({ pressed }) => [styles.card, pressed && styles.pressed]}
            >
              <View style={styles.cardTop}>
                <View style={styles.avatarWrapper}>
                  <Image
                    source={astrologer.photo}
                    style={styles.avatar}
                    resizeMode="cover"
                  />
                  {astrologer.online && <View style={styles.statusDot} />}
                </View>

                <View style={styles.cardCopy}>
                  <View style={styles.nameRow}>
                    <Text style={styles.name}>{astrologer.name}</Text>
                    <Text style={styles.rate}>{astrologer.rate}</Text>
                  </View>

                  <Text style={styles.specialities}>
                    {astrologer.specialities}
                  </Text>

                  <View style={styles.metaRow}>
                    <View style={styles.metaChip}>
                      <ClockIcon size={META_ICON} />
                      <Text style={styles.metaLabel}>
                        {astrologer.experience}
                      </Text>
                    </View>
                    <View style={styles.metaChip}>
                      <GlobeIcon size={META_ICON} />
                      <Text style={styles.metaLabel}>
                        {astrologer.languages}
                      </Text>
                    </View>
                    <View style={styles.metaChip}>
                      <FileLinesIcon size={META_ICON} />
                      <Text style={styles.metaLabel}>
                        {astrologer.consults}
                      </Text>
                    </View>
                  </View>
                </View>
              </View>

              <View style={styles.actions}>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`Chat with ${astrologer.name}`}
                  onPress={() => onChat?.(astrologer)}
                  style={({ pressed }) => [
                    styles.action,
                    pressed && styles.pressed,
                  ]}
                >
                  <BrandGradient radius={radius.button} />
                  <MessageIcon size={ACTION_ICON} />
                  <Text style={styles.actionLabel}>Chat</Text>
                </Pressable>

                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`Call ${astrologer.name}`}
                  onPress={() => onCall?.(astrologer)}
                  style={({ pressed }) => [
                    styles.action,
                    pressed && styles.pressed,
                  ]}
                >
                  <BrandGradient radius={radius.button} />
                  <PhoneLargeIcon size={ACTION_ICON} />
                  <Text style={styles.actionLabel}>Call</Text>
                </Pressable>
              </View>
            </Pressable>
          ))}
        </View>
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
  title: {
    ...typography.pageTitle,
    color: colors.text.onYellow,
  },
  subtitle: {
    ...typography.footnote,
    color: colors.text.onYellowMuted,
    paddingTop: spacing.xs,
  },
  search: {
    justifyContent: 'center',
    marginTop: spacing.section,
  },
  searchIcon: {
    position: 'absolute',
    left: 13.99,
    zIndex: 1,
  },
  searchInput: {
    ...typography.chatInput,
    height: SEARCH_HEIGHT,
    borderRadius: radius.field,
    borderWidth: hairline,
    borderColor: colors.border.faint,
    backgroundColor: colors.glass.dimSoft,
    color: colors.text.onYellow,
    paddingLeft: 42.755,
    paddingRight: 14.755,
    paddingVertical: 0,
  },

  filters: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.rowGap,
    paddingBottom: spacing.xs,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    height: CHIP_HEIGHT,
    borderRadius: radius.badge,
    borderWidth: hairline,
    backgroundColor: colors.surface,
    paddingHorizontal: 14.755,
    paddingVertical: hairline,
  },
  chipSelected: {
    borderColor: colors.border.strong,
  },
  chipIdle: {
    borderColor: colors.border.subtle,
  },
  chipDot: {
    width: CHIP_DOT,
    height: CHIP_DOT,
    borderRadius: CHIP_DOT / 2,
    backgroundColor: colors.success.accent,
  },
  chipOn: {
    ...typography.footnoteStrong,
    color: colors.border.strong,
    textAlign: 'center',
  },
  chipOff: {
    ...typography.footnote,
    color: colors.text.secondary,
    textAlign: 'center',
  },

  list: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    gap: spacing.xl,
  },
  card: {
    borderRadius: radius.card,
    borderWidth: hairline,
    borderColor: colors.border.subtle,
    backgroundColor: colors.surface,
    padding: 16.755,
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
  pressed: {
    opacity: 0.85,
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.rowGap,
  },
  avatarWrapper: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
  },
  avatar: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: radius.summary,
    borderWidth: stroke,
    borderColor: colors.status.infoTint,
  },
  statusDot: {
    position: 'absolute',
    left: 46,
    top: 50.44,
    width: STATUS_DOT,
    height: STATUS_DOT,
    borderRadius: STATUS_DOT / 2,
    borderWidth: stroke,
    borderColor: colors.surface,
    backgroundColor: colors.success.accent,
  },
  cardCopy: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  name: {
    ...typography.optionTitle,
    color: colors.text.primary,
    flexShrink: 1,
  },
  rate: {
    ...typography.footnoteStrong,
    fontFamily: typography.rowTitle.fontFamily,
    color: colors.cosmos.accent,
  },
  specialities: {
    ...typography.caption,
    color: colors.text.secondary,
    paddingTop: 2,
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    paddingTop: spacing.sm,
  },
  metaChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    borderRadius: radius.chip,
    backgroundColor: colors.surfaceMuted,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
  },
  metaLabel: {
    ...typography.footnoteSmall,
    color: colors.text.muted,
  },

  actions: {
    flexDirection: 'row',
    gap: 10,
    paddingTop: spacing.rowGap,
  },
  action: {
    flex: 1,
    height: ACTION_HEIGHT,
    borderRadius: radius.button,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
    overflow: 'hidden',
  },
  actionLabel: {
    ...typography.footnoteStrong,
    color: colors.text.inverse,
    textAlign: 'center',
  },
});
