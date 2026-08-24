"use client";

import { Button } from "@delegolabs/ui";
import type { UndoAction } from "../../hooks/useApprovalHotkeys";

export interface UndoSnackbarProps {
  action: UndoAction | null;
  onDismiss: () => void;
}

/** Transient "Undo" bar shown for 5s after a hotkey approve/reject action. */
export function UndoSnackbar({ action, onDismiss }: UndoSnackbarProps) {
  if (!action) return null;

  return (
    <div className="undo-snackbar" role="status">
      <span>{action.message}</span>
      <Button
        variant="ghost"
        onClick={() => {
          action.undo();
          onDismiss();
        }}
      >
        Undo
      </Button>
    </div>
  );
}
