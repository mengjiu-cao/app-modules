import type { RowBase } from './models';
/** SmartX owns business state. These finite slots contain presentation values only. */
export type SmartXAction = Readonly<{
    /** Opaque JS binding key. Native must return this exact value without decoding it. */
    key: string;
    testID: string;
    label: string;
    role: 'button' | 'link';
    disabled: boolean;
    selected?: boolean;
    busy?: boolean;
    expanded?: boolean;
}>;
export type SmartXTheme = Readonly<{
    canvas: string;
    text: string;
    secondaryText: string;
    mutedText: string;
    primary: string;
    success: string;
    error: string;
    border: string;
    divider: string;
    subtleFill: string;
    selectedFill: string;
    raised: string;
    skeleton: string;
    tokenBackground: string;
    tokenText: string;
    tokenBorder: string;
    fonts: Readonly<{
        regular: string;
        medium: string;
        semibold: string;
        bold: string;
    }>;
    pressedOpacity: number;
    disabledOpacity: number;
}>;
export type SmartXAssets = Readonly<{
    defaultAvatarUri: string;
    moreUri: string;
    likeUri: string;
    likeFilledUri: string;
    xUri: string;
    arrowUpRightUri: string;
    changeUpUri: string;
    changeDownUri: string;
    announcementBadgeUri: string;
    announcementPinnedUri: string;
    announcementTitleUri: string;
}>;
export type SmartXAuthor = Readonly<{
    name: string;
    handle?: string;
    handleTestID?: string;
    time: string;
    avatarUri?: string;
    avatarAction?: SmartXAction;
    nameAction?: SmartXAction;
}>;
export type SmartXTag = Readonly<{
    text: string;
    color: string;
    backgroundColor: string;
    testID: string;
}>;
export type SmartXToken = Readonly<{
    symbol: string;
    logoUri?: string;
    /** App's existing tokenIconLabel, preserving complete graphemes. */
    fallbackText: string;
}>;
export type SmartXValue = Readonly<{
    text: string;
    color: string;
}>;
export type SmartXLike = Readonly<{
    count: string;
    liked: boolean;
    action: SmartXAction;
}>;
export type SmartXCommon = Readonly<{
    theme: SmartXTheme;
    assets: SmartXAssets;
    locale: string;
    fontScale: number;
    reducedMotion: boolean;
    /** Draw at x=52 through the trailing edge; announcements keep a 16px trailing inset. */
    separator: boolean;
    author: SmartXAuthor;
    tag?: SmartXTag;
    moreAction?: SmartXAction;
}>;
export type SmartXPosition = Readonly<{
    testID: string;
    token: SmartXToken;
    cycleLabel: string;
    cycleOpen: boolean;
    primary?: SmartXValue;
    secondary?: SmartXValue & Readonly<{
        direction?: 'up' | 'down';
    }>;
    action?: SmartXAction;
    logoAction?: SmartXAction;
}>;
export type SmartXOpinionContent = SmartXCommon & Readonly<{
    body: string;
    bodyTestID: string;
    bodyAction: SmartXAction;
    position?: SmartXPosition;
    like: SmartXLike;
    links: readonly Readonly<{
        label: string;
        action: SmartXAction;
    }>[];
    followedLikes?: Readonly<{
        avatars: readonly Readonly<{
            uri?: string;
            testID: string;
        }>[];
        extraCount?: string;
        /** Finite inline color runs; no HTML, render tree, mention or embedded views. */
        text: readonly SmartXValue[];
        action: SmartXAction;
    }>;
}>;
export type SmartXTradeContent = SmartXCommon & Readonly<{
    token: SmartXToken;
    amount: string;
    marketCap: string;
    rowAction: SmartXAction;
    tokenAction: SmartXAction;
    logoAction: SmartXAction;
}>;
export type SmartXMilestoneContent = SmartXCommon & Readonly<{
    thresholds: readonly string[];
    position?: Readonly<{
        token: SmartXToken;
        values: readonly Readonly<{
            label: string;
            text: string;
            color: string;
        }>[];
        mockText?: string;
        staleText?: string;
        action?: SmartXAction;
    }>;
}>;
export type SmartXAnnouncementSpan = Readonly<{
    kind: 'text' | 'ticker' | 'link';
    text: string;
    bold: boolean;
    italic: boolean;
    action?: SmartXAction;
}>;
export type SmartXAnnouncementContent = SmartXCommon & Readonly<{
    verified: boolean;
    pinnedLabel: string;
    title: string;
    spans: readonly SmartXAnnouncementSpan[];
    expanded: boolean;
    toggleLabel: string;
    toggleAction: SmartXAction;
    like: SmartXLike;
}>;
type SmartXBase = RowBase & Readonly<{
    style?: never;
}>;
export type SmartXOpinionRow = SmartXBase & Readonly<{
    type: 'smartxOpinion';
    smartx: SmartXOpinionContent;
}>;
export type SmartXTradeRow = SmartXBase & Readonly<{
    type: 'smartxTrade';
    smartx: SmartXTradeContent;
}>;
export type SmartXMilestoneRow = SmartXBase & Readonly<{
    type: 'smartxMilestone';
    smartx: SmartXMilestoneContent;
}>;
export type SmartXAnnouncementRow = SmartXBase & Readonly<{
    type: 'smartxAnnouncement';
    smartx: SmartXAnnouncementContent;
}>;
export type SmartXRow = SmartXOpinionRow | SmartXTradeRow | SmartXMilestoneRow | SmartXAnnouncementRow;
/** Replacing the complete content atomically also removes optional slots absent in the next content. */
export type SmartXRowPatch = {
    [T in SmartXRow['type']]: Readonly<{
        type: T;
        key: string;
        changes: Readonly<{
            smartx: Extract<SmartXRow, {
                type: T;
            }>['smartx'];
            revision?: number;
            accessibilityLabel?: string;
        }>;
    }>;
}[SmartXRow['type']];
export {};
//# sourceMappingURL=SmartX.models.d.ts.map