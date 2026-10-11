import type { NativeListSnapshot, RowPatch } from '../models';
import type {
  SmartXAnnouncementRow,
  SmartXCommon,
  SmartXOpinionRow,
} from '../SmartX.models';
import {
  rowRenderer,
  rowRendererKey,
} from '../web/templates/RowRendererRegistry';
import {
  applyRowPatches,
  serializeSnapshot,
  validatePatches,
  validateSnapshot,
} from '../validation';

const action = {
  key: 'mount:live:o1:like',
  testID: 'square-like-o1',
  label: 'Like',
  role: 'button' as const,
  disabled: false,
};
const common: SmartXCommon = {
  locale: 'zh-CN',
  fontScale: 1,
  reducedMotion: false,
  separator: true,
  author: { name: 'Alice', time: '1m' },
  assets: {
    defaultAvatarUri: 'file:///avatar.jpg',
    moreUri: 'file:///more.svg',
    likeUri: 'file:///like.svg',
    likeFilledUri: 'file:///like-filled.svg',
    xUri: 'file:///x.svg',
    arrowUpRightUri: 'file:///arrow.svg',
    changeUpUri: 'file:///up.svg',
    changeDownUri: 'file:///down.svg',
    announcementBadgeUri: 'file:///badge.svg',
    announcementPinnedUri: 'file:///pin.svg',
    announcementTitleUri: 'file:///title.svg',
  },
  theme: {
    canvas: '#010101',
    text: '#F5F5F5',
    secondaryText: '#747474',
    mutedText: '#747474',
    primary: '#08DFB5',
    success: '#42DC88',
    error: '#FF6B72',
    border: '#FFFFFF1A',
    divider: '#FFFFFF14',
    subtleFill: '#FFFFFF0D',
    selectedFill: '#FFFFFF1A',
    raised: '#252525',
    skeleton: '#252525',
    tokenBackground: '#010101',
    tokenText: '#F5F5F5',
    tokenBorder: '#FFFFFF1A',
    fonts: {
      regular: 'IBMPlexSans-Regular',
      medium: 'IBMPlexSans-Medium',
      semibold: 'IBMPlexSans-SemiBold',
      bold: 'IBMPlexSans-Bold',
    },
    pressedOpacity: 0.6,
    disabledOpacity: 0.3,
  },
};
function opinion(): SmartXOpinionRow {
  return {
    type: 'smartxOpinion',
    key: 'opinion:1',
    separator: false,
    smartx: {
      ...common,
      body: 'Opinion text',
      bodyTestID: 'square-body-1',
      bodyAction: action,
      like: { count: '9007199254740993', liked: false, action },
      links: [],
      position: {
        testID: 'square-position-1',
        token: { symbol: 'ETH', fallbackText: 'ET' },
        cycleLabel: 'Position',
        cycleOpen: true,
      },
    },
  };
}
function snapshot(row = opinion()): NativeListSnapshot {
  return {
    schemaVersion: 1,
    generation: 1,
    layout: { kind: 'linear' },
    rows: [row],
  };
}

describe('SmartX finite native templates', () => {
  it('explicitly rejects native-only SmartX templates in the Web registry', () => {
    expect(() => rowRenderer(opinion())).toThrow(
      'No renderer registered for smartxOpinion'
    );
    expect(() => rowRendererKey(opinion())).toThrow(
      'No Web renderer registered for smartxOpinion'
    );
  });
  it('serializes long multibyte opinion content without the legacy 4096-char cap', () => {
    const row = opinion();
    const serialized = serializeSnapshot(
      snapshot({ ...row, smartx: { ...row.smartx, body: '观点'.repeat(5000) } })
    );
    expect(JSON.parse(serialized).rows[0].smartx.body).toHaveLength(10000);
    expect(JSON.parse(serialized).rows[0].smartx.like.count).toBe(
      '9007199254740993'
    );
  });
  it('accepts all four finite row families while retaining old identity rows', () => {
    const a: SmartXAnnouncementRow = {
      type: 'smartxAnnouncement',
      key: 'announcement:1',
      smartx: {
        ...common,
        verified: true,
        pinnedLabel: 'Pinned',
        title: '',
        spans: [
          { kind: 'text', text: 'plain', bold: true, italic: true },
          { kind: 'ticker', text: '$ETH', bold: false, italic: false, action },
        ],
        expanded: false,
        toggleLabel: 'Read More',
        toggleAction: action,
        like: { count: '0', liked: false, action },
      },
    };
    expect(
      validateSnapshot({
        ...snapshot(),
        rows: [
          opinion(),
          a,
          {
            type: 'smartxTrade',
            key: 'trade:1',
            smartx: {
              ...common,
              token: { symbol: 'ETH', fallbackText: 'ET' },
              amount: '$1.00',
              marketCap: '—',
              rowAction: action,
              tokenAction: action,
              logoAction: action,
            },
          },
          {
            type: 'smartxMilestone',
            key: 'milestone:1',
            smartx: { ...common, thresholds: ['Reached +$1,000 PnL'] },
          },
          {
            type: 'identity',
            key: 'legacy:1',
            title: 'Legacy',
            leading: { kind: 'icon', name: 'coin' },
          },
        ],
      }).rows
    ).toHaveLength(5);
  });
  it('atomically replaces smartx so an omitted position is actually cleared', () => {
    const row = opinion();
    const withoutPosition = { ...row.smartx, position: undefined };
    const next = applyRowPatches(snapshot(row), [
      {
        type: 'smartxOpinion',
        key: row.key,
        changes: { smartx: withoutPosition },
      },
    ]);
    expect((next.rows[0] as SmartXOpinionRow).smartx.position).toBeUndefined();
    expect((next.rows[0] as SmartXOpinionRow).smartx.body).toBe('Opinion text');
  });
  it('rejects partial smartx patches, generic style escape hatches and unknown nested fields', () => {
    expect(() =>
      validatePatches([
        {
          type: 'smartxOpinion',
          key: 'opinion:1',
          changes: { smartx: { like: { count: '2', liked: true, action } } },
        } as unknown as RowPatch,
      ])
    ).toThrow('theme');
    expect(() =>
      validateSnapshot(
        snapshot({
          ...opinion(),
          style: { container: { height: 1 } },
        } as unknown as SmartXOpinionRow)
      )
    ).toThrow('SmartX');
    expect(() =>
      validateSnapshot(
        snapshot({
          ...opinion(),
          smartx: { ...opinion().smartx, renderTree: [] },
        } as unknown as SmartXOpinionRow)
      )
    ).toThrow('renderTree');
    expect(() =>
      validateSnapshot(
        snapshot({
          ...opinion(),
          smartx: {
            ...opinion().smartx,
            author: { name: 'Alice', time: 'now', route: '/user' },
          },
        } as unknown as SmartXOpinionRow)
      )
    ).toThrow('route');
  });
  it('rejects invalid scales, colors, action types, URI empties and unsupported content', () => {
    const row = opinion();
    expect(() =>
      validateSnapshot(
        snapshot({ ...row, smartx: { ...row.smartx, fontScale: 0 } })
      )
    ).toThrow('fontScale');
    expect(() =>
      validateSnapshot(
        snapshot({
          ...row,
          smartx: {
            ...row.smartx,
            theme: { ...common.theme, canvas: 'rgba(0,0,0,1)' },
          },
        })
      )
    ).toThrow('canvas');
    expect(() =>
      validateSnapshot(
        snapshot({
          ...row,
          smartx: { ...row.smartx, bodyAction: { ...action, role: 'menu' } },
        } as unknown as SmartXOpinionRow)
      )
    ).toThrow('role');
    expect(() =>
      validateSnapshot(
        snapshot({
          ...row,
          smartx: { ...row.smartx, assets: { ...common.assets, moreUri: '' } },
        })
      )
    ).toThrow('moreUri');
    expect(() =>
      validatePatches([
        {
          type: 'smartxOpinion',
          key: row.key,
          changes: { smartx: row.smartx, height: 100 },
        } as unknown as RowPatch,
      ])
    ).toThrow('height');
  });
  it('rejects clickable plain text and actionless ticker/link announcement spans', () => {
    const row: SmartXAnnouncementRow = {
      type: 'smartxAnnouncement',
      key: 'announcement:1',
      smartx: {
        ...common,
        verified: true,
        pinnedLabel: 'Pinned',
        title: '',
        spans: [
          { kind: 'text', text: 'text', bold: false, italic: false, action },
        ],
        expanded: false,
        toggleLabel: 'Read More',
        toggleAction: action,
        like: { count: '0', liked: false, action },
      },
    };
    expect(() => validateSnapshot({ ...snapshot(), rows: [row] })).toThrow(
      'plain text'
    );
    expect(() =>
      validateSnapshot({
        ...snapshot(),
        rows: [
          {
            ...row,
            smartx: {
              ...row.smartx,
              spans: [
                { kind: 'link', text: 'link', bold: false, italic: false },
              ],
            },
          },
        ],
      })
    ).toThrow('requires an action');
  });
  it('rejects changing a row family via patch and a fourth followed-like avatar', () => {
    const row = opinion();
    const patch = {
      type: 'smartxMilestone',
      key: row.key,
      changes: { smartx: { ...common, thresholds: [] } },
    } as const;
    expect(() => applyRowPatches(snapshot(), [patch])).toThrow(
      'not smartxMilestone'
    );
    expect(() =>
      validateSnapshot(
        snapshot({
          ...row,
          smartx: {
            ...row.smartx,
            followedLikes: {
              action,
              text: [],
              avatars: [1, 2, 3, 4].map((n) => ({ testID: `avatar-${n}` })),
            },
          },
        })
      )
    ).toThrow('at most 3');
  });
});

describe('native system retry action identifier', () => {
  it('keeps row and retry action identifiers distinct in snapshots and patches', () => {
    const input: NativeListSnapshot = {
      ...snapshot(),
      rows: [
        {
          type: 'system',
          variant: 'retry',
          key: 'retry',
          testID: 'square-footer',
          message: 'Try again',
          actionKey: 'retry',
          actionTestID: 'square-next-retry-live',
        },
      ],
    };
    expect(JSON.parse(serializeSnapshot(input)).rows[0]).toMatchObject({
      testID: 'square-footer',
      actionTestID: 'square-next-retry-live',
    });
    expect(
      applyRowPatches(input, [
        {
          type: 'system',
          key: 'retry',
          changes: { actionTestID: 'square-refresh-retry-live' },
        },
      ]).rows[0]
    ).toMatchObject({ actionTestID: 'square-refresh-retry-live' });
  });
  it('rejects blank/non-string action identifiers and identifiers on non-retry rows', () => {
    expect(() =>
      validatePatches([
        { type: 'system', key: 'retry', changes: { actionTestID: ' ' } },
      ])
    ).toThrow('actionTestID');
    expect(() =>
      validatePatches([
        {
          type: 'system',
          key: 'retry',
          changes: { actionTestID: 123 },
        } as unknown as RowPatch,
      ])
    ).toThrow('actionTestID');
    expect(() =>
      validateSnapshot({
        ...snapshot(),
        rows: [
          {
            type: 'system',
            variant: 'loading',
            key: 'loading',
            actionTestID: 'retry',
          } as unknown as NativeListSnapshot['rows'][number],
        ],
      })
    ).toThrow('only supported by retry');
  });
});
