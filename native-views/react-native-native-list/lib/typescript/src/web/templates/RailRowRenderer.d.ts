import type { RailRow } from '../../models';
import type { RowPrimitives } from './RowVisual';
export declare function resolveRailRow(row: RailRow): {
    horizontalPadding: number;
    verticalPadding: number;
    leadingGap: number;
    badgeGap: number;
    trailingGap: number;
    width: number;
    height: number;
    title: string;
    badge: string;
    status: string;
};
declare function bind(body: HTMLElement, row: RailRow, primitives: RowPrimitives): void;
declare function create(document: Document, row: RailRow, primitives: RowPrimitives): HTMLDivElement;
declare function recycle(body: HTMLElement): void;
export declare function measureRailWidth(row: RailRow): number;
export declare const railRowRenderer: {
    key: "rail";
    create: typeof create;
    bind: typeof bind;
    recycle: typeof recycle;
    measure: (_row: RailRow, _width: number) => number;
    measureRendered: (_body: HTMLElement, _row: RailRow) => number | undefined;
};
export {};
//# sourceMappingURL=RailRowRenderer.d.ts.map