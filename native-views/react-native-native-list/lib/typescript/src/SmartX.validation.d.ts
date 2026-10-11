import type { SmartXRow } from './SmartX.models';
/** No extra body-length/line cap is imposed by SmartX; the consumer's content contract remains authoritative. */
export declare function assertSmartXContent(type: SmartXRow['type'], value: unknown, path: string): void;
export declare function assertSmartXPatch(type: SmartXRow['type'], changes: unknown, path: string): void;
//# sourceMappingURL=SmartX.validation.d.ts.map