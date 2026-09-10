/**
 * Temporary: most of the app still runs off fixture data instead of the real
 * backend — reads return `./dummyData`, and writes simulate success against
 * it — so every screen and button is walkable with nothing running behind it.
 * Every function's real `client` call is left in place beneath the early
 * return it guards; flip this to `false`, screen by screen as each backend
 * contract is verified, to go back to live endpoints.
 */
export const USE_DUMMY_DATA = true;

/**
 * Sign-up, sign-in, sign-out, and the seeker's own profile (`services/auth.ts`,
 * and `fetchProfile`/`saveProfile` in `services/api.ts`) are wired to, and
 * verified against, the real backend — this flag takes them out from under
 * `USE_DUMMY_DATA` independently of the rest of the app, which stays on
 * fixtures (chat, kundli...) until each of those is wired up and verified the
 * same way.
 */
export const USE_DUMMY_AUTH = false;

/**
 * The wallet top-up flow (Wallet, Add Money, Payment, Processing, Success,
 * and Transaction History) is wired to, and verified against, the real
 * backend — same independence from `USE_DUMMY_DATA` as `USE_DUMMY_AUTH`
 * above. There is no real payment gateway behind it yet — see
 * services/wallet.service.js's own doc comment on the backend — a top-up is
 * credited to the wallet directly, but the two-step startTopUp/confirmTopUp
 * shape is kept exactly as a real gateway would need it, so wiring one in
 * later means filling the gap between those two calls, not a rewrite.
 */
export const USE_DUMMY_WALLET = false;

/**
 * The Home screen's header (profile photo, name, zodiac/DOB line) and its
 * wallet balance — along with the rest of what `fetchHome` returns in the
 * same call (today's horoscope, planet positions, recent consultations) — are
 * wired to, and verified against, the real backend.
 */
export const USE_DUMMY_HOME = false;

/**
 * The astrologer directory and detail screen (Home's carousel, Find
 * Astrologers, the Consult tab, `AstrologerDetailScreen`) and favourites
 * (`fetchFavourites`/`toggleFavourite`) — all in `services/api.ts` — are
 * wired to, and verified against, the real backend, independently of
 * `USE_DUMMY_DATA`.
 */
export const USE_DUMMY_ASTROLOGERS = false;

/**
 * The Notifications screen and the unread bell on Home — `fetchNotifications`
 * and `markNotificationsRead` in `services/api.ts` — are wired to, and
 * verified against, the real backend, independently of `USE_DUMMY_DATA`.
 */
export const USE_DUMMY_NOTIFICATIONS = false;

/**
 * Kundli generation — /places/search, POST /birth-profiles, and the four
 * GET /kundli/:profileId... reads in services/api.ts — is wired to, and
 * verified against, the real backend, independently of `USE_DUMMY_DATA`.
 * Unrelated to `fetchKundlis`/`saveKundli`/`deleteKundli` above, which stay on
 * the older `/users/me/kundlis` list and its own `USE_DUMMY_DATA` gate.
 */
export const USE_DUMMY_KUNDLI = false;

/**
 * Consultation History (`fetchConsultations` in services/api.ts, reached from
 * the Profile menu, Home's "view all", and Chat Intake's "My Orders") is
 * wired to, and verified against, the real backend, independently of
 * `USE_DUMMY_DATA`.
 */
export const USE_DUMMY_CONSULTATIONS = false;

/**
 * The AI Astrology assistant (`AiAstrologyChatScreen`, and
 * `fetchAiThread`/`askAi` in services/api.ts) is wired to, and verified
 * against, the real backend, independently of `USE_DUMMY_DATA` — the backend
 * side (chart-grounded replies, tools, rolling memory) is real now, not the
 * canned holding reply it used to be.
 */
export const USE_DUMMY_AI_ASSISTANT = false;
