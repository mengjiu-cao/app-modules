import type { ImageSource, RowModel, RowPatch } from './models';
export type AvatarCandidate = Readonly<{
    source: ImageSource;
    priority: 0 | 1 | 2;
}>;
export declare function avatarPrefetchWindow(rows: readonly RowModel[], first: number, last: number, direction: number, resolveRow?: (row: RowModel) => RowModel): AvatarCandidate[];
export declare class NativeAvatarPrefetchModel {
    private rows;
    private rowByKey;
    private readonly imageRows;
    constructor(rows: readonly RowModel[]);
    replaceSnapshot(rows: readonly RowModel[]): void;
    applyPatches(patches: readonly RowPatch[], dispatch?: () => void): boolean;
    window(first: number, last: number, direction: number): AvatarCandidate[];
}
export declare class NativeAvatarPrefetchQueue {
    private readonly preload;
    private pending;
    private activeUri;
    private timer;
    private disposed;
    private readonly recent;
    constructor(preload: (source: ImageSource) => Promise<boolean>);
    update(candidates: readonly AvatarCandidate[]): void;
    dispose(): void;
    private schedule;
}
//# sourceMappingURL=avatarPrefetch.d.ts.map