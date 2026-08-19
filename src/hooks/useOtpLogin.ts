/**
 * The sign-in flow, without any of the layout.
 *
 * OtpLoginScreen and EmailLoginScreen are the same two steps drawn twice — send
 * a code, then trade it for a session — so the steps live here and the screens
 * only decide what they look like. That is also the guarantee that the two
 * behave identically: one cooldown timer, one set of error messages, one rule
 * about when the code card lights up.
 */

import { useCallback, useEffect, useState } from 'react';

import { ApiError } from '../services/client';
import {
  requestLoginOtp,
  verifyLoginOtp,
  type AuthSession,
  type LoginIdentifier,
  type OtpRequest,
} from '../services/auth';

/** What both login screens read off this hook. */
export type OtpLogin = {
  /** The code that is out, once one has been sent. Undefined before that. */
  sent?: OtpRequest;
  sending: boolean;
  verifying: boolean;
  /** A message to print above the buttons, already safe to show. */
  error?: string;
  /**
   * The identifier has no account behind it. Separate from `error` because the
   * screen answers it differently — with a way to Register, not a retry.
   */
  notRegistered: boolean;
  /** Seconds until Resend will be accepted; 0 means it is available. */
  resendIn: number;
  send: (identifier: LoginIdentifier) => Promise<void>;
  verify: (identifier: LoginIdentifier, code: string) => Promise<void>;
  /** Called when the number or address is edited — the code no longer applies. */
  reset: () => void;
};

/**
 * @param onSignedIn Handed the session once a code checks out. Runs only on
 *   success, so a screen can navigate away without checking anything itself.
 */
export function useOtpLogin(
  onSignedIn?: (session: AuthSession) => void,
): OtpLogin {
  const [sent, setSent] = useState<OtpRequest>();
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState<string>();
  const [notRegistered, setNotRegistered] = useState(false);
  const [resendIn, setResendIn] = useState(0);

  /**
   * One interval per send, counting the resend cooldown down to zero.
   *
   * Keyed on `sent` rather than on the number itself, so a resend restarts the
   * clock (a new object) and a re-render does not.
   */
  useEffect(() => {
    if (!sent) {
      setResendIn(0);
      return;
    }

    setResendIn(sent.resendInSeconds);

    const timer = setInterval(() => {
      setResendIn(seconds => (seconds <= 1 ? 0 : seconds - 1));
    }, 1000);

    return () => clearInterval(timer);
  }, [sent]);

  const reset = useCallback(() => {
    setSent(undefined);
    setError(undefined);
    setNotRegistered(false);
  }, []);

  const send = useCallback(async (identifier: LoginIdentifier) => {
    setSending(true);
    setError(undefined);
    setNotRegistered(false);

    try {
      setSent(await requestLoginOtp(identifier));
    } catch (caught) {
      const failure = caught instanceof ApiError ? caught : undefined;

      /**
       * A cooldown is not really a failure: a code *was* sent, and it is
       * probably sitting in the user's messages already. Refusing to open the
       * code card would strand someone who reopened the app mid-flow with a
       * perfectly good code they cannot type in. So the card is opened anyway,
       * with the server's own remaining wait on the resend link.
       */
      if (failure?.code === 'otp_cooldown') {
        setSent({
          channel: identifier.channel,
          destination:
            identifier.channel === 'phone' ? identifier.phone : identifier.email,
          expiresInSeconds: 0,
          resendInSeconds: failure.retryAfterSeconds ?? 30,
        });
      }

      setNotRegistered(failure?.code === 'account_not_found');
      setError(failure?.message ?? 'Something went wrong. Please try again.');
    } finally {
      setSending(false);
    }
  }, []);

  const verify = useCallback(
    async (identifier: LoginIdentifier, code: string) => {
      setVerifying(true);
      setError(undefined);

      try {
        const session = await verifyLoginOtp(identifier, code);
        onSignedIn?.(session);
      } catch (caught) {
        const failure = caught instanceof ApiError ? caught : undefined;
        /**
         * The per-field message is the specific one ("Expired.", "Incorrect
         * code.") and the top-level one says what to do about it, so the
         * sentence is the more useful of the two to print.
         */
        setError(failure?.message ?? 'Something went wrong. Please try again.');
      } finally {
        setVerifying(false);
      }
    },
    [onSignedIn],
  );

  return { sent, sending, verifying, error, notRegistered, resendIn, send, verify, reset };
}
