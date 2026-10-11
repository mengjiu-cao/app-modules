import type { MarketRow } from '../../models';
import { type RowPrimitives } from './RowVisual';
export type WebMarketLayoutStyle = Readonly<{
    horizontalPadding: number;
    verticalPadding: number;
    leadingGap: number;
    titleBadgeGap: number;
    trailingGap: number;
    imageWidth: number;
    imageHeight: number;
    imageCornerRadius: number;
    changeWidth: number;
    changeHeight: number;
    changeCornerRadius: number;
}>;
export declare function resolveWebMarketLayoutStyle(row: MarketRow): WebMarketLayoutStyle;
export declare function setMarketQuoteContent(element: HTMLElement, row: MarketRow): void;
declare function bind(body: HTMLElement, row: MarketRow, primitives: RowPrimitives): void;
declare function create(document: Document, row: MarketRow, primitives: RowPrimitives): HTMLDivElement;
declare function recycle(body: HTMLElement): void;
export declare const marketRowRenderer: {
    key: "market";
    create: typeof create;
    bind: typeof bind;
    recycle: typeof recycle;
    measure: (row: MarketRow, _width: number) => number;
    measureRendered: (_body: HTMLElement, _row: MarketRow) => number | undefined;
};
export {};
//# sourceMappingURL=MarketRowRenderer.d.ts.map