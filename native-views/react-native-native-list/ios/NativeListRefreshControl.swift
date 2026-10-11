import UIKit

/// Matches the consumer's Fabric RefreshControl without taking ownership of requests.
final class NativeListRefreshControl: UIRefreshControl {
  private(set) var requestedRefreshing = false
  private var beginningProgrammatically = false

  func apply(refreshing: Bool, to scrollView: UIScrollView, explicit: Bool = false) {
    let previouslyRequested = requestedRefreshing
    requestedRefreshing = refreshing
    if refreshing {
      // UIKit already revealed a gesture-triggered control. A JS echo must not
      // subtract its height again. A pre-attachment request is retried by layout.
      guard !isRefreshing, !beginningProgrammatically, window != nil else { return }
      beginningProgrammatically = true
      defer { beginningProgrammatically = false }
      scrollView.setContentOffset(CGPoint(
        x: scrollView.contentOffset.x,
        y: scrollView.contentOffset.y - bounds.height
      ), animated: false)
      beginRefreshing()
    } else if previouslyRequested || explicit {
      // An unrelated snapshot with the same false prop cannot cancel a native
      // valueChanged event before JS acknowledges it (same as RN's prop diff).
      endRefreshing()
    }
  }
}
