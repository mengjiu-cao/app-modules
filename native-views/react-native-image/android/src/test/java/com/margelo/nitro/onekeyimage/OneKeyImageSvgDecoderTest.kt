package com.margelo.nitro.onekeyimage

import android.graphics.drawable.Drawable
import com.bumptech.glide.Registry
import com.bumptech.glide.load.Options
import com.bumptech.glide.load.ResourceDecoder
import com.bumptech.glide.load.engine.Resource
import com.caverock.androidsvg.SVG
import java.io.IOException
import java.io.InputStream
import java.nio.ByteBuffer
import org.junit.Assert.assertNotNull
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Test

class OneKeyImageSvgDecoderTest {
  @Test
  fun registeredSvgPathsIncludeDataUriBuffersAndExistingStreams() {
    val registry = Registry()
    registerOneKeyImageSvgDecoders(registry)
    assertNotNull(registry.getLoadPath(ByteBuffer::class.java, SVG::class.java, Drawable::class.java))
    assertNotNull(registry.getLoadPath(InputStream::class.java, SVG::class.java, Drawable::class.java))
  }

  @Test
  fun dataUriSvgBufferUsesExistingParserWithoutConsumingSharedBuffer() {
    val svg = "<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"16\" height=\"16\"><path d=\"M0 0h16v16H0z\"/></svg>"
    val source = ByteBuffer.allocateDirect(svg.toByteArray().size + 2)
    source.put(byteArrayOf(1, 2)).put(svg.toByteArray()).flip()
    source.position(2)
    var calls = 0
    val decoder = OneKeySvgByteBufferDecoder(object : ResourceDecoder<InputStream, SVG> {
      override fun handles(source: InputStream, options: Options): Boolean {
        assertEquals(svg, source.readBytes().toString(Charsets.UTF_8))
        calls++
        return true
      }
      override fun decode(source: InputStream, width: Int, height: Int, options: Options): Resource<SVG>? {
        assertEquals(svg, source.readBytes().toString(Charsets.UTF_8))
        assertEquals(32, width)
        assertEquals(48, height)
        calls++
        return null
      }
    })
    assertTrue(decoder.handles(source, Options()))
    decoder.decode(source, 32, 48, Options())
    assertEquals(2, calls)
    assertEquals(2, source.position())
  }

  @Test(expected = IOException::class)
  fun invalidSvgKeepsParserFailureAndDoesNotSilentlyBecomeBlank() {
    val decoder = OneKeySvgByteBufferDecoder(object : ResourceDecoder<InputStream, SVG> {
      override fun handles(source: InputStream, options: Options) = true
      override fun decode(source: InputStream, width: Int, height: Int, options: Options): Resource<SVG>? =
        throw IOException("Cannot decode SVG")
    })
    decoder.decode(ByteBuffer.wrap("invalid".toByteArray()), 16, 16, Options())
  }
}
