import { describe, expect, it } from 'vitest';
import type { models } from '@/wailsjs/go/models';
import {
  buildBreadcrumbPath,
  calculateNodeStats,
  filterNodeById,
  findNodeById,
} from './fileOperations';

describe('fileOperations', () => {
  const createMockNode = (
    id: string,
    name: string,
    size: number,
    isDir: boolean,
    children?: models.FileNode[]
  ): models.FileNode => ({
    id,
    name,
    path: `/path/${name}`,
    size,
    type: isDir ? 'directory' : 'file',
    lastModified: '2024-01-01T00:00:00Z',
    children,
  });

  describe('calculateNodeStats', () => {
    it('should handle null node', () => {
      const stats = calculateNodeStats(null);
      expect(stats).toEqual({
        totalFiles: 0,
        totalDirs: 0,
        totalSize: 0,
      });
    });

    it('should calculate stats for a single file', () => {
      const node = createMockNode('1', 'file.txt', 1024, false);
      const stats = calculateNodeStats(node);
      expect(stats).toEqual({
        totalFiles: 0,
        totalDirs: 0,
        totalSize: 1024,
      });
    });

    it('should calculate stats for directory with children', () => {
      const node = createMockNode('1', 'root', 0, true, [
        createMockNode('2', 'file1.txt', 1024, false),
        createMockNode('3', 'file2.txt', 2048, false),
        createMockNode('4', 'subdir', 0, true, [createMockNode('5', 'file3.txt', 512, false)]),
      ]);

      const stats = calculateNodeStats(node);
      expect(stats).toEqual({
        totalFiles: 3,
        totalDirs: 1,
        totalSize: 0,
      });
    });
  });

  describe('findNodeById', () => {
    it('should return null for null root', () => {
      expect(findNodeById(null, '1')).toBeNull();
    });

    it('should find root node', () => {
      const root = createMockNode('1', 'root', 0, true);
      expect(findNodeById(root, '1')).toBe(root);
    });

    it('should find nested node', () => {
      const targetNode = createMockNode('5', 'target.txt', 512, false);
      const root = createMockNode('1', 'root', 0, true, [
        createMockNode('2', 'file1.txt', 1024, false),
        createMockNode('3', 'subdir', 0, true, [
          createMockNode('4', 'file2.txt', 2048, false),
          targetNode,
        ]),
      ]);

      expect(findNodeById(root, '5')).toBe(targetNode);
    });

    it('should return null for non-existent ID', () => {
      const root = createMockNode('1', 'root', 0, true);
      expect(findNodeById(root, '999')).toBeNull();
    });
  });

  describe('buildBreadcrumbPath', () => {
    it('should return empty array for null root', () => {
      expect(buildBreadcrumbPath(null, '1')).toEqual([]);
    });

    it('should build path to root', () => {
      const root = createMockNode('1', 'root', 0, true);
      const path = buildBreadcrumbPath(root, '1');
      expect(path).toHaveLength(1);
      expect(path[0]).toBe(root);
    });

    it('should build path to nested node', () => {
      const root = createMockNode('1', 'root', 0, true, [
        createMockNode('2', 'subdir1', 0, true, [
          createMockNode('3', 'subdir2', 0, true, [createMockNode('4', 'file.txt', 1024, false)]),
        ]),
      ]);

      const path = buildBreadcrumbPath(root, '4');
      expect(path).toHaveLength(4);
      expect(path.map((n) => n.id)).toEqual(['1', '2', '3', '4']);
    });
  });

  describe('filterNodeById', () => {
    it('should filter out direct child', () => {
      const root = createMockNode('1', 'root', 0, true, [
        createMockNode('2', 'keep.txt', 1024, false),
        createMockNode('3', 'remove.txt', 2048, false),
        createMockNode('4', 'also_keep.txt', 512, false),
      ]);

      const filtered = filterNodeById(root, '3');
      expect(filtered.children).toHaveLength(2);
      expect(filtered.children?.map((c) => c.id)).toEqual(['2', '4']);
    });

    it('should filter out nested node', () => {
      const root = createMockNode('1', 'root', 0, true, [
        createMockNode('2', 'subdir', 0, true, [
          createMockNode('3', 'keep.txt', 1024, false),
          createMockNode('4', 'remove.txt', 2048, false),
        ]),
      ]);

      const filtered = filterNodeById(root, '4');
      expect(filtered.children?.[0].children).toHaveLength(1);
      expect(filtered.children?.[0].children?.[0].id).toBe('3');
    });
  });
});
