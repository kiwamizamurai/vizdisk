import { type MouseEvent, useCallback, useState } from 'react';
import type { models } from '../../wailsjs/go/models';
import type { TreeMapData } from './useTreeMapData';

export const useTreeMapInteraction = () => {
  const [tooltip, setTooltip] = useState<{
    visible: boolean;
    x: number;
    y: number;
    data?: TreeMapData;
  }>({ visible: false, x: 0, y: 0 });

  const [contextMenuNode, setContextMenuNode] = useState<models.FileNode | null>(null);

  const handleMouseEnter = useCallback((data: TreeMapData, event: MouseEvent) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const container = event.currentTarget.closest('.recharts-responsive-container');

    if (container) {
      const containerRect = container.getBoundingClientRect();
      setTooltip({
        visible: true,
        x: rect.left + rect.width / 2 - containerRect.left,
        y: rect.top - containerRect.top,
        data,
      });
    }
  }, []);

  const handleMouseLeave = useCallback(() => {
    setTooltip({ visible: false, x: 0, y: 0 });
  }, []);

  const handleContextMenu = useCallback((node: models.FileNode) => {
    setContextMenuNode(node);
  }, []);

  return {
    tooltip,
    contextMenuNode,
    setContextMenuNode,
    handleMouseEnter,
    handleMouseLeave,
    handleContextMenu,
  };
};
