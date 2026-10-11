package com.margelo.nitro.nativelist

import android.animation.ValueAnimator
import android.graphics.Canvas
import android.graphics.Color
import android.graphics.LinearGradient
import android.graphics.Matrix
import android.graphics.Path
import android.graphics.Paint
import android.graphics.PorterDuff
import android.graphics.PorterDuffColorFilter
import android.graphics.Rect
import android.graphics.RadialGradient
import android.graphics.Shader
import android.graphics.Typeface
import android.graphics.drawable.GradientDrawable
import android.text.Spannable
import android.text.SpannableStringBuilder
import android.text.TextPaint
import android.text.TextUtils
import android.text.method.LinkMovementMethod
import android.text.style.ClickableSpan
import android.text.style.ForegroundColorSpan
import android.text.style.MetricAffectingSpan
import android.util.TypedValue
import android.view.Gravity
import android.view.MotionEvent
import android.view.View
import android.view.ViewGroup
import android.view.accessibility.AccessibilityNodeInfo
import android.widget.FrameLayout
import android.widget.LinearLayout
import android.widget.TextView
import androidx.core.view.ViewCompat
import com.facebook.react.common.assets.ReactFontManager
import com.facebook.react.uimanager.ThemedReactContext
import kotlin.math.max
import kotlin.math.roundToInt
import org.json.JSONArray
import org.json.JSONObject

/**
 * SmartX's finite presentation slots. Views and image slots are keyed by slot, not row data;
 * unchanged images stay attached through text/like updates. Each host retains only its current
 * tree. TextView's own layout is the measurement cache (one per text slot); there is no estimated
 * cross-row height cache. Every content/font/locale/width update measures these same drawing views.
 */
internal class NativeListSmartXRowView(context: ThemedReactContext) :
  NativeListRendererRowView(context) {
  private val nodes = LinkedHashMap<String, View>()
  private val images = LinkedHashMap<String, SmartXImage>()
  private val used = HashSet<String>()
  private val usedImages = HashSet<String>()
  private val orders = LinkedHashMap<ViewGroup, Int>()
  private var payload = JSONObject()
  private var palette = JSONObject()
  private var assets = JSONObject()
  private var rowKey = ""
  private var activeEpoch = 0L
  private var scale = 1f
  private var rowType = ""
  private val dividerPaint = Paint(Paint.ANTI_ALIAS_FLAG)
  private var separatorVisible = false
  private data class TouchExtension(val view: View, val horizontal: Int, val vertical: Int)
  private val touchExtensions = ArrayList<TouchExtension>()
  private var extendedTouchTarget: View? = null

  override val pressChangesBackground = false
  override val showsSelection = false
  override fun consumesRowClick() = true
  override fun usesSourceScale(item: NativeListItem, provided: Boolean) = true
  override fun unselectedBackground(item: NativeListItem, theme: JSONObject?, layout: String, itemIndex: Int?) =
    parseNativeListColor(item.json.getJSONObject("smartx").getJSONObject("theme").getString("canvas"))

  override fun bindContent(
    item: NativeListItem,
    theme: JSONObject?,
    layout: String,
    checkboxState: (NativeListItem, NativeSelectionTarget?, String) -> String,
  ) {
    cancelExtendedTouch()
    touchExtensions.clear()
    payload = item.json.getJSONObject("smartx")
    palette = payload.getJSONObject("theme")
    assets = payload.getJSONObject("assets")
    rowKey = item.key
    rowType = item.type
    activeEpoch = bindingEpoch
    scale = payload.getDouble("fontScale").toFloat()
    separatorVisible = payload.optBoolean("separator")
    dividerPaint.color = tone("divider")
    used.clear()
    usedImages.clear()
    orders.clear()
    orders[this] = 0
    orientation = VERTICAL
    gravity = Gravity.TOP
    clipChildren = false
    clipToPadding = false
    setPadding(0, 0, 0, 0)
    action(this, if (item.type == "smartxTrade") payload.optJSONObject("rowAction") else null)
    if (item.type == "smartxAnnouncement") announcement() else feed()
    // Remove missing optional slots after constructing the next tree. Reused slots stay attached.
    orders.forEach { (parent, count) ->
      while (parent.childCount > count) parent.removeViewAt(parent.childCount - 1)
    }
    nodes.entries.removeAll { (key, view) ->
      if (key in used) false else {
        (view.parent as? ViewGroup)?.removeView(view)
        view.animate().cancel()
        view.setOnClickListener(null)
        view.setOnTouchListener(null)
        if (view is SmartXStatusDot) view.stop()
        true
      }
    }
    images.entries.removeAll { (key, image) ->
      if (key in usedImages) false else {
        image.dispose()
        true
      }
    }
    requestLayout()
  }

  override fun bind(
    item: NativeListItem,
    theme: JSONObject?,
    layout: String,
    listOrientation: String,
    itemIndex: Int?,
    selected: Boolean,
    checkboxState: (NativeListItem, NativeSelectionTarget?, String) -> String,
    useSourceScale: Boolean,
  ) {
    super.bind(item, theme, layout, listOrientation, itemIndex, selected, checkboxState, useSourceScale)
    // SmartX has named actions; only Trade intentionally makes blank row space interactive.
    isClickable = item.type == "smartxTrade" && !payload.getJSONObject("rowAction").getBoolean("disabled")
    isFocusable = item.type == "smartxTrade"
  }

  private fun tone(name: String) = parseNativeListColor(palette.getString(name))
  private fun px(value: Int) = (value * resources.displayMetrics.density).roundToInt()
  private fun drawable(fill: Int, radius: Int = 0, border: Int? = null) = GradientDrawable().apply {
    setColor(fill)
    cornerRadius = px(radius).toFloat()
    border?.let { setStroke(px(1), it) }
  }

  @Suppress("UNCHECKED_CAST")
  private fun <T : View> node(key: String, create: () -> T): T {
    used.add(key)
    return (nodes[key] ?: create().also { nodes[key] = it }) as T
  }

  private fun group(key: String, horizontal: Boolean = false): LinearLayout {
    val result = node(key) { LinearLayout(reactContext) }
    result.orientation = if (horizontal) HORIZONTAL else VERTICAL
    result.gravity = if (horizontal) Gravity.CENTER_VERTICAL else Gravity.TOP
    result.clipChildren = false
    result.clipToPadding = false
    result.setPadding(0, 0, 0, 0)
    result.background = null
    result.minimumHeight = 0
    result.minimumWidth = 0
    result.alpha = 1f
    action(result, null)
    orders[result] = 0
    return result
  }

  private fun inline(key: String, gap: Int, shrink: Int = 0): SmartXInline {
    val result = node(key) { SmartXInline(reactContext) }
    result.gap = px(gap)
    result.shrinkIndex = shrink
    result.minimumHeight = 0
    orders[result] = 0
    return result
  }

  private fun add(parent: ViewGroup, child: View, params: ViewGroup.LayoutParams) {
    val index = orders[parent] ?: 0
    orders[parent] = index + 1
    if (child.parent !== parent || parent.indexOfChild(child) != index) {
      (child.parent as? ViewGroup)?.removeView(child)
      parent.addView(child, index.coerceAtMost(parent.childCount), params)
    } else child.layoutParams = params
  }

  private fun put(
    parent: ViewGroup,
    child: View,
    width: Int = ViewGroup.LayoutParams.MATCH_PARENT,
    height: Int = ViewGroup.LayoutParams.WRAP_CONTENT,
    top: Int = 0,
    start: Int = 0,
    end: Int = 0,
    weight: Float = 0f,
  ) {
    add(parent, child, LinearLayout.LayoutParams(width, height, weight).apply {
      topMargin = px(top)
      marginStart = px(start)
      marginEnd = px(end)
    })
  }

  private fun typeface(weight: String, italic: Boolean = false): Typeface =
    ReactFontManager.getInstance().getTypeface(
      palette.getJSONObject("fonts").getString(weight),
      if (italic) Typeface.ITALIC else Typeface.NORMAL,
      reactContext.assets,
    )

  private fun text(
    key: String,
    value: CharSequence,
    size: Int = 14,
    line: Int = 20,
    color: Int = tone("text"),
    weight: String = "medium",
    lines: Int = 1,
    themedString: Boolean = true,
  ): TextView {
    val view = node(key) { NativeListTextView(reactContext) }
    view.setPadding(0, 0, 0, 0)
    view.includeFontPadding = false
    view.typeface = typeface(weight)
    androidx.core.widget.TextViewCompat.setAutoSizeTextTypeWithDefaults(view, TextView.AUTO_SIZE_TEXT_TYPE_NONE)
    view.setTextSize(TypedValue.COMPLEX_UNIT_PX, px(size).toFloat() * scale)
    view.setTextColor(color)
    view.setLineSpacing(0f, 1f)
    view.setHorizontallyScrolling(false)
    view.maxLines = if (lines == 0) Int.MAX_VALUE else lines
    view.ellipsize = if (lines == 0) null else TextUtils.TruncateAt.END
    view.gravity = Gravity.CENTER_VERTICAL
    view.letterSpacing = 0f
    view.fontFeatureSettings = null
    view.textLocale = java.util.Locale.forLanguageTag(payload.getString("locale"))
    view.text = withLineHeight(value, (px(smartXLineHeight(line, value, themedString)) * scale).roundToInt())
    view.minimumHeight = 0
    view.minimumWidth = 0
    view.background = null
    view.movementMethod = null
    view.highlightColor = Color.TRANSPARENT
    action(view, null)
    return view
  }

  private fun withLineHeight(value: CharSequence, height: Int) = SpannableStringBuilder(value).apply {
    if (isNotEmpty()) setSpan(NativeListLineHeightSpan(height), 0, length, Spannable.SPAN_EXCLUSIVE_EXCLUSIVE)
  }

  private fun testID(view: View, value: String?) {
    view.setTag(com.facebook.react.R.id.react_test_id, value?.takeIf(String::isNotEmpty))
  }

  private fun action(view: View, data: JSONObject?) {
    // A rebind must not let a gesture begun on an old binding invoke the replacement action.
    if (view.isPressed) {
      val cancel = MotionEvent.obtain(0, 0, MotionEvent.ACTION_CANCEL, 0f, 0f, 0)
      view.dispatchTouchEvent(cancel)
      cancel.recycle()
      view.isPressed = false
    }
    val token = activeEpoch
    val disabled = data?.optBoolean("disabled") == true
    val selected = data?.optBoolean("selected") == true
    val key = data?.optString("key").orEmpty()
    view.isEnabled = !disabled
    view.isSelected = selected
    view.isClickable = key.isNotEmpty() && !disabled
    view.isFocusable = key.isNotEmpty()
    view.contentDescription = data?.optString("label")?.takeIf(String::isNotEmpty)
    view.importantForAccessibility = if (key.isEmpty()) View.IMPORTANT_FOR_ACCESSIBILITY_AUTO else View.IMPORTANT_FOR_ACCESSIBILITY_YES
    val opacity = if (disabled) palette.optDouble("disabledOpacity", 0.3).toFloat() else 1f
    view.alpha = opacity
    testID(view, data?.optString("testID"))
    ViewCompat.setStateDescription(view, if (data?.optBoolean("busy") == true) resources.getString(com.facebook.react.R.string.state_busy_description) else null)
    view.accessibilityDelegate = object : View.AccessibilityDelegate() {
      override fun onInitializeAccessibilityNodeInfo(host: View, info: AccessibilityNodeInfo) {
        super.onInitializeAccessibilityNodeInfo(host, info)
        info.viewIdResourceName = host.getTag(com.facebook.react.R.id.react_test_id) as? String
        if (data == null) return
        info.className = if (data.optString("role") == "link") "android.widget.TextView" else "android.widget.Button"
        info.viewIdResourceName = data.optString("testID")
        info.isEnabled = !disabled
        info.isSelected = selected
        if (data.has("selected")) {
          info.isCheckable = true
          info.isChecked = selected
        }
        if (data.has("expanded")) {
          info.addAction(if (data.optBoolean("expanded")) AccessibilityNodeInfo.AccessibilityAction.ACTION_COLLAPSE else AccessibilityNodeInfo.AccessibilityAction.ACTION_EXPAND)
        }
      }
    }
    view.setOnClickListener(if (key.isEmpty() || disabled) null else View.OnClickListener {
      if (bindingEpoch == token && isAttachedToWindow) emitAction(key, view, "smartx")
    })
    view.setOnTouchListener(if (key.isEmpty() || disabled) null else View.OnTouchListener { target, event ->
      target.alpha = when (event.actionMasked) {
        MotionEvent.ACTION_DOWN -> palette.optDouble("pressedOpacity", 0.6).toFloat()
        MotionEvent.ACTION_MOVE -> if (event.x in 0f..target.width.toFloat() && event.y in 0f..target.height.toFloat()) target.alpha else opacity
        else -> opacity
      }
      false
    })
  }

  private fun image(
    key: String,
    uri: String,
    size: Int,
    height: Int = size,
    tint: Int? = null,
    round: Boolean = false,
    fallback: String? = null,
    avatarLoading: SmartXAvatarLoading? = null,
  ): View {
    usedImages.add(key)
    val image = images.getOrPut(key) { SmartXImage(reactContext) }
    image.bind(uri, "$rowKey:$key", tint, round, fallback, avatarLoading)
    image.layoutParams = LinearLayout.LayoutParams(px(size), px(height))
    return image
  }

  private fun avatar(key: String, source: String?, size: Int = 28): View {
    val requested = source?.takeIf(String::isNotEmpty)
    return image(key, requested ?: assets.getString("defaultAvatarUri"), size,
      round = true, fallback = assets.getString("defaultAvatarUri"),
      avatarLoading = requested?.let { SmartXAvatarLoading(tone("skeleton"), tone("border"), payload.getBoolean("reducedMotion")) })
  }

  private fun token(key: String, data: JSONObject, size: Int = 36): View {
    val root = node(key) { FrameLayout(reactContext) }
    orders[root] = 0
    root.background = drawable(tone("tokenBackground"), size / 2, tone("tokenBorder"))
    root.clipToOutline = true
    val fallback = text("$key.fallback", data.optString("fallbackText"), 12, 18, tone("tokenText"), "regular", themedString = false)
    fallback.gravity = Gravity.CENTER
    androidx.core.widget.TextViewCompat.setAutoSizeTextTypeUniformWithConfiguration(fallback, max(1, (px(12) * scale * .1f).roundToInt()), max(1, (px(12) * scale).roundToInt()), 1, TypedValue.COMPLEX_UNIT_PX)
    add(root, fallback, FrameLayout.LayoutParams((px(size) * .8f).roundToInt(), -1, Gravity.CENTER))
    val uri = data.optString("logoUri")
    if (uri.isNotEmpty()) {
      val artwork = image("$key.artwork", uri, size, round = true)
      add(root, artwork, FrameLayout.LayoutParams(-1, -1))
    }
    action(root, null)
    testID(root, "token-icon")
    root.contentDescription = data.optString("symbol").ifEmpty { "?" }
    root.importantForAccessibility = View.IMPORTANT_FOR_ACCESSIBILITY_YES
    return root
  }

  private fun feed() {
    val shell = group("feed.shell", true)
    shell.gravity = Gravity.TOP
    shell.setPadding(px(16), px(16), px(16), 0)
    val author = payload.getJSONObject("author")
    val avatar = avatar("author.avatar", author.optString("avatarUri"))
    action(avatar, author.optJSONObject("avatarAction"))
    put(shell, avatar, px(28), px(28), end = 8)
    val column = group("feed.column")
    put(shell, column, 0, weight = 1f)
    put(this, shell)
    header(column, author)
    when (rowType) {
      "smartxOpinion" -> opinion(column)
      "smartxTrade" -> trade(column)
      "smartxMilestone" -> milestone(column)
    }
    if (separatorVisible) {
      val spacer = node("separator.space") { View(reactContext) }
      put(column, spacer, height = px(10))
    }
  }

  private fun header(column: LinearLayout, author: JSONObject) {
    val header = group("header", true)
    header.minimumHeight = px(if (rowType == "smartxOpinion" && author.optString("handle").isEmpty()) 28 else 20)
    val nameLine = inline("header.inline", 4)
    val name = text("author.name", author.getString("name"))
    action(name, author.optJSONObject("nameAction"))
    put(nameLine, name, -2)
    payload.optJSONObject("tag")?.let { data ->
      val tag = text("author.tag", data.getString("text"), 12, 18, parseNativeListColor(data.getString("color")))
      tag.setPadding(px(6), px(2), px(6), px(2))
      tag.background = drawable(parseNativeListColor(data.getString("backgroundColor")), 6)
      testID(tag, data.getString("testID"))
      put(nameLine, tag, -2, px(20))
    }
    if (author.optString("time").isNotEmpty())
      put(nameLine, text("author.time", author.getString("time"), 12, 18, tone("secondaryText"), "regular"), -2)
    put(header, nameLine, 0, weight = 1f)
    payload.optJSONObject("moreAction")?.let { data ->
      val more = node("author.more.control") { FrameLayout(reactContext) }
      orders[more] = 0
      val glyph = image("author.more", assets.getString("moreUri"), 16, tint = tone("secondaryText"))
      add(more, glyph, FrameLayout.LayoutParams(px(16), (3.55556f * resources.displayMetrics.density).roundToInt()).apply {
        leftMargin = px(2)
        topMargin = (8.22f * resources.displayMetrics.density).roundToInt()
      })
      action(more, data)
      extendTouch(more, 8, 8)
      put(header, more, px(20), px(20), start = 8)
    }
    put(column, header)
    if (rowType == "smartxOpinion" && author.optString("handle").isNotEmpty()) {
      val handle = text("author.handle", author.getString("handle"), 12, 18, tone("secondaryText"), themedString = false)
      testID(handle, author.optString("handleTestID"))
      put(column, handle, top = 2)
    }
  }

  private fun opinion(column: LinearLayout) {
    val bodyPress = group("opinion.body.press")
    action(bodyPress, payload.getJSONObject("bodyAction"))
    val body = text("opinion.body", payload.getString("body"), lines = 0)
    testID(body, payload.getString("bodyTestID"))
    put(bodyPress, body)
    put(column, bodyPress, top = 8)
    payload.optJSONObject("position")?.let { position(column, it) }
    val engagement = node("opinion.engagement") { SmartXFlow(reactContext) }
    engagement.gap = px(8)
    orders[engagement] = 0
    put(engagement, like("opinion.like", payload.getJSONObject("like"), false), -2)
    payload.getJSONArray("links").objects().forEachIndexed { index, link ->
      val key = "opinion.link.$index"
      val row = group(key, true)
      row.setPadding(px(9), px(1), px(9), px(1))
      row.background = drawable(tone("subtleFill"), 8, tone("border"))
      action(row, link.getJSONObject("action"))
      put(row, image("$key.x", assets.getString("xUri"), 16, tint = tone("secondaryText")), px(16), px(16), end = 4)
      put(row, text("$key.text", link.getString("label"), 12, 18, tone("secondaryText")), 0, weight = 1f)
      put(row, image("$key.arrow", assets.getString("arrowUpRightUri"), 16, tint = tone("secondaryText")), px(16), px(16), start = 4)
      put(engagement, row, -2)
    }
    put(column, engagement, top = 8)
    payload.optJSONObject("followedLikes")?.let { followed ->
      val row = group("opinion.followed", true)
      row.minimumHeight = px(20)
      action(row, followed.getJSONObject("action"))
      val pile = group("followed.pile", true)
      followed.getJSONArray("avatars").objects().forEachIndexed { index, data ->
        val frame = node("followed.frame.$index") { FrameLayout(reactContext) }
        orders[frame] = 0
        frame.setPadding(px(1), px(1), px(1), px(1))
        frame.background = drawable(tone("raised"), 10, tone("canvas"))
        frame.clipToOutline = true
        testID(frame, data.getString("testID"))
        add(frame, avatar("followed.avatar.$index", data.optString("uri"), 18), FrameLayout.LayoutParams(-1, -1))
        put(pile, frame, px(20), px(20), start = if (index == 0) 0 else -6)
      }
      if (followed.optString("extraCount").isNotEmpty()) {
        val extra = text("followed.extra", followed.getString("extraCount"), 12, 18, tone("secondaryText"), themedString = false)
        extra.setPadding(px(4), 0, px(4), 0)
        extra.minimumWidth = px(20)
        extra.gravity = Gravity.CENTER
        extra.background = drawable(tone("subtleFill"), 10)
        put(pile, extra, -2, px(20), start = 4)
      }
      put(row, pile, -2, end = 8)
      val content = SpannableStringBuilder()
      followed.getJSONArray("text").objects().forEach { run ->
        val start = content.length
        content.append(run.getString("text"))
        content.setSpan(ForegroundColorSpan(parseNativeListColor(run.getString("color"))), start, content.length, Spannable.SPAN_EXCLUSIVE_EXCLUSIVE)
      }
      put(row, text("followed.text", content, 12, 18, tone("secondaryText"), themedString = false), 0, weight = 1f)
      put(column, row, top = 8)
    }
  }

  private fun position(column: LinearLayout, data: JSONObject) {
    val row = group("position", true)
    row.setPadding(px(9), px(9), px(9), px(9))
    row.minimumHeight = px(64)
    row.background = drawable(tone("subtleFill"), 16, tone("border"))
    action(row, data.optJSONObject("action"))
    testID(row, data.getString("testID"))
    val logo = token("position.token", data.getJSONObject("token"))
    data.optJSONObject("logoAction")?.let { action(logo, it); extendTouch(logo, 4, 4) }
    put(row, logo, px(36), px(36), end = 8)
    val identity = group("position.identity")
    val kicker = group("position.kicker", true)
    put(kicker, text("position.cycle", data.getString("cycleLabel"), 12, 18, tone("secondaryText")), -2)
    val dot = node("position.dot") { SmartXStatusDot(reactContext) }
    dot.bind(if (data.getBoolean("cycleOpen")) tone("success") else tone("mutedText"), data.getBoolean("cycleOpen") && !payload.getBoolean("reducedMotion"))
    put(kicker, dot, px(4), px(4), start = 4)
    put(identity, kicker)
    val symbol = data.getJSONObject("token").getString("symbol")
    if (symbol.isNotEmpty()) put(identity, text("position.symbol", symbol), top = 2)
    put(row, identity, 0, end = 8, weight = 1f)
    data.optJSONObject("primary")?.let { primary ->
      val values = group("position.values")
      values.gravity = Gravity.END
      val main = text("position.primary", primary.getString("text"), color = parseNativeListColor(primary.getString("color")))
      main.gravity = Gravity.END or Gravity.CENTER_VERTICAL
      put(values, main)
      data.optJSONObject("secondary")?.let { secondary ->
        val secondaryRow = group("position.secondary.row", true)
        secondaryRow.gravity = Gravity.END or Gravity.CENTER_VERTICAL
        if (secondary.has("direction")) {
          val up = secondary.getString("direction") == "up"
          put(secondaryRow, image("position.direction", assets.getString(if (up) "changeUpUri" else "changeDownUri"), 12, 16, if (up) tone("success") else tone("error")), px(12), px(16))
        }
        put(secondaryRow, text("position.secondary", secondary.getString("text"), 12, 18, parseNativeListColor(secondary.getString("color"))), -2)
        put(values, secondaryRow)
      }
      put(row, values, px(96))
    }
    put(column, row, top = 8)
  }

  private fun trade(column: LinearLayout) {
    val row = group("trade.summary", true)
    action(row, payload.getJSONObject("tokenAction"))
    val token = payload.getJSONObject("token")
    val logo = token("trade.token", token)
    action(logo, payload.getJSONObject("logoAction"))
    extendTouch(logo, 4, 4)
    put(row, logo, px(36), px(36), end = 8)
    val value = SpannableStringBuilder(token.getString("symbol"))
    if (payload.getString("amount").isNotEmpty()) value.append(" ${payload.getString("amount")}")
    fun append(text: String, color: Int) {
      val start = value.length
      value.append(text)
      value.setSpan(ForegroundColorSpan(color), start, value.length, Spannable.SPAN_EXCLUSIVE_EXCLUSIVE)
    }
    append(" at", tone("secondaryText"))
    append(" ${payload.getString("marketCap")}", tone("text"))
    append(" MC", tone("secondaryText"))
    put(row, text("trade.text", value, themedString = false), 0, weight = 1f)
    put(column, row, height = px(40), top = 8)
  }

  private fun milestone(column: LinearLayout) {
    val thresholds = group("milestone.thresholds")
    val values = payload.getJSONArray("thresholds")
    for (index in 0 until values.length()) {
      val value = SpannableStringBuilder()
      if (index > 0) {
        value.append(" · ")
        value.setSpan(ForegroundColorSpan(tone("secondaryText")), 0, value.length, Spannable.SPAN_EXCLUSIVE_EXCLUSIVE)
      }
      value.append(values.getString(index))
      put(thresholds, text("threshold.$index", value, lines = 0, themedString = false), top = if (index == 0) 0 else 2)
    }
    put(column, thresholds, top = 8)
    payload.optJSONObject("position")?.let { data ->
      val box = group("milestone.position")
      box.setPadding(px(9), px(9), px(9), px(9))
      box.background = drawable(tone("subtleFill"), 16, tone("border"))
      action(box, data.optJSONObject("action"))
      val identity = group("milestone.identity", true)
      val token = data.getJSONObject("token")
      put(identity, token("milestone.token", token), px(36), px(36), end = 8)
      put(identity, text("milestone.symbol", token.getString("symbol")), 0, weight = 1f)
      if (data.optString("mockText").isNotEmpty()) {
        val badge = text("milestone.mock", data.getString("mockText"), 12, 18, tone("secondaryText"))
        badge.setPadding(px(7), px(3), px(7), px(3))
        badge.background = drawable(Color.TRANSPARENT, 6, tone("border"))
        put(identity, badge, -2, start = 8)
      }
      put(box, identity)
      val rows = group("milestone.values")
      data.getJSONArray("values").objects().forEachIndexed { index, value ->
        val row = group("milestone.value.$index", true)
        val label = text("milestone.value.label.$index", value.getString("label"), 12, 18, tone("secondaryText"), lines = 0, themedString = false)
        put(row, label, 0, end = 12, weight = 1f)
        put(row, text("milestone.value.text.$index", value.getString("text"), color = parseNativeListColor(value.getString("color"))), -2)
        put(rows, row, top = if (index == 0) 0 else 4)
      }
      if (data.optString("staleText").isNotEmpty()) {
        val stale = text("milestone.stale", data.getString("staleText"), 12, 18, tone("secondaryText"), lines = 0)
        stale.gravity = Gravity.END
        put(rows, stale, top = 4)
      }
      put(box, rows, top = 8)
      put(column, box, top = 8)
    }
  }

  private fun like(key: String, data: JSONObject, announcement: Boolean): View {
    val row = group(key, true)
    row.minimumHeight = px(if (announcement) 28 else 32)
    row.minimumWidth = px(if (announcement) 0 else 34)
    if (announcement) row.setPadding(0, 0, px(8), 0)
    action(row, data.getJSONObject("action"))
    if (announcement) extendTouch(row, 8, 4)
    val liked = data.getBoolean("liked")
    put(row, image("$key.icon", assets.getString(if (liked) "likeFilledUri" else "likeUri"), 20,
      tint = if (liked) tone("error") else tone("secondaryText")), px(20), px(20), end = if (announcement) 8 else 5)
    val count = text("$key.count", data.getString("count"), 12, 18, tone("secondaryText"))
    if (announcement) count.fontFeatureSettings = "tnum"
    put(row, count, -2)
    return row
  }

  private fun announcement() {
    val shell = group("announcement.shell")
    shell.setPadding(px(16), px(12), px(28), px(9))
    val author = payload.getJSONObject("author")
    val head = group("announcement.head", true)
    put(head, avatar("author.avatar", author.optString("avatarUri")), px(28), px(28), end = 8)
    val authorLine = inline("announcement.author", 4)
    put(authorLine, text("announcement.name", author.getString("name"), 16, 24, weight = "semibold"), -2)
    if (payload.getBoolean("verified")) {
      val badge = node("announcement.badge.slot") { FrameLayout(reactContext) }
      orders[badge] = 0
      val glyph = image("announcement.badge", assets.getString("announcementBadgeUri"), 12)
      add(badge, glyph, FrameLayout.LayoutParams((10.5f * resources.displayMetrics.density).roundToInt(), (10.5f * resources.displayMetrics.density).roundToInt()).apply {
        leftMargin = (1.5f * resources.displayMetrics.density).roundToInt()
        topMargin = (1.5f * resources.displayMetrics.density).roundToInt()
      })
      put(authorLine, badge, px(12), px(12))
    }
    put(authorLine, text("announcement.time", author.getString("time"), 12, 18, tone("secondaryText")), -2, start = 2)
    put(head, authorLine, 0, end = 8, weight = 1f)
    val pinned = group("announcement.pinned", true)
    pinned.setPadding(px(8), 0, 0, 0)
    put(pinned, image("announcement.pin.icon", assets.getString("announcementPinnedUri"), 12, tint = tone("secondaryText")), px(12), px(12), end = 2)
    put(pinned, text("announcement.pin.label", payload.getString("pinnedLabel"), 12, 18, tone("secondaryText")), -2)
    put(head, pinned, -2)
    put(shell, head)
    val content = group("announcement.content")
    put(shell, content, top = 4, start = 36)
    val card = group("announcement.card")
    card.setPadding(px(12), px(12), px(12), px(12))
    card.background = drawable(tone("selectedFill"), 8)
    if (payload.getString("title").isNotEmpty()) {
      val title = group("announcement.title.row", true)
      title.setPadding(px(2), 0, px(2), 0)
      put(title, image("announcement.title.icon", assets.getString("announcementTitleUri"), 16, tint = tone("text")), px(16), px(16), end = 6)
      put(title, text("announcement.title", payload.getString("title")), 0, weight = 1f)
      put(card, title)
    }
    val body = text("announcement.body", "", weight = "regular", lines = if (payload.getBoolean("expanded")) 0 else 2, themedString = false)
    val contentSpans = SpannableStringBuilder()
    val epoch = activeEpoch
    payload.getJSONArray("spans").objects().forEach { span ->
      val start = contentSpans.length
      contentSpans.append(span.getString("text"))
      val end = contentSpans.length
      if (start == end) return@forEach
      val font = typeface(if (span.getBoolean("bold")) "bold" else "regular", span.getBoolean("italic"))
      contentSpans.setSpan(SmartXTypefaceSpan(font), start, end, Spannable.SPAN_EXCLUSIVE_EXCLUSIVE)
      val isLink = span.getString("kind") != "text"
      val data = span.optJSONObject("action")
      if (isLink) {
        contentSpans.setSpan(ForegroundColorSpan(tone("primary")), start, end, Spannable.SPAN_EXCLUSIVE_EXCLUSIVE)
        contentSpans.setSpan(object : ClickableSpan() {
          override fun onClick(widget: View) {
            if (bindingEpoch == epoch && isAttachedToWindow && data != null && !data.optBoolean("disabled"))
              emitAction(data.getString("key"), body, "smartx")
          }
          override fun updateDrawState(paint: TextPaint) {
            paint.color = tone("primary")
            paint.isUnderlineText = span.getString("kind") == "link"
          }
        }, start, end, Spannable.SPAN_EXCLUSIVE_EXCLUSIVE)
      }
    }
    body.text = withLineHeight(contentSpans, (px(20) * scale).roundToInt())
    body.movementMethod = LinkMovementMethod.getInstance()
    put(card, body, top = if (payload.getString("title").isEmpty()) 0 else 8)
    val toggle = text("announcement.toggle", payload.getString("toggleLabel"), 12, 18, tone("primary"))
    toggle.minimumHeight = px(20)
    action(toggle, payload.getJSONObject("toggleAction"))
    extendTouch(toggle, 8, 8)
    put(card, toggle, -2, top = 12)
    put(content, card)
    put(content, like("announcement.like", payload.getJSONObject("like"), true), -2, top = 8)
    put(this, shell)
    if (separatorVisible) put(this, node("announcement.separator.space") { View(reactContext) }, height = px(1))
  }

  private fun extendTouch(view: View, horizontal: Int, vertical: Int) {
    if (view.isEnabled && view.isClickable) touchExtensions.add(TouchExtension(view, px(horizontal), px(vertical)))
  }

  private fun cancelExtendedTouch() {
    extendedTouchTarget?.let { target ->
      val cancel = MotionEvent.obtain(0, 0, MotionEvent.ACTION_CANCEL, 0f, 0f, 0)
      target.dispatchTouchEvent(cancel)
      cancel.recycle()
    }
    extendedTouchTarget = null
  }

  override fun dispatchTouchEvent(event: MotionEvent): Boolean {
    if (event.actionMasked == MotionEvent.ACTION_DOWN) {
      extendedTouchTarget = null
      for (extension in touchExtensions.asReversed()) {
        val target = extension.view
        if (!target.isAttachedToWindow || !target.isEnabled) continue
        val rect = Rect(0, 0, target.width, target.height)
        offsetDescendantRectToMyCoords(target, rect)
        // Normal native hit testing owns points already inside the control.
        if (rect.contains(event.x.toInt(), event.y.toInt())) continue
        rect.inset(-extension.horizontal, -extension.vertical)
        val parent = target.parent as? ViewGroup ?: continue
        val parentRect = Rect(0, 0, parent.width, parent.height)
        if (parent !== this) offsetDescendantRectToMyCoords(parent, parentRect)
        if (rect.intersect(parentRect) && rect.contains(event.x.toInt(), event.y.toInt())) {
          extendedTouchTarget = target
          break
        }
      }
    }
    val target = extendedTouchTarget ?: return super.dispatchTouchEvent(event)
    val rect = Rect(0, 0, target.width, target.height)
    offsetDescendantRectToMyCoords(target, rect)
    val translated = MotionEvent.obtain(event)
    // TouchDelegate semantics: the extended part of the hit box behaves as the center.
    translated.setLocation(target.width / 2f, target.height / 2f)
    val stillInside = event.x >= rect.left - px(8) && event.x <= rect.right + px(8) &&
      event.y >= rect.top - px(8) && event.y <= rect.bottom + px(8)
    if (!stillInside && event.actionMasked != MotionEvent.ACTION_CANCEL) translated.action = MotionEvent.ACTION_CANCEL
    val consumed = target.dispatchTouchEvent(translated)
    translated.recycle()
    if (!stillInside || event.actionMasked == MotionEvent.ACTION_UP || event.actionMasked == MotionEvent.ACTION_CANCEL)
      extendedTouchTarget = null
    return consumed
  }

  override fun dispatchDraw(canvas: Canvas) {
    super.dispatchDraw(canvas)
    if (separatorVisible)
      canvas.drawRect(px(52).toFloat(), (height - px(1)).toFloat(), (width - if (rowType == "smartxAnnouncement") px(16) else 0).toFloat(), height.toFloat(), dividerPaint)
  }

  override fun recycleContent() {
    cancelExtendedTouch()
    touchExtensions.clear()
    activeEpoch = -1
    nodes.values.forEach { view ->
      view.setOnClickListener(null)
      view.setOnTouchListener(null)
      view.animate().cancel()
      if (view is SmartXStatusDot) view.stop()
      if (view is TextView) view.movementMethod = null
    }
    images.values.forEach { it.recycle() }
    setOnClickListener(null)
    setOnTouchListener(null)
  }

  override fun disposeContent() {
    images.values.forEach { it.dispose() }
    images.clear()
    nodes.clear()
    removeAllViews()
  }
}

private fun JSONArray.objects(): List<JSONObject> = (0 until length()).map { getJSONObject(it) }

private class SmartXTypefaceSpan(private val font: Typeface) : MetricAffectingSpan() {
  override fun updateDrawState(paint: TextPaint) { paint.typeface = font }
  override fun updateMeasureState(paint: TextPaint) { paint.typeface = font }
}

/** Native text measures the actual remaining column, while other header slots keep natural width. */
private class SmartXInline(context: ThemedReactContext) : ViewGroup(context) {
  var gap = 0
  var shrinkIndex = 0
  override fun onMeasure(widthMeasureSpec: Int, heightMeasureSpec: Int) {
    val limit = MeasureSpec.getSize(widthMeasureSpec)
    val fixedWidths = ArrayList<Int>()
    val gaps = gap * (childCount - 1).coerceAtLeast(0)
    var occupied = gaps
    var tallest = 0
    for (index in 0 until childCount) if (index != shrinkIndex) {
      val child = getChildAt(index)
      measureChild(child, MeasureSpec.makeMeasureSpec(limit, MeasureSpec.AT_MOST), heightMeasureSpec)
      val margin = (child.layoutParams as? MarginLayoutParams)?.let { it.marginStart + it.marginEnd } ?: 0
      fixedWidths.add(child.measuredWidth + margin)
      occupied += child.measuredWidth + margin
      tallest = max(tallest, child.measuredHeight)
    }
    if (shrinkIndex in 0 until childCount) {
      val child = getChildAt(shrinkIndex)
      child.measure(MeasureSpec.makeMeasureSpec(smartXTextColumnWidth(limit, fixedWidths, gaps), MeasureSpec.AT_MOST), getChildMeasureSpec(heightMeasureSpec, 0, child.layoutParams.height))
      occupied += child.measuredWidth
      tallest = max(tallest, child.measuredHeight)
    }
    setMeasuredDimension(resolveSize(occupied, widthMeasureSpec), resolveSize(max(tallest, minimumHeight), heightMeasureSpec))
  }
  override fun onLayout(changed: Boolean, left: Int, top: Int, right: Int, bottom: Int) {
    var x = if (layoutDirection == LAYOUT_DIRECTION_RTL) width else 0
    for (index in 0 until childCount) {
      val child = getChildAt(index)
      val y = (height - child.measuredHeight) / 2
      val margins = child.layoutParams as? MarginLayoutParams
      val leading = margins?.marginStart ?: 0
      val trailing = margins?.marginEnd ?: 0
      x += leading * if (layoutDirection == LAYOUT_DIRECTION_RTL) -1 else 1
      val start = if (layoutDirection == LAYOUT_DIRECTION_RTL) x - child.measuredWidth else x
      child.layout(start, y, start + child.measuredWidth, y + child.measuredHeight)
      x += (child.measuredWidth + gap + trailing) * if (layoutDirection == LAYOUT_DIRECTION_RTL) -1 else 1
    }
  }
}

/** The existing engagement row wraps controls and uses space-between on each occupied line. */
private class SmartXFlow(context: ThemedReactContext) : ViewGroup(context) {
  var gap = 0
  private val rows = ArrayList<List<View>>()
  override fun onMeasure(widthMeasureSpec: Int, heightMeasureSpec: Int) {
    val width = MeasureSpec.getSize(widthMeasureSpec)
    rows.clear()
    val children = (0 until childCount).map { getChildAt(it) }
    children.forEach { child ->
      child.measure(MeasureSpec.makeMeasureSpec(width, MeasureSpec.AT_MOST), MeasureSpec.makeMeasureSpec(0, MeasureSpec.UNSPECIFIED))
    }
    smartXFlowLines(children.map { it.measuredWidth }, width, gap).forEach { range ->
      rows.add(range.map { children[it] })
    }
    val height = rows.sumOf { row -> row.maxOf { it.measuredHeight } } + gap * (rows.size - 1).coerceAtLeast(0)
    setMeasuredDimension(resolveSize(width, widthMeasureSpec), resolveSize(height, heightMeasureSpec))
  }
  override fun onLayout(changed: Boolean, left: Int, top: Int, right: Int, bottom: Int) {
    var y = 0
    rows.forEach { row ->
      val height = row.maxOf { it.measuredHeight }
      val free = if (row.size > 1) (width - row.sumOf { it.measuredWidth }) / (row.size - 1) else 0
      var x = if (layoutDirection == LAYOUT_DIRECTION_RTL) width else 0
      row.forEach { child ->
        val start = if (layoutDirection == LAYOUT_DIRECTION_RTL) x - child.measuredWidth else x
        val childY = y + (height - child.measuredHeight) / 2
        child.layout(start, childY, start + child.measuredWidth, childY + child.measuredHeight)
        x += (child.measuredWidth + free) * if (layoutDirection == LAYOUT_DIRECTION_RTL) -1 else 1
      }
      y += height + gap
    }
  }
}

private data class SmartXAvatarLoading(val base: Int, val highlight: Int, val reducedMotion: Boolean)

/** Applies tint to the supplied artwork's alpha; no substituted icon glyphs. */
private class SmartXImage(context: ThemedReactContext) : FrameLayout(context) {
  private val slot = NativeListImageSlot(context)
  private var fallbackSlot: NativeListImageSlot? = null
  private var shimmer: SmartXAvatarShimmer? = null
  private val tintPaint = Paint(Paint.ANTI_ALIAS_FLAG)
  private var tint: Int? = null
  private var identity = ""
  private val state = NativeListSmartXImageState()
  init {
    importantForAccessibility = IMPORTANT_FOR_ACCESSIBILITY_NO
    addView(slot.view, LayoutParams(-1, -1))
  }
  fun bind(uri: String, key: String, tint: Int?, round: Boolean, fallback: String?, avatarLoading: SmartXAvatarLoading?) {
    this.tint = tint
    tintPaint.colorFilter = tint?.let { PorterDuffColorFilter(it, PorterDuff.Mode.SRC_IN) }
    val next = "$key\u0000$uri\u0000$round\u0000$fallback"
    val changed = identity != next
    identity = next
    val epoch = state.bind(next)
    if (changed) {
      slot.view.visibility = if (avatarLoading == null) VISIBLE else INVISIBLE
      fallbackSlot?.view?.visibility = GONE
      shimmer?.stop()
    }
    if (avatarLoading != null) {
      val loading = shimmer ?: SmartXAvatarShimmer(context as ThemedReactContext).also {
        shimmer = it
        addView(it, LayoutParams(-1, -1))
      }
      loading.bind(avatarLoading, state.phase == NativeListSmartXImageState.Phase.PENDING)
    } else shimmer?.hide()
    slot.bind(JSONObject().put("uri", uri), key, fit = if (round) "cover" else "contain", placeholder = "#00000000", round = round) onImageResult@ { loaded ->
      if (!state.complete(epoch, loaded)) return@onImageResult
      shimmer?.hide()
      if (loaded) {
        slot.view.visibility = VISIBLE
        fallbackSlot?.view?.visibility = GONE
      } else {
        slot.view.visibility = INVISIBLE
        if (fallback != null && fallback != uri) {
          val target = fallbackSlot ?: NativeListImageSlot(context as ThemedReactContext).also {
            fallbackSlot = it
            addView(it.view, LayoutParams(-1, -1))
          }
          target.view.visibility = VISIBLE
          target.bind(JSONObject().put("uri", fallback), "$key:fallback", fit = "cover", placeholder = "#00000000", round = round)
        }
      }
    }
    invalidate()
  }
  override fun dispatchDraw(canvas: Canvas) {
    if (tint == null) super.dispatchDraw(canvas) else {
      val save = canvas.saveLayer(0f, 0f, width.toFloat(), height.toFloat(), tintPaint)
      super.dispatchDraw(canvas)
      canvas.restoreToCount(save)
    }
  }
  fun recycle() {
    identity = ""
    state.recycle()
    shimmer?.hide()
    slot.recycle()
    fallbackSlot?.recycle()
    setOnClickListener(null)
    setOnTouchListener(null)
    animate().cancel()
  }
  fun dispose() { recycle(); slot.dispose(); fallbackSlot?.dispose() }
}

/** AvatarShimmer parity: circular base, 1200 ms linear scan, static base for reduced motion. */
private class SmartXAvatarShimmer(context: ThemedReactContext) : View(context) {
  private val paint = Paint(Paint.ANTI_ALIAS_FLAG)
  private val matrix = Matrix()
  private val circle = Path()
  private var style = SmartXAvatarLoading(Color.TRANSPARENT, Color.TRANSPARENT, true)
  private var pending = false
  private var progress = -1f
  private var gradient: LinearGradient? = null
  private var animator: ValueAnimator? = null
  init { importantForAccessibility = IMPORTANT_FOR_ACCESSIBILITY_NO }
  fun bind(style: SmartXAvatarLoading, pending: Boolean) {
    val changed = this.style != style
    this.style = style
    this.pending = pending
    visibility = if (pending) VISIBLE else GONE
    if (changed) rebuildGradient()
    if (pending && !style.reducedMotion && isAttachedToWindow) start() else stop()
    invalidate()
  }
  private fun rebuildGradient() {
    if (width > 0) gradient = LinearGradient(0f, 0f, width.toFloat(), 0f,
      intArrayOf(Color.TRANSPARENT, style.highlight, Color.TRANSPARENT), floatArrayOf(0f, .5f, 1f), Shader.TileMode.CLAMP)
  }
  override fun onSizeChanged(w: Int, h: Int, oldw: Int, oldh: Int) {
    super.onSizeChanged(w, h, oldw, oldh)
    circle.reset()
    circle.addCircle(w / 2f, h / 2f, minOf(w, h) / 2f, Path.Direction.CW)
    rebuildGradient()
  }
  private fun start() {
    if (animator != null) return
    animator = ValueAnimator.ofFloat(-1f, 1f).apply {
      duration = 1200
      repeatCount = ValueAnimator.INFINITE
      interpolator = android.view.animation.LinearInterpolator()
      addUpdateListener { progress = it.animatedValue as Float; invalidate() }
      start()
    }
  }
  fun stop() { animator?.cancel(); animator = null; progress = -1f; invalidate() }
  fun hide() { pending = false; visibility = GONE; stop() }
  override fun onAttachedToWindow() {
    super.onAttachedToWindow()
    if (pending && !style.reducedMotion) start()
  }
  override fun onDetachedFromWindow() { stop(); super.onDetachedFromWindow() }
  override fun onDraw(canvas: Canvas) {
    val save = canvas.save()
    canvas.clipPath(circle)
    paint.shader = null
    paint.color = style.base
    canvas.drawRect(0f, 0f, width.toFloat(), height.toFloat(), paint)
    if (!style.reducedMotion) {
      matrix.setTranslate(progress * width, 0f)
      gradient?.setLocalMatrix(matrix)
      paint.shader = gradient
      paint.alpha = 255
      canvas.drawRect(0f, 0f, width.toFloat(), height.toFloat(), paint)
      paint.shader = null
    }
    canvas.restoreToCount(save)
  }
}

/** Same 1600 ms cubic-out glow as PositionStatusDot; its layout footprint is only four dp. */
private class SmartXStatusDot(context: ThemedReactContext) : View(context) {
  private val paint = Paint(Paint.ANTI_ALIAS_FLAG)
  private var color = Color.TRANSPARENT
  private var breathing = false
  private var progress = 0f
  private var animator: ValueAnimator? = null
  init { importantForAccessibility = IMPORTANT_FOR_ACCESSIBILITY_NO }
  fun bind(color: Int, breathing: Boolean) {
    this.color = color
    if (this.breathing != breathing) stop()
    this.breathing = breathing
    if (isAttachedToWindow) start()
    invalidate()
  }
  private fun start() {
    if (!breathing || animator != null) return
    animator = ValueAnimator.ofFloat(0f, 1f).apply {
      duration = 1600
      repeatCount = ValueAnimator.INFINITE
      interpolator = android.animation.TimeInterpolator { input -> 1f - (1f - input) * (1f - input) * (1f - input) }
      addUpdateListener { progress = it.animatedValue as Float; invalidate() }
      start()
    }
  }
  fun stop() { animator?.cancel(); animator = null; progress = 0f; invalidate() }
  override fun onAttachedToWindow() { super.onAttachedToWindow(); start() }
  override fun onDetachedFromWindow() { stop(); super.onDetachedFromWindow() }
  override fun onDraw(canvas: Canvas) {
    val centerX = width / 2f
    val centerY = height / 2f
    if (breathing) {
      val radius = resources.displayMetrics.density * 5f * (1f + progress * .8f)
      fun alpha(value: Float) = (color and 0x00ffffff) or ((255 * value * (1f - progress * .85f)).roundToInt() shl 24)
      paint.shader = RadialGradient(centerX, centerY, radius, intArrayOf(alpha(1f), alpha(.62f), alpha(.28f), alpha(0f)), floatArrayOf(0f, .22f, .55f, 1f), Shader.TileMode.CLAMP)
      canvas.drawCircle(centerX, centerY, radius, paint)
    }
    paint.shader = null
    paint.color = color
    canvas.drawCircle(centerX, centerY, resources.displayMetrics.density * 2f, paint)
  }
}
