import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useKeyboardOpen } from '../hooks/useKeyboardOpen';

import { AppDialog } from '../components/AppDialog';
import { BackButton } from '../components/BackButton';
import { ChatBubble, type ChatMessage } from '../components/ChatBubble';
import { SendIcon } from '../components/icons/SendIcon';
import { useDialog } from '../hooks/useDialog';
import { assistant, openingMessages, suggestedPrompts } from '../data/chat';
import { askAi, fetchAiThread } from '../services/api';
import { ApiError } from '../services/client';
import {
  colors,
  designFrame,
  hairline,
  radius,
  spacing,
  typography,
} from '../theme';

/** What GET /chats/ai and POST /chats/ai/messages both hand back one turn as — see services/api.ts's own header comment on why the translation to ChatMessage happens here, screen-side, rather than in that shared service. */
type AiWireMessage = {
  id: string;
  senderRole: 'user' | 'ai' | 'system';
  content?: { text?: string };
};

const toChatMessage = (message: AiWireMessage): ChatMessage => ({
  id: message.id,
  role: message.senderRole === 'user' ? 'user' : 'assistant',
  text: message.content?.text ?? '',
});

/** Top padding Figma drew, measured from the top of the status bar. */
const DESIGN_PADDING_TOP = 56;
const AVATAR_TILE = 43.998;
const AVATAR_IMAGE = 26;
const SEND_SIZE = 43.998;
const SEND_ICON = 17.993;
const INPUT_MIN_HEIGHT = 44;
const INPUT_MAX_HEIGHT = 100;
const CHIP_HEIGHT = 33.993;
const STATUS_DOT = 5.994;

type ScrollViewHandle = React.ComponentRef<typeof ScrollView>;

type AiAstrologyChatScreenProps = {
  onBack?: () => void;
};

/**
 * Conversational front end for the AI astrologer. Figma: node 180:163495.
 *
 * The mockup pins the empty state — the assistant's greeting, four starter
 * prompts and a disabled send button — which is exactly what's shown while
 * the real thread (GET /chats/ai) is still loading. Once it answers, the
 * greeting shown here is replaced by the real transcript (which, for a
 * brand-new thread, is the very same greeting text — the backend writes it
 * once, the first time a thread is created). Sending posts to the real
 * assistant (POST /chats/ai/messages) — chart-grounded, tool-using, with its
 * own memory of the conversation — not a canned line.
 */
export function AiAstrologyChatScreen({ onBack }: AiAstrologyChatScreenProps) {
  const insets = useSafeAreaInsets();
  const transcript = useRef<ScrollViewHandle>(null);
  /** The keyboard covers the navigation bar, so its safe-area padding comes off the composer while it is open. */
  const keyboardOpen = useKeyboardOpen();
  useEffect(() => {
    if (keyboardOpen) {
      const timer = setTimeout(() => transcript.current?.scrollToEnd({ animated: true }), 80);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [keyboardOpen]);
  const [messages, setMessages] = useState<ChatMessage[]>([
    ...openingMessages,
  ]);
  const [draft, setDraft] = useState('');
  const [inputHeight, setInputHeight] = useState(INPUT_MIN_HEIGHT);
  const [sending, setSending] = useState(false);
  /** The messages this screen used to hand to `Alert.alert`. `show` is stable, so the load effect can depend on it. */
  const { request: dialogRequest, show: showDialog, dismiss: dismissDialog } = useDialog();

  useEffect(() => {
    let live = true;

    fetchAiThread()
      .then(thread => {
        if (!live) return;
        if (thread.items.length > 0) {
          setMessages(thread.items.map(toChatMessage));
        }
      })
      .catch(error => {
        if (!live) return;
        showDialog({
          title: 'Could not load your conversation',
          tone: 'error',
          message: error instanceof ApiError ? error.message : 'Something went wrong. Please try again.',
        });
      });

    return () => {
      live = false;
    };
  }, [showDialog]);

  const canSend = draft.trim().length > 0 && !sending;

  const send = async (text: string) => {
    const body = text.trim();
    if (!body || sending) {
      return;
    }

    setMessages(current => [
      ...current,
      { id: `local-${Date.now()}`, role: 'user', text: body },
    ]);
    setDraft('');
    setInputHeight(INPUT_MIN_HEIGHT);
    setSending(true);
    requestAnimationFrame(() => transcript.current?.scrollToEnd());

    try {
      const result = await askAi(body);
      setMessages(current => [...current, toChatMessage(result.answer)]);
    } catch (error) {
      showDialog({
        title: 'Could not get a reply',
        tone: 'error',
        message: error instanceof ApiError ? error.message : 'Something went wrong. Please try again.',
      });
    } finally {
      setSending(false);
      requestAnimationFrame(() => transcript.current?.scrollToEnd());
    }
  };

  return (
    <View style={styles.screen}>
      <StatusBar barStyle="dark-content" />

      <KeyboardAvoidingView
        style={styles.screen}
        /** 'padding' on Android too — edge-to-edge ignores adjustResize, see hooks/useKeyboardOpen.ts. */
        behavior="padding"
        keyboardVerticalOffset={0}
      >
        <View
          style={[
            styles.header,
            {
              paddingTop:
                insets.top + (DESIGN_PADDING_TOP - designFrame.statusBarHeight),
            },
          ]}
        >
          <BackButton
            onPress={onBack}
            backgroundColor="transparent"
            iconColor={colors.border.strong}
          />

          <View style={styles.avatarTile}>
            <Image
              source={assistant.avatar}
              style={styles.avatarImage}
              resizeMode="cover"
            />
          </View>

          <View style={styles.identity}>
            <Text style={styles.name}>{assistant.name}</Text>
            <View style={styles.statusRow}>
              <View style={styles.statusDot} />
              <Text style={styles.status}>{assistant.status}</Text>
            </View>
          </View>
        </View>

        <ScrollView
          ref={transcript}
          style={styles.transcript}
          contentContainerStyle={styles.transcriptContent}
          keyboardShouldPersistTaps="handled"
          onContentSizeChange={() => transcript.current?.scrollToEnd()}
        >
          {messages.map(message => (
            <ChatBubble key={message.id} message={message} />
          ))}
        </ScrollView>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          style={styles.chipScroller}
          contentContainerStyle={styles.chips}
        >
          {suggestedPrompts.map(prompt => (
            <Pressable
              key={prompt}
              accessibilityRole="button"
              accessibilityState={{ disabled: sending }}
              disabled={sending}
              onPress={() => send(prompt)}
              style={({ pressed }) => [styles.chip, pressed && styles.pressed]}
            >
              <Text style={styles.chipLabel}>{prompt}</Text>
            </Pressable>
          ))}
        </ScrollView>

        <View style={[styles.composer, { paddingBottom: 24 + (keyboardOpen ? 0 : insets.bottom) }]}>
          <TextInput
            value={draft}
            onChangeText={setDraft}
            placeholder="Ask about your stars..."
            placeholderTextColor={colors.text.placeholder}
            accessibilityLabel="Ask about your stars"
            multiline
            onContentSizeChange={event =>
              setInputHeight(event.nativeEvent.contentSize.height)
            }
            style={[
              styles.input,
              {
                height: Math.min(
                  Math.max(inputHeight, INPUT_MIN_HEIGHT),
                  INPUT_MAX_HEIGHT,
                ),
              },
            ]}
          />

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Send"
            accessibilityState={{ disabled: !canSend }}
            disabled={!canSend}
            onPress={() => send(draft)}
            style={({ pressed }) => [
              styles.sendButton,
              canSend && styles.sendButtonActive,
              pressed && styles.pressed,
            ]}
          >
            {sending ? (
              <ActivityIndicator size="small" color={colors.text.muted} />
            ) : (
              <SendIcon
                size={SEND_ICON}
                color={canSend ? colors.text.inverse : colors.text.muted}
              />
            )}
          </Pressable>
        </View>
      </KeyboardAvoidingView>
      <AppDialog request={dialogRequest} onDismiss={dismissDialog} />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.brandYellow,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
  },
  avatarTile: {
    width: AVATAR_TILE,
    height: AVATAR_TILE,
    borderRadius: radius.field,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarImage: {
    width: AVATAR_IMAGE,
    height: AVATAR_IMAGE,
  },
  identity: {
    flex: 1,
  },
  name: {
    ...typography.button,
    color: colors.text.onYellowStrong,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  statusDot: {
    width: STATUS_DOT,
    height: STATUS_DOT,
    borderRadius: STATUS_DOT / 2,
    backgroundColor: colors.success.accent,
  },
  status: {
    ...typography.caption,
    color: colors.success.accent,
  },
  transcript: {
    flex: 1,
  },
  transcriptContent: {
    paddingHorizontal: spacing.section,
    paddingTop: spacing.section,
    paddingBottom: spacing.sm,
  },
  chipScroller: {
    flexGrow: 0,
  },
  chips: {
    gap: spacing.sm,
    paddingHorizontal: spacing.section,
    paddingBottom: spacing.sm,
  },
  chip: {
    height: CHIP_HEIGHT,
    borderRadius: radius.badge,
    borderWidth: hairline,
    borderColor: colors.border.soft,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12.755,
  },
  chipLabel: {
    ...typography.caption,
    color: colors.text.onYellow,
    textAlign: 'center',
  },
  pressed: {
    opacity: 0.7,
  },
  composer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 10,
    backgroundColor: colors.surface,
    borderTopWidth: hairline,
    borderTopColor: colors.border.subtle,
    paddingHorizontal: spacing.section,
    paddingTop: 8.755,
  },
  input: {
    ...typography.chatInput,
    flex: 1,
    maxHeight: INPUT_MAX_HEIGHT,
    borderRadius: radius.field,
    borderWidth: hairline,
    borderColor: colors.border.subtle,
    backgroundColor: colors.surfaceSubtle,
    color: colors.text.primary,
    paddingHorizontal: 14.755,
    paddingVertical: 10.755,
    textAlignVertical: 'center',
  },
  sendButton: {
    width: SEND_SIZE,
    height: SEND_SIZE,
    borderRadius: radius.field,
    backgroundColor: colors.border.subtle,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonActive: {
    backgroundColor: colors.gradient.from,
  },
});
