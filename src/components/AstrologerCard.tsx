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
import { BrandGradient } from './BrandGradient';
import { ChatBubbleIcon } from './icons/ChatBubbleIcon';
import { PhoneIcon } from './icons/PhoneIcon';

const CARD_WIDTH = 155.994;
const AVATAR_SIZE = 55.998;
const STATUS_SIZE = 13.994;
const ACTION_HEIGHT = 29.993;
const ACTION_ICON = 9.994;

export type Astrologer = {
  id: string;
  name: string;
  speciality: string;
  experience: string;
  rate: string;
  photo: ImageSourcePropType;
  online?: boolean;
};

type AstrologerCardProps = {
  astrologer: Astrologer;
  onChatPress?: () => void;
  onCallPress?: () => void;
};

/**
 * Portrait card in the "Top Astrologers" carousel (Figma node 180:89041):
 * photo with a presence dot, name, speciality, rate, and the Chat / Call pair.
 */
export function AstrologerCard({
  astrologer,
  onChatPress,
  onCallPress,
}: AstrologerCardProps) {
  const { name, speciality, experience, rate, photo, online = false } =
    astrologer;

  return (
    <View style={styles.card}>
      <View style={styles.avatarWrapper}>
        <Image source={photo} style={styles.avatar} resizeMode="cover" />
        {online && <View style={styles.status} />}
      </View>

      <Text style={styles.name}>{name}</Text>
      <Text style={styles.speciality}>{speciality}</Text>

      <View style={styles.meta}>
        <Text style={styles.experience}>{experience}</Text>
        <Text style={styles.rate}>{rate}</Text>
      </View>

      <View style={styles.actions}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Chat with ${name}`}
          onPress={onChatPress}
          style={({ pressed }) => [
            styles.action,
            styles.chatAction,
            pressed && styles.pressed,
          ]}
        >
          <ChatBubbleIcon size={ACTION_ICON} color={colors.text.ink} />
          <Text style={[styles.actionLabel, styles.chatLabel]}>Chat</Text>
        </Pressable>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Call ${name}`}
          onPress={onCallPress}
          style={({ pressed }) => [
            styles.action,
            styles.callAction,
            pressed && styles.pressed,
          ]}
        >
          <BrandGradient radius={radius.button} />
          <PhoneIcon size={ACTION_ICON} color={colors.text.inverse} />
          <Text style={[styles.actionLabel, styles.callLabel]}>Call</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: CARD_WIDTH,
    borderRadius: radius.panel,
    borderWidth: hairline,
    borderColor: colors.border.card,
    backgroundColor: colors.surface,
    paddingHorizontal: 14.755,
    paddingVertical: 16.755,
    // drop-shadow(0 4px 8px rgba(0, 0, 0, 0.07))
    ...Platform.select({
      ios: {
        shadowColor: colors.shadow,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.07,
        shadowRadius: 8,
      },
      android: { elevation: 3 },
      default: {},
    }),
  },
  avatarWrapper: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
  },
  avatar: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: radius.summary,
    backgroundColor: colors.surface,
  },
  status: {
    position: 'absolute',
    left: 44.5,
    top: 42,
    width: STATUS_SIZE,
    height: STATUS_SIZE,
    borderRadius: STATUS_SIZE / 2,
    borderWidth: 2.265,
    borderColor: colors.surface,
    backgroundColor: colors.success.accent,
  },
  name: {
    ...typography.cardName,
    color: colors.text.primary,
    paddingTop: 10,
  },
  speciality: {
    ...typography.footnoteSmall,
    color: colors.text.muted,
    paddingTop: 3,
  },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: spacing.sm,
  },
  experience: {
    ...typography.microLabel,
    color: colors.text.muted,
  },
  rate: {
    ...typography.priceLabel,
    color: colors.border.strong,
  },
  actions: {
    flexDirection: 'row',
    gap: 6,
    paddingTop: 10,
  },
  action: {
    flex: 1,
    height: ACTION_HEIGHT,
    borderRadius: radius.button,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
    overflow: 'hidden',
  },
  chatAction: {
    backgroundColor: colors.surface,
    borderWidth: hairline,
    borderColor: colors.text.ink,
  },
  callAction: {
    backgroundColor: colors.gradient.from,
  },
  pressed: {
    opacity: 0.8,
  },
  actionLabel: {
    ...typography.chipLabel,
    textAlign: 'center',
  },
  chatLabel: {
    color: colors.text.ink,
  },
  callLabel: {
    color: colors.text.inverse,
  },
});
