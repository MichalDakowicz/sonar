/**
 * Raises the Gradle daemon's heap and metaspace for the release build.
 *
 * `android/` is prebuild output, so editing `gradle.properties` by hand does not survive
 * `expo prebuild`. This re-applies the bump every time.
 *
 * The default Expo template asks for 2 GB heap and 512 MB metaspace, which this project's
 * release build exhausts: the Kotlin compile of the Expo modules plus the lint analysis
 * die with a bare `Metaspace` error part-way through, and the failure surfaces as an
 * unrelated task ("Could not initialize class …ProtoBuf$Annotation$Argument"), which is
 * what makes it worth a plugin and a comment rather than a note in a README.
 *
 * Unrelated but adjacent gotcha, since this is where you will look: the CMake configure
 * tasks fail under JDK 24+ with "A restricted method in java.lang.System has been
 * called". Build with a JDK 21 — Android Studio ships one at
 * `<studio>/jbr` — rather than the machine's default JDK 25.
 */
const { withGradleProperties } = require('expo/config-plugins');

const JVM_ARGS = '-Xmx4608m -XX:MaxMetaspaceSize=1536m';

module.exports = function withGradleMemory(config) {
  return withGradleProperties(config, (gradleConfig) => {
    const existing = gradleConfig.modResults.find(
      (item) => item.type === 'property' && item.key === 'org.gradle.jvmargs',
    );

    if (existing) existing.value = JVM_ARGS;
    else gradleConfig.modResults.push({ type: 'property', key: 'org.gradle.jvmargs', value: JVM_ARGS });

    return gradleConfig;
  });
};
