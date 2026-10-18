module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/__tests__/auth_capsule_api.test.ts'],
  transform: {
    '^.+\\.(m|c)?[tj]sx?$': [
      'babel-jest',
      { presets: ['module:@react-native/babel-preset'] },
    ],
  },
  transformIgnorePatterns: [
    'node_modules/(?!(msw|@mswjs|until-async|rettime|@open-draft|@bundled-es-modules|headers-polyfill|outvariant|strict-event-emitter|is-node-process)/)',
  ],
};