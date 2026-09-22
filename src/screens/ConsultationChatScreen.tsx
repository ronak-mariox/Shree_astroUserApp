import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  View,
  type ImageSourcePropType,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BrandGradient } from '../components/BrandGradient';
import { EndChatDialog } from '../components/AstrologerBusyDialog';
import { ChatEndedDialog } from '../components/ChatEndedDialog';
import { PackageTimerBanner } from '../components/PackageTimerBanner';
import {
  ConsultationBubble,
  type ConsultationMessage,
} from '../components/ConsultationBubble';
import { WalletPillIcon } from '../components/icons/ChatRoomIcons';
import { CloseMarkIcon } from '../components/icons/CloseMarkIcon';
import { SendIcon } from '../components/icons/SendIcon';
import { LowBalanceBanner } from '../components/LowBalanceBanner';
import { RechargePopup } from '../components/RechargePopup';
import { type RechargeOption } from '../data/wallet';
import {
  clockOffsetMs,
  elapsedSeconds,
  formatCountdown,
  secondsUntil,
  type PackageView,
} from '../data/consultPackages';
import { useApi } from '../hooks/useApi';
import {
  confirmTopUp,
  endChat,
  fetchWallet,
  getChatState,
  rupees,
  sendMessage,
  startTopUp,
  subscribeToConsultation,
  type ChatMessage,
} from '../services/api';
import { ApiError } from '../services/client';
import {
  colors,
  designFrame,
  hairline,
  radius,
  spacing,
  typography,
} from '../theme';

/** Top padding Figma drew, measured from the top of the status bar. */
const DESIGN_PADDING_TOP = 53;
const AVATAR_SIZE = 36;
const WALLET_ICON = 20;
const END_SIZE = 37.663;
const END_ICON = 16;
const COMPOSER_HEIGHT = 56;
const SEND_SIZE = 46;
const SEND_ICON = 20;

type ConsultationChatScreenProps = {
  /** The session POST /chats created — every read and write below is scoped to it. */
  chatId: string;
  /** Who the seeker is talking to. */
  astrologerName: string;
  photo?: ImageSourcePropType;
  /** The red cross, confirmed — ends the session for good. */
  onEnd?: () => void;
  /** "Yes, Start Chat" on the post-end sheet — opens a fresh request to the same astrologer. */
  onStartNewChat?: () => void;
};

/** "04:58 mins" — how the header prints the running session. */
const elapsedLabel = (seconds: number) =>
  `(${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(
    seconds % 60,
  ).padStart(2, '0')} mins)`;

const timeOf = (iso?: string) =>
  (iso ? new Date(iso) : new Date())
    .toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    })
    .toUpperCase();

/** What arrives over the socket (or the REST fallback) -> what the transcript prints. */
const toBubble = (message: ChatMessage): ConsultationMessage => ({
  id: message.id,
  from:
    message.senderRole === 'user'
      ? 'seeker'
      : message.senderRole === 'astrologer'
        ? 'astrologer'
        : 'system',
  lines: (message.content?.text ?? '').split('\n'),
  time: timeOf(message.createdAt),
});

/**
 * The live consultation, opened once the astrologer accepts: their name and the
 * running timer over the balance the session is spending, the transcript, and
 * the composer.
 *
 * Everything here is a read of, or a write to, the real session — the minute
 * meter, the transcript, and the balance all come from the server (see
 * services/chat.service.js and services/socket.ts); nothing on this screen
 * decides for itself when a minute has passed or what anything costs.
 *
 * Figma: node 180:118720.
 */
export function ConsultationChatScreen({
  chatId,
  astrologerName,
  photo,
  onEnd,
  onStartNewChat,
}: ConsultationChatScreenProps) {
  const insets = useSafeAreaInsets();
  const transcript = useRef<React.ComponentRef<typeof ScrollView>>(null);

  const state = useApi(() => getChatState(chatId), [chatId]);
  const wallet = useApi(() => fetchWallet(), [chatId]);

  /**
   * Every tick/low-balance push already carries the seeker's post-debit
   * balance — pushing it straight into wallet state shows it instantly,
   * with no extra round trip. Falls back to a reload only if the server
   * ever omits the figure (an older server, or a free-minute edge case).
   */
  const applyLiveBalance = (balanceRemaining: number | undefined) => {
    if (balanceRemaining === undefined) {
      wallet.reload();
      return;
    }
    wallet.setData((current: typeof wallet.data) => (current ? { ...current, balance: balanceRemaining } : current));
  };

  /**
   * The transcript, oldest first — including the seeker's own intake, which
   * `requestChat` now posts as the opening message (services/chat.service.js),
   * so it arrives here the same way as everything else: the join backfill
   * below, not a bubble synthesised locally from the form just submitted.
   */
  const [messages, setMessages] = useState<ConsultationMessage[]>([]);
  const [draft, setDraft] = useState('');
  const [elapsed, setElapsed] = useState(0);
  const [endChatVisible, setEndChatVisible] = useState(false);
  const [chatEndedVisible, setChatEndedVisible] = useState(false);
  /** Shown once the live tick warns the balance won't cover much more — cleared the moment a normal tick bills fine again. */
  const [lowBalanceVisible, setLowBalanceVisible] = useState(false);
  /**
   * True only once billing has actually paused (the wallet couldn't cover a
   * real minute at its cutoff) — distinct from `lowBalanceVisible`, which
   * also covers the earlier, non-blocking check-ahead/proactive warnings
   * where the session is still running fine. Freezes the elapsed clock below
   * for exactly as long as this stays true; a top-up resumes both.
   */
  const [sessionPaused, setSessionPaused] = useState(false);
  const [rechargeVisible, setRechargeVisible] = useState(false);
  /** True while a chosen recharge tile is still being paid for — disables the popup's own button so a second tap can't double-charge. */
  const [payingRecharge, setPayingRecharge] = useState(false);
  /** Set the moment the session is actually over, however that happens (this side, the other side, or the server's own grace-period cutoff) — the composer stops taking input right away, whether or not the dialog above it has been dismissed yet. */
  const [closed, setClosed] = useState(false);

  /**
   * Package sessions only (undefined for per-minute, so none of the package
   * UI below ever renders there): where the package clock stands, from the
   * state read, every socket (re)join, and the package events. Countdowns are
   * measured on the server's clock — `clockOffset` is how far it is ahead of
   * this device — so a phone with a wrong clock still shows the right time.
   */
  const [pkg, setPkg] = useState<PackageView>();
  const clockOffset = useRef(0);
  /** Only there to re-render the package countdowns once a second. */
  const [, setClockTick] = useState(0);

  /** Backfilled history and live pushes can overlap by one message at a reconnect; this is what keeps that from showing twice. */
  const seenMessageIds = useRef(new Set<string>());

  /**
   * A message this screen posted itself arrives back over the same live
   * subscription that carries the other side's — the server broadcasts a
   * send to the whole room, sender included. Rather than show it twice (once
   * optimistically, once on echo), `send` below posts an optimistic bubble
   * keyed by `clientMessageId`; when the real one comes back carrying that
   * same id, it replaces the optimistic bubble in place instead of adding a
   * second one.
   */
  const appendMessage = useCallback((message: ChatMessage) => {
    if (seenMessageIds.current.has(message.id)) {
      return;
    }
    seenMessageIds.current.add(message.id);

    setMessages(current => {
      const pendingIndex = message.clientMessageId
        ? current.findIndex(entry => entry.id === message.clientMessageId)
        : -1;
      const bubble = toBubble(message);
      if (pendingIndex === -1) {
        return [...current, bubble];
      }
      const next = [...current];
      next[pendingIndex] = bubble;
      return next;
    });
  }, []);

  /**
   * How long the clock below has spent frozen so far (`pausedAccumMs`), and
   * when the current freeze began (`pausedSince`, null while running) — kept
   * in refs rather than state since nothing needs to re-render off them
   * directly, only off the `elapsed` seconds they feed into.
   */
  const pausedAccumMs = useRef(0);
  const pausedSince = useRef<number | null>(null);
  /**
   * Set just before `setSessionPaused(true)` when the pause actually began
   * earlier than "now" — a (re)join that discovers an already-paused session
   * (see `onRejoinState` below) backdates to the server's own
   * `balanceExhaustedAt` instead of freezing from whenever this screen
   * happened to notice, so the frozen value is exactly right, not inflated
   * by however long the client was out of the loop.
   */
  const pausedSinceOverride = useRef<number | null>(null);

  useEffect(() => {
    if (sessionPaused) {
      pausedSince.current = pausedSinceOverride.current ?? Date.now();
      pausedSinceOverride.current = null;
    } else if (pausedSince.current !== null) {
      pausedAccumMs.current += Date.now() - pausedSince.current;
      pausedSince.current = null;
    }
  }, [sessionPaused]);

  // Declared before the running clock below, so its very first tick already counts on the server's clock.
  // The server-clock offset (every session) and a package session's view, from the REST state read.
  useEffect(() => {
    if (state.data?.serverTime) {
      clockOffset.current = clockOffsetMs(state.data.serverTime);
    }
    if (state.data?.billingMode === 'package' && state.data.package) {
      setPkg(state.data.package);
    }
  }, [state.data]);

  // The header's running clock: real elapsed time since the server's own
  // startedAt, measured on the SERVER's clock (so it reads exactly what the
  // astrologer's header reads, whatever this phone's clock says), minus
  // however long it's spent paused for a low balance — ticked locally so it
  // doesn't need a round trip every second.
  useEffect(() => {
    const startedAt = state.data?.startedAt;
    if (!startedAt) {
      return;
    }
    const tick = () => {
      if (pausedSince.current !== null) {
        /** Frozen — hold the last value rather than keep advancing it. */
        return;
      }
      setElapsed(elapsedSeconds(startedAt, clockOffset.current, pausedAccumMs.current));
    };
    tick();
    const timer = setInterval(tick, 1000);
    return () => clearInterval(timer);
  }, [state.data?.startedAt]);

  const packageClockRunning = pkg?.phase === 'package';
  useEffect(() => {
    if (!packageClockRunning) {
      return;
    }
    const timer = setInterval(() => setClockTick(count => count + 1), 1000);
    return () => clearInterval(timer);
  }, [packageClockRunning]);

  // The live half of the session: the transcript, the minute meter, low-balance
  // warnings, and however the session ends.
  useEffect(() => {
    const unsubscribe = subscribeToConsultation(chatId, 0, {
      onMessage: appendMessage,
      /**
       * Fires on every (re)join, including the very first one — a socket
       * that's already connected before this screen mounts still runs this
       * immediately. Resyncs to the session's true current pause state,
       * since a live low-balance push can be missed entirely by a socket
       * that was briefly disconnected (backgrounding the app, a dropped
       * connection) and never redelivered once it reconnects.
       */
      onRejoinState: payload => {
        if (payload.serverTime) {
          clockOffset.current = clockOffsetMs(payload.serverTime);
        }
        /** Package sessions: resync the package clock too — a package event can be missed exactly like a low-balance one. */
        if (payload.package) {
          setPkg(payload.package);
        }
        if (payload.paused) {
          pausedSinceOverride.current = payload.pausedSince ? new Date(payload.pausedSince).getTime() : Date.now();
          setSessionPaused(true);
          setLowBalanceVisible(true);
        } else {
          setSessionPaused(false);
          // Left alone otherwise — a non-blocking warning banner may legitimately still be up, and this has no authority over that.
        }
      },
      onTick: payload => {
        applyLiveBalance(payload.balanceRemaining);
        setLowBalanceVisible(false);
        setSessionPaused(false);
      },
      /**
       * The proactive "running low" and check-ahead warnings (`paused`
       * undefined/false with `exhausted: false`) show the same banner as the
       * real pause and keep the chat running exactly as before — only an
       * actual `paused: true` freezes the clock and blocks the composer.
       * `paused: false` is also how a resumed session (a top-up cleared it —
       * chat.service.js's resumePausedSessionsForUser) announces itself
       * instantly, without waiting on the next tick to arrive.
       */
      onLowBalance: payload => {
        applyLiveBalance(payload.balanceRemaining);
        if (payload.paused === false) {
          setLowBalanceVisible(false);
          setSessionPaused(false);
          return;
        }
        setLowBalanceVisible(true);
        if (payload.paused) {
          setSessionPaused(true);
        }
      },
      onPackageWarning: payload => {
        clockOffset.current = clockOffsetMs(payload.serverTime);
        setPkg(current => (current ? { ...current, endsAt: payload.endsAt } : current));
      },
      /** The package ran out: from here it's an ordinary per-minute chat (ticks, low balance, recharge — all the existing handlers above). */
      onPerMinuteStarted: payload => {
        setPkg(current => ({
          ...(current ?? {}),
          phase: 'per_minute',
          perMinuteStartedAt: payload.perMinuteStartedAt,
        }));
      },
      onEnded: () => {
        setClosed(true);
        setEndChatVisible(false);
        setChatEndedVisible(true);
        wallet.reload();
      },
      /**
       * The astrologer's own connection dropping — not the session ending;
       * `onEnded` still fires separately (reason `astrologer_disconnected`)
       * if they never come back in time. A plain system line in the
       * transcript, same voice as the server's own "Consultation started." —
       * this one is purely local, nothing to persist or replay on rejoin.
       */
      onAstrologerLeft: payload => {
        setMessages(current => [
          ...current,
          {
            id: `system-astrologer-left-${Date.now()}`,
            from: 'system',
            lines: [`${astrologerName} disconnected. Waiting up to ${payload.reconnectSeconds}s for them to reconnect…`],
            time: timeOf(),
          },
        ]);
      },
      onAstrologerJoined: () => {
        setMessages(current => [
          ...current,
          {
            id: `system-astrologer-joined-${Date.now()}`,
            from: 'system',
            lines: [`${astrologerName} is back.`],
            time: timeOf(),
          },
        ]);
      },
    });

    return unsubscribe;
    // wallet.reload is a fresh closure every render; only chatId should restart the subscription.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chatId, appendMessage]);

  /* Package session: what the clock says right now (all false/0 for a per-minute session). */
  const packageSecondsLeft = pkg?.phase === 'package' ? secondsUntil(pkg.endsAt, clockOffset.current) : 0;
  /**
   * "Package ending, then ₹X/min" — only while the wallet is fine. When it
   * isn't, the server sends the ordinary low-balance event instead and the
   * existing LowBalanceBanner / RechargePopup take over, as in any chat.
   */
  const packageBannerVisible =
    !closed && !lowBalanceVisible && pkg?.phase === 'package' && Boolean(pkg.endsAt)
    && packageSecondsLeft <= (pkg.warningSeconds ?? 30);
  /**
   * Per-minute: the existing rule — the low-balance banner locks the composer.
   * Package time is already paid for, so a low-balance warning during it
   * (about the per-minute time that follows) only locks the composer once
   * the session actually pauses.
   */
  const composerLocked = closed || sessionPaused || (lowBalanceVisible && pkg?.phase !== 'package');

  const send = async () => {
    const body = draft.trim();
    if (body.length === 0 || composerLocked) {
      return;
    }
    setDraft('');

    /** Shown right away; appendMessage above replaces it once the server echoes the real message back. */
    const clientMessageId = `local-${Date.now()}`;
    setMessages(current => [
      ...current,
      { id: clientMessageId, from: 'seeker', lines: body.split('\n'), time: timeOf() },
    ]);

    try {
      await sendMessage(chatId, body, clientMessageId);
    } catch (error) {
      Alert.alert(
        'Message not sent',
        error instanceof ApiError ? error.message : 'Something went wrong. Please try again.',
      );
    }
  };

  const confirmEndChat = async () => {
    setEndChatVisible(false);
    try {
      await endChat(chatId, 'user_ended');
      setClosed(true);
      setChatEndedVisible(true);
    } catch (error) {
      Alert.alert(
        'Could not end chat',
        error instanceof ApiError ? error.message : 'Something went wrong. Please try again.',
      );
    }
  };

  /**
   * No payment gateway is wired up yet (see services/api.ts's startTopUp),
   * so this credits `amount + bonus` straight away — the same "confirm
   * immediately" shortcut every top-up in the app takes today. Crediting
   * only `amount` would break the popup's own "you'll get ₹X" promise the
   * moment a real gateway (and a real bonus ledger) exist, this is the one
   * spot that needs to change to actually separate what was paid from what
   * was credited.
   */
  const handleRecharge = async (option: RechargeOption) => {
    setPayingRecharge(true);
    try {
      const pending = await startTopUp(option.amount + option.bonus);
      await confirmTopUp(pending.transactionId);
      await wallet.reload();
      setRechargeVisible(false);
      setLowBalanceVisible(false);
    } catch (error) {
      Alert.alert(
        'Could not add money',
        error instanceof ApiError ? error.message : 'Something went wrong. Please try again.',
      );
    } finally {
      setPayingRecharge(false);
    }
  };

  const walletBalance = rupees(wallet.data?.balance ?? 0);

  return (
    <View style={styles.screen}>
      <StatusBar barStyle="dark-content" />

      <View
        style={[
          styles.header,
          {
            paddingTop:
              insets.top + (DESIGN_PADDING_TOP - designFrame.statusBarHeight),
          },
        ]}
      >
        <View style={styles.avatarRing}>
          {photo !== undefined ? (
            <Image source={photo} style={styles.avatar} resizeMode="cover" />
          ) : (
            <View style={[styles.avatar, styles.avatarFallback]}>
              <Text style={styles.avatarInitial}>
                {astrologerName.slice(0, 1)}
              </Text>
            </View>
          )}
        </View>

        <View style={styles.identity}>
          <Text style={styles.peer} numberOfLines={1}>
            {astrologerName}
          </Text>
          <Text style={styles.elapsed}>
            {pkg?.phase === 'package'
              ? `(${formatCountdown(packageSecondsLeft)} left)`
              : elapsedLabel(elapsed)}
          </Text>
        </View>

        {/* Read-only here — the running balance during a live chat, not a link to the wallet screen. */}
        <View accessibilityLabel={`Wallet balance ${walletBalance}`} style={styles.wallet}>
          <View style={styles.walletIcon}>
            <WalletPillIcon size={WALLET_ICON} />
          </View>
          <Text style={styles.walletLabel}>{walletBalance}</Text>
        </View>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="End the consultation"
          accessibilityState={{ disabled: closed }}
          disabled={closed}
          onPress={() => setEndChatVisible(true)}
          style={({ pressed }) => [styles.end, pressed && styles.pressed]}
        >
          <CloseMarkIcon size={END_ICON} color={colors.text.inverse} />
        </Pressable>
      </View>

      {packageBannerVisible && (
        <PackageTimerBanner secondsLeft={packageSecondsLeft} ratePerMinute={state.data?.ratePerMinute ?? 0} />
      )}

      {lowBalanceVisible && (
        <LowBalanceBanner
          balance={wallet.data?.balance ?? 0}
          onRecharge={() => setRechargeVisible(true)}
        />
      )}

      <EndChatDialog
        visible={endChatVisible}
        onDismiss={() => setEndChatVisible(false)}
        onStay={() => setEndChatVisible(false)}
        onEndChat={confirmEndChat}
      />

      <ChatEndedDialog
        visible={chatEndedVisible}
        onDismiss={() => setChatEndedVisible(false)}
        onResume={() => {
          setChatEndedVisible(false);
          onStartNewChat?.();
        }}
        onEnd={() => {
          setChatEndedVisible(false);
          onEnd?.();
        }}
      />

      <RechargePopup
        visible={rechargeVisible}
        minRequired={state.data?.ratePerMinute}
        onDismiss={() => setRechargeVisible(false)}
        onPay={handleRecharge}
        loading={payingRecharge}
      />

      <KeyboardAvoidingView
        style={styles.body}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          ref={transcript}
          contentContainerStyle={styles.transcript}
          onContentSizeChange={() =>
            transcript.current?.scrollToEnd({ animated: true })
          }
        >
          {messages.map(message => (
            <ConsultationBubble key={message.id} message={message} />
          ))}
        </ScrollView>

        <View
          style={[styles.composerRow, { paddingBottom: spacing.md + insets.bottom }]}
        >
          <View style={styles.composer}>
            <TextInput
              accessibilityLabel="Type message"
              value={draft}
              onChangeText={setDraft}
              placeholder="Type message..."
              placeholderTextColor={colors.text.composerHint}
              style={styles.input}
              editable={!composerLocked}
              multiline
            />
          </View>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Send"
            accessibilityState={{ disabled: draft.trim().length === 0 || composerLocked }}
            disabled={draft.trim().length === 0 || composerLocked}
            onPress={send}
            style={({ pressed }) => [styles.send, pressed && styles.pressed]}
          >
            <BrandGradient radius={radius.button} />
            <SendIcon size={SEND_ICON} color={colors.text.inverse} />
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.brandYellow,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.brandYellow,
    paddingHorizontal: spacing.section,
    paddingBottom: spacing.section,
  },
  avatarRing: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
    overflow: 'hidden',
  },
  avatar: {
    width: '100%',
    height: '100%',
  },
  avatarFallback: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
  },
  avatarInitial: {
    ...typography.chatPeer,
    color: colors.text.onYellow,
  },
  identity: {
    flex: 1,
  },
  peer: {
    ...typography.chatPeer,
    color: colors.text.onYellow,
  },
  elapsed: {
    ...typography.chatElapsed,
    color: colors.text.onYellow,
  },
  wallet: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    height: 35.66,
    paddingLeft: 3,
    paddingRight: spacing.md,
    borderRadius: radius.chip,
    backgroundColor: colors.surface,
  },
  walletIcon: {
    width: 29,
    height: 29,
    borderRadius: radius.chip,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.status.walletPill,
  },
  walletLabel: {
    ...typography.chatWallet,
    color: colors.text.onYellow,
  },
  end: {
    width: END_SIZE,
    height: END_SIZE,
    borderRadius: radius.chip,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.status.cancelMark,
  },
  body: {
    flex: 1,
    borderTopLeftRadius: radius.sheet,
    borderTopRightRadius: radius.sheet,
    backgroundColor: colors.surfaceChat,
    overflow: 'hidden',
  },
  transcript: {
    gap: spacing.md,
    paddingHorizontal: spacing.section,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
  },
  composerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.section,
    paddingTop: spacing.sm,
  },
  composer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    minHeight: COMPOSER_HEIGHT,
    paddingHorizontal: spacing.md,
    borderRadius: COMPOSER_HEIGHT / 2,
    borderWidth: hairline,
    borderColor: colors.borderComposer,
    backgroundColor: colors.surface,
    // 0 0 4px rgba(112, 111, 111, 0.25)
    ...Platform.select({
      ios: {
        shadowColor: colors.shadow,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
      },
      android: { elevation: 2 },
      default: {},
    }),
  },
  input: {
    ...typography.chatComposer,
    flex: 1,
    maxHeight: 96,
    paddingVertical: 0,
    color: colors.text.onYellow,
  },
  send: {
    width: SEND_SIZE,
    height: SEND_SIZE,
    borderRadius: radius.button,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  pressed: {
    opacity: 0.8,
  },
});
