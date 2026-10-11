export type AvatarLease = (() => void) & {
    setPriority: (priority: number) => void;
};
export declare function canonicalNativeListAvatarUri(uri: string): string | undefined;
export declare function acquireNativeListAvatar(document: Document, uri: string, resolve: (url: string) => void, reject: () => void, priority?: number): AvatarLease;
//# sourceMappingURL=NativeListWebAvatarCache.d.ts.map