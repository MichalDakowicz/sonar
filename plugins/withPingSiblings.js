/**
 * Makes the other Ping apps visible to this one on Android 11+.
 *
 * Package visibility hides every app a manifest does not name, so without these
 * `<queries>` entries the login screen's install check (useInstalledSiblings)
 * finds nothing and the continue-from-a-sibling row never shows. It fails
 * quietly: no error, just an empty row. `android/` is prebuild output, so the
 * entries have to be re-applied on every prebuild — hence a plugin.
 *
 * The list must match PING_APPS in src/lib/pingApps.ts; pingApps.test.ts fails
 * when the two drift. Identical in every Ping app.
 */
const { withAndroidManifest } = require('expo/config-plugins');

const PING_PACKAGES = [
  'com.michaldakowicz.radar',
  'com.michaldakowicz.lidar',
  'com.michaldakowicz.sonar',
  'com.michaldakowicz.pulsar',
  'com.michaldakowicz.cellar',
];

function addPingQueries(manifest, ownPackage) {
  if (!manifest.queries) manifest.queries = [{}];
  const queries = manifest.queries[0];
  const listed = new Set((queries.package ?? []).map((entry) => entry.$['android:name']));
  const missing = PING_PACKAGES.filter((name) => name !== ownPackage && !listed.has(name));
  queries.package = [...(queries.package ?? []), ...missing.map((name) => ({ $: { 'android:name': name } }))];
  return manifest;
}

function withPingSiblings(config) {
  return withAndroidManifest(config, (cfg) => {
    addPingQueries(cfg.modResults.manifest, cfg.android?.package);
    return cfg;
  });
}

module.exports = withPingSiblings;
module.exports.PING_PACKAGES = PING_PACKAGES;
module.exports.addPingQueries = addPingQueries;
