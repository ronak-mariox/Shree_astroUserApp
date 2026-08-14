import type { TextStyle } from 'react-native';

/**
 * Poppins is bundled with the app (src/assets/fonts) and linked into both
 * native projects, so the family names below resolve on iOS and Android alike.
 */
export const fontFamily = {
  regular: 'Poppins-Regular',
  medium: 'Poppins-Medium',
  semiBold: 'Poppins-SemiBold',
  bold: 'Poppins-Bold',
} as const;

export const typography = {
  /** "Shree Astro" wordmark. */
  wordmark: {
    fontFamily: fontFamily.bold,
    fontSize: 22,
    lineHeight: 33,
  },
  /** "Discover Your / Cosmic Destiny". */
  title: {
    fontFamily: fontFamily.bold,
    fontSize: 24,
    lineHeight: 31.2,
  },
  /** Supporting paragraph. */
  body: {
    fontFamily: fontFamily.regular,
    fontSize: 14,
    lineHeight: 22.4,
  },
  /** "Welcome Back ✨". */
  heading: {
    fontFamily: fontFamily.bold,
    fontSize: 28,
    lineHeight: 42,
  },
  /** "Mobile Verification" in the yellow header. */
  headingSmall: {
    fontFamily: fontFamily.bold,
    fontSize: 22,
    lineHeight: 26.4,
  },
  /** Wallet balance and the amount being entered. */
  displayLarge: {
    fontFamily: fontFamily.bold,
    fontSize: 40,
    lineHeight: 60,
  },
  /** Amount on the payment receipt. */
  displayMedium: {
    fontFamily: fontFamily.bold,
    fontSize: 36,
    lineHeight: 54,
  },
  /** The rupee sign beside the amount field. */
  displaySmall: {
    fontFamily: fontFamily.bold,
    fontSize: 32,
    lineHeight: 48,
  },
  /** "Payment Successful! 🎉". */
  celebration: {
    fontFamily: fontFamily.bold,
    fontSize: 26,
    lineHeight: 39,
  },
  /** "Processing Payment". */
  titleSmall: {
    fontFamily: fontFamily.semiBold,
    fontSize: 18,
    lineHeight: 27,
  },
  /** Figure on a wallet statistic tile. */
  statValue: {
    fontFamily: fontFamily.bold,
    fontSize: 18,
    lineHeight: 27,
  },
  /** "Recent Transactions". */
  subheading: {
    fontFamily: fontFamily.semiBold,
    fontSize: 15,
    lineHeight: 22.5,
  },
  /** Title of a selectable list row, e.g. a payment method. */
  listTitle: {
    fontFamily: fontFamily.medium,
    fontSize: 14,
    lineHeight: 21,
  },
  /** Emoji filling a 44pt tile. */
  symbolEmoji: {
    fontSize: 22,
    lineHeight: 33,
  },
  /** All-caps eyebrow set lighter than {@link overline}. */
  overlineLight: {
    fontFamily: fontFamily.regular,
    fontSize: 12,
    lineHeight: 18,
    letterSpacing: 1.2,
  },
  /** "Create Profile" — the onboarding wizard's step title. */
  pageTitle: {
    fontFamily: fontFamily.bold,
    fontSize: 22,
    lineHeight: 33,
  },
  /** "Birth Details" — the same title beside a back button. */
  pageTitleSmall: {
    fontFamily: fontFamily.bold,
    fontSize: 20,
    lineHeight: 30,
  },
  /** Screen subtitle under a heading. */
  subtitle: {
    fontFamily: fontFamily.regular,
    fontSize: 14,
    lineHeight: 21,
  },
  /** Field / card label. */
  label: {
    fontFamily: fontFamily.semiBold,
    fontSize: 14,
    lineHeight: 21,
  },
  /** Label above a form field in the onboarding wizard. */
  fieldLabel: {
    fontFamily: fontFamily.medium,
    fontSize: 13,
    lineHeight: 19.5,
  },
  /** Explanatory copy inside an info card. */
  bodySmall: {
    fontFamily: fontFamily.regular,
    fontSize: 13,
    lineHeight: 20.8,
  },
  /** Horoscope reading — the same size on a looser leading. */
  bodyRelaxed: {
    fontFamily: fontFamily.regular,
    fontSize: 13,
    lineHeight: 21.45,
  },
  /** "✦ Namaste" above the user's name. */
  greeting: {
    fontFamily: fontFamily.medium,
    fontSize: 12,
    lineHeight: 18,
    letterSpacing: 0.6,
  },
  /** "WALLET BALANCE" eyebrow. */
  eyebrow: {
    fontFamily: fontFamily.semiBold,
    fontSize: 10,
    lineHeight: 15,
    letterSpacing: 1,
  },
  /** "Quick Actions", "Top Astrologers", "Recent Consultations". */
  sectionTitle: {
    fontFamily: fontFamily.bold,
    fontSize: 15,
    lineHeight: 22.5,
  },
  /** Card heading and money amounts. */
  cardTitle: {
    fontFamily: fontFamily.bold,
    fontSize: 14,
    lineHeight: 21,
  },
  /** "Leo · Today, 13 Jul 2026". */
  cardMeta: {
    fontFamily: fontFamily.medium,
    fontSize: 11,
    lineHeight: 16.5,
  },
  /** Name on an astrologer card. */
  cardName: {
    fontFamily: fontFamily.bold,
    fontSize: 12,
    lineHeight: 15.6,
  },
  /** Title of a past-consultation row. */
  rowTitle: {
    fontFamily: fontFamily.bold,
    fontSize: 13,
    lineHeight: 19.5,
  },
  /** Value in a label/value detail list. */
  detailValue: {
    fontFamily: fontFamily.medium,
    fontSize: 13,
    lineHeight: 19.5,
  },
  /** Quick-action tile caption. */
  tileTitle: {
    fontFamily: fontFamily.semiBold,
    fontSize: 12,
    lineHeight: 19.5,
  },
  /** Supporting 11pt copy — specialities, dates, hints. */
  footnoteSmall: {
    fontFamily: fontFamily.regular,
    fontSize: 11,
    lineHeight: 16.5,
  },
  /** Per-minute rate. */
  priceLabel: {
    fontFamily: fontFamily.semiBold,
    fontSize: 11,
    lineHeight: 16.5,
  },
  /** Planet name on the positions card. */
  planetName: {
    fontFamily: fontFamily.bold,
    fontSize: 11,
    lineHeight: 16.5,
  },
  /** Planet and zodiac glyphs. */
  symbol: {
    fontSize: 20,
    lineHeight: 30,
  },
  /** Emoji sitting inside a small avatar tile. */
  symbolSmall: {
    fontSize: 16,
    lineHeight: 24,
  },
  /** Zodiac glyph on a Key Positions tile. */
  symbolMedium: {
    fontSize: 18,
    lineHeight: 27,
  },
  /** Emoji leading a remedy card. */
  symbolLarge: {
    fontSize: 28,
    lineHeight: 42,
  },
  /** 12pt label above a figure, e.g. "Remaining". */
  captionMedium: {
    fontFamily: fontFamily.medium,
    fontSize: 12,
    lineHeight: 18,
  },
  /** Emphasised 12pt figure — a Shadbala percentage or a Key Position sign. */
  captionBold: {
    fontFamily: fontFamily.bold,
    fontSize: 12,
    lineHeight: 18,
  },
  /** 10pt status pill on a table row. */
  badgeLabel: {
    fontFamily: fontFamily.semiBold,
    fontSize: 10,
    lineHeight: 15,
  },
  /** House number printed in a birth-chart cell. */
  chartHouse: {
    fontFamily: fontFamily.regular,
    fontSize: 10,
  },
  /** Two-letter planet abbreviation in a birth-chart cell. */
  chartPlanet: {
    fontFamily: fontFamily.bold,
    fontSize: 11,
  },
  /** The native's name at the centre of the chart. */
  chartName: {
    fontFamily: fontFamily.bold,
    fontSize: 11,
  },
  /** Birth date and place under the name. */
  chartMeta: {
    fontFamily: fontFamily.regular,
    fontSize: 9,
  },
  /** Chat composer — no fixed leading, so Android does not clip a growing field. */
  chatInput: {
    fontFamily: fontFamily.regular,
    fontSize: 14,
  },
  /** 10pt label above a statistic. */
  microLabel: {
    fontFamily: fontFamily.regular,
    fontSize: 10,
    lineHeight: 15,
  },
  /** 13pt statistic under a micro label. */
  microValue: {
    fontFamily: fontFamily.bold,
    fontSize: 13,
    lineHeight: 19.5,
  },
  /** Chat / Call chip label. */
  chipLabel: {
    fontFamily: fontFamily.bold,
    fontSize: 10,
    lineHeight: 15,
  },
  /** Bottom-navigation label. */
  tabLabel: {
    fontFamily: fontFamily.regular,
    fontSize: 10,
    lineHeight: 15,
  },
  /** Bottom-navigation label of the selected tab. */
  tabLabelActive: {
    fontFamily: fontFamily.semiBold,
    fontSize: 10,
    lineHeight: 15,
  },
  /** All-caps heading of the summary card. */
  overline: {
    fontFamily: fontFamily.medium,
    fontSize: 12,
    lineHeight: 18,
    letterSpacing: 1.2,
  },
  /** Field name inside the summary card. */
  summaryLabel: {
    fontFamily: fontFamily.regular,
    fontSize: 11,
    lineHeight: 16.5,
  },
  /** Field value inside the summary card. */
  summaryValue: {
    fontFamily: fontFamily.medium,
    fontSize: 13,
    lineHeight: 19.5,
  },
  /** Title of a login-option row. */
  optionTitle: {
    fontFamily: fontFamily.semiBold,
    fontSize: 15,
    lineHeight: 22.5,
  },
  /** Button labels. */
  button: {
    fontFamily: fontFamily.semiBold,
    fontSize: 16,
    lineHeight: 24,
  },
  /** Full-bleed CTA label, set bolder than the standard button. */
  buttonLarge: {
    fontFamily: fontFamily.bold,
    fontSize: 16,
    lineHeight: 24,
  },
  /** Button labels inside cards ("Send OTP", "Verify & Continue"). */
  buttonSmall: {
    fontFamily: fontFamily.semiBold,
    fontSize: 15,
    lineHeight: 22.5,
  },
  /** Google / Apple button labels. */
  buttonSocial: {
    fontFamily: fontFamily.semiBold,
    fontSize: 14,
    lineHeight: 21,
  },
  /** Text typed into a field. */
  input: {
    fontFamily: fontFamily.regular,
    fontSize: 15,
    lineHeight: 22.5,
  },
  /** "+91" beside the flag. */
  countryCode: {
    fontFamily: fontFamily.medium,
    fontSize: 14,
    lineHeight: 21,
  },
  /** The flag emoji itself. */
  flag: {
    fontSize: 18,
    lineHeight: 27,
  },
  /** "Don't have an account?" / "Didn't receive?". */
  footnote: {
    fontFamily: fontFamily.regular,
    fontSize: 13,
    lineHeight: 19.5,
  },
  /** The actionable half of a footnote ("Register", "Resend OTP"). */
  footnoteStrong: {
    fontFamily: fontFamily.semiBold,
    fontSize: 13,
    lineHeight: 19.5,
  },
  /** Terms & privacy line, option subtitles, divider label. */
  caption: {
    fontFamily: fontFamily.regular,
    fontSize: 12,
    lineHeight: 18,
  },
  /** Emphasised caption ("OTP sent to +91 …"). */
  captionStrong: {
    fontFamily: fontFamily.semiBold,
    fontSize: 12,
    lineHeight: 18,
  },
  /** Zodiac symbols around the orbit — left to the system font so the
   *  glyphs resolve everywhere. */
  glyph: {
    fontSize: 14,
    lineHeight: 21,
  },
} satisfies Record<string, TextStyle>;
