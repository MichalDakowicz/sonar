// eslint-disable-next-line @typescript-eslint/no-require-imports
const { patchBuildGradle } = require('../../plugins/withPingSigning');

// The part of Expo's prebuild template this plugin has to find.
const TEMPLATE = `android {
    defaultConfig {
        versionCode 1
    }
    signingConfigs {
        debug {
            storeFile file('debug.keystore')
            storePassword 'android'
            keyAlias 'androiddebugkey'
            keyPassword 'android'
        }
    }
    buildTypes {
        debug {
            signingConfig signingConfigs.debug
        }
        release {
            // Caution! In production, you need to generate your own keystore file.
            signingConfig signingConfigs.debug
            minifyEnabled enableMinifyInReleaseBuilds
        }
    }
}
`;

describe('withPingSigning', () => {
  const patched: string = patchBuildGradle(TEMPLATE);

  it('signs release with the family key, with no fallback to the debug key', () => {
    const release = patched.slice(patched.indexOf('release {'));
    expect(release).toContain('signingConfig signingConfigs.family');
    expect(release).not.toContain('signingConfigs.debug');
  });

  it('signs debug with the family key when it is there and falls back when it is not', () => {
    expect(patched).toContain(
      'signingConfig pingHasFamilyKey ? signingConfigs.family : signingConfigs.debug',
    );
  });

  it('keeps the stock debug config, which the fallback still needs', () => {
    expect(patched).toContain("storeFile file('debug.keystore')");
  });

  it('reads the credentials from the workspace, or from the file the environment names', () => {
    expect(patched).toContain("rootProject.file('../../credentials/ping-family-signing.properties')");
    expect(patched).toContain("System.getenv('PING_SIGNING_PROPERTIES')");
  });

  it('resolves storeFile against the properties file and never writes a secret', () => {
    expect(patched).toContain('new File(pingSigningFile.parentFile, pingSigningProps[\'storeFile\'])');
    expect(patched).not.toMatch(/storePassword '(?!android)/);
  });

  it('is idempotent, since prebuild runs it on every build', () => {
    expect(patchBuildGradle(patched)).toBe(patched);
  });

  it('fails loudly on a template it does not recognise rather than leaving the debug key', () => {
    expect(() => patchBuildGradle('android {\n}\n')).toThrow(/signingConfigs/);
    expect(() => patchBuildGradle(TEMPLATE.replace('signingConfig signingConfigs.debug\n        }', '}'))).toThrow(
      /debug signingConfig/,
    );
  });
});
