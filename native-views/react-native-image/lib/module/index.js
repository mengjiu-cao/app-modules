"use strict";

import { createElement, useEffect, useMemo, useRef, useState } from 'react';
import { Image, Platform, StyleSheet, View } from 'react-native';
import { callback, getHostComponent, NitroModules } from 'react-native-nitro-modules';
const OneKeyImageConfig = require('../nitrogen/generated/shared/json/OneKeyImageConfig.json');
import { OneKeyImageCachePolicy, OneKeyImageContentFit, OneKeyImageLoadingStrategy, OneKeyImageVariant } from "./OneKeyImage.nitro.js";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
export { OneKeyImageCachePolicy, OneKeyImageContentFit, OneKeyImageLoadingStrategy, OneKeyImageVariant };
export let OneKeyImageCacheType = /*#__PURE__*/function (OneKeyImageCacheType) {
  OneKeyImageCacheType["NONE"] = "none";
  OneKeyImageCacheType["MEMORY"] = "memory";
  OneKeyImageCacheType["DISK"] = "disk";
  return OneKeyImageCacheType;
}({});
const NativeOneKeyImage = getHostComponent('OneKeyImage', () => OneKeyImageConfig);
const nativeCache = NitroModules.createHybridObject('OneKeyImageCache');
function unwrap(value) {
  return typeof value === 'function' ? value : value?.f;
}
function normalizeSource(source) {
  if (source == null) return undefined;
  const resolved = Image.resolveAssetSource(source);
  if (resolved?.uri?.trim()) {
    const original = typeof source === 'object' && !Array.isArray(source) ? source : undefined;
    return {
      uri: resolved.uri,
      width: resolved.width,
      height: resolved.height,
      scale: resolved.scale,
      headers: original?.headers,
      cachePolicy: original?.cachePolicy
    };
  }
  return undefined;
}
export function OneKeyImage({
  source,
  placeholder,
  fallback,
  variant = OneKeyImageVariant.GENERIC,
  contentFit = OneKeyImageContentFit.COVER,
  cachePolicy,
  autoplay,
  recyclingKey,
  optimizeTos = true,
  round = false,
  resizeWidth,
  resizeHeight,
  overscan = 1.1,
  loadingStrategy = OneKeyImageLoadingStrategy.STATIC,
  placeholderColor,
  hybridRef,
  onLoadStart,
  onLoad,
  onDisplay,
  onError,
  onLoadEnd,
  style,
  ...viewProps
}) {
  const normalized = useMemo(() => normalizeSource(source), [source]);
  const resolvedCachePolicy = cachePolicy ?? normalized?.cachePolicy ?? OneKeyImageCachePolicy.MEMORY_DISK;
  const identity = `${normalized?.uri ?? ''}|${JSON.stringify(normalized?.headers ?? {})}|${resolvedCachePolicy}|${recyclingKey ?? ''}|${contentFit}|${optimizeTos ? '1' : '0'}|${resizeWidth ?? ''}|${resizeHeight ?? ''}|${overscan}`;
  const hasSource = normalized != null;
  const hasOverlay = placeholder != null || fallback != null;
  const [loadState, setLoadState] = useState({
    identity,
    status: hasSource ? 'loading' : 'fallback'
  });
  const effectiveState = loadState.identity === identity ? loadState.status : hasSource ? 'loading' : 'fallback';
  const refs = useRef({
    hybridRef: unwrap(hybridRef),
    onLoadStart: unwrap(onLoadStart),
    onLoad: unwrap(onLoad),
    onDisplay: unwrap(onDisplay),
    onError: unwrap(onError),
    onLoadEnd: unwrap(onLoadEnd)
  });
  refs.current = {
    hybridRef: unwrap(hybridRef),
    onLoadStart: unwrap(onLoadStart),
    onLoad: unwrap(onLoad),
    onDisplay: unwrap(onDisplay),
    onError: unwrap(onError),
    onLoadEnd: unwrap(onLoadEnd)
  };
  const nativeMethodsRef = useRef(null);
  const pendingOverlayReloadRef = useRef(null);
  const previousRenderRef = useRef({
    hasOverlay,
    identity
  });
  useEffect(() => {
    const previous = previousRenderRef.current;
    const identityChanged = previous.identity !== identity;
    if (hasOverlay && (!previous.hasOverlay || identityChanged)) {
      const status = hasSource ? 'loading' : 'fallback';
      setLoadState({
        identity,
        status
      });
    }
    if (hasOverlay && !previous.hasOverlay && !identityChanged && hasSource) {
      pendingOverlayReloadRef.current = identity;
      const nativeMethods = nativeMethodsRef.current;
      if (nativeMethods != null) {
        pendingOverlayReloadRef.current = null;
        nativeMethods.reload();
      }
    } else if (!hasOverlay || identityChanged) {
      pendingOverlayReloadRef.current = null;
    }
    previousRenderRef.current = {
      hasOverlay,
      identity
    };
  }, [hasOverlay, hasSource, identity]);
  const needsHybridRef = hasOverlay || refs.current.hybridRef != null;
  const needsLoadStart = hasOverlay || refs.current.onLoadStart != null;
  const needsLoad = refs.current.onLoad != null;
  const needsDisplay = placeholder != null || refs.current.onDisplay != null;
  const needsError = hasOverlay || refs.current.onError != null;
  const needsLoadEnd = refs.current.onLoadEnd != null;
  const nativeCallbacks = useMemo(() => ({
    hybridRef: needsHybridRef ? callback(ref => {
      nativeMethodsRef.current = ref;
      if (pendingOverlayReloadRef.current === identity) {
        pendingOverlayReloadRef.current = null;
        ref.reload();
      }
      refs.current.hybridRef?.(ref);
    }) : undefined,
    onLoadStart: needsLoadStart ? callback(() => {
      if (hasOverlay) {
        setLoadState({
          identity,
          status: 'loading'
        });
      }
      refs.current.onLoadStart?.();
    }) : undefined,
    onLoad: needsLoad ? callback((width, height, cacheType) => {
      refs.current.onLoad?.({
        source: {
          url: normalized?.uri ?? '',
          width,
          height
        },
        cacheType: cacheType
      });
    }) : undefined,
    onDisplay: needsDisplay ? callback(() => {
      if (placeholder != null) {
        setLoadState({
          identity,
          status: 'loaded'
        });
      }
      refs.current.onDisplay?.();
    }) : undefined,
    onError: needsError ? callback(message => {
      if (hasOverlay) {
        setLoadState({
          identity,
          status: 'fallback'
        });
      }
      refs.current.onError?.({
        error: message
      });
    }) : undefined,
    onLoadEnd: needsLoadEnd ? callback(() => refs.current.onLoadEnd?.()) : undefined
  }), [hasOverlay, identity, needsDisplay, needsError, needsHybridRef, needsLoad, needsLoadEnd, needsLoadStart, normalized?.uri, placeholder]);
  const flattenedStyle = StyleSheet.flatten(style);
  const hasRoundedCorners = Boolean(flattenedStyle && [flattenedStyle.borderRadius, flattenedStyle.borderTopLeftRadius, flattenedStyle.borderTopRightRadius, flattenedStyle.borderBottomLeftRadius, flattenedStyle.borderBottomRightRadius, flattenedStyle.borderStartStartRadius, flattenedStyle.borderStartEndRadius, flattenedStyle.borderEndStartRadius, flattenedStyle.borderEndEndRadius].some(radius => typeof radius === 'number' && radius > 0));
  const shouldWrapNative = hasOverlay || hasRoundedCorners;
  const borderOverlayStyle = flattenedStyle && hasRoundedCorners ? {
    borderWidth: flattenedStyle.borderWidth,
    borderTopWidth: flattenedStyle.borderTopWidth,
    borderRightWidth: flattenedStyle.borderRightWidth,
    borderBottomWidth: flattenedStyle.borderBottomWidth,
    borderLeftWidth: flattenedStyle.borderLeftWidth,
    borderStartWidth: flattenedStyle.borderStartWidth,
    borderEndWidth: flattenedStyle.borderEndWidth,
    borderColor: flattenedStyle.borderColor,
    borderTopColor: flattenedStyle.borderTopColor,
    borderRightColor: flattenedStyle.borderRightColor,
    borderBottomColor: flattenedStyle.borderBottomColor,
    borderLeftColor: flattenedStyle.borderLeftColor,
    borderStartColor: flattenedStyle.borderStartColor,
    borderEndColor: flattenedStyle.borderEndColor,
    borderStyle: flattenedStyle.borderStyle,
    borderRadius: flattenedStyle.borderRadius,
    borderTopLeftRadius: flattenedStyle.borderTopLeftRadius,
    borderTopRightRadius: flattenedStyle.borderTopRightRadius,
    borderBottomLeftRadius: flattenedStyle.borderBottomLeftRadius,
    borderBottomRightRadius: flattenedStyle.borderBottomRightRadius,
    borderStartStartRadius: flattenedStyle.borderStartStartRadius,
    borderStartEndRadius: flattenedStyle.borderStartEndRadius,
    borderEndStartRadius: flattenedStyle.borderEndStartRadius,
    borderEndEndRadius: flattenedStyle.borderEndEndRadius,
    zIndex: 1,
    ...(round ? ROUND_CLIP : null)
  } : undefined;
  const native = /*#__PURE__*/createElement(NativeOneKeyImage, {
    ...viewProps,
    ...nativeCallbacks,
    style: shouldWrapNative ? StyleSheet.absoluteFill : style,
    sourceUri: normalized?.uri ?? '',
    sourceHeadersJson: normalized?.headers ? JSON.stringify(normalized.headers) : undefined,
    variant,
    contentFit,
    cachePolicy: resolvedCachePolicy,
    autoplay: autoplay ?? Platform.OS !== 'android',
    recyclingKey,
    optimizeTos,
    round,
    resizeWidth,
    resizeHeight,
    overscan,
    loadingStrategy: placeholder == null ? loadingStrategy : OneKeyImageLoadingStrategy.NONE,
    placeholderColor
  });
  if (!shouldWrapNative) return native;
  return /*#__PURE__*/_jsxs(View, {
    style: [style, styles.overlayContainer, hasRoundedCorners ? styles.borderlessContainer : undefined, round ? ROUND_CLIP : undefined],
    collapsable: false,
    children: [native, effectiveState === 'loading' && placeholder != null ? /*#__PURE__*/_jsx(View, {
      pointerEvents: "none",
      style: StyleSheet.absoluteFill,
      children: placeholder
    }) : null, effectiveState === 'fallback' && fallback != null ? /*#__PURE__*/_jsx(View, {
      pointerEvents: "none",
      style: StyleSheet.absoluteFill,
      children: fallback
    }) : null, borderOverlayStyle ? /*#__PURE__*/_jsx(View, {
      pointerEvents: "none",
      style: [StyleSheet.absoluteFill, borderOverlayStyle]
    }) : null]
  });
}
export const OneKeyImageCache = {
  preload(sources) {
    const hasInvalidSource = sources.some(source => !source.uri?.trim());
    const validSources = sources.filter(source => Boolean(source.uri?.trim()));
    if (validSources.length === 0) return Promise.resolve(false);
    return nativeCache.preload(validSources.map(source => ({
      uri: source.uri,
      headersJson: source.headers ? JSON.stringify(source.headers) : undefined,
      cachePolicy: source.cachePolicy ?? OneKeyImageCachePolicy.MEMORY_DISK,
      resizeWidth: source.resizeWidth,
      resizeHeight: source.resizeHeight,
      pixelRatio: source.pixelRatio,
      overscan: source.overscan,
      optimizeTos: source.optimizeTos
    }))).then(success => success && !hasInvalidSource);
  },
  clearMemory: () => nativeCache.clearMemory(),
  clearDisk: () => nativeCache.clearDisk(),
  clearAll: () => nativeCache.clearAll()
};

// `round` clips the native view to a circle: an oval path on Android
// (`OneKeyImage.kt` `addOval`), a `min(width, height) / 2` corner radius on iOS
// (`OneKeyImage.swift` `updateRoundMask`). The overlay container has to clip the
// same way, or a custom placeholder or fallback is painted square over a round
// image. A percentage radius says that without measuring the view, and covers
// every per-corner radius the caller's own style may have set.
const ROUND_CLIP = {
  borderRadius: '50%',
  borderTopLeftRadius: '50%',
  borderTopRightRadius: '50%',
  borderBottomLeftRadius: '50%',
  borderBottomRightRadius: '50%',
  borderStartStartRadius: '50%',
  borderStartEndRadius: '50%',
  borderEndStartRadius: '50%',
  borderEndEndRadius: '50%'
};
const styles = StyleSheet.create({
  overlayContainer: {
    overflow: 'hidden'
  },
  borderlessContainer: {
    borderWidth: 0,
    borderTopWidth: 0,
    borderRightWidth: 0,
    borderBottomWidth: 0,
    borderLeftWidth: 0,
    borderStartWidth: 0,
    borderEndWidth: 0
  }
});
//# sourceMappingURL=index.js.map