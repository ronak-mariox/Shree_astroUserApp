/**
 * The chat intake flow: what the form offers, and the wheels behind its date
 * and time fields.
 *
 * Figma: the form at node 180:93411, its pickers at 180:96725 (time) and
 * 180:100079 (date), the busy sheet at 180:162837 and the connecting card at
 * 180:105058.
 */

export type ChatIntake = {
  fullName: string;
  dateOfBirth: string;
  timeOfBirth: string;
  gender: 'male' | 'female';
  birthPlace: string;
  topic: string;
};

export const TOPICS = [
  'Love & Relationship',
  'Marriage',
  'Career & Job',
  'Business',
  'Education',
  'Health',
  'Wealth & Finance',
  'Family',
] as const;

/**
 * The dropdown's own labels -> the backend's topic slugs (models/constants.js's
 * TOPICS enum on Chat's intake.topic — the same enum astro_app's `titleOf`
 * turns back into a label on its own side). The picker only ever produces one
 * of these eight; a topic dressed up any other way falls back to "general",
 * the enum's own default.
 */
const TOPIC_SLUGS: Record<(typeof TOPICS)[number], string> = {
  'Love & Relationship': 'love-relationship',
  Marriage: 'marriage',
  'Career & Job': 'career-job',
  Business: 'business',
  Education: 'education',
  Health: 'health',
  'Wealth & Finance': 'wealth-finance',
  Family: 'family',
};

/** "Career & Job" -> "career-job", ready for POST /chats' intake.topic. */
export const topicSlugFor = (label: string): string =>
  TOPIC_SLUGS[label as (typeof TOPICS)[number]] ?? 'general';

export const MONTHS = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
] as const;

export const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
] as const;

const pad = (value: number) => String(value).padStart(2, '0');
const range = (from: number, to: number) =>
  Array.from({ length: to - from + 1 }, (_, index) => from + index);

/** Wheel columns, in the order Figma prints them. */
export const DAY_COLUMN = range(1, 31).map(pad);
export const MONTH_COLUMN = [...MONTHS];
export const YEAR_COLUMN = range(1940, 2026).map(String);
export const HOUR_COLUMN = range(1, 12).map(pad);
export const MINUTE_COLUMN = range(0, 59).map(pad);
export const SECOND_COLUMN = range(0, 59).map(pad);
export const MERIDIEM_COLUMN = ['AM', 'PM'];

/** "05 Jan 2000" as the field prints it — "05 January 2000". */
export const formatBirthDate = (day: string, month: string, year: string) => {
  const index = MONTHS.indexOf(month as (typeof MONTHS)[number]);
  return `${day} ${index >= 0 ? MONTH_NAMES[index] : month} ${year}`;
};

/** "06 : 28 PM" as the field prints it. */
export const formatBirthTime = (
  hour: string,
  minute: string,
  meridiem: string,
) => `${hour} : ${minute} ${meridiem}`;

/**
 * "1999-08-15T00:00:00.000Z" -> "15 August 1999", ready for the field to
 * print as-is — the same shape {@link formatBirthDate} builds from the wheel.
 * Read as UTC fields, since a birth date is stored at UTC midnight precisely
 * so no local timezone can shift the day.
 */
export const formatBirthDateFromIso = (value?: string): string => {
  if (!value) {
    return '';
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '';
  }
  return formatBirthDate(pad(date.getUTCDate()), MONTHS[date.getUTCMonth()], String(date.getUTCFullYear()));
};

/**
 * "22:30" (the backend's 24-hour storage format) -> "10 : 30 PM", the same
 * shape {@link formatBirthTime} builds from the wheel.
 */
export const formatBirthTimeFromHHmm = (value?: string): string => {
  if (!value) {
    return '';
  }
  const parts = value.match(/^([01]\d|2[0-3]):([0-5]\d)$/);
  if (!parts) {
    return '';
  }
  const hour24 = Number(parts[1]);
  const meridiem = hour24 >= 12 ? 'PM' : 'AM';
  const hour12 = hour24 % 12 === 0 ? 12 : hour24 % 12;
  return formatBirthTime(pad(hour12), parts[2], meridiem);
};

/** "Wait 00:01:21" → 81 seconds; an unreadable wait falls back to two minutes. */
export const waitSeconds = (wait?: string, fallback = 120) => {
  if (wait === undefined) {
    return fallback;
  }
  const parts = wait.match(/(\d{1,2}):(\d{2})(?::(\d{2}))?/);
  if (!parts) {
    return fallback;
  }
  return parts[3] !== undefined
    ? Number(parts[1]) * 3600 + Number(parts[2]) * 60 + Number(parts[3])
    : Number(parts[1]) * 60 + Number(parts[2]);
};

/** "Wait 00:01:21" → "01:21"; anything unparsable comes back unchanged. */
export const waitClock = (wait: string) => {
  const parts = wait.match(/(\d{1,2}):(\d{2})(?::(\d{2}))?/);
  if (!parts) {
    return wait;
  }
  return parts[3] !== undefined
    ? `${parts[2]}:${parts[3]}`
    : `${parts[1]}:${parts[2]}`;
};

/** The intake form's answers, as the opening message prints them. */
export const intakeSummary = (intake: ChatIntake) => [
  'Hi',
  'Below are my details:',
  `Name: ${intake.fullName}`,
  `Gender: ${intake.gender === 'male' ? 'Male' : 'Female'}`,
  `DOB: ${intake.dateOfBirth}`,
  `TOB: ${intake.timeOfBirth}`,
  `POB: ${intake.birthPlace}`,
  ...(intake.topic === '' ? [] : [`Topic: ${intake.topic}`]),
];
