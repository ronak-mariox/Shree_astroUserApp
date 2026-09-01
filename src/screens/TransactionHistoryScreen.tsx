import React, { useState } from 'react';
import {
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BackButton } from '../components/BackButton';
import { FilterChips } from '../components/FilterChips';
import {
  WalletCreditTileIcon,
  WalletDebitTileIcon,
} from '../components/icons/WalletIcons';
import {
  ledger,
  ledgerFilters,
  type LedgerFilter,
} from '../data/profile';
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
const TILE_SIZE = 43.998;

type TransactionHistoryScreenProps = {
  onBack?: () => void;
};

/** Full wallet ledger, filterable by direction. Figma: node 180:164193. */
export function TransactionHistoryScreen({
  onBack,
}: TransactionHistoryScreenProps) {
  const insets = useSafeAreaInsets();
  const [filter, setFilter] = useState<LedgerFilter>('all');

  const entries = ledger.filter(entry =>
    filter === 'all' ? true : entry.credit === (filter === 'added'),
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
          <BackButton
            onPress={onBack}
            backgroundColor={colors.glass.dim}
            iconColor={colors.border.strong}
          />
          <Text style={styles.title}>Transaction History</Text>
        </View>

        <FilterChips
          filters={ledgerFilters}
          active={filter}
          onSelect={setFilter}
          style={styles.filters}
        />
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.body,
          { paddingBottom: spacing.section + insets.bottom },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {entries.map(entry => (
          <View key={entry.id} style={styles.entry}>
            {entry.credit ? (
              <WalletCreditTileIcon size={TILE_SIZE} />
            ) : (
              <WalletDebitTileIcon size={TILE_SIZE} />
            )}

            <View style={styles.copy}>
              <Text style={styles.entryTitle}>{entry.title}</Text>
              <Text style={styles.entryDetail}>{entry.detail}</Text>
              <Text style={styles.entryTime}>{entry.timestamp}</Text>
            </View>

            <View style={styles.amountColumn}>
              <Text
                style={[
                  styles.amount,
                  {
                    color: entry.credit
                      ? colors.status.positive
                      : colors.status.debit,
                  },
                ]}
              >
                {entry.amount}
              </Text>
              <Text style={styles.reference}>{entry.reference}</Text>
            </View>
          </View>
        ))}
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
  filters: {
    marginTop: spacing.section,
  },
  body: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.section,
    gap: 10,
  },
  entry: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
    borderRadius: radius.input,
    borderWidth: hairline,
    borderColor: colors.border.subtle,
    backgroundColor: colors.surface,
    paddingHorizontal: 16.755,
    paddingVertical: 14.755,
    // drop-shadow(0 1px 3px rgba(0, 0, 0, 0.04))
    ...Platform.select({
      ios: {
        shadowColor: colors.shadow,
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.04,
        shadowRadius: 3,
      },
      android: { elevation: 1 },
      default: {},
    }),
  },
  copy: {
    flex: 1,
  },
  entryTitle: {
    ...typography.footnoteStrong,
    color: colors.text.primary,
  },
  entryDetail: {
    ...typography.caption,
    color: colors.text.secondary,
    paddingTop: 2,
  },
  entryTime: {
    ...typography.footnoteSmall,
    color: colors.text.muted,
    paddingTop: 2,
  },
  amountColumn: {
    alignItems: 'flex-end',
  },
  amount: {
    ...typography.buttonSmall,
    textAlign: 'right',
  },
  reference: {
    ...typography.microLabel,
    color: colors.text.muted,
    textAlign: 'right',
    paddingTop: 3,
  },
});
