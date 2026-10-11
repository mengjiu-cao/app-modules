package com.margelo.nitro.onekeyimage

import android.graphics.drawable.Drawable
import android.graphics.drawable.PictureDrawable
import com.bumptech.glide.Registry
import com.bumptech.glide.load.resource.transcode.ResourceTranscoder
import com.bumptech.glide.load.Options
import com.bumptech.glide.load.ResourceDecoder
import com.bumptech.glide.load.engine.Resource
import com.bumptech.glide.load.resource.SimpleResource
import com.bumptech.glide.util.ByteBufferUtil
import com.caverock.androidsvg.SVG
import com.caverock.androidsvg.SVGParseException
import java.io.IOException
import java.io.InputStream
import java.nio.ByteBuffer

/** Register both fetcher data classes; Glide does not adapt buffers to streams. */
internal fun registerOneKeyImageSvgDecoders(registry: Registry) {
  registry.append(InputStream::class.java, SVG::class.java, OneKeySvgDecoder())
  registry.append(ByteBuffer::class.java, SVG::class.java, OneKeySvgByteBufferDecoder())
  registry.register(SVG::class.java, Drawable::class.java, OneKeySvgDrawableTranscoder())
}

/** Shares the existing SVG parser and sizing for the data URI's buffer path. */
internal class OneKeySvgByteBufferDecoder(
  private val delegate: ResourceDecoder<InputStream, SVG> = OneKeySvgDecoder(),
) : ResourceDecoder<ByteBuffer, SVG> {
  override fun handles(source: ByteBuffer, options: Options): Boolean =
    delegate.handles(ByteBufferUtil.toStream(source.asReadOnlyBuffer()), options)

  override fun decode(source: ByteBuffer, width: Int, height: Int, options: Options): Resource<SVG>? =
    delegate.decode(ByteBufferUtil.toStream(source.asReadOnlyBuffer()), width, height, options)
}

internal class OneKeySvgDecoder : ResourceDecoder<InputStream, SVG> {
  override fun handles(source: InputStream, options: Options): Boolean = true

  @Throws(IOException::class)
  override fun decode(
    source: InputStream,
    width: Int,
    height: Int,
    options: Options,
  ): Resource<SVG> {
    val svg = try {
      SVG.getFromInputStream(source)
    } catch (error: SVGParseException) {
      throw IOException("Cannot decode SVG", error)
    }
    if (svg.documentViewBox == null) {
      val documentWidth = svg.documentWidth
      val documentHeight = svg.documentHeight
      if (documentWidth > 0f && documentHeight > 0f) {
        svg.setDocumentViewBox(0f, 0f, documentWidth, documentHeight)
      }
    }

    val viewBox = svg.documentViewBox
    if (viewBox != null && viewBox.width() > 0f && viewBox.height() > 0f) {
      val scale = minOf(width.toFloat() / viewBox.width(), height.toFloat() / viewBox.height())
      if (scale.isFinite() && scale > 0f) {
        svg.documentWidth = viewBox.width() * scale
        svg.documentHeight = viewBox.height() * scale
      }
    }
    return SimpleResource(svg)
  }
}

private class OneKeySvgDrawableTranscoder : ResourceTranscoder<SVG, Drawable> {
  override fun transcode(toTranscode: Resource<SVG>, options: Options): Resource<Drawable> =
    SimpleResource(PictureDrawable(toTranscode.get().renderToPicture()))
}
