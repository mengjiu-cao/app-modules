import type { SmartXRow } from './SmartX.models';

type Check = (value: unknown, path: string) => void;
function fail(path: string, message: string): never {
  throw new Error(`NativeList ${path}: ${message}`);
}
const text: Check = (value, path) => {
  if (typeof value !== 'string') fail(path, 'must be a string');
};
const nonempty: Check = (value, path) => {
  text(value, path);
  if (!(value as string).trim()) fail(path, 'must be non-empty');
};
const boolean: Check = (value, path) => {
  if (typeof value !== 'boolean') fail(path, 'must be boolean');
};
const optional =
  (check: Check): Check =>
  (value, path) => {
    if (value !== undefined) check(value, path);
  };
const enumeration =
  (...values: readonly string[]): Check =>
  (value, path) => {
    if (typeof value !== 'string' || !values.includes(value))
      fail(path, `must be ${values.join(', ')}`);
  };
const number =
  (min: number, max = Infinity, exclusiveMin = false): Check =>
  (value, path) => {
    if (
      typeof value !== 'number' ||
      !Number.isFinite(value) ||
      value > max ||
      (exclusiveMin ? value <= min : value < min)
    )
      fail(
        path,
        `must be a finite number ${
          exclusiveMin ? '>' : '>='
        } ${min} and <= ${max}`
      );
  };
const color: Check = (value, path) => {
  if (typeof value !== 'string' || !/^#[\da-f]{6}([\da-f]{2})?$/i.test(value))
    fail(path, 'must be #RRGGBB or #RRGGBBAA');
};
function object(fields: Readonly<Record<string, Check>>): Check {
  return (value, path) => {
    if (!value || typeof value !== 'object' || Array.isArray(value))
      fail(path, 'must be an object');
    const record = value as Record<string, unknown>;
    for (const key of Object.keys(record))
      if (!Object.prototype.hasOwnProperty.call(fields, key))
        fail(`${path}.${key}`, 'is not a SmartX slot');
    for (const [key, check] of Object.entries(fields))
      check(record[key], `${path}.${key}`);
  };
}
function array(check: Check, max = Infinity): Check {
  return (value, path) => {
    if (!Array.isArray(value) || value.length > max)
      fail(path, `must be an array with at most ${max} entries`);
    value.forEach((item, index) => check(item, `${path}[${index}]`));
  };
}
const action = object({
  key: nonempty,
  testID: nonempty,
  label: text,
  role: enumeration('button', 'link'),
  disabled: boolean,
  selected: optional(boolean),
  busy: optional(boolean),
  expanded: optional(boolean),
});
const theme = object({
  canvas: color,
  text: color,
  secondaryText: color,
  mutedText: color,
  primary: color,
  success: color,
  error: color,
  border: color,
  divider: color,
  subtleFill: color,
  selectedFill: color,
  raised: color,
  skeleton: color,
  tokenBackground: color,
  tokenText: color,
  tokenBorder: color,
  fonts: object({
    regular: nonempty,
    medium: nonempty,
    semibold: nonempty,
    bold: nonempty,
  }),
  pressedOpacity: number(0, 1),
  disabledOpacity: number(0, 1),
});
const assets = object({
  defaultAvatarUri: nonempty,
  moreUri: nonempty,
  likeUri: nonempty,
  likeFilledUri: nonempty,
  xUri: nonempty,
  arrowUpRightUri: nonempty,
  changeUpUri: nonempty,
  changeDownUri: nonempty,
  announcementBadgeUri: nonempty,
  announcementPinnedUri: nonempty,
  announcementTitleUri: nonempty,
});
const author = object({
  name: text,
  handle: optional(text),
  handleTestID: optional(nonempty),
  time: text,
  avatarUri: optional(nonempty),
  avatarAction: optional(action),
  nameAction: optional(action),
});
const token = object({
  symbol: text,
  logoUri: optional(nonempty),
  fallbackText: text,
});
const displayValue = object({ text, color });
const like = object({ count: text, liked: boolean, action });
const common = {
  theme,
  assets,
  locale: nonempty,
  fontScale: number(0, Infinity, true),
  reducedMotion: boolean,
  separator: boolean,
  author,
  tag: optional(
    object({ text, color, backgroundColor: color, testID: nonempty })
  ),
  moreAction: optional(action),
};
const position = object({
  testID: nonempty,
  token,
  cycleLabel: text,
  cycleOpen: boolean,
  primary: optional(displayValue),
  secondary: optional(
    object({ text, color, direction: optional(enumeration('up', 'down')) })
  ),
  action: optional(action),
  logoAction: optional(action),
});
const spanShape = object({
  kind: enumeration('text', 'ticker', 'link'),
  text,
  bold: boolean,
  italic: boolean,
  action: optional(action),
});
const span: Check = (value, path) => {
  spanShape(value, path);
  const fields = value as Record<string, unknown>;
  if (fields.kind === 'text' && fields.action !== undefined)
    fail(`${path}.action`, 'plain text cannot have an action');
  if (fields.kind !== 'text' && fields.action === undefined)
    fail(`${path}.action`, 'ticker/link requires an action');
};
const contentChecks: Readonly<Record<SmartXRow['type'], Check>> = {
  smartxOpinion: object({
    ...common,
    body: text,
    bodyTestID: nonempty,
    bodyAction: action,
    position: optional(position),
    like,
    links: array(object({ label: text, action })),
    followedLikes: optional(
      object({
        avatars: array(
          object({ uri: optional(nonempty), testID: nonempty }),
          3
        ),
        extraCount: optional(text),
        text: array(displayValue),
        action,
      })
    ),
  }),
  smartxTrade: object({
    ...common,
    token,
    amount: text,
    marketCap: text,
    rowAction: action,
    tokenAction: action,
    logoAction: action,
  }),
  smartxMilestone: object({
    ...common,
    thresholds: array(text),
    position: optional(
      object({
        token,
        values: array(object({ label: text, text, color }), 3),
        mockText: optional(text),
        staleText: optional(text),
        action: optional(action),
      })
    ),
  }),
  smartxAnnouncement: object({
    ...common,
    verified: boolean,
    pinnedLabel: text,
    title: text,
    spans: array(span),
    expanded: boolean,
    toggleLabel: text,
    toggleAction: action,
    like,
  }),
};
/** No extra body-length/line cap is imposed by SmartX; the consumer's content contract remains authoritative. */
export function assertSmartXContent(
  type: SmartXRow['type'],
  value: unknown,
  path: string
): void {
  contentChecks[type](value, path);
}
export function assertSmartXPatch(
  type: SmartXRow['type'],
  changes: unknown,
  path: string
): void {
  object({
    smartx: (value, nestedPath) => assertSmartXContent(type, value, nestedPath),
    revision: optional(number(0, Number.MAX_SAFE_INTEGER)),
    accessibilityLabel: optional(text),
  })(changes, path);
}
