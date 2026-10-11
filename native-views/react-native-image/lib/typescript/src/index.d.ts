import { type ReactNode } from 'react';
import { type ImageURISource, type ViewProps } from 'react-native';
import { type NitroViewWrappedCallback } from 'react-native-nitro-modules';
import type { OneKeyImageMethods, OneKeyImageNativeProps } from './OneKeyImage.nitro';
import { OneKeyImageCachePolicy, OneKeyImageContentFit, OneKeyImageLoadingStrategy, OneKeyImageVariant } from './OneKeyImage.nitro';
export { OneKeyImageCachePolicy, OneKeyImageContentFit, OneKeyImageLoadingStrategy, OneKeyImageVariant, };
export type { OneKeyImageMethods, OneKeyImageNativeProps, OneKeyImagePreloadSource, } from './OneKeyImage.nitro';
export declare enum OneKeyImageCacheType {
    NONE = "none",
    MEMORY = "memory",
    DISK = "disk"
}
type MaybeWrappedCallback<T extends (...args: any[]) => void> = T | NitroViewWrappedCallback<T>;
export interface OneKeyImageSource extends ImageURISource {
    cachePolicy?: OneKeyImageCachePolicy;
}
export interface OneKeyImagePreloadInput extends OneKeyImageSource {
    resizeWidth?: number;
    resizeHeight?: number;
    pixelRatio?: number;
    overscan?: number;
    optimizeTos?: boolean;
}
export interface OneKeyImageLoadEvent {
    source: {
        url: string;
        width: number;
        height: number;
    };
    cacheType: OneKeyImageCacheType;
}
export interface OneKeyImageErrorEvent {
    error: string;
}
export interface OneKeyImageProps extends Omit<OneKeyImageNativeProps, 'sourceUri' | 'sourceHeadersJson' | 'onLoadStart' | 'onLoad' | 'onDisplay' | 'onError' | 'onLoadEnd'>, ViewProps {
    source?: OneKeyImageSource | number;
    /** Content shown while a non-null source is loading. */
    placeholder?: ReactNode;
    /** Content shown when source is unavailable or fails to load. */
    fallback?: ReactNode;
    hybridRef?: MaybeWrappedCallback<(ref: OneKeyImageMethods) => void>;
    onLoadStart?: MaybeWrappedCallback<() => void>;
    onLoad?: MaybeWrappedCallback<(event: OneKeyImageLoadEvent) => void>;
    onDisplay?: MaybeWrappedCallback<() => void>;
    onError?: MaybeWrappedCallback<(event: OneKeyImageErrorEvent) => void>;
    onLoadEnd?: MaybeWrappedCallback<() => void>;
}
export declare function OneKeyImage({ source, placeholder, fallback, variant, contentFit, cachePolicy, autoplay, recyclingKey, optimizeTos, round, resizeWidth, resizeHeight, overscan, loadingStrategy, placeholderColor, hybridRef, onLoadStart, onLoad, onDisplay, onError, onLoadEnd, style, ...viewProps }: OneKeyImageProps): import("react/jsx-runtime").JSX.Element;
export declare const OneKeyImageCache: {
    preload(sources: OneKeyImagePreloadInput[]): Promise<boolean>;
    clearMemory: () => Promise<void>;
    clearDisk: () => Promise<void>;
    clearAll: () => Promise<void>;
};
//# sourceMappingURL=index.d.ts.map