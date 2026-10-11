package com.margelo.nitro.onekeyimage

/** React Native's bundled Android assets use drawable names instead of URLs. */
internal object OneKeyImageAndroidResourceUri {
  private val drawableName = Regex("[a-z_][a-z0-9_]*")

  fun resolve(
    source: String,
    packageName: String,
    findDrawable: (String, String) -> Int,
  ): String {
    if (!drawableName.matches(source)) return source
    val resourceId = findDrawable(source, packageName)
    return if (resourceId > 0) "android.resource://$packageName/$resourceId" else source
  }
}
