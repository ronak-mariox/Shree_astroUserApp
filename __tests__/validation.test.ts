/**
 * The field rules every form shares (src/utils/validation.ts), checked against
 * the edges the backend's own validators draw.
 */

import {
  EMAIL_MAX_LENGTH,
  MESSAGE_MAX_LENGTH,
  NAME_MAX_LENGTH,
  PLACE_MAX_LENGTH,
  canSendMessage,
  digitsOf,
  firstInvalidField,
  isFormValid,
  normaliseEmail,
  normaliseName,
  sanitizeAmountInput,
  sanitizePhoneInput,
  serverFieldErrors,
  validateAmount,
  validateCode,
  validateCouponCode,
  validateDateOfBirth,
  validateEmail,
  validateName,
  validatePhone,
  validatePlace,
  validateRequired,
  validateTimeOfBirth,
} from '../src/utils/validation';

describe('validateRequired', () => {
  it('refuses blank and whitespace-only values', () => {
    expect(validateRequired('', 'Topic')).toBe('Topic is required');
    expect(validateRequired('   ', 'Topic')).toBe('Topic is required');
    expect(validateRequired('Career', 'Topic')).toBeUndefined();
  });
});

describe('validateName', () => {
  it('accepts names in Latin and Devanagari, with dots, apostrophes and hyphens', () => {
    expect(validateName('Arjun Sharma')).toBeUndefined();
    expect(validateName('अर्जुन शर्मा')).toBeUndefined();
    expect(validateName('प्रियंका')).toBeUndefined();
    expect(validateName("Dr. A. D'Souza-Rao")).toBeUndefined();
    expect(validateName('  Arjun   Sharma  ')).toBeUndefined();
  });

  it('refuses blank, too short and too long names', () => {
    expect(validateName('')).toBe('Full name is required');
    expect(validateName('   ')).toBe('Full name is required');
    expect(validateName('A')).toBe('Full name must be at least 2 characters');
    expect(validateName('A'.repeat(NAME_MAX_LENGTH))).toBeUndefined();
    expect(validateName('A'.repeat(NAME_MAX_LENGTH + 1))).toBe(
      `Full name must be ${NAME_MAX_LENGTH} characters or fewer`,
    );
  });

  it('refuses digits, emoji and symbols, and a name that starts with punctuation', () => {
    expect(validateName('Arjun2')).toBe('Full name can only contain letters');
    expect(validateName('Arjun 😀')).toBe('Full name can only contain letters');
    expect(validateName('Arjun@Sharma')).toBe('Full name can only contain letters');
    expect(validateName('.Arjun')).toBe('Full name can only contain letters');
  });

  it('uses the label it is given', () => {
    expect(validateName('', 'Name')).toBe('Name is required');
  });

  it('normaliseName trims and collapses inner whitespace', () => {
    expect(normaliseName('  Arjun \t  Kumar   Sharma ')).toBe('Arjun Kumar Sharma');
  });
});

describe('validateEmail', () => {
  it('accepts well-formed addresses, surrounding spaces and all', () => {
    expect(validateEmail('arjun@example.com')).toBeUndefined();
    expect(validateEmail('  arjun.sharma+astro@mail.example.co.in ')).toBeUndefined();
  });

  it('refuses malformed addresses', () => {
    for (const bad of ['arjun', 'arjun@', '@example.com', 'arjun@@example.com', 'arjun@example', 'arjun@example.c', 'ar jun@example.com', 'arjun..s@example.com', '.arjun@example.com', 'arjun@-example.com']) {
      expect(validateEmail(bad)).toBe('Enter a valid email address');
    }
  });

  it('caps the address at 254 characters', () => {
    const long = `${'a'.repeat(60)}@${'b'.repeat(200)}.com`;
    expect(long.length).toBeGreaterThan(EMAIL_MAX_LENGTH);
    expect(validateEmail(long)).toBe(`Email address must be ${EMAIL_MAX_LENGTH} characters or fewer`);
  });

  it('is required unless the screen says otherwise', () => {
    expect(validateEmail('')).toBe('Email address is required');
    expect(validateEmail('', { required: false })).toBeUndefined();
    expect(validateEmail('nope', { required: false })).toBe('Enter a valid email address');
  });

  it('normaliseEmail trims and lowercases', () => {
    expect(normaliseEmail('  Arjun@Example.COM ')).toBe('arjun@example.com');
  });
});

describe('validatePhone and sanitizePhoneInput', () => {
  it('accepts a ten-digit number starting 6–9, however it is spaced or prefixed', () => {
    expect(validatePhone('9876543210')).toBeUndefined();
    expect(validatePhone('6000000000')).toBeUndefined();
    expect(validatePhone('98765 43210')).toBeUndefined();
    expect(validatePhone('+91 98765 43210')).toBeUndefined();
    expect(validatePhone('919876543210')).toBeUndefined();
    expect(validatePhone('09876543210')).toBeUndefined();
  });

  it('refuses wrong lengths and numbers that cannot be Indian mobiles', () => {
    expect(validatePhone('')).toBe('Phone number is required');
    expect(validatePhone('12345')).toBe('Enter a 10-digit mobile number');
    expect(validatePhone('98765432101')).toBe('Enter a 10-digit mobile number');
    expect(validatePhone('5876543210')).toBe('Mobile numbers start with 6, 7, 8 or 9');
    expect(validatePhone('0123456789')).toBe('Mobile numbers start with 6, 7, 8 or 9');
  });

  it('sanitizePhoneInput keeps only the ten local digits of a paste', () => {
    expect(sanitizePhoneInput('+91 98765 43210')).toBe('9876543210');
    expect(sanitizePhoneInput('+91-98765-43210')).toBe('9876543210');
    expect(sanitizePhoneInput('919876543210')).toBe('9876543210');
    expect(sanitizePhoneInput('098765 43210')).toBe('9876543210');
    expect(sanitizePhoneInput('98765 43210')).toBe('9876543210');
  });

  it('sanitizePhoneInput caps typing at ten digits without mistaking a 91… number for a country code', () => {
    expect(sanitizePhoneInput('98765')).toBe('98765');
    expect(sanitizePhoneInput('98765432109')).toBe('9876543210');
    // A real number that starts 91, with one digit too many typed after it.
    expect(sanitizePhoneInput('91234567890')).toBe('9123456789');
    expect(sanitizePhoneInput('abc')).toBe('');
  });

  it('digitsOf drops everything that is not a digit', () => {
    expect(digitsOf('+91 (987) 654-3210')).toBe('919876543210');
  });
});

describe('validateDateOfBirth', () => {
  it('accepts real dates in both shapes the app prints', () => {
    expect(validateDateOfBirth('15/08/1999')).toBeUndefined();
    expect(validateDateOfBirth('15-08-1999')).toBeUndefined();
    expect(validateDateOfBirth('15 August 1999')).toBeUndefined();
    expect(validateDateOfBirth('08 Feb 1999')).toBeUndefined();
  });

  it('knows Feb 29 only exists in a leap year', () => {
    expect(validateDateOfBirth('29/02/2000')).toBeUndefined();
    expect(validateDateOfBirth('29/02/1996')).toBeUndefined();
    expect(validateDateOfBirth('29/02/1999')).toBe('2/1999 has 28 days');
    expect(validateDateOfBirth('29/02/1900')).toBe('2/1900 has 28 days');
    expect(validateDateOfBirth('29 February 2001')).toBe('2/2001 has 28 days');
  });

  it('refuses impossible days and months', () => {
    expect(validateDateOfBirth('31/04/1999')).toBe('4/1999 has 30 days');
    expect(validateDateOfBirth('00/01/1999')).toBe('1/1999 has 31 days');
    expect(validateDateOfBirth('10/13/1999')).toBe('Month must be between 1 and 12');
  });

  it('refuses the future and anything before 1900', () => {
    const nextYear = new Date().getFullYear() + 1;
    expect(validateDateOfBirth(`01/01/${nextYear}`)).toBe('Date of birth cannot be in the future');
    const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);
    const pad = (n: number) => String(n).padStart(2, '0');
    expect(
      validateDateOfBirth(`${pad(tomorrow.getDate())}/${pad(tomorrow.getMonth() + 1)}/${tomorrow.getFullYear()}`),
    ).toBe('Date of birth cannot be in the future');
    const today = new Date();
    expect(
      validateDateOfBirth(`${pad(today.getDate())}/${pad(today.getMonth() + 1)}/${today.getFullYear()}`),
    ).toBeUndefined();
    expect(validateDateOfBirth('31/12/1899')).toBe('Year of birth must be 1900 or later');
    expect(validateDateOfBirth('01/01/1900')).toBeUndefined();
  });

  it('refuses blanks and other shapes', () => {
    expect(validateDateOfBirth('')).toBe('Date of birth is required');
    expect(validateDateOfBirth('1999-08-15')).toBe('Use the format DD/MM/YYYY');
    expect(validateDateOfBirth('15 Augtober 1999')).toBe('Use the format DD/MM/YYYY');
    expect(validateDateOfBirth('15/8/99')).toBe('Use the format DD/MM/YYYY');
  });
});

describe('validateTimeOfBirth', () => {
  it('accepts 12-hour and 24-hour times, spaced as the wheels print them', () => {
    expect(validateTimeOfBirth('06:30 AM')).toBeUndefined();
    expect(validateTimeOfBirth('06 : 30 PM')).toBeUndefined();
    expect(validateTimeOfBirth('12:00 am')).toBeUndefined();
    expect(validateTimeOfBirth('18:30')).toBeUndefined();
    expect(validateTimeOfBirth('00:00')).toBeUndefined();
  });

  it('refuses impossible times and other shapes', () => {
    expect(validateTimeOfBirth('')).toBe('Time of birth is required');
    expect(validateTimeOfBirth('13:00 PM')).toBe('Hour must be between 1 and 12');
    expect(validateTimeOfBirth('00:30 AM')).toBe('Hour must be between 1 and 12');
    expect(validateTimeOfBirth('06:60 AM')).toBe('Minutes must be between 00 and 59');
    expect(validateTimeOfBirth('24:00')).toBe('Hour must be between 00 and 23');
    expect(validateTimeOfBirth('6 PM')).toBe('Use the format HH:MM AM/PM');
  });
});

describe('validatePlace', () => {
  it('needs 2–100 characters', () => {
    expect(validatePlace('')).toBe('Place of birth is required');
    expect(validatePlace('M')).toBe('Place of birth must be at least 2 characters');
    expect(validatePlace('Mumbai, Maharashtra')).toBeUndefined();
    expect(validatePlace('x'.repeat(PLACE_MAX_LENGTH + 1))).toBe(
      `Place of birth must be ${PLACE_MAX_LENGTH} characters or fewer`,
    );
    expect(validatePlace('', 'Birth place')).toBe('Birth place is required');
  });

  it('refuses typed text where the screen needs a place picked from its search', () => {
    expect(validatePlace('Mumbai', 'Place of birth', { selected: false })).toBe(
      'Select your birth place from the list',
    );
    expect(validatePlace('Mumbai', 'Place of birth', { selected: true })).toBeUndefined();
  });
});

describe('validateAmount and sanitizeAmountInput', () => {
  const limits = { min: 10, max: 100000 };

  it('holds whole rupees to the limits', () => {
    expect(validateAmount(0, limits)).toBe('Enter an amount to add');
    expect(validateAmount(9, limits)).toBe('Minimum top-up is ₹10');
    expect(validateAmount(10, limits)).toBeUndefined();
    expect(validateAmount(100000, limits)).toBeUndefined();
    expect(validateAmount(100001, limits)).toBe('Maximum top-up is ₹1,00,000');
    expect(validateAmount(10.5, limits)).toBe('Enter a whole number of rupees');
    expect(validateAmount(Number.NaN, limits)).toBe('Enter an amount to add');
  });

  it('sanitizeAmountInput drops leading zeros and anything not a digit', () => {
    expect(sanitizeAmountInput('007')).toBe('7');
    expect(sanitizeAmountInput('0')).toBe('');
    expect(sanitizeAmountInput('₹1,500')).toBe('1500');
    expect(sanitizeAmountInput('15.50')).toBe('1550');
    expect(sanitizeAmountInput('1234567', 6)).toBe('123456');
  });
});

describe('validateCode', () => {
  it('needs exactly the screen’s number of digits', () => {
    expect(validateCode('', 6)).toBe('Enter the code you received');
    expect(validateCode('12345', 6)).toBe('The code is 6 digits');
    expect(validateCode('1234567', 6)).toBe('The code is 6 digits');
    expect(validateCode('12a456', 6)).toBe('The code is 6 digits');
    expect(validateCode('12 456', 6)).toBe('The code is 6 digits');
    expect(validateCode('123456', 6)).toBeUndefined();
  });
});

describe('validateCouponCode', () => {
  it('is optional, then 3–20 letters and digits in any case', () => {
    expect(validateCouponCode('')).toBeUndefined();
    expect(validateCouponCode('  ')).toBeUndefined();
    expect(validateCouponCode('diwali50')).toBeUndefined();
    expect(validateCouponCode(' SAB12CD3 ', 'Referral code')).toBeUndefined();
    expect(validateCouponCode('AB')).toBe('Code is 3–20 characters');
    expect(validateCouponCode('A'.repeat(21))).toBe('Code is 3–20 characters');
    expect(validateCouponCode('DIWALI-50')).toBe('Code can only contain letters and digits');
  });
});

describe('canSendMessage', () => {
  it('needs something besides whitespace, within the message limit', () => {
    expect(canSendMessage('')).toBe(false);
    expect(canSendMessage('  \n ')).toBe(false);
    expect(canSendMessage(' hi ')).toBe(true);
    expect(canSendMessage('x'.repeat(MESSAGE_MAX_LENGTH))).toBe(true);
    expect(canSendMessage('x'.repeat(MESSAGE_MAX_LENGTH + 1))).toBe(false);
  });
});

describe('form helpers', () => {
  it('isFormValid and firstInvalidField read the error map in order', () => {
    const errors = { a: undefined, b: 'Bad', c: 'Also bad' };
    expect(isFormValid(errors)).toBe(false);
    expect(firstInvalidField(errors)).toBe('b');
    expect(isFormValid({ a: undefined })).toBe(true);
    expect(firstInvalidField({ a: undefined })).toBeUndefined();
  });

  it('serverFieldErrors maps a 422’s fields onto the form, renaming and dropping as told', () => {
    const error = {
      message: 'Please check the form.',
      fields: { email: 'Already in use.', placeOfBirth: 'Enter your place of birth.', photo: 'Too big.' },
    };
    expect(serverFieldErrors(error, ['email', 'birthPlace'] as const, { placeOfBirth: 'birthPlace' })).toEqual({
      email: 'Already in use.',
      birthPlace: 'Enter your place of birth.',
    });
    expect(serverFieldErrors(new Error('offline'), ['email'] as const)).toEqual({});
    expect(serverFieldErrors(undefined, ['email'] as const)).toEqual({});
  });
});
