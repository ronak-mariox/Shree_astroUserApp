/**
 * Temporary: the whole app runs off fixture data instead of the real backend
 * — reads return `./dummyData`, and writes simulate success against it — so
 * every screen and button is walkable with nothing running behind it. Every
 * function's real `client` call is left in place beneath the early return it
 * guards; flip this to `false` to go back to live endpoints, nothing else
 * needs to change.
 */
export const USE_DUMMY_DATA = true;
