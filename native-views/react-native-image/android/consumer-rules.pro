# Nitrogen constructs this non-view implementation by JNI class name. The
# generated Spec is annotated, but the concrete no-arg implementation is not.
-keep class com.margelo.nitro.onekeyimage.HybridOneKeyImageCache {
  public <init>();
}

# Glide and optional image decoders are reached through the registry.
-keep public class * extends com.bumptech.glide.module.LibraryGlideModule
-keep public enum com.bumptech.glide.load.ImageHeaderParser$** {
  **[] $VALUES;
  public *;
}
-keep class com.bumptech.glide.load.data.ParcelFileDescriptorRewinder$InternalRewinder {
  *** rewind();
}
-dontwarn com.bumptech.glide.load.resource.bitmap.VideoDecoder
