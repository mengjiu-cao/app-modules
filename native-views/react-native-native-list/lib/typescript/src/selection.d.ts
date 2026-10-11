import type { CheckboxState, NativeListSnapshot, RowModel, SelectionDeltaEvent, SelectionMode } from './models';
export type SelectionState = Readonly<{
    mode: SelectionMode;
    selectedKeys: ReadonlySet<string>;
}>;
export type SelectionAction = Readonly<{
    scope: 'row';
    key: string;
}> | Readonly<{
    scope: 'section';
    sectionKey: string;
}> | Readonly<{
    scope: 'list';
}> | Readonly<{
    scope: 'replace';
    selectedKeys: readonly string[];
}>;
export type SelectionResult = Readonly<{
    state: SelectionState;
    delta: SelectionDeltaEvent;
}>;
export declare function isSelectableRow(row: RowModel): boolean;
export declare function isRowPressEnabled(row: RowModel): boolean;
export declare function reduceSelection(state: SelectionState, action: SelectionAction, rows: readonly RowModel[]): SelectionResult;
export declare function checkboxStateForKeys(keys: readonly string[], selectedKeys: ReadonlySet<string>): CheckboxState;
export declare function checkboxStateForSection(sectionKey: string, rows: readonly RowModel[], selectedKeys: ReadonlySet<string>): CheckboxState;
export declare function selectionStateFromSnapshot(snapshot: NativeListSnapshot): SelectionState;
//# sourceMappingURL=selection.d.ts.map