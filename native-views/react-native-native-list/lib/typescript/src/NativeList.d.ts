import React from 'react';
import type { ImageSource } from './models';
import type { NativeListProps } from './NativeList.types';
export type { NativeListProps, NativeListRef } from './NativeList.types';
export type { ActionAnchorState, NativeListKeyboardDismissMode, NativeListScrollMetricsEvent, NativeListKeyboardShouldPersistTaps, ScrollAlignment, ScrollPositionOptions, ScrollToEndParams, ScrollToIndexFailedInfo, ScrollToIndexParams, ScrollToItemParams, ScrollToKeyParams, ScrollToLocationParams, ScrollToOffsetParams, } from './NativeList.types';
export declare function preloadNativeListAvatarImages(sources: readonly ImageSource[]): Promise<boolean>;
export declare const NativeList: React.ForwardRefExoticComponent<NativeListProps & React.RefAttributes<Readonly<{
    applySnapshot(snapshot: import("./models").NativeListSnapshot): void;
    applyPatches(patches: readonly import("./models").RowPatch[]): void;
    reconcileSelection(selectedKeys: readonly string[]): void;
    scrollToKey: (paramsOrKey: import("./NativeList.types").ScrollToKeyParams | string, animated?: boolean, alignment?: import("./NativeList.types").ScrollAlignment) => void;
    scrollToIndex: (paramsOrIndex: import("./NativeList.types").ScrollToIndexParams | number, animated?: boolean, alignment?: import("./NativeList.types").ScrollAlignment) => void;
    scrollToItem(params: import("./NativeList.types").ScrollToItemParams): void;
    scrollToOffset(params: import("./NativeList.types").ScrollToOffsetParams): void;
    scrollToEnd(params?: import("./NativeList.types").ScrollToEndParams): void;
    scrollToLocation(params: import("./NativeList.types").ScrollToLocationParams): void;
    setActionAnchorState(state: import("./NativeList.types").ActionAnchorState): void;
    setRefreshing(refreshing: boolean): void;
}>>>;
//# sourceMappingURL=NativeList.d.ts.map