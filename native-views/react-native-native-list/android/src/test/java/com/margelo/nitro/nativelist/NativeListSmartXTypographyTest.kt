package com.margelo.nitro.nativelist

import org.junit.Assert.assertEquals
import org.junit.Test

class NativeListSmartXTypographyTest {
  @Test fun addsPaddingForTheExistingCjkAndFullWidthRanges() {
    listOf("观点", "持倉", "かな", "。", "ＵＳＤ", "豈").forEach { text ->
      assertEquals(text, 22, smartXLineHeight(20, text))
    }
    assertEquals(26, smartXLineHeight(24, "作者"))
    assertEquals(20, smartXLineHeight(18, "持仓中"))
  }
  @Test fun latinNumbersEmojiAndUnmatchedScriptsRetainTheirLineBoxes() {
    listOf("", "Position", "$123.45", "+1,000", "👍", "한글").forEach { text ->
      assertEquals(text, 20, smartXLineHeight(20, text))
    }
  }
  @Test fun richChildrenAndExplicitPlainTextConsumersDoNotGainCjkPadding() {
    assertEquals(20, smartXLineHeight(20, StringBuilder("曾达到 · 一千")))
    assertEquals(20, smartXLineHeight(20, "公告富文本", themedString = false))
    assertEquals(18, smartXLineHeight(18, "@中文", themedString = false))
    assertEquals(18, smartXLineHeight(18, "总盈亏 · 预估", themedString = false))
    assertEquals(18, smartXLineHeight(18, "币", themedString = false))
  }
}
