/**
 * Picking a profile photo: the chooser, both sources, and every way it can end
 * without one — cancelled, refused, or dismissed.
 *
 * The picker module and the Alert are stubbed, so this exercises the decisions
 * pickProfilePhoto makes rather than the native modules underneath.
 */

import { Alert, Platform } from 'react-native';
import { launchCamera, launchImageLibrary } from 'react-native-image-picker';

import { pickProfilePhoto } from '../src/services/photoPicker';

jest.mock('react-native-image-picker', () => ({
  launchCamera: jest.fn(),
  launchImageLibrary: jest.fn(),
}));

const mockCamera = launchCamera as jest.Mock;
const mockLibrary = launchImageLibrary as jest.Mock;

/** Answers the "camera or gallery?" dialog by pressing one of its buttons. */
function answerChooser(label: 'Take Photo' | 'Choose from Gallery' | 'Cancel') {
  return jest
    .spyOn(Alert, 'alert')
    .mockImplementation((_title, _message, buttons) => {
      const button = (buttons || []).find(b => b.text === label);
      button?.onPress?.();
    });
}

/** Dismisses it by tapping outside, which only Android can do. */
function dismissChooser() {
  return jest
    .spyOn(Alert, 'alert')
    .mockImplementation((_title, _message, _buttons, options) => {
      (options as { onDismiss?: () => void })?.onDismiss?.();
    });
}

const A_PHOTO = {
  assets: [{ uri: 'file:///tmp/IMG_0042.HEIC', fileName: 'IMG_0042.jpg', type: 'image/jpeg' }],
};

beforeEach(() => {
  jest.clearAllMocks();
  jest.restoreAllMocks();
  Platform.OS = 'android';
});

test('taking a photo returns the asset in upload shape', async () => {
  answerChooser('Take Photo');
  mockCamera.mockResolvedValue(A_PHOTO);

  await expect(pickProfilePhoto()).resolves.toEqual({
    uri: 'file:///tmp/IMG_0042.HEIC',
    name: 'IMG_0042.jpg',
    type: 'image/jpeg',
  });

  expect(mockLibrary).not.toHaveBeenCalled();
  expect(mockCamera).toHaveBeenCalledWith(
    expect.objectContaining({
      mediaType: 'photo',
      maxWidth: 1024,
      maxHeight: 1024,
      cameraType: 'front',
      saveToPhotos: false,
    }),
  );
});

test('choosing from the gallery asks for exactly one image', async () => {
  answerChooser('Choose from Gallery');
  mockLibrary.mockResolvedValue(A_PHOTO);

  await expect(pickProfilePhoto()).resolves.toMatchObject({ name: 'IMG_0042.jpg' });

  expect(mockCamera).not.toHaveBeenCalled();
  expect(mockLibrary).toHaveBeenCalledWith(
    expect.objectContaining({ mediaType: 'photo', selectionLimit: 1 }),
  );
});

test('the image is capped so the upload stays under the API limit', async () => {
  answerChooser('Take Photo');
  mockCamera.mockResolvedValue(A_PHOTO);

  await pickProfilePhoto();

  const options = mockCamera.mock.calls[0][0];
  expect(options.maxWidth).toBeLessThanOrEqual(1024);
  expect(options.quality).toBeLessThan(1);
});

test('cancelling the chooser opens neither camera nor gallery', async () => {
  answerChooser('Cancel');

  await expect(pickProfilePhoto()).resolves.toBeUndefined();
  expect(mockCamera).not.toHaveBeenCalled();
  expect(mockLibrary).not.toHaveBeenCalled();
});

test('dismissing the chooser settles rather than hanging', async () => {
  dismissChooser();

  await expect(pickProfilePhoto()).resolves.toBeUndefined();
});

test('backing out of the camera says nothing to the user', async () => {
  const alert = answerChooser('Take Photo');
  mockCamera.mockResolvedValue({ didCancel: true });

  await expect(pickProfilePhoto()).resolves.toBeUndefined();
  /** One call: the chooser itself. No second alert about the cancel. */
  expect(alert).toHaveBeenCalledTimes(1);
});

test('a refused permission is explained', async () => {
  const alert = answerChooser('Choose from Gallery');
  mockLibrary.mockResolvedValue({ errorCode: 'permission' });

  await expect(pickProfilePhoto()).resolves.toBeUndefined();
  expect(alert).toHaveBeenLastCalledWith(
    'Profile Photo',
    expect.stringContaining('Settings'),
  );
});

test('a device with no camera is explained', async () => {
  const alert = answerChooser('Take Photo');
  mockCamera.mockResolvedValue({ errorCode: 'camera_unavailable' });

  await expect(pickProfilePhoto()).resolves.toBeUndefined();
  expect(alert).toHaveBeenLastCalledWith(
    'Profile Photo',
    expect.stringContaining('does not have a camera'),
  );
});

test('any other failure falls back to the message the picker gave', async () => {
  const alert = answerChooser('Take Photo');
  mockCamera.mockResolvedValue({ errorCode: 'others', errorMessage: 'Disk is full.' });

  await expect(pickProfilePhoto()).resolves.toBeUndefined();
  expect(alert).toHaveBeenLastCalledWith('Profile Photo', 'Disk is full.');
});

test('an empty result is treated as no photo', async () => {
  answerChooser('Choose from Gallery');
  mockLibrary.mockResolvedValue({ assets: [] });

  await expect(pickProfilePhoto()).resolves.toBeUndefined();
});

test('an asset with no uri is treated as no photo', async () => {
  answerChooser('Take Photo');
  mockCamera.mockResolvedValue({ assets: [{ fileName: 'broken.jpg' }] });

  await expect(pickProfilePhoto()).resolves.toBeUndefined();
});

test('missing name and type are left for the upload to default', async () => {
  answerChooser('Choose from Gallery');
  mockLibrary.mockResolvedValue({ assets: [{ uri: 'file:///tmp/x.png' }] });

  await expect(pickProfilePhoto()).resolves.toEqual({
    uri: 'file:///tmp/x.png',
    name: undefined,
    type: undefined,
  });
});

test('on iOS the chooser is an action sheet, not a dialog', async () => {
  Platform.OS = 'ios';
  const { ActionSheetIOS } = require('react-native');
  const sheet = jest
    .spyOn(ActionSheetIOS, 'showActionSheetWithOptions')
    .mockImplementation((_options: any, callback: any) => callback(0));
  const alert = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
  mockCamera.mockResolvedValue(A_PHOTO);

  await expect(pickProfilePhoto()).resolves.toMatchObject({ name: 'IMG_0042.jpg' });

  expect(sheet).toHaveBeenCalled();
  expect(alert).not.toHaveBeenCalled();
});

test('a picker that is not in the build reports itself instead of doing nothing', async () => {
  const alert = answerChooser('Take Photo');
  mockCamera.mockRejectedValue(new TypeError("Cannot read property 'launchCamera' of null"));

  await expect(pickProfilePhoto()).resolves.toBeUndefined();
  expect(alert).toHaveBeenLastCalledWith(
    'Profile Photo',
    expect.stringContaining('rebuild'),
  );
});

test('a picker that throws synchronously is handled the same way', async () => {
  const alert = answerChooser('Choose from Gallery');
  mockLibrary.mockImplementation(() => {
    throw new Error("TurboModuleRegistry.getEnforcing(...): 'ImagePicker' could not be found.");
  });

  await expect(pickProfilePhoto()).resolves.toBeUndefined();
  expect(alert).toHaveBeenCalledTimes(2);
});
