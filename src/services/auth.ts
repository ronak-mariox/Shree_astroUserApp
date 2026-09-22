/**
 * Account creation and sign-in.
 *
 * Create Account is one registration split across two screens — Create Profile
 * (who you are, and your photo) then Birth Details (what a chart is cast from).
 * Nothing is sent until the second step is saved, so the account is opened once,
 * with everything in it.
 *
 * The request goes as multipart/form-data rather than JSON because it carries
 * the profile photo alongside the fields.
 */


import { client } from './client';
import { DUMMY_USER } from './dummyData';
import { USE_DUMMY_AUTH } from './dummyMode';
import { clearSession, getRefreshToken, saveSession } from './session';
import type { Gender } from '../components/GenderSelector';
import { digitsOf } from '../utils/validation';

/** The fixed code the OTP screen accepts while there is no SMS provider. */
const DUMMY_OTP_CODE = '123456';

/** The account every dummy sign-in lands on — kept in step with `dummyData.ts`. */
function dummyUser(phone?: string, email?: string): AuthUser {
  return {
    id: DUMMY_USER.id,
    name: DUMMY_USER.name,
    email: email ?? DUMMY_USER.email,
    phone: phone ?? DUMMY_USER.phone,
    gender: DUMMY_USER.gender,
    avatarUrl: DUMMY_USER.avatarUrl,
    profileComplete: true,
  };
}

/** A picked image, in the shape React Native's FormData expects. */
export type PhotoAsset = {
  uri: string;
  /** Defaults are filled in below when the picker does not supply them. */
  name?: string;
  type?: string;
};

/** Step one: who the user is. */
export type ProfileDraft = {
  fullName: string;
  email: string;
  phoneNumber: string;
  gender?: Gender;
};

/** Step two: when and where they were born. */
export type BirthDraft = {
  dateOfBirth: string;
  timeOfBirth: string;
  placeOfBirth: string;
};

/** Everything the two steps collected, ready to register. */
export type RegistrationDraft = {
  profile: ProfileDraft;
  birth: BirthDraft;
  photo?: PhotoAsset;
};

export type AuthUser = {
  id: string;
  name: string;
  email: string;
  phone: string;
  gender?: string;
  avatarUrl?: string;
  /**
   * Whether there is anything left to fill in. Always `true` after Register
   * (the wizard collects everything up front) or an OTP sign-in (which never
   * opens a new account — see loginWithApple/loginWithGoogle below). Can be
   * `false` right after a first-time Apple/Google sign-in, whose account is
   * opened with only what the provider handed over — no gender, no birth
   * details, sometimes no name. That is the app's cue to open Edit Profile
   * instead of Home; see `afterSignIn` in App.tsx.
   */
  profileComplete: boolean;
};

export type AuthSession = {
  /** Short-lived; sent as `Authorization: Bearer` on every later request. */
  accessToken: string;
  /** Long-lived; buys a new access token from POST /auth/refresh. */
  refreshToken: string;
  user: AuthUser;
};

/**
 * Which identifier is being signed in with.
 *
 * A union rather than two optional fields, so the wrong pairing — channel
 * 'email' carrying a phone number — cannot be written in the first place.
 */
export type LoginIdentifier =
  | { channel: 'phone'; phone: string }
  | { channel: 'email'; email: string };

/** What comes back from asking for a code — enough to run the resend timer. */
export type OtpRequest = {
  channel: 'phone' | 'email';
  /** Masked for display: "••••••3210", "ro•••@example.com". */
  destination: string;
  expiresInSeconds: number;
  /** Seconds until "Resend" will be accepted. */
  resendInSeconds: number;
  /**
   * The code itself, returned only while the server has no SMS or mail
   * provider wired up. Never present in production — do not build on it.
   */
  devCode?: string;
};

/**
 * Strips a typed number down to the ten digits the API wants, dropping a
 * leading country code — "+91 98765 43210" and "9876543210" both send the same.
 */
function localPhoneOf(value: string): string {
  const digits = digitsOf(value);
  return digits.length === 12 && digits.startsWith('91') ? digits.slice(2) : digits;
}

/** "…/photo.heic" → "photo.heic", so the upload keeps a sensible filename. */
function fileNameOf(photo: PhotoAsset): string {
  if (photo.name) {
    return photo.name;
  }
  const last = photo.uri.split('/').pop();
  return last && last.includes('.') ? last : 'profile.jpg';
}

/**
 * Builds the multipart body.
 *
 * Kept separate from the request so the field names are readable in one place —
 * and so a new step in the wizard is one more `append` here.
 */
export function buildRegistrationForm(draft: RegistrationDraft): FormData {
  const { profile, birth, photo } = draft;
  const form = new FormData();

  form.append('fullName', profile.fullName.trim());
  form.append('email', profile.email.trim().toLowerCase());
  form.append('phone', localPhoneOf(profile.phoneNumber));
  if (profile.gender) {
    form.append('gender', profile.gender);
  }

  form.append('dateOfBirth', birth.dateOfBirth.trim());
  form.append('timeOfBirth', birth.timeOfBirth.trim());
  form.append('placeOfBirth', birth.placeOfBirth.trim());

  if (photo) {
    /**
     * React Native takes a `{ uri, name, type }` object here and streams the
     * file itself; this is not a browser File and has no web equivalent, hence
     * the cast.
     */
    form.append('photo', {
      uri: photo.uri,
      name: fileNameOf(photo),
      type: photo.type || 'image/jpeg',
    } as unknown as Blob);
  }

  return form;
}

/**
 * Opens the account and signs the user in.
 *
 * The session that comes back is stored straight away, so everything after this
 * is authenticated — and stays that way across a restart.
 */
export async function register(draft: RegistrationDraft): Promise<AuthSession> {
  if (USE_DUMMY_AUTH) {
    const session: AuthSession = {
      accessToken: 'dummy-access-token',
      refreshToken: 'dummy-refresh-token',
      user: {
        ...dummyUser(localPhoneOf(draft.profile.phoneNumber), draft.profile.email),
        name: draft.profile.fullName.trim() || DUMMY_USER.name,
        gender: draft.profile.gender ?? DUMMY_USER.gender,
      },
    };
    await saveSession(session);
    return session;
  }

  const { data } = await client.post<AuthSession>(
    '/auth/register',
    buildRegistrationForm(draft),
  );

  await saveSession(data);
  return data;
}

/**
 * Signing in.
 *
 * Two screens, one flow. OtpLoginScreen sends a mobile number and
 * EmailLoginScreen sends an address, but both then ask for the same six digits,
 * so both go through the same pair of calls with `channel` saying which.
 *
 * Sign-in never creates an account: an unregistered identifier comes back as a
 * 404 with `account_not_found`, which is the screen's cue to offer Register.
 */

/**
 * Step one: ask for the code.
 *
 * Resolves once the server has sent it. Anything else throws an ApiError the
 * screen can print — including a 429 while a previous code is still inside its
 * resend cooldown.
 */
export async function requestLoginOtp(
  identifier: LoginIdentifier,
): Promise<OtpRequest> {
  if (USE_DUMMY_AUTH) {
    const destination =
      identifier.channel === 'phone'
        ? `••••••${identifier.phone.slice(-4)}`
        : identifier.email.replace(/^(.{2}).*(@.*)$/, '$1•••$2');
    return {
      channel: identifier.channel,
      destination,
      expiresInSeconds: 300,
      resendInSeconds: 30,
      devCode: DUMMY_OTP_CODE,
    };
  }

  const { data } = await client.post<OtpRequest>(
    '/auth/login/otp/request',
    identifier,
  );

  return data;
}

/**
 * Step two: hand back the code and get the session.
 *
 * The identifier must be the same one the code was sent to. As with register,
 * the access token is put on the client here, so everything after this call is
 * authenticated.
 */
export async function verifyLoginOtp(
  identifier: LoginIdentifier,
  code: string,
): Promise<AuthSession> {
  if (USE_DUMMY_AUTH) {
    const session: AuthSession = {
      accessToken: 'dummy-access-token',
      refreshToken: 'dummy-refresh-token',
      user: dummyUser(
        identifier.channel === 'phone' ? identifier.phone : undefined,
        identifier.channel === 'email' ? identifier.email : undefined,
      ),
    };
    await saveSession(session);
    return session;
  }

  const { data } = await client.post<AuthSession>('/auth/login/otp/verify', {
    ...identifier,
    code: digitsOf(code),
  });

  await saveSession(data);
  return data;
}

/**
 * "Continue with Apple" / "Continue with Google".
 *
 * Unlike the two functions above, these open an account on the spot for
 * someone signing in for the first time — the backend does not answer
 * `account_not_found` the way OTP login does, since the provider's token
 * already vouches for a real identity (see `createSocialAccount` in
 * services/auth.service.js on the backend). `fullName` only ever matters the
 * one time that happens, and only for Apple: it hands the client the user's
 * name once, on the very first authorization, as a separate value alongside
 * the token rather than inside it. Every other call can simply omit it.
 *
 * There is no `USE_DUMMY_AUTH` branch here — nothing calls these yet, since
 * neither native SDK is wired into the app (see SocialAuthButtons /
 * ComingSoonScreen). They exist so that wiring one in later is exactly one
 * native call plus one of these, not a rewrite: whichever button starts
 * working can call this and hand the result straight to `afterSignIn`.
 */
export async function loginWithApple(
  identityToken: string,
  fullName?: string,
): Promise<AuthSession> {
  const { data } = await client.post<AuthSession>('/auth/apple', {
    identityToken,
    fullName,
  });
  await saveSession(data);
  return data;
}

export async function loginWithGoogle(
  idToken: string,
  fullName?: string,
): Promise<AuthSession> {
  const { data } = await client.post<AuthSession>('/auth/google', {
    idToken,
    fullName,
  });
  await saveSession(data);
  return data;
}

/** The number as the API wants it: ten digits, no dial code, no spacing. */
export const loginPhoneOf = localPhoneOf;

/**
 * Ends the session this device is holding.
 *
 * POST /auth/logout is told first, refresh token and all, so the server can
 * revoke it — a copy left on a compromised device should not go on working
 * for the refresh token's full 30-day life just because this device signed
 * out. But the sign-out itself is the local wipe, which happens whether or
 * not that call succeeds or the server is even reachable: a user who taps
 * "Log out" on a plane is signed out.
 */
export async function signOut(): Promise<void> {
  if (!USE_DUMMY_AUTH) {
    try {
      await client.post('/auth/logout', { refreshToken: getRefreshToken() });
    } catch {
      /** Nothing here is worth keeping the user signed in for. */
    }
  }
  await clearSession();
}
