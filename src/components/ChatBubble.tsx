import React from 'react';
import {
  Image,
  Platform,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type TextStyle,
} from 'react-native';

import { colors, fontFamily, hairline, radius, spacing, typography } from '../theme';
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

/** A table's own separator row ("|---|:--:|"), never worth printing. */
const isTableRuleLine = (line: string) => /^\s*\|?\s*:?-{2,}:?\s*(\|\s*:?-{2,}:?\s*)*\|?\s*$/.test(line);
/** "| cell | cell |" — a real row of a markdown table. */
const isTableRowLine = (line: string) => {
  const trimmed = line.trim();
  return trimmed.length > 1 && trimmed.startsWith('|') && trimmed.endsWith('|');
};

/** "**bold**" / "__bold__" spans within one line — everything else passes through untouched. */
function renderInline(line: string, keyPrefix: string, strongStyle: StyleProp<TextStyle>): React.ReactNode {
  const parts = line.split(/(\*\*[^*]+\*\*|__[^_]+__)/g).filter(part => part.length > 0);
  if (parts.length <= 1) {
    return line;
  }
  return parts.map((part, index) => {
    const boldText =
      /^\*\*[^*]+\*\*$/.test(part) || /^__[^_]+__$/.test(part) ? part.slice(2, -2) : null;
    return boldText !== null ? (
      <Text key={`${keyPrefix}-${index}`} style={strongStyle}>
        {boldText}
      </Text>
    ) : (
      part
    );
  });
}

/**
 * A deliberately small, dependency-free subset of Markdown — bold, `#`
 * headings, and `-`/`*` bullet lists — rendered as real text instead of a
 * chat bubble showing an LLM reply's raw asterisks and hashes verbatim.
 *
 * Not a full renderer: a markdown table has no good home in a ~250px chat
 * bubble even parsed correctly (its columns would have to be a few
 * characters wide), so a table row is flattened into one plain line rather
 * than drawn as a grid. The assistant's own system prompt is asked not to
 * send tables/headings-heavy formatting into this narrow a space in the
 * first place — this is only the fallback for whatever slips through anyway
 * (and for older messages already stored before that prompt existed).
 */
function FormattedText({
  text,
  baseStyle,
  strongStyle,
}: {
  text: string;
  baseStyle: StyleProp<TextStyle>;
  strongStyle: StyleProp<TextStyle>;
}) {
  const blocks: React.ReactNode[] = [];

  text.split('\n').forEach((rawLine, index) => {
    const line = rawLine.trimEnd();
    const key = `l-${index}`;

    if (line.trim() === '' || isTableRuleLine(line)) {
      return;
    }

    const heading = /^#{1,6}\s+(.*)$/.exec(line);
    if (heading) {
      blocks.push(
        <Text key={key} style={[baseStyle, strongStyle, styles.block]}>
          {renderInline(heading[1], key, strongStyle)}
        </Text>,
      );
      return;
    }

    const bullet = /^\s*[-*+]\s+(.*)$/.exec(line);
    if (bullet) {
      blocks.push(
        <View key={key} style={styles.bulletRow}>
          <Text style={baseStyle}>{'•  '}</Text>
          <Text style={[baseStyle, styles.bulletText]}>
            {renderInline(bullet[1], key, strongStyle)}
          </Text>
        </View>,
      );
      return;
    }

    if (isTableRowLine(line)) {
      const cells = line.split('|').map(cell => cell.trim()).filter(Boolean);
      blocks.push(
        <Text key={key} style={[baseStyle, styles.block]}>
          {renderInline(cells.join('   ·   '), key, strongStyle)}
        </Text>,
      );
      return;
    }

    blocks.push(
      <Text key={key} style={[baseStyle, styles.block]}>
        {renderInline(line, key, strongStyle)}
      </Text>,
    );
  });

  return <>{blocks}</>;
}

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
        <FormattedText
          text={message.text}
          baseStyle={[styles.text, isUser && styles.textUser]}
          strongStyle={[styles.textStrong, isUser && styles.textUser]}
        />
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
  textStrong: {
    fontFamily: fontFamily.bold,
  },
  textUser: {
    color: colors.text.inverse,
  },
  /** Each line renders as its own block — a little bottom margin keeps stacked lines from crowding, since a bare "\n" no longer runs through a single Text node. */
  block: {
    marginBottom: 4,
  },
  bulletRow: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  bulletText: {
    flex: 1,
  },
});
