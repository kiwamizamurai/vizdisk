import type { models } from '@/wailsjs/go/models';

export const calculateNodeStats = (node: models.FileNode | null) => {
  if (!node) {
    return {
      totalFiles: 0,
      totalDirs: 0,
      totalSize: 0,
    };
  }

  let totalFiles = 0;
  let totalDirs = 0;
  const totalSize = node.size;

  const traverse = (n: models.FileNode) => {
    if (n.type === 'directory') {
      totalDirs++;
      if (n.children) {
        n.children.forEach((child) => traverse(child));
      }
    } else {
      totalFiles++;
    }
  };

  if (node.children) {
    node.children.forEach((child) => traverse(child));
  }

  return {
    totalFiles,
    totalDirs,
    totalSize,
  };
};

export const findNodeById = (
  root: models.FileNode | null,
  targetId: string
): models.FileNode | null => {
  if (!root) return null;
  if (root.id === targetId) return root;

  if (root.children) {
    for (const child of root.children) {
      const found = findNodeById(child, targetId);
      if (found) return found;
    }
  }

  return null;
};

export const buildBreadcrumbPath = (
  root: models.FileNode | null,
  targetId: string
): models.FileNode[] => {
  if (!root) return [];

  const path: models.FileNode[] = [];

  const findPath = (node: models.FileNode): boolean => {
    if (node.id === targetId) {
      path.push(node);
      return true;
    }

    if (node.children) {
      for (const child of node.children) {
        if (findPath(child)) {
          path.unshift(node);
          return true;
        }
      }
    }

    return false;
  };

  findPath(root);
  return path;
};

export const filterNodeById = (node: models.FileNode, targetId: string): models.FileNode => {
  if (node.id === targetId) {
    return node;
  }

  return {
    ...node,
    children: node.children
      ?.filter((child) => child.id !== targetId)
      .map((child) => filterNodeById(child, targetId)),
  };
};
