"use strict";

import React, { forwardRef, useCallback, useEffect, useImperativeHandle, useMemo, useRef, useState } from 'react';
import { View } from 'react-native';
import { normalizeIndexScroll, normalizeKeyScroll, normalizePositionScroll, resolveLocationIndex, scrollFailure, validateOffset } from "./scrolling.js";
import { serializePatches, validateSnapshot } from "./validation.js";
import { NativeListWebEngine } from "./web/NativeListWebEngine.js";
import { acquireNativeListAvatar, canonicalNativeListAvatarUri } from "./web/NativeListWebAvatarCache.js";
import { jsx as _jsx } from "react/jsx-runtime";
export function preloadNativeListAvatarImages(sources) {
  if (typeof document === 'undefined') return Promise.resolve(false);
  const uris = [...new Set(sources.map(source => canonicalNativeListAvatarUri(source.uri)).filter(uri => uri !== undefined))];
  if (!uris.length) return Promise.resolve(false);
  return Promise.all(uris.map(uri => new Promise(resolve => {
    let release;
    const settle = success => {
      resolve(success);
      queueMicrotask(() => release?.());
    };
    release = acquireNativeListAvatar(document, uri, () => settle(true), () => settle(false), 0);
  }))).then(results => results.every(Boolean));
}
export const NativeList = /*#__PURE__*/forwardRef(function NativeList({
  snapshot,
  listHeader: _listHeader,
  listEmpty: _listEmpty,
  listFooter: _listFooter,
  scrollPositionThresholds: _scrollPositionThresholds,
  onScrollPositionThresholdChange: _onScrollPositionThresholdChange,
  webVirtualizationEnabled = true,
  webSectionIndexContainerRef,
  keyboardDismissMode: _keyboardDismissMode,
  keyboardShouldPersistTaps: _keyboardShouldPersistTaps,
  onRowAction,
  onActionAnchorInvalidated,
  onSelectionDelta,
  onReorder,
  onEndReached,
  onVisibleRangeChanged,
  onRefresh,
  onScrollToIndexFailed,
  initialScrollIndex,
  initialScrollKey,
  initialScrollViewPosition,
  initialScrollViewOffset,
  ...viewProps
}, forwardedRef) {
  const [host, setHost] = useState(null);
  const engineRef = useRef(undefined);
  const webVirtualizationEnabledRef = useRef(webVirtualizationEnabled);
  webVirtualizationEnabledRef.current = webVirtualizationEnabled;
  const validatedSnapshot = useMemo(() => validateSnapshot(snapshot), [snapshot]);
  const snapshotRef = useRef(validatedSnapshot);
  const snapshotPropRef = useRef(validatedSnapshot);
  // An imperative snapshot survives host mounting until the snapshot prop changes.
  if (snapshotPropRef.current !== validatedSnapshot) {
    snapshotPropRef.current = validatedSnapshot;
    snapshotRef.current = validatedSnapshot;
  }
  // OneKey patch: React refs can be ready before the DOM engine is mounted.
  const pendingPatchesRef = useRef(undefined);
  const appliedSnapshotRef = useRef(undefined);
  const callbacksRef = useRef({});
  callbacksRef.current = {
    onRowAction,
    onActionAnchorInvalidated,
    onSelectionDelta,
    onReorder,
    onEndReached,
    onVisibleRangeChanged,
    onRefresh,
    onScrollToIndexFailed
  };
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
  useEffect(() => {
    if (!host) return;
    const engine = new NativeListWebEngine(host, snapshotRef.current, callbacksRef.current, webVirtualizationEnabledRef.current, webSectionIndexContainerRef?.current);
    engineRef.current = engine;
    appliedSnapshotRef.current = snapshotRef.current;
    const pending = pendingPatchesRef.current;
    pendingPatchesRef.current = undefined;
    if (pending?.snapshot === snapshotRef.current) pending.batches.forEach(patches => engine.applyPatches(patches));
    const initial = initialScrollRef.current;
    if (initial && !didApplyInitialScroll.current) {
      didApplyInitialScroll.current = true;
      if (initial.index !== undefined) engine.scrollToIndex(initial.index, initial.scroll);else if (initial.key !== undefined) engine.scrollToKey(initial.key, initial.scroll);
    }
    return () => {
      engine.destroy();
      if (engineRef.current === engine) engineRef.current = undefined;
    };
  }, [host, webSectionIndexContainerRef]);
  useEffect(() => {
    engineRef.current?.setVirtualizationEnabled(webVirtualizationEnabled);
  }, [webVirtualizationEnabled]);
  useEffect(() => {
    engineRef.current?.updateCallbacks(callbacksRef.current);
  });
  useEffect(() => {
    const engine = engineRef.current;
    if (!engine || appliedSnapshotRef.current === validatedSnapshot) return;
    engine.applySnapshot(validatedSnapshot);
    appliedSnapshotRef.current = validatedSnapshot;
  }, [validatedSnapshot]);
  const emitIndexFailure = (index, reason) => {
    callbacksRef.current.onScrollToIndexFailed?.(scrollFailure(snapshotRef.current.rows, index, reason));
  };
  useImperativeHandle(forwardedRef, () => ({
    applySnapshot(nextSnapshot) {
      const next = validateSnapshot(nextSnapshot);
      pendingPatchesRef.current = undefined;
      snapshotRef.current = next;
      appliedSnapshotRef.current = next;
      engineRef.current?.applySnapshot(next);
    },
    applyPatches(patches) {
      if (patches.length > 0) {
        serializePatches(patches);
        // engineRef.current?.applyPatches(patches);
        if (engineRef.current) engineRef.current.applyPatches(patches);else {
          if (pendingPatchesRef.current?.snapshot !== snapshotRef.current) pendingPatchesRef.current = {
            snapshot: snapshotRef.current,
            batches: []
          };
          pendingPatchesRef.current.batches.push(patches);
        }
      }
    },
    reconcileSelection(selectedKeys) {
      engineRef.current?.reconcileSelection(selectedKeys);
    },
    scrollToKey(paramsOrKey, animated, alignment) {
      const {
        key,
        scroll
      } = normalizeKeyScroll(paramsOrKey, animated, alignment);
      engineRef.current?.scrollToKey(key, scroll);
    },
    scrollToIndex(paramsOrIndex, animated, alignment) {
      const {
        index,
        scroll
      } = normalizeIndexScroll(paramsOrIndex, animated, alignment);
      if (index >= snapshotRef.current.rows.length) {
        emitIndexFailure(index, 'index-out-of-range');
        return;
      }
      engineRef.current?.scrollToIndex(index, scroll);
    },
    scrollToItem(params) {
      const index = snapshotRef.current.rows.findIndex(row => row.key === params.item.key);
      if (index < 0) {
        emitIndexFailure(-1, 'item-not-found');
        return;
      }
      engineRef.current?.scrollToKey(params.item.key, normalizePositionScroll(params, 'start'));
    },
    scrollToOffset({
      offset,
      animated = true
    }) {
      validateOffset(offset);
      engineRef.current?.scrollToOffset(offset, animated);
    },
    scrollToEnd({
      animated = true
    } = {}) {
      engineRef.current?.scrollToEnd(animated);
    },
    scrollToLocation(params) {
      const index = resolveLocationIndex(snapshotRef.current.rows, params);
      if (index === undefined) {
        const sectionCount = snapshotRef.current.rows.filter(row => row.type === 'sectionHeader' && row.variant !== 'summary').length;
        emitIndexFailure(params.itemIndex, params.sectionIndex >= sectionCount ? 'section-out-of-range' : 'item-out-of-range');
        return;
      }
      engineRef.current?.scrollToIndex(index, normalizePositionScroll(params, 'start'));
    },
    setActionAnchorState(state) {
      engineRef.current?.setActionAnchorState(state);
    },
    setRefreshing(refreshing) {
      engineRef.current?.setRefreshing(refreshing);
    }
  }));
  const setHostRef = useCallback(value => {
    setHost(value);
  }, []);
  return /*#__PURE__*/_jsx(View, {
    ...viewProps,
    ref: setHostRef
  });
});
//# sourceMappingURL=NativeList.web.js.map