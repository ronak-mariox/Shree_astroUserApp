import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  type TextProps,
  useWindowDimensions,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  consultFilterPalette,
  consultFilterSections,
  type ConsultFilterSectionKey,
  type ConsultFilterSelection,
} from '../data/consultFilters';
import { colors, fontFamily, radius } from '../theme';
import { BrandGradient } from './BrandGradient';
import { FilterCheckbox, FilterCloseIcon } from './icons/FilterIcons';

/**
 * Figma drew the sheet on the same 402pt frame as the screen behind it
 * (node 180:90953), 485pt tall, so every number below is that frame's and the
 * whole sheet is scaled by the device's width over 402 — which keeps the
 * 159pt section rail and the 20pt checkbox gutter in the proportions drawn.
 */
const DESIGN_WIDTH = 402;
const SHEET_HEIGHT = 485;
const HEADER_HEIGHT = 39.717;
/** Top of the body, measured from the top of the sheet. */
const BODY_TOP = 40.211;
const BODY_HEIGHT = 350.407;
const RAIL_WIDTH = 159.234;
const SECTION_ROW_HEIGHT = 42.99;
/** Green tab pinned to the left edge of the selected section. */
const SECTION_TAB_WIDTH = 7.361;
/** The options list starts below the "Select all - Clear" strip. */
const OPTIONS_TOP = 41.42;
const OPTION_HEIGHT = 18;
const OPTION_GAP = 10.783;
const CHECKBOX = 12;

const ICON = {
  close: 22.6687,
} as const;

/**
 * The rail packs eight fixed-height rows against a 43pt rhythm, so the sheet's
 * type has to stay at the size Figma drew it. Every label here is set with this
 * rather than Text, matching the screen behind it.
 */
function Label({ style, children, ...rest }: TextProps) {
  return (
    <Text allowFontScaling={false} style={style} {...rest}>
      {children}
    </Text>
  );
}

type ConsultFilterSheetProps = {
  visible: boolean;
  /** The applied selection — the sheet edits a draft of it until Apply. */
  value: ConsultFilterSelection;
  onClose: () => void;
  onApply: (selection: ConsultFilterSelection) => void;
};

/**
 * The Sort & Filter sheet behind the header's slider button — a rail of
 * sections on the left, that section's options on the right, and one CTA that
 * hands the whole selection back. Figma: node 180:90555.
 */
export function ConsultFilterSheet({
  visible,
  value,
  onClose,
  onApply,
}: ConsultFilterSheetProps) {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const scale = width / DESIGN_WIDTH;
  const styles = useMemo(() => createStyles(scale), [scale]);

  const [section, setSection] = useState<ConsultFilterSectionKey>('expertise');
  const [draft, setDraft] = useState<ConsultFilterSelection>(value);

  /** Read through a ref so re-opening resets the draft, but editing it does not. */
  const applied = useRef(value);
  applied.current = value;

  // Keeps the sheet mounted through its exit so it can slide back out.
  const [mounted, setMounted] = useState(visible);
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      setDraft(applied.current);
      setSection('expertise');
      setMounted(true);
      Animated.timing(progress, {
        toValue: 1,
        duration: 220,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start();
      return;
    }

    Animated.timing(progress, {
      toValue: 0,
      duration: 180,
      easing: Easing.in(Easing.cubic),
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (finished) {
        setMounted(false);
      }
    });
  }, [visible, progress]);

  const active = consultFilterSections.find(item => item.key === section);
  const selected = draft[section];

  /** Sort sections hold one answer, so a second tick replaces the first. */
  const toggle = (id: string) => {
    setDraft(current => {
      const ids = current[section];
      if (active?.mode === 'single') {
        return { ...current, [section]: ids.includes(id) ? [] : [id] };
      }
      return {
        ...current,
        [section]: ids.includes(id)
          ? ids.filter(entry => entry !== id)
          : [...ids, id],
      };
    });
  };

  const setAll = (ids: ReadonlyArray<string>) => {
    setDraft(current => ({ ...current, [section]: ids }));
  };

  if (!mounted) {
    return null;
  }

  const slide = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [(SHEET_HEIGHT + insets.bottom) * scale, 0],
  });

  return (
    <Modal
      visible
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <View style={styles.root}>
        <Animated.View style={[styles.scrim, { opacity: progress }]}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Dismiss filters"
            onPress={onClose}
            style={StyleSheet.absoluteFill}
          />
        </Animated.View>

        <Animated.View
          style={[
            styles.sheet,
            {
              paddingBottom: insets.bottom,
              transform: [{ translateY: slide }],
            },
          ]}
        >
          <View style={styles.header}>
            <Label style={styles.headerTitle}>Sort &amp; Filter</Label>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Close filters"
              onPress={onClose}
              style={({ pressed }) => [
                styles.close,
                pressed && styles.dimmed,
              ]}
            >
              <FilterCloseIcon size={ICON.close * scale} />
            </Pressable>
          </View>

          <View style={styles.body}>
            {/* Drawn under the rail so the selected row, which is a point
                wider than the rail, punches a gap through it. */}
            <View style={styles.rule} />

            <View style={styles.rail}>
              {consultFilterSections.map(item => {
                const current = item.key === section;
                const marked = draft[item.key].length > 0;

                return (
                  <Pressable
                    key={item.key}
                    accessibilityRole="tab"
                    accessibilityState={{ selected: current }}
                    accessibilityLabel={`${item.label} filters`}
                    onPress={() => setSection(item.key)}
                    style={[
                      styles.sectionRow,
                      current && styles.sectionRowOn,
                    ]}
                  >
                    {current && <View style={styles.sectionTab} />}
                    <Label
                      numberOfLines={1}
                      style={
                        current ? styles.sectionLabelOn : styles.sectionLabel
                      }
                    >
                      {item.label}
                    </Label>
                    {marked && <View style={styles.sectionDot} />}
                  </Pressable>
                );
              })}
            </View>

            <View style={styles.panel}>
              <View style={styles.panelHeader}>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`Select all ${active?.label ?? ''}`}
                  onPress={() =>
                    setAll(active?.options.map(option => option.id) ?? [])
                  }
                  disabled={active?.mode === 'single'}
                >
                  <Label
                    style={[
                      styles.panelAction,
                      active?.mode === 'single' && styles.panelActionOff,
                    ]}
                  >
                    Select all
                  </Label>
                </Pressable>
                <Label style={styles.panelAction}>&nbsp;-&nbsp;</Label>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`Clear ${active?.label ?? ''}`}
                  onPress={() => setAll([])}
                >
                  <Label style={styles.panelAction}>Clear</Label>
                </Pressable>
              </View>

              <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.options}
              >
                {active?.options.map(option => {
                  const checked = selected.includes(option.id);

                  return (
                    <Pressable
                      key={option.id}
                      accessibilityRole="checkbox"
                      accessibilityState={{ checked }}
                      accessibilityLabel={option.label}
                      onPress={() => toggle(option.id)}
                      style={({ pressed }) => [
                        styles.option,
                        pressed && styles.dimmed,
                      ]}
                    >
                      <FilterCheckbox
                        size={CHECKBOX * scale}
                        checked={checked}
                      />
                      <Label numberOfLines={1} style={styles.optionLabel}>
                        {option.label}
                      </Label>
                    </Pressable>
                  );
                })}
              </ScrollView>
            </View>
          </View>

          <View style={styles.footer}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Apply filters"
              onPress={() => onApply(draft)}
              style={({ pressed }) => [styles.apply, pressed && styles.dimmed]}
            >
              <BrandGradient
                radius={radius.button * scale}
                angle="horizontal"
              />
              <Label style={styles.applyLabel}>Apply</Label>
            </Pressable>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

function createStyles(scale: number) {
  /** A Figma measurement, in device points. */
  const px = (value: number) => value * scale;

  return StyleSheet.create({
    root: {
      flex: 1,
      justifyContent: 'flex-end',
    },
    dimmed: {
      opacity: 0.85,
    },
    scrim: {
      position: 'absolute',
      top: 0,
      right: 0,
      bottom: 0,
      left: 0,
      backgroundColor: consultFilterPalette.scrim,
    },

    sheet: {
      backgroundColor: colors.surface,
      borderTopLeftRadius: px(20),
      borderTopRightRadius: px(20),
      overflow: 'hidden',
    },

    header: {
      height: px(HEADER_HEIGHT),
      backgroundColor: consultFilterPalette.header,
      flexDirection: 'row',
      alignItems: 'center',
      paddingLeft: px(19.98),
      paddingRight: px(15.51),
      borderBottomWidth: 1,
      borderBottomColor: consultFilterPalette.rule,
    },
    headerTitle: {
      fontFamily: fontFamily.semiBold,
      fontSize: px(16),
      lineHeight: px(24),
      color: colors.text.inverse,
      flex: 1,
    },
    close: {
      alignItems: 'center',
      justifyContent: 'center',
    },

    body: {
      height: px(BODY_HEIGHT),
      flexDirection: 'row',
    },
    /** 402 - 242.77, the rail Figma tints behind the section list. */
    rail: {
      width: px(RAIL_WIDTH),
      backgroundColor: consultFilterPalette.rail,
    },
    rule: {
      position: 'absolute',
      top: 0,
      bottom: 0,
      left: px(RAIL_WIDTH),
      width: 1,
      backgroundColor: consultFilterPalette.rule,
    },
    sectionRow: {
      height: px(SECTION_ROW_HEIGHT),
      flexDirection: 'row',
      alignItems: 'center',
      paddingLeft: px(19.98),
      paddingRight: px(13.93),
    },
    /** The selected row is white and, being 1pt wider, covers the rule. */
    sectionRowOn: {
      backgroundColor: colors.surface,
      width: px(RAIL_WIDTH) + 1,
    },
    sectionTab: {
      position: 'absolute',
      left: 0,
      top: 0,
      bottom: 0,
      width: px(SECTION_TAB_WIDTH),
      backgroundColor: consultFilterPalette.header,
      borderTopRightRadius: px(10),
      borderBottomRightRadius: px(10),
    },
    sectionLabel: {
      fontFamily: fontFamily.regular,
      fontSize: px(12),
      lineHeight: px(18),
      color: colors.border.strong,
      flex: 1,
    },
    sectionLabelOn: {
      fontFamily: fontFamily.medium,
      fontSize: px(12),
      lineHeight: px(18),
      color: colors.border.strong,
      flex: 1,
    },
    /** Marks a section that is holding a selection (node I180:90953;297:3115). */
    sectionDot: {
      width: px(8),
      height: px(8),
      borderRadius: px(4),
      backgroundColor: colors.border.strong,
    },

    panel: {
      flex: 1,
    },
    panelHeader: {
      height: px(OPTIONS_TOP),
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'flex-end',
      paddingRight: px(15.51),
    },
    panelAction: {
      fontFamily: fontFamily.regular,
      fontSize: px(12),
      lineHeight: px(18),
      color: colors.border.strong,
    },
    panelActionOff: {
      color: colors.text.muted,
    },
    options: {
      paddingBottom: px(16),
      gap: px(OPTION_GAP),
    },
    /** The checkbox gutter is measured from the rail's edge, not the sheet's. */
    option: {
      height: px(OPTION_HEIGHT),
      flexDirection: 'row',
      alignItems: 'center',
      paddingLeft: px(20.38),
      gap: px(10.35),
    },
    optionLabel: {
      fontFamily: fontFamily.regular,
      fontSize: px(12),
      lineHeight: px(18),
      color: colors.border.strong,
      flex: 1,
    },

    footer: {
      height: px(SHEET_HEIGHT - BODY_TOP - BODY_HEIGHT),
      paddingTop: px(30.26),
      paddingLeft: px(17.49),
      paddingRight: px(16.52),
    },
    apply: {
      height: px(46.03),
      borderRadius: px(radius.button),
      alignItems: 'center',
      justifyContent: 'center',
      overflow: 'hidden',
    },
    applyLabel: {
      fontFamily: fontFamily.medium,
      fontSize: px(14),
      lineHeight: px(18.5),
      color: colors.text.inverse,
    },
  });
}
