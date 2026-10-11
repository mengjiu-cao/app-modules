import UIKit

/// The four finite Square templates share one geometry pass for drawing and measurement.
/// Values and action keys are caller-owned presentation data; no business interpretation occurs here.
enum NativeListSmartXRenderer {
  private static let heights: NSCache<NSString, NSNumber> = {
    let cache = NSCache<NSString, NSNumber>()
    cache.countLimit = 512
    cache.totalCostLimit = 2 * 1024 * 1024
    return cache
  }()

  static func measure(_ item: NativeListItem, width: CGFloat) -> CGFloat {
    let key = "\(width):\(item.content)" as NSString
    if let height = heights.object(forKey: key) { return CGFloat(height.doubleValue) }
    let height = Layout(item: item, width: width).height
    heights.setObject(NSNumber(value: Double(height)), forKey: key, cost: key.length * 2)
    return height
  }

  struct Text {
    let value: NSAttributedString
    let frame: CGRect
    let lines: Int
    var actions: [String: [String: Any]] = [:]
  }
  struct Image {
    let uri: String
    let frame: CGRect
    let radius: CGFloat
    let fallbackURI: String
    let fallbackText: String
    let token: Bool
    let testID: String?
  }
  struct Box {
    let frame: CGRect
    let fill: UIColor
    let border: UIColor
    let radius: CGFloat
    var testID: String? = nil
  }
  struct Action {
    let data: [String: Any]
    let frame: CGRect
    let visualIDs: [String]
  }
  struct Layout {
    let data: [String: Any]
    let theme: [String: Any]
    let assets: [String: Any]
    let width: CGFloat
    let scale: CGFloat
    var texts: [String: Text] = [:]
    var images: [String: Image] = [:]
    var boxes: [String: Box] = [:]
    var actions: [Action] = []
    var dot: CGRect?
    var height: CGFloat = 0

    init(item: NativeListItem, width: CGFloat) {
      self.width = max(1, width)
      data = item.data.dictionary("smartx") ?? [:]
      theme = data.dictionary("theme") ?? [:]
      assets = data.dictionary("assets") ?? [:]
      scale = CGFloat(max(0.1, data.double("fontScale", default: 1)))
      if item.type == "smartxAnnouncement" {
        announcement()
      } else {
        let y = author(opinion: item.type == "smartxOpinion")
        switch item.type {
        case "smartxOpinion": opinion(y: y + 8)
        case "smartxTrade": trade(y: y + 8)
        case "smartxMilestone": milestone(y: y + 8)
        default: height = y
        }
        if data.bool("separator") {
          height += 9
          boxes["separator"] = Box(frame: CGRect(x: 52, y: height, width: max(0, width - 52), height: 1), fill: color("divider"), border: .clear, radius: 0)
          height += 1
        }
        height = max(height, 44)
        if item.type == "smartxTrade", let action = data.dictionary("rowAction") {
          actions.insert(Action(data: action, frame: CGRect(x: 0, y: 0, width: width, height: height), visualIDs: Array(texts.keys) + Array(images.keys)), at: 0)
        }
      }
      height = ceil(height)
    }

    func color(_ key: String) -> UIColor { Self.parseColor(theme.string(key)) }
    static func parseColor(_ value: String) -> UIColor {
      if value.hasPrefix("rgba("), value.hasSuffix(")") {
        let numbers = value.dropFirst(5).dropLast().split(separator: ",").compactMap { Double($0.trimmingCharacters(in: .whitespaces)) }
        if numbers.count == 4 { return UIColor(red: numbers[0] / 255, green: numbers[1] / 255, blue: numbers[2] / 255, alpha: numbers[3]) }
      }
      return UIColor(nativeListHex: value, fallback: .clear)
    }
    func font(_ size: CGFloat, _ weight: String = "medium", italic: Bool = false) -> UIFont {
      let family = theme.dictionary("fonts")?.string(weight) ?? ""
      let font = UIFont(name: family, size: size * scale) ?? UIFont.systemFont(ofSize: size * scale, weight: weight == "regular" ? .regular : weight == "bold" ? .bold : weight == "semibold" ? .semibold : .medium)
      guard italic, let descriptor = font.fontDescriptor.withSymbolicTraits(.traitItalic) else { return font }
      return UIFont(descriptor: descriptor, size: font.pointSize)
    }
    func value(_ text: String, size: CGFloat = 14, weight: String = "medium", tone: UIColor? = nil, line: CGFloat = 20) -> NSAttributedString {
      let paragraph = NSMutableParagraphStyle()
      paragraph.minimumLineHeight = line * scale
      paragraph.maximumLineHeight = line * scale
      paragraph.lineBreakMode = .byWordWrapping
      let resolved = font(size, weight)
      return NSAttributedString(string: text, attributes: [.font: resolved, .foregroundColor: tone ?? color("text"), .paragraphStyle: paragraph, .baselineOffset: (line * scale - resolved.lineHeight) / 2])
    }
    func extent(_ text: NSAttributedString, width: CGFloat, lines: Int = 0) -> CGSize {
      guard text.length > 0 else { return .zero }
      let storage = NSTextStorage(attributedString: text)
      let manager = NSLayoutManager()
      let container = NSTextContainer(size: CGSize(width: max(1, width), height: .greatestFiniteMagnitude))
      container.lineFragmentPadding = 0
      container.maximumNumberOfLines = lines
      container.lineBreakMode = lines > 0 ? .byTruncatingTail : .byWordWrapping
      manager.addTextContainer(container)
      storage.addLayoutManager(manager)
      manager.ensureLayout(for: container)
      let rect = manager.usedRect(for: container)
      return CGSize(width: ceil(rect.width), height: ceil(rect.height))
    }
    @discardableResult mutating func text(_ id: String, _ value: NSAttributedString, x: CGFloat, y: CGFloat, width: CGFloat, lines: Int = 0, height: CGFloat? = nil) -> CGRect {
      let frame = CGRect(x: x, y: y, width: max(1, width), height: height ?? extent(value, width: width, lines: lines).height)
      texts[id] = Text(value: value, frame: frame, lines: lines)
      return frame
    }
    mutating func action(_ data: [String: Any]?, _ frame: CGRect, _ visualIDs: [String]) {
      guard let data else { return }
      actions.append(Action(data: data, frame: frame, visualIDs: visualIDs))
    }
    mutating func image(_ id: String, uri: String, _ frame: CGRect, radius: CGFloat = 0, fallbackURI: String = "", fallbackText: String = "", token: Bool = false, testID: String? = nil) {
      images[id] = Image(uri: uri, frame: frame, radius: radius, fallbackURI: fallbackURI, fallbackText: fallbackText, token: token, testID: testID)
    }
    mutating func asset(_ id: String, _ key: String, _ frame: CGRect) { image(id, uri: assets.string(key), frame) }
    mutating func token(_ token: [String: Any], id: String, x: CGFloat, y: CGFloat) {
      image(id, uri: token.string("logoUri"), CGRect(x: x, y: y, width: 36, height: 36), radius: 18, fallbackText: token.string("fallbackText"), token: true)
    }
    mutating func card(_ id: String, _ frame: CGRect, testID: String? = nil) {
      boxes[id] = Box(frame: frame, fill: color("subtleFill"), border: color("border"), radius: 16, testID: testID)
    }
    mutating func tag(_ tag: [String: Any], x: CGFloat, y: CGFloat) -> CGFloat {
      let string = value(tag.string("text"), size: 12, tone: Self.parseColor(tag.string("color")), line: 18)
      let w = extent(string, width: width, lines: 1).width + 12
      boxes["tag"] = Box(frame: CGRect(x: x, y: y, width: w, height: 20), fill: Self.parseColor(tag.string("backgroundColor")), border: .clear, radius: 6, testID: tag.string("testID"))
      text("tagText", string, x: x + 6, y: y + (20 - 18 * scale) / 2, width: w - 12, lines: 1)
      return w
    }
    mutating func author(opinion: Bool) -> CGFloat {
      let author = data.dictionary("author") ?? [:]
      let hasHandle = opinion && !author.string("handle").isEmpty
      let headH = max(opinion && !hasHandle ? 28 : 20, 20 * scale)
      image("avatar", uri: author.string("avatarUri"), CGRect(x: 16, y: 16, width: 28, height: 28), radius: 14, fallbackURI: assets.string("defaultAvatarUri"))
      action(author.dictionary("avatarAction"), CGRect(x: 16, y: 16, width: 28, height: 28), ["avatar"])
      let time = value(author.string("time"), size: 12, weight: "regular", tone: color("secondaryText"), line: 18)
      let timeW = extent(time, width: width, lines: 1).width
      let tagData = data.dictionary("tag")
      let tagW = tagData.map { extent(value($0.string("text"), size: 12, line: 18), width: width, lines: 1).width + 12 } ?? 0
      let more = data.dictionary("moreAction")
      let available = max(1, width - 68 - (more == nil ? 0 : 28))
      let name = value(author.string("name"))
      let nameW = min(extent(name, width: available, lines: 1).width, max(1, available - timeW - (timeW > 0 ? 4 : 0) - (tagW > 0 ? tagW + 4 : 0)))
      let nameFrame = text("author", name, x: 52, y: 16 + (headH - 20 * scale) / 2, width: nameW, lines: 1)
      action(author.dictionary("nameAction"), nameFrame, ["author"])
      var x = 52 + nameW
      if let tagData { x += 4; x += tag(tagData, x: x, y: 16 + (headH - 20) / 2) }
      if timeW > 0 { text("time", time, x: x + 4, y: 16 + (headH - 18 * scale) / 2, width: timeW, lines: 1) }
      if more != nil {
        let frame = CGRect(x: width - 36, y: 16 + (headH - 20) / 2, width: 20, height: 20)
        asset("more", "moreUri", CGRect(x: frame.minX + 2, y: frame.minY + 8.22, width: 16, height: 3.55556))
        action(more, frame.insetBy(dx: -8, dy: -8), ["more"])
      }
      var bottom = 16 + headH
      if hasHandle {
        let handle = author.string("handle")
        bottom = text("handle", value(handle.hasPrefix("@") ? handle : "@" + handle, size: 12, tone: color("secondaryText"), line: 18), x: 52, y: bottom + 2, width: width - 68, lines: 1).maxY
      }
      return bottom
    }
    mutating func like(_ like: [String: Any], x: CGFloat, y: CGFloat, announcement: Bool = false) -> CGRect {
      let count = value(like.string("count"), size: 12, tone: color("secondaryText"), line: 18)
      let gap: CGFloat = announcement ? 8 : 5
      let w = max(34, 20 + gap + extent(count, width: width, lines: 1).width + (announcement ? 8 : 0))
      let h = max(announcement ? 28 : 32, 18 * scale)
      asset("likeIcon", like.bool("liked") ? "likeFilledUri" : "likeUri", CGRect(x: x, y: y + (h - 20) / 2, width: 20, height: 20))
      text("likeCount", count, x: x + 20 + gap, y: y + (h - 18 * scale) / 2, width: max(1, w - 20 - gap), lines: 1)
      let frame = CGRect(x: x, y: y, width: w, height: h)
      action(like.dictionary("action"), frame, ["likeIcon", "likeCount"])
      return frame
    }
    mutating func opinion(y: CGFloat) {
      let body = text("body", value(data.string("body")), x: 52, y: y, width: width - 68)
      action(data.dictionary("bodyAction"), body, ["body"])
      var bottom = body.maxY
      if let position = data.dictionary("position") { bottom = opinionPosition(position, y: bottom + 8) }
      let actionY = bottom + 8
      let likeRect = like(data.dictionary("like") ?? [:], x: 52, y: actionY)
      var cursor = likeRect.maxX + 8
      var rowY = actionY
      var rowH = likeRect.height
      let links = data.dictionaries("links")
      for (i, link) in links.enumerated() {
        let label = value(link.string("label"), size: 12, tone: color("secondaryText"), line: 18)
        let w = min(max(1, width - 68), extent(label, width: width, lines: 1).width + 60)
        let h = max(20, 18 * scale + 4)
        if cursor + w > width - 16 { cursor = 52; rowY += rowH + 8; rowH = 0 }
        // React's space-between places the last fitting link at the trailing edge.
        if i == links.count - 1 { cursor = max(cursor, width - 16 - w) }
        let id = "link\(i)"
        let frame = CGRect(x: cursor, y: rowY + max(0, (rowH - h) / 2), width: w, height: h)
        boxes[id] = Box(frame: frame, fill: color("subtleFill"), border: color("border"), radius: 8)
        asset(id + "X", "xUri", CGRect(x: frame.minX + 10, y: frame.midY - 8, width: 16, height: 16))
        text(id + "Text", label, x: frame.minX + 30, y: frame.midY - 9 * scale, width: max(1, w - 60), lines: 1)
        asset(id + "Arrow", "arrowUpRightUri", CGRect(x: frame.maxX - 26, y: frame.midY - 8, width: 16, height: 16))
        action(link.dictionary("action"), frame, [id, id + "X", id + "Text", id + "Arrow"])
        cursor += w + 8; rowH = max(rowH, h)
      }
      bottom = rowY + rowH
      if let followed = data.dictionary("followedLikes") {
        var x: CGFloat = 52
        let top = bottom + 8
        for (i, avatar) in followed.dictionaries("avatars").enumerated() {
          let id = "followedAvatar\(i)"
          boxes[id + "Border"] = Box(frame: CGRect(x: x, y: top, width: 20, height: 20), fill: color("raised"), border: color("canvas"), radius: 10)
          image(id, uri: avatar.string("uri"), CGRect(x: x + 1, y: top + 1, width: 18, height: 18), radius: 9, fallbackURI: assets.string("defaultAvatarUri"), testID: avatar.string("testID"))
          x += 14
        }
        if !followed.dictionaries("avatars").isEmpty { x += 6 }
        if !followed.string("extraCount").isEmpty {
          let extra = value(followed.string("extraCount"), size: 12, tone: color("secondaryText"), line: 18)
          let w = max(20, extent(extra, width: width, lines: 1).width + 8)
          x += 4
          boxes["followedExtra"] = Box(frame: CGRect(x: x, y: top, width: w, height: 20), fill: color("subtleFill"), border: .clear, radius: 10)
          text("followedExtraText", extra, x: x + 4, y: top + (20 - 18 * scale) / 2, width: w - 8, lines: 1)
          x += w
        }
        let runs = NSMutableAttributedString(string: "")
        for run in followed.dictionaries("text") { runs.append(value(run.string("text"), size: 12, tone: Self.parseColor(run.string("color")), line: 18)) }
        let h = max(20, 18 * scale)
        text("followedText", runs, x: x + 8, y: top + (h - 18 * scale) / 2, width: width - 24 - x, lines: 1)
        action(followed.dictionary("action"), CGRect(x: 52, y: top, width: width - 68, height: h), Array(texts.keys.filter { $0.hasPrefix("followed") }) + Array(images.keys.filter { $0.hasPrefix("followed") }))
        bottom = top + h
      }
      height = bottom
    }
    mutating func opinionPosition(_ position: [String: Any], y: CGFloat) -> CGFloat {
      let x: CGFloat = 52, w = max(1, width - 68)
      let h = max(64, 18 + 40 * scale)
      let frame = CGRect(x: x, y: y, width: w, height: h)
      card("position", frame, testID: position.string("testID"))
      token(position.dictionary("token") ?? [:], id: "positionLogo", x: x + 9, y: y + (h - 36) / 2)
      let hasPrimary = position.dictionary("primary") != nil
      let identityX = x + 53
      let identityW = max(1, w - 62 - (hasPrimary ? 104 : 0))
      let kicker = value(position.string("cycleLabel"), size: 12, tone: color("secondaryText"), line: 18)
      let kickerW = min(max(1, identityW - 8), extent(kicker, width: identityW, lines: 1).width)
      let textY = y + (h - 40 * scale) / 2
      text("cycle", kicker, x: identityX, y: textY, width: kickerW, lines: 1)
      dot = CGRect(x: identityX + kickerW + 4, y: textY + 9 * scale - 2, width: 4, height: 4)
      text("symbol", value(position.dictionary("token")?.string("symbol") ?? ""), x: identityX, y: textY + 18 * scale + 2, width: identityW, lines: 1)
      if let primary = position.dictionary("primary") {
        let valueX = x + w - 105
        let p = value(primary.string("text"), tone: Self.parseColor(primary.string("color")))
        let pW = min(96, extent(p, width: 96, lines: 1).width)
        let hasSecondary = position.dictionary("secondary") != nil
        let top = y + (h - (hasSecondary ? 38 : 20) * scale) / 2
        text("primary", p, x: valueX + 96 - pW, y: top, width: pW, lines: 1)
        if let secondary = position.dictionary("secondary") {
          let s = value(secondary.string("text"), size: 12, tone: Self.parseColor(secondary.string("color")), line: 18)
          let direction = secondary.string("direction")
          let sW = min(direction.isEmpty ? 96 : 84, extent(s, width: 96, lines: 1).width)
          text("secondary", s, x: valueX + 96 - sW, y: top + 20 * scale, width: sW, lines: 1)
          if !direction.isEmpty { asset("direction", direction == "up" ? "changeUpUri" : "changeDownUri", CGRect(x: valueX + 84 - sW, y: top + 20 * scale + (18 * scale - 16) / 2, width: 12, height: 16)) }
        }
      }
      action(position.dictionary("action"), frame, ["position", "positionLogo", "cycle", "symbol", "primary", "secondary", "direction"])
      action(position.dictionary("logoAction"), CGRect(x: x + 5, y: y + (h - 36) / 2 - 4, width: 44, height: 44), ["positionLogo"])
      return frame.maxY
    }
    mutating func trade(y: CGFloat) {
      let tokenData = data.dictionary("token") ?? [:]
      let h = max(40, 20 * scale)
      token(tokenData, id: "token", x: 52, y: y + (h - 36) / 2)
      let string = NSMutableAttributedString(attributedString: value(tokenData.string("symbol") + (data.string("amount").isEmpty ? "" : " " + data.string("amount"))))
      string.append(value(" at", tone: color("secondaryText")))
      string.append(value(" " + data.string("marketCap")))
      string.append(value(" MC", tone: color("secondaryText")))
      text("tradeText", string, x: 96, y: y + (h - 20 * scale) / 2, width: width - 112, lines: 1)
      action(data.dictionary("tokenAction"), CGRect(x: 52, y: y, width: width - 68, height: h), ["token", "tradeText"])
      action(data.dictionary("logoAction"), CGRect(x: 48, y: y + (h - 36) / 2 - 4, width: 44, height: 44), ["token"])
      height = y + h
    }
    mutating func milestone(y: CGFloat) {
      var bottom = y
      let thresholds = data["thresholds"] as? [String] ?? []
      for (i, threshold) in thresholds.enumerated() {
        let string = NSMutableAttributedString(string: "")
        if i > 0 { string.append(value(" · ", tone: color("secondaryText"))) }
        string.append(value(threshold))
        bottom = text("threshold\(i)", string, x: 52, y: bottom, width: width - 68).maxY + (i < thresholds.count - 1 ? 2 : 0)
      }
      if let position = data.dictionary("position") {
        let top = bottom + 8
        token(position.dictionary("token") ?? [:], id: "positionLogo", x: 61, y: top + 9)
        let badge = position.string("mockText")
        let badgeW = badge.isEmpty ? 0 : extent(value(badge, size: 12, line: 18), width: width, lines: 1).width + 14
        text("symbol", value(position.dictionary("token")?.string("symbol") ?? ""), x: 105, y: top + 9 + (36 - 20 * scale) / 2, width: width - 130 - badgeW, lines: 1)
        if badgeW > 0 {
          let bx = width - 25 - badgeW, bh = 18 * scale + 6
          boxes["mock"] = Box(frame: CGRect(x: bx, y: top + 27 - bh / 2, width: badgeW, height: bh), fill: .clear, border: color("border"), radius: 6)
          text("mockText", value(badge, size: 12, tone: color("secondaryText"), line: 18), x: bx + 7, y: top + 27 - 9 * scale, width: badgeW - 14, lines: 1)
        }
        bottom = top + 9 + max(36, 20 * scale) + 8
        let values = position.dictionaries("values")
        for (i, row) in values.enumerated() {
          let string = value(row.string("text"), weight: "semibold", tone: Self.parseColor(row.string("color")))
          let available = max(1, width - 86)
          let valueW = min(available * 0.6, extent(string, width: available, lines: 1).width)
          let label = value(row.string("label"), size: 12, tone: color("secondaryText"), line: 18)
          let labelW = max(1, available - valueW - 12)
          let rowH = max(20 * scale, extent(label, width: labelW).height)
          text("valueLabel\(i)", label, x: 61, y: bottom + (rowH - extent(label, width: labelW).height) / 2, width: labelW)
          text("value\(i)", string, x: width - 25 - valueW, y: bottom + (rowH - 20 * scale) / 2, width: valueW, lines: 1)
          bottom += rowH + (i < values.count - 1 ? 4 : 0)
        }
        if !position.string("staleText").isEmpty {
          let stale = NSMutableAttributedString(attributedString: value(position.string("staleText"), size: 12, tone: color("secondaryText"), line: 18))
          let p = NSMutableParagraphStyle(); p.alignment = .right; p.minimumLineHeight = 18 * scale; p.maximumLineHeight = 18 * scale
          stale.addAttribute(.paragraphStyle, value: p, range: NSRange(location: 0, length: stale.length))
          bottom = text("stale", stale, x: 61, y: bottom + 4, width: width - 86).maxY
        }
        bottom += 9
        let frame = CGRect(x: 52, y: top, width: width - 68, height: bottom - top)
        card("position", frame)
        action(position.dictionary("action"), frame, ["position", "positionLogo", "symbol", "mock", "mockText", "stale"] + Array(texts.keys.filter { $0.hasPrefix("value") }))
      }
      height = bottom
    }
    mutating func announcement() {
      let author = data.dictionary("author") ?? [:]
      image("avatar", uri: author.string("avatarUri"), CGRect(x: 16, y: 12, width: 28, height: 28), radius: 14, fallbackURI: assets.string("defaultAvatarUri"))
      let pinned = value(data.string("pinnedLabel"), size: 12, tone: color("secondaryText"), line: 18)
      let pinnedW = extent(pinned, width: width, lines: 1).width + 14
      let time = value(author.string("time"), size: 12, tone: color("secondaryText"), line: 18)
      let timeW = extent(time, width: width, lines: 1).width
      let name = value(author.string("name"), size: 16, weight: "semibold", line: 24)
      let headH = max(28, 24 * scale)
      let nameW = min(extent(name, width: width, lines: 1).width, max(1, width - 52 - 28 - 16 - pinnedW - timeW - 6 - (data.bool("verified") ? 16 : 0)))
      text("author", name, x: 52, y: 12 + (headH - 24 * scale) / 2, width: nameW, lines: 1)
      var x = 52 + nameW
      if data.bool("verified") {
        asset("verified", "announcementBadgeUri", CGRect(x: x + 5.5, y: 12 + (headH - 12) / 2 + 1.5, width: 10.5, height: 10.5)); x += 16
      }
      text("time", time, x: x + 6, y: 12 + (headH - 18 * scale) / 2, width: timeW, lines: 1)
      asset("pinnedIcon", "announcementPinnedUri", CGRect(x: width - 28 - pinnedW, y: 12 + (headH - 12) / 2, width: 12, height: 12))
      text("pinnedLabel", pinned, x: width - 28 - pinnedW + 14, y: 12 + (headH - 18 * scale) / 2, width: pinnedW - 14, lines: 1)
      let cardY = 12 + headH + 4
      var y = cardY + 12
      if !data.string("title").isEmpty {
        asset("titleIcon", "announcementTitleUri", CGRect(x: 66, y: y + (20 * scale - 16) / 2, width: 16, height: 16))
        y = text("title", value(data.string("title")), x: 88, y: y, width: width - 130, lines: 1).maxY + 8
      }
      let rich = NSMutableAttributedString(string: "")
      var inlineActions: [String: [String: Any]] = [:]
      for (i, span) in data.dictionaries("spans").enumerated() {
        let run = NSMutableAttributedString(attributedString: value(span.string("text"), weight: span.bool("bold") ? "bold" : "regular", tone: span.string("kind") == "text" ? color("text") : color("primary")))
        let range = NSRange(location: 0, length: run.length)
        run.addAttribute(.font, value: font(14, span.bool("bold") ? "bold" : "regular", italic: span.bool("italic")), range: range)
        if span.string("kind") == "link" { run.addAttribute(.underlineStyle, value: NSUnderlineStyle.single.rawValue, range: range) }
        if let action = span.dictionary("action"), !action.bool("disabled") {
          let url = "smartx-action://span/\(i)"
          run.addAttribute(.link, value: url, range: range); inlineActions[url] = action
        }
        rich.append(run)
      }
      let body = text("announcementBody", rich, x: 64, y: y, width: width - 104, lines: data.bool("expanded") ? 0 : 2)
      texts["announcementBody"]?.actions = inlineActions
      y = body.maxY + 12
      let toggle = value(data.string("toggleLabel"), size: 12, tone: color("primary"), line: 18)
      let toggleH = max(20, 18 * scale)
      let toggleFrame = text("toggle", toggle, x: 64, y: y, width: min(width - 104, extent(toggle, width: width, lines: 1).width), lines: 1, height: toggleH)
      action(data.dictionary("toggleAction"), toggleFrame.insetBy(dx: -8, dy: -8), ["toggle"])
      y += toggleH + 12
      boxes["announcementCard"] = Box(frame: CGRect(x: 52, y: cardY, width: width - 80, height: y - cardY), fill: color("selectedFill"), border: .clear, radius: 8)
      height = like(data.dictionary("like") ?? [:], x: 52, y: y + 8, announcement: true).maxY + 9
      if data.bool("separator") {
        // The existing FlashList header owns this divider outside the card's
        // bottom padding, with a 16pt trailing inset (feed rows are full bleed).
        boxes["separator"] = Box(frame: CGRect(x: 52, y: height, width: max(0, width - 68), height: 1), fill: color("divider"), border: .clear, radius: 0)
        height += 1
      }
    }
  }
}

/// OneKeyImage owns source cancellation/cache. Slots survive text-only binds; detached rows recycle.
private final class NativeListSmartXImageView: UIView {
  private let primary = NativeListImageSlot()
  private let fallback = NativeListImageSlot()
  private let label = UILabel()
  private let shimmer = UIView()
  private let gradient = CAGradientLayer()
  private var boundIdentity: [String]?
  private var primaryResult: Bool?
  private var isAvatar = false
  private var hasPrimary = false
  private var reducedMotion = false
  override init(frame: CGRect) {
    super.init(frame: frame)
    gradient.startPoint = CGPoint(x: 0, y: 0.5)
    gradient.endPoint = CGPoint(x: 1, y: 0.5)
    gradient.locations = [0, 0.5, 1]
    shimmer.layer.addSublayer(gradient)
    addSubview(fallback.view); addSubview(label); addSubview(shimmer); addSubview(primary.view)
    isUserInteractionEnabled = false
  }
  required init?(coder: NSCoder) { fatalError("init(coder:) has not been implemented") }
  func bind(_ image: NativeListSmartXRenderer.Image, layout: NativeListSmartXRenderer.Layout, key: String) {
    frame = image.frame; layer.cornerRadius = image.radius; clipsToBounds = image.radius > 0
    accessibilityIdentifier = image.testID
    isAvatar = !image.fallbackURI.isEmpty
    hasPrimary = !image.uri.isEmpty
    reducedMotion = layout.data.bool("reducedMotion")
    let next = [key, image.uri, image.fallbackURI]
    if boundIdentity != next { boundIdentity = next; primaryResult = nil }
    backgroundColor = image.token ? layout.color("tokenBackground") : .clear
    layer.borderWidth = image.token ? 1 : 0
    layer.borderColor = layout.color("tokenBorder").cgColor
    label.text = image.fallbackText; label.font = layout.font(frame.width <= 18 ? 9 : 12, "regular")
    label.textColor = layout.color("tokenText"); label.textAlignment = .center
    label.adjustsFontSizeToFitWidth = true; label.minimumScaleFactor = 0.1
    shimmer.backgroundColor = layout.color("skeleton")
    gradient.colors = [UIColor.clear.cgColor, layout.color("border").cgColor, UIColor.clear.cgColor]
    if isAvatar { fallback.bind(["uri": image.fallbackURI], key: key + ":fallback", placeholder: "#00000000") } else { fallback.recycle() }
    if !hasPrimary { primary.recycle(); primaryResult = false } else {
      primary.bind(["uri": image.uri], key: key, fit: image.token || image.radius > 0 ? "cover" : "contain", placeholder: "#00000000") { [weak self] loaded in
        self?.primaryResult = loaded
        self?.updateVisibility()
      }
    }
    updateVisibility(); setNeedsLayout()
  }
  private func updateVisibility() {
    primary.view.isHidden = primaryResult != true
    fallback.view.isHidden = !isAvatar || primaryResult != false
    label.isHidden = primaryResult == true
    shimmer.isHidden = !isAvatar || !hasPrimary || primaryResult != nil
    updateAnimation()
  }
  private func updateAnimation() {
    let active = window != nil && !shimmer.isHidden && !reducedMotion && !UIAccessibility.isReduceMotionEnabled
    gradient.isHidden = reducedMotion || UIAccessibility.isReduceMotionEnabled
    guard active, bounds.width > 0 else { gradient.removeAllAnimations(); return }
    guard gradient.animation(forKey: "smartxAvatarShimmer") == nil else { return }
    let animation = CABasicAnimation(keyPath: "transform.translation.x")
    animation.fromValue = -bounds.width; animation.toValue = bounds.width
    animation.duration = 1.2; animation.repeatCount = .infinity
    animation.timingFunction = CAMediaTimingFunction(name: .linear)
    gradient.add(animation, forKey: "smartxAvatarShimmer")
  }
  override func layoutSubviews() {
    super.layoutSubviews()
    primary.view.frame = bounds; fallback.view.frame = bounds
    label.frame = bounds.insetBy(dx: bounds.width * 0.1, dy: 0)
    shimmer.frame = bounds
    CATransaction.begin(); CATransaction.setDisableActions(true); gradient.frame = bounds; CATransaction.commit()
    updateAnimation()
  }
  override func didMoveToWindow() { super.didMoveToWindow(); updateAnimation() }
  func recycle() {
    primary.recycle(); fallback.recycle(); label.text = nil
    boundIdentity = nil; primaryResult = nil
    hasPrimary = false; shimmer.isHidden = true; gradient.removeAllAnimations()
  }
}

private final class NativeListSmartXActionControl: UIControl {
  var invoke: (() -> Void)?
  var visualViews: [UIView] = []
  var pressedOpacity: CGFloat = 0.6
  var restingOpacity: CGFloat = 1
  override var isHighlighted: Bool { didSet { updateOpacity() } }
  override init(frame: CGRect) { super.init(frame: frame); addTarget(self, action: #selector(pressed), for: .touchUpInside) }
  required init?(coder: NSCoder) { fatalError("init(coder:) has not been implemented") }
  private func updateOpacity() { visualViews.forEach { $0.alpha = isHighlighted ? restingOpacity * pressedOpacity : restingOpacity } }
  func bind(_ action: NativeListSmartXRenderer.Action, theme: [String: Any]) {
    cancelTracking(with: nil)
    frame = action.frame
    isEnabled = !action.data.bool("disabled")
    isAccessibilityElement = true
    accessibilityIdentifier = action.data.string("testID")
    accessibilityLabel = action.data.string("label")
    accessibilityTraits = action.data.string("role") == "link" ? .link : .button
    if !isEnabled { accessibilityTraits.insert(.notEnabled) }
    if action.data.bool("selected") { accessibilityTraits.insert(.selected) }
    if action.data.bool("busy") { accessibilityTraits.insert(.updatesFrequently) }
    // UIKit has no expanded trait; preserve the state as the control's accessible value.
    accessibilityValue = action.data["expanded"].map { ($0 as? Bool ?? false) ? "expanded" : "collapsed" }
    pressedOpacity = CGFloat(theme.double("pressedOpacity", default: 0.6))
    restingOpacity = isEnabled ? 1 : CGFloat(theme.double("disabledOpacity", default: 0.3))
    isHighlighted = false; updateOpacity()
  }
  @objc private func pressed() { if isEnabled { invoke?() } }
  override func accessibilityActivate() -> Bool { guard isEnabled else { return false }; invoke?(); return true }
}

private final class NativeListSmartXDotView: UIView {
  private let glow = CAGradientLayer()
  private let dot = CALayer()
  var breathing = false
  var reducedMotion = false
  override init(frame: CGRect) {
    super.init(frame: frame)
    isUserInteractionEnabled = false; clipsToBounds = false
    glow.type = .radial; glow.startPoint = CGPoint(x: 0.5, y: 0.5); glow.endPoint = CGPoint(x: 1, y: 1)
    glow.locations = [0, 0.22, 0.55, 1]
    layer.addSublayer(glow); layer.addSublayer(dot)
  }
  required init?(coder: NSCoder) { fatalError("init(coder:) has not been implemented") }
  func bind(color: UIColor, breathing: Bool, reducedMotion: Bool) {
    self.breathing = breathing; self.reducedMotion = reducedMotion
    glow.colors = [color.cgColor, color.withAlphaComponent(0.62).cgColor, color.withAlphaComponent(0.28).cgColor, color.withAlphaComponent(0).cgColor]
    dot.backgroundColor = color.cgColor; updateAnimation()
  }
  override func layoutSubviews() { super.layoutSubviews(); dot.frame = bounds; dot.cornerRadius = bounds.width / 2; glow.frame = CGRect(x: bounds.midX - 5, y: bounds.midY - 5, width: 10, height: 10) }
  override func didMoveToWindow() { super.didMoveToWindow(); updateAnimation() }
  private func updateAnimation() {
    glow.removeAllAnimations()
    glow.isHidden = !breathing || reducedMotion || UIAccessibility.isReduceMotionEnabled
    guard window != nil, !glow.isHidden else { return }
    let scale = CABasicAnimation(keyPath: "transform.scale"); scale.fromValue = 1; scale.toValue = 1.8
    let opacity = CABasicAnimation(keyPath: "opacity"); opacity.fromValue = 1; opacity.toValue = 0.15
    let animation = CAAnimationGroup(); animation.animations = [scale, opacity]; animation.duration = 1.6
    animation.repeatCount = .infinity; animation.timingFunction = CAMediaTimingFunction(controlPoints: 0.33, 1, 0.68, 1)
    glow.add(animation, forKey: "smartxPositionBreath")
  }
  func recycle() { breathing = false; glow.removeAllAnimations(); glow.isHidden = true }
}

final class NativeListSmartXCell: NativeListRowHost, UITextViewDelegate {
  private var item: NativeListItem?
  private var renderedWidth: CGFloat = -1
  private var labels: [String: UILabel] = [:]
  private var images: [String: NativeListSmartXImageView] = [:]
  private var boxes: [String: UIView] = [:]
  private var controls: [NativeListSmartXActionControl] = []
  private let richText = UITextView()
  private let dot = NativeListSmartXDotView(frame: .zero)
  private var inlineActions: [String: [String: Any]] = [:]
  private var hasBeenAttached = false

  override class func appliesSizePreset(_ item: NativeListItem) -> Bool { false }
  override class func measure(_ item: NativeListItem, width: CGFloat, theme: [String: Any]?, layout: String) -> CGFloat? { NativeListSmartXRenderer.measure(item, width: width) }
  override init(frame: CGRect) {
    super.init(frame: frame)
    isAccessibilityElement = false
    contentView.addSubview(richText); contentView.addSubview(dot)
    richText.backgroundColor = .clear; richText.isScrollEnabled = false; richText.isEditable = false
    richText.textContainerInset = .zero; richText.textContainer.lineFragmentPadding = 0
    richText.delegate = self; richText.dataDetectorTypes = []
    richText.linkTextAttributes = [:]
  }
  required init?(coder: NSCoder) { fatalError("init(coder:) has not been implemented") }
  override func bind(item: NativeListItem, theme: [String: Any]?, layout: String, itemIndex: Int? = nil, selected: Bool, checkboxState: (NativeListItem, NativeSelectionTarget?, String) -> String) {
    guard self.item?.content != item.content else { return }
    if self.item != nil { onBindingInvalidated?(self, bindingEpoch) }
    bindingEpoch &+= 1
    controls.forEach { $0.cancelTracking(with: nil); $0.invoke = nil }
    inlineActions.removeAll()
    self.item = item; renderedWidth = -1
    accessibilityIdentifier = item.data.string("testID")
    contentView.accessibilityIdentifier = item.data.string("testID")
    isUserInteractionEnabled = !item.data.bool("disabled")
    setNeedsLayout()
  }
  override func layoutSubviews() {
    super.layoutSubviews()
    guard let item, bounds.width > 0, renderedWidth != bounds.width else { return }
    renderedWidth = bounds.width
    render(NativeListSmartXRenderer.Layout(item: item, width: bounds.width), item: item)
  }
  private func render(_ layout: NativeListSmartXRenderer.Layout, item: NativeListItem) {
    contentView.backgroundColor = layout.color("canvas")
    // Keep UIControls as well as visual slots through patches. The binding epoch
    // and fresh closures invalidate old actions without rebuilding the view tree.
    while controls.count > layout.actions.count {
      let removed = controls.removeLast(); removed.invoke = nil; removed.removeFromSuperview()
    }
    for id in Array(boxes.keys) where layout.boxes[id] == nil { boxes.removeValue(forKey: id)?.removeFromSuperview() }
    for (id, box) in layout.boxes {
      let view = boxes[id] ?? UIView(); boxes[id] = view
      if view.superview == nil { contentView.insertSubview(view, at: 0) }
      view.isUserInteractionEnabled = false; view.frame = box.frame; view.backgroundColor = box.fill
      view.layer.borderColor = box.border.cgColor; view.layer.borderWidth = box.border == .clear ? 0 : 1
      view.layer.cornerRadius = box.radius; view.accessibilityIdentifier = box.testID
      view.alpha = 1
    }
    for id in Array(labels.keys) where layout.texts[id] == nil { labels.removeValue(forKey: id)?.removeFromSuperview() }
    for (id, text) in layout.texts where id != "announcementBody" {
      let label = labels[id] ?? UILabel(); labels[id] = label
      if label.superview == nil { contentView.addSubview(label) }
      label.frame = text.frame
      if label.attributedText?.isEqual(to: text.value) != true { label.attributedText = text.value }
      label.numberOfLines = text.lines
      label.lineBreakMode = text.lines > 0 ? .byTruncatingTail : .byWordWrapping
      label.isUserInteractionEnabled = false; label.isAccessibilityElement = true; label.alpha = 1
      label.accessibilityIdentifier = id == "body" ? layout.data.string("bodyTestID") : id == "handle" ? layout.data.dictionary("author")?.string("handleTestID") : nil
    }
    if let body = layout.texts["announcementBody"] {
      richText.isHidden = false; richText.frame = body.frame
      richText.textContainer.maximumNumberOfLines = body.lines
      richText.textContainer.lineBreakMode = body.lines > 0 ? .byTruncatingTail : .byWordWrapping
      if richText.attributedText?.isEqual(to: body.value) != true { richText.attributedText = body.value }
      inlineActions = body.actions
    } else { richText.isHidden = true; richText.attributedText = nil; inlineActions.removeAll() }
    for id in Array(images.keys) where layout.images[id] == nil { images[id]?.recycle(); images.removeValue(forKey: id)?.removeFromSuperview() }
    for id in layout.images.keys.sorted() {
      guard let image = layout.images[id] else { continue }
      let view = images[id] ?? NativeListSmartXImageView(frame: .zero); images[id] = view
      if view.superview == nil { contentView.addSubview(view) }
      view.bind(image, layout: layout, key: item.key + ":" + id); view.alpha = 1
      contentView.bringSubviewToFront(view)
    }
    dot.isHidden = layout.dot == nil
    if let frame = layout.dot {
      dot.frame = frame
      let open = layout.data.dictionary("position")?.bool("cycleOpen") ?? false
      dot.bind(color: layout.color(open ? "success" : "mutedText"), breathing: open, reducedMotion: layout.data.bool("reducedMotion"))
    } else { dot.recycle() }
    for (index, action) in layout.actions.enumerated() {
      let control: NativeListSmartXActionControl
      if index < controls.count { control = controls[index] } else {
        control = NativeListSmartXActionControl(frame: action.frame)
        controls.append(control)
      }
      control.visualViews = action.visualIDs.compactMap { labels[$0] ?? images[$0].map { $0 as UIView } ?? boxes[$0] }
      control.visualViews.forEach { $0.isAccessibilityElement = false }
      control.bind(action, theme: layout.theme)
      let epoch = bindingEpoch
      control.invoke = { [weak self, weak control] in
        guard let self, let control, self.bindingEpoch == epoch, !action.data.bool("disabled"), self.item?.key == item.key else { return }
        self.emit(action.data.string("key"), from: control)
      }
      contentView.addSubview(control)
    }
    // The outer Trade action stays behind its nested hit targets and native text links.
    if item.type == "smartxTrade", let first = controls.first { contentView.sendSubviewToBack(first) }
  }
  private func emit(_ key: String, from view: UIView) {
    guard let item, !key.isEmpty, !item.data.bool("disabled"), window != nil else { return }
    onAction?(item, key, nil, NativeListActionOrigin(sourceView: view, ownerCell: self, bindingEpoch: bindingEpoch, source: "smartx"))
  }
  func textView(_ textView: UITextView, shouldInteractWith URL: URL, in characterRange: NSRange, interaction: UITextItemInteraction) -> Bool {
    if let action = inlineActions[URL.absoluteString], !action.bool("disabled") { emit(action.string("key"), from: textView) }
    return false
  }
  override func didMoveToWindow() {
    super.didMoveToWindow()
    if window != nil {
      hasBeenAttached = true
      renderedWidth = -1; setNeedsLayout()
    } else if hasBeenAttached {
      onBindingInvalidated?(self, bindingEpoch); bindingEpoch &+= 1
      controls.forEach { $0.invoke = nil }
      inlineActions.removeAll(); images.values.forEach { $0.recycle() }; dot.recycle()
      renderedWidth = -1
    }
  }
  override func prepareForReuse() {
    super.prepareForReuse()
    if item != nil { onBindingInvalidated?(self, bindingEpoch) }
    bindingEpoch &+= 1; item = nil; renderedWidth = -1
    controls.forEach { $0.invoke = nil; $0.removeFromSuperview() }; controls.removeAll()
    images.values.forEach { $0.recycle() }; dot.recycle()
    inlineActions.removeAll(); richText.attributedText = nil
    accessibilityIdentifier = nil
  }
}
