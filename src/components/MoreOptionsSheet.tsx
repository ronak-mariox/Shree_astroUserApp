import React from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, fontFamily, radius, spacing, typography } from '../theme';

export type MoreOption = {
  /** Also what the row is pressed by, and what comes back to `onSelect`. */
  label: string;
  /** The line under it — what choosing this actually does. */
  hint?: string;
  icon: (props: { size?: number; color?: string }) => React.ReactElement;
  /** Draws the row in red: something the seeker should mean to press. */
  destructive?: boolean;
};

type MoreOptionsSheetProps = {
  visible: boolean;
  title: string;
  /** Under the title — who or what the choices are about. */
  subtitle?: string;
  options: ReadonlyArray<MoreOption>;
  onClose: () => void;
  onSelect: (label: string) => void;
};

/**
 * The menu behind a screen's header kebab.
 *
 * A sheet rather than the centred card of OptionPickerDialog, and it acts on the
 * first tap: a menu is a list of things to do, not a field being filled in, so
 * there is nothing to confirm afterwards. Built on the same slide-up frame as
 * ContinueConsultationSheet — scrim, top radii, safe-area bottom — so it reads as
 * part of the app rather than a second kind of overlay.
 *
 * Each row carries an icon and a line of its own saying what pressing it does,
 * because "Report" alone leaves a seeker guessing whether anything is sent, or to
 * whom.
 */
export function MoreOptionsSheet({
  visible,
  title,
  subtitle,
  options,
  onClose,
  onSelect,
}: MoreOptionsSheetProps) {
  const insets = useSafeAreaInsets();

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose} statusBarTranslucent>
      <View style={styles.stage}>
        <Pressable accessibilityLabel={`Close ${title}`} style={styles.scrim} onPress={onClose} />

        <View style={[styles.sheet, { paddingBottom: spacing.md + insets.bottom }]}>
          {/** The grabber every sheet in the app shows, so it reads as one. */}
          <View style={styles.handle} />

          <Text style={styles.title}>{title}</Text>
          {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}

          <View style={styles.rows}>
            {options.map(option => {
              const tint = option.destructive ? colors.status.negative : colors.text.primary;

              return (
                <Pressable
                  key={option.label}
                  accessibilityRole="button"
                  accessibilityLabel={option.label}
                  accessibilityHint={option.hint}
                  onPress={() => onSelect(option.label)}
                  style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
                >
                  <View style={[styles.iconWell, option.destructive && styles.iconWellDestructive]}>
                    {option.icon({ size: 20, color: tint })}
                  </View>

                  <View style={styles.rowText}>
                    <Text style={[styles.rowLabel, { color: tint }]}>{option.label}</Text>
                    {option.hint ? <Text style={styles.rowHint}>{option.hint}</Text> : null}
                  </View>
                </Pressable>
              );
            })}
          </View>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Cancel"
            onPress={onClose}
            style={({ pressed }) => [styles.cancel, pressed && styles.rowPressed]}
          >
            <Text style={styles.cancelLabel}>Cancel</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
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
    width: '100%',
    maxWidth: 480,
    borderTopLeftRadius: radius.sheet,
    borderTopRightRadius: radius.sheet,
    backgroundColor: colors.surface,
    paddingTop: spacing.sm,
    paddingHorizontal: spacing.section,
  },
  handle: {
    alignSelf: 'center',
    width: 44,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border.subtle,
    marginBottom: spacing.md,
  },
  title: {
    ...typography.subheading,
    color: colors.text.primary,
  },
  subtitle: {
    ...typography.caption,
    color: colors.text.secondary,
    marginTop: 2,
  },
  rows: {
    paddingTop: spacing.md,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
  },
  rowPressed: {
    opacity: 0.6,
  },
  iconWell: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceMuted,
  },
  iconWellDestructive: {
    backgroundColor: colors.status.negativeTint,
  },
  rowText: {
    flex: 1,
  },
  rowLabel: {
    ...typography.listTitle,
  },
  rowHint: {
    ...typography.caption,
    color: colors.text.secondary,
  },
  cancel: {
    marginTop: spacing.sm,
    height: 48,
    borderRadius: radius.button,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceMuted,
  },
  cancelLabel: {
    fontFamily: fontFamily.medium,
    fontSize: 14,
    color: colors.text.primary,
  },
});
