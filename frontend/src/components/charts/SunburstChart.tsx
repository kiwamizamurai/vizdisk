import type React from 'react';
import { useCallback, useState } from 'react';
import { formatFileSize } from '@/utils/formatters';
import { DeletePath, OpenInFinder } from '../../../wailsjs/go/main/App';
import type { models } from '../../../wailsjs/go/models';
import { DeleteConfirmDialog } from './DeleteConfirmDialog';
import { TreeMapContextMenu } from './TreeMapContextMenu';
import { TreeMapTooltip } from './TreeMapTooltip';

interface SunburstChartProps {
  data: models.FileNode;
  onNodeClick?: (node: models.FileNode) => void;
  onNodeDoubleClick?: (node: models.FileNode) => void;
  onNodeDeleted?: () => void;
}

interface SunburstNode {
  node: models.FileNode;
  startAngle: number;
  endAngle: number;
  innerRadius: number;
  outerRadius: number;
  level: number;
}

const SunburstChart: React.FC<SunburstChartProps> = ({
  data,
  onNodeClick,
  onNodeDoubleClick,
  onNodeDeleted,
}) => {
  const [tooltip, setTooltip] = useState<{
    visible: boolean;
    x: number;
    y: number;
    data: { name: string; size: number; originalNode: models.FileNode } | null;
  }>({
    visible: false,
    x: 0,
    y: 0,
    data: null,
  });

  const [contextMenuNode, setContextMenuNode] = useState<models.FileNode | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedNode, setSelectedNode] = useState<models.FileNode | null>(null);

  const centerX = 300;
  const centerY = 300;
  const maxRadius = 280;
  const minRadius = 50;

  const getColor = useCallback((size: number, max: number, level: number): string => {
    const ratio = size / max;
    const baseHue = 220;
    const hue = (baseHue + level * 30) % 360;

    if (ratio > 0.7) return `hsl(${hue} 71.4% 20%)`;
    if (ratio > 0.5) return `hsl(${hue} 60% 35%)`;
    if (ratio > 0.3) return `hsl(${hue} 50% 50%)`;
    if (ratio > 0.15) return `hsl(${hue} 40% 65%)`;
    return `hsl(${hue} 30% 80%)`;
  }, []);

  const calculateSunburstNodes = useCallback(
    (
      node: models.FileNode,
      startAngle: number,
      endAngle: number,
      innerRadius: number,
      outerRadius: number,
      level: number,
      totalSize: number,
      maxLevel: number = 4
    ): SunburstNode[] => {
      if (level > maxLevel || !node.children || node.children.length === 0) {
        return [
          {
            node,
            startAngle,
            endAngle,
            innerRadius,
            outerRadius,
            level,
          },
        ];
      }

      const nodes: SunburstNode[] = [
        {
          node,
          startAngle,
          endAngle,
          innerRadius,
          outerRadius,
          level,
        },
      ];

      const angleRange = endAngle - startAngle;
      const radiusStep = (maxRadius - minRadius) / maxLevel;
      const childInnerRadius = outerRadius;
      const childOuterRadius = Math.min(maxRadius, outerRadius + radiusStep);

      let currentAngle = startAngle;

      // Sort children by size for better visualization
      const sortedChildren = [...node.children].sort((a, b) => b.size - a.size);

      for (const child of sortedChildren) {
        if (child.size === 0) continue;

        const childAngleRange = (child.size / node.size) * angleRange;
        const childEndAngle = currentAngle + childAngleRange;

        nodes.push(
          ...calculateSunburstNodes(
            child,
            currentAngle,
            childEndAngle,
            childInnerRadius,
            childOuterRadius,
            level + 1,
            totalSize,
            maxLevel
          )
        );

        currentAngle = childEndAngle;
      }

      return nodes;
    },
    []
  );

  const createArcPath = useCallback(
    (startAngle: number, endAngle: number, innerRadius: number, outerRadius: number): string => {
      const startAngleRad = (startAngle - 90) * (Math.PI / 180);
      const endAngleRad = (endAngle - 90) * (Math.PI / 180);

      const x1 = centerX + outerRadius * Math.cos(startAngleRad);
      const y1 = centerY + outerRadius * Math.sin(startAngleRad);
      const x2 = centerX + outerRadius * Math.cos(endAngleRad);
      const y2 = centerY + outerRadius * Math.sin(endAngleRad);

      const x3 = centerX + innerRadius * Math.cos(endAngleRad);
      const y3 = centerY + innerRadius * Math.sin(endAngleRad);
      const x4 = centerX + innerRadius * Math.cos(startAngleRad);
      const y4 = centerY + innerRadius * Math.sin(startAngleRad);

      const largeArcFlag = endAngle - startAngle <= 180 ? '0' : '1';

      return [
        `M ${x1} ${y1}`,
        `A ${outerRadius} ${outerRadius} 0 ${largeArcFlag} 1 ${x2} ${y2}`,
        `L ${x3} ${y3}`,
        `A ${innerRadius} ${innerRadius} 0 ${largeArcFlag} 0 ${x4} ${y4}`,
        'Z',
      ].join(' ');
    },
    []
  );

  const handleMouseEnter = useCallback((sunburstNode: SunburstNode, e: React.MouseEvent) => {
    setTooltip({
      visible: true,
      x: e.clientX,
      y: e.clientY,
      data: {
        name: sunburstNode.node.name,
        size: sunburstNode.node.size,
        originalNode: sunburstNode.node,
      },
    });
  }, []);

  const handleMouseLeave = useCallback(() => {
    setTooltip((prev) => ({ ...prev, visible: false }));
  }, []);

  const handleContextMenu = useCallback((node: models.FileNode) => {
    setContextMenuNode(node);
  }, []);

  const handleOpenInFinder = useCallback(async (node: models.FileNode) => {
    try {
      await OpenInFinder(node.path);
    } catch (error) {
      console.error('Failed to open in finder:', error);
    }
  }, []);

  const handleDeleteClick = useCallback((node: models.FileNode) => {
    setSelectedNode(node);
    setDeleteDialogOpen(true);
  }, []);

  const handleDeleteConfirm = useCallback(async () => {
    if (!selectedNode) return;

    try {
      await DeletePath(selectedNode.path);
      onNodeDeleted?.();
    } catch (error) {
      console.error('Failed to delete path:', error);
    } finally {
      setDeleteDialogOpen(false);
      setSelectedNode(null);
    }
  }, [selectedNode, onNodeDeleted]);

  const handleDeleteCancel = useCallback(() => {
    setDeleteDialogOpen(false);
    setSelectedNode(null);
  }, []);

  if (!data || data.size === 0) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground">
        <p>No data to display</p>
      </div>
    );
  }

  const sunburstNodes = calculateSunburstNodes(
    data,
    0,
    360,
    minRadius,
    minRadius + (maxRadius - minRadius) / 4,
    0,
    data.size
  );
  const maxSize = data.size;

  return (
    <TreeMapContextMenu
      node={contextMenuNode}
      onOpenInFinder={handleOpenInFinder}
      onDelete={handleDeleteClick}
    >
      <div className="h-full w-full relative flex items-center justify-center">
        <svg
          width={600}
          height={600}
          className="overflow-visible"
          role="img"
          aria-label="Sunburst chart showing disk usage"
        >
          <title>Disk usage sunburst chart</title>
          {sunburstNodes.map((sunburstNode, index) => {
            const { node, startAngle, endAngle, innerRadius, outerRadius, level } = sunburstNode;

            // Skip very small segments
            if (endAngle - startAngle < 1) return null;

            const arcPath = createArcPath(startAngle, endAngle, innerRadius, outerRadius);
            const color = getColor(node.size, maxSize, level);

            // Calculate text position and rotation
            const midAngle = (startAngle + endAngle) / 2;
            const midAngleRad = (midAngle - 90) * (Math.PI / 180);
            const textRadius = (innerRadius + outerRadius) / 2;
            const textX = centerX + textRadius * Math.cos(midAngleRad);
            const textY = centerY + textRadius * Math.sin(midAngleRad);

            const shouldShowText = endAngle - startAngle > 15 && outerRadius - innerRadius > 20;
            const fontSize = Math.min(
              12,
              (endAngle - startAngle) / 5,
              (outerRadius - innerRadius) / 3
            );

            return (
              <g key={`${node.path}-${index}`}>
                <path
                  d={arcPath}
                  fill={color}
                  stroke="hsl(220 13% 91%)"
                  strokeWidth={1}
                  className="cursor-pointer transition-all duration-300 hover:brightness-110"
                  role="button"
                  tabIndex={0}
                  aria-label={`${node.name} - ${formatFileSize(node.size)}`}
                  onClick={(e) => {
                    e.preventDefault();
                    onNodeClick?.(node);
                  }}
                  onDoubleClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onNodeDoubleClick?.(node);
                  }}
                  onContextMenu={(_e) => {
                    handleContextMenu(node);
                  }}
                  onMouseEnter={(e) => handleMouseEnter(sunburstNode, e)}
                  onMouseLeave={handleMouseLeave}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      onNodeClick?.(node);
                    }
                  }}
                />

                {shouldShowText && (
                  <text
                    x={textX}
                    y={textY}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fill="#ffffff"
                    fontSize={fontSize}
                    fontWeight="600"
                    className="pointer-events-none select-none"
                    style={{
                      textShadow: '2px 2px 4px rgba(0,0,0,0.9)',
                      fontFamily: 'system-ui, -apple-system, sans-serif',
                    }}
                    transform={`rotate(${midAngle > 90 && midAngle < 270 ? midAngle + 180 : midAngle}, ${textX}, ${textY})`}
                  >
                    {node.name.length > 8 ? `${node.name.substring(0, 8)}...` : node.name}
                  </text>
                )}
              </g>
            );
          })}

          {/* Center label */}
          <circle
            cx={centerX}
            cy={centerY}
            r={minRadius}
            fill="hsl(220 13% 96%)"
            stroke="hsl(220 13% 91%)"
            strokeWidth={2}
          />
          <text
            x={centerX}
            y={centerY - 5}
            textAnchor="middle"
            dominantBaseline="middle"
            fill="hsl(222.2 84% 4.9%)"
            fontSize={14}
            fontWeight="600"
            className="pointer-events-none select-none"
            style={{
              fontFamily: 'system-ui, -apple-system, sans-serif',
            }}
          >
            {data.name}
          </text>
          <text
            x={centerX}
            y={centerY + 10}
            textAnchor="middle"
            dominantBaseline="middle"
            fill="hsl(215.4 16.3% 46.9%)"
            fontSize={10}
            fontWeight="500"
            className="pointer-events-none select-none"
            style={{
              fontFamily: 'system-ui, -apple-system, sans-serif',
            }}
          >
            {formatFileSize(data.size)}
          </text>
        </svg>

        <TreeMapTooltip
          visible={tooltip.visible}
          x={tooltip.x}
          y={tooltip.y}
          data={tooltip.data}
          parentSize={data.size}
        />

        <DeleteConfirmDialog
          open={deleteDialogOpen}
          node={selectedNode}
          onConfirm={handleDeleteConfirm}
          onCancel={handleDeleteCancel}
        />
      </div>
    </TreeMapContextMenu>
  );
};

export default SunburstChart;
