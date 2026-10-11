import type { ActionRow } from '../../models';
import { type RowPrimitives } from './RowVisual';
declare function bind(body: HTMLElement, row: ActionRow, primitives: RowPrimitives): void;
declare function create(document: Document, row: ActionRow, primitives: RowPrimitives): HTMLDivElement;
declare function recycle(body: HTMLElement): void;
export declare const actionRowRenderer: {
    key: "action";
    create: typeof create;
    bind: typeof bind;
    recycle: typeof recycle;
    measure: (row: ActionRow, _width: number) => 48 | 60 | 44;
    measureRendered: (_body: HTMLElement, _row: ActionRow) => number | undefined;
};
export {};
//# sourceMappingURL=ActionRowRenderer.d.ts.map