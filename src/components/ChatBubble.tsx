import React from 'react';
import { Image, Platform, StyleSheet, Text, View } from 'react-native';

import { colors, hairline, radius, spacing, typography } from '../theme';
import { BrandGradient } from './BrandGradient';

const AVATAR_SIZE = 31.999;
const AVATAR_IMAGE_SIZE = 22;
const BUBBLE_MAX_WIDTH = 250;

/** Same zodiac-emblem crop as the Welcome screen hero (Figma node 518:7854). */
const ASSISTANT_AVATAR = require('../assets/images/welcome-hero-emblem.png');

export type ChatRole = 'assistant' | 'user';

export type ChatMessage = {
  id: string;
  role: ChatRole;
  text: string;
};

type ChatBubbleProps = {
  message: ChatMessage;
};

/**
 * One turn of the conversation (Figma node 180:163511): the assistant's
 * gradient avatar beside a white bubble whose bottom-left corner is clipped
 * back to point at it.
 *
 * Figma only pins the assistant's turn, so the user variant mirrors the same
 * geometry — tail on the bottom right — and fills with the brand gradient the
 * rest of the app uses for the "you" side of an interaction.
 */
export function ChatBubble({ message }: ChatBubbleProps) {
  const isUser = message.role === 'user';

  return (
    <View style={[styles.row, isUser && styles.rowUser]}>
      {!isUser && (
        <View style={styles.avatar}>
          <BrandGradient
            radius={radius.badge}
            angle="toRight"
            from={colors.gradient.avatarFrom}
            to={colors.gradient.avatarTo}
          />
          <Image source={ASSISTANT_AVATAR} style={styles.avatarImage} resizeMode="cover" />
        </View>
      )}

      <View
        style={[
          styles.bubble,
          isUser ? styles.bubbleUser : styles.bubbleAssistant,
        ]}
      >
        {isUser && <BrandGradient radius={radius.input} />}
        <Text style={[styles.text, isUser && styles.textUser]}>
          {message.text}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: spacing.sm,
    paddingBottom: spacing.md,
  },
  rowUser: {
    justifyContent: 'flex-end',
  },
  avatar: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: radius.badge,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarImage: {
    width: AVATAR_IMAGE_SIZE,
    height: AVATAR_IMAGE_SIZE * (1024 / 1201),
  },
  bubble: {
    maxWidth: BUBBLE_MAX_WIDTH,
    borderRadius: radius.input,
    paddingHorizontal: 14.755,
    paddingVertical: 12.755,
    overflow: 'hidden',
  },
  bubbleAssistant: {
    backgroundColor: colors.surface,
    borderWidth: hairline,
    borderColor: colors.border.subtle,
    borderBottomLeftRadius: radius.bubbleTail,
    // drop-shadow(0 2px 4px rgba(0, 0, 0, 0.06))
    ...Platform.select({
      ios: {
        shadowColor: colors.shadow,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 4,
      },
      android: { elevation: 2 },
      default: {},
    }),
  },
  bubbleUser: {
    backgroundColor: colors.gradient.from,
    borderBottomRightRadius: radius.bubbleTail,
  },
  text: {
    ...typography.bodySmall,
    color: colors.text.bubble,
  },
  textUser: {
    color: colors.text.inverse,
  },
});
