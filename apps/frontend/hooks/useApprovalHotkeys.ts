"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export interface UndoAction {
  message: string;
  undo: () => void | Promise<unknown>;
}

export interface UseApprovalHotkeysOptions {
  /** IDs of the rows currently rendered, in display order — drives j/k roving focus. */
  itemIds: string[];
  onApprove: (id: string) => void | Promise<unknown>;
  onReject: (id: string) => void | Promise<unknown>;
  onOpenDrawer: (id: string) => void;
  /** Suspend all hotkeys, e.g. while a modal that manages its own keys is open. */
  disabled?: boolean;
  /** How long the undo option stays available after an action, in ms (default 5000). */
  undoWindowMs?: number;
}

export interface UseApprovalHotkeysResult {
  focusedId: string | null;
  setFocusedId: (id: string | null) => void;
  showCheatSheet: boolean;
  setShowCheatSheet: (show: boolean) => void;
  undoAction: UndoAction | null;
  dismissUndo: () => void;
}

function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName;
  return tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || target.isContentEditable;
}

/**
 * Keyboard-driven triage for the approvals queue: j/k roving navigation, a/r to
 * approve/reject the focused row, Enter to open its drawer, ? for a cheat
 * sheet, and a 5s undo window after approve/reject (reversed via the
 * complementary API call, since there's no dedicated "unapprove" endpoint).
 */
export function useApprovalHotkeys({
  itemIds,
  onApprove,
  onReject,
  onOpenDrawer,
  disabled = false,
  undoWindowMs = 5000,
}: UseApprovalHotkeysOptions): UseApprovalHotkeysResult {
  const [focusedId, setFocusedId] = useState<string | null>(itemIds[0] ?? null);
  const [showCheatSheet, setShowCheatSheet] = useState(false);
  const [undoAction, setUndoActionState] = useState<UndoAction | null>(null);
  const undoTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  // Keep the focused row valid as the queue changes (e.g. an item leaves after being acted on).
  useEffect(() => {
    setFocusedId((prev) => {
      if (itemIds.length === 0) return null;
      return prev && itemIds.includes(prev) ? prev : itemIds[0];
    });
  }, [itemIds]);

  const setUndoAction = useCallback(
    (action: UndoAction | null) => {
      if (undoTimerRef.current) clearTimeout(undoTimerRef.current);
      setUndoActionState(action);
      if (action) {
        undoTimerRef.current = setTimeout(() => setUndoActionState(null), undoWindowMs);
      }
    },
    [undoWindowMs]
  );

  const dismissUndo = useCallback(() => setUndoAction(null), [setUndoAction]);

  useEffect(() => {
    return () => {
      if (undoTimerRef.current) clearTimeout(undoTimerRef.current);
    };
  }, []);

  useEffect(() => {
    if (disabled) return;

    function onKeyDown(e: KeyboardEvent) {
      if (isTypingTarget(e.target)) return;
      // Never shadow browser/OS shortcuts (Cmd/Ctrl combos, Alt-menus).
      if (e.metaKey || e.ctrlKey || e.altKey) return;

      if (e.key === "?") {
        e.preventDefault();
        setShowCheatSheet((v) => !v);
        return;
      }
      if (e.key === "Escape") {
        setShowCheatSheet(false);
        return;
      }

      if (itemIds.length === 0) return;

      switch (e.key) {
        case "j": {
          e.preventDefault();
          setFocusedId((prev) => {
            const idx = prev ? itemIds.indexOf(prev) : -1;
            return itemIds[Math.min(itemIds.length - 1, idx + 1)];
          });
          return;
        }
        case "k": {
          e.preventDefault();
          setFocusedId((prev) => {
            const idx = prev ? itemIds.indexOf(prev) : 0;
            return itemIds[Math.max(0, idx - 1)];
          });
          return;
        }
        case "Enter": {
          if (focusedId) {
            e.preventDefault();
            onOpenDrawer(focusedId);
          }
          return;
        }
        case "a": {
          if (focusedId) {
            e.preventDefault();
            const id = focusedId;
            onApprove(id);
            setUndoAction({ message: `Approved order ${id}`, undo: () => onReject(id) });
          }
          return;
        }
        case "r": {
          if (focusedId) {
            e.preventDefault();
            const id = focusedId;
            onReject(id);
            setUndoAction({ message: `Rejected order ${id}`, undo: () => onApprove(id) });
          }
          return;
        }
        default:
          return;
      }
    }

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [itemIds, focusedId, onApprove, onReject, onOpenDrawer, disabled, setUndoAction]);

  return { focusedId, setFocusedId, showCheatSheet, setShowCheatSheet, undoAction, dismissUndo };
}
