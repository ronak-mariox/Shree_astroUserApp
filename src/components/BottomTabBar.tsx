import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, hairline, spacing, typography } from '../theme';
import {
  ConsultTabIcon,
  HomeTabIcon,
  KundliTabIcon,
  ProfileTabIcon,
  WalletTabIcon,
  type TabIconProps,
} from './icons/TabIcons';

export type TabKey = 'home' | 'kundli' | 'consult' | 'wallet' | 'profile';

const TABS: ReadonlyArray<{
  key: TabKey;
  label: string;
  Icon: (props: TabIconProps) => React.JSX.Element;
  /** Selected tint — Home reads green, every other tab reads black. */
  activeColor: string;
}> = [
  {
    key: 'home',
    label: 'Home',
    Icon: HomeTabIcon,
    activeColor: colors.success.accent,
  },
  {
    key: 'kundli',
    label: 'Kundli',
    Icon: KundliTabIcon,
    activeColor: colors.border.strong,
  },
  {
    key: 'consult',
    label: 'Consult',
    Icon: ConsultTabIcon,
    activeColor: colors.success.accent,
  },
  {
    key: 'wallet',
    label: 'Wallet',
    Icon: WalletTabIcon,
    activeColor: colors.border.strong,
  },
  {
    key: 'profile',
    label: 'Profile',
    Icon: ProfileTabIcon,
    activeColor: colors.success.accent,
  },
];

type BottomTabBarProps = {
  active: TabKey;
  onSelect?: (tab: TabKey) => void;
};

/**
 * Five-up bottom navigation pinned to the bottom of every signed-in screen
 * (Figma nodes 180:89192, 180:89281).
 */
export function BottomTabBar({ active, onSelect }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.bar, { paddingBottom: spacing.lg + insets.bottom }]}>
      {TABS.map(({ key, label, Icon, activeColor }) => {
        const selected = key === active;

        return (
          <Pressable
            key={key}
            accessibilityRole="tab"
            accessibilityState={{ selected }}
            accessibilityLabel={label}
            onPress={() => onSelect?.(key)}
            style={styles.tab}
          >
            <Icon active={selected} />
            <Text
              style={[
                selected ? typography.tabLabelActive : typography.tabLabel,
                { color: selected ? activeColor : colors.text.muted },
              ]}
            >
              {label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderTopWidth: hairline,
    borderTopColor: colors.border.subtle,
    paddingTop: 8.755,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.xs,
  },
});
