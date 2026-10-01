package expo.modules.shareintent

import android.content.Intent
import androidx.core.os.bundleOf
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

/**
 * Text shared into Sonar from another app.
 *
 * Deep links arrive as ACTION_VIEW with a data URI, which expo-linking already
 * surfaces. A *share* arrives as ACTION_SEND with the payload in EXTRA_TEXT and
 * no data URI at all, so `Linking.getInitialURL()` returns null for it and
 * nothing in JS ever sees it. This module is the missing half: the same shape
 * expo-linking exposes (read the pending value, clear it, subscribe for later
 * ones), for the extra rather than the URI.
 *
 * Two arrival paths, both covered:
 *  - cold start, where the share launched the activity and the value is sitting
 *    on the activity's own intent when JS first asks for it
 *  - warm start, where MainActivity is singleTask so the share comes through
 *    onNewIntent and is pushed to JS as an event
 */
class ShareIntentModule : Module() {
  private var pendingText: String? = null

  override fun definition() = ModuleDefinition {
    Name("ShareIntent")

    Events("onSharedText")

    // Read lazily rather than in OnCreate: the module can be constructed before
    // the activity is attached, and by the time JS asks, it always is.
    Function("getSharedText") {
      pendingText ?: sharedTextOf(appContext.currentActivity?.intent).also { pendingText = it }
    }

    Function("clearSharedText") {
      pendingText = null
      // Also strip it off the activity, or a remount would re-read the same
      // share and reopen the sheet over work the user has already done.
      appContext.currentActivity?.intent?.removeExtra(Intent.EXTRA_TEXT)
    }

    OnNewIntent { intent ->
      sharedTextOf(intent)?.let { text ->
        pendingText = text
        sendEvent("onSharedText", bundleOf("text" to text))
      }
    }
  }

  /** The shared text, or null when this intent is not a text share at all. */
  private fun sharedTextOf(intent: Intent?): String? {
    if (intent == null || intent.action != Intent.ACTION_SEND) return null
    if (intent.type?.startsWith("text/") != true) return null
    return intent.getStringExtra(Intent.EXTRA_TEXT)?.trim()?.takeIf { it.isNotEmpty() }
  }
}
