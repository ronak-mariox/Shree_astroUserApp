import React, { useMemo } from 'react';
import { Modal, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BrandGradient } from './BrandGradient';
import { useResponsive } from '../hooks/useResponsive';
import { colors, radius, spacing, typography } from '../theme';

const ACTION_HEIGHT = 45.342;

/** What the message is about, which decides the glyph and the well behind it. */
export type DialogTone = 'info' | 'warning' | 'error' | 'success' | 'wallet';

const TONE = {
  info: { glyph: 'ℹ️', tint: colors.surfaceMuted },
  warning: { glyph: '⚠️', tint: colors.brandYellowTint },
  error: { glyph: '⚠️', tint: colors.status.negativeTint },
  success: { glyph: '✅', tint: colors.status.positiveTint },
  wallet: { glyph: '💰', tint: colors.brandYellowTint },
} as const;

export type DialogAction = {
  label: string;
  onPress?: () => void;
  /**
   * 'primary' fills with the brand gradient, 'secondary' is the outlined way
   * out. Exactly one primary reads best; nothing enforces it.
   */
  variant?: 'primary' | 'secondary';
};

export type DialogRequest = {
  title: string;
  message?: string;
  tone?: DialogTone;
  /**
   * Left out, the dialog offers a single "OK" — which is what most of these
   * messages want, and what the native alert they replaced did.
   */
  actions?: ReadonlyArray<DialogAction>;
  /** False for a message that must be answered rather than dismissed by tapping away. */
  dismissable?: boolean;
};

type AppDialogProps = {
  /** The message to show, or nothing at all. */
  request?: DialogRequest;
  onDismiss: () => void;
};

/**
 * The app's own dialog, in place of `Alert.alert`.
 *
 * Every one of these used to be a native OS alert: a grey system box with the
 * platform's own type and buttons, in the middle of an app that otherwise draws
 * yellow sheets with gradient actions. They carried the right words and looked
 * like they belonged to a different product — worst of all on the ones that
 * matter most, where somebody is being told their wallet is short mid-booking.
 *
 * So this is the same frame as the app's other dialogs
 * (AstrologerBusyDialog, EndChatDialog): a sheet from the bottom on a phone, a
 * capped centred card on a tablet, the title left-aligned, and the actions in a
 * row with the primary one carrying the brand gradient. A tone glyph sits above
 * the title so a wallet warning is recognisable before a word of it is read.
 */
export function AppDialog({ request, onDismiss }: AppDialogProps) {
  const insets = useSafeAreaInsets();
  const { px, isTablet } = useResponsive();
  const styles = useMemo(() => createStyles(px, isTablet), [px, isTablet]);

  const tone = TONE[request?.tone ?? 'info'];
  const actions = request?.actions?.length ? request.actions : [{ label: 'OK', variant: 'primary' as const }];
  const dismissable = request?.dismissable !== false;

  /** An action closes the dialog first, so its own handler can open the next screen. */
  const run = (action: DialogAction) => {
    onDismiss();
    action.onPress?.();
  };

  return (
    <Modal
      visible={Boolean(request)}
      transparent
      animationType="slide"
      onRequestClose={dismissable ? onDismiss : () => {}}
      statusBarTranslucent
    >
      <View style={styles.stage}>
        <Pressable
          accessibilityLabel={`Close ${request?.title ?? 'dialog'}`}
          accessibilityElementsHidden={!dismissable}
          style={styles.scrim}
          onPress={dismissable ? onDismiss : undefined}
        />

        <View style={[styles.sheet, { paddingBottom: spacing.lg + insets.bottom }]}>
          <View style={[styles.glyphWell, { backgroundColor: tone.tint }]}>
            <Text style={styles.glyph}>{tone.glyph}</Text>
          </View>

          <Text accessibilityRole="header" style={styles.title}>
            {request?.title}
          </Text>
          {request?.message ? <Text style={styles.body}>{request.message}</Text> : null}

          <View style={[styles.actions, actions.length === 1 && styles.actionsSingle]}>
            {actions.map(action => {
              const primary = action.variant !== 'secondary';

              return (
                <Pressable
                  key={action.label}
                  accessibilityRole="button"
                  accessibilityLabel={action.label}
                  onPress={() => run(action)}
                  style={({ pressed }) => [
                    styles.action,
                    !primary && styles.secondary,
                    pressed && styles.pressed,
                  ]}
                >
                  {primary && <BrandGradient radius={radius.action} />}
                  <Text style={primary ? styles.primaryLabel : styles.secondaryLabel}>{action.label}</Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      </View>
    </Modal>
  );
}

function createStyles(px: (value: number) => number, isTablet: boolean) {
  return StyleSheet.create({
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
      maxWidth: isTablet ? 480 : undefined,
      marginBottom: isTablet ? spacing.xxl : 0,
      borderTopLeftRadius: radius.sheet,
      borderTopRightRadius: radius.sheet,
      borderBottomLeftRadius: isTablet ? radius.sheet : 0,
      borderBottomRightRadius: isTablet ? radius.sheet : 0,
      backgroundColor: colors.surface,
      paddingTop: spacing.xl,
      paddingHorizontal: spacing.xl,
    },
    glyphWell: {
      width: px(44),
      height: px(44),
      borderRadius: px(22),
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: spacing.md,
    },
    glyph: {
      fontSize: px(20),
    },
    title: {
      ...typography.dialogTitle,
      color: colors.text.onYellow,
    },
    body: {
      ...typography.dialogBody,
      color: colors.text.secondary,
      paddingTop: spacing.sm,
    },
    actions: {
      flexDirection: 'row',
      gap: spacing.md,
      paddingTop: spacing.xl,
    },
    /** One action stretches, rather than sitting half-width beside nothing. */
    actionsSingle: {
      paddingTop: spacing.lg,
    },
    action: {
      flex: 1,
      height: px(ACTION_HEIGHT),
      borderRadius: radius.action,
      alignItems: 'center',
      justifyContent: 'center',
      overflow: 'hidden',
    },
    secondary: {
      borderWidth: 1,
      borderColor: colors.text.onYellow,
      backgroundColor: colors.surface,
      ...Platform.select({
        ios: {
          shadowColor: colors.shadow,
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.1,
          shadowRadius: 4,
        },
        android: { elevation: 3 },
        default: {},
      }),
    },
    primaryLabel: {
      ...typography.dialogAction,
      color: colors.text.inverse,
    },
    secondaryLabel: {
      ...typography.dialogAction,
      color: colors.text.onYellow,
    },
    pressed: {
      opacity: 0.8,
    },
  });
}
