import React, { useMemo } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BrandGradient } from './BrandGradient';
import { ChatEndedIcon } from './icons/ChatEndedIcon';
import { CloseMarkIcon } from './icons/CloseMarkIcon';
import { useResponsive } from '../hooks/useResponsive';
import { colors, fontFamily, radius, spacing, typography } from '../theme';

const CLOSE_SIZE = 19.675;
const ICON_SIZE = 94;
const ACTION_HEIGHT = 57.285;
/** Figma sizes the two buttons unevenly — "No" narrower than "Yes, Start Chat". */
const STAY_FLEX = 149;
const RESUME_FLEX = 187;

type ChatEndedDialogProps = {
  visible: boolean;
  /** Ends the session for good. */
  onEnd: () => void;
  /** Keeps talking to the same astrologer instead. */
  onResume: () => void;
  onDismiss: () => void;
};

/**
 * Offered once "Yes, End Chat" is confirmed: one more chance to keep talking
 * to the same astrologer before the session actually closes.
 * Figma: node 180:138458, over the scrim at 180:138463.
 */
export function ChatEndedDialog({
  visible,
  onEnd,
  onResume,
  onDismiss,
}: ChatEndedDialogProps) {
  const insets = useSafeAreaInsets();
  const { px, isTablet } = useResponsive();
  const styles = useMemo(() => createStyles(px, isTablet), [px, isTablet]);

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
          accessibilityLabel="Close chat ended prompt"
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
            <CloseMarkIcon size={px(CLOSE_SIZE)} />
          </Pressable>

          <View style={styles.iconSlot}>
            <ChatEndedIcon size={px(ICON_SIZE)} />
          </View>

          <Text style={styles.title}>Chat Ended{'\n'}More Guidance Awaits You</Text>

          <Text style={styles.body}>
            Your astrologer is still here to guide you. Would you like to
            continue your chat now?
          </Text>

          <View style={styles.actions}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="No"
              onPress={onEnd}
              style={({ pressed }) => [
                styles.action,
                styles.stay,
                { flex: STAY_FLEX },
                pressed && styles.pressed,
              ]}
            >
              <Text style={styles.stayLabel}>No</Text>
            </Pressable>

            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Yes, Start Chat"
              onPress={onResume}
              style={({ pressed }) => [
                styles.action,
                { flex: RESUME_FLEX },
                pressed && styles.pressed,
              ]}
            >
              <BrandGradient radius={radius.action} />
              <Text style={styles.resumeLabel}>Yes, Start Chat</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

function createStyles(px: (value: number) => number, isTablet: boolean) {
  return StyleSheet.create({
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
      alignSelf: 'center',
      alignItems: 'center',
      width: '100%',
      maxWidth: isTablet ? 480 : undefined,
      marginBottom: isTablet ? spacing.xxl : 0,
      borderTopLeftRadius: radius.sheet,
      borderTopRightRadius: radius.sheet,
      borderBottomLeftRadius: isTablet ? radius.sheet : 0,
      borderBottomRightRadius: isTablet ? radius.sheet : 0,
      backgroundColor: colors.surface,
      paddingTop: spacing.xl,
      paddingHorizontal: spacing.xl,
    },
    close: {
      position: 'absolute',
      right: px(18),
      top: px(14),
    },
    iconSlot: {
      paddingBottom: spacing.md,
    },
    title: {
      ...typography.dialogTitle,
      fontFamily: fontFamily.bold,
      color: colors.text.onYellow,
      textAlign: 'center',
    },
    body: {
      ...typography.dialogBody,
      color: colors.text.onYellow,
      textAlign: 'center',
      paddingTop: spacing.md,
    },
    actions: {
      flexDirection: 'row',
      alignSelf: 'stretch',
      gap: spacing.md,
      paddingTop: spacing.xl,
    },
    action: {
      height: px(ACTION_HEIGHT),
      borderRadius: radius.action,
      alignItems: 'center',
      justifyContent: 'center',
      overflow: 'hidden',
    },
    stay: {
      borderWidth: 1,
      borderColor: colors.text.onYellow,
      backgroundColor: colors.surface,
    },
    stayLabel: {
      ...typography.dialogAction,
      color: colors.text.onYellow,
    },
    resumeLabel: {
      ...typography.dialogAction,
      color: colors.text.inverse,
    },
    pressed: {
      opacity: 0.8,
    },
  });
}
