// jest-expo (SDK 58) requires 'expo-modules-core', which npm nests under expo
// instead of hoisting; resolve it from there rather than depend on it directly.
const expoModulesCore = require.resolve('expo-modules-core', {
  paths: [require.resolve('expo')],
});

module.exports = {
  preset: 'jest-expo',
  moduleNameMapper: {
    '^expo-modules-core$': expoModulesCore,
    '^@react-native-async-storage/async-storage$':
      '@react-native-async-storage/async-storage/jest/async-storage-mock',
  },
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?)|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@unimodules/.*|unimodules|sentry-expo|native-base|react-native-svg)',
  ],
};
