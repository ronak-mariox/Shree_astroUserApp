/**
 * "Busy for about N min" — how a consultant's availability reads on every
 * screen that lists them.
 *
 * The number is the backend's estimate (GET /astrologers' `waitSeconds`, see
 * services/astrologer.service.js's estimatedWaitSecondsFor): a package
 * session's real remaining time, or a projection from how long that
 * astrologer's consultations usually last. It is an estimate, never a
 * promise — hence the "~" everywhere it is printed.
 */

export type Availability = { busy?: boolean; waitSeconds?: number };

/** Whole minutes to wait, rounded up; 0 when they are free. */
export const waitMinutes = ({ busy, waitSeconds }: Availability): number =>
  busy && waitSeconds && waitSeconds > 0 ? Math.max(1, Math.ceil(waitSeconds / 60)) : 0;

/** "Wait ~7 min" for a busy consultant, or undefined when they are free. */
export const waitLabel = (row: Availability, unit = 'min'): string | undefined => {
  const minutes = waitMinutes(row);
  return minutes ? `Wait ~${minutes} ${unit}` : undefined;
};

/** "busy for about 7 min" — the sentence the busy sheet reads. */
export const busyForLabel = (row: Availability): string | undefined => {
  const minutes = waitMinutes(row);
  return minutes ? `busy for about ${minutes} min` : undefined;
};
