"use strict";

export function isSelectableRow(row) {
  return !row.disabled && (row.type === 'identity' || row.type === 'rail' || row.type === 'activity' || row.type === 'message' || row.type === 'dataRow' || row.type === 'mediaTile' || row.type === 'metricCard');
}
export function isRowPressEnabled(row) {
  return !row.disabled && !row.pressDisabled && (row.type !== 'system' || row.variant === 'retry');
}
function deltaBetween(before, after, source, sourceKey) {
  return {
    addedKeys: [...after].filter(key => !before.has(key)),
    removedKeys: [...before].filter(key => !after.has(key)),
    source,
    sourceKey
  };
}
function targetKeys(action, rows) {
  switch (action.scope) {
    case 'row':
      return rows.some(row => row.key === action.key && isSelectableRow(row)) ? [action.key] : [];
    case 'section':
      return rows.filter(row => row.sectionKey === action.sectionKey && isSelectableRow(row)).map(row => row.key);
    case 'list':
      return rows.filter(isSelectableRow).map(row => row.key);
    case 'replace':
      return action.selectedKeys.filter(key => rows.some(row => row.key === key && isSelectableRow(row)));
  }
}
export function reduceSelection(state, action, rows) {
  const before = new Set(state.selectedKeys);
  if (state.mode === 'none') {
    return {
      state,
      delta: {
        addedKeys: [],
        removedKeys: [],
        source: 'list'
      }
    };
  }
  const targets = targetKeys(action, rows);
  const source = action.scope === 'replace' ? 'list' : action.scope;
  const sourceKey = action.scope === 'row' ? action.key : action.scope === 'section' ? action.sectionKey : undefined;
  if (targets.length === 0 && action.scope !== 'replace') {
    return {
      state,
      delta: deltaBetween(before, before, source, sourceKey)
    };
  }
  const after = new Set(before);
  if (action.scope === 'replace') {
    after.clear();
    const replacement = state.mode === 'single' ? targets.slice(0, 1) : targets;
    replacement.forEach(key => after.add(key));
  } else if (state.mode === 'single') {
    const key = targets[0];
    after.clear();
    if (key && !before.has(key)) after.add(key);
  } else {
    const allSelected = targets.length > 0 && targets.every(key => before.has(key));
    targets.forEach(key => allSelected ? after.delete(key) : after.add(key));
  }
  const nextState = {
    mode: state.mode,
    selectedKeys: after
  };
  return {
    state: nextState,
    delta: deltaBetween(before, after, source, sourceKey)
  };
}
export function checkboxStateForKeys(keys, selectedKeys) {
  if (keys.length === 0) return 'unchecked';
  const selectedCount = keys.reduce((count, key) => count + (selectedKeys.has(key) ? 1 : 0), 0);
  if (selectedCount === 0) return 'unchecked';
  if (selectedCount === keys.length) return 'checked';
  return 'indeterminate';
}
export function checkboxStateForSection(sectionKey, rows, selectedKeys) {
  return checkboxStateForKeys(rows.filter(row => row.sectionKey === sectionKey && isSelectableRow(row)).map(row => row.key), selectedKeys);
}
export function selectionStateFromSnapshot(snapshot) {
  return {
    mode: snapshot.selection?.mode ?? 'none',
    selectedKeys: new Set(snapshot.selection?.selectedKeys ?? [])
  };
}
//# sourceMappingURL=selection.js.map