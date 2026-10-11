import type { MetricCardRow } from '../../models';
import { type RowPrimitives } from './RowVisual';
declare function bind(body: HTMLElement, row: MetricCardRow, primitives: RowPrimitives): void;
declare function create(document: Document, row: MetricCardRow, primitives: RowPrimitives): HTMLDivElement;
declare function recycle(body: HTMLElement): void;
export declare const metricCardRowRenderer: {
    key: "metricCard";
    create: typeof create;
    bind: typeof bind;
    recycle: typeof recycle;
    measure: (row: MetricCardRow, _width: number) => 161 | 178 | 132;
    measureRendered: (_body: HTMLElement, _row: MetricCardRow) => number | undefined;
};
export {};
//# sourceMappingURL=MetricCardRowRenderer.d.ts.map