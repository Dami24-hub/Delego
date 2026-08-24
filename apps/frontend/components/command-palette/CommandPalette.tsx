"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { KeyboardEvent } from "react";
import {
  useCommandRegistry,
  type Command,
  type CommandGroup,
} from "../../hooks/useCommandRegistry";
import { bestFuzzyScore } from "../../lib/fuzzyMatch";

const RECENT_STORAGE_KEY = "delego_recent_commands";
const MAX_RECENT = 5;

function loadRecentIds(): string[] {
  try {
    const raw = window.localStorage.getItem(RECENT_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((id): id is string => typeof id === "string");
  } catch {
    return [];
  }
}

function saveRecentIds(ids: string[]): void {
  try {
    window.localStorage.setItem(RECENT_STORAGE_KEY, JSON.stringify(ids));
  } catch {
    // Ignore quota / availability errors.
  }
}

export interface CommandPaletteProps {
  onClose: () => void;
}

interface ResultGroup {
  label: string;
  items: Command[];
}

const GROUP_LABEL: Record<CommandGroup, string> = {
  navigate: "Navigate",
  actions: "Quick actions",
};

/**
 * ⌘K / Ctrl+K command palette: fuzzy search over registered commands (routes
 * + quick actions), with a "Recent" group backed by localStorage when the
 * query is empty. Code-split via next/dynamic in CommandPaletteProvider so it
 * never ships in the initial bundle.
 */
export function CommandPalette({ onClose }: CommandPaletteProps) {
  const commands = useCommandRegistry();
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const [recentIds, setRecentIds] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setRecentIds(loadRecentIds());
    inputRef.current?.focus();
  }, []);

  const groups = useMemo<ResultGroup[]>(() => {
    const trimmed = query.trim();

    if (!trimmed) {
      const recentCommands = recentIds
        .map((id) => commands.find((c) => c.id === id))
        .filter((c): c is Command => Boolean(c));
      const recentIdSet = new Set(recentCommands.map((c) => c.id));

      // Avoid listing the same command twice (once under Recent, once under
      // its own group) — duplicate ids would also break aria-activedescendant.
      const byGroup: ResultGroup[] = (
        ["navigate", "actions"] as CommandGroup[]
      )
        .map((group) => ({
          label: GROUP_LABEL[group],
          items: commands.filter(
            (c) => c.group === group && !recentIdSet.has(c.id)
          ),
        }))
        .filter((g) => g.items.length > 0);

      return recentCommands.length > 0
        ? [{ label: "Recent", items: recentCommands }, ...byGroup]
        : byGroup;
    }

    const scored = commands
      .map((command) => ({
        command,
        score: bestFuzzyScore(trimmed, [
          command.label,
          command.subtitle,
          ...(command.keywords ?? []),
        ]),
      }))
      .filter(
        (entry): entry is { command: Command; score: number } =>
          entry.score !== null
      )
      .sort((a, b) => b.score - a.score)
      .map((entry) => entry.command);

    return scored.length > 0 ? [{ label: "Results", items: scored }] : [];
  }, [query, commands, recentIds]);

  const flatItems = useMemo(() => groups.flatMap((g) => g.items), [groups]);

  useEffect(() => {
    setActiveIndex(0);
  }, [query]);

  function runCommand(command: Command) {
    const nextRecent = [
      command.id,
      ...recentIds.filter((id) => id !== command.id),
    ].slice(0, MAX_RECENT);
    saveRecentIds(nextRecent);
    onClose();
    void command.perform();
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    switch (event.key) {
      case "Escape":
        event.preventDefault();
        onClose();
        break;
      case "ArrowDown":
        event.preventDefault();
        setActiveIndex((i) => Math.min(i + 1, flatItems.length - 1));
        break;
      case "ArrowUp":
        event.preventDefault();
        setActiveIndex((i) => Math.max(i - 1, 0));
        break;
      case "Enter": {
        event.preventDefault();
        const command = flatItems[activeIndex];
        if (command) runCommand(command);
        break;
      }
      case "Tab":
        // The search input is the only focusable element in the dialog —
        // keep focus trapped there instead of tabbing to the page behind it.
        event.preventDefault();
        break;
      default:
        break;
    }
  }

  const activeCommand = flatItems[activeIndex];

  return (
    <div className="command-palette-overlay" onClick={onClose}>
      <div
        className="command-palette"
        role="dialog"
        aria-modal="true"
        aria-label="Command palette"
        onClick={(e) => e.stopPropagation()}
      >
        <input
          ref={inputRef}
          type="text"
          role="combobox"
          aria-expanded="true"
          aria-controls="command-palette-listbox"
          aria-autocomplete="list"
          aria-activedescendant={
            activeCommand ? `command-item-${activeCommand.id}` : undefined
          }
          className="command-palette-input"
          placeholder="Search routes and actions..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
        />

        <div
          id="command-palette-listbox"
          role="listbox"
          aria-label="Commands"
          className="command-palette-results"
        >
          {groups.length === 0 && (
            <p className="command-palette-empty">No matching commands</p>
          )}
          {groups.map((group) => (
            <div className="command-palette-group" key={group.label}>
              <p className="command-palette-group-label">{group.label}</p>
              {group.items.map((command) => {
                const isActive = command.id === activeCommand?.id;
                return (
                  <div
                    key={command.id}
                    id={`command-item-${command.id}`}
                    role="option"
                    aria-selected={isActive}
                    className={`command-palette-item${isActive ? " active" : ""}`}
                    onMouseEnter={() =>
                      setActiveIndex(flatItems.indexOf(command))
                    }
                    onClick={() => runCommand(command)}
                  >
                    {command.icon && (
                      <span
                        className="command-palette-item-icon"
                        aria-hidden="true"
                      >
                        {command.icon}
                      </span>
                    )}
                    <span className="command-palette-item-text">
                      <span className="command-palette-item-label">
                        {command.label}
                      </span>
                      {command.subtitle && (
                        <span className="command-palette-item-subtitle">
                          {command.subtitle}
                        </span>
                      )}
                    </span>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
