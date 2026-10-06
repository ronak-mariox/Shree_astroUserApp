/**
 * The last of the fixture switches, now off: every screen runs against the
 * real backend.
 *
 * It used to stand in for the whole app while the backend was being wired up,
 * and the flags below took each verified area out from under it one at a
 * time. What was left under it by the end — `fetchSettings` (the
 * admin-configured recharge limits Add Money validates against),
 * `fetchHoroscope`, `updateNotificationPrefs`, `raiseTicket`, and the older
 * `/users/me/kundlis` trio — is verified against the live endpoints too, so
 * the fixtures are no longer served anywhere. Left in place, rather than
 * deleted with every `if` it guards, so a screen can still be walked offline
 * by flipping it back.
 */
export const USE_DUMMY_DATA = false;

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
 * above. Payment goes through Razorpay when the server has it configured
 * (services/payments.ts's `payTopUp` runs startTopUp → checkout →
 * confirmTopUp); with this flag on, the fixtures answer as a server with no
 * gateway does — `gateway: 'none'`, confirmed straight away, no checkout.
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
