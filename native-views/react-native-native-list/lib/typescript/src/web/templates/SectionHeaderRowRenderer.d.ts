import type { SectionHeaderRow } from '../../models';
import type { RowPrimitives } from './RowVisual';
declare function bind(body: HTMLElement, row: SectionHeaderRow, primitives: RowPrimitives): void;
declare function create(document: Document, row: SectionHeaderRow, primitives: RowPrimitives): HTMLDivElement;
export declare const sectionHeaderRowRenderer: {
    key: "sectionHeader";
    create: typeof create;
    bind: typeof bind;
    recycle: (body: HTMLElement) => void;
    appliesSizePreset: (row: SectionHeaderRow) => boolean;
    measure: (row: SectionHeaderRow, _width: number, layout?: string) => 32 | 28 | 16 | 68 | 47 | 56 | 30 | 36;
    measureRendered: (_body: HTMLElement, _row: SectionHeaderRow) => number | undefined;
};
export {};
//# sourceMappingURL=SectionHeaderRowRenderer.d.ts.map