/**
 * Field validators shared by every form in the app.
 *
 * Each one returns the message to print under the field, or `undefined` when
 * the value is good — so a form's errors are just a map of field → message, and
 * "is this submittable?" is "are there no messages?".
 *
 * The rules mirror what the backend accepts (backend/validators/*.js and the
 * models behind them), so the app neither lets through what the server would
 * refuse nor blocks what it would take. Where the two differ, the note on the
 * rule says why.
 */

export type FieldError = string | undefined;

/* -------------------------------------------------------------------------- */
/* Limits                                                                     */
/* -------------------------------------------------------------------------- */

/** Indian mobile numbers: ten digits starting 6–9 (auth.validator.js's PHONE_PATTERN). */
export const MOBILE_DIGITS = 10;
export const NAME_MIN_LENGTH = 2;
/** The server stores up to 80 (User.name); 50 is the product's own cap for a person's name. */
export const NAME_MAX_LENGTH = 50;
/** RFC 5321's limit on a whole address. */
export const EMAIL_MAX_LENGTH = 254;
const EMAIL_LOCAL_MAX_LENGTH = 64;
/** GET /places/search's own cap on a query (kundli.validator.js). */
export const PLACE_MAX_LENGTH = 100;
/** The earliest year a date of birth may carry. */
export const MIN_BIRTH_YEAR = 1900;
/** A chat message's text (Message content.text maxlength in models/Chat.js) — the AI chat uses the same model. */
export const MESSAGE_MAX_LENGTH = 5000;
/** Coupon and referral codes: 3–20 letters and digits (growth.validator.js / commerce.validator.js). */
export const CODE_MIN_LENGTH = 3;
export const CODE_MAX_LENGTH = 20;
/** A search box never needs more than this. */
export const SEARCH_MAX_LENGTH = 100;

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

/**
 * Letters in any script — `\p{M}` is what lets Devanagari's vowel signs and
 * virama through ("अर्जुन") — plus spaces, dots, apostrophes and hyphens, and
 * starting with a letter. No digits, no emoji.
 */
const NAME_PATTERN = /^\p{L}[\p{L}\p{M}\s.'-]*$/u;
/**
 * Close to express-validator's `isEmail()`: a dotted local part of the usual
 * characters, a domain of dot-separated labels, and a 2+ letter TLD.
 */
const EMAIL_PATTERN =
  /^[A-Za-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[A-Za-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[A-Za-z0-9](?:[A-Za-z0-9-]*[A-Za-z0-9])?\.)+[A-Za-z]{2,}$/;
/** DD/MM/YYYY (or dashes), as Birth Details and Edit Profile store it. */
const NUMERIC_DATE_PATTERN = /^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/;
/** "15 August 1999" / "15 Aug 1999", as the chat intake prints it — the server parses both shapes. */
const WORDED_DATE_PATTERN = /^(\d{1,2})\s+([A-Za-z]+)\s+(\d{4})$/;
const WORDED_MONTHS = [
  'january', 'february', 'march', 'april', 'may', 'june',
  'july', 'august', 'september', 'october', 'november', 'december',
];
const TIME_12H_PATTERN = /^(\d{1,2})\s*:\s*(\d{2})\s*([APap][Mm])$/;
const TIME_24H_PATTERN = /^(\d{1,2})\s*:\s*(\d{2})$/;
const CODE_PATTERN = /^[A-Z0-9]+$/;

/* -------------------------------------------------------------------------- */
/* Input sanitisers — what a field keeps of a keystroke or a paste             */
/* -------------------------------------------------------------------------- */

/** Digits only — how a phone number is compared, whatever spacing it carries. */
export const digitsOf = (value: string) => value.replace(/\D/g, '');

/** Trimmed, with every run of whitespace inside collapsed to one space. */
export const normaliseName = (value: string) => value.trim().replace(/\s+/g, ' ');

/** Trimmed and lowercased — how the server stores an address. */
export const normaliseEmail = (value: string) => value.trim().toLowerCase();

/**
 * A typed or pasted Indian mobile number → at most its ten local digits.
 * "+91 98765 43210", "09876543210" and "98765-43210" all become "9876543210";
 * keystrokes past the tenth digit are dropped.
 */
export function sanitizePhoneInput(value: string): string {
  let digits = digitsOf(value);
  // Only a whole pasted number is unwrapped — an eleventh digit typed onto a
  // number that happens to start 91 is just one too many, not a country code.
  if (digits.length >= MOBILE_DIGITS + 2 && digits.startsWith('91')) {
    digits = digits.slice(2);
  } else if (digits.length >= MOBILE_DIGITS + 1 && digits.startsWith('0')) {
    digits = digits.replace(/^0+/, '');
  }
  return digits.slice(0, MOBILE_DIGITS);
}

/**
 * A typed or pasted amount → whole rupees as digits, without leading zeros,
 * no longer than `maxDigits`. "₹1,500" → "1500", "007" → "7", "0" → "".
 */
export function sanitizeAmountInput(value: string, maxDigits = 7): string {
  return digitsOf(value).replace(/^0+/, '').slice(0, maxDigits);
}

/* -------------------------------------------------------------------------- */
/* Validators                                                                 */
/* -------------------------------------------------------------------------- */

export function validateRequired(value: string, label: string): FieldError {
  return value.trim().length === 0 ? `${label} is required` : undefined;
}

/** Required, 2–50 characters of letters (any script), spaces, `.`, `'` and `-`. */
export function validateName(value: string, label = 'Full name'): FieldError {
  const name = normaliseName(value);
  if (name.length === 0) {
    return `${label} is required`;
  }
  if (name.length < NAME_MIN_LENGTH) {
    return `${label} must be at least ${NAME_MIN_LENGTH} characters`;
  }
  if (name.length > NAME_MAX_LENGTH) {
    return `${label} must be ${NAME_MAX_LENGTH} characters or fewer`;
  }
  if (!NAME_PATTERN.test(name)) {
    return `${label} can only contain letters`;
  }
  return undefined;
}

/**
 * Trimmed, ≤ 254 characters, a real-looking address. `required: false` lets an
 * empty value through, for a screen where the address is optional.
 */
export function validateEmail(
  value: string,
  { required = true }: { required?: boolean } = {},
): FieldError {
  const email = value.trim();
  if (email.length === 0) {
    return required ? 'Email address is required' : undefined;
  }
  if (email.length > EMAIL_MAX_LENGTH) {
    return `Email address must be ${EMAIL_MAX_LENGTH} characters or fewer`;
  }
  const local = email.slice(0, email.lastIndexOf('@'));
  if (!EMAIL_PATTERN.test(email) || local.length > EMAIL_LOCAL_MAX_LENGTH) {
    return 'Enter a valid email address';
  }
  return undefined;
}

export function validatePhone(value: string): FieldError {
  const digits = digitsOf(value);
  if (digits.length === 0) {
    return 'Phone number is required';
  }
  // A leading 91 is the country code and a leading 0 the trunk prefix — neither is part of the number itself.
  const local =
    digits.length === 12 && digits.startsWith('91')
      ? digits.slice(2)
      : digits.length === 11 && digits.startsWith('0')
        ? digits.slice(1)
        : digits;
  if (local.length !== MOBILE_DIGITS) {
    return `Enter a ${MOBILE_DIGITS}-digit mobile number`;
  }
  if (!/^[6-9]/.test(local)) {
    return 'Mobile numbers start with 6, 7, 8 or 9';
  }
  return undefined;
}

/** Day, month and year out of either date shape this app prints, or undefined. */
function partsOfDate(value: string) {
  const numeric = NUMERIC_DATE_PATTERN.exec(value);
  if (numeric) {
    return { day: Number(numeric[1]), month: Number(numeric[2]), year: Number(numeric[3]) };
  }
  const worded = WORDED_DATE_PATTERN.exec(value);
  if (worded) {
    // "Aug", "Sept" or "August" — a month name or a 3+ letter start of one.
    const word = worded[2].toLowerCase();
    const month =
      word.length >= 3 ? WORDED_MONTHS.findIndex(name => name.startsWith(word)) + 1 : 0;
    if (month > 0) {
      return { day: Number(worded[1]), month, year: Number(worded[3]) };
    }
  }
  return undefined;
}

/**
 * Accepts DD/MM/YYYY (or dashes) and "15 August 1999", and rejects impossible
 * dates (31/02, 29/02 outside a leap year), future dates and anything before
 * 1900. The backend sets no age limit, so neither does this.
 */
export function validateDateOfBirth(value: string): FieldError {
  const date = value.trim();
  if (date.length === 0) {
    return 'Date of birth is required';
  }

  const parts = partsOfDate(date);
  if (!parts) {
    return 'Use the format DD/MM/YYYY';
  }
  const { day, month, year } = parts;

  if (month < 1 || month > 12) {
    return 'Month must be between 1 and 12';
  }

  const daysInMonth = new Date(year, month, 0).getDate();
  if (day < 1 || day > daysInMonth) {
    return `${month}/${year} has ${daysInMonth} days`;
  }

  if (year < MIN_BIRTH_YEAR) {
    return `Year of birth must be ${MIN_BIRTH_YEAR} or later`;
  }
  if (new Date(year, month - 1, day).getTime() > Date.now()) {
    return 'Date of birth cannot be in the future';
  }

  return undefined;
}

/** Accepts "06:30 AM", "06 : 30 AM" and "18:30" alike — all of which the server parses. */
export function validateTimeOfBirth(value: string): FieldError {
  const time = value.trim();
  if (time.length === 0) {
    return 'Time of birth is required';
  }

  const twelveHour = TIME_12H_PATTERN.exec(time);
  if (twelveHour) {
    const hour = Number(twelveHour[1]);
    const minute = Number(twelveHour[2]);
    if (hour < 1 || hour > 12) {
      return 'Hour must be between 1 and 12';
    }
    if (minute > 59) {
      return 'Minutes must be between 00 and 59';
    }
    return undefined;
  }

  const twentyFourHour = TIME_24H_PATTERN.exec(time);
  if (twentyFourHour) {
    const hour = Number(twentyFourHour[1]);
    const minute = Number(twentyFourHour[2]);
    if (hour > 23) {
      return 'Hour must be between 00 and 23';
    }
    if (minute > 59) {
      return 'Minutes must be between 00 and 59';
    }
    return undefined;
  }

  return 'Use the format HH:MM AM/PM';
}

/**
 * A typed place: required, 2–100 characters. Where a screen geocodes through
 * the place search, pass `selected` — whether the text on screen is one the
 * search returned — and a merely typed place is refused.
 */
export function validatePlace(
  value: string,
  label = 'Place of birth',
  { selected }: { selected?: boolean } = {},
): FieldError {
  const place = value.trim();
  if (place.length === 0) {
    return `${label} is required`;
  }
  if (place.length < 2) {
    return `${label} must be at least 2 characters`;
  }
  if (place.length > PLACE_MAX_LENGTH) {
    return `${label} must be ${PLACE_MAX_LENGTH} characters or fewer`;
  }
  if (selected === false) {
    return 'Select your birth place from the list';
  }
  return undefined;
}

/** Whole rupees within the server's `minRecharge`…`maxRecharge`. */
export function validateAmount(
  value: number,
  { min, max }: { min: number; max: number },
): FieldError {
  if (!Number.isFinite(value) || value <= 0) {
    return 'Enter an amount to add';
  }
  if (!Number.isInteger(value)) {
    return 'Enter a whole number of rupees';
  }
  if (value < min) {
    return `Minimum top-up is ₹${min}`;
  }
  if (value > max) {
    return `Maximum top-up is ₹${max.toLocaleString('en-IN')}`;
  }
  return undefined;
}

/** A one-time code: exactly `length` digits. */
export function validateCode(value: string, length: number): FieldError {
  const code = value.replace(/\s/g, '');
  if (code.length === 0) {
    return 'Enter the code you received';
  }
  if (!/^\d+$/.test(code) || code.length !== length) {
    return `The code is ${length} digits`;
  }
  return undefined;
}

/** An optional coupon or referral code: empty, or 3–20 letters and digits. */
export function validateCouponCode(value: string, label = 'Code'): FieldError {
  const code = value.trim().toUpperCase();
  if (code.length === 0) {
    return undefined;
  }
  if (!CODE_PATTERN.test(code)) {
    return `${label} can only contain letters and digits`;
  }
  if (code.length < CODE_MIN_LENGTH || code.length > CODE_MAX_LENGTH) {
    return `${label} is ${CODE_MIN_LENGTH}–${CODE_MAX_LENGTH} characters`;
  }
  return undefined;
}

/** True when a message composer has something to send: non-blank, within the limit. */
export const canSendMessage = (value: string, max = MESSAGE_MAX_LENGTH) => {
  const text = value.trim();
  return text.length > 0 && text.length <= max;
};

/** True when nothing in the form has a message against it. */
export const isFormValid = (errors: Record<string, FieldError>) =>
  Object.values(errors).every(error => error === undefined);

/** The first field, in the form's own order, that has a message against it. */
export const firstInvalidField = <F extends string>(
  errors: Record<F, FieldError>,
): F | undefined =>
  (Object.keys(errors) as F[]).find(field => errors[field] !== undefined);

/**
 * The backend's 422 `{ error, fields: { … } }` → this form's own field names.
 * `rename` maps a server path to the screen's key ("placeOfBirth" → "birthPlace");
 * server fields the form does not show are dropped (the screen prints the
 * top-level message for those).
 */
export function serverFieldErrors<F extends string>(
  error: unknown,
  formFields: readonly F[],
  rename: Partial<Record<string, F>> = {},
): Partial<Record<F, string>> {
  const fields = (error as { fields?: Record<string, unknown> } | null)?.fields;
  if (!fields || typeof fields !== 'object') {
    return {};
  }
  const mapped: Partial<Record<F, string>> = {};
  for (const [path, message] of Object.entries(fields)) {
    const field = rename[path] ?? (path as F);
    if (formFields.includes(field) && typeof message === 'string') {
      mapped[field] = message;
    }
  }
  return mapped;
}
