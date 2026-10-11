package com.margelo.nitro.nativelist

/** One callback subscription owns balanced interaction events, including interruption. */
internal class NativeListScrollInteractionState {
  enum class State { IDLE, DRAG, MOMENTUM }

  private var state = State.IDLE

  fun transition(next: State): List<String> {
    if (next == state) return emptyList()
    val events = ArrayList<String>(2)
    when (state) {
      State.DRAG -> events.add("endDrag")
      State.MOMENTUM -> events.add("endMomentum")
      State.IDLE -> Unit
    }
    state = next
    when (next) {
      State.DRAG -> events.add("beginDrag")
      State.MOMENTUM -> events.add("beginMomentum")
      State.IDLE -> Unit
    }
    return events
  }
}

/** Resolve deletion against the old order, never against the newly sorted positions. */
internal fun nativeListSmartXAnchorKey(
  key: String,
  previousKeys: List<String>,
  nextKeys: Set<String>,
): String? {
  if (key in nextKeys) return key
  val index = previousKeys.indexOf(key)
  if (index < 0) return null
  for (candidate in index + 1 until previousKeys.size) {
    if (previousKeys[candidate] in nextKeys) return previousKeys[candidate]
  }
  for (candidate in index - 1 downTo 0) {
    if (previousKeys[candidate] in nextKeys) return previousKeys[candidate]
  }
  return null
}
