package com.margelo.nitro.nativelist

/** Shrink only the named text slot after reserving fixed controls and all inter-item gaps. */
internal fun smartXTextColumnWidth(available: Int, fixedWidths: List<Int>, gaps: Int): Int =
  (available - fixedWidths.sum() - gaps.coerceAtLeast(0)).coerceAtLeast(0)

/** Preserve control order and never split a control when the engagement bar wraps. */
internal fun smartXFlowLines(widths: List<Int>, available: Int, gap: Int): List<IntRange> {
  if (widths.isEmpty()) return emptyList()
  val lines = ArrayList<IntRange>()
  var first = 0
  var lineWidth = 0
  widths.forEachIndexed { index, width ->
    if (index > first && lineWidth + gap + width > available) {
      lines.add(first until index)
      first = index
      lineWidth = 0
    }
    lineWidth += width + if (index == first) 0 else gap
  }
  lines.add(first until widths.size)
  return lines
}
