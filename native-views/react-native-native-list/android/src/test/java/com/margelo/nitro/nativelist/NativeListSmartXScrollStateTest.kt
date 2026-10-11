package com.margelo.nitro.nativelist

import org.junit.Assert.assertEquals
import org.junit.Assert.assertNull
import org.junit.Test
import com.margelo.nitro.nativelist.NativeListScrollInteractionState.State

class NativeListSmartXScrollStateTest {
  @Test fun dragWithoutFlingHasOneTerminalEvent() {
    val state = NativeListScrollInteractionState()
    assertEquals(listOf("beginDrag"), state.transition(State.DRAG))
    assertEquals(emptyList<String>(), state.transition(State.DRAG))
    assertEquals(listOf("endDrag"), state.transition(State.IDLE))
    assertEquals(emptyList<String>(), state.transition(State.IDLE))
  }

  @Test fun flingClosesDragBeforeOpeningMomentum() {
    val state = NativeListScrollInteractionState()
    state.transition(State.DRAG)
    assertEquals(listOf("endDrag", "beginMomentum"), state.transition(State.MOMENTUM))
    assertEquals(listOf("endMomentum"), state.transition(State.IDLE))
  }

  @Test fun interruptedMomentumClosesBeforeNewDrag() {
    val state = NativeListScrollInteractionState()
    state.transition(State.MOMENTUM)
    assertEquals(listOf("endMomentum", "beginDrag"), state.transition(State.DRAG))
    assertEquals(listOf("endDrag"), state.transition(State.IDLE))
  }

  @Test fun programmaticMomentumIsBalanced() {
    val state = NativeListScrollInteractionState()
    assertEquals(listOf("beginMomentum"), state.transition(State.MOMENTUM))
    assertEquals(listOf("endMomentum"), state.transition(State.IDLE))
  }

  @Test fun preservedKeySurvivesReorderingAndAppend() {
    assertEquals("b", nativeListSmartXAnchorKey("b", listOf("a", "b", "c"), setOf("c", "b", "d")))
  }

  @Test fun deletionPrefersNearestSurvivingOldSuccessor() {
    assertEquals("d", nativeListSmartXAnchorKey("b", listOf("a", "b", "c", "d", "e"), setOf("a", "d", "e")))
  }

  @Test fun deletionWithoutSuccessorUsesNearestPredecessor() {
    assertEquals("b", nativeListSmartXAnchorKey("d", listOf("a", "b", "c", "d"), setOf("a", "b")))
  }

  @Test fun fullyReplacedDataCannotRestoreAnUnrelatedRow() {
    assertNull(nativeListSmartXAnchorKey("b", listOf("a", "b"), setOf("x", "y")))
    assertNull(nativeListSmartXAnchorKey("missing", listOf("a", "b"), setOf("a")))
  }
}
