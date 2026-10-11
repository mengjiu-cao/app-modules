import UIKit
import XCTest
@testable import NativeListModule

@MainActor
final class NativeListSystemPresentationTests: XCTestCase {
  func testRetryActionUsesCallerLocalizationAndClearsRecycledTestID() throws {
    func buttons(in view: UIView) -> [UIButton] {
      (view as? UIButton).map { [$0] } ?? view.subviews.flatMap { buttons(in: $0) }
    }
    let cell = NativeListSystemCell(frame: CGRect(x: 0, y: 0, width: 390, height: 120))
    for presentation in ["default", "market"] {
      let localized = try NativeListItem(data: [
        "key": "retry", "type": "system", "variant": "retry", "presentation": presentation,
        "message": "加载失败", "actionKey": "retry-feed", "actionText": "重新加载", "actionTestID": "square-retry-feed",
      ])
      cell.bind(item: localized, theme: nil, layout: "linear", selected: false, checkboxState: { _, _, _ in "none" })
      let button = try XCTUnwrap(buttons(in: cell).first)
      XCTAssertEqual(button.attributedTitle(for: .normal)?.string ?? button.title(for: .normal), "重新加载")
      XCTAssertEqual(button.accessibilityIdentifier, "square-retry-feed")
      let legacy = try NativeListItem(data: [
        "key": "retry", "type": "system", "variant": "retry", "presentation": presentation,
        "message": "Loading failed", "actionKey": "retry-feed",
      ])
      cell.bind(item: legacy, theme: nil, layout: "linear", selected: false, checkboxState: { _, _, _ in "none" })
      XCTAssertEqual(button.attributedTitle(for: .normal)?.string ?? button.title(for: .normal), "Retry")
      XCTAssertNil(button.accessibilityIdentifier)
    }
  }
}
