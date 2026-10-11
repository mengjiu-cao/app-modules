"use strict";

import React, { forwardRef, useEffect, useImperativeHandle, useMemo, useRef, useState } from 'react';
import { OneKeyImageCache, OneKeyImageCachePolicy } from '@onekeyfe/react-native-image';
import { NativeAvatarPrefetchModel, NativeAvatarPrefetchQueue } from "./avatarPrefetch.js";
import { View } from 'react-native';
import { callback, getHostComponent } from 'react-native-nitro-modules';
import { isSelectableRow } from "./selection.js";
import { normalizeIndexScroll, normalizeKeyScroll, normalizePositionScroll, resolveLocationIndex, scrollFailure, validateOffset } from "./scrolling.js";
import { applyRowPatches, serializePatches, serializeSnapshot } from "./validation.js";
import { jsx as _jsx } from "react/jsx-runtime";
const NativeListConfig = require('../nitrogen/generated/shared/json/NativeListConfig.json');
const NativeListHost = getHostComponent('NativeList', () => NativeListConfig);
export function preloadNativeListAvatarImages(sources) {
  return OneKeyImageCache.preload(sources.map(source => ({
    uri: source.uri,
    headers: source.headers,
    resizeWidth: source.width,
    resizeHeight: source.height,
    optimizeTos: source.optimizeTos !== false,
    overscan: source.overscan,
    cachePolicy: source.cachePolicy === 'memory' ? OneKeyImageCachePolicy.MEMORY : source.cachePolicy === 'disk' ? OneKeyImageCachePolicy.DISK : OneKeyImageCachePolicy.MEMORY_DISK
  })));
}
function parsePayload(payloadJson) {
  return JSON.parse(payloadJson);
}
export const NativeList = /*#__PURE__*/forwardRef(function NativeList({
  snapshot,
  listHeader,
  listFooter,
  listEmpty,
  scrollPositionThresholds,
  webVirtualizationEnabled: _webVirtualizationEnabled,
  webSectionIndexContainerRef: _webSectionIndexContainerRef,
  keyboardDismissMode = 'none',
  keyboardShouldPersistTaps = 'never',
  onRowAction,
  onActionAnchorInvalidated,
  onSelectionDelta,
  onReorder,
  onEndReached,
  onVisibleRangeChanged,
  onScrollPositionThresholdChange,
  onScrollMetrics,
  onRefresh,
  onScrollToIndexFailed,
  initialScrollIndex,
  initialScrollKey,
  initialScrollViewPosition,
  initialScrollViewOffset,
  ...viewProps
}, forwardedRef) {
  const [slotHeights, setSlotHeights] = useState([0, 0, 0]);
  const containerSlotHeightsJson = JSON.stringify(slotHeights);
  const slotInset = snapshot.layout.contentPaddingHorizontal ?? snapshot.layout.contentPadding ?? 0;
  if (snapshot.layout.orientation === 'horizontal' && (listHeader || listEmpty || listFooter)) {
    throw new Error('NativeList container slots require vertical orientation');
  }
  const slotContents = [listHeader, listEmpty, listFooter];
  const normalizedKeyboardShouldPersistTaps = keyboardShouldPersistTaps === true ? 'always' : keyboardShouldPersistTaps === false ? 'never' : keyboardShouldPersistTaps;
  const nativeRef = useRef(null);
  const lastNativeRef = useRef(null);
  const pendingSnapshotRef = useRef(false);
  const refreshingOverrideRef = useRef(undefined);
  const callbacksRef = useRef({
    onRowAction,
    onActionAnchorInvalidated,
    onSelectionDelta,
    onReorder,
    onEndReached,
    onVisibleRangeChanged,
    onScrollPositionThresholdChange,
    onScrollMetrics,
    onRefresh,
    onScrollToIndexFailed
  });
  callbacksRef.current = {
    onRowAction,
    onActionAnchorInvalidated,
    onSelectionDelta,
    onReorder,
    onEndReached,
    onVisibleRangeChanged,
    onScrollPositionThresholdChange,
    onScrollMetrics,
    onRefresh,
    onScrollToIndexFailed
  };
  const scrollPositionThresholdsJson = useMemo(() => {
    if (!scrollPositionThresholds || scrollPositionThresholds.enabled === false) return '';
    const {
      start,
      end
    } = scrollPositionThresholds;
    if (!Number.isFinite(start) || !Number.isFinite(end) || start < 0 || end <= start) {
      throw new Error('scrollPositionThresholds requires 0 <= start < end and finite values');
    }
    return JSON.stringify({
      start,
      end
    });
  }, [scrollPositionThresholds]);
  const snapshotJson = useMemo(() => serializeSnapshot(snapshot), [snapshot]);
  const snapshotRef = useRef(snapshot);
  const previousSnapshotJsonRef = useRef(snapshotJson);
  const snapshotChanged = previousSnapshotJsonRef.current !== snapshotJson;
  if (snapshotChanged) {
    snapshotRef.current = snapshot;
    previousSnapshotJsonRef.current = snapshotJson;
    // A declarative snapshot is authoritative, including its refreshing state.
    pendingSnapshotRef.current = false;
    refreshingOverrideRef.current = undefined;
  }
  // OneKey patch: range events already cross the bridge only when row indices
  // change. Prefetch is optional work; scrolling and visible loads stay native.
  const avatarQueueRef = useRef(null);
  const avatarRangeRef = useRef(undefined);
  // OneKey patch: a changed prop is a complete snapshot; unrelated renders must
  // not erase image patches already dispatched through the imperative handle.
  // const avatarPrefetchPaused = useRef(false);
  const avatarModelRef = useRef(null);
  const avatarLifecycle = useRef('pending');
  if (!avatarModelRef.current) avatarModelRef.current = new NativeAvatarPrefetchModel(snapshot.rows);else if (snapshotChanged) avatarModelRef.current.replaceSnapshot(snapshot.rows);
  const updateAvatarPrefetch = () => {
    const range = avatarRangeRef.current;
    if (!range) return;
    avatarQueueRef.current?.update(avatarModelRef.current?.window(range.first, range.last, range.direction) ?? []);
  };
  const updateAvatarPrefetchRef = useRef(updateAvatarPrefetch);
  updateAvatarPrefetchRef.current = updateAvatarPrefetch;
  useEffect(() => {
    avatarLifecycle.current = 'mounted';
    // React can replay effect cleanup/setup without replacing the Fabric host.
    // Restore only the host already accepted before that cleanup.
    if (!nativeRef.current && lastNativeRef.current) {
      bindNativeRefCallbackRef.current(lastNativeRef.current);
    }
    const queue = new NativeAvatarPrefetchQueue(source => preloadNativeListAvatarImages([source]));
    avatarQueueRef.current = queue;
    updateAvatarPrefetchRef.current();
    return () => {
      queue.dispose();
      avatarQueueRef.current = null;
      avatarLifecycle.current = 'unmounted';
      nativeRef.current = null;
    };
  }, []);
  useEffect(() => {
    updateAvatarPrefetchRef.current();
  }, [snapshot]);
  const initialScrollRef = useRef(initialScrollIndex === undefined && initialScrollKey === undefined ? undefined : initialScrollIndex !== undefined ? normalizeIndexScroll({
    index: initialScrollIndex,
    animated: false,
    viewPosition: initialScrollViewPosition,
    viewOffset: initialScrollViewOffset
  }) : {
    key: initialScrollKey,
    scroll: normalizePositionScroll({
      animated: false,
      viewPosition: initialScrollViewPosition,
      viewOffset: initialScrollViewOffset
    }, 'start')
  });
  const didApplyInitialScroll = useRef(false);
  const emitIndexFailure = (index, reason) => {
    callbacksRef.current.onScrollToIndexFailed?.(scrollFailure(snapshotRef.current.rows, index, reason));
  };
  const dispatchIndexScroll = (index, scroll) => {
    if (index >= snapshotRef.current.rows.length) {
      emitIndexFailure(index, 'index-out-of-range');
      return;
    }
    nativeRef.current?.scrollToIndex(index, scroll.animated, scroll.alignment, scroll.viewPosition, scroll.viewOffset);
  };
  const dispatchKeyScroll = (key, scroll) => {
    nativeRef.current?.scrollToKey(key, scroll.animated, scroll.alignment, scroll.viewPosition, scroll.viewOffset);
  };
  const applyInitialScroll = () => {
    if (didApplyInitialScroll.current || !nativeRef.current) return;
    didApplyInitialScroll.current = true;
    const initial = initialScrollRef.current;
    if (!initial) return;
    if (initial.index !== undefined) dispatchIndexScroll(initial.index, initial.scroll);else if (initial.key !== undefined) dispatchKeyScroll(initial.key, initial.scroll);
  };
  const applyInitialScrollCallbackRef = useRef(applyInitialScroll);
  applyInitialScrollCallbackRef.current = applyInitialScroll;
  useImperativeHandle(forwardedRef, () => ({
    applySnapshot(nextSnapshot) {
      const nextSnapshotJson = serializeSnapshot(nextSnapshot);
      const native = nativeRef.current;
      native?.applySnapshot(nextSnapshotJson);
      snapshotRef.current = nextSnapshot;
      pendingSnapshotRef.current = !native;
      refreshingOverrideRef.current = undefined;
      avatarModelRef.current?.replaceSnapshot(nextSnapshot.rows);
      if (native && avatarLifecycle.current !== 'unmounted') {
        updateAvatarPrefetchRef.current();
      }
    },
    applyPatches(patches) {
      if (patches.length === 0) return;
      const nextSnapshot = applyRowPatches(snapshotRef.current, patches);
      const native = nativeRef.current;
      if (!native) {
        // The JS handle is usable before Nitro creates the native host. Keep
        // one complete validated state instead of losing or replaying patches
        // against a host that has never received their structural baseline.
        snapshotRef.current = nextSnapshot;
        pendingSnapshotRef.current = true;
        avatarModelRef.current?.replaceSnapshot(nextSnapshot.rows);
        return;
      }
      const dispatch = () => {
        native.applyPatches(serializePatches(patches));
        snapshotRef.current = nextSnapshot;
      };
      if (avatarModelRef.current?.applyPatches(patches, dispatch)) updateAvatarPrefetchRef.current();
    },
    reconcileSelection(selectedKeys) {
      nativeRef.current?.reconcileSelection(JSON.stringify(selectedKeys));
      const current = snapshotRef.current;
      if (current.selection && (current.selection.mode !== 'single' || selectedKeys.length <= 1) && selectedKeys.every(key => current.rows.some(row => row.key === key && isSelectableRow(row)))) {
        snapshotRef.current = {
          ...current,
          selection: {
            ...current.selection,
            selectedKeys
          }
        };
      }
    },
    scrollToKey(paramsOrKey, animated, alignment) {
      const {
        key,
        scroll
      } = normalizeKeyScroll(paramsOrKey, animated, alignment);
      dispatchKeyScroll(key, scroll);
    },
    scrollToIndex(paramsOrIndex, animated, alignment) {
      const {
        index,
        scroll
      } = normalizeIndexScroll(paramsOrIndex, animated, alignment);
      dispatchIndexScroll(index, scroll);
    },
    scrollToItem(params) {
      const index = snapshotRef.current.rows.findIndex(row => row.key === params.item.key);
      if (index < 0) {
        emitIndexFailure(-1, 'item-not-found');
        return;
      }
      dispatchKeyScroll(params.item.key, normalizePositionScroll(params, 'start'));
    },
    scrollToOffset({
      offset,
      animated = true
    }) {
      validateOffset(offset);
      nativeRef.current?.scrollToOffset(offset, animated);
    },
    scrollToEnd({
      animated = true
    } = {}) {
      nativeRef.current?.scrollToEnd(animated);
    },
    scrollToLocation(params) {
      const index = resolveLocationIndex(snapshotRef.current.rows, params);
      if (index === undefined) {
        const sectionCount = snapshotRef.current.rows.filter(row => row.type === 'sectionHeader' && row.variant !== 'summary').length;
        emitIndexFailure(params.itemIndex, params.sectionIndex >= sectionCount ? 'section-out-of-range' : 'item-out-of-range');
        return;
      }
      dispatchIndexScroll(index, normalizePositionScroll(params, 'start'));
    },
    setActionAnchorState(state) {
      nativeRef.current?.setActionAnchorState(JSON.stringify(state));
    },
    setRefreshing(refreshing) {
      nativeRef.current?.setRefreshing(refreshing);
      refreshingOverrideRef.current = refreshing;
    }
  }));
  const bindNativeRef = native => {
    if (avatarLifecycle.current === 'unmounted') return;
    const replacingHost = lastNativeRef.current !== null && lastNativeRef.current !== native;
    const restoringHost = nativeRef.current === null && lastNativeRef.current === native;
    nativeRef.current = native;
    lastNativeRef.current = native;
    if (pendingSnapshotRef.current || replacingHost) {
      native.applySnapshot(serializeSnapshot(snapshotRef.current));
      pendingSnapshotRef.current = false;
    }
    if (refreshingOverrideRef.current !== undefined && (restoringHost || replacingHost || !didApplyInitialScroll.current)) {
      native.setRefreshing(refreshingOverrideRef.current);
    }
    updateAvatarPrefetchRef.current();
    applyInitialScrollCallbackRef.current();
  };
  const bindNativeRefCallbackRef = useRef(bindNativeRef);
  bindNativeRefCallbackRef.current = bindNativeRef;
  const wantsScrollMetrics = onScrollMetrics != null;
  const nativeCallbacks = useMemo(() => ({
    hybridRef: callback(ref => {
      bindNativeRefCallbackRef.current(ref);
    }),
    onScrollMetrics: wantsScrollMetrics ? callback(payloadJson => {
      if (avatarLifecycle.current === 'unmounted') return;
      callbacksRef.current.onScrollMetrics?.(parsePayload(payloadJson));
    }) : undefined,
    onRowAction: callback(payloadJson => {
      if (avatarLifecycle.current === 'unmounted') return;
      const payload = parsePayload(payloadJson);
      if (payload.actionKey === 'nativeList.refresh' && payload.rowKey === undefined) {
        callbacksRef.current.onRefresh?.();
        return;
      }
      callbacksRef.current.onRowAction?.(payload);
    }),
    onActionAnchorInvalidated: callback(payloadJson => {
      if (avatarLifecycle.current === 'unmounted') return;
      callbacksRef.current.onActionAnchorInvalidated?.(parsePayload(payloadJson));
    }),
    onSelectionDelta: callback(payloadJson => {
      if (avatarLifecycle.current === 'unmounted') return;
      const payload = parsePayload(payloadJson);
      const current = snapshotRef.current;
      if (current.selection) {
        const selectedKeys = new Set(current.selection.selectedKeys);
        payload.removedKeys.forEach(key => selectedKeys.delete(key));
        payload.addedKeys.forEach(key => selectedKeys.add(key));
        snapshotRef.current = {
          ...current,
          selection: {
            ...current.selection,
            selectedKeys: [...selectedKeys]
          }
        };
      }
      callbacksRef.current.onSelectionDelta?.(payload);
    }),
    onReorder: callback(payloadJson => {
      if (avatarLifecycle.current === 'unmounted') return;
      callbacksRef.current.onReorder?.(parsePayload(payloadJson));
    }),
    onEndReached: callback(payloadJson => {
      if (avatarLifecycle.current === 'unmounted') return;
      callbacksRef.current.onEndReached?.(parsePayload(payloadJson));
    }),
    onScrollPositionThresholdChange: callback(isBeyondThreshold => {
      if (avatarLifecycle.current === 'unmounted') return;
      callbacksRef.current.onScrollPositionThresholdChange?.({
        isBeyondThreshold
      });
    }),
    onVisibleRangeChanged: callback(payloadJson => {
      if (avatarLifecycle.current === 'unmounted') return;
      const payload = parsePayload(payloadJson);
      const previous = avatarRangeRef.current;
      avatarRangeRef.current = {
        first: payload.firstIndex,
        last: payload.lastIndex,
        direction: previous && payload.firstIndex !== previous.first ? Math.sign(payload.firstIndex - previous.first) : previous?.direction ?? 1
      };
      updateAvatarPrefetchRef.current();
      callbacksRef.current.onVisibleRangeChanged?.(payload);
    })
  }), [wantsScrollMetrics]);
  return /*#__PURE__*/_jsx(NativeListHost, {
    ...viewProps,
    ...nativeCallbacks,
    snapshotJson: snapshotJson,
    containerSlotHeightsJson: containerSlotHeightsJson,
    scrollPositionThresholdsJson: scrollPositionThresholdsJson,
    keyboardDismissMode: keyboardDismissMode,
    keyboardShouldPersistTaps: normalizedKeyboardShouldPersistTaps,
    children: slotContents.map((content, index) => /*#__PURE__*/_jsx(View, {
      collapsable: false,
      style: {
        position: 'absolute',
        left: slotInset,
        right: slotInset,
        top: 0
      },
      onLayout: event => {
        const height = Math.ceil(event.nativeEvent.layout.height);
        setSlotHeights(previous => previous[index] === height ? previous : previous.map((value, slot) => slot === index ? height : value));
      },
      children: content
    }, index))
  });
});
//# sourceMappingURL=NativeList.js.map