package com.margelo.nitro.nativelist

private val smartXCjkCharacters = Regex("[\\u2E80-\\u9FFF\\uF900-\\uFAFF\\u3000-\\u303F\\uFF00-\\uFFEF]")

/** Matches SmartX ThemedText: only a plain string child receives its existing CJK line padding. */
internal fun smartXLineHeight(base: Int, text: CharSequence, themedString: Boolean = true): Int =
  if (themedString && text is String && smartXCjkCharacters.containsMatchIn(text)) base + 2 else base
