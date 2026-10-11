import type { ScrollAlignment, ScrollPositionOptions, ScrollToIndexFailedInfo, ScrollToIndexParams, ScrollToKeyParams, ScrollToLocationParams } from './NativeList.types';
import type { RowModel } from './models';
export type NormalizedPositionScroll = Readonly<{
    animated: boolean;
    alignment: ScrollAlignment;
    viewPosition: number;
    viewOffset: number;
}>;
export type AlignedOffsetInput = Readonly<{
    itemOffset: number;
    itemLength: number;
    viewportLength: number;
    contentLength: number;
    currentOffset: number;
    alignment: ScrollAlignment;
    viewPosition: number;
    viewOffset: number;
}>;
export declare function normalizePositionScroll(options: ScrollPositionOptions, defaultAlignment: ScrollAlignment): NormalizedPositionScroll;
export declare function normalizeIndexScroll(paramsOrIndex: ScrollToIndexParams | number, animated?: boolean, alignment?: ScrollAlignment): Readonly<{
    index: number;
    scroll: NormalizedPositionScroll;
}>;
export declare function normalizeKeyScroll(paramsOrKey: ScrollToKeyParams | string, animated?: boolean, alignment?: ScrollAlignment): Readonly<{
    key: string;
    scroll: NormalizedPositionScroll;
}>;
export declare function validateOffset(offset: number): void;
export declare function resolveLocationIndex(rows: readonly RowModel[], params: ScrollToLocationParams): number | undefined;
export declare function scrollFailure(rows: readonly RowModel[], index: number, reason: ScrollToIndexFailedInfo['reason'], averageItemLength?: number): ScrollToIndexFailedInfo;
export declare function calculateAlignedScrollOffset({ itemOffset, itemLength, viewportLength, contentLength, currentOffset, alignment, viewPosition, viewOffset, }: AlignedOffsetInput): number;
//# sourceMappingURL=scrolling.d.ts.map