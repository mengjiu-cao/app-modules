package com.margelo.nitro.nativelist

import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test

class NativeListSmartXImageStateTest {
  @Test fun textRebindKeepsPendingRequestAndCompletedImage() {
    val state = NativeListSmartXImageState()
    val epoch = state.bind("author-1:avatar:https://image/1")
    assertEquals(NativeListSmartXImageState.Phase.PENDING, state.phase)
    assertEquals(epoch, state.bind("author-1:avatar:https://image/1"))
    assertTrue(state.complete(epoch, true))
    state.bind("author-1:avatar:https://image/1")
    assertEquals(NativeListSmartXImageState.Phase.DISPLAYED, state.phase)
  }
  @Test fun keyChangeShowsPendingAndRejectsPreviousCompletion() {
    val state = NativeListSmartXImageState()
    val old = state.bind("author-1:avatar:https://image")
    val current = state.bind("author-2:avatar:https://image")
    assertFalse(state.complete(old, true))
    assertEquals(NativeListSmartXImageState.Phase.PENDING, state.phase)
    assertTrue(state.complete(current, false))
    assertEquals(NativeListSmartXImageState.Phase.FAILED, state.phase)
  }
  @Test fun recycleRejectsLateLoadAndError() {
    val state = NativeListSmartXImageState()
    val epoch = state.bind("author-1:avatar:https://image")
    state.recycle()
    assertFalse(state.complete(epoch, true))
    assertFalse(state.complete(epoch, false))
    assertEquals(NativeListSmartXImageState.Phase.EMPTY, state.phase)
  }
}
