import UIKit
import XCTest
@testable import NativeListModule

@MainActor
final class NativeListSmartXPresentationTests: XCTestCase {
  private func payload() -> [String: Any] {
    [
      "theme": [
        "canvas": "#111111", "text": "#FFFFFF", "secondaryText": "#AAAAAA",
        "mutedText": "#555555", "primary": "#08DFB5", "success": "#00FF00",
        "error": "#FF0000", "border": "#333333", "divider": "#222222",
        "subtleFill": "#181818", "selectedFill": "#FFFFFF1A", "raised": "#333333",
        "skeleton": "#303030", "tokenBackground": "#101010", "tokenText": "#FFFFFF", "tokenBorder": "#111111",
        "fonts": ["regular": "Helvetica", "medium": "Helvetica", "semibold": "Helvetica-Bold", "bold": "Helvetica-Bold"],
        "pressedOpacity": 0.6, "disabledOpacity": 0.3,
      ],
      "assets": [:], "locale": "zh", "fontScale": 1.0, "reducedMotion": true,
      "separator": true, "author": ["name": "SmartX", "time": "1m"],
    ]
  }
  private func action(_ key: String, disabled: Bool = false) -> [String: Any] {
    ["key": key, "testID": key, "label": key, "role": "button", "disabled": disabled]
  }
  private func item(_ type: String, content: [String: Any]) throws -> NativeListItem {
    try NativeListItem(data: ["key": "test-row", "type": type, "smartx": content])
  }

  func testAnnouncementCollapsedHeightAndExpansionUseSameTextLayout() throws {
    var content = payload()
    content["verified"] = true; content["pinnedLabel"] = "Pinned"; content["title"] = "Announcement"
    content["spans"] = [["kind": "text", "text": String(repeating: "宽度与字体影响公告换行。", count: 30), "bold": false, "italic": false]]
    content["expanded"] = false; content["toggleLabel"] = "Read More"; content["toggleAction"] = action("toggle")
    content["like"] = ["count": "20", "liked": false, "action": action("like")]
    let collapsedItem = try item("smartxAnnouncement", content: content)
    let collapsed = NativeListSmartXRenderer.Layout(item: collapsedItem, width: 390)
    XCTAssertEqual(collapsed.texts["announcementBody"]?.lines, 2)
    XCTAssertEqual(collapsed.boxes["separator"]?.frame.minX, 52)
    XCTAssertEqual(collapsed.boxes["separator"]?.frame.maxX, 374)
    XCTAssertEqual(collapsed.boxes["separator"]?.frame.maxY, collapsed.height)
    XCTAssertNotNil(collapsed.actions.first { $0.data.string("key") == "toggle" })
    XCTAssertEqual(NativeListSmartXRenderer.measure(collapsedItem, width: 390), ceil(collapsed.height))
    content["expanded"] = true
    let expandedItem = try item("smartxAnnouncement", content: content)
    let expanded = NativeListSmartXRenderer.Layout(item: expandedItem, width: 390)
    XCTAssertEqual(expanded.texts["announcementBody"]?.lines, 0)
    XCTAssertGreaterThan(expanded.height, collapsed.height)
    XCTAssertGreaterThan(NativeListSmartXRenderer.measure(expandedItem, width: 300), expanded.height)
    content["fontScale"] = 1.5
    XCTAssertGreaterThan(NativeListSmartXRenderer.measure(try item("smartxAnnouncement", content: content), width: 390), expanded.height)
  }

  func testOpinionDoesNotTruncateAndNestedLogoActionWinsByOrder() throws {
    var content = payload()
    content["body"] = String(repeating: "A long opinion with emoji 👩🏽‍💻 and 中文。", count: 50)
    content["bodyAction"] = action("body"); content["bodyTestID"] = "body-text"
    content["like"] = ["count": "1", "liked": false, "action": action("like")]
    content["links"] = []
    content["position"] = ["testID": "position", "token": ["symbol": "ETH", "fallbackText": "ET"], "cycleLabel": "Position", "cycleOpen": true, "action": action("position"), "logoAction": action("logo")]
    let layout = NativeListSmartXRenderer.Layout(item: try item("smartxOpinion", content: content), width: 390)
    XCTAssertEqual(layout.texts["body"]?.lines, 0)
    XCTAssertGreaterThan(layout.texts["body"]?.frame.height ?? 0, 6 * 20)
    let positionIndex = try XCTUnwrap(layout.actions.firstIndex { $0.data.string("key") == "position" })
    let logoIndex = try XCTUnwrap(layout.actions.firstIndex { $0.data.string("key") == "logo" })
    XCTAssertGreaterThan(logoIndex, positionIndex)
    XCTAssertEqual(layout.boxes["separator"]?.frame.minX, 52)
  }

  func testSameKeyRebindClearsOptionalSlotsAndUpdatesAccessibleState() throws {
    var content = payload()
    content["body"] = "Opinion"; content["bodyAction"] = action("body"); content["bodyTestID"] = "body-text"
    content["like"] = ["count": "1", "liked": false, "action": action("like")]
    content["links"] = []
    content["position"] = ["testID": "position", "token": ["symbol": "ETH", "fallbackText": "ET"], "cycleLabel": "Position", "cycleOpen": true, "action": action("position")]
    let cell = NativeListSmartXCell(frame: CGRect(x: 0, y: 0, width: 390, height: 400))
    func bind(_ content: [String: Any]) throws {
      cell.bind(item: try item("smartxOpinion", content: content), theme: nil, layout: "linear", selected: false, checkboxState: { _, _, _ in "none" })
      cell.setNeedsLayout(); cell.layoutIfNeeded()
    }
    try bind(content)
    let firstEpoch = cell.bindingEpoch
    XCTAssertTrue(cell.contentView.subviews.contains { $0.accessibilityIdentifier == "position" })
    content.removeValue(forKey: "position")
    var pending = action("like", disabled: true); pending["selected"] = true; pending["busy"] = true
    content["like"] = ["count": "2", "liked": true, "action": pending]
    try bind(content)
    XCTAssertGreaterThan(cell.bindingEpoch, firstEpoch)
    XCTAssertFalse(cell.contentView.subviews.contains { $0.accessibilityIdentifier == "position" })
    let like = try XCTUnwrap(cell.contentView.subviews.first { $0.accessibilityIdentifier == "like" } as? UIControl)
    XCTAssertFalse(like.isEnabled)
    XCTAssertTrue(like.accessibilityTraits.contains(.selected))
    XCTAssertTrue(like.accessibilityTraits.contains(.notEnabled))
    let boundEpoch = cell.bindingEpoch
    cell.prepareForReuse()
    XCTAssertGreaterThan(cell.bindingEpoch, boundEpoch)
    XCTAssertFalse(cell.contentView.subviews.contains { $0 is UIControl })
  }

  func testRichSpanMarksAndOpaqueKeysAreNotInterpreted() throws {
    var content = payload()
    content["expanded"] = true; content["toggleLabel"] = "Read Less"; content["toggleAction"] = action("toggle")
    content["spans"] = [
      ["kind": "text", "text": "bold italic ", "bold": true, "italic": true],
      ["kind": "ticker", "text": "$ETH", "bold": false, "italic": false, "action": action("opaque:token:%/中文")],
      ["kind": "link", "text": " docs", "bold": false, "italic": false, "action": action("opaque:link")],
    ]
    content["like"] = ["count": "0", "liked": false, "action": action("like")]
    let layout = NativeListSmartXRenderer.Layout(item: try item("smartxAnnouncement", content: content), width: 390)
    let body = try XCTUnwrap(layout.texts["announcementBody"])
    XCTAssertEqual(body.actions["smartx-action://span/1"]?.string("key"), "opaque:token:%/中文")
    let font = try XCTUnwrap(body.value.attribute(.font, at: 0, effectiveRange: nil) as? UIFont)
    XCTAssertTrue(font.fontDescriptor.symbolicTraits.contains(.traitItalic))
    XCTAssertNotNil(body.value.attribute(.underlineStyle, at: body.value.length - 1, effectiveRange: nil))
  }

  func testActionBindingIsInvalidatedBeforeLayoutAndOnRecycle() throws {
    let window = UIWindow(frame: CGRect(x: 0, y: 0, width: 390, height: 844))
    window.isHidden = false
    defer { window.isHidden = true }
    let cell = NativeListSmartXCell(frame: CGRect(x: 0, y: 0, width: 390, height: 300))
    // Own window containment gives the cell a real attachment independent of
    // the test host's view-controller appearance lifecycle.
    window.addSubview(cell)
    XCTAssertNotNil(cell.window)
    var content = payload()
    content["body"] = "Opinion"; content["bodyAction"] = action("body"); content["bodyTestID"] = "body-text"
    content["like"] = ["count": "1", "liked": false, "action": action("old-like")]
    content["links"] = []
    var emitted: [String] = []
    cell.onAction = { _, key, _, _ in emitted.append(key) }
    func bind() throws {
      cell.bind(item: try item("smartxOpinion", content: content), theme: nil, layout: "linear", selected: false, checkboxState: { _, _, _ in "none" })
    }
    try bind(); cell.layoutIfNeeded()
    let oldLike = try XCTUnwrap(cell.contentView.subviews.first { $0.accessibilityIdentifier == "old-like" } as? UIControl)
    oldLike.sendActions(for: .touchUpInside)
    XCTAssertEqual(emitted, ["old-like"])
    content["like"] = ["count": "2", "liked": false, "action": action("new-like")]
    try bind()
    oldLike.sendActions(for: .touchUpInside)
    XCTAssertEqual(emitted, ["old-like"], "No action may escape from the invalidated binding before layout")
    cell.layoutIfNeeded()
    let newLike = try XCTUnwrap(cell.contentView.subviews.first { $0.accessibilityIdentifier == "new-like" } as? UIControl)
    newLike.sendActions(for: .touchUpInside)
    XCTAssertEqual(emitted, ["old-like", "new-like"])
    cell.prepareForReuse()
    newLike.sendActions(for: .touchUpInside)
    XCTAssertEqual(emitted, ["old-like", "new-like"])
  }

  func testLikeCountsStayOpaqueDecimalStringsIncludingZeroAndLargeValues() throws {
    for type in ["smartxOpinion", "smartxAnnouncement"] {
      for count in ["0", "9223372036854775808", "18446744073709551615"] {
        var content = payload()
        content["body"] = "Opinion"; content["bodyAction"] = action("body"); content["bodyTestID"] = "body-text"
        content["links"] = []; content["spans"] = []; content["toggleLabel"] = "Read More"
        content["like"] = ["count": count, "liked": false, "action": action("like")]
        let layout = NativeListSmartXRenderer.Layout(item: try item(type, content: content), width: 390)
        XCTAssertEqual(layout.texts["likeCount"]?.value.string, count)
      }
    }
  }

  func testFollowedLikeExtraCountUsesCallerFormattedTextWithoutAnotherPrefix() throws {
    var content = payload()
    content["body"] = "Opinion"; content["bodyAction"] = action("body"); content["bodyTestID"] = "body-text"
    content["like"] = ["count": "1", "liked": false, "action": action("like")]; content["links"] = []
    content["followedLikes"] = ["avatars": [], "extraCount": "+12", "text": [["text": "also liked", "color": "#FFFFFF"]], "action": action("followed")]
    let layout = NativeListSmartXRenderer.Layout(item: try item("smartxOpinion", content: content), width: 390)
    XCTAssertEqual(layout.texts["followedExtraText"]?.value.string, "+12")
  }

  func testSmartXRowsDoNotUseGenericRowPress() throws {
    for type in ["smartxOpinion", "smartxTrade", "smartxMilestone", "smartxAnnouncement"] {
      XCTAssertFalse(try item(type, content: payload()).isRowPressEnabled)
    }
    XCTAssertTrue(try NativeListItem(data: ["key": "legacy", "type": "message"]).isRowPressEnabled)
  }
}
