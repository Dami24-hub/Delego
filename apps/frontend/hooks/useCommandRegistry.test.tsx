import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import {
  CommandRegistryProvider,
  useCommandRegistry,
  useRegisterCommands,
  type Command,
} from "./useCommandRegistry";

const command: Command = {
  id: "test:one",
  label: "Test command",
  group: "actions",
  perform: () => {},
};

function Registrar({ commands }: { commands: Command[] }) {
  useRegisterCommands(commands);
  return null;
}

function Reader() {
  const commands = useCommandRegistry();
  return <ul>{commands.map((c) => <li key={c.id}>{c.label}</li>)}</ul>;
}

describe("useCommandRegistry", () => {
  it("makes a registered command visible to readers", () => {
    render(
      <CommandRegistryProvider>
        <Registrar commands={[command]} />
        <Reader />
      </CommandRegistryProvider>
    );
    expect(screen.getByText("Test command")).toBeInTheDocument();
  });

  it("removes the command when the registering component unmounts", () => {
    function Wrapper({ mounted }: { mounted: boolean }) {
      return (
        <CommandRegistryProvider>
          {mounted && <Registrar commands={[command]} />}
          <Reader />
        </CommandRegistryProvider>
      );
    }

    const { rerender } = render(<Wrapper mounted />);
    expect(screen.getByText("Test command")).toBeInTheDocument();

    rerender(<Wrapper mounted={false} />);
    expect(screen.queryByText("Test command")).not.toBeInTheDocument();
  });

  it("throws when used outside a CommandRegistryProvider", () => {
    // Suppress the expected React error boundary console noise.
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    expect(() => render(<Reader />)).toThrow(
      "useCommandRegistry must be used within a CommandRegistryProvider"
    );
    spy.mockRestore();
  });
});
