/**
 * Turning a photo URL from the API into something `<Image>` can render.
 *
 * The screens were drawn against bundled images (`require('…jpg')`), which is a
 * number at runtime. The API sends a URL instead, which React Native takes as
 * `{ uri }`. Both are valid `ImageSourcePropType`, so one helper covers every
 * avatar in the app.
 *
 * An account with no photo yet falls back to a bundled placeholder rather than
 * an empty box.
 */

import type { ImageSourcePropType } from 'react-native';

const PLACEHOLDER_AVATAR = require('../assets/images/profile-avatar.jpg');
const PLACEHOLDER_ASTROLOGER = require('../assets/images/astro-ragini.png');

/** A seeker's photo, or the fallback avatar. */
export const avatarOf = (url?: string): ImageSourcePropType =>
  url ? { uri: url } : PLACEHOLDER_AVATAR;

/** An astrologer's photo, or the fallback portrait. */
export const portraitOf = (url?: string): ImageSourcePropType =>
  url ? { uri: url } : PLACEHOLDER_ASTROLOGER;
