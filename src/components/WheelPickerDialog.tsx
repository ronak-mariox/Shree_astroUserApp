import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
  type NativeSyntheticEvent,
  type NativeScrollEvent,
} from 'react-native';

import { BrandGradient } from './BrandGradient';
import { colors, radius, spacing, typography } from '../theme';

const CARD_WIDTH = 343;
const ROW_HEIGHT = 56;
const VISIBLE_ROWS = 3;
const WHEEL_HEIGHT = ROW_HEIGHT * VISIBLE_ROWS;
const ACTION_HEIGHT = 56;
/** A value at the very edge of the fade is this dim; the centre is always full opacity. */
const EDGE_OPACITY = 0.3;
const EDGE_SCALE = 0.86;

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
 * One column: a real drag-and-flick scrolling list, snapped to a row at a
 * time, with the centre row ruled and its neighbours faded and shrunk either
 * side of it — the classic wheel-picker feel, built on FlatList so a long
 * column (e.g. a birth year running 1940-2026) is a flick away rather than a
 * tap per year, with no native picker dependency required.
 */
function Wheel({
  column,
  selected,
  onChange,
}: {
  column: WheelColumn;
  selected: string;
  onChange: (value: string) => void;
}) {
  const listRef = useRef<FlatList<string>>(null);
  const scrollY = useRef(new Animated.Value(0)).current;
  const initialIndex = Math.max(0, column.values.indexOf(selected));

  /**
   * `initialScrollIndex` aligns an item's TOP edge with the viewport's top,
   * not its centre — wrong for a wheel, where the selection has to land in
   * the middle row. Landing there is instead done by hand, once, right after
   * this fresh mount (this component remounts on every dialog open — see
   * `openId` below — so an effect with no deps is exactly "once per open").
   */
  useEffect(() => {
    listRef.current?.scrollToOffset({ offset: initialIndex * ROW_HEIGHT, animated: false });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const commitFromOffset = (offsetY: number) => {
    const index = Math.max(0, Math.min(column.values.length - 1, Math.round(offsetY / ROW_HEIGHT)));
    const next = column.values[index];
    if (next !== undefined && next !== selected) {
      onChange(next);
    }
  };

  const handleSettled = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    commitFromOffset(event.nativeEvent.contentOffset.y);
  };

  const scrollToIndex = (index: number) => {
    listRef.current?.scrollToOffset({ offset: index * ROW_HEIGHT, animated: true });
  };

  return (
    <View
      style={[styles.column, column.narrow && styles.columnNarrow]}
      accessibilityLabel={`${column.key} ${selected}`}
    >
      <Animated.FlatList
        ref={listRef}
        data={column.values as string[]}
        keyExtractor={item => item}
        style={styles.wheelList}
        showsVerticalScrollIndicator={false}
        snapToInterval={ROW_HEIGHT}
        decelerationRate="fast"
        bounces={false}
        /** `offset` must include the leading row of padding below (`wheelContent`) — it's a content-space position, not an item-index position. */
        getItemLayout={(_, index) => ({ length: ROW_HEIGHT, offset: ROW_HEIGHT + ROW_HEIGHT * index, index })}
        contentContainerStyle={styles.wheelContent}
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], {
          useNativeDriver: true,
        })}
        scrollEventThrottle={16}
        onMomentumScrollEnd={handleSettled}
        /** A slow drag that never enters a momentum phase still needs to commit its landing row. */
        onScrollEndDrag={handleSettled}
        renderItem={({ item, index }) => {
          const inputRange = [(index - 1) * ROW_HEIGHT, index * ROW_HEIGHT, (index + 1) * ROW_HEIGHT];
          const opacity = scrollY.interpolate({
            inputRange,
            outputRange: [EDGE_OPACITY, 1, EDGE_OPACITY],
            extrapolate: 'clamp',
          });
          const scale = scrollY.interpolate({
            inputRange,
            outputRange: [EDGE_SCALE, 1, EDGE_SCALE],
            extrapolate: 'clamp',
          });
          return (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Select ${column.key} ${item}`}
              onPress={() => scrollToIndex(index)}
              style={styles.cell}
            >
              <Animated.Text style={[styles.wheelValue, { opacity, transform: [{ scale }] }]}>
                {item}
              </Animated.Text>
            </Pressable>
          );
        }}
      />
      <View pointerEvents="none" style={styles.selectionRule} />
    </View>
  );
}

/**
 * The wheel dialog behind the intake form's date and time fields.
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
  /** Bumped every time the dialog opens, so each column's FlatList remounts fresh and lands exactly on the current value instead of wherever a previous open left it scrolled. */
  const [openId, setOpenId] = useState(0);

  // Reopening starts from whatever the field holds now, and forces a fresh scroll position.
  useEffect(() => {
    if (visible) {
      setDraft(value);
      setOpenId(id => id + 1);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  const setColumnValue = (key: string, columnValue: string) => {
    setDraft(current => ({ ...current, [key]: columnValue }));
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

          <View style={styles.wheels}>
            {columns.map((column, index) => (
              <React.Fragment key={`${column.key}-${openId}`}>
                {index > 0 && column.separator !== undefined && (
                  <Text style={styles.separator}>{column.separator}</Text>
                )}
                <Wheel
                  column={column}
                  selected={draft[column.key] ?? column.values[0]}
                  onChange={next => setColumnValue(column.key, next)}
                />
              </React.Fragment>
            ))}
          </View>

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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.lg,
    paddingVertical: spacing.sm,
  },
  column: {
    minWidth: 44,
    height: WHEEL_HEIGHT,
  },
  columnNarrow: {
    minWidth: 38,
  },
  wheelList: {
    height: WHEEL_HEIGHT,
  },
  wheelContent: {
    // One row of padding top and bottom, so the first/last real value can still reach the centre.
    paddingVertical: ROW_HEIGHT,
  },
  cell: {
    height: ROW_HEIGHT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  wheelValue: {
    ...typography.pickerValue,
    color: colors.text.picker,
    textAlign: 'center',
  },
  /** A fixed, non-scrolling ruled line marking the centre row — Figma rules the selected row top and bottom at half a point. */
  selectionRule: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: ROW_HEIGHT,
    height: ROW_HEIGHT,
    borderTopWidth: 0.5,
    borderBottomWidth: 0.5,
    borderColor: colors.border.picker,
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
