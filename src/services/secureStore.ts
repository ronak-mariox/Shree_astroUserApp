/**
 * The device keystore — where secrets go instead of into app storage.
 *
 * Auth tokens are bearer credentials: whoever holds one *is* the user until it
 * expires. AsyncStorage would keep them in a plain SQLite file that any process
 * with the app's uid can read, and that a rooted or jailbroken device hands
 * over wholesale. This puts them somewhere the OS defends instead:
 *
 *   iOS      the Keychain, encrypted by a key held in the Secure Enclave.
 *   Android  the Keystore — AES-GCM with a key generated inside hardware-backed
 *            storage where the device has it, and which never leaves.
 *
 * `AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY` is the accessibility that fits an auth
 * token. "After first unlock" so a token can still be refreshed while the phone
 * sits locked in a pocket; "this device only" so it is excluded from iCloud and
 * from encrypted backups, and a restored backup cannot resurrect a session onto
 * a different handset.
 *
 * `AES_GCM_NO_AUTH` on Android is the deliberate choice not to demand a
 * fingerprint on every read. Staying signed in between launches is the point;
 * prompting for biometrics to read the token would defeat it. Biometric
 * gating belongs on a specific action — a withdrawal — not on the session.
 */

import { NativeModules } from 'react-native';
import * as Keychain from 'react-native-keychain';

/**
 * Whether the native side is actually present.
 *
 * `react-native-keychain` ships native code, so installing the package is only
 * half of it — the app has to be rebuilt (`pod install` then a fresh
 * `run-ios` / `run-android`) before the module exists. Until then every call
 * below would throw on `undefined`, and a login screen would fail for a reason
 * that has nothing to do with logging in.
 *
 * So the module is detected rather than assumed, and its absence degrades to
 * memory instead of crashing: the app runs, sign-in works, and the session
 * simply does not survive a reload. It is loud about it, once.
 */
const hasKeystore = NativeModules.RNKeychainManager != null;

/** Survives nothing, but keeps a dev build usable before the native rebuild. */
const fallback = new Map<string, string>();
let warned = false;

function warnOnce() {
  if (warned) {
    return;
  }
  warned = true;
  console.warn(
    '[secureStore] The native keystore is not linked — secrets are being held ' +
      'in memory and will be lost on reload. Rebuild the app after installing ' +
      'react-native-keychain (cd ios && pod install, then run-ios/run-android).',
  );
}

/**
 * One keystore entry per key.
 *
 * Every entry is written under its own `service`, because the keystore holds
 * one credential per service — sharing one would mean each write clobbered the
 * last. The value rides in the password field; the key is repeated as the
 * username, which the API requires and nothing reads back.
 */
const serviceFor = (key: string) => `com.shreeastro.${key}`;

const writeOptions: Keychain.SetOptions = {
  accessible: Keychain.ACCESSIBLE.AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY,
  storage: Keychain.STORAGE_TYPE.AES_GCM_NO_AUTH,
};

/**
 * Reads a secret, or null when there is none.
 *
 * Never throws. A keystore read can fail for reasons that are not the caller's
 * business — a corrupted entry, a key invalidated by a changed device passcode
 * — and in every one of them the honest answer is the same as "nothing stored":
 * whatever was there cannot be used, so the user signs in again.
 */
export async function readSecret(key: string): Promise<string | null> {
  if (!hasKeystore) {
    warnOnce();
    return fallback.get(key) ?? null;
  }

  try {
    const entry = await Keychain.getGenericPassword({ service: serviceFor(key) });
    return entry ? entry.password : null;
  } catch (error) {
    console.warn(`[secureStore] Could not read "${key}":`, error);
    return null;
  }
}

/**
 * Writes a secret. Returns whether it was actually stored, so a caller that
 * needs the value to persist — the session — can tell that it will not.
 */
export async function writeSecret(key: string, value: string): Promise<boolean> {
  if (!hasKeystore) {
    warnOnce();
    fallback.set(key, value);
    return false;
  }

  try {
    return Boolean(
      await Keychain.setGenericPassword(key, value, {
        ...writeOptions,
        service: serviceFor(key),
      }),
    );
  } catch (error) {
    console.warn(`[secureStore] Could not write "${key}":`, error);
    return false;
  }
}

/**
 * Removes a secret.
 *
 * Signing out runs through here, so it must not be possible for a failure to
 * leave a live token on the device: a throw here would mean a "signed out" user
 * whose credentials are still in the keystore.
 */
export async function deleteSecret(key: string): Promise<void> {
  fallback.delete(key);

  if (!hasKeystore) {
    return;
  }

  try {
    await Keychain.resetGenericPassword({ service: serviceFor(key) });
  } catch (error) {
    console.warn(`[secureStore] Could not clear "${key}":`, error);
  }
}

/** True when secrets are actually being kept by the OS rather than in memory. */
export const isKeystoreAvailable = () => hasKeystore;
