import { renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import type { models } from '../../wailsjs/go/models';
import { useTreeMapData } from './useTreeMapData';

describe('useTreeMapData', () => {
  const createMockNode = (
    name: string,
    size: number,
    isDir: boolean,
    children?: models.FileNode[]
  ): models.FileNode =>
    ({
      id: name,
      name,
      path: `/path/${name}`,
      size,
      type: isDir ? 'directory' : 'file',
      lastModified: '2024-01-01T00:00:00Z',
      isHidden: false,
      children,
    }) as models.FileNode;

  it('should return empty array for null node', () => {
    const { result } = renderHook(() => useTreeMapData(null));

    expect(result.current.data).toEqual([]);
    expect(result.current.maxSize).toBe(0);
    expect(result.current.totalSize).toBe(0);
  });

  it('should return empty array for node without children', () => {
    const node = createMockNode('root', 1000, true);
    const { result } = renderHook(() => useTreeMapData(node));

    expect(result.current.data).toEqual([]);
    expect(result.current.maxSize).toBe(0);
    expect(result.current.totalSize).toBe(1000);
  });

  it('should transform and sort children by size', () => {
    const node = createMockNode('root', 5000, true, [
      createMockNode('small.txt', 100, false),
      createMockNode('large.txt', 3000, false),
      createMockNode('medium.txt', 500, false),
    ]);

    const { result } = renderHook(() => useTreeMapData(node));

    expect(result.current.data).toHaveLength(3);
    expect(result.current.data[0].name).toBe('large.txt');
    expect(result.current.data[1].name).toBe('medium.txt');
    expect(result.current.data[2].name).toBe('small.txt');
    expect(result.current.maxSize).toBe(3000);
    expect(result.current.totalSize).toBe(5000);
  });

  it('should filter out zero-size children', () => {
    const node = createMockNode('root', 1000, true, [
      createMockNode('empty.txt', 0, false),
      createMockNode('file.txt', 500, false),
    ]);

    const { result } = renderHook(() => useTreeMapData(node));

    expect(result.current.data).toHaveLength(1);
    expect(result.current.data[0].name).toBe('file.txt');
  });

  it('should limit items to maxItems parameter', () => {
    const children = Array.from({ length: 30 }, (_, i) =>
      createMockNode(`file${i}.txt`, 100 + i, false)
    );
    const node = createMockNode('root', 10000, true, children);

    const { result } = renderHook(() => useTreeMapData(node, 10));

    expect(result.current.data).toHaveLength(10);
  });

  it('should preserve original node reference', () => {
    const childNode = createMockNode('file.txt', 1000, false);
    const node = createMockNode('root', 1000, true, [childNode]);

    const { result } = renderHook(() => useTreeMapData(node));

    expect(result.current.data[0].originalNode).toBe(childNode);
  });
});
