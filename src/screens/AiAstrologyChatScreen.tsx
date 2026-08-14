import React, { useRef, useState } from 'react';
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
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BackButton } from '../components/BackButton';
import { ChatBubble, type ChatMessage } from '../components/ChatBubble';
import { SendIcon } from '../components/icons/SendIcon';
import { assistant, openingMessages, suggestedPrompts } from '../data/chat';
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
 * prompts and a disabled send button. Sending is wired up here so the screen
 * works: the composer enables once there is something to send, and the typed
 * question is appended to the transcript.
 */
export function AiAstrologyChatScreen({ onBack }: AiAstrologyChatScreenProps) {
  const insets = useSafeAreaInsets();
  const transcript = useRef<ScrollViewHandle>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([
    ...openingMessages,
  ]);
  const [draft, setDraft] = useState('');
  const [inputHeight, setInputHeight] = useState(INPUT_MIN_HEIGHT);

  const canSend = draft.trim().length > 0;

  const send = (text: string) => {
    const body = text.trim();
    if (!body) {
      return;
    }

    setMessages(current => [
      ...current,
      { id: `m-${current.length}`, role: 'user', text: body },
    ]);
    setDraft('');
    setInputHeight(INPUT_MIN_HEIGHT);
    requestAnimationFrame(() => transcript.current?.scrollToEnd());
  };

  return (
    <View style={styles.screen}>
      <StatusBar barStyle="dark-content" />

      <KeyboardAvoidingView
        style={styles.screen}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
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
              onPress={() => send(prompt)}
              style={({ pressed }) => [styles.chip, pressed && styles.pressed]}
            >
              <Text style={styles.chipLabel}>{prompt}</Text>
            </Pressable>
          ))}
        </ScrollView>

        <View style={[styles.composer, { paddingBottom: 24 + insets.bottom }]}>
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
            <SendIcon
              size={SEND_ICON}
              color={canSend ? colors.text.inverse : colors.text.muted}
            />
          </Pressable>
        </View>
      </KeyboardAvoidingView>
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
