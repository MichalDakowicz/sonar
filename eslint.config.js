// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');

module.exports = defineConfig([
  expoConfig,
  {
    // archive/ is the retired Vite + Firebase web app, kept for reference only.
    ignores: ['dist/*', 'archive/*'],
  },
]);
