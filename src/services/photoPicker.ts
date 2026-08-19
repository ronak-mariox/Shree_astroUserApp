/**
 * Choosing a profile photo — from the camera, or from the gallery.
 *
 * The screen asking for a photo does not care where it came from. It calls
 * {@link pickProfilePhoto}, waits, and gets back either an asset it can show
 * and upload, or `undefined` because the user changed their mind.
 *
 * Everything that can go wrong on the way — a cancelled sheet, a refused
 * permission, a device with no camera — resolves to `undefined` too, after
 * telling the user what happened. A caller never has to handle an error here.
 */

import { ActionSheetIOS, Alert, Platform } from 'react-native';
import {
  launchCamera,
  launchImageLibrary,
  type ImagePickerResponse,
  type OptionsCommon,
} from 'react-native-image-picker';

import type { PhotoAsset } from './auth';

/**
 * How the image is treated before it leaves the device.
 *
 * A modern phone camera produces something like 12 MB, and the API refuses
 * anything over MAX_UPLOAD_MB (5). Capping the long edge at 1024px and
 * re-encoding at 80% quality lands comfortably under that, and is still far
 * more than an 88px avatar needs.
 *
 * The resize has a second effect worth knowing: the picker re-encodes to JPEG,
 * so an iPhone's HEIC photo arrives at the server as a JPEG.
 */
const IMAGE_OPTIONS: OptionsCommon = {
  mediaType: 'photo',
  maxWidth: 1024,
  maxHeight: 1024,
  quality: 0.8,
};

type PhotoSource = 'camera' | 'gallery';

/**
 * Asks where the photo should come from, using each platform's own chooser —
 * an action sheet on iOS, a dialog on Android.
 *
 * Resolves to `undefined` when the user backs out, including by tapping
 * outside the Android dialog. Without that `onDismiss`, this promise would
 * never settle and the screen would wait forever.
 */
function askForSource(): Promise<PhotoSource | undefined> {
  return new Promise(resolve => {
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          title: 'Profile Photo',
          options: ['Take Photo', 'Choose from Gallery', 'Cancel'],
          cancelButtonIndex: 2,
        },
        index => {
          if (index === 0) {
            resolve('camera');
          } else if (index === 1) {
            resolve('gallery');
          } else {
            resolve(undefined);
          }
        },
      );
      return;
    }

    Alert.alert(
      'Profile Photo',
      'Where would you like to get it from?',
      [
        { text: 'Take Photo', onPress: () => resolve('camera') },
        { text: 'Choose from Gallery', onPress: () => resolve('gallery') },
        { text: 'Cancel', style: 'cancel', onPress: () => resolve(undefined) },
      ],
      { cancelable: true, onDismiss: () => resolve(undefined) },
    );
  });
}

/**
 * What to say when the picker could not even be opened.
 *
 * Almost always one thing: react-native-image-picker is a *native* module, so
 * it only exists inside the app after a native rebuild. Installing the package
 * and reloading over Metro is not enough — the JS is there, the native half is
 * not, and the call fails the moment it reaches the bridge.
 *
 * During development that is worth naming outright, because the symptom is a
 * button that appears to do nothing at all.
 */
function unavailableMessage(error: unknown): string {
  if (__DEV__) {
    return (
      'The photo picker is not in this build of the app. Stop Metro, run ' +
      '"npm run android" (or "npm run ios") to rebuild with the native module, ' +
      `then try again.\n\n${String(error)}`
    );
  }
  return 'The photo picker could not be opened. Please try again.';
}

/** What to tell the user when the picker refuses. */
function messageFor(response: ImagePickerResponse): string {
  if (response.errorCode === 'camera_unavailable') {
    return 'This device does not have a camera available.';
  }
  if (response.errorCode === 'permission') {
    return 'Shree Astro needs permission to use your camera and photos. You can turn it on in Settings.';
  }
  return response.errorMessage || 'That photo could not be opened. Please try another.';
}

/**
 * Opens the chooser, then the camera or the gallery, and returns what was
 * picked in the `{ uri, name, type }` shape the register call uploads.
 *
 * A note for Android: `launchCamera` uses the system camera app, which needs no
 * runtime permission — *unless* `android.permission.CAMERA` is declared in
 * AndroidManifest.xml, in which case the library requires you to request it
 * yourself first. It is deliberately not declared there. If some later feature
 * adds it, this function has to start requesting it or taking a photo will
 * begin failing.
 */
export async function pickProfilePhoto(): Promise<PhotoAsset | undefined> {
  const source = await askForSource();
  if (!source) {
    return undefined;
  }

  let response: ImagePickerResponse;
  try {
    response =
      source === 'camera'
        ? await launchCamera({
            ...IMAGE_OPTIONS,
            /** A profile photo is a selfie far more often than not. */
            cameraType: 'front',
            saveToPhotos: false,
          })
        : await launchImageLibrary({ ...IMAGE_OPTIONS, selectionLimit: 1 });
  } catch (error) {
    /**
     * Without this the rejection would travel up into the screen's `await`,
     * go unhandled, and the tap would look like it did nothing.
     */
    console.error('[photoPicker] could not open the picker:', error);
    Alert.alert('Profile Photo', unavailableMessage(error));
    return undefined;
  }

  /** Backed out of the camera or the gallery — not a failure, so stay quiet. */
  if (response.didCancel) {
    return undefined;
  }

  if (response.errorCode) {
    Alert.alert('Profile Photo', messageFor(response));
    return undefined;
  }

  const asset = response.assets?.[0];
  if (!asset?.uri) {
    return undefined;
  }

  return { uri: asset.uri, name: asset.fileName, type: asset.type };
}
