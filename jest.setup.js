/* eslint-env jest */
/**
 * The screen tests run against stubs, not a server.
 *
 * `jest.mock` has to be registered before a test file's own imports run — and a
 * test file imports the screen, which imports the service. Registering it in
 * setup is what guarantees the order.
 */

/** No native keystore in a test run; hold the session in memory instead. */
jest.mock('react-native-keychain', () => {
  const store = new Map();
  return {
    ACCESSIBLE: { AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY: 'AfterFirstUnlockThisDeviceOnly' },
    STORAGE_TYPE: { AES_GCM_NO_AUTH: 'KeystoreAESGCM_NoAuth' },
    setGenericPassword: jest.fn(async (username, password, { service }) => {
      store.set(service, { username, password });
      return { service };
    }),
    getGenericPassword: jest.fn(async ({ service }) => store.get(service) ?? false),
    resetGenericPassword: jest.fn(async ({ service }) => store.delete(service)),
  };
});

/** Signing in reaches the network, which a screen test has no business doing. */
jest.mock('./src/services/auth', () => {
  const actual = jest.requireActual('./src/services/auth');
  return {
    ...actual,
    requestLoginOtp: jest.fn(async () => ({
      channel: 'phone',
      destination: '••••••3210',
      expiresInSeconds: 300,
      resendInSeconds: 30,
    })),
    verifyLoginOtp: jest.fn(async () => ({
      accessToken: 'test-access',
      refreshToken: 'test-refresh',
      user: { id: 'u-1', name: 'Arjun Sharma', email: 'arjun@example.com', phone: '9876543210' },
    })),
    register: jest.fn(async () => ({
      accessToken: 'test-access',
      refreshToken: 'test-refresh',
      user: { id: 'u-1', name: 'Arjun Sharma', email: 'arjun@example.com', phone: '9876543210' },
    })),
    signOut: jest.fn(async () => {}),
  };
});

/**
 * No native checkout in a test run. This one always pays: it resolves with the
 * three ids a real checkout hands back for the order it was opened with. A test
 * that wants a dismissal or a failure makes `open` reject for that call.
 */
jest.mock('react-native-razorpay', () => ({
  __esModule: true,
  default: {
    open: jest.fn(async options => ({
      razorpay_payment_id: 'pay_test_1',
      razorpay_order_id: options.order_id,
      razorpay_signature: 'sig_test_1',
    })),
  },
}));

/**
 * No Firebase in a test run. `@react-native-firebase/app` is only ever reached
 * through messaging, so a bare stub is enough for it.
 */
jest.mock('@react-native-firebase/app', () => ({
  __esModule: true,
  getApp: jest.fn(() => ({ name: '[DEFAULT]' })),
}));

/**
 * A device that grants permission and has a token; the stub (and how a test
 * delivers a push through it) lives beside the tests.
 */
jest.mock('@react-native-firebase/messaging', () => require('./__tests__/helpers/firebaseMessagingMock'));

/** The signed-in screens read from here; the fixtures live beside the tests. */
jest.mock('./src/services/api', () => require('./__tests__/helpers/apiMock'));
