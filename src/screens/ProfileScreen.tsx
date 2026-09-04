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

import { BottomTabBar, type TabKey } from '../components/BottomTabBar';
import { BrandGradient } from '../components/BrandGradient';
import { BellIcon } from '../components/icons/BellIcon';
import { ChevronRightIcon } from '../components/icons/ChevronRightIcon';
import {
  DocumentIcon,
  EditIcon,
  LogoutIcon,
  MessageIcon,
  SparkleIcon,
  WalletCardIcon,
  type MenuIconProps,
} from '../components/icons/MenuIcons';
import { ZODIAC_ICONS } from '../components/icons/ZodiacIcons';
import {
  account,
  accountStats,
  profileMenu,
  type MenuKey,
} from '../data/profile';
import { rupees, shortDate } from '../services/api';
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
const AVATAR_SIZE = 87.997;
const TILE_SIZE = 39.999;
const MENU_ICON = 17.993;
const CHEVRON = 15.999;
const LOGOUT_HEIGHT = 51.998;

const MENU_ICONS: Record<MenuKey, (props: MenuIconProps) => React.JSX.Element> =
  {
    editProfile: EditIcon,
    wallet: WalletCardIcon,
    transactions: DocumentIcon,
    consultations: MessageIcon,
    notifications: props => <BellIcon {...props} strokeWidth={1.49945} />,
    aiAssistant: SparkleIcon,
  };

type ProfileScreenProps = {
  /**
   * The signed-in account. The placeholder in data/profile.ts stands in until
   * one is passed, so the screen still renders in isolation — but a signed-in
   * app always passes the real thing.
   */
  user?: { name?: string; email?: string; avatarUrl?: string };
  /**
   * The rest of GET /users/me — wallet, stats and birth details are shown
   * when present and fall back to the design fixture otherwise, the same as
   * `user` above.
   */
  profile?: {
    zodiac?: { sunSign?: string };
    birthDetails?: { dateOfBirth?: string; place?: { formatted?: string } };
    wallet?: { balance?: number };
    stats?: { consultations?: number; kundlis?: number };
  };
  onSelectMenu?: (key: MenuKey) => void;
  onLogout?: () => void;
  activeTab?: TabKey;
  onSelectTab?: (tab: TabKey) => void;
};

/**
 * Account home: who you are, what you've used, and the way into everything
 * else. Figma: node 180:163649.
 */
export function ProfileScreen({
  user,
  profile,
  onSelectMenu,
  onLogout,
  activeTab = 'profile',
  onSelectTab,
}: ProfileScreenProps) {
  const insets = useSafeAreaInsets();

  const name = user?.name || account.name;
  const email = user?.email || account.email;
  const sunSign = profile?.zodiac?.sunSign || account.sunSign;
  const ZodiacGlyph = ZODIAC_ICONS[sunSign] ?? ZODIAC_ICONS[account.sunSign];
  const birthPlace = profile?.birthDetails?.place?.formatted;
  const identityLine =
    profile?.birthDetails?.dateOfBirth && birthPlace
      ? `${sunSign} · ${shortDate(profile.birthDetails.dateOfBirth)} · ${birthPlace}`
      : account.identityLine;
  const stats = profile
    ? [
        { value: rupees(profile.wallet?.balance ?? 0), label: 'Wallet' },
        { value: String(profile.stats?.consultations ?? 0), label: 'Consults' },
        { value: String(profile.stats?.kundlis ?? 0), label: 'Kundlis' },
      ]
    : accountStats;

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
          <View style={styles.avatar}>
            <Image
              source={user?.avatarUrl ? { uri: user.avatarUrl } : account.avatarPhoto}
              style={styles.avatarImage}
              resizeMode="cover"
            />
          </View>

          <Text style={styles.name}>{name}</Text>
          <Text style={styles.email}>{email}</Text>
          <View style={styles.identityRow}>
            {ZodiacGlyph && <ZodiacGlyph size={13} />}
            <Text style={styles.identity}>{identityLine}</Text>
          </View>

          <View style={styles.stats}>
            {stats.map(stat => (
              <View key={stat.label} style={styles.statTile}>
                <Text style={styles.statValue}>{stat.value}</Text>
                <Text style={styles.statLabel}>{stat.label}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.body}>
          <View style={styles.menu}>
            {profileMenu.map((item, index) => {
              const Icon = MENU_ICONS[item.key];

              return (
                <Pressable
                  key={item.key}
                  accessibilityRole="button"
                  onPress={() => onSelectMenu?.(item.key)}
                  style={({ pressed }) => [
                    styles.menuRow,
                    index < profileMenu.length - 1 && styles.menuDivider,
                    pressed && styles.pressed,
                  ]}
                >
                  <View style={styles.menuTile}>
                    <BrandGradient
                      radius={radius.icon}
                      from={item.from}
                      to={item.to}
                    />
                    <Icon size={MENU_ICON} color={colors.text.inverse} />
                  </View>

                  <Text style={styles.menuLabel}>{item.label}</Text>

                  <ChevronRightIcon
                    size={CHEVRON}
                    color={colors.text.inactive}
                  />
                </Pressable>
              );
            })}
          </View>

          <Pressable
            accessibilityRole="button"
            onPress={onLogout}
            style={({ pressed }) => [styles.logout, pressed && styles.pressed]}
          >
            <LogoutIcon size={MENU_ICON} />
            <Text style={styles.logoutLabel}>Logout</Text>
          </Pressable>

          <Text style={styles.version}>{account.version}</Text>
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
    alignItems: 'center',
    backgroundColor: colors.brandYellow,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.huge,
    overflow: 'hidden',
  },
  avatar: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: radius.avatar,
    borderWidth: 2.265,
    borderColor: colors.progressTrack,
    backgroundColor: colors.brandYellow,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
    overflow: 'hidden',
    // drop-shadow(0 8px 12px rgba(255, 140, 0, 0.4))
    ...Platform.select({
      ios: {
        shadowColor: colors.cosmos.accent,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.4,
        shadowRadius: 12,
      },
      android: { elevation: 8 },
      default: {},
    }),
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  name: {
    ...typography.pageTitle,
    color: colors.text.onYellow,
    textAlign: 'center',
  },
  email: {
    ...typography.footnote,
    color: colors.text.onYellowMuted,
    textAlign: 'center',
    paddingTop: 3,
  },
  identityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingTop: spacing.xs,
  },
  identity: {
    ...typography.caption,
    color: colors.text.onYellow,
    textAlign: 'center',
  },
  stats: {
    flexDirection: 'row',
    alignSelf: 'stretch',
    gap: spacing.md,
    paddingTop: spacing.xl,
  },
  statTile: {
    flex: 1,
    borderRadius: radius.field,
    borderWidth: 1,
    borderColor: colors.glass.dimSoft,
    backgroundColor: colors.brandYellow,
    alignItems: 'center',
    paddingHorizontal: 9,
    paddingVertical: 11,
  },
  statValue: {
    ...typography.button,
    color: colors.text.onYellow,
    textAlign: 'center',
  },
  statLabel: {
    ...typography.microLabel,
    color: colors.text.onYellowMuted,
    textAlign: 'center',
    paddingTop: 2,
  },

  body: {
    padding: spacing.lg,
  },
  menu: {
    borderRadius: radius.card,
    borderWidth: hairline,
    borderColor: colors.border.subtle,
    backgroundColor: colors.surface,
    overflow: 'hidden',
    // 0 2px 10px rgba(0, 0, 0, 0.04)
    ...Platform.select({
      ios: {
        shadowColor: colors.shadow,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04,
        shadowRadius: 10,
      },
      android: { elevation: 2 },
      default: {},
    }),
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.rowGap,
    paddingHorizontal: spacing.section,
    paddingTop: spacing.rowGap,
    paddingBottom: 14.755,
  },
  menuDivider: {
    borderBottomWidth: hairline,
    borderBottomColor: colors.border.row,
  },
  menuTile: {
    width: TILE_SIZE,
    height: TILE_SIZE,
    borderRadius: radius.icon,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    // drop-shadow(0 3px 5px rgba(0, 0, 0, 0.15))
    ...Platform.select({
      ios: {
        shadowColor: colors.shadow,
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.15,
        shadowRadius: 5,
      },
      android: { elevation: 3 },
      default: {},
    }),
  },
  menuLabel: {
    ...typography.listTitle,
    color: colors.text.primary,
    flex: 1,
  },
  pressed: {
    opacity: 0.7,
  },

  logout: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    height: LOGOUT_HEIGHT,
    borderRadius: radius.input,
    borderWidth: hairline,
    borderColor: colors.status.debitTintBorderStrong,
    backgroundColor: colors.status.debitTint,
    marginTop: spacing.section,
  },
  logoutLabel: {
    ...typography.buttonSmall,
    color: colors.status.debit,
    textAlign: 'center',
  },
  version: {
    ...typography.footnoteSmall,
    color: colors.text.muted,
    textAlign: 'center',
    paddingTop: spacing.lg,
  },
});
