/**
 * The signed-in user's own generated kundli, persisted on-device.
 *
 * Its only job is to stop "Generate Kundli" from calling POST /birth-profiles
 * more than once per birth per device — the backend is safe either way (a
 * repeat for the same birth reuses its cache and costs nothing), but skipping
 * the call entirely once we already have the id means the result screen goes
 * straight to a GET, no batch round-trip at all.
 *
 * Not a secret, but secureStore.ts is the only persistent storage already
 * wired natively in this app, so it's reused here rather than adding a
 * dependency (e.g. AsyncStorage) for one string.
 */

import { deleteSecret, readSecret, writeSecret } from './secureStore';

const KEY = 'kundli.profileId';

let current: string | null = null;
let restored = false;

/** The id as it stands, without touching storage. */
export const getKundliProfileId = () => current;
export const isKundliProfileRestored = () => restored;

/** Reads whatever the last session left behind. Called once, at startup, alongside restoreSession(). */
export async function restoreKundliProfileId(): Promise<string | null> {
  current = await readSecret(KEY);
  restored = true;
  return current;
}

export async function saveKundliProfileId(profileId: string): Promise<void> {
  current = profileId;
  await writeSecret(KEY, profileId);
}

/** Called on sign-out — a kundli belongs to one account, not to the device. */
export async function clearKundliProfileId(): Promise<void> {
  current = null;
  await deleteSecret(KEY);
}
