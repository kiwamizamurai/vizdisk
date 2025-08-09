import { FileIcon, FolderIcon } from 'lucide-react';
import type React from 'react';
import { formatFileSize, formatPercentage } from '@/utils/formatters';
import type { models } from '../../../wailsjs/go/models';

interface TreeMapTooltipProps {
  visible: boolean;
  x: number;
  y: number;
  data?: {
    name: string;
    size: number;
    originalNode: models.FileNode;
  };
  parentSize: number;
}

export const TreeMapTooltip: React.FC<TreeMapTooltipProps> = ({
  visible,
  x,
  y,
  data,
  parentSize,
}) => {
  if (!visible || !data) return null;

  const isDirectory = data.originalNode.type === 'directory';
  const percentage = formatPercentage(data.size, parentSize);

  return (
    <div
      className="absolute z-50 pointer-events-none"
      style={{
        left: `${x}px`,
        top: `${y}px`,
        transform: 'translate(-50%, -100%) translateY(-8px)',
      }}
    >
      <div className="bg-popover text-popover-foreground border border-border rounded-md shadow-lg p-3 min-w-[200px]">
        <div className="flex items-center gap-2 mb-2">
          {isDirectory ? (
            <FolderIcon className="w-4 h-4 text-muted-foreground" />
          ) : (
            <FileIcon className="w-4 h-4 text-muted-foreground" />
          )}
          <span className="font-medium text-sm truncate max-w-[250px]" title={data.name}>
            {data.name}
          </span>
        </div>
        <div className="space-y-1 text-xs">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Size:</span>
            <span className="font-mono">{formatFileSize(data.size)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Percentage:</span>
            <span className="font-mono">{percentage}</span>
          </div>
          {data.originalNode.lastModified && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Modified:</span>
              <span className="font-mono">
                {new Date(data.originalNode.lastModified).toLocaleDateString()}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
