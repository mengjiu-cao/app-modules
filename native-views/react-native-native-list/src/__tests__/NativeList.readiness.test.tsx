import React, { createRef } from 'react';
import TestRenderer, { act } from 'react-test-renderer';
import type { NativeListRef } from '../NativeList.types';
import type { NativeListMethods } from '../NativeList.nitro';
import type { NativeListSnapshot } from '../models';

let mockBindHost: (host: NativeListMethods) => void;
let mockRowAction: (payload: string) => void;
let mockScrollMetrics: (payload: string) => void;
let mockEndReached: (payload: string) => void;
const makeHost = () =>
  ({
    applySnapshot: jest.fn(),
    applyPatches: jest.fn(),
    reconcileSelection: jest.fn(),
    scrollToKey: jest.fn(),
    scrollToIndex: jest.fn(),
    scrollToOffset: jest.fn(),
    scrollToEnd: jest.fn(),
    setActionAnchorState: jest.fn(),
    setRefreshing: jest.fn(),
  } as unknown as NativeListMethods & {
    applySnapshot: jest.Mock;
    applyPatches: jest.Mock;
    setRefreshing: jest.Mock;
  });

jest.mock('react-native', () => {
  const ReactForMock = require('react') as typeof React;
  return { View: (props: object) => ReactForMock.createElement('div', props) };
});
jest.mock('@onekeyfe/react-native-image', () => ({
  OneKeyImageCache: { preload: jest.fn().mockResolvedValue(true) },
  OneKeyImageCachePolicy: {
    MEMORY: 'memory',
    DISK: 'disk',
    MEMORY_DISK: 'memory-disk',
  },
}));
jest.mock('react-native-nitro-modules', () => ({
  callback: (value: unknown) => value,
  getHostComponent: () =>
    function MockNativeHost(props: {
      hybridRef: typeof mockBindHost;
      onRowAction: typeof mockRowAction;
      onScrollMetrics: typeof mockScrollMetrics;
      onEndReached: typeof mockEndReached;
    }) {
      mockBindHost = props.hybridRef;
      mockRowAction = props.onRowAction;
      mockScrollMetrics = props.onScrollMetrics;
      mockEndReached = props.onEndReached;
      // Fabric creates its native host asynchronously, after the JS ref exists.
      return null;
    },
}));

const snapshot: NativeListSnapshot = {
  schemaVersion: 1,
  generation: 1,
  layout: { kind: 'linear' },
  rows: [{ key: 'a', type: 'system', variant: 'noMatch', message: 'Initial' }],
};

function lastSnapshot(host: ReturnType<typeof makeHost>): NativeListSnapshot {
  return JSON.parse(host.applySnapshot.mock.calls.at(-1)![0]);
}

describe('NativeList delayed native host readiness', () => {
  const { NativeList } = jest.requireActual(
    '../NativeList'
  ) as typeof import('../NativeList');
  const renderers: TestRenderer.ReactTestRenderer[] = [];
  afterEach(async () => {
    await act(async () =>
      renderers.splice(0).forEach((renderer) => renderer.unmount())
    );
  });
  const mount = async () => {
    const ref = createRef<NativeListRef>();
    let renderer!: TestRenderer.ReactTestRenderer;
    await act(async () => {
      renderer = TestRenderer.create(
        <NativeList ref={ref} snapshot={snapshot} />
      );
    });
    renderers.push(renderer);
    return { ref, renderer };
  };

  it('coalesces delayed snapshots and patches, then restores refreshing after the latest data', async () => {
    const { ref } = await mount();
    ref.current!.applySnapshot({
      ...snapshot,
      generation: 2,
      rows: [
        ...snapshot.rows,
        { key: 'b', type: 'system', variant: 'end', message: 'Added' },
      ],
    });
    ref.current!.applyPatches([
      { key: 'b', type: 'system', changes: { message: 'Patched' } },
    ]);
    ref.current!.setRefreshing(true);
    const host = makeHost();
    act(() => mockBindHost(host));
    expect(host.applySnapshot).toHaveBeenCalledTimes(1);
    expect(lastSnapshot(host).generation).toBe(2);
    expect(lastSnapshot(host).rows[1]).toMatchObject({
      key: 'b',
      message: 'Patched',
    });
    expect(host.applyPatches).not.toHaveBeenCalled();
    expect(host.setRefreshing).toHaveBeenCalledWith(true);
    expect(host.applySnapshot.mock.invocationCallOrder[0]).toBeLessThan(
      host.setRefreshing.mock.invocationCallOrder[0]
    );
    act(() => mockBindHost(host));
    expect(host.applySnapshot).toHaveBeenCalledTimes(1);
    expect(host.setRefreshing).toHaveBeenCalledTimes(1);
  });

  it('lets a newer declarative snapshot supersede all previously queued state', async () => {
    const { ref, renderer } = await mount();
    ref.current!.applyPatches([
      { key: 'a', type: 'system', changes: { message: 'Obsolete' } },
    ]);
    ref.current!.setRefreshing(true);
    const next: NativeListSnapshot = {
      ...snapshot,
      generation: 3,
      rows: [
        { key: 'new', type: 'system', variant: 'end', message: 'New prop' },
      ],
    };
    await act(async () =>
      renderer.update(<NativeList ref={ref} snapshot={next} />)
    );
    ref.current!.applyPatches([
      { key: 'new', type: 'system', changes: { message: 'Latest' } },
    ]);
    const host = makeHost();
    act(() => mockBindHost(host));
    expect(lastSnapshot(host)).toMatchObject({
      generation: 3,
      rows: [{ key: 'new', message: 'Latest' }],
    });
    expect(host.setRefreshing).not.toHaveBeenCalled();
  });

  it('replays accepted data into a replacement host and ignores a late bind after unmount', async () => {
    const { ref, renderer } = await mount();
    const first = makeHost();
    act(() => mockBindHost(first));
    ref.current!.applyPatches([
      { key: 'a', type: 'system', changes: { message: 'Retained' } },
    ]);
    ref.current!.setRefreshing(true);
    const replacement = makeHost();
    act(() => mockBindHost(replacement));
    expect(lastSnapshot(replacement).rows[0]).toMatchObject({
      message: 'Retained',
    });
    expect(replacement.setRefreshing).toHaveBeenCalledWith(true);
    await act(async () => renderer.unmount());
    const late = makeHost();
    act(() => mockBindHost(late));
    expect(late.applySnapshot).not.toHaveBeenCalled();
    expect(late.setRefreshing).not.toHaveBeenCalled();
  });

  it('a newer full imperative snapshot resets the queued refreshing override', async () => {
    const { ref } = await mount();
    ref.current!.setRefreshing(true);
    ref.current!.applySnapshot({
      ...snapshot,
      generation: 2,
      capabilities: { refreshing: false },
    });
    const host = makeHost();
    act(() => mockBindHost(host));
    expect(lastSnapshot(host).capabilities?.refreshing).toBe(false);
    expect(host.setRefreshing).not.toHaveBeenCalled();
  });
  it('discards native actions and metrics queued before JS unmount', async () => {
    const onRowAction = jest.fn();
    const onRefresh = jest.fn();
    const onScrollMetrics = jest.fn();
    const onEndReached = jest.fn();
    let renderer!: TestRenderer.ReactTestRenderer;
    await act(async () => {
      renderer = TestRenderer.create(
        <NativeList
          snapshot={snapshot}
          onRowAction={onRowAction}
          onRefresh={onRefresh}
          onScrollMetrics={onScrollMetrics}
          onEndReached={onEndReached}
        />
      );
    });
    await act(async () => renderer.unmount());
    act(() => {
      mockRowAction('{"rowKey":"a","actionKey":"open"}');
      mockRowAction('{"actionKey":"nativeList.refresh"}');
      mockScrollMetrics('{"phase":"scroll"}');
      mockEndReached('{"generation":1}');
    });
    expect(onRowAction).not.toHaveBeenCalled();
    expect(onRefresh).not.toHaveBeenCalled();
    expect(onScrollMetrics).not.toHaveBeenCalled();
    expect(onEndReached).not.toHaveBeenCalled();
  });
});
