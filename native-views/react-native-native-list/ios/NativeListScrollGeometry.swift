import Foundation

func nativeListAlignedScrollOffset(
  itemStart: CGFloat,
  startInset: CGFloat,
  viewportLength: CGFloat,
  itemLength: CGFloat,
  viewPosition: CGFloat,
  viewOffset: CGFloat,
  nearest: Bool
) -> CGFloat {
  let alignmentSpace = viewportLength - itemLength
  let resolvedSpace = nearest ? max(0, alignmentSpace) : alignmentSpace
  return itemStart - startInset - viewPosition * resolvedSpace - viewOffset
}

func nativeListClampedScrollOffset(
  _ requestedOffset: CGFloat,
  viewportLength: CGFloat,
  contentLength: CGFloat,
  startInset: CGFloat,
  endInset: CGFloat
) -> CGFloat {
  let minimum = -startInset
  let maximum = max(minimum, contentLength - viewportLength + endInset)
  return min(maximum, max(minimum, requestedOffset))
}

/// A data update retains the first visible key, or the nearest surviving old
/// successor/predecessor. Newly inserted keys do not become an old viewport anchor.
func nativeListSurvivingAnchorKey(
  key: String,
  oldKeys: [String],
  currentKeys: Set<String>
) -> String? {
  if currentKeys.contains(key) { return key }
  guard let index = oldKeys.firstIndex(of: key) else { return nil }
  if let successor = oldKeys.dropFirst(index + 1).first(where: currentKeys.contains) {
    return successor
  }
  return oldKeys.prefix(index).reversed().first(where: currentKeys.contains)
}

/// Only scroll frames are throttled. Geometry deduplication deliberately omits
/// offsets: drag/momentum terminal events always carry the final observed offset.
struct NativeListScrollMetricsDelivery {
  private var lastScrollTime: TimeInterval?
  private var lastGeometry: [Double]?

  mutating func reset() {
    lastScrollTime = nil
    lastGeometry = nil
  }

  mutating func shouldEmit(
    phase: String,
    time: TimeInterval,
    geometry: [Double],
    force: Bool = false
  ) -> Bool {
    guard geometry.count == 6, geometry.allSatisfy(\.isFinite) else { return false }
    if phase == "scroll" {
      if let lastScrollTime, time - lastScrollTime < 0.016 { return false }
      lastScrollTime = time
    } else if phase == "geometry" {
      let dimensions = Array(geometry.dropFirst(2))
      guard force || dimensions != lastGeometry else { return false }
      lastGeometry = dimensions
    }
    return true
  }
}
