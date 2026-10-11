"use strict";

import { walletGroupRowRenderer } from "./WalletGroupRowRenderer.js";
import { identityRowRenderer } from "./IdentityRowRenderer.js";
import { sectionHeaderRowRenderer } from "./SectionHeaderRowRenderer.js";
import { marketRowRenderer } from "./MarketRowRenderer.js";
import { metricCardRowRenderer } from "./MetricCardRowRenderer.js";
import { dataRowRenderer } from "./DataRowRenderer.js";
import { activityRowRenderer } from "./ActivityRowRenderer.js";
import { systemRowRenderer } from "./SystemRowRenderer.js";
import { actionRowRenderer } from "./ActionRowRenderer.js";
import { mediaTileRowRenderer } from "./MediaTileRowRenderer.js";
import { messageRowRenderer } from "./MessageRowRenderer.js";
import { railRowRenderer } from "./RailRowRenderer.js";
function registration(renderer, row) {
  return {
    key: renderer.key,
    appliesSizePreset: renderer.appliesSizePreset?.(row) ?? true,
    create: (document, primitives) => renderer.create(document, row, primitives),
    bind: (body, primitives) => renderer.bind(body, row, primitives),
    measure: (width, layout) => renderer.measure(row, width, layout),
    measureRendered: body => renderer.measureRendered(body, row),
    reorderPreview: body => renderer.reorderPreview?.(body, row)
  };
}
const factories = {
  walletGroup: row => registration(walletGroupRowRenderer, row),
  identity: row => registration(identityRowRenderer, row),
  sectionHeader: row => registration(sectionHeaderRowRenderer, row),
  market: row => registration(marketRowRenderer, row),
  metricCard: row => registration(metricCardRowRenderer, row),
  dataRow: row => registration(dataRowRenderer, row),
  activity: row => registration(activityRowRenderer, row),
  system: row => registration(systemRowRenderer, row),
  action: row => registration(actionRowRenderer, row),
  message: row => registration(messageRowRenderer, row),
  rail: row => registration(railRowRenderer, row),
  mediaTile: row => registration(mediaTileRowRenderer, row)
};
const renderers = {
  walletGroup: walletGroupRowRenderer,
  identity: identityRowRenderer,
  sectionHeader: sectionHeaderRowRenderer,
  market: marketRowRenderer,
  metricCard: metricCardRowRenderer,
  dataRow: dataRowRenderer,
  activity: activityRowRenderer,
  system: systemRowRenderer,
  action: actionRowRenderer,
  message: messageRowRenderer,
  rail: railRowRenderer,
  mediaTile: mediaTileRowRenderer
};
const isRegistered = key => Object.prototype.hasOwnProperty.call(factories, key);

// Closed registration; a row's data key, styles and placement never affect reuse.
export function rowRenderer(row) {
  if (!isRegistered(row.type)) throw new Error('No renderer registered for ' + row.type);
  return factories[row.type](row);
}
export function rowRendererKey(row) {
  if (!isRegistered(row.type)) throw new Error('No Web renderer registered for ' + row.type);
  return row.type;
}
export function recycleRowBody(body) {
  const key = body.dataset.nlRenderer ?? '';
  if (!isRegistered(key)) return false;
  renderers[key].recycle(body);
  return true;
}
//# sourceMappingURL=RowRendererRegistry.js.map