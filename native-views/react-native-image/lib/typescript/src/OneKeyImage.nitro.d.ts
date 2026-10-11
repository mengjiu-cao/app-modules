import type { HybridObject, HybridView, HybridViewMethods, HybridViewProps } from 'react-native-nitro-modules';
export declare enum OneKeyImageVariant {
    GENERIC = "generic",
    TOKEN = "token",
    NETWORK = "network",
    AVATAR = "avatar"
}
export declare enum OneKeyImageContentFit {
    COVER = "cover",
    CONTAIN = "contain",
    FILL = "fill",
    CENTER = "center"
}
export declare enum OneKeyImageCachePolicy {
    MEMORY_DISK = "memory-disk",
    MEMORY = "memory",
    DISK = "disk",
    NONE = "none"
}
export type OneKeyImageCacheType = 'none' | 'memory' | 'disk';
export declare enum OneKeyImageLoadingStrategy {
    STATIC = "static",
    SKELETON = "skeleton",
    NONE = "none"
}
export interface OneKeyImageNativeProps extends HybridViewProps {
    sourceUri?: string;
    sourceHeadersJson?: string;
    variant?: OneKeyImageVariant;
    contentFit?: OneKeyImageContentFit;
    cachePolicy?: OneKeyImageCachePolicy;
    autoplay?: boolean;
    recyclingKey?: string;
    optimizeTos?: boolean;
    /** Clips the native image to an oval using its current bounds. */
    round?: boolean;
    /** Display width hint in layout units. Native applies the screen density. */
    resizeWidth?: number;
    /**
     * Display height hint in layout units. With `resizeWidth` it lets the
     * pre-layout memory-cache probe derive the same decode thumbnail a preload
     * with the same hints stored; omitted, the hint is a square of `resizeWidth`.
     */
    resizeHeight?: number;
    overscan?: number;
    loadingStrategy?: OneKeyImageLoadingStrategy;
    /** Theme-aware color used by static loading, error, and fallback states. */
    placeholderColor?: string;
    onLoadStart?: () => void;
    onLoad?: (width: number, height: number, cacheType: OneKeyImageCacheType) => void;
    onDisplay?: () => void;
    onError?: (message: string) => void;
    onLoadEnd?: () => void;
}
export interface OneKeyImageMethods extends HybridViewMethods {
    reload(): void;
    cancel(): void;
}
export interface OneKeyImagePreloadSource {
    uri: string;
    headersJson?: string;
    cachePolicy?: OneKeyImageCachePolicy;
    resizeWidth?: number;
    resizeHeight?: number;
    pixelRatio?: number;
    overscan?: number;
    optimizeTos?: boolean;
}
export interface OneKeyImageCache extends HybridObject<{
    ios: 'swift';
    android: 'kotlin';
}> {
    preload(sources: OneKeyImagePreloadSource[]): Promise<boolean>;
    clearMemory(): Promise<void>;
    clearDisk(): Promise<void>;
    clearAll(): Promise<void>;
}
export type OneKeyImage = HybridView<OneKeyImageNativeProps, OneKeyImageMethods>;
//# sourceMappingURL=OneKeyImage.nitro.d.ts.map