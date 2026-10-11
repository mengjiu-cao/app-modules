"use strict";

function assertNonNegativeInteger(value, name) {
  if (!Number.isInteger(value) || value < 0) {
    throw new Error(`NativeList ${name} must be a non-negative integer`);
  }
}
function assertFiniteNumber(value, name) {
  if (!Number.isFinite(value)) {
    throw new Error(`NativeList ${name} must be a finite number`);
  }
}
function positionForAlignment(alignment) {
  switch (alignment) {
    case 'center':
      return 0.5;
    case 'end':
      return 1;
    default:
      return 0;
  }
}
export function normalizePositionScroll(options, defaultAlignment) {
  const alignment = options.alignment ?? defaultAlignment;
  if (options.alignment !== undefined && options.viewPosition !== undefined) {
    throw new Error('NativeList alignment and viewPosition cannot be used together');
  }
  const viewPosition = options.viewPosition ?? positionForAlignment(alignment);
  if (!Number.isFinite(viewPosition) || viewPosition < 0 || viewPosition > 1) {
    throw new Error('NativeList viewPosition must be between 0 and 1');
  }
  const viewOffset = options.viewOffset ?? 0;
  assertFiniteNumber(viewOffset, 'viewOffset');
  return {
    animated: options.animated ?? true,
    alignment: options.viewPosition === undefined ? alignment : 'start',
    viewPosition,
    viewOffset
  };
}
export function normalizeIndexScroll(paramsOrIndex, animated, alignment) {
  if (typeof paramsOrIndex === 'number') {
    assertNonNegativeInteger(paramsOrIndex, 'scrollToIndex index');
    return {
      index: paramsOrIndex,
      scroll: normalizePositionScroll({
        animated,
        alignment
      }, 'nearest')
    };
  }
  assertNonNegativeInteger(paramsOrIndex.index, 'scrollToIndex index');
  return {
    index: paramsOrIndex.index,
    scroll: normalizePositionScroll(paramsOrIndex, 'start')
  };
}
export function normalizeKeyScroll(paramsOrKey, animated, alignment) {
  if (typeof paramsOrKey === 'string') {
    return {
      key: paramsOrKey,
      scroll: normalizePositionScroll({
        animated,
        alignment
      }, 'nearest')
    };
  }
  return {
    key: paramsOrKey.key,
    scroll: normalizePositionScroll(paramsOrKey, 'start')
  };
}
export function validateOffset(offset) {
  assertFiniteNumber(offset, 'scroll offset');
  if (offset < 0) {
    throw new Error('NativeList scroll offset must be non-negative');
  }
}
export function resolveLocationIndex(rows, params) {
  assertNonNegativeInteger(params.sectionIndex, 'scrollToLocation sectionIndex');
  assertNonNegativeInteger(params.itemIndex, 'scrollToLocation itemIndex');
  const headers = rows.map((row, index) => ({
    row,
    index
  })).filter(entry => entry.row.type === 'sectionHeader' && entry.row.variant !== 'summary');
  const section = headers[params.sectionIndex];
  if (!section || section.row.type !== 'sectionHeader') return undefined;
  const end = headers[params.sectionIndex + 1]?.index ?? rows.length;
  const items = rows.slice(section.index + 1, end).map((row, offset) => ({
    row,
    index: section.index + 1 + offset
  })).filter(entry => entry.row.type !== 'sectionHeader' && entry.row.sectionKey === section.row.sectionKey);
  return items[params.itemIndex]?.index;
}
export function scrollFailure(rows, index, reason, averageItemLength = 0) {
  return {
    index,
    itemCount: rows.length,
    highestMeasuredFrameIndex: rows.length - 1,
    averageItemLength,
    reason
  };
}
export function calculateAlignedScrollOffset({
  itemOffset,
  itemLength,
  viewportLength,
  contentLength,
  currentOffset,
  alignment,
  viewPosition,
  viewOffset
}) {
  let resolvedPosition = viewPosition;
  if (alignment === 'nearest') {
    if (itemOffset < currentOffset) resolvedPosition = 0;else if (itemOffset + itemLength > currentOffset + viewportLength) resolvedPosition = 1;else return currentOffset;
  }
  const alignmentSpace = viewportLength - itemLength;
  // Explicit positions align oversized rows too; preserve legacy nearest calls.
  const target = itemOffset - resolvedPosition * (alignment === 'nearest' ? Math.max(0, alignmentSpace) : alignmentSpace) - viewOffset;
  return Math.min(Math.max(0, target), Math.max(0, contentLength - viewportLength));
}
//# sourceMappingURL=scrolling.js.map