import UIKit
import XCTest

final class NativeListRefreshControlTests: XCTestCase {
  private func mounted() -> (UIWindow, UIScrollView, NativeListRefreshControl) {
    let window = UIWindow(frame: CGRect(x: 0, y: 0, width: 390, height: 844))
    let controller = UIViewController()
    window.rootViewController = controller
    let scroll = UIScrollView(frame: window.bounds)
    scroll.contentSize = CGSize(width: 390, height: 1800)
    let control = NativeListRefreshControl()
    scroll.refreshControl = control
    controller.view.addSubview(scroll)
    window.makeKeyAndVisible()
    scroll.layoutIfNeeded(); control.layoutIfNeeded()
    return (window, scroll, control)
  }

  func testGestureEchoDoesNotMoveOffsetAndUnchangedFalseCannotEndIt() {
    let (window, scroll, control) = mounted()
    defer { window.isHidden = true }
    control.beginRefreshing()
    scroll.contentOffset.y = -110
    control.apply(refreshing: false, to: scroll)
    XCTAssertTrue(control.isRefreshing)
    XCTAssertEqual(scroll.contentOffset.y, -110, accuracy: 0.5)
    control.apply(refreshing: true, to: scroll)
    XCTAssertEqual(scroll.contentOffset.y, -110, accuracy: 0.5)
    control.apply(refreshing: false, to: scroll)
    XCTAssertFalse(control.isRefreshing)
  }

  func testProgrammaticRefreshRevealsOnceAndExplicitFalseCanRejectPull() {
    let (window, scroll, control) = mounted()
    defer { window.isHidden = true }
    control.apply(refreshing: true, to: scroll)
    XCTAssertTrue(control.isRefreshing)
    XCTAssertLessThan(scroll.contentOffset.y, 0)
    let offset = scroll.contentOffset.y
    control.apply(refreshing: true, to: scroll)
    XCTAssertEqual(scroll.contentOffset.y, offset, accuracy: 0.5)
    control.apply(refreshing: false, to: scroll, explicit: true)
    XCTAssertFalse(control.isRefreshing)
    control.beginRefreshing()
    control.apply(refreshing: false, to: scroll, explicit: true)
    XCTAssertFalse(control.isRefreshing)
  }

  func testPreAttachmentRequestCanBeRetriedAndCancelled() {
    let scroll = UIScrollView(frame: CGRect(x: 0, y: 0, width: 390, height: 844))
    let control = NativeListRefreshControl()
    scroll.refreshControl = control
    control.apply(refreshing: true, to: scroll)
    XCTAssertTrue(control.requestedRefreshing)
    XCTAssertFalse(control.isRefreshing)
    let window = UIWindow(frame: scroll.frame)
    window.rootViewController = UIViewController()
    window.rootViewController?.view.addSubview(scroll)
    window.makeKeyAndVisible(); scroll.layoutIfNeeded()
    defer { window.isHidden = true }
    control.apply(refreshing: true, to: scroll)
    XCTAssertTrue(control.isRefreshing)
    control.apply(refreshing: false, to: scroll)
    XCTAssertFalse(control.requestedRefreshing)
    XCTAssertFalse(control.isRefreshing)
  }
}
