import React from 'react';
import {
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BrandGradient } from './BrandGradient';
import { CloseMarkIcon } from './icons/CloseMarkIcon';
import { colors, radius, spacing, typography } from '../theme';

const ACTION_HEIGHT = 45.342;
const CLOSE_SIZE = 19.675;

type AstrologerBusyDialogProps = {
  visible: boolean;
  /** Who the user tried to reach. */
  name: string;
  /** Keeps them in the queue for this astrologer. */
  onWait: () => void;
  /** Sends them back to the list to pick someone free. */
  onChooseOthers: () => void;
  onDismiss: () => void;
};

type DeclineChatDialogProps = {
  visible: boolean;
  /** Keeps the request alive. */
  onStay: () => void;
  /** Drops it and lets the flow unwind. */
  onDecline: () => void;
  onDismiss: () => void;
};

/**
 * Asked when the cross under the connecting card is pressed: the request is
 * still open, so backing out of it is confirmed first.
 * Figma: node 180:111727.
 */
export function DeclineChatDialog({
  visible,
  onStay,
  onDecline,
  onDismiss,
}: DeclineChatDialogProps) {
  const insets = useSafeAreaInsets();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onDismiss}
      statusBarTranslucent
    >
      <View style={styles.stage}>
        <Pressable
          accessibilityLabel="Close decline call request"
          style={styles.scrim}
          onPress={onDismiss}
        />

        <View
          style={[styles.sheet, { paddingBottom: spacing.lg + insets.bottom }]}
        >
          {/* Figma sets this title against the left edge, not centred. */}
          <Text style={styles.declineTitle}>Decline Call Request</Text>

          <Text style={styles.body}>
            Do you want to decline the{'\n'}Chat request?
          </Text>

          <View style={styles.actions}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="No, Stay Here"
              onPress={onStay}
              style={({ pressed }) => [
                styles.action,
                styles.stay,
                pressed && styles.pressed,
              ]}
            >
              <Text style={styles.stayLabel}>No, Stay Here</Text>
            </Pressable>

            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Yes, Decline"
              onPress={onDecline}
              style={({ pressed }) => [
                styles.action,
                pressed && styles.pressed,
              ]}
            >
              <BrandGradient radius={radius.button} />
              <Text style={styles.chooseLabel}>Yes, Decline</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

/**
 * Shown when a chat is started against an astrologer who is still counting
 * down a wait time: wait for them, or go and pick another expert.
 * Figma: node 180:162837, over the scrim at 180:162836.
 */
export function AstrologerBusyDialog({
  visible,
  name,
  onWait,
  onChooseOthers,
  onDismiss,
}: AstrologerBusyDialogProps) {
  const insets = useSafeAreaInsets();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onDismiss}
      statusBarTranslucent
    >
      <View style={styles.stage}>
        <Pressable
          accessibilityLabel="Close current status"
          style={styles.scrim}
          onPress={onDismiss}
        />

        <View style={[styles.sheet, { paddingBottom: spacing.lg + insets.bottom }]}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Dismiss"
            onPress={onDismiss}
            hitSlop={spacing.sm}
            style={({ pressed }) => [styles.close, pressed && styles.pressed]}
          >
            <CloseMarkIcon size={CLOSE_SIZE} />
          </Pressable>

          <Text style={styles.title}>Current Status</Text>
          <View style={styles.rule} />

          <Text style={styles.body}>
            <Text style={styles.bodyName}>{name} </Text>
            is busy with other customer.{'\n'}
            Do you want to wait or Chat with{'\n'}
            other expert Astrologer?
          </Text>

          <View style={styles.actions}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Yes, Wait"
              onPress={onWait}
              style={({ pressed }) => [
                styles.action,
                styles.wait,
                pressed && styles.pressed,
              ]}
            >
              <Text style={styles.waitLabel}>Yes, Wait</Text>
            </Pressable>

            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Choose Others"
              onPress={onChooseOthers}
              style={({ pressed }) => [
                styles.action,
                pressed && styles.pressed,
              ]}
            >
              <BrandGradient radius={radius.button} />
              <Text style={styles.chooseLabel}>Choose Others</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  stage: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  scrim: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    backgroundColor: colors.scrim,
  },
  sheet: {
    borderTopLeftRadius: radius.sheet,
    borderTopRightRadius: radius.sheet,
    backgroundColor: colors.surface,
    paddingTop: spacing.xl,
    paddingHorizontal: spacing.xl,
  },
  close: {
    position: 'absolute',
    right: 18,
    top: 14,
  },
  title: {
    ...typography.dialogTitle,
    color: colors.text.onYellow,
    textAlign: 'center',
  },
  declineTitle: {
    ...typography.dialogTitle,
    color: colors.text.onYellow,
  },
  // Figma underscores the title with a short centred rule (node 180:162854).
  rule: {
    alignSelf: 'center',
    width: 145,
    height: 1,
    marginTop: spacing.xs,
    backgroundColor: colors.text.onYellow,
  },
  body: {
    ...typography.dialogBody,
    color: colors.text.onYellow,
    textAlign: 'center',
    paddingTop: spacing.lg,
  },
  bodyName: {
    ...typography.dialogBodyStrong,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.md,
    paddingTop: spacing.xl,
  },
  action: {
    flex: 1,
    height: ACTION_HEIGHT,
    borderRadius: radius.action,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  wait: {
    borderWidth: 1,
    borderColor: colors.border.pickerAction,
  },
  waitLabel: {
    ...typography.dialogAction,
    color: colors.border.pickerAction,
  },
  stay: {
    borderWidth: 1,
    borderColor: colors.text.onYellow,
    backgroundColor: colors.surface,
    // drop-shadow(0 4px 4px rgba(0, 0, 0, 0.1))
    ...Platform.select({
      ios: {
        shadowColor: colors.shadow,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: { elevation: 3 },
      default: {},
    }),
  },
  stayLabel: {
    ...typography.dialogAction,
    color: colors.text.onYellow,
  },
  chooseLabel: {
    ...typography.dialogAction,
    color: colors.text.inverse,
  },
  pressed: {
    opacity: 0.8,
  },
});
