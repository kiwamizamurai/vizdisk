import type React from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { formatFileSize } from '@/utils/formatters';
import type { models } from '../../../wailsjs/go/models';

interface DeleteConfirmDialogProps {
  open: boolean;
  node: models.FileNode | null;
  onConfirm: () => void;
  onCancel: () => void;
}

export const DeleteConfirmDialog: React.FC<DeleteConfirmDialogProps> = ({
  open,
  node,
  onConfirm,
  onCancel,
}) => {
  if (!node) return null;

  return (
    <AlertDialog open={open} onOpenChange={(open) => !open && onCancel()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            Delete {node.type === 'directory' ? 'Directory' : 'File'}
          </AlertDialogTitle>
          <AlertDialogDescription className="space-y-2">
            <p>Are you sure you want to delete:</p>
            <p className="font-mono text-sm bg-muted p-2 rounded">{node.path}</p>
            <p className="text-sm">
              Size: <span className="font-semibold">{formatFileSize(node.size)}</span>
            </p>
            {node.type === 'directory' && (
              <p className="text-destructive text-sm font-medium">
                ⚠️ This will permanently delete the directory and all its contents.
              </p>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onCancel}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
