import type { RowModel } from '../../models';
/**
 * Undo the previous container pass before a renderer rebinds `body`, so the
 * renderer always writes over its own baseline and the next
 * `applyRowContainerStyle` records that fresh value as the value to restore.
 */
export declare function resetRowContainerStyle(body: HTMLElement): void;
export declare function applyRowContainerStyle(body: HTMLElement, row: RowModel): void;
//# sourceMappingURL=RowContainerStyle.d.ts.map