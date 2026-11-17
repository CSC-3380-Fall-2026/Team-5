// Jest has no native WebView runtime; map bridge/HTML behavior is tested separately.
jest.mock('react-native-webview', () => {
  const {View} = require('react-native');
  return {WebView: View, default: View};
});
