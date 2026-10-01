/**
 * Signs Lidar, Sonar, Pulsar and Cellar with the one Ping family key (PING.md §9.13).
 *
 * Expo prebuild signs with a stock debug keystore — one file, password `android`, the
 * same in every app — so a sibling that pins "this app's certificate" pins something
 * anyone can sign with. This swaps in a private key, kept outside every repo.
 *
 * `android/` is prebuild output, so editing `app/build.gradle` by hand does not survive
 * `expo prebuild`; the plugin re-applies the signing config each time. Credentials come
 * from `../../credentials/ping-family-signing.properties` relative to `android/` — that
 * is `<workspace>/credentials/` — or from the file named by `PING_SIGNING_PROPERTIES`
 * (a worktree outside the workspace needs that). `storeFile` inside it is relative to
 * the properties file.
 *
 *  - Release builds always use the family key. Without the credentials the release
 *    build fails at signing validation rather than quietly falling back to the debug
 *    key — an APK signed with the wrong key does not install over the right one, and
 *    the siblings would refuse to hand it a sign-in.
 *  - Debug builds use it too when it is there, so a dev build is the same app as the
 *    release one to the phone and to its siblings. Without it they fall back to debug.
 *
 * Identical in Lidar, Sonar, Pulsar and Cellar. Radar has its own upload key
 * (plugins/withUploadSigning.js) and does not use this.
 */
const { withAppBuildGradle } = require('expo/config-plugins');

const MARKER = 'pingHasFamilyKey';

const SIGNING_BLOCK = `    def pingSigningEnv = System.getenv('PING_SIGNING_PROPERTIES')
    def pingSigningFile = pingSigningEnv ? new File(pingSigningEnv) : rootProject.file('../../credentials/ping-family-signing.properties')
    def pingSigningProps = new Properties()
    if (pingSigningFile.exists()) {
        pingSigningFile.withInputStream { pingSigningProps.load(it) }
    }
    def pingHasFamilyKey = pingSigningProps.containsKey('storeFile')

    signingConfigs {
        family {
            if (pingHasFamilyKey) {
                storeFile new File(pingSigningFile.parentFile, pingSigningProps['storeFile'])
                storePassword pingSigningProps['storePassword']
                keyAlias pingSigningProps['keyAlias']
                keyPassword pingSigningProps['keyPassword']
            }
        }
`;

function patchBuildGradle(contents) {
  if (contents.includes(MARKER)) return contents;

  const withSigningConfig = contents.replace(/^ {4}signingConfigs \{\n/m, SIGNING_BLOCK);
  if (withSigningConfig === contents) {
    throw new Error('withPingSigning: could not find the signingConfigs block in app/build.gradle');
  }

  const withDebug = withSigningConfig.replace(
    /(buildTypes \{\n\s*debug \{\n\s*)signingConfig signingConfigs\.debug/,
    '$1signingConfig pingHasFamilyKey ? signingConfigs.family : signingConfigs.debug',
  );
  if (withDebug === withSigningConfig) {
    throw new Error('withPingSigning: could not find the debug signingConfig in app/build.gradle');
  }

  const withRelease = withDebug.replace(
    /(release \{\n(?:.*\n)*?\s*)signingConfig signingConfigs\.debug/,
    '$1signingConfig signingConfigs.family',
  );
  if (withRelease === withDebug) {
    throw new Error('withPingSigning: could not find the release signingConfig in app/build.gradle');
  }

  return withRelease;
}

module.exports = function withPingSigning(config) {
  return withAppBuildGradle(config, (cfg) => {
    cfg.modResults.contents = patchBuildGradle(cfg.modResults.contents);
    return cfg;
  });
};
module.exports.patchBuildGradle = patchBuildGradle;
