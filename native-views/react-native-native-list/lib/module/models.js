"use strict";

/**
 * Named typography steps, shared with the application's design scale. Resolved
 * to fontSize/lineHeight/fontWeight in JavaScript before the snapshot is
 * serialized, so no native renderer needs to know the vocabulary.
 * See docs/STYLE_SPEC.md §3.2.
 */

/** Retained alias: Market shipped this name before the style surface was shared. */

/** Local box vocabulary. Each template exposes only parameters for its own slots. */

/** Template-owned slots determine which local box parameters exist, on every platform. */
export const ROW_BOX_STYLE_KEYS_BY_TYPE = {
  smartxOpinion: [],
  smartxTrade: [],
  smartxMilestone: [],
  smartxAnnouncement: [],
  identity: ['horizontalPadding', 'verticalPadding', 'leadingGap', 'lineGap', 'titleBadgeGap', 'trailingGap', 'image'],
  walletGroup: ['horizontalPadding', 'verticalPadding'],
  rail: ['horizontalPadding', 'verticalPadding', 'leadingGap', 'titleBadgeGap', 'trailingGap', 'image'],
  activity: ['horizontalPadding', 'verticalPadding', 'leadingGap', 'lineGap', 'titleBadgeGap', 'trailingGap', 'image'],
  message: ['horizontalPadding', 'verticalPadding', 'leadingGap', 'lineGap', 'image'],
  dataRow: ['horizontalPadding', 'verticalPadding', 'leadingGap', 'lineGap', 'titleBadgeGap', 'image'],
  market: ['horizontalPadding', 'verticalPadding', 'leadingGap', 'lineGap', 'titleBadgeGap', 'trailingGap', 'image'],
  mediaTile: ['horizontalPadding', 'verticalPadding', 'leadingGap', 'lineGap', 'image'],
  metricCard: ['horizontalPadding', 'verticalPadding', 'leadingGap', 'lineGap', 'image'],
  sectionHeader: ['horizontalPadding', 'verticalPadding', 'lineGap', 'trailingGap'],
  action: ['horizontalPadding', 'verticalPadding', 'leadingGap', 'trailingGap', 'image'],
  system: ['horizontalPadding', 'verticalPadding', 'lineGap']
};

/**
 * A style key names the model field it modifies, never the view that carries
 * it. Each template renderer owns its views and maps the key to whichever view
 * renders that field (for example metricCard `value` is its large number), so
 * the same key name keeps one meaning across platforms. See docs/STYLE_SPEC.md §4.
 */

// OneKey patch: keep selector decoration and text data serializable.

// OneKey patch: preserve compact very-small-balance digit runs.

/** Native Market quote row. All values are already localized/formatted strings. */

/** Compact KPI card for dashboards and grids. */

/**
 * List chrome that every platform can honour. Pull to refresh, the section index
 * rail and the reorder preview are deliberately absent: the first two are system
 * controls or three independent constant sets, and the third is drawn with
 * platform-specific primitives. See docs/STYLE_SPEC.md §5.
 */

// OneKey patch: include selector-only mutable presentation fields.
// type CommonPatchFields = 'revision' | 'disabled' | 'selected' | 'separator';
// OneKey patch: balance patches also refresh the existing row's spoken content.
// type CommonPatchFields = 'revision' | 'disabled' | 'selected' | 'separator' | 'height' | 'heightRounding' | 'opacity' | 'pressDisabled';
//# sourceMappingURL=models.js.map