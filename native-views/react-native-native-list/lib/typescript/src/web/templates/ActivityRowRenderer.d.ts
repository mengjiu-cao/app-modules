import type { ActivityRow } from '../../models';
import { type RowPrimitives } from './RowVisual';
declare function bind(body: HTMLElement, row: ActivityRow, primitives: RowPrimitives): void;
declare function create(document: Document, row: ActivityRow, primitives: RowPrimitives): HTMLElement;
declare function recycle(body: HTMLElement): void;
export declare const activityRowRenderer: {
    key: "activity";
    create: typeof create;
    bind: typeof bind;
    recycle: typeof recycle;
    measure: (row: ActivityRow, _width: number) => 60 | 100;
    measureRendered: (_body: HTMLElement, _row: ActivityRow) => number | undefined;
};
export {};
//# sourceMappingURL=ActivityRowRenderer.d.ts.map