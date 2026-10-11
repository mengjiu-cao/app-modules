package com.margelo.nitro.onekeyimage

import org.junit.Assert.assertEquals
import org.junit.Test

class OneKeyImageAndroidResourceUriTest {
  @Test
  fun bundledAssetUsesTheConsumerPackageAndResolvedResourceId() {
    var lookups = 0
    val resolved = OneKeyImageAndroidResourceUri.resolve(
      "assets_images_default_avatar", "com.consumer.preview",
    ) { name, packageName ->
      lookups++
      assertEquals("assets_images_default_avatar", name)
      assertEquals("com.consumer.preview", packageName)
      0x7f08007b
    }
    assertEquals("android.resource://com.consumer.preview/2131230843", resolved)
    assertEquals(1, lookups)
  }

  @Test
  fun missingResourceKeepsTheOriginalSource() {
    for (result in listOf(0, -1)) {
      assertEquals("missing_image", OneKeyImageAndroidResourceUri.resolve("missing_image", "test") { _, _ -> result })
    }
  }

  @Test
  fun existingUrisAndNonResourcePathsNeverReachTheResourceLookup() {
    val sources = listOf(
      "https://example.test/avatar.jpg", "http://10.0.2.2:8091/assets/avatar.jpg",
      "file:///data/avatar.jpg", "content://images/avatar", "data:image/png;base64,AA==",
      "android.resource://test/2131230843", "/data/avatar.jpg", "images/avatar.jpg",
      "avatar.jpg", "bad-name", "", " ", " assets_images_default_avatar", "2131230843",
    )
    for (source in sources) {
      assertEquals(source, OneKeyImageAndroidResourceUri.resolve(source, "test") { _, _ ->
        error("Unexpected resource lookup for $source")
      })
    }
  }
}
