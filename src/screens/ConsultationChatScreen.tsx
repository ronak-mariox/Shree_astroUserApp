import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  BackHandler,
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
import { useKeyboardOpen } from '../hooks/useKeyboardOpen';

import { BrandGradient } from '../components/BrandGradient';
import { AppDialog } from '../components/AppDialog';
import { EndChatDialog } from '../components/AstrologerBusyDialog';
import { ChatEndedDialog } from '../components/ChatEndedDialog';
import { ContinueConsultationSheet } from '../components/ContinueConsultationSheet';
import { PackageTimerBanner } from '../components/PackageTimerBanner';
import {
  ConsultationBubble,
  type ConsultationMessage,
} from '../components/ConsultationBubble';
import { HangUpIcon, MicOffIcon, MicOnIcon, SpeakerIcon } from '../components/icons/CallIcons';
import { WalletPillIcon } from '../components/icons/ChatRoomIcons';
import { CloseMarkIcon } from '../components/icons/CloseMarkIcon';
import { SendIcon } from '../components/icons/SendIcon';
import { LowBalanceBanner } from '../components/LowBalanceBanner';
import { RechargePopup } from '../components/RechargePopup';
import { type RechargeOption } from '../data/wallet';
import {
  canAfford,
  clockOffsetMs,
  elapsedSeconds,
  resolveQuotes,
  type ConsultationChoice,
  type ContinueOptions,
  formatCountdown,
  secondsUntil,
  type PackageView,
} from '../data/consultPackages';
import { useApi } from '../hooks/useApi';
import { useDialog } from '../hooks/useDialog';
import {
  continueConsultation,
  endChat,
  fetchCallToken,
  fetchWallet,
  getChatState,
  rupees,
  sendMessage,
  subscribeToConsultation,
  type ChatMessage,
} from '../services/api';
import { ApiError } from '../services/client';
import { PaymentUnconfirmedError, describePaymentError, payTopUp } from '../services/payments';
import {
  joinVoiceCall,
  leaveVoiceCall,
  renewVoiceToken,
  setMuted as setCallMuted,
  setSpeaker as setCallSpeaker,
  type VoiceCallEvent,
} from '../services/voiceCall';
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
/** The voice-call layout: the large portrait and the round controls under it. */
const CALL_AVATAR_SIZE = 116;
const CALL_CONTROL_SIZE = 68;
const CALL_CONTROL_ICON = 26;
const HANG_UP_ICON = 30;

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

/**
 * Where a call's audio stands — separate from the session's billing state,
 * which the pause and ended flags below carry exactly as they do for a chat.
 */
type CallPhase = 'idle' | 'connecting' | 'ringing' | 'connected' | 'reconnecting';

/** "04:58". */
const clockLabel = (seconds: number) =>
  `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(
    seconds % 60,
  ).padStart(2, '0')}`;

/** "(04:58 mins)" — how the header prints the running session. */
const elapsedLabel = (seconds: number) => `(${clockLabel(seconds)} mins)`;

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
  /** The keyboard covers the navigation bar, so its safe-area padding comes off the composer while it is open. */
  const keyboardOpen = useKeyboardOpen();
  useEffect(() => {
    if (keyboardOpen) {
      const timer = setTimeout(() => transcript.current?.scrollToEnd({ animated: true }), 80);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [keyboardOpen]);

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
  /** The messages this screen used to hand to `Alert.alert`. */
  const dialog = useDialog();
  const [chatEndedVisible, setChatEndedVisible] = useState(false);
  /** Who closed the session, from the server's `session:ended` — the ended prompt and the call status line say so when it was not the seeker. */
  const [endedBy, setEndedBy] = useState<'user' | 'astrologer' | 'system' | undefined>();
  const [endedReason, setEndedReason] = useState<string | undefined>();
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
   * 'chat' or 'call' — from the REST state on open, confirmed by every socket
   * (re)join. The body is the transcript and composer for a chat and the
   * voice-call panel for a call; everything else on this screen (the meter,
   * pauses, packages, recharge, how it ends) is the same for both.
   */
  const [channel, setChannel] = useState<'chat' | 'call'>();
  const isCall = channel === 'call';
  const [callPhase, setCallPhase] = useState<CallPhase>('idle');
  /** Why the audio isn't up — the token call refused, no microphone, the engine failed — shown in the status line with a Retry. */
  const [callError, setCallError] = useState<string>();
  /** Bumped by Retry, so the join effect below runs again. */
  const [callAttempt, setCallAttempt] = useState(0);
  /** The seeker's own choices — kept across a billing pause (which mutes on top of them) and a Retry. */
  const [muted, setMuted] = useState(false);
  const [speakerOn, setSpeakerOn] = useState(false);
  /** Whether the astrologer is in the channel right now — what a reconnect resumes to. */
  const peerPresent = useRef(false);

  /**
   * Package sessions only (undefined for per-minute, so none of the package
   * UI below ever renders there): where the package clock stands, from the
   * state read, every socket (re)join, and the package events. Countdowns are
   * measured on the server's clock — `clockOffset` is how far it is ahead of
   * this device — so a phone with a wrong clock still shows the right time.
   */
  const [pkg, setPkg] = useState<PackageView>();
  /** True while the continue choice is being sent — the sheet's buttons are disabled so it can't be sent twice. */
  const [continuing, setContinuing] = useState(false);
  /** The amount the recharge popup asks for when opened from the continue choice (the chosen option's price). */
  const [rechargeMin, setRechargeMin] = useState<number>();
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
    if (state.data?.channel === 'call' || state.data?.channel === 'chat') {
      setChannel(state.data.channel);
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

  /**
   * The package ran out: freeze the clock and block input exactly like a
   * per-minute balance pause. If nothing at all is affordable, the existing
   * Low Balance banner and Recharge popup come first; once something is,
   * the continue sheet asks for approval.
   */
  const pauseForChoice = (options: ContinueOptions, since?: string) => {
    pausedSinceOverride.current = since ? new Date(since).getTime() : null;
    setSessionPaused(true);
    if (options.canContinue === false) {
      setLowBalanceVisible(true);
      setRechargeVisible(true);
    } else {
      setLowBalanceVisible(false);
    }
  };

  /** Continued (another package, or per-minute) — the pause and any low-balance notice end. */
  const resumeAfterChoice = () => {
    setSessionPaused(false);
    setLowBalanceVisible(false);
    setRechargeMin(undefined);
  };

  // A package session opened (or re-read) while paused on the choice: re-ask.
  useEffect(() => {
    const view = state.data?.package;
    if (state.data?.billingMode === 'package' && view?.phase === 'awaiting_choice' && state.data.status === 'active') {
      pauseForChoice(view, view.awaitingChoiceSince);
    }
  }, [state.data]);

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
  /**
   * Closes the session on this side, once: the ended prompt (with who closed
   * it), a transcript line when it was the astrologer, and — for a call — out
   * of the voice channel immediately, whichever way the end was learnt
   * (`session:ended`, a rejoin, the poll below).
   */
  const endedHandled = useRef(false);
  const finishSession = useRef<(payload: { endedBy?: string; reason?: string }) => void>(() => {});
  finishSession.current = payload => {
    if (endedHandled.current) {
      return;
    }
    endedHandled.current = true;
    leaveVoiceCall();
    wallet.reload();
    const by =
      payload.endedBy === 'astrologer' || payload.reason === 'astrologer_ended'
        ? 'astrologer'
        : payload.endedBy === 'user'
          ? 'user'
          : 'system';
    setEndedBy(by);
    setEndedReason(payload.reason);
    /** The astrologer closing it gets a line in the transcript too, so the reason survives the prompt being dismissed. */
    if (by === 'astrologer' || payload.reason === 'astrologer_disconnected') {
      setMessages(current => [
        ...current,
        {
          id: `system-ended-${Date.now()}`,
          from: 'system',
          lines: [
            payload.reason === 'astrologer_disconnected'
              ? `${astrologerName} got disconnected — the ${isCall ? 'call' : 'chat'} has ended.`
              : `${astrologerName} has ended the ${isCall ? 'call' : 'chat'}.`,
          ],
          time: timeOf(),
        },
      ]);
    }
    setClosed(true);
    setEndChatVisible(false);
    setChatEndedVisible(true);
  };

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
        /**
         * Already over by the time the socket came back: the same close as
         * `session:ended`, which a socket that was down at that moment never
         * received — the call audio must not outlive the session.
         */
        if (payload.status && payload.status !== 'active' && payload.status !== 'requested') {
          getChatState(chatId)
            .then(fresh => finishSession.current({ endedBy: 'system', reason: fresh.endReason }))
            .catch(() => finishSession.current({ endedBy: 'system' }));
          return;
        }
        if (payload.serverTime) {
          clockOffset.current = clockOffsetMs(payload.serverTime);
        }
        if (payload.channel === 'call' || payload.channel === 'chat') {
          setChannel(payload.channel);
        }
        /** Package sessions: resync the package clock too — a package event can be missed exactly like a low-balance one. */
        if (payload.package) {
          setPkg(payload.package);
          if (payload.package.phase === 'awaiting_choice' && payload.status === 'active') {
            pauseForChoice(payload.package, payload.package.awaitingChoiceSince);
            return;
          }
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
      /** The package ran out — paused until the seeker approves how to continue. */
      onPackageEnded: payload => {
        clockOffset.current = clockOffsetMs(payload.serverTime);
        applyLiveBalance(payload.balanceRemaining);
        setPkg(current => ({ ...(current ?? {}), ...payload, phase: 'awaiting_choice', awaitingChoiceSince: payload.pausedSince }));
        pauseForChoice(payload);
      },
      /** Continued with another package (this device or another of the seeker's) — a fresh countdown. */
      onPackageExtended: payload => {
        clockOffset.current = clockOffsetMs(payload.serverTime);
        /** Only a figure the event actually carries — a reload here could land after a newer tick and roll the pill back. */
        if (payload.balanceRemaining !== undefined) {
          applyLiveBalance(payload.balanceRemaining);
        }
        setPkg(current => ({ ...(current ?? {}), phase: 'package', endsAt: payload.endsAt, awaitingChoiceSince: undefined, warningSeconds: current?.warningSeconds }));
        resumeAfterChoice();
      },
      /** Continued per-minute: from here it's an ordinary per-minute chat (ticks, low balance, recharge — all the existing handlers above). */
      onPerMinuteStarted: payload => {
        if (payload.balanceRemaining !== undefined) {
          applyLiveBalance(payload.balanceRemaining);
        }
        setPkg(current => ({
          ...(current ?? {}),
          phase: 'per_minute',
          perMinuteStartedAt: payload.perMinuteStartedAt,
          awaitingChoiceSince: undefined,
        }));
        resumeAfterChoice();
      },
      onEnded: payload => finishSession.current(payload),
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

  /**
   * The audio half of a call session. Joins the Agora channel only once the
   * session is active (the token endpoint refuses before that anyway) and
   * the token call succeeded; leaves it — once — when the session ends, on
   * Retry (which then joins afresh), or when this screen goes away.
   * Billing carries on regardless: the meter, the pauses and the packages
   * above are the server's, and an audio problem never stops them by itself.
   */
  const sessionActive = state.data?.status === 'active';
  useEffect(() => {
    if (!isCall || !sessionActive || closed) {
      return undefined;
    }
    let cancelled = false;
    setCallError(undefined);
    setCallPhase('connecting');
    peerPresent.current = false;

    const onEvent = (event: VoiceCallEvent) => {
      if (cancelled) {
        return;
      }
      switch (event.type) {
        case 'joined':
          setCallPhase(peerPresent.current ? 'connected' : 'ringing');
          break;
        case 'peerJoined':
          peerPresent.current = true;
          setCallPhase('connected');
          break;
        case 'peerLeft':
          peerPresent.current = false;
          setCallPhase('ringing');
          break;
        case 'reconnecting':
          setCallPhase('reconnecting');
          break;
        case 'reconnected':
          setCallPhase(peerPresent.current ? 'connected' : 'ringing');
          break;
        case 'tokenExpiring':
          fetchCallToken(chatId)
            .then(grant => {
              if (!cancelled) {
                renewVoiceToken(grant.token);
              }
            })
            .catch(() => {
              /** The current token has its last seconds left; the SDK asks again if it actually runs out. */
            });
          break;
        case 'permissionDenied':
          setCallError('Microphone access is needed for a voice call. Allow it and retry.');
          setCallPhase('idle');
          break;
        case 'error':
          setCallError(event.message ? `${event.message} (${event.code})` : `Call error (${event.code})`);
          setCallPhase('idle');
          break;
      }
    };

    (async () => {
      try {
        const grant = await fetchCallToken(chatId);
        if (cancelled) {
          return;
        }
        if (!grant.appId) {
          setCallError('Calls need a live server.');
          setCallPhase('idle');
          return;
        }
        await joinVoiceCall({
          appId: grant.appId,
          channelName: grant.channelName,
          uid: grant.uid,
          token: grant.token,
          onEvent,
        });
      } catch (error) {
        if (!cancelled) {
          setCallError(error instanceof ApiError ? error.message : 'Could not start the call.');
          setCallPhase('idle');
        }
      }
    })();

    return () => {
      cancelled = true;
      leaveVoiceCall();
    };
  }, [isCall, sessionActive, closed, chatId, callAttempt]);

  /**
   * While a call is live, re-read the session every 15s: a socket that was
   * down when the server ended it (the astrologer's End, their disconnect
   * grace running out, a timeout) never gets `session:ended`, and the audio
   * would otherwise carry on with nobody being billed and nobody listening.
   */
  useEffect(() => {
    if (!isCall || !sessionActive || closed) {
      return undefined;
    }
    const timer = setInterval(async () => {
      try {
        const fresh = await getChatState(chatId);
        if (fresh.status !== 'active') {
          finishSession.current({ endedBy: 'system', reason: fresh.endReason });
        }
      } catch {
        /** Offline right now — the next tick, or the socket's own event, will say. */
      }
    }, 15_000);
    return () => clearInterval(timer);
  }, [isCall, sessionActive, closed, chatId]);

  /** A billing pause mutes the microphone on top of the seeker's own choice; resuming restores exactly that choice. */
  useEffect(() => {
    setCallMuted(muted || sessionPaused);
  }, [muted, sessionPaused]);

  useEffect(() => {
    setCallSpeaker(speakerOn);
  }, [speakerOn]);

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
   * Only an actual pause locks the composer — exactly when the server stops
   * the session. A low-balance WARNING (the next minute won't be covered,
   * or the package's follow-on) shows the banner and its Recharge button,
   * but the time already paid for — the current minute, or the rest of a
   * package — stays usable; with ₹44 at ₹30/min the seeker gets their full
   * paid minute, and the chat pauses only once it runs out.
   */
  const composerLocked = closed || sessionPaused;
  /** Paused after a package, with something affordable: ask for approval (hidden while the recharge popup is up — one modal at a time). */
  const awaitingChoice = !closed && pkg?.phase === 'awaiting_choice';
  const continueSheetVisible = awaitingChoice && pkg?.canContinue !== false && !rechargeVisible;

  const chooseContinue = async (choice: ConsultationChoice) => {
    if (continuing) {
      return;
    }
    const price = choice.mode === 'package' ? choice.price : state.data?.ratePerMinute ?? 0;
    if (!canAfford(price, wallet.data?.balance ?? pkg?.balanceRemaining)) {
      setRechargeMin(price);
      setRechargeVisible(true);
      return;
    }
    setContinuing(true);
    try {
      const result = await continueConsultation(chatId, choice);
      clockOffset.current = clockOffsetMs(result.serverTime);
      applyLiveBalance(result.balanceRemaining);
      setPkg(current =>
        result.mode === 'package'
          ? { ...(current ?? {}), phase: 'package', endsAt: result.endsAt, awaitingChoiceSince: undefined }
          : { ...(current ?? {}), phase: 'per_minute', perMinuteStartedAt: result.perMinuteStartedAt, awaitingChoiceSince: undefined },
      );
      resumeAfterChoice();
    } catch (error) {
      if (error instanceof ApiError && error.code === 'insufficient_balance') {
        setRechargeMin(Number(error.details?.price ?? price));
        setRechargeVisible(true);
      } else if (error instanceof ApiError && (error.code === 'price_changed' || error.code === 'not_awaiting_choice')) {
        state.reload();
        if (error.code === 'price_changed') {
          dialog.show({ title: 'Price updated', tone: 'info', message: error.message });
        }
      } else {
        dialog.show({
          title: 'Could not continue',
          tone: 'error',
          message: error instanceof ApiError ? error.message : 'Something went wrong. Please try again.',
        });
      }
    } finally {
      setContinuing(false);
    }
  };

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
      dialog.show({
        title: 'Message not sent',
        tone: 'error',
        message: error instanceof ApiError ? error.message : 'Something went wrong. Please try again.',
      });
    }
  };

  /**
   * Android's own back button, while a consultation is live.
   *
   * Nothing handled it before, so back did what it does when no screen claims
   * it: left the app — mid-consultation, with the meter running, and no way to
   * say whether that was meant. It asks now, exactly as the header's red cross
   * does, so leaving this screen is always a decision rather than an accident.
   *
   * (Leaving anyway — closing or killing the app — is still handled, on the
   * server: the socket drops, and the session ends after a short grace rather
   * than billing an app that is gone. See chat.service.js's markUserAway.)
   */
  useEffect(() => {
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      /** Back out of the question itself, rather than stacking dialogs. */
      if (endChatVisible) {
        setEndChatVisible(false);
        return true;
      }
      /** Already over: back leaves the chat, instead of leaving the app. */
      if (closed) {
        onEnd?.();
        return true;
      }
      setEndChatVisible(true);
      return true;
    });
    return () => subscription.remove();
  }, [closed, endChatVisible, onEnd]);

  const confirmEndChat = async () => {
    setEndChatVisible(false);
    try {
      await endChat(chatId, 'user_ended');
      setClosed(true);
      setChatEndedVisible(true);
    } catch (error) {
      dialog.show({
        title: 'Could not end chat',
        tone: 'error',
        message: error instanceof ApiError ? error.message : 'Something went wrong. Please try again.',
      });
    }
  };

  /**
   * The Recharge popup's "Pay Now". `payTopUp` (services/payments.ts) opens
   * the order, runs the Razorpay checkout over this screen and has the
   * server verify and credit the payment; only then is the wallet re-read
   * and the popup closed.
   *
   * The amount is the tier's own figure — what the popup shows as the total,
   * what the checkout charges and what lands in the wallet are the same sum
   * (see the note on RechargeOption in data/wallet.ts).
   *
   * Closing the checkout is not an error: the popup is still there to pick
   * another tier or try again, so nothing is said about it.
   */
  const handleRecharge = async (option: RechargeOption) => {
    setPayingRecharge(true);
    try {
      await payTopUp({ amount: option.amount });
      await wallet.reload();
      setRechargeVisible(false);
      setRechargeMin(undefined);
      setLowBalanceVisible(false);
      /** Paused after a package: re-read the options against the new balance, then ask for approval. */
      if (pkg?.phase === 'awaiting_choice') {
        state.reload();
      }
    } catch (error) {
      const failure = describePaymentError(error);
      if (error instanceof PaymentUnconfirmedError) {
        /** Paid, with only the confirmation outstanding: close the popup so the same recharge is not paid for twice. */
        setRechargeVisible(false);
      }
      if (!failure.cancelled) {
        dialog.show(failure.dialog);
      }
    } finally {
      setPayingRecharge(false);
    }
  };

  const walletBalance = rupees(wallet.data?.balance ?? 0);

  /* The voice-call panel: what the audio is doing right now, over the same clock and balance the header shows. */
  const callStatusLine = closed
    ? endedReason === 'astrologer_disconnected'
      ? `${astrologerName} got disconnected`
      : endedBy === 'astrologer'
        ? `${astrologerName} ended the call`
        : 'Call ended'
    : callError !== undefined
      ? callError
      : awaitingChoice
        ? 'Paused — choose how to continue'
        : sessionPaused
          ? 'Paused — add money'
          : callPhase === 'connected'
            ? 'Connected'
            : callPhase === 'reconnecting'
              ? 'Reconnecting…'
              : callPhase === 'ringing'
                ? `Ringing… waiting for ${astrologerName}`
                : 'Connecting…';
  const callTimerLabel = awaitingChoice
    ? 'Paused'
    : pkg?.phase === 'package'
      ? `${formatCountdown(packageSecondsLeft)} left`
      : clockLabel(elapsed);
  const callMetaLabel = `${rupees(state.data?.ratePerMinute ?? 0)}/min · Wallet ${walletBalance}`;
  const callFailed = callError !== undefined && !closed;
  const retryCall = () => {
    setCallError(undefined);
    setCallAttempt(count => count + 1);
  };

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
            {awaitingChoice
              ? '(Paused)'
              : pkg?.phase === 'package'
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
        <PackageTimerBanner secondsLeft={packageSecondsLeft} />
      )}

      {lowBalanceVisible && (
        <LowBalanceBanner
          balance={wallet.data?.balance ?? 0}
          onRecharge={() => setRechargeVisible(true)}
        />
      )}

      <AppDialog request={dialog.request} onDismiss={dialog.dismiss} />

      <EndChatDialog
        visible={endChatVisible}
        onDismiss={() => setEndChatVisible(false)}
        onStay={() => setEndChatVisible(false)}
        onEndChat={confirmEndChat}
      />

      <ChatEndedDialog
        visible={chatEndedVisible}
        endedBy={endedBy}
        reason={endedReason}
        astrologerName={astrologerName}
        channel={isCall ? 'call' : 'chat'}
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

      <ContinueConsultationSheet
        visible={continueSheetVisible}
        ratePerMinute={pkg?.ratePerMinute ?? state.data?.ratePerMinute ?? 0}
        quotes={resolveQuotes(pkg?.packages, pkg?.ratePerMinute ?? state.data?.ratePerMinute, wallet.data?.balance ?? pkg?.balanceRemaining)}
        balance={wallet.data?.balance ?? pkg?.balanceRemaining}
        busy={continuing}
        onContinue={chooseContinue}
        onEnd={() => {
          if (!continuing) {
            confirmEndChat();
          }
        }}
      />

      <RechargePopup
        visible={rechargeVisible}
        minRequired={rechargeMin ?? state.data?.ratePerMinute}
        onDismiss={() => {
          setRechargeVisible(false);
          setRechargeMin(undefined);
        }}
        onPay={handleRecharge}
        loading={payingRecharge}
      />

      {isCall ? (
        /* A call is voice only for now: the astrologer's portrait, what the line is doing, and the controls — no transcript, no composer. */
        <View style={styles.body}>
          <View style={styles.callStage}>
            <View style={styles.callAvatarRing}>
              {photo !== undefined ? (
                <Image source={photo} style={styles.avatar} resizeMode="cover" />
              ) : (
                <View style={[styles.avatar, styles.callAvatarFallback]}>
                  <Text style={styles.callInitial}>{astrologerName.slice(0, 1)}</Text>
                </View>
              )}
            </View>
            <Text style={styles.callPeer} numberOfLines={1}>
              {astrologerName}
            </Text>
            <Text
              accessibilityLiveRegion="polite"
              style={[styles.callStatus, callFailed && styles.callStatusError]}
            >
              {callStatusLine}
            </Text>
            <Text style={styles.callTimer}>{callTimerLabel}</Text>
            <Text style={styles.callMeta}>{callMetaLabel}</Text>

            {callFailed && (
              <>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Retry the call"
                  onPress={retryCall}
                  style={({ pressed }) => [styles.retry, pressed && styles.pressed]}
                >
                  <BrandGradient radius={radius.button} />
                  <Text style={styles.retryLabel}>Retry</Text>
                </Pressable>
                {/* The session is the server's and keeps billing whether or not the audio comes up — so the way out is spelled out. */}
                <Text style={styles.callHint}>
                  The consultation is still running and being billed. End the call if you cannot connect.
                </Text>
              </>
            )}
          </View>

          <View style={[styles.callControls, { paddingBottom: spacing.xl + insets.bottom }]}>
            <CallControl
              label={muted ? 'Unmute' : 'Mute'}
              accessibilityLabel={muted ? 'Unmute microphone' : 'Mute microphone'}
              active={muted}
              disabled={closed}
              onPress={() => setMuted(current => !current)}
            >
              {muted ? <MicOffIcon size={CALL_CONTROL_ICON} /> : <MicOnIcon size={CALL_CONTROL_ICON} />}
            </CallControl>

            {/* The same confirmation and the same POST /chats/:id/end as the header's cross. */}
            <View style={styles.callControlBlock}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="End the call"
                accessibilityState={{ disabled: closed }}
                disabled={closed}
                onPress={() => setEndChatVisible(true)}
                style={({ pressed }) => [styles.hangUp, closed && styles.controlDisabled, pressed && styles.pressed]}
              >
                <HangUpIcon size={HANG_UP_ICON} />
              </Pressable>
              <Text style={styles.callControlLabel}>End</Text>
            </View>

            <CallControl
              label="Speaker"
              accessibilityLabel={speakerOn ? 'Switch to earpiece' : 'Switch to speaker'}
              active={speakerOn}
              disabled={closed}
              onPress={() => setSpeakerOn(current => !current)}
            >
              <SpeakerIcon
                size={CALL_CONTROL_ICON}
                color={speakerOn ? colors.text.inverse : colors.text.onYellow}
              />
            </CallControl>
          </View>
        </View>
      ) : (
        <KeyboardAvoidingView
          style={styles.body}
          /** 'padding' on Android too — edge-to-edge ignores adjustResize, see hooks/useKeyboardOpen.ts. */
          behavior="padding"
          keyboardVerticalOffset={0}
        >
          <ScrollView
            ref={transcript}
            contentContainerStyle={styles.transcript}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="interactive"
            onContentSizeChange={() =>
              transcript.current?.scrollToEnd({ animated: true })
            }
          >
            {messages.map(message => (
              <ConsultationBubble key={message.id} message={message} />
            ))}
          </ScrollView>

          <View
            style={[styles.composerRow, { paddingBottom: spacing.md + (keyboardOpen ? 0 : insets.bottom) }]}
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
      )}
    </View>
  );
}

type CallControlProps = {
  label: string;
  accessibilityLabel: string;
  /** Painted with the brand gradient while on. */
  active: boolean;
  disabled?: boolean;
  onPress: () => void;
  children: React.ReactNode;
};

/** One round toggle on the call's control row — Mute and Speaker. */
function CallControl({
  label,
  accessibilityLabel,
  active,
  disabled = false,
  onPress,
  children,
}: CallControlProps) {
  return (
    <View style={styles.callControlBlock}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        accessibilityState={{ disabled, selected: active }}
        disabled={disabled}
        onPress={onPress}
        style={({ pressed }) => [styles.control, disabled && styles.controlDisabled, pressed && styles.pressed]}
      >
        {active && <BrandGradient radius={CALL_CONTROL_SIZE / 2} />}
        {children}
      </Pressable>
      <Text style={styles.callControlLabel}>{label}</Text>
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
  callStage: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.section,
  },
  callAvatarRing: {
    width: CALL_AVATAR_SIZE,
    height: CALL_AVATAR_SIZE,
    marginBottom: spacing.md,
    borderRadius: CALL_AVATAR_SIZE / 2,
    borderWidth: 3,
    borderColor: colors.gradient.from,
    overflow: 'hidden',
  },
  callAvatarFallback: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceMuted,
  },
  callInitial: {
    ...typography.heading,
    color: colors.text.primary,
  },
  callPeer: {
    ...typography.titleSmall,
    color: colors.text.primary,
  },
  callStatus: {
    ...typography.subtitle,
    color: colors.text.secondary,
    textAlign: 'center',
  },
  callStatusError: {
    color: colors.status.negative,
  },
  callTimer: {
    ...typography.pageTitle,
    marginTop: spacing.sm,
    color: colors.text.primary,
  },
  callMeta: {
    ...typography.caption,
    color: colors.text.muted,
  },
  retry: {
    height: 44,
    minWidth: 160,
    marginTop: spacing.lg,
    paddingHorizontal: spacing.xl,
    borderRadius: radius.button,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  retryLabel: {
    ...typography.buttonSmall,
    color: colors.text.inverse,
  },
  callHint: {
    ...typography.footnoteSmall,
    marginTop: spacing.sm,
    color: colors.text.secondary,
    textAlign: 'center',
  },
  callControls: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-evenly',
    paddingTop: spacing.lg,
    paddingHorizontal: spacing.section,
  },
  callControlBlock: {
    alignItems: 'center',
    gap: spacing.sm,
  },
  control: {
    width: CALL_CONTROL_SIZE,
    height: CALL_CONTROL_SIZE,
    borderRadius: CALL_CONTROL_SIZE / 2,
    borderWidth: hairline,
    borderColor: colors.border.subtle,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    backgroundColor: colors.surfaceMuted,
  },
  controlDisabled: {
    opacity: 0.4,
  },
  hangUp: {
    width: CALL_CONTROL_SIZE,
    height: CALL_CONTROL_SIZE,
    borderRadius: CALL_CONTROL_SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.status.cancelMark,
  },
  callControlLabel: {
    ...typography.captionMedium,
    color: colors.text.secondary,
  },
});
