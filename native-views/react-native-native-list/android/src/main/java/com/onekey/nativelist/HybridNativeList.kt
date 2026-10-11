package com.margelo.nitro.nativelist

import android.os.Handler
import android.os.Looper
import android.view.View
import com.facebook.proguard.annotations.DoNotStrip
import com.facebook.react.uimanager.ThemedReactContext

@DoNotStrip
class HybridNativeList(context: ThemedReactContext) : HybridNativeListSpec() {
  private val hostView = NativeListView(context)
  private val lifetime = NativeListLifetimeGate()
  private val uiHandler = Handler(Looper.getMainLooper())

  override val view: View = hostView

  override var scrollPositionThresholdsJson: String = ""
    set(value) {
      if (field == value) return
      field = value
      if (!lifetime.isAlive) { field = ""; return }
      dispatchToUi { hostView.setScrollPositionThresholdsJson(value) }
    }

  override var onScrollPositionThresholdChange: ((isBeyondThreshold: Boolean) -> Unit)? = null
    set(value) {
      field = value
      if (!lifetime.isAlive) { field = null; return }
      dispatchToUi { hostView.onScrollPositionThresholdChange = value }
    }

  override var containerSlotHeightsJson: String = "[]"
    set(value) {
      if (field == value) return
      field = value
      if (!lifetime.isAlive) { field = "[]"; return }
      dispatchToUi { hostView.setContainerSlotHeightsJson(value) }
    }

  override var onScrollMetrics: ((payloadJson: String) -> Unit)? = null
    set(value) {
      field = value
      if (!lifetime.isAlive) { field = null; return }
      dispatchToUi { hostView.onScrollMetrics = value }
    }

  override var snapshotJson: String = ""
    get() = field
    set(value) {
      if (field == value) return
      field = value
      if (!lifetime.isAlive) { field = ""; return }
      dispatchToUi { hostView.applySnapshot(value) }
    }

  override var keyboardDismissMode: NativeListKeyboardDismissMode = NativeListKeyboardDismissMode.NONE
    set(value) {
      if (!lifetime.isAlive) return
      if (field == value) return
      field = value
      dispatchToUi { hostView.keyboardDismissMode = value }
    }

  override var keyboardShouldPersistTaps: NativeListKeyboardShouldPersistTaps =
    NativeListKeyboardShouldPersistTaps.NEVER
    set(value) {
      if (!lifetime.isAlive) return
      if (field == value) return
      field = value
      dispatchToUi { hostView.keyboardShouldPersistTaps = value }
    }

  override var onRowAction: ((payloadJson: String) -> Unit)? = null
    set(value) {
      field = value
      if (!lifetime.isAlive) { field = null; return }
      dispatchToUi { hostView.onRowAction = value }
    }
  override var onActionAnchorInvalidated: ((payloadJson: String) -> Unit)? = null
    set(value) {
      field = value
      if (!lifetime.isAlive) { field = null; return }
      dispatchToUi { hostView.onActionAnchorInvalidated = value }
    }
  override var onSelectionDelta: ((payloadJson: String) -> Unit)? = null
    set(value) {
      field = value
      if (!lifetime.isAlive) { field = null; return }
      dispatchToUi { hostView.onSelectionDelta = value }
    }
  override var onReorder: ((payloadJson: String) -> Unit)? = null
    set(value) {
      field = value
      if (!lifetime.isAlive) { field = null; return }
      dispatchToUi { hostView.onReorder = value }
    }
  override var onEndReached: ((payloadJson: String) -> Unit)? = null
    set(value) {
      field = value
      if (!lifetime.isAlive) { field = null; return }
      dispatchToUi { hostView.onEndReached = value }
    }
  override var onVisibleRangeChanged: ((payloadJson: String) -> Unit)? = null
    set(value) {
      field = value
      if (!lifetime.isAlive) { field = null; return }
      dispatchToUi { hostView.onVisibleRangeChanged = value }
    }

  override fun applySnapshot(snapshotJson: String) {
    dispatchToUi { hostView.applySnapshot(snapshotJson) }
  }

  override fun applyPatches(patchesJson: String) {
    dispatchToUi { hostView.applyPatches(patchesJson) }
  }

  override fun reconcileSelection(selectedKeysJson: String) {
    dispatchToUi { hostView.reconcileSelection(selectedKeysJson) }
  }

  override fun scrollToKey(
    key: String,
    animated: Boolean,
    alignment: NativeListScrollAlignment,
    viewPosition: Double,
    viewOffset: Double,
  ) {
    dispatchToUi {
      hostView.scrollToKey(
        key,
        animated,
        alignment.stringValue(),
        viewPosition,
        viewOffset,
      )
    }
  }

  override fun scrollToIndex(
    index: Double,
    animated: Boolean,
    alignment: NativeListScrollAlignment,
    viewPosition: Double,
    viewOffset: Double,
  ) {
    if (!index.isFinite() || index < 0 || index % 1.0 != 0.0 || index > Int.MAX_VALUE) return
    dispatchToUi {
      hostView.scrollToIndex(
        index.toInt(),
        animated,
        alignment.stringValue(),
        viewPosition,
        viewOffset,
      )
    }
  }

  override fun scrollToOffset(offset: Double, animated: Boolean) {
    if (!offset.isFinite() || offset < 0) return
    dispatchToUi { hostView.scrollToOffset(offset, animated) }
  }

  override fun scrollToEnd(animated: Boolean) {
    dispatchToUi { hostView.scrollToEnd(animated) }
  }

  override fun setActionAnchorState(stateJson: String) {
    dispatchToUi { hostView.setActionAnchorState(stateJson) }
  }

  override fun setRefreshing(refreshing: Boolean) {
    dispatchToUi { hostView.setRefreshing(refreshing) }
  }

  override fun onDropView() {
    disposeView()
    super.onDropView()
  }

  override fun dispose() {
    disposeView()
    super.dispose()
  }

  /**
   * Nitro prop setters can run off the Android UI thread. Apply synchronously
   * during a UI commit; only off-main calls need to be posted to this host.
   */
  private fun dispatchToUi(action: () -> Unit) {
    if (!lifetime.isAlive) return
    val guarded = lifetime.guarded(action)
    if (Looper.myLooper() == Looper.getMainLooper()) guarded.run() else uiHandler.post(guarded)
  }

  private fun disposeView() {
    if (!lifetime.close()) return
    uiHandler.removeCallbacksAndMessages(null)
    // Release JS callbacks and declarative payloads even if the Hybrid wrapper is retained.
    snapshotJson = ""
    scrollPositionThresholdsJson = ""
    containerSlotHeightsJson = "[]"
    onScrollMetrics = null
    onScrollPositionThresholdChange = null
    onRowAction = null
    onActionAnchorInvalidated = null
    onSelectionDelta = null
    onReorder = null
    onEndReached = null
    onVisibleRangeChanged = null
    if (Looper.myLooper() == Looper.getMainLooper()) hostView.dispose()
    else uiHandler.post { hostView.dispose() }
  }

  private fun NativeListScrollAlignment.stringValue(): String = when (this) {
    NativeListScrollAlignment.START -> "start"
    NativeListScrollAlignment.CENTER -> "center"
    NativeListScrollAlignment.END -> "end"
    NativeListScrollAlignment.NEAREST -> "nearest"
  }
}
