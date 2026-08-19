import React, { useEffect, useState } from 'react';
import {
  Image,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
  type ImageSourcePropType,
} from 'react-native';

import { CloseMarkIcon } from './icons/CloseMarkIcon';
import { colors, radius, spacing, typography } from '../theme';

const CARD_WIDTH = 318;
const AVATAR_SIZE = 98;
const PROGRESS_HEIGHT = 3;
const CANCEL_SIZE = 42;
const CANCEL_ICON = 20;
/** The bar fills over the wait, so it starts a third of the way along. */
const PROGRESS_START = 0.32;

type ConnectingDialogProps = {
  visible: boolean;
  /** Who the request went to. */
  name: string;
  photo?: ImageSourcePropType;
  /** Counted down as "02:00" — seconds remaining when the card opened. */
  seconds: number;
  /** The red cross under the card. */
  onCancel: () => void;
  /** Reports the seconds left, so a paused request can resume where it was. */
  onTick?: (remaining: number) => void;
  /** Fired once the countdown reaches zero. */
  onConnected?: () => void;
};

const clock = (total: number) =>
  `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(
    total % 60,
  ).padStart(2, '0')}`;

/**
 * The card that stands between "Connect With Astro …" and the conversation:
 * who is being reached, how far along the request is, and how long the wait
 * has left to run.
 * Figma: node 180:105058, over the scrim at 180:105057.
 */
export function ConnectingDialog({
  visible,
  name,
  photo,
  seconds,
  onCancel,
  onTick,
  onConnected,
}: ConnectingDialogProps) {
  const [remaining, setRemaining] = useState(seconds);

  useEffect(() => {
    if (!visible) {
      return;
    }

    setRemaining(seconds);
    const tick = setInterval(() => {
      setRemaining(current => {
        if (current <= 1) {
          clearInterval(tick);
          onTick?.(0);
          onConnected?.();
          return 0;
        }
        onTick?.(current - 1);
        return current - 1;
      });
    }, 1000);

    return () => clearInterval(tick);
  }, [visible, seconds, onTick, onConnected]);

  const elapsed = seconds === 0 ? 1 : (seconds - remaining) / seconds;
  const progress = PROGRESS_START + (1 - PROGRESS_START) * elapsed;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onCancel}
      statusBarTranslucent
    >
      <View style={styles.stage}>
        <View style={styles.scrim} />

        <View style={styles.card}>
          <View style={styles.head}>
            <View style={styles.avatarRing}>
              {photo !== undefined ? (
                <Image source={photo} style={styles.avatar} resizeMode="cover" />
              ) : (
                <View style={[styles.avatar, styles.avatarFallback]}>
                  <Text style={styles.initial}>{name.slice(0, 1)}</Text>
                </View>
              )}
            </View>

            <Text style={styles.connecting}>
              Connecting With <Text style={styles.connectingName}>{name}</Text>
            </Text>
          </View>

          <View style={styles.body}>
            <Text style={styles.status}>Connecting, Please Wait...</Text>

            <View style={styles.progressTrack}>
              <View
                accessibilityRole="progressbar"
                accessibilityValue={{ now: Math.round(progress * 100), min: 0, max: 100 }}
                style={[styles.progressFill, { flex: progress }]}
              />
              <View style={{ flex: 1 - progress }} />
            </View>

            <Text style={styles.note}>{name} will connect soon ⏱</Text>

            <Text style={styles.wait}>
              Wait Time - <Text style={styles.waitValue}>{clock(remaining)}</Text>
            </Text>
          </View>
        </View>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Cancel the request"
          onPress={onCancel}
          style={({ pressed }) => [styles.cancel, pressed && styles.pressed]}
        >
          <CloseMarkIcon size={CANCEL_ICON} color={colors.status.cancelMark} />
        </Pressable>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  stage: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrim: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    backgroundColor: colors.scrim,
  },
  card: {
    width: CARD_WIDTH,
    borderRadius: radius.connecting,
    backgroundColor: colors.surface,
    overflow: 'hidden',
  },
  head: {
    alignItems: 'center',
    backgroundColor: colors.surfaceBlush,
    paddingTop: spacing.xl,
    paddingBottom: spacing.section,
  },
  avatarRing: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
    borderWidth: 2,
    borderColor: colors.gradient.from,
    overflow: 'hidden',
  },
  avatar: {
    width: '100%',
    height: '100%',
  },
  avatarFallback: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceMuted,
  },
  initial: {
    ...typography.dialogTitle,
    color: colors.text.primary,
  },
  connecting: {
    ...typography.connectingHead,
    color: colors.text.onYellow,
    paddingTop: spacing.section,
  },
  connectingName: {
    ...typography.connectingHeadStrong,
  },
  body: {
    paddingHorizontal: spacing.section,
    paddingTop: spacing.section,
    paddingBottom: spacing.xl,
  },
  status: {
    ...typography.connectingHead,
    color: colors.text.onYellow,
  },
  progressTrack: {
    flexDirection: 'row',
    height: PROGRESS_HEIGHT,
    marginTop: spacing.sm,
    borderRadius: PROGRESS_HEIGHT / 2,
    backgroundColor: colors.surfaceMuted,
    overflow: 'hidden',
  },
  progressFill: {
    backgroundColor: colors.status.connectingProgress,
  },
  note: {
    ...typography.connectingNote,
    color: colors.text.onYellow,
    paddingTop: spacing.md,
  },
  wait: {
    ...typography.connectingWait,
    color: colors.text.onYellow,
    textAlign: 'center',
    paddingTop: spacing.section,
  },
  waitValue: {
    color: colors.status.waitClock,
  },
  cancel: {
    width: CANCEL_SIZE,
    height: CANCEL_SIZE,
    marginTop: spacing.lg,
    borderRadius: radius.action,
    borderWidth: 2,
    borderColor: colors.status.cancelMark,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: {
    opacity: 0.8,
  },
});
