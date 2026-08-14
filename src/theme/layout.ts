/** Spacing scale used across the app (matches the Figma 4pt rhythm). */
export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  /** 14pt — gap between stacked login-option rows. */
  rowGap: 14,
  /** 16pt — gap between the sections of a form. */
  section: 16,
  lg: 20,
  xl: 24,
  xxl: 28,
  xxxl: 32,
  huge: 40,
} as const;

export const radius = {
  button: 9,
  buttonOutline: 16,
  /** Social buttons and OTP boxes. */
  field: 14,
  /** Text fields and info cards on the onboarding wizard. */
  input: 16,
  /** Warm summary card and past-consultation row. */
  summary: 18,
  /** Raised content panel — wallet, horoscope and astrologer cards. */
  panel: 22,
  /** Small photo tile inside a row. */
  tile: 15,
  /** Status pill on a table row. */
  chip: 6,
  /** Channel tag on a consultation card, and a segmented tab's inner pill. */
  tag: 8,
  /** Birth-chart frame. */
  chart: 8,
  /** Progress bar and its fill. */
  progress: 3,
  /** Avatar tile. */
  avatar: 28,
  /** Wallet balance card and payment receipt. */
  balance: 24,
  /** Small badge pinned to the avatar, and the chat suggestion chips. */
  badge: 10,
  /** The clipped corner that points a chat bubble at its sender. */
  bubbleTail: 4,
  /** Small icon tile (back button, muted option icon). */
  icon: 12,
  /** Large icon tile (header badge, option row). */
  iconLarge: 16,
  card: 20,
  sheet: 32,
  pill: 999,
} as const;

/** Hairline used for the outline button and the orbit rings. */
export const hairline = 0.755;

/** Border of an OTP box — drawn twice as heavy as a hairline. */
export const stroke = 1.51;

/** The artboard the design was drawn on — used to keep the star field
 *  proportional on other screen sizes. */
export const designFrame = {
  width: 389.991,
  heroHeight: 484.407,
  /** Status-bar height baked into the mockups. Screens subtract it from
   *  their designed top padding and add the device's real inset instead. */
  statusBarHeight: 49.992,
} as const;
