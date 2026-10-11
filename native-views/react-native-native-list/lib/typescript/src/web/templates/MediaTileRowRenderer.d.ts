import type { MediaTileRow } from '../../models';
import type { RowPrimitives } from './RowVisual';
declare function bind(body: HTMLElement, row: MediaTileRow, primitives: RowPrimitives): void;
declare function create(document: Document, row: MediaTileRow, primitives: RowPrimitives): HTMLElement;
declare function recycle(body: HTMLElement): void;
export declare const mediaTileRowRenderer: {
    key: "mediaTile";
    create: typeof create;
    bind: typeof bind;
    recycle: typeof recycle;
    measure: (_row: MediaTileRow, _width: number) => number;
    measureRendered: (_body: HTMLElement, _row: MediaTileRow) => number | undefined;
};
export {};
//# sourceMappingURL=MediaTileRowRenderer.d.ts.map