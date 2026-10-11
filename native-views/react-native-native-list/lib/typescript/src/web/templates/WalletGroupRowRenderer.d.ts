import type { WalletGroupRow } from '../../models';
import type { RowPrimitives } from './RowVisual';
declare function bind(body: HTMLElement, row: WalletGroupRow, primitives: RowPrimitives): void;
declare function create(document: Document, row: WalletGroupRow, primitives: RowPrimitives): HTMLDivElement;
declare function recycle(body: HTMLElement): void;
export declare const walletGroupRowRenderer: {
    key: "walletGroup";
    reorderPreview: (body: HTMLElement, row: WalletGroupRow) => {
        element: HTMLElement;
        height: number;
    } | undefined;
    create: typeof create;
    bind: typeof bind;
    recycle: typeof recycle;
    appliesSizePreset: () => boolean;
    measure: (row: WalletGroupRow, width: number) => number;
    measureRendered: (_body: HTMLElement, _row: WalletGroupRow) => number | undefined;
};
export {};
//# sourceMappingURL=WalletGroupRowRenderer.d.ts.map