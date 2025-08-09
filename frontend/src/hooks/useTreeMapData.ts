import { useMemo } from 'react';
import type { models } from '../../wailsjs/go/models';

export interface TreeMapData {
  name: string;
  size: number;
  originalNode: models.FileNode;
}

export const useTreeMapData = (node: models.FileNode | null, maxItems = 20) => {
  const treeMapData = useMemo(() => {
    if (!node || !node.children || node.children.length === 0) {
      return [];
    }

    return node.children
      .filter((child) => child.size > 0)
      .sort((a, b) => b.size - a.size)
      .slice(0, maxItems)
      .map((child) => ({
        name: child.name,
        size: child.size,
        originalNode: child,
      }));
  }, [node, maxItems]);

  const maxSize = useMemo(() => {
    if (treeMapData.length === 0) return 0;
    return Math.max(...treeMapData.map((d) => d.size));
  }, [treeMapData]);

  const totalSize = useMemo(() => {
    return node?.size || 0;
  }, [node]);

  return {
    data: treeMapData,
    maxSize,
    totalSize,
  };
};
