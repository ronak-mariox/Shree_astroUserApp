/**
 * The axios instance every request goes through.
 *
 * One place decides where the API lives, how long to wait, and what an error
 * looks like by the time a screen sees it — so screens only ever deal with
 * `ApiError.message`, which is already safe to print.
 */

import axios, {
  type AxiosError,
  type AxiosInstance,
  type InternalAxiosRequestConfig,
} from 'axios';
import { Platform } from 'react-native';

import {
  clearSession,
  getAccessToken,
  getRefreshToken,
  isSignedIn,
  updateTokens,
} from './session';

/**
 * Where the API lives in development.
 *
 * The server runs on the machine hosting the packager, which a phone cannot
 * call `localhost` unless the port is forwarded to it. On Android that is the
 * same trick Metro already uses over USB, so run this once per session:
 *
 *   adb reverse tcp:5000 tcp:5000
 *
 * Without the forward — a device on Wi-Fi rather than USB — set DEV_HOST to the
 * machine's LAN IP (`ipconfig getifaddr en0`, e.g. '192.168.1.35') with the
 * phone on the same network.
 *
 * Note 10.0.2.2 only works on the Android *emulator*: it is that guest's alias
 * for the host's loopback, and means nothing on a real handset.
 */
const DEV_HOST = Platform.select({
  android: 'localhost',
  ios: '127.0.0.1',
  default: '127.0.0.1',
});

const DEV_PORT = 5000;

export const API_BASE_URL = `http://${DEV_HOST}:${DEV_PORT}/api/v1`;

/** How long a request may take before it is treated as unreachable. */
const TIMEOUT_MS = 15000;

export const client: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: TIMEOUT_MS,
});

/**
 * A second, bare instance used only to refresh.
 *
 * It has no interceptors, which is the whole point: a refresh that comes back
 * 401 must surface as a plain failure. Sent through `client` it would trip the
 * response interceptor below, which would try to refresh it, and so on.
 */
const refreshClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: TIMEOUT_MS,
});

client.interceptors.request.use(config => {
  /**
   * Read fresh on every request rather than captured once: a silent refresh
   * can replace the token between a request being created and being sent.
   */
  const token = getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  /**
   * A multipart body must carry the boundary React Native generates for it, so
   * the header is left for the platform to write. Anything else is JSON.
   */
  if (config.data instanceof FormData) {
    delete config.headers['Content-Type'];
  } else if (config.data !== undefined) {
    config.headers['Content-Type'] = 'application/json';
  }

  return config;
});

/** What a screen catches: a message worth showing, and the status behind it. */
export class ApiError extends Error {
  status?: number;
  /** Per-field messages, when the server sent them. */
  fields?: Record<string, string>;
  /**
   * The server's stable reason, when it sent one — "account_not_found",
   * "otp_cooldown", "token_expired". Screens branch on this rather than on the
   * message, which is prose and may be reworded.
   */
  code?: string;
  /** How long to wait before retrying, when the server said (429s). */
  retryAfterSeconds?: number;

  constructor(
    message: string,
    status?: number,
    fields?: Record<string, string>,
    code?: string,
    retryAfterSeconds?: number,
  ) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.fields = fields;
    this.code = code;
    this.retryAfterSeconds = retryAfterSeconds;
  }
}

type ErrorBody = {
  error?: string;
  message?: string;
  fields?: Record<string, string>;
  code?: string;
  retryAfterSeconds?: number;
};

/** Turns whatever axios threw into an ApiError a screen can print as-is. */
export function toApiError(error: unknown): ApiError {
  const axiosError = error as AxiosError<ErrorBody>;

  if (!axios.isAxiosError(axiosError)) {
    return new ApiError('Something went wrong. Please try again.');
  }

  if (axiosError.code === 'ECONNABORTED') {
    return new ApiError('The request timed out. Please try again.');
  }

  /** No response at all — the phone is offline, or the API is not running. */
  if (!axiosError.response) {
    return new ApiError('Cannot reach the server. Check your connection.');
  }

  const { status, data } = axiosError.response;
  const message =
    data?.error ||
    data?.message ||
    (status >= 500
      ? 'The server had a problem. Please try again.'
      : 'Something went wrong. Please try again.');

  return new ApiError(
    message,
    status,
    data?.fields,
    data?.code,
    data?.retryAfterSeconds,
  );
}

/**
 * Keeping a session alive without the user noticing — and ending it when it
 * cannot be kept.
 *
 * The access token lasts minutes, so an app left open will hit an expired one
 * mid-screen. That is not a sign-out — the refresh token is still good — so the
 * request is retried once behind a refresh instead of being handed to the
 * screen as a failure.
 *
 * Only `token_expired` is worth refreshing past. Every *other* 401 that arrives
 * while a session is held means the stored tokens are not merely old but no
 * longer accepted — the signing secret was rotated, the keystore entry is
 * damaged, the account was deleted — and there is no request that will start
 * working. Those end the session rather than being reported to the screen,
 * because the alternative is an app that fails every call forever with no way
 * back to the welcome screen.
 */

/** Marks a request that has already been retried, so it cannot loop. */
type RetriableConfig = InternalAxiosRequestConfig & { _retried?: boolean };

/**
 * The refresh in flight, if any.
 *
 * Several requests usually expire together — a screen that loads three things
 * at once fails three times. They must not each refresh: the first would spend
 * the refresh token and the rest would race behind it. Instead they all await
 * the same promise, and the one that started it is the only one that asks.
 */
let refreshing: Promise<string> | null = null;

async function refreshAccessToken(): Promise<string> {
  const refreshToken = getRefreshToken();
  if (!refreshToken) {
    throw new ApiError('Please sign in again.', 401, undefined, 'no_refresh_token');
  }

  const { data } = await refreshClient.post<{
    accessToken: string;
    refreshToken: string;
  }>('/auth/refresh', { refreshToken });

  await updateTokens(data);
  return data.accessToken;
}

/** One refresh at a time; everybody waits on the same one. */
function refreshOnce(): Promise<string> {
  refreshing =
    refreshing ??
    refreshAccessToken().finally(() => {
      refreshing = null;
    });

  return refreshing;
}

client.interceptors.response.use(
  response => response,
  async error => {
    const apiError = toApiError(error);
    const config = (error as AxiosError).config as RetriableConfig | undefined;

    /**
     * A 401 with no session behind it is just a 401 — a login endpoint being
     * refused, say. There is nothing to refresh and nothing to end.
     */
    if (apiError.status !== 401 || !isSignedIn()) {
      return Promise.reject(apiError);
    }

    const canRefresh =
      apiError.code === 'token_expired' &&
      config !== undefined &&
      !config._retried &&
      getRefreshToken() !== null;

    if (canRefresh) {
      config._retried = true;
      try {
        const accessToken = await refreshOnce();
        config.headers.Authorization = `Bearer ${accessToken}`;
        return await client.request(config);
      } catch {
        /** The refresh token is spent or revoked — fall through and sign out. */
      }
    }

    /**
     * Nothing left to salvage. Clearing the session fires the listeners in
     * session.ts, which is what puts the user back on the welcome screen from
     * wherever they happened to be.
     */
    await clearSession();
    return Promise.reject(
      new ApiError(
        'Your session has expired. Please sign in again.',
        401,
        undefined,
        'session_expired',
      ),
    );
  },
);
