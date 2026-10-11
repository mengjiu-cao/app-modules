import type { TrailingAccessory, ImageSource, LeadingVisual, NativeListTextStyle, NativeListImageStyle } from '../../models';
export type RowPrimitives = Readonly<{
    background: string;
    icon: (element: HTMLElement, name: string) => void;
    iconAction: (name: string, actionKey: string | undefined, disabled?: boolean, tintColor?: string) => HTMLElement;
    accessory: (rowKey: string, descriptor: TrailingAccessory, slot: number) => HTMLElement;
    visual: (source: LeadingVisual | undefined, presentation?: string) => HTMLElement | undefined;
    thumbnail: (source: ImageSource) => HTMLElement | undefined;
    textStyle: (element: HTMLElement, style: NativeListTextStyle, defaultLines?: number) => void;
    dispose: (element: HTMLElement) => void;
}>;
/** Restores factory geometry without touching async loading visibility. */
export declare class RowVisualStyle {
    private readonly view;
    private readonly defaults;
    constructor(view: HTMLElement);
    restore(): void;
    apply(image: NativeListImageStyle | undefined, width: number, height: number, margin: number): void;
}
//# sourceMappingURL=RowVisual.d.ts.map