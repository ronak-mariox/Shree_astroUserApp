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
  /** Minutes booked for the session — the window the user pays for. */
  minutes: number;
};

/** How long a chat runs, in minutes. */
export const CHAT_WINDOWS = [3, 5, 10, 15] as const;

export type ChatWindow = (typeof CHAT_WINDOWS)[number];

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

/** The four faces over "Recent Chats" (Figma node 180:95032). */
export const RECENT_CHATS = [
  { id: 'mithu', name: 'Mithu' },
  { id: 'ashish', name: 'Ashish' },
  { id: 'nanika', name: 'Nanika' },
  { id: 'nidhi', name: 'NIdhi' },
] as const;

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

/**
 * How the conversation opens: the birth details the intake form filed, then
 * the greeting the platform posts while the astrologer joins.
 * Figma prints both at nodes 180:118810 and 180:118756.
 */
export const openingMessages = (
  intakeLines: ReadonlyArray<string> | undefined,
  astrologerName: string,
) => {
  const time = '10:54 AM';
  const greeting = {
    id: 'greeting',
    from: 'astrologer' as const,
    lines: [
      'Welcome to Shree Astro',
      `${astrologerName} will join within 10 second`,
      '',
      'Please share your question in the meanwhile',
    ],
    time,
  };

  if (intakeLines === undefined || intakeLines.length === 0) {
    return [greeting];
  }

  return [
    { id: 'intake', from: 'seeker' as const, lines: intakeLines, time },
    greeting,
  ];
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
  `Session: ${intake.minutes} min`,
];
