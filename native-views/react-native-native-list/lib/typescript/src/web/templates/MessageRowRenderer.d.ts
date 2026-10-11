import type { RowPrimitives } from './RowVisual';
import type { MessageRow, NativeListTextStyle } from '../../models';
export declare function resolveMessageRow(row: MessageRow): {
    title: Readonly<{
        value: string;
        style: Required<Pick<NativeListTextStyle, "fontSize" | "lineHeight" | "lines">> & NativeListTextStyle;
    }>;
    body: Readonly<{
        value: string;
        style: Required<Pick<NativeListTextStyle, "fontSize" | "lineHeight" | "lines">> & NativeListTextStyle;
    }>;
    time: Readonly<{
        value: string;
        style: Required<Pick<NativeListTextStyle, "fontSize" | "lineHeight" | "lines">> & NativeListTextStyle;
    }>;
    horizontalPadding: number;
    verticalPadding: number;
    lineGap: number;
    leadingGap: number;
    imageWidth: number;
    imageHeight: number;
    image: Readonly<{
        width?: number;
        height?: number;
        shape?: "circle" | "rounded" | "square";
        cornerRadius?: number;
        contentFit?: import("../..").ImageContentFit;
    }> | undefined;
    automaticHeight: boolean;
};
export declare function classifyMessageUpdate(old: MessageRow | undefined, row: MessageRow): "replace" | "unchanged" | "assets" | "content";
export declare function bindMessageRow(body: HTMLElement, row: MessageRow, primitives: RowPrimitives): void;
export declare function createMessageRow(document: Document, row: MessageRow, primitives: RowPrimitives): HTMLElement;
export declare function recycleMessageRow(body: HTMLElement): void;
export declare function measureMessageRow(row: MessageRow, availableWidth: number): number;
export declare const messageRowRenderer: {
    key: "message";
    create: typeof createMessageRow;
    bind: typeof bindMessageRow;
    recycle: typeof recycleMessageRow;
    measure: typeof measureMessageRow;
    measureRendered: (body: HTMLElement, row: MessageRow) => number | undefined;
};
//# sourceMappingURL=MessageRowRenderer.d.ts.map