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

/** The signed-in screens read from here; the fixtures live beside the tests. */
jest.mock('./src/services/api', () => require('./__tests__/helpers/apiMock'));
