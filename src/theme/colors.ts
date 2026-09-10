/**
 * Colour tokens for Shree Astro.
 * Values are lifted directly from the Figma design (node 180:88319).
 */

export const colors = {
  /** App canvas behind every screen. */
  canvas: '#FFFDF8',
  /** Hero / brand yellow. */
  brandYellow: '#F0DF20',
  /** Cards and sheets. */
  surface: '#FFFFFF',
  /** Neutral tile behind a muted icon. */
  surfaceMuted: '#F3F4F6',
  /** Inset field (the country-code pill). */
  surfaceSubtle: '#F9FAFB',
  /** Solid fill of a disabled CTA. */
  surfaceDisabled: '#D1D5DB',
  /** Apple sign-in button. */
  surfaceDark: '#000000',
  /** Near-black tile — the avatar's camera badge. */
  surfaceInk: '#030300',
  /** Recessed panel behind the Key Positions tiles. */
  surfaceRecessed: '#F8F8F8',
  /** Track behind a progress bar. */
  track: '#F3F4F6',

  /** Verdicts on a chart reading. */
  status: {
    positive: '#16A34A',
    /** Also the "needs attention" tint for a weak planet. */
    caution: '#F0DF20',
    negative: '#DC2626',
    positiveTint: '#F0FDF4',
    positiveTintBorder: '#86EFAC',
    negativeTint: '#FEF2F2',
    negativeTintBorder: '#FECACA',
    /** Solid pill behind a "Beneficial" / "Absent" label. */
    positiveBadge: '#DCFCE7',
    /** A dosha that is present but not severe. */
    warningTint: '#FFFBEB',
    warningTintBorder: 'rgba(252, 211, 77, 0.25)',
    /** Softer green outline used on the doshas tab. */
    positiveTintBorderSoft: 'rgba(187, 247, 208, 0.25)',
    /** Outline of the wallet's "+ Add Money" button. */
    positiveStrong: '#04963A',
    /** Money leaving the wallet, and the connecting card's cancel cross. */
    debit: '#EF4444',
    /** The red the connecting card outlines that cross with (node 180:105066). */
    cancelMark: '#FF0004',
    /** The green a remaining wait time counts down in (node 180:105060). */
    waitClock: '#1CBF73',
    /** The filled part of the connecting bar (node 180:105065). */
    connectingProgress: '#3949AB',
    /** The double tick beside a delivered message (node 180:118760). */
    sent: '#34B7F1',
    /** The wallet pill on the chat header (node 180:121932). */
    walletPill: '#04963A',
    /** Tile behind a debit, and the "Total Spent" panel. */
    debitTint: '#FEE2E2',
    debitTintBorder: 'rgba(239, 68, 68, 0.13)',
    creditTintBorder: 'rgba(22, 163, 74, 0.13)',
    /** Advisory note — Razorpay callouts and the processing badge. */
    infoTint: '#FFF4E0',
    infoTintBorder: 'rgba(255, 140, 0, 0.2)',
    /** Unread notification card. */
    unreadTintBorder: 'rgba(255, 140, 0, 0.25)',
    /** "Voice" channel tag, a shade warmer than the chat tag. */
    voiceTint: '#FFF3E0',
    voiceTintBorder: 'rgba(249, 115, 22, 0.3)',
    /** Tile behind a scheduling or completion notification. */
    lilacTint: '#EDE7F6',
    /** Logout button. */
    debitTintBorderStrong: 'rgba(239, 68, 68, 0.2)',
  },

  /** The live consultation's low-balance banner and its recharge popup (Figma nodes 180:144988, 180:148242). */
  recharge: {
    /** The banner itself. */
    banner: '#E54646',
    /** The selected amount tile's border and warm background wash. */
    selected: '#FBE825',
    selectedTintFrom: '#FFFCDA',
    selectedTintTo: '#FFFAC6',
    /** The "Get ₹X Extra" strip along the bottom of every tile. */
    bonusStripFrom: '#EBC654',
    bonusStripVia: '#FEF18B',
    bonusStripTo: '#E9C555',
  },

  text: {
    /** Headings. */
    primary: '#1F2937',
    /** Body copy. */
    secondary: '#6B7280',
    /** Legal / helper copy. */
    muted: '#9CA3AF',
    /** Brand wordmark and outline-button label. */
    inverse: '#FFFFFF',
    onYellow: '#000000',
    /** Heading sitting on the yellow header. */
    onYellowStrong: '#030300',
    /** Subtitle sitting on the yellow header. */
    onYellowMuted: 'rgba(0, 0, 0, 0.5)',
    /** Subtitle on the onboarding wizard's yellow header. */
    onYellowSubtle: 'rgba(0, 0, 0, 0.6)',
    /** Copy on the warm summary card. */
    onGradient: '#FFFDF8',
    /** Field labels on the warm summary card. */
    onGradientMuted: 'rgba(255, 255, 255, 0.4)',
    /** Label of a disabled CTA. */
    disabled: '#9CA3AF',
    /** "Resend OTP" while resending is not yet possible. */
    inactive: '#D1D5DB',
    /** Text-input placeholder. */
    placeholder: 'rgba(31, 41, 55, 0.5)',
    /** Wheel-picker values and its title (Figma node 180:98372). */
    picker: '#4E4E4E',
    /** Its "Cancel" label. */
    pickerMuted: '#CDCDCD',
    /** A form label on the chat intake form — `karmaguru blue-200`. */
    intakeLabel: '#989DB5',
    /** The chat composer's placeholder (Figma node 180:121951). */
    composerHint: '#D3D1D1',
    /** Ink used by the astrologer card's Chat button. */
    ink: '#1D262D',
    /** Body copy inside a chat bubble. */
    bubble: '#374151',
    /** Supporting copy inside a remedy card. */
    remedy: 'rgba(30, 30, 30, 0.5)',
    /** Subtitle on the yellow-tinted remedies panel. */
    onTint: 'rgba(0, 0, 0, 0.5)',
    /** Timestamp under a past consultation. */
    faint: '#C4C4C4',
    /** Zodiac glyph beside the user's name. */
    zodiac: '#FFBF00',
    /** Secondary copy on the yellow header. */
    onYellowFaint: 'rgba(0, 0, 0, 0.45)',
    /** "WALLET BALANCE" eyebrow. */
    onYellowStrongMuted: 'rgba(0, 0, 0, 0.7)',
    /** "Available for consultations". */
    onYellowGhost: 'rgba(0, 0, 0, 0.4)',
    /** Sign name under a planet. */
    onGradientSoft: 'rgba(255, 255, 255, 0.6)',
    /** Eyebrow over an amount on a warm card. */
    onGradientFaint: 'rgba(255, 255, 255, 0.5)',
  },

  /** Primary CTA gradient — linear-gradient(261.86deg, #F55102 0%, #FFBC01 100%). */
  gradient: {
    from: '#F55102',
    to: '#FFBC01',
    /** Birth-details summary card — a warmer left-to-right variant. */
    summaryFrom: '#FFBF01',
    summaryTo: '#FF4E01',
    /** Avatar tile in the home header — the same warm ramp at 135°. */
    avatarFrom: '#FFBF00',
    avatarTo: '#FF4E00',
    /** Wallet balance card — brand yellow fading out at 147°. */
    balanceFrom: '#FBED54',
    balanceTo: 'rgba(251, 237, 84, 0.08)',
    /** Payment-success badge. */
    successFrom: '#22C55E',
    successTo: '#16A34A',
  },

  /** Celestial accents inside the hero. */
  cosmos: {
    /** Solid disc behind the star glyph. */
    badge: '#F87502',
    /** Glow + orbit ring base colour (used with varying opacity). */
    accent: '#FF8C00',
    /** Mid stop of the radial glow. */
    glowMid: '#804600',
    star: '#FFFFFF',
  },

  border: {
    strong: '#000000',
    /** Default card / field outline. */
    subtle: '#E5E7EB',
    /** Rules above and below a wheel's selected row (node 180:98379). */
    picker: '#8B8B8B',
    /** Outline of the wheel's "Cancel" button. */
    pickerAction: '#1D262D',
    /** A chat-intake field outline — `karmaguru blue-400`. */
    intakeField: '#4B557E',
    /** The chosen gender pill on that form (node 180:94979). */
    intakeSelected: '#C8102E',
    /** OTP boxes while the section is switched off. */
    muted: '#F3F4F6',
    /** Card highlighted because it became actionable. */
    active: '#F0DF20',
    /** Outline of the recommended login option. */
    success: '#25B912',
    /** Informational card outlined against white. */
    faint: 'rgba(0, 0, 0, 0.2)',
    /** Soft black outline — avatar ring, horoscope card, suggestion chips. */
    soft: 'rgba(0, 0, 0, 0.3)',
    /** Outline of a raised content card. */
    card: '#F0F0F0',
    /** Rule between rows of a detail list. */
    row: '#F3F4F6',
    /** Recessed panel outline. */
    hairlineSoft: 'rgba(0, 0, 0, 0.17)',
    /** Outline of a remedy card on the tinted panel. */
    onTint: 'rgba(0, 0, 0, 0.1)',
    /** Outline of the "CURRENT" dasha badge. */
    current: 'rgba(255, 140, 0, 0.3)',
    /** Rule under the amount field. */
    rule: '#C8C8C8',
    /** Outline of the wallet balance card. */
    balance: 'rgba(0, 0, 0, 0.25)',
    /** Glassy button sitting on the yellow header. */
    glass: 'rgba(255, 255, 255, 0.1)',
    /** Wallet card on the yellow header. */
    glassWarm: 'rgba(0, 0, 0, 0.05)',
    /** Planet chip on the warm gradient card. */
    onGradient: 'rgba(255, 255, 255, 0.15)',
  },

  /** Translucent fills layered over the yellow header and warm cards. */
  glass: {
    button: 'rgba(255, 255, 255, 0.08)',
    card: 'rgba(255, 255, 255, 0.26)',
    chip: 'rgba(255, 255, 255, 0.05)',
    /** Remedy row on the tinted panel. */
    row: 'rgba(255, 255, 255, 0.05)',
    /** Track behind the segmented tabs on the yellow header. */
    segment: 'rgba(255, 255, 255, 0.28)',
    /** Dark scrim button on the yellow header. */
    dim: 'rgba(0, 0, 0, 0.1)',
    /** Fainter scrim — the consultations segment track and profile stat tiles. */
    dimSoft: 'rgba(0, 0, 0, 0.08)',
    /** "Mark all read" pill on the yellow header. */
    light: 'rgba(255, 255, 255, 0.15)',
  },

  /** Faint brand wash behind the remedies panel. */
  brandTint: 'rgba(240, 223, 32, 0.05)',

  /** Unfilled segment of the onboarding step indicator. */
  progressTrack: 'rgba(0, 0, 0, 0.2)',

  /** Success accent used by the back button and the "OTP sent" badge. */
  success: {
    accent: '#22C55E',
    tint: 'rgba(34, 197, 94, 0.1)',
  },

  shadow: '#000000',
  /** Warm glow under the header badge — rgba(255, 78, 0, 0.3). */
  glow: '#FF4E00',
  /** Dims the screen behind a dialog — Figma's flat black at half strength. */
  scrim: 'rgba(0, 0, 0, 0.5)',
  /** Blush band behind the connecting card's portrait (node 180:105061). */
  surfaceBlush: '#FFF9F9',
  /** The seeker's own chat bubble (Figma node 180:118806). */
  surfaceBubbleOwn: '#FFF3F5',
  /** The cream sheet the conversation is drawn on (node 180:118751). */
  surfaceChat: '#FFFCF7',
  /** Outline of the chat composer (node 180:121946). */
  borderComposer: '#E7E7E7',
} as const;

/** Fades a `#RRGGBB` token to an `rgba()` string. */
export function withOpacity(hex: string, alpha: number): string {
  const value = parseInt(hex.slice(1), 16);
  const r = (value >> 16) & 255;
  const g = (value >> 8) & 255;
  const b = value & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

/** Opacities applied to `colors.cosmos.accent` in the hero. */
export const cosmosOpacity = {
  outerRing: 0.3,
  innerRing: 0.5,
  zodiacGlyph: 0.7,
  badgeGlow: 0.5,
  glowInner: 0.25,
  glowMid: 0.125,
} as const;
