import { FolderOpen, Trash2 } from 'lucide-react';
import type React from 'react';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from '@/components/ui/context-menu';
import type { models } from '../../../wailsjs/go/models';

interface TreeMapContextMenuProps {
  children: React.ReactNode;
  node: models.FileNode | null;
  onOpenInFinder: (node: models.FileNode) => void;
  onDelete: (node: models.FileNode) => void;
}

export const TreeMapContextMenu: React.FC<TreeMapContextMenuProps> = ({
  children,
  node,
  onOpenInFinder,
  onDelete,
}) => {
  if (!node) {
    return <>{children}</>;
  }

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>{children}</ContextMenuTrigger>
      <ContextMenuContent className="w-56">
        <ContextMenuItem onClick={() => onOpenInFinder(node)}>
          <FolderOpen className="mr-2 h-4 w-4" />
          <span>Show in Finder</span>
        </ContextMenuItem>
        <ContextMenuSeparator />
        <ContextMenuItem
          onClick={() => onDelete(node)}
          className="text-destructive focus:text-destructive"
        >
          <Trash2 className="mr-2 h-4 w-4" />
          <span>Delete</span>
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
};
