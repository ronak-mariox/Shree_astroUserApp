import React from 'react';
import {
  Image,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
  type ImageSourcePropType,
} from 'react-native';

import { colors, hairline, radius, spacing, typography } from '../theme';

const AVATAR_SIZE = 45.992;

export type Consultation = {
  id: string;
  astrologer: string;
  /** e.g. "Chat Consultation · 32 min". */
  summary: string;
  date: string;
  amount: string;
  photo: ImageSourcePropType;
};

type ConsultationRowProps = {
  consultation: Consultation;
  onPress?: () => void;
};

/** One past consultation in the home feed (Figma node 180:89165). */
export function ConsultationRow({
  consultation,
  onPress,
}: ConsultationRowProps) {
  const { astrologer, summary, date, amount, photo } = consultation;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${astrologer}. ${summary}. ${date}. ${amount}`}
      onPress={onPress}
      style={({ pressed }) => [styles.row, pressed && styles.pressed]}
    >
      <Image source={photo} style={styles.avatar} resizeMode="cover" />

      <View style={styles.copy}>
        <Text style={styles.name}>{astrologer}</Text>
        <Text style={styles.summary}>{summary}</Text>
        <Text style={styles.date}>{date}</Text>
      </View>

      <Text style={styles.amount}>{amount}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    borderRadius: radius.summary,
    borderWidth: hairline,
    borderColor: colors.border.card,
    backgroundColor: colors.surface,
    padding: 14.755,
    // drop-shadow(0 2px 5px rgba(0, 0, 0, 0.05))
    ...Platform.select({
      ios: {
        shadowColor: colors.shadow,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 5,
      },
      android: { elevation: 2 },
      default: {},
    }),
  },
  pressed: {
    opacity: 0.8,
  },
  avatar: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: radius.tile,
    backgroundColor: colors.surface,
  },
  copy: {
    flex: 1,
  },
  name: {
    ...typography.rowTitle,
    color: colors.text.primary,
  },
  summary: {
    ...typography.caption,
    color: colors.text.muted,
    paddingTop: 2,
  },
  date: {
    ...typography.footnoteSmall,
    color: colors.text.faint,
    paddingTop: 2,
  },
  amount: {
    ...typography.cardTitle,
    color: colors.border.strong,
  },
});
