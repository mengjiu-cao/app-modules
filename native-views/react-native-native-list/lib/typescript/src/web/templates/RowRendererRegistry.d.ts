import type { SmartXRow } from '../../SmartX.models';
import type { RowModel } from '../../models';
export type RowRendererKey = Exclude<RowModel['type'], SmartXRow['type']>;
export declare function rowRenderer(row: RowModel): {
    key: string;
    appliesSizePreset: boolean;
    create: (document: Document, primitives: Readonly<{
        background: string;
        icon: (element: HTMLElement, name: string) => void;
        iconAction: (name: string, actionKey: string | undefined, disabled?: boolean, tintColor?: string) => HTMLElement;
        accessory: (rowKey: string, descriptor: import("../..").TrailingAccessory, slot: number) => HTMLElement;
        visual: (source: import("../..").LeadingVisual | undefined, presentation?: string) => HTMLElement | undefined;
        thumbnail: (source: Readonly<{
            uri: string;
            width: number;
            height: number;
            headers?: Readonly<Record<string, string>>;
            contentFit?: import("../..").ImageContentFit;
            cachePolicy?: import("../..").ImageCachePolicy;
            autoplay?: boolean;
            optimizeTos?: boolean;
            overscan?: number;
            loadingStrategy?: import("../..").ImageLoadingStrategy;
            fallbackUri?: string;
            retryTimes?: number;
        }>) => HTMLElement | undefined;
        textStyle: (element: HTMLElement, style: Readonly<{
            token?: import("../..").NativeListTypographyToken;
            fontSize?: number;
            fontWeight?: "regular" | "medium" | "semibold" | "bold";
            color?: string;
            lineHeight?: number;
            lines?: 1 | 2 | 3;
            truncate?: "tail" | "clip";
            alignment?: "start" | "center" | "end";
            verticalAlignment?: "top" | "center" | "bottom";
            offsetY?: number;
        }>, defaultLines?: number) => void;
        dispose: (element: HTMLElement) => void;
    }>) => HTMLElement;
    bind: (body: HTMLElement, primitives: Readonly<{
        background: string;
        icon: (element: HTMLElement, name: string) => void;
        iconAction: (name: string, actionKey: string | undefined, disabled?: boolean, tintColor?: string) => HTMLElement;
        accessory: (rowKey: string, descriptor: import("../..").TrailingAccessory, slot: number) => HTMLElement;
        visual: (source: import("../..").LeadingVisual | undefined, presentation?: string) => HTMLElement | undefined;
        thumbnail: (source: Readonly<{
            uri: string;
            width: number;
            height: number;
            headers?: Readonly<Record<string, string>>;
            contentFit?: import("../..").ImageContentFit;
            cachePolicy?: import("../..").ImageCachePolicy;
            autoplay?: boolean;
            optimizeTos?: boolean;
            overscan?: number;
            loadingStrategy?: import("../..").ImageLoadingStrategy;
            fallbackUri?: string;
            retryTimes?: number;
        }>) => HTMLElement | undefined;
        textStyle: (element: HTMLElement, style: Readonly<{
            token?: import("../..").NativeListTypographyToken;
            fontSize?: number;
            fontWeight?: "regular" | "medium" | "semibold" | "bold";
            color?: string;
            lineHeight?: number;
            lines?: 1 | 2 | 3;
            truncate?: "tail" | "clip";
            alignment?: "start" | "center" | "end";
            verticalAlignment?: "top" | "center" | "bottom";
            offsetY?: number;
        }>, defaultLines?: number) => void;
        dispose: (element: HTMLElement) => void;
    }>) => void;
    measure: (width: number, layout?: string) => number;
    measureRendered: (body: HTMLElement) => number | undefined;
    reorderPreview: (body: HTMLElement) => {
        element: HTMLElement;
        height: number;
    } | undefined;
};
export declare function rowRendererKey(row: RowModel): RowRendererKey;
export declare function recycleRowBody(body: HTMLElement): boolean;
//# sourceMappingURL=RowRendererRegistry.d.ts.map