package com.margelo.nitro.nativelist

import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test

class NativeListLifetimeGateTest {
  @Test
  fun queuedSnapshotAndPatchCannotRefillAClosedHost() {
    val lifetime = NativeListLifetimeGate()
    val rows = mutableListOf<String>()
    val snapshot = lifetime.guarded { rows.add("snapshot") }
    val patch = lifetime.guarded { rows.add("patch") }
    assertTrue(lifetime.close())
    snapshot.run()
    patch.run()
    assertTrue(rows.isEmpty())
  }

  @Test
  fun temporaryDetachKeepsLifetimeAndFinalCloseIsIdempotent() {
    val lifetime = NativeListLifetimeGate()
    var updates = 0
    val update = lifetime.guarded { updates++ }
    update.run()
    // Detach has no final-lifetime action; the retained host may reattach.
    update.run()
    assertEquals(2, updates)
    assertTrue(lifetime.close())
    assertFalse(lifetime.close())
    lifetime.guarded { updates++ }.run()
    assertEquals(2, updates)
  }

  @Test
  fun replacementHostDoesNotReviveOldQueuedWork() {
    val old = NativeListLifetimeGate()
    var updates = 0
    val stale = old.guarded { updates += 100 }
    old.close()
    val replacement = NativeListLifetimeGate()
    replacement.guarded { updates++ }.run()
    stale.run()
    assertEquals(1, updates)
    assertTrue(replacement.isAlive)
  }
}
