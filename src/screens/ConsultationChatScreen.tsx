import React, { useEffect, useRef, useState } from 'react';
import {
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  View,
  type ImageSourcePropType,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BrandGradient } from '../components/BrandGradient';
import {
  ConsultationBubble,
  type ConsultationMessage,
} from '../components/ConsultationBubble';
import {
  EmojiIcon,
  MicIcon,
  PaperclipIcon,
  WalletPillIcon,
} from '../components/icons/ChatRoomIcons';
import { CloseMarkIcon } from '../components/icons/CloseMarkIcon';
import { SendIcon } from '../components/icons/SendIcon';
import { openingMessages } from '../data/chatIntake';
import {
  colors,
  designFrame,
  hairline,
  radius,
  spacing,
  typography,
} from '../theme';

/** Top padding Figma drew, measured from the top of the status bar. */
const DESIGN_PADDING_TOP = 53;
const AVATAR_SIZE = 36;
const WALLET_ICON = 20;
const END_SIZE = 37.663;
const END_ICON = 16;
const COMPOSER_HEIGHT = 56;
const SEND_SIZE = 46;
const SEND_ICON = 20;

type ConsultationChatScreenProps = {
  /** Who the seeker is talking to. */
  astrologerName: string;
  photo?: ImageSourcePropType;
  /** Printed in the header's pill. */
  walletBalance?: string;
  /** What the intake form filed, opening the conversation. */
  intakeLines?: ReadonlyArray<string>;
  /** The red cross — ends the session. */
  onEnd?: () => void;
  onWalletPress?: () => void;
};

/** "04:58 mins" — how the header prints the running session. */
const elapsedLabel = (seconds: number) =>
  `(${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(
    seconds % 60,
  ).padStart(2, '0')} mins)`;

const timeNow = () =>
  new Date()
    .toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    })
    .toUpperCase();

/**
 * The live consultation, opened once the astrologer accepts: their name and the
 * running timer over the balance the session is spending, the transcript, and
 * the composer.
 * Figma: node 180:118720.
 */
export function ConsultationChatScreen({
  astrologerName,
  photo,
  walletBalance = '₹ 1000',
  intakeLines,
  onEnd,
  onWalletPress,
}: ConsultationChatScreenProps) {
  const insets = useSafeAreaInsets();
  const transcript = useRef<React.ComponentRef<typeof ScrollView>>(null);
  const [messages, setMessages] = useState<ConsultationMessage[]>(() =>
    openingMessages(intakeLines, astrologerName),
  );
  const [draft, setDraft] = useState('');
  const [elapsed, setElapsed] = useState(0);

  // The session is charged by the minute, so the header counts it up.
  useEffect(() => {
    const tick = setInterval(() => setElapsed(current => current + 1), 1000);
    return () => clearInterval(tick);
  }, []);

  const send = () => {
    const body = draft.trim();
    if (body.length === 0) {
      return;
    }

    setMessages(current => [
      ...current,
      {
        id: `sent-${current.length}`,
        from: 'seeker',
        lines: body.split('\n'),
        time: timeNow(),
      },
    ]);
    setDraft('');
  };

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
        <View style={styles.avatarRing}>
          {photo !== undefined ? (
            <Image source={photo} style={styles.avatar} resizeMode="cover" />
          ) : (
            <View style={[styles.avatar, styles.avatarFallback]}>
              <Text style={styles.avatarInitial}>
                {astrologerName.slice(0, 1)}
              </Text>
            </View>
          )}
        </View>

        <View style={styles.identity}>
          <Text style={styles.peer} numberOfLines={1}>
            {astrologerName}
          </Text>
          <Text style={styles.elapsed}>{elapsedLabel(elapsed)}</Text>
        </View>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Wallet balance ${walletBalance}`}
          onPress={onWalletPress}
          style={({ pressed }) => [styles.wallet, pressed && styles.pressed]}
        >
          <View style={styles.walletIcon}>
            <WalletPillIcon size={WALLET_ICON} />
          </View>
          <Text style={styles.walletLabel}>{walletBalance}</Text>
        </Pressable>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="End the consultation"
          onPress={onEnd}
          style={({ pressed }) => [styles.end, pressed && styles.pressed]}
        >
          <CloseMarkIcon size={END_ICON} color={colors.text.inverse} />
        </Pressable>
      </View>

      <KeyboardAvoidingView
        style={styles.body}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          ref={transcript}
          contentContainerStyle={styles.transcript}
          onContentSizeChange={() =>
            transcript.current?.scrollToEnd({ animated: true })
          }
        >
          {messages.map(message => (
            <ConsultationBubble key={message.id} message={message} />
          ))}
        </ScrollView>

        <View
          style={[styles.composerRow, { paddingBottom: spacing.md + insets.bottom }]}
        >
          <View style={styles.composer}>
            <EmojiIcon />
            <TextInput
              accessibilityLabel="Type message"
              value={draft}
              onChangeText={setDraft}
              placeholder="Type message..."
              placeholderTextColor={colors.text.composerHint}
              style={styles.input}
              multiline
            />
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Record a voice note"
              style={({ pressed }) => pressed && styles.pressed}
            >
              <MicIcon />
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Attach a file"
              style={({ pressed }) => pressed && styles.pressed}
            >
              <PaperclipIcon />
            </Pressable>
          </View>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Send"
            accessibilityState={{ disabled: draft.trim().length === 0 }}
            disabled={draft.trim().length === 0}
            onPress={send}
            style={({ pressed }) => [styles.send, pressed && styles.pressed]}
          >
            <BrandGradient radius={radius.button} />
            <SendIcon size={SEND_ICON} color={colors.text.inverse} />
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.brandYellow,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.brandYellow,
    paddingHorizontal: spacing.section,
    paddingBottom: spacing.section,
  },
  avatarRing: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
    overflow: 'hidden',
  },
  avatar: {
    width: '100%',
    height: '100%',
  },
  avatarFallback: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
  },
  avatarInitial: {
    ...typography.chatPeer,
    color: colors.text.onYellow,
  },
  identity: {
    flex: 1,
  },
  peer: {
    ...typography.chatPeer,
    color: colors.text.onYellow,
  },
  elapsed: {
    ...typography.chatElapsed,
    color: colors.text.onYellow,
  },
  wallet: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    height: 35.66,
    paddingLeft: 3,
    paddingRight: spacing.md,
    borderRadius: radius.chip,
    backgroundColor: colors.surface,
  },
  walletIcon: {
    width: 29,
    height: 29,
    borderRadius: radius.chip,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.status.walletPill,
  },
  walletLabel: {
    ...typography.chatWallet,
    color: colors.text.onYellow,
  },
  end: {
    width: END_SIZE,
    height: END_SIZE,
    borderRadius: radius.chip,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.status.cancelMark,
  },
  body: {
    flex: 1,
    borderTopLeftRadius: radius.sheet,
    borderTopRightRadius: radius.sheet,
    backgroundColor: colors.surfaceChat,
    overflow: 'hidden',
  },
  transcript: {
    gap: spacing.md,
    paddingHorizontal: spacing.section,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
  },
  composerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.section,
    paddingTop: spacing.sm,
  },
  composer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    minHeight: COMPOSER_HEIGHT,
    paddingHorizontal: spacing.md,
    borderRadius: COMPOSER_HEIGHT / 2,
    borderWidth: hairline,
    borderColor: colors.borderComposer,
    backgroundColor: colors.surface,
    // 0 0 4px rgba(112, 111, 111, 0.25)
    ...Platform.select({
      ios: {
        shadowColor: colors.shadow,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
      },
      android: { elevation: 2 },
      default: {},
    }),
  },
  input: {
    ...typography.chatComposer,
    flex: 1,
    maxHeight: 96,
    paddingVertical: 0,
    color: colors.text.onYellow,
  },
  send: {
    width: SEND_SIZE,
    height: SEND_SIZE,
    borderRadius: radius.button,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  pressed: {
    opacity: 0.8,
  },
});
