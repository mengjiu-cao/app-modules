import type { SystemRow } from '../../models';
import type { RowPrimitives } from './RowVisual';
declare function bind(body: HTMLElement, row: SystemRow, primitives: RowPrimitives): void;
declare function create(document: Document, row: SystemRow, primitives: RowPrimitives): HTMLDivElement;
declare function measure(row: SystemRow, width: number): number;
export declare const systemRowRenderer: {
    key: "system";
    appliesSizePreset: (row: SystemRow) => boolean;
    create: typeof create;
    bind: typeof bind;
    measure: typeof measure;
    measureRendered: (body: HTMLElement, row: SystemRow) => number | undefined;
    recycle: (body: HTMLElement) => void;
};
export {};
//# sourceMappingURL=SystemRowRenderer.d.ts.map