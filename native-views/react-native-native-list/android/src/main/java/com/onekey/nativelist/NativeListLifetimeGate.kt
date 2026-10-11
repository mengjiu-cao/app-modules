package com.margelo.nitro.nativelist

import java.util.concurrent.atomic.AtomicBoolean

/** Final host lifetime; temporary detach never closes this gate. */
internal class NativeListLifetimeGate {
  private val alive = AtomicBoolean(true)
  val isAlive: Boolean get() = alive.get()

  /** Returns true once, so final cleanup cannot run twice. */
  fun close(): Boolean = alive.compareAndSet(true, false)

  fun guarded(action: () -> Unit): Runnable = Runnable {
    if (isAlive) action()
  }
}
