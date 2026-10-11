import type { NativeListSnapshot, RowPatch } from './models';
export declare function validateSnapshot(snapshot: NativeListSnapshot): NativeListSnapshot;
export declare function validatePatches(patches: readonly RowPatch[]): readonly RowPatch[];
export declare function applyRowPatches(snapshot: NativeListSnapshot, patches: readonly RowPatch[]): NativeListSnapshot;
export declare function serializeSnapshot(snapshot: NativeListSnapshot): string;
export declare function serializePatches(patches: readonly RowPatch[]): string;
//# sourceMappingURL=validation.d.ts.map