/**
 * The live half of a consultation: everything the REST API in `api.ts` cannot
 * push on its own — a message arriving, the minute meter ticking, the other
 * side accepting or ending a chat.
 *
 * One socket for the whole app, opened once the seeker is signed in and
 * closed the moment they are not (mirroring `client.ts`'s own read of
 * `session.ts`). Screens never construct their own connection; they call
 * `getSocket()` and attach the listeners they care about, and detach them on
 * unmount — the connection itself outlives any one screen.
 */

import { io, type Socket } from 'socket.io-client';

import { API_BASE_URL } from './client';
import { getAccessToken } from './session';

/** socket.io attaches to the server root, not the REST API's `/api/v1` path. */
const SOCKET_BASE_URL = API_BASE_URL.replace(/\/api\/v1\/?$/, '');

/** Event names, kept identical to backend/models/Chat.js's CHAT_EVENTS — see that file for what each one carries. */
export const CHAT_EVENTS = {
  JOIN: 'chat:join',
  LEAVE: 'chat:leave',
  SEND: 'message:send',
  NEW: 'message:new',
  DELIVERED: 'message:delivered',
  READ: 'message:read',
  TYPING: 'chat:typing',
  ENDED: 'session:ended',
  TICK: 'chat:tick',
  LOW_BALANCE: 'chat:low_balance',
  /** The astrologer's own socket dropping/returning while this chat is active — billing pauses for the gap; see backend/services/chat.service.js's pauseSessionsForAstrologer/resumeSessionsForAstrologer. */
  ASTROLOGER_LEFT: 'chat:astrologer_left',
  ASTROLOGER_JOINED: 'chat:astrologer_joined',
  /** Emitted outside any chat room, to the seeker's own `user:{id}` room — see backend/services/chat.service.js. */
  REQUESTED: 'chat:requested',
  STARTED: 'chat:started',
  ACCEPTED: 'chat:accepted',
  REJECTED: 'chat:rejected',
  MISSED: 'chat:missed',
  CANCELLED: 'chat:cancelled',
} as const;

export const roomFor = (chatId: string) => `chat:${chatId}`;

let socket: Socket | null = null;

/**
 * Opens the connection if one isn't already open or opening. Safe to call
 * repeatedly — a screen that needs live chat can just call this on mount
 * without worrying whether App.tsx already did.
 */
export function connectSocket(): Socket | null {
  const token = getAccessToken();
  if (!token) {
    return null;
  }

  if (socket) {
    if (socket.auth && (socket.auth as { token?: string }).token !== token) {
      /** A refreshed token — reconnect so the next handshake carries it. */
      socket.auth = { token };
      socket.disconnect().connect();
    } else if (!socket.connected) {
      socket.connect();
    }
    return socket;
  }

  socket = io(SOCKET_BASE_URL, {
    auth: { token },
    transports: ['websocket'],
    autoConnect: true,
    reconnection: true,
  });

  socket.on('connect_error', error => {
    console.warn('[socket] connect_error:', error.message);
  });

  return socket;
}

export function getSocket(): Socket | null {
  return socket;
}

/**
 * Closes the connection. Called from App.tsx's own session-change listener
 * (see session.ts's `onSessionChange`) — not registered here at module load,
 * so importing this file never opens a connection on its own; a screen test
 * that pulls in services/api.ts (which pulls in this module) must not reach
 * out to a real server it never asked to talk to.
 */
export function disconnectSocket() {
  if (socket) {
    socket.removeAllListeners();
    socket.disconnect();
    socket = null;
  }
}

/**
 * Joins a chat's room and returns what was missed since `lastSeq` — mirrors
 * socket/chat.handlers.js's JOIN handler, which is also how a reconnect
 * catches back up.
 */
export function joinChatRoom(
  chatId: string,
  lastSeq = 0,
): Promise<{
  chatId: string;
  role: 'user' | 'astrologer';
  status: string;
  /** Whether billing is paused for insufficient balance RIGHT NOW — the true current state, not just "was a pause event ever seen." A live chat:low_balance push can be missed by a socket that was briefly disconnected; this is how a (re)join recovers the real answer. */
  paused: boolean;
  /** ISO timestamp of when the current pause began, or null — lets a (re)joining client backdate its own freeze point instead of freezing from whenever it happens to notice. */
  pausedSince: string | null;
  seq: number;
  unread: number;
  messages: unknown[];
  error?: string;
}> {
  return new Promise((resolve, reject) => {
    const active = connectSocket();
    if (!active) {
      reject(new Error('Not signed in.'));
      return;
    }
    active.emit(CHAT_EVENTS.JOIN, { chatId, lastSeq }, (state: { error?: string }) => {
      if (state?.error) {
        reject(new Error(state.error));
        return;
      }
      resolve(state as never);
    });
  });
}

export function leaveChatRoom(chatId: string) {
  socket?.emit(CHAT_EVENTS.LEAVE, { chatId });
}

/** Mirrors backend/models/Chat.js's Message#toSocketPayload — what every message arrives shaped like, over the socket or the REST fallback alike. */
export type ChatMessage = {
  id: string;
  chatId: string;
  senderId: string | null;
  senderRole: 'user' | 'astrologer' | 'system' | 'ai';
  type: string;
  content: { text?: string; [key: string]: unknown };
  seq: number;
  replyTo: string | null;
  status: 'sent' | 'delivered' | 'read';
  clientMessageId?: string;
  createdAt: string;
};

/**
 * Sends a message over the socket. Falls back to the REST `sendMessage` in
 * `api.ts` when there is no live connection — the socket path is the normal
 * one, but a message must never be lost just because the connection dropped.
 */
export function sendChatMessage(
  chatId: string,
  text: string,
  clientMessageId: string,
): Promise<{ message?: unknown; error?: string }> {
  return new Promise((resolve, reject) => {
    if (!socket?.connected) {
      reject(new Error('offline'));
      return;
    }
    socket.emit(
      CHAT_EVENTS.SEND,
      { chatId, type: 'text', content: { text }, clientMessageId },
      (result: { message?: unknown; error?: string }) => {
        if (result?.error) {
          reject(new Error(result.error));
          return;
        }
        resolve(result);
      },
    );
  });
}

type TickPayload = {
  chatId: string;
  minutesBilled: number;
  minutesRemaining: number;
  balanceRemaining?: number;
};
type LowBalancePayload = {
  chatId: string;
  exhausted: boolean;
  /** true once billing has actually paused (insufficient balance at the real cutoff); false again the moment a top-up resumes it. Undefined for the pre-cutoff warnings, which never pause anything. */
  paused?: boolean;
  minutesRemaining?: number;
  graceSeconds?: number;
  secondsUntilCut?: number;
  requiredAmount?: number;
  balanceRemaining?: number;
};
type EndedPayload = { chatId: string; endedBy: string; reason?: string; durationSeconds: number; amountCharged: number };
type AstrologerLeftPayload = { chatId: string; reconnectSeconds: number };
type AstrologerJoinedPayload = { chatId: string };

/**
 * Everything a live consultation screen needs while it is open: the
 * transcript (backfilled once now, and again after any reconnect — a chat
 * room is not remembered across a dropped socket, so rejoining is how a gap
 * fills itself back in), the minute ticks, low-balance warnings, and the end.
 *
 * Returns the unsubscribe function; call it on unmount.
 */
export function subscribeToChat(
  chatId: string,
  initialSeq: number,
  handlers: {
    onMessage?: (message: ChatMessage) => void;
    onTick?: (payload: TickPayload) => void;
    onLowBalance?: (payload: LowBalancePayload) => void;
    onEnded?: (payload: EndedPayload) => void;
    /** The astrologer's own connection dropped — billing is paused, not the session ending; `onEnded` still fires separately if they never come back within `reconnectSeconds`. */
    onAstrologerLeft?: (payload: AstrologerLeftPayload) => void;
    onAstrologerJoined?: (payload: AstrologerJoinedPayload) => void;
    /**
     * Fires on every (re)join — including the very first one, since a socket
     * that's already connected by the time this screen mounts still runs
     * `rejoin()` immediately — with the session's true current pause state.
     * A live chat:low_balance push can be missed entirely by a socket that
     * was briefly disconnected; this is what lets the screen recover the
     * real answer instead of trusting whatever it last happened to see.
     */
    onRejoinState?: (payload: { status: string; paused: boolean; pausedSince: string | null }) => void;
  },
): () => void {
  const active = connectSocket();
  if (!active) {
    return () => {};
  }

  let seq = initialSeq;

  const rejoin = () => {
    joinChatRoom(chatId, seq)
      .then(state => {
        handlers.onRejoinState?.({ status: state.status, paused: state.paused, pausedSince: state.pausedSince });
        for (const message of state.messages as ChatMessage[]) {
          seq = Math.max(seq, message.seq ?? seq);
          handlers.onMessage?.(message);
        }
      })
      .catch(() => {
        /** The room membership itself is what matters; a failed backfill just means nothing was missed to show. */
      });
  };

  if (active.connected) {
    rejoin();
  }
  active.on('connect', rejoin);

  const onMessage = (payload: ChatMessage) => {
    if (payload?.chatId !== chatId) return;
    seq = Math.max(seq, payload.seq ?? seq);
    handlers.onMessage?.(payload);
  };
  const onTick = (payload: TickPayload) => {
    if (payload?.chatId === chatId) handlers.onTick?.(payload);
  };
  const onLowBalance = (payload: LowBalancePayload) => {
    if (payload?.chatId === chatId) handlers.onLowBalance?.(payload);
  };
  const onEnded = (payload: EndedPayload) => {
    if (payload?.chatId === chatId) handlers.onEnded?.(payload);
  };
  const onAstrologerLeft = (payload: AstrologerLeftPayload) => {
    if (payload?.chatId === chatId) handlers.onAstrologerLeft?.(payload);
  };
  const onAstrologerJoined = (payload: AstrologerJoinedPayload) => {
    if (payload?.chatId === chatId) handlers.onAstrologerJoined?.(payload);
  };

  active.on(CHAT_EVENTS.NEW, onMessage);
  active.on(CHAT_EVENTS.TICK, onTick);
  active.on(CHAT_EVENTS.LOW_BALANCE, onLowBalance);
  active.on(CHAT_EVENTS.ENDED, onEnded);
  active.on(CHAT_EVENTS.ASTROLOGER_LEFT, onAstrologerLeft);
  active.on(CHAT_EVENTS.ASTROLOGER_JOINED, onAstrologerJoined);

  return () => {
    active.off('connect', rejoin);
    active.off(CHAT_EVENTS.NEW, onMessage);
    active.off(CHAT_EVENTS.TICK, onTick);
    active.off(CHAT_EVENTS.LOW_BALANCE, onLowBalance);
    active.off(CHAT_EVENTS.ENDED, onEnded);
    active.off(CHAT_EVENTS.ASTROLOGER_LEFT, onAstrologerLeft);
    active.off(CHAT_EVENTS.ASTROLOGER_JOINED, onAstrologerJoined);
    leaveChatRoom(chatId);
  };
}

/**
 * The pre-active half of a chat: the seeker's own account room hears whether
 * the astrologer accepted, rejected, or never answered a specific request.
 * Only one of these ever fires for a given chatId.
 */
export function subscribeToChatRequest(
  chatId: string,
  handlers: {
    onAccepted?: () => void;
    onRejected?: (reason?: string) => void;
    onMissed?: () => void;
  },
): () => void {
  const active = connectSocket();
  if (!active) {
    return () => {};
  }

  const onAccepted = (payload: { chatId: string }) => {
    if (payload?.chatId === chatId) handlers.onAccepted?.();
  };
  const onRejected = (payload: { chatId: string; reason?: string }) => {
    if (payload?.chatId === chatId) handlers.onRejected?.(payload.reason);
  };
  const onMissed = (payload: { chatId: string }) => {
    if (payload?.chatId === chatId) handlers.onMissed?.();
  };

  active.on(CHAT_EVENTS.ACCEPTED, onAccepted);
  active.on(CHAT_EVENTS.REJECTED, onRejected);
  active.on(CHAT_EVENTS.MISSED, onMissed);

  return () => {
    active.off(CHAT_EVENTS.ACCEPTED, onAccepted);
    active.off(CHAT_EVENTS.REJECTED, onRejected);
    active.off(CHAT_EVENTS.MISSED, onMissed);
  };
}
