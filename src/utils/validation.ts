/**
 * Field validators shared by every form in the app.
 *
 * Each one returns the message to print under the field, or `undefined` when
 * the value is good — so a form's errors are just a map of field → message, and
 * "is this submittable?" is "are there no messages?".
 */

export type FieldError = string | undefined;

/** Indian mobile numbers: ten digits starting 6–9, however they were typed. */
const MOBILE_DIGITS = 10;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const NAME_PATTERN = /^[\p{L}][\p{L}\s.'-]*$/u;
const DATE_PATTERN = /^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/;
const TIME_12H_PATTERN = /^(\d{1,2})\s*:\s*(\d{2})\s*([APap][Mm])$/;
const TIME_24H_PATTERN = /^(\d{1,2})\s*:\s*(\d{2})$/;

/** Digits only — how a phone number is compared, whatever spacing it carries. */
export const digitsOf = (value: string) => value.replace(/\D/g, '');

export function validateRequired(value: string, label: string): FieldError {
  return value.trim().length === 0 ? `${label} is required` : undefined;
}

export function validateName(value: string, label = 'Full name'): FieldError {
  const name = value.trim();
  if (name.length === 0) {
    return `${label} is required`;
  }
  if (name.length < 2) {
    return `${label} must be at least 2 characters`;
  }
  if (!NAME_PATTERN.test(name)) {
    return `${label} can only contain letters`;
  }
  return undefined;
}

export function validateEmail(value: string): FieldError {
  const email = value.trim();
  if (email.length === 0) {
    return 'Email address is required';
  }
  if (!EMAIL_PATTERN.test(email)) {
    return 'Enter a valid email address';
  }
  return undefined;
}

export function validatePhone(value: string): FieldError {
  const digits = digitsOf(value);
  if (digits.length === 0) {
    return 'Phone number is required';
  }
  // A leading 91 is the country code, not part of the number itself.
  const local =
    digits.length === 12 && digits.startsWith('91') ? digits.slice(2) : digits;
  if (local.length !== MOBILE_DIGITS) {
    return `Enter a ${MOBILE_DIGITS}-digit mobile number`;
  }
  if (!/^[6-9]/.test(local)) {
    return 'Mobile numbers start with 6, 7, 8 or 9';
  }
  return undefined;
}

/** Accepts DD/MM/YYYY (or dashes) and rejects impossible or future dates. */
export function validateDateOfBirth(value: string): FieldError {
  const date = value.trim();
  if (date.length === 0) {
    return 'Date of birth is required';
  }

  const parts = DATE_PATTERN.exec(date);
  if (!parts) {
    return 'Use the format DD/MM/YYYY';
  }

  const day = Number(parts[1]);
  const month = Number(parts[2]);
  const year = Number(parts[3]);

  if (month < 1 || month > 12) {
    return 'Month must be between 1 and 12';
  }

  const daysInMonth = new Date(year, month, 0).getDate();
  if (day < 1 || day > daysInMonth) {
    return `${month}/${year} has ${daysInMonth} days`;
  }

  const today = new Date();
  if (new Date(year, month - 1, day).getTime() > today.getTime()) {
    return 'Date of birth cannot be in the future';
  }
  if (year < today.getFullYear() - 120) {
    return 'Enter a valid year of birth';
  }

  return undefined;
}

/** Accepts "06:30 AM" and "18:30" alike — both are how people type a time. */
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

export function validatePlace(
  value: string,
  label = 'Place of birth',
): FieldError {
  const place = value.trim();
  if (place.length === 0) {
    return `${label} is required`;
  }
  if (place.length < 2) {
    return `${label} must be at least 2 characters`;
  }
  return undefined;
}

export function validateAmount(
  value: number,
  { min, max }: { min: number; max: number },
): FieldError {
  if (!Number.isFinite(value) || value <= 0) {
    return 'Enter an amount to add';
  }
  if (value < min) {
    return `Minimum top-up is ₹${min}`;
  }
  if (value > max) {
    return `Maximum top-up is ₹${max.toLocaleString('en-IN')}`;
  }
  return undefined;
}

export function validateCode(value: string, length: number): FieldError {
  const digits = digitsOf(value);
  if (digits.length === 0) {
    return 'Enter the code you received';
  }
  if (digits.length !== length) {
    return `The code is ${length} digits`;
  }
  return undefined;
}

/** True when nothing in the form has a message against it. */
export const isFormValid = (errors: Record<string, FieldError>) =>
  Object.values(errors).every(error => error === undefined);
