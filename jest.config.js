module.exports = {
  preset: '@react-native/jest-preset',
  setupFiles: ['<rootDir>/jest.setup.js'],
  /** __tests__/helpers holds shared stubs, not suites of their own. */
  testPathIgnorePatterns: ['/node_modules/', '<rootDir>/__tests__/helpers/'],
  /**
   * The preset transforms react-native itself but leaves the rest of
   * node_modules alone. react-native-image-picker ships untranspiled ESM
   * TypeScript, so without adding it here every test that reaches App.tsx
   * fails to parse it.
   */
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?|react-native-image-picker|react-native-keychain)/)',
  ],
};
