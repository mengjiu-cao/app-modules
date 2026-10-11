import type { IdentityRow } from '../../models';
import { type RowPrimitives } from './RowVisual';
declare function bind(body: HTMLElement, row: IdentityRow, primitives: RowPrimitives): void;
declare function create(document: Document, row: IdentityRow, primitives: RowPrimitives): HTMLDivElement;
declare function recycle(body: HTMLElement): void;
export declare const identityRowRenderer: {
    key: "identity";
    create: typeof create;
    bind: typeof bind;
    recycle: typeof recycle;
    appliesSizePreset: (row: IdentityRow) => boolean;
    measure: (row: IdentityRow, _width: number) => number;
    measureRendered: (_body: HTMLElement, _row: IdentityRow) => number | undefined;
};
export {};
//# sourceMappingURL=IdentityRowRenderer.d.ts.map