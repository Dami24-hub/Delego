"use client";

export interface HotkeyCheatSheetProps {
  onClose: () => void;
}

const SHORTCUTS: Array<{ keys: string; description: string }> = [
  { keys: "j / k", description: "Move focus down / up the queue" },
  { keys: "a", description: "Approve the focused order" },
  { keys: "r", description: "Reject the focused order" },
  { keys: "Enter", description: "Open the focused order's details" },
  { keys: "?", description: "Toggle this cheat sheet" },
  { keys: "Esc", description: "Close this cheat sheet" },
];

/** Discoverable keyboard-shortcut reference, toggled by pressing "?". */
export function HotkeyCheatSheet({ onClose }: HotkeyCheatSheetProps) {
  return (
    <div className="hotkey-cheatsheet-overlay" onClick={onClose}>
      <div
        className="hotkey-cheatsheet"
        role="dialog"
        aria-modal="true"
        aria-label="Keyboard shortcuts"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="hotkey-cheatsheet-header">
          <h2>Keyboard shortcuts</h2>
          <button type="button" aria-label="Close" onClick={onClose}>
            ×
          </button>
        </div>
        <dl className="hotkey-cheatsheet-list">
          {SHORTCUTS.map((shortcut) => (
            <div key={shortcut.keys} className="hotkey-cheatsheet-row">
              <dt>
                <kbd>{shortcut.keys}</kbd>
              </dt>
              <dd>{shortcut.description}</dd>
            </div>
          ))}
        </dl>
      </div>
    </div>
  );
}
