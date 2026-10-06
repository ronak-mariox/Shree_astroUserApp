module.exports = {
  presets: ['module:@react-native/babel-preset'],
  env: {
    /**
     * Jest only. Metro turns `await import('…')` into a lazy require by itself;
     * under Jest nothing does, and Node's VM refuses a real dynamic import — so
     * the lazily-loaded native SDKs (services/payments.ts, services/voiceCall.ts)
     * could never be reached, mocked or not. This gives a test run the same
     * lazy require Metro produces. The plugin ships with @babel/preset-env.
     */
    test: {
      plugins: ['@babel/plugin-transform-dynamic-import'],
    },
  },
};
