package com.margelo.nitro.nativelist

/** Image callbacks belong to a request epoch, independently of text/action binding updates. */
internal class NativeListSmartXImageState {
  enum class Phase { EMPTY, PENDING, DISPLAYED, FAILED }
  var phase: Phase = Phase.EMPTY
    private set
  private var identity: String? = null
  private var epoch = 0L

  fun bind(requestIdentity: String): Long {
    if (identity != requestIdentity) {
      identity = requestIdentity
      epoch++
      phase = Phase.PENDING
    }
    return epoch
  }

  fun complete(requestEpoch: Long, displayed: Boolean): Boolean {
    if (requestEpoch != epoch || identity == null) return false
    phase = if (displayed) Phase.DISPLAYED else Phase.FAILED
    return true
  }

  fun recycle() {
    epoch++
    identity = null
    phase = Phase.EMPTY
  }
}
