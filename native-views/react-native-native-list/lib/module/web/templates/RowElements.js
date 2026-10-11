"use strict";

export function createElement(document, tag, className, text) {
  const element = document.createElement(tag);
  if (className) element.className = className;
  if (text !== undefined) element.textContent = text;
  return element;
}
export function setData(element, name, value) {
  if (value === undefined) delete element.dataset[name];else element.dataset[name] = String(value);
}
export function tagSlot(element, slot) {
  element.dataset.nlSlot = slot;
  return element;
}
export function markActionAnchorSource(element, source, slot) {
  setData(element, 'nativeListAnchorSource', source);
  if (slot !== undefined) setData(element, 'nativeListAnchorSlot', slot);
}
export function createTextColumn(document, title, subtitle, tertiary, tertiaryTone, badges, slots = {
  title: 'title',
  subtitle: 'subtitle',
  tertiary: 'tertiary'
}) {
  const column = createElement(document, 'span', 'ok-native-list-flex');
  const titleLine = tagSlot(createElement(document, 'span', 'ok-native-list-title', title), slots.title);
  if (badges?.length) {
    titleLine.removeAttribute('data-nl-slot');
    titleLine.replaceChildren(tagSlot(createElement(document, 'span', undefined, title), slots.title));
    const badgeLine = createElement(document, 'span', 'ok-native-list-badges');
    badges.forEach(badge => badgeLine.appendChild(createBadge(document, badge)));
    titleLine.appendChild(badgeLine);
  }
  column.appendChild(titleLine);
  if (subtitle) column.appendChild(tagSlot(createElement(document, 'span', 'ok-native-list-secondary', subtitle), slots.subtitle));
  if (tertiary) {
    const element = tagSlot(createElement(document, 'span', tertiaryTone === 'info' ? 'ok-native-list-secondary ok-native-list-info' : 'ok-native-list-secondary ok-native-list-tertiary', tertiary), slots.tertiary);
    column.appendChild(element);
  }
  return column;
}
export function createBadge(document, badge) {
  const element = tagSlot(createElement(document, 'span', 'ok-native-list-badge', badge.text), 'badge');
  setData(element, 'tone', badge.tone);
  return element;
}

// Selector digits retain their font family, including explicit button fonts.
export function applyTabularNumbers(body) {
  body.style.fontVariantNumeric = 'tabular-nums';
  body.querySelectorAll('span,button').forEach(text => {
    text.style.fontVariantNumeric = 'tabular-nums';
  });
}

/**
 * Selector presentations use their explicit-height geometry whenever the row
 * has a resolved explicit height: the legacy `row.height` or the preferred
 * `style.container.height`.
 */
export function hasExplicitRowHeight(row) {
  return (row.style?.container?.height ?? row.height) !== undefined;
}

/** Legacy `size` preset adjustment, applied by templates that opt in. */
export function rowSizeModifier(size) {
  if (size === 'small') return -8;
  if (size === 'large') return 12;
  return 0;
}

// Async image reveal state is owned by the image lifecycle, not by template
// defaults: a reused image that already fired `load` never fires it again.
const isImageLoadingNode = node => node.tagName === 'IMG' || node.classList.contains('ok-native-list-selector-image-background');

/** Captures factory inline styles of a template subtree. */
export function captureInlineStyles(root) {
  return new Map([root, ...root.querySelectorAll('*')].map(node => [node, node.style.cssText]));
}

/** Restores captured factory styles while keeping image loading visibility. */
export function restoreInlineStyles(defaults) {
  defaults.forEach((css, node) => {
    if (!isImageLoadingNode(node)) {
      node.style.cssText = css;
      return;
    }
    const opacity = node.style.opacity;
    node.style.cssText = css;
    node.style.opacity = opacity;
  });
}
//# sourceMappingURL=RowElements.js.map