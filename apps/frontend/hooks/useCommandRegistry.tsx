"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { ReactNode } from "react";

export type CommandGroup = "navigate" | "actions";

export interface Command {
  id: string;
  label: string;
  subtitle?: string;
  icon?: string;
  /** Extra terms matched against the search query alongside the label */
  keywords?: string[];
  group: CommandGroup;
  perform: () => void | Promise<void>;
}

interface CommandRegistryContextValue {
  commands: Command[];
  /** Adds (or replaces, by id) a command. Returns a function to remove it. */
  register: (command: Command) => () => void;
}

const CommandRegistryContext = createContext<CommandRegistryContextValue | null>(
  null
);

/**
 * Holds the set of commands the command palette can show. Features register
 * their own commands incrementally via `useRegisterCommands` — nothing needs
 * to be centrally declared here.
 */
export function CommandRegistryProvider({ children }: { children: ReactNode }) {
  const [commandsById, setCommandsById] = useState<Map<string, Command>>(
    () => new Map()
  );

  const register = useCallback((command: Command) => {
    setCommandsById((prev) => {
      const next = new Map(prev);
      next.set(command.id, command);
      return next;
    });
    return () => {
      setCommandsById((prev) => {
        if (!prev.has(command.id)) return prev;
        const next = new Map(prev);
        next.delete(command.id);
        return next;
      });
    };
  }, []);

  const value = useMemo<CommandRegistryContextValue>(
    () => ({ commands: [...commandsById.values()], register }),
    [commandsById, register]
  );

  return (
    <CommandRegistryContext.Provider value={value}>
      {children}
    </CommandRegistryContext.Provider>
  );
}

/** Read the current set of registered commands. */
export function useCommandRegistry(): Command[] {
  const ctx = useContext(CommandRegistryContext);
  if (!ctx) {
    throw new Error(
      "useCommandRegistry must be used within a CommandRegistryProvider"
    );
  }
  return ctx.commands;
}

/**
 * Registers `commands` with the palette for as long as the calling component
 * is mounted. Pass a stable (e.g. useMemo'd) array — a new identity re-runs
 * registration.
 */
export function useRegisterCommands(commands: Command[]): void {
  const ctx = useContext(CommandRegistryContext);
  if (!ctx) {
    throw new Error(
      "useRegisterCommands must be used within a CommandRegistryProvider"
    );
  }
  const { register } = ctx;

  useEffect(() => {
    const unregisters = commands.map((command) => register(command));
    return () => unregisters.forEach((unregister) => unregister());
  }, [commands, register]);
}
