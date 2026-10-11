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

  func testCJKStringChildrenUseAppLineHeightWithoutChangingFontSize() throws {
    var content = payload()
    content["author"] = ["name": "作者", "time": "刚刚", "handle": "中文"]
    content["body"] = "中文正文"; content["bodyAction"] = action("body"); content["bodyTestID"] = "body-text"
    content["tag"] = ["text": "观点", "color": "#FFFFFF", "backgroundColor": "#333333", "testID": "tag"]
    content["position"] = ["testID": "position", "token": ["symbol": "代币", "fallbackText": "代币"], "cycleLabel": "持仓中", "cycleOpen": true,
      "primary": ["text": "估值", "color": "#FFFFFF"], "secondary": ["text": "收益", "color": "#FFFFFF"]]
    content["like"] = ["count": "1", "liked": false, "action": action("like")]
    content["links"] = [["label": "查看原文", "action": action("link")]]
    let layout = NativeListSmartXRenderer.Layout(item: try item("smartxOpinion", content: content), width: 390)
    for (id, expected) in [("author", 22), ("time", 20), ("body", 22), ("tagText", 20), ("cycle", 20), ("symbol", 22), ("primary", 22), ("secondary", 20), ("link0Text", 20)] {
      let text = try XCTUnwrap(layout.texts[id], id)
      XCTAssertEqual(layout.lineHeight(text.value), CGFloat(expected), id)
      XCTAssertGreaterThanOrEqual(text.frame.height, CGFloat(expected), id)
    }
    let bodyFont = try XCTUnwrap(layout.texts["body"]?.value.attribute(.font, at: 0, effectiveRange: nil) as? UIFont)
    XCTAssertEqual(bodyFont.pointSize, 14)
    XCTAssertEqual(layout.lineHeight(try XCTUnwrap(layout.texts["handle"]).value), 18, "@ plus handle is an array child")
    XCTAssertEqual(try XCTUnwrap(layout.texts["symbol"]).frame.minY, try XCTUnwrap(layout.texts["cycle"]).frame.maxY + 2)
    XCTAssertEqual(try XCTUnwrap(layout.texts["secondary"]).frame.minY, try XCTUnwrap(layout.texts["primary"]).frame.maxY)
    XCTAssertEqual(layout.lineHeight(layout.value("English")), 20)
    XCTAssertEqual(layout.lineHeight(layout.value("。")), 22)
    XCTAssertEqual(layout.lineHeight(layout.value("Ａ")), 22)
    XCTAssertEqual(layout.lineHeight(layout.value("가")), 20, "Match the App regex exactly, not a broader script classifier")
  }

  func testCJKRichAndArrayChildrenKeepTheirDeclaredLineHeights() throws {
    var content = payload()
    content["author"] = ["name": "公告作者", "time": "刚刚"]
    content["pinnedLabel"] = "置顶"; content["title"] = "公告标题"
    content["spans"] = [["kind": "text", "text": "中文富文本", "bold": false, "italic": false]]
    content["expanded"] = false; content["toggleLabel"] = "展开"; content["toggleAction"] = action("toggle")
    content["like"] = ["count": "1", "liked": false, "action": action("like")]
    let announcement = NativeListSmartXRenderer.Layout(item: try item("smartxAnnouncement", content: content), width: 390)
    for (id, expected) in [("author", 26), ("time", 20), ("pinnedLabel", 20), ("title", 22), ("toggle", 20), ("announcementBody", 20)] {
      XCTAssertEqual(announcement.lineHeight(try XCTUnwrap(announcement.texts[id], id).value), CGFloat(expected), id)
    }
    var trade = payload()
    trade["token"] = ["symbol": "代币", "fallbackText": "代币"]; trade["amount"] = "1"; trade["marketCap"] = "未知"
    let tradeLayout = NativeListSmartXRenderer.Layout(item: try item("smartxTrade", content: trade), width: 390)
    let tradeText = try XCTUnwrap(tradeLayout.texts["tradeText"]).value
    tradeText.enumerateAttribute(.paragraphStyle, in: NSRange(location: 0, length: tradeText.length)) { paragraph, _, _ in
      XCTAssertEqual((paragraph as? NSParagraphStyle)?.maximumLineHeight, 20)
    }
    var opinion = payload()
    opinion["body"] = "中文"; opinion["bodyAction"] = action("body"); opinion["bodyTestID"] = "body-text"
    opinion["like"] = ["count": "1", "liked": false, "action": action("like")]; opinion["links"] = []
    opinion["followedLikes"] = ["avatars": [], "text": [["text": "张三也点赞了", "color": "#FFFFFF"]], "action": action("followed")]
    let opinionLayout = NativeListSmartXRenderer.Layout(item: try item("smartxOpinion", content: opinion), width: 390)
    XCTAssertEqual(opinionLayout.lineHeight(try XCTUnwrap(opinionLayout.texts["followedText"]).value), 18)
    var milestone = payload()
    milestone["thresholds"] = ["曾达到一千美元"]
    milestone["position"] = ["token": ["symbol": "代币", "fallbackText": "代币"], "mockText": "模拟", "staleText": "估值于刚刚",
      "values": [["label": "仓位估值", "text": "暂不可用", "color": "#FFFFFF"]]]
    let milestoneLayout = NativeListSmartXRenderer.Layout(item: try item("smartxMilestone", content: milestone), width: 390)
    for (id, expected) in [("threshold0", 20), ("valueLabel0", 18), ("value0", 22), ("symbol", 22), ("mockText", 20), ("stale", 20)] {
      XCTAssertEqual(milestoneLayout.lineHeight(try XCTUnwrap(milestoneLayout.texts[id], id).value), CGFloat(expected), id)
    }
  }

  func testSmartXRowsDoNotUseGenericRowPress() throws {
    for type in ["smartxOpinion", "smartxTrade", "smartxMilestone", "smartxAnnouncement"] {
      XCTAssertFalse(try item(type, content: payload()).isRowPressEnabled)
    }
    XCTAssertTrue(try NativeListItem(data: ["key": "legacy", "type": "message"]).isRowPressEnabled)
  }
}
