import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { DoubleTickIcon } from './icons/ChatRoomIcons';
import { colors, radius, spacing, typography } from '../theme';

const BUBBLE_MAX_WIDTH = 268;
const TICK_SIZE = 8;

export type ConsultationMessage = {
  id: string;
  /** Who typed it — the seeker using the app, or the astrologer. */
  from: 'seeker' | 'astrologer';
  lines: ReadonlyArray<string>;
  time: string;
  /** An earlier message this one replies to, printed above the body. */
  quote?: ReadonlyArray<string>;
};

type ConsultationBubbleProps = {
  message: ConsultationMessage;
};

/**
 * One message in a live consultation: the seeker's blush bubble on the right,
 * the astrologer's white one on the left, each squared off on the corner it is
 * sent from and stamped with its time and delivery ticks.
 * Figma: nodes 180:118806 (seeker), 180:118752 (astrologer) and 180:118762
 * (the quoted variant).
 */
export function ConsultationBubble({ message }: ConsultationBubbleProps) {
  const own = message.from === 'seeker';

  return (
    <View style={[styles.row, own && styles.rowOwn]}>
      <View style={[styles.bubble, own ? styles.bubbleOwn : styles.bubblePeer]}>
        {message.quote !== undefined && (
          <View style={styles.quote}>
            <View style={styles.quoteBar} />
            <View style={styles.quoteCopy}>
              {message.quote.map(line => (
                <Text key={line} style={styles.quoteLine}>
                  {line}
                </Text>
              ))}
            </View>
          </View>
        )}

        {message.lines.map((line, index) => (
          <Text key={`${message.id}-${index}`} style={styles.line}>
            {line}
          </Text>
        ))}

        <View style={styles.stamp}>
          <Text style={styles.time}>{message.time}</Text>
          <DoubleTickIcon size={TICK_SIZE} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
  },
  rowOwn: {
    justifyContent: 'flex-end',
  },
  bubble: {
    maxWidth: BUBBLE_MAX_WIDTH,
    borderRadius: radius.summary,
    paddingHorizontal: spacing.sm,
    paddingTop: 6,
    paddingBottom: 4,
  },
  // Figma squares off the corner each bubble is sent from.
  bubbleOwn: {
    backgroundColor: colors.surfaceBubbleOwn,
    borderTopRightRadius: 0,
  },
  bubblePeer: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 0,
  },
  line: {
    ...typography.chatLine,
    color: colors.text.onYellow,
  },
  quote: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 6,
  },
  quoteBar: {
    width: 3,
    borderRadius: 2,
    backgroundColor: colors.status.cancelMark,
  },
  quoteCopy: {
    flex: 1,
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.chip,
    paddingHorizontal: 6,
    paddingVertical: 4,
  },
  quoteLine: {
    ...typography.chatLine,
    color: colors.text.onYellow,
  },
  stamp: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-end',
    gap: 3,
    paddingTop: 2,
  },
  time: {
    ...typography.chatStamp,
    color: colors.text.onYellow,
  },
});
