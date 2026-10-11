package com.margelo.nitro.nativelist

import org.junit.Assert.assertEquals
import org.junit.Test

class NativeListSmartXGeometryTest {
  @Test fun nameShrinksBeforeTimestampTagOrMenu() {
    assertEquals(124, smartXTextColumnWidth(240, listOf(56, 48), 12))
    assertEquals(0, smartXTextColumnWidth(80, listOf(56, 48), 12))
  }
  @Test fun exactFitKeepsLikeAndLinkOnOneLine() {
    assertEquals(listOf(0..1), smartXFlowLines(listOf(34, 158), 200, 8))
  }
  @Test fun growingLikeCountReflowsWithoutDroppingLink() {
    assertEquals(listOf(0..0, 1..1), smartXFlowLines(listOf(42, 158), 200, 8))
  }
  @Test fun oversizedControlAndNarrowViewportStillTerminate() {
    assertEquals(listOf(0..0, 1..1, 2..2), smartXFlowLines(listOf(34, 400, 20), 0, 8))
  }
  @Test fun multipleWrappedControlsPreserveOrder() {
    assertEquals(listOf(0..1, 2..3, 4..4), smartXFlowLines(listOf(34, 100, 60, 74, 100), 142, 8))
    assertEquals(emptyList<IntRange>(), smartXFlowLines(emptyList(), 100, 8))
  }
}
