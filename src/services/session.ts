/**
 * The signed-in session: what it is, where it is kept, and who is told when it
 * changes.
 *
 * One module owns this because three separate things need the same answer and
 * must never disagree about it — the axios client (which token to send), the
 * navigation shell (whether to show the app or the welcome screen), and the
 * login screens (what to do once a code checks out).
 *
 * The tokens live in the device keystore (see secureStore.ts). They are also
 * mirrored in memory, so the request interceptor can read the access token
 * synchronously on every call rather than awaiting a keystore round-trip per
 * request.
 */

import type { AuthUser } from './auth';
import { deleteSecret, readSecret, writeSecret } from './secureStore';

/** What signing in produced, in the shape it is stored. */
export type Session = {
  accessToken: string;
  refreshToken: string;
  user: AuthUser;
};

/** The single keystore entry the whole session is written to, as JSON. */
const SESSION_KEY = 'auth.session';

let current: Session | null = null;
/** Cleared once restore() has run, so the shell knows not to decide too early. */
let restored = false;

type Listener = (session: Session | null) => void;
const listeners = new Set<Listener>();

function announce() {
  for (const listener of listeners) {
    listener(current);
  }
}

/**
 * Subscribes to sign-in and sign-out. Returns the unsubscribe function, which
 * is what a `useEffect` wants back.
 *
 * This is how the app reacts to a session it did not itself end — a refresh
 * token that turns out to be expired takes the user back to the welcome screen
 * from wherever they were, without any screen having to check.
 */
export function onSessionChange(listener: Listener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/** The session as it stands, without touching the keystore. */
export const getSession = () => current;

/** The token every authenticated request carries. */
export const getAccessToken = () => current?.accessToken ?? null;

/** The token POST /auth/refresh is bought with. */
export const getRefreshToken = () => current?.refreshToken ?? null;

export const isSignedIn = () => current !== null;

/** Whether the keystore has been read yet — see restoreSession. */
export const isRestored = () => restored;

/**
 * Reads whatever the last run left behind. Called once, at startup.
 *
 * Until this resolves the app genuinely does not know whether anyone is signed
 * in, which is why the shell holds a splash rather than guessing: routing to
 * the welcome screen first and correcting a moment later would flash the login
 * flow at an already-signed-in user on every launch.
 *
 * Anything unreadable is treated as no session at all. There is nothing useful
 * to do with half a session, and the cost of being wrong is one sign-in.
 */
export async function restoreSession(): Promise<Session | null> {
  const stored = await readSecret(SESSION_KEY);
  restored = true;

  if (!stored) {
    return null;
  }

  try {
    const parsed = JSON.parse(stored) as Session;
    /** A truncated or half-written entry is not a session. */
    if (!parsed?.accessToken || !parsed?.refreshToken || !parsed?.user) {
      await deleteSecret(SESSION_KEY);
      return null;
    }
    current = parsed;
  } catch {
    await deleteSecret(SESSION_KEY);
    return null;
  }

  announce();
  return current;
}

/**
 * Records a new session — the answer to register, to an OTP verification, and
 * later to Google and Apple.
 *
 * Memory is updated before the keystore write is awaited, so the very next
 * request already carries the new token; the write is awaited so a caller that
 * navigates away knows the session is safely down.
 */
export async function saveSession(session: Session): Promise<void> {
  current = session;
  announce();
  await writeSecret(SESSION_KEY, JSON.stringify(session));
}

/**
 * Replaces just the tokens, keeping the user.
 *
 * This is what a silent refresh writes back. It is deliberately a no-op when
 * there is no session: a refresh that lands after the user has signed out must
 * not resurrect them.
 */
export async function updateTokens(tokens: {
  accessToken: string;
  refreshToken: string;
}): Promise<void> {
  if (!current) {
    return;
  }
  await saveSession({ ...current, ...tokens });
}

/** Keeps the profile fields fresh after an edit, without a re-login. */
export async function updateUser(user: AuthUser): Promise<void> {
  if (!current) {
    return;
  }
  await saveSession({ ...current, user });
}

/**
 * Ends the session and wipes the keystore entry.
 *
 * Called both when the user signs out and when the server refuses a refresh.
 * Memory is cleared first so nothing can read a stale token even if the
 * keystore delete is slow or fails.
 */
export async function clearSession(): Promise<void> {
  current = null;
  announce();
  await deleteSecret(SESSION_KEY);
}
