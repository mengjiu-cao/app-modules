import type { DataRow } from '../../models';
import { type RowPrimitives } from './RowVisual';
declare function bind(body: HTMLElement, row: DataRow, primitives: RowPrimitives): void;
declare function create(document: Document, row: DataRow, primitives: RowPrimitives): HTMLElement;
declare function recycle(body: HTMLElement): void;
export declare const dataRowRenderer: {
    key: "dataRow";
    create: typeof create;
    bind: typeof bind;
    recycle: typeof recycle;
    measure: (row: DataRow, _width: number, layout?: string) => number;
    measureRendered: (_body: HTMLElement, _row: DataRow) => number | undefined;
};
export {};
//# sourceMappingURL=DataRowRenderer.d.ts.map