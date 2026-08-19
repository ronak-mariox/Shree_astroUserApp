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
const ROW_HEIGHT = 56;
const ACTION_HEIGHT = 56;
/** The neighbours above and below the selection are dimmed, not hidden. */
const NEIGHBOUR_OPACITY = 0.3;

export type WheelColumn = {
  key: string;
  values: ReadonlyArray<string>;
  /** Printed between this column and the next — the ":" in a clock. */
  separator?: string;
  /** A narrow column, as AM/PM is drawn. */
  narrow?: boolean;
};

type WheelPickerDialogProps = {
  visible: boolean;
  title: string;
  columns: ReadonlyArray<WheelColumn>;
  /** Selected value per column key; missing keys start on the first value. */
  value: Record<string, string>;
  onCancel: () => void;
  onSubmit: (value: Record<string, string>) => void;
};

/**
 * The three-row wheel behind the intake form's date and time fields: the
 * selection is ruled top and bottom, with the previous and next values faded
 * either side of it.
 * Figma: nodes 180:98361 (Select Time) and its Select Date twin at 180:100079.
 */
export function WheelPickerDialog({
  visible,
  title,
  columns,
  value,
  onCancel,
  onSubmit,
}: WheelPickerDialogProps) {
  const [draft, setDraft] = useState<Record<string, string>>(value);

  // Reopening starts from whatever the field holds now.
  useEffect(() => {
    if (visible) {
      setDraft(value);
    }
  }, [visible, value]);

  const indexOf = (column: WheelColumn) => {
    const current = draft[column.key];
    const index = column.values.indexOf(current);
    return index >= 0 ? index : 0;
  };

  const step = (column: WheelColumn, delta: number) => {
    const next = indexOf(column) + delta;
    if (next < 0 || next >= column.values.length) {
      return;
    }
    setDraft(current => ({ ...current, [column.key]: column.values[next] }));
  };

  /** One wheel: the value above, the selection, the value below. */
  const renderColumn = (column: WheelColumn) => {
    const index = indexOf(column);
    const previous = index > 0 ? column.values[index - 1] : '';
    const next =
      index < column.values.length - 1 ? column.values[index + 1] : '';

    return (
      <View
        key={column.key}
        style={[styles.column, column.narrow && styles.columnNarrow]}
      >
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Previous ${column.key}`}
          disabled={previous === ''}
          onPress={() => step(column, -1)}
          style={styles.cell}
        >
          <Text style={styles.neighbour}>{previous}</Text>
        </Pressable>

        <View style={[styles.cell, styles.selectedCell]}>
          <Text
            accessibilityLabel={`${column.key} ${draft[column.key] ?? column.values[0]}`}
            style={styles.selected}
          >
            {draft[column.key] ?? column.values[0]}
          </Text>
        </View>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Next ${column.key}`}
          disabled={next === ''}
          onPress={() => step(column, 1)}
          style={styles.cell}
        >
          <Text style={styles.neighbour}>{next}</Text>
        </Pressable>
      </View>
    );
  };

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

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.wheels}
          >
            {columns.map((column, index) => (
              <React.Fragment key={column.key}>
                {index > 0 && column.separator !== undefined && (
                  <Text style={styles.separator}>{column.separator}</Text>
                )}
                {renderColumn(column)}
              </React.Fragment>
            ))}
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
              onPress={() => onSubmit(draft)}
              style={({ pressed }) => [
                styles.action,
                styles.submit,
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
  wheels: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.lg,
    paddingVertical: spacing.sm,
  },
  column: {
    minWidth: 44,
  },
  columnNarrow: {
    minWidth: 38,
  },
  cell: {
    height: ROW_HEIGHT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Figma rules the selected row top and bottom at half a point.
  selectedCell: {
    borderTopWidth: 0.5,
    borderBottomWidth: 0.5,
    borderColor: colors.border.picker,
  },
  selected: {
    ...typography.pickerValue,
    color: colors.text.picker,
    textAlign: 'center',
  },
  neighbour: {
    ...typography.pickerNeighbour,
    color: colors.text.picker,
    opacity: NEIGHBOUR_OPACITY,
    textAlign: 'center',
  },
  separator: {
    ...typography.pickerValue,
    color: colors.text.picker,
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
  pressed: {
    opacity: 0.8,
  },
});
