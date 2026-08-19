import React, { useEffect, useMemo } from 'react';
import {
  Image,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';

import { consultFilterPalette } from '../data/consultFilters';
import { colors, fontFamily } from '../theme';

/**
 * Figma drew the confirmation on the same 402pt frame as the sheet it replaces
 * (node 180:91352) — a 363.6 x 213.2 card centred in the screen — so it is
 * scaled by the device's width over 402 like everything else on this flow.
 */
const DESIGN_WIDTH = 402;
const CARD_WIDTH = 363.619;
const CARD_HEIGHT = 213.201;
/** The burst is exported at 2x, and Figma lays it out on its 113pt bounds. */
const BURST = 113.051;
/** How long the card stays up before it bows out on its own. */
const DWELL = 1400;

const burst = require('../assets/images/filter-applied.png');

type ConsultFilterAppliedDialogProps = {
  visible: boolean;
  onDismiss: () => void;
};

/** "Successfully Applied!" — the receipt for the Apply button. */
export function ConsultFilterAppliedDialog({
  visible,
  onDismiss,
}: ConsultFilterAppliedDialogProps) {
  const { width } = useWindowDimensions();
  const scale = width / DESIGN_WIDTH;
  const styles = useMemo(() => createStyles(scale), [scale]);

  useEffect(() => {
    if (!visible) {
      return;
    }
    const timer = setTimeout(onDismiss, DWELL);
    return () => clearTimeout(timer);
  }, [visible, onDismiss]);

  if (!visible) {
    return null;
  }

  return (
    <Modal
      visible
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onDismiss}
    >
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Dismiss"
        onPress={onDismiss}
        style={styles.scrim}
      >
        <View
          accessibilityRole="alert"
          accessibilityLabel="Successfully applied"
          style={styles.card}
        >
          <Image
            source={burst}
            style={styles.burst}
            resizeMode="contain"
            accessibilityIgnoresInvertColors
          />
          <Text allowFontScaling={false} style={styles.label}>
            Successfully Applied!
          </Text>
        </View>
      </Pressable>
    </Modal>
  );
}

function createStyles(scale: number) {
  /** A Figma measurement, in device points. */
  const px = (value: number) => value * scale;

  return StyleSheet.create({
    scrim: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: consultFilterPalette.scrim,
    },
    card: {
      width: px(CARD_WIDTH),
      height: px(CARD_HEIGHT),
      borderRadius: px(20),
      backgroundColor: colors.surface,
      alignItems: 'center',
      paddingTop: px(22.526),
    },
    burst: {
      width: px(BURST),
      height: px(BURST),
    },
    label: {
      fontFamily: fontFamily.medium,
      fontSize: px(24),
      lineHeight: px(30),
      color: colors.border.strong,
      textAlign: 'center',
      marginTop: px(11.6),
    },
  });
}
