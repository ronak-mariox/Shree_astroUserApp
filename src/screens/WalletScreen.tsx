import React from 'react';
import {
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
import { SectionHeader } from '../components/SectionHeader';
import {
  quickAddAmounts,
  transactions,
  wallet,
  type Transaction,
} from '../data/wallet';
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
const ADD_BUTTON_WIDTH = 140.939;
const ADD_BUTTON_HEIGHT = 43.998;
const CHIP_HEIGHT = 39.999;
const TILE_SIZE = 43.998;

type WalletScreenProps = {
  onAddMoney?: (amount?: number) => void;
  onViewAllTransactions?: () => void;
  activeTab?: TabKey;
  onSelectTab?: (tab: TabKey) => void;
};

function TransactionRow({ transaction }: { transaction: Transaction }) {
  return (
    <View style={styles.transaction}>
      <View
        style={[
          styles.transactionTile,
          transaction.credit ? styles.tileCredit : styles.tileDebit,
        ]}
      >
        <Text style={styles.transactionGlyph}>
          {transaction.credit ? '⬆️' : '⬇️'}
        </Text>
      </View>

      <View style={styles.transactionCopy}>
        <Text style={styles.transactionTitle}>{transaction.title}</Text>
        <Text style={styles.transactionTime}>{transaction.timestamp}</Text>
      </View>

      <Text
        style={[
          styles.transactionAmount,
          {
            color: transaction.credit
              ? colors.status.positive
              : colors.status.debit,
          },
        ]}
      >
        {transaction.amount}
      </Text>
    </View>
  );
}

/**
 * Wallet home: the balance, shortcuts to top it up, lifetime totals and the
 * ledger. Figma: node 180:163074.
 */
export function WalletScreen({
  onAddMoney,
  onViewAllTransactions,
  activeTab = 'wallet',
  onSelectTab,
}: WalletScreenProps) {
  const insets = useSafeAreaInsets();

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
          <Text style={styles.title}>Wallet</Text>

          <View style={styles.balanceCard}>
            <BrandGradient
              radius={radius.balance}
              angle="toRight"
              from={colors.gradient.balanceFrom}
              to={colors.gradient.balanceTo}
            />
            <Text style={styles.balanceLabel}>AVAILABLE BALANCE</Text>
            <Text style={styles.balance}>{wallet.balance}</Text>
            <Text style={styles.balanceHint}>{wallet.equivalent}</Text>

            <Pressable
              accessibilityRole="button"
              onPress={() => onAddMoney?.()}
              style={({ pressed }) => [
                styles.addButton,
                pressed && styles.pressed,
              ]}
            >
              <Text style={styles.addLabel}>+ Add Money</Text>
            </Pressable>
          </View>
        </View>

        <View style={styles.body}>
          <View style={styles.quickAddCard}>
            <Text style={styles.cardTitle}>Quick Add</Text>
            <View style={styles.quickAddRow}>
              {quickAddAmounts.map(amount => (
                <Pressable
                  key={amount}
                  accessibilityRole="button"
                  onPress={() => onAddMoney?.(amount)}
                  style={({ pressed }) => [
                    styles.quickAddChip,
                    pressed && styles.pressed,
                  ]}
                >
                  <Text style={styles.quickAddLabel}>₹{amount}</Text>
                </Pressable>
              ))}
            </View>
          </View>

          <View style={styles.stats}>
            <View style={[styles.statTile, styles.statSpent]}>
              <Text style={styles.statGlyph}>💸</Text>
              <Text style={[styles.statValue, styles.statValueSpent]}>
                {wallet.totalSpent}
              </Text>
              <Text style={styles.statLabel}>Total Spent</Text>
            </View>

            <View style={[styles.statTile, styles.statAdded]}>
              <Text style={styles.statGlyph}>💰</Text>
              <Text style={[styles.statValue, styles.statValueAdded]}>
                {wallet.totalAdded}
              </Text>
              <Text style={styles.statLabel}>Total Added</Text>
            </View>
          </View>

          <SectionHeader
            title="Recent Transactions"
            titleStyle={styles.ledgerTitle}
            action="View All"
            actionStyle={styles.ledgerAction}
            onActionPress={onViewAllTransactions}
            style={styles.ledgerHeader}
          />

          <View style={styles.ledger}>
            {transactions.map(transaction => (
              <TransactionRow key={transaction.id} transaction={transaction} />
            ))}
          </View>
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
    paddingBottom: spacing.xxxl,
    overflow: 'hidden',
  },
  title: {
    ...typography.pageTitle,
    color: colors.text.onYellow,
  },
  balanceCard: {
    borderRadius: radius.balance,
    borderWidth: hairline,
    borderColor: colors.border.balance,
    padding: 24.755,
    marginTop: spacing.lg,
    overflow: 'hidden',
  },
  balanceLabel: {
    ...typography.overline,
    color: colors.text.onYellowStrongMuted,
  },
  balance: {
    ...typography.displayLarge,
    color: colors.text.onYellow,
    paddingTop: 6,
  },
  balanceHint: {
    ...typography.footnote,
    color: colors.text.onYellowGhost,
    paddingTop: spacing.xs,
  },
  addButton: {
    width: ADD_BUTTON_WIDTH,
    height: ADD_BUTTON_HEIGHT,
    borderRadius: radius.field,
    borderWidth: 1,
    borderColor: colors.status.positiveStrong,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.lg,
    // 0 4px 16px rgba(255, 140, 0, 0.4)
    ...Platform.select({
      ios: {
        shadowColor: colors.cosmos.accent,
        shadowOpacity: 0.4,
        shadowRadius: 16,
      },
      android: { },
      default: {},
    }),
  },
  addLabel: {
    ...typography.label,
    color: colors.status.positiveStrong,
    textAlign: 'center',
  },
  pressed: {
    opacity: 0.8,
  },

  body: {
    padding: spacing.lg,
  },
  quickAddCard: {
    borderRadius: radius.card,
    borderWidth: hairline,
    borderColor: colors.border.subtle,
    backgroundColor: colors.surface,
    padding: 16.755,
    // drop-shadow(0 2px 4px rgba(0, 0, 0, 0.04))
    ...Platform.select({
      ios: {
        shadowColor: colors.shadow,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04,
        shadowRadius: 4,
      },
      android: { elevation: 1 },
      default: {},
    }),
  },
  cardTitle: {
    ...typography.label,
    color: colors.text.primary,
  },
  quickAddRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    paddingTop: spacing.md,
  },
  quickAddChip: {
    flex: 1,
    height: CHIP_HEIGHT,
    borderRadius: radius.icon,
    borderWidth: hairline,
    borderColor: colors.border.subtle,
    backgroundColor: colors.canvas,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickAddLabel: {
    ...typography.detailValue,
    color: colors.text.primary,
    textAlign: 'center',
  },

  stats: {
    flexDirection: 'row',
    gap: spacing.md,
    paddingTop: spacing.lg,
  },
  statTile: {
    flex: 1,
    borderRadius: radius.input,
    borderWidth: hairline,
    padding: 14.755,
  },
  statSpent: {
    backgroundColor: colors.status.debitTint,
    borderColor: colors.status.debitTintBorder,
  },
  statAdded: {
    backgroundColor: colors.status.positiveBadge,
    borderColor: colors.status.creditTintBorder,
  },
  statGlyph: {
    ...typography.symbolEmoji,
    color: colors.text.onYellow,
  },
  statValue: {
    ...typography.statValue,
    paddingTop: 6,
  },
  statValueSpent: {
    color: colors.status.debit,
  },
  statValueAdded: {
    color: colors.status.positive,
  },
  statLabel: {
    ...typography.footnoteSmall,
    color: colors.text.secondary,
  },

  ledgerHeader: {
    paddingTop: spacing.lg,
  },
  ledgerTitle: {
    ...typography.subheading,
  },
  ledgerAction: {
    ...typography.detailValue,
    color: colors.cosmos.accent,
  },
  ledger: {
    paddingTop: spacing.rowGap,
    gap: 10,
  },
  transaction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    borderRadius: radius.input,
    borderWidth: hairline,
    borderColor: colors.border.subtle,
    backgroundColor: colors.surface,
    padding: 14.755,
  },
  transactionTile: {
    width: TILE_SIZE,
    height: TILE_SIZE,
    borderRadius: radius.field,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tileCredit: {
    backgroundColor: colors.status.positiveBadge,
  },
  tileDebit: {
    backgroundColor: colors.status.debitTint,
  },
  transactionGlyph: {
    ...typography.symbol,
    color: colors.text.onYellow,
  },
  transactionCopy: {
    flex: 1,
  },
  transactionTitle: {
    ...typography.detailValue,
    color: colors.text.primary,
  },
  transactionTime: {
    ...typography.caption,
    color: colors.text.muted,
    paddingTop: 2,
  },
  transactionAmount: {
    ...typography.cardTitle,
  },
});
