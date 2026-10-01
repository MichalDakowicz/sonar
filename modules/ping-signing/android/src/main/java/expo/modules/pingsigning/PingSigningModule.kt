package expo.modules.pingsigning

import android.content.pm.PackageManager
import android.content.pm.Signature
import android.os.Build
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import java.security.MessageDigest

/**
 * Who signed an installed app (PING.md §9.13).
 *
 * A package name proves nothing on a sideloaded phone: any app can be built
 * under a sibling's name, and an explicit intent to that name would reach it.
 * The certificate is what cannot be copied, so before a sign-in is handed to
 * (or accepted from) a sibling the family compares what Android reports here
 * with the fingerprints pinned in lib/pingApps.
 *
 * This only reports. Whether the answer is good enough is decided in JS, in a
 * pure function with tests; keeping the policy out of Kotlin means a change of
 * key is a one-line edit in the family table, not a native change.
 */
class PingSigningModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("PingSigning")

    /**
     * SHA-256 of every certificate the package is signed with, lowercase hex.
     * Empty when the package is not installed or not visible — a sibling needs
     * its `<queries>` entry from withPingSiblings, the same as the install check.
     */
    Function("signerDigests") { packageName: String -> signerDigestsOf(packageName) }
  }

  private fun signerDigestsOf(packageName: String): List<String> {
    val context = appContext.reactContext ?: return emptyList()
    return signaturesOf(context.packageManager, packageName).map { sha256Hex(it.toByteArray()) }
  }

  private fun signaturesOf(packageManager: PackageManager, packageName: String): List<Signature> {
    return try {
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
        // The certificates the installed APK is signed with *now*. Not the rotation
        // history: an app that once carried a pinned key must not count as having it.
        val info = packageManager.getPackageInfo(packageName, PackageManager.GET_SIGNING_CERTIFICATES)
        info.signingInfo?.apkContentsSigners?.toList().orEmpty()
      } else {
        @Suppress("DEPRECATION")
        val info = packageManager.getPackageInfo(packageName, PackageManager.GET_SIGNATURES)
        @Suppress("DEPRECATION")
        info.signatures?.toList().orEmpty()
      }
    } catch (_: PackageManager.NameNotFoundException) {
      emptyList()
    }
  }

  private fun sha256Hex(bytes: ByteArray): String =
    MessageDigest.getInstance("SHA-256").digest(bytes).joinToString("") { "%02x".format(it) }
}
