import React, { useEffect, useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { BrandGradient } from './BrandGradient';
import { colors, radius, spacing, typography } from '../theme';

const CARD_WIDTH = 343;
const ROW_HEIGHT = 44;
const ACTION_HEIGHT = 56;

type OptionPickerDialogProps = {
  visible: boolean;
  title: string;
  options: ReadonlyArray<string>;
  value: string;
  onCancel: () => void;
  onSubmit: (value: string) => void;
};

/**
 * The list behind the intake form's "Topic of concern" field, cut to the same
 * card as the date and time wheels (Figma node 180:98361).
 */
export function OptionPickerDialog({
  visible,
  title,
  options,
  value,
  onCancel,
  onSubmit,
}: OptionPickerDialogProps) {
  const [chosen, setChosen] = useState(value);

  useEffect(() => {
    if (visible) {
      setChosen(value);
    }
  }, [visible, value]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onCancel}
      statusBarTranslucent
    >
      <View style={styles.stage}>
        <Pressable
          accessibilityLabel={`Close ${title}`}
          style={styles.scrim}
          onPress={onCancel}
        />

        <View style={styles.card}>
          <Text style={styles.title}>{title}</Text>

          <ScrollView style={styles.list}>
            {options.map(option => {
              const selected = option === chosen;

              return (
                <Pressable
                  key={option}
                  accessibilityRole="radio"
                  accessibilityState={{ selected }}
                  accessibilityLabel={option}
                  onPress={() => setChosen(option)}
                  style={({ pressed }) => [
                    styles.row,
                    pressed && styles.pressed,
                  ]}
                >
                  <Text style={selected ? styles.rowSelected : styles.rowLabel}>
                    {option}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>

          <View style={styles.actions}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Cancel"
              onPress={onCancel}
              style={({ pressed }) => [
                styles.action,
                styles.cancel,
                pressed && styles.pressed,
              ]}
            >
              <Text style={styles.cancelLabel}>Cancel</Text>
            </Pressable>

            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Submit"
              disabled={chosen === ''}
              onPress={() => onSubmit(chosen)}
              style={({ pressed }) => [
                styles.action,
                styles.submit,
                chosen === '' && styles.disabled,
                pressed && styles.pressed,
              ]}
            >
              <BrandGradient radius={radius.button} />
              <Text style={styles.submitLabel}>Submit</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  stage: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
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
    width: '100%',
    maxWidth: CARD_WIDTH,
    maxHeight: '70%',
    borderRadius: radius.card,
    backgroundColor: colors.surface,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.section,
  },
  title: {
    ...typography.pickerTitle,
    color: colors.text.picker,
    textAlign: 'center',
    textDecorationLine: 'underline',
    paddingBottom: spacing.md,
  },
  list: {
    flexShrink: 1,
  },
  row: {
    height: ROW_HEIGHT,
    justifyContent: 'center',
  },
  rowLabel: {
    ...typography.intakeValue,
    color: colors.text.picker,
  },
  rowSelected: {
    ...typography.intakeOption,
    color: colors.border.intakeSelected,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.section,
    paddingTop: spacing.lg,
  },
  action: {
    flex: 1,
    height: ACTION_HEIGHT,
    borderRadius: radius.action,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  cancel: {
    borderWidth: 1,
    borderColor: colors.border.pickerAction,
  },
  cancelLabel: {
    ...typography.pickerAction,
    color: colors.text.pickerMuted,
  },
  submit: {
    backgroundColor: colors.gradient.from,
  },
  submitLabel: {
    ...typography.pickerAction,
    color: colors.text.inverse,
  },
  disabled: {
    opacity: 0.5,
  },
  pressed: {
    opacity: 0.8,
  },
});
