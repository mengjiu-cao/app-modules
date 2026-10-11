import type { NativeListTextStyle } from '../../models';
export declare function applyValueSegments(element: HTMLElement, segments: readonly Readonly<{
    text: string;
    style?: 'subscript';
}>[] | undefined, fontSize?: number, lineHeight?: number, weight?: number): void;
export declare function applyTextLayout(element: HTMLElement, style: NativeListTextStyle, defaultLines?: number): void;
export declare function applyTextStyleToSlot(element: HTMLElement, style: NativeListTextStyle, defaultLines?: number): void;
export declare function fontWeight(value: NativeListTextStyle['fontWeight'] | undefined, fallback: number): number;
//# sourceMappingURL=RowText.d.ts.map