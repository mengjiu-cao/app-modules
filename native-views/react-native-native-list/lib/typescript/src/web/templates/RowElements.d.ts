import type { NativeListActionSource } from '../../models';
export declare function createElement(document: Document, tag: string, className?: string, text?: string): HTMLElement;
export declare function setData(element: HTMLElement, name: string, value: string | number | boolean | undefined): void;
export declare function tagSlot<T extends HTMLElement>(element: T, slot: string): T;
export declare function markActionAnchorSource(element: HTMLElement, source: NativeListActionSource, slot?: number): void;
export declare function createTextColumn(document: Document, title: string, subtitle?: string, tertiary?: string, tertiaryTone?: 'secondary' | 'info', badges?: readonly Readonly<{
    text: string;
    tone?: string;
}>[], slots?: Readonly<{
    title: string;
    subtitle: string;
    tertiary: string;
}>): HTMLElement;
export declare function createBadge(document: Document, badge: Readonly<{
    text: string;
    tone?: string;
}>): HTMLElement;
export declare function applyTabularNumbers(body: HTMLElement): void;
/**
 * Selector presentations use their explicit-height geometry whenever the row
 * has a resolved explicit height: the legacy `row.height` or the preferred
 * `style.container.height`.
 */
export declare function hasExplicitRowHeight(row: Readonly<{
    height?: number;
    style?: Readonly<{
        container?: Readonly<{
            height?: number;
        }>;
    }>;
}>): boolean;
/** Legacy `size` preset adjustment, applied by templates that opt in. */
export declare function rowSizeModifier(size: string | undefined): number;
/** Captures factory inline styles of a template subtree. */
export declare function captureInlineStyles(root: HTMLElement): Map<HTMLElement, string>;
/** Restores captured factory styles while keeping image loading visibility. */
export declare function restoreInlineStyles(defaults: Map<HTMLElement, string>): void;
//# sourceMappingURL=RowElements.d.ts.map