import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useRef, useState } from "react";
import { useFocusTrap } from "./useFocusTrap";

function TestDialog({ initialOpen = true }: { initialOpen?: boolean }) {
  const [open, setOpen] = useState(initialOpen);
  const containerRef = useRef<HTMLDivElement>(null);
  useFocusTrap(containerRef, open);

  return (
    <div>
      <button type="button">Outside trigger</button>
      {open && (
        <div ref={containerRef} role="dialog" tabIndex={-1}>
          <button type="button">First</button>
          <button type="button">Second</button>
          <button type="button" onClick={() => setOpen(false)}>
            Close
          </button>
        </div>
      )}
    </div>
  );
}

describe("useFocusTrap", () => {
  it("moves initial focus to the first focusable element", () => {
    render(<TestDialog />);
    expect(screen.getByText("First")).toHaveFocus();
  });

  it("wraps Tab from the last element back to the first", async () => {
    const user = userEvent.setup();
    render(<TestDialog />);

    screen.getByText("Close").focus();
    await user.tab();

    expect(screen.getByText("First")).toHaveFocus();
  });

  it("wraps Shift+Tab from the first element to the last", async () => {
    const user = userEvent.setup();
    render(<TestDialog />);

    expect(screen.getByText("First")).toHaveFocus();
    await user.tab({ shift: true });

    expect(screen.getByText("Close")).toHaveFocus();
  });

  it("does nothing when inactive", () => {
    render(<TestDialog initialOpen={false} />);
    const trigger = screen.getByText("Outside trigger");
    trigger.focus();
    expect(trigger).toHaveFocus();
  });

  it("falls back to focusing the container when it has no focusable children", () => {
    function EmptyDialog() {
      const containerRef = useRef<HTMLDivElement>(null);
      useFocusTrap(containerRef, true);
      return (
        <div ref={containerRef} role="dialog" tabIndex={-1}>
          <p>No interactive content</p>
        </div>
      );
    }

    render(<EmptyDialog />);
    expect(screen.getByRole("dialog")).toHaveFocus();
  });

  it("restores focus to the trigger after the trap deactivates", async () => {
    function ToggleDialog() {
      const [open, setOpen] = useState(false);
      const containerRef = useRef<HTMLDivElement>(null);
      useFocusTrap(containerRef, open);

      return (
        <div>
          <button type="button" onClick={() => setOpen(true)}>
            Open
          </button>
          {open && (
            <div ref={containerRef} role="dialog" tabIndex={-1}>
              <button type="button" onClick={() => setOpen(false)}>
                Close
              </button>
            </div>
          )}
        </div>
      );
    }

    const user = userEvent.setup();
    render(<ToggleDialog />);

    const openButton = screen.getByText("Open");
    await user.click(openButton);
    expect(screen.getByText("Close")).toHaveFocus();

    await user.click(screen.getByText("Close"));
    expect(openButton).toHaveFocus();
  });

  it("does not steal focus back when it already moved elsewhere before the trap deactivated", async () => {
    function NavigatingDialog() {
      const [open, setOpen] = useState(false);
      const containerRef = useRef<HTMLDivElement>(null);
      useFocusTrap(containerRef, open);

      return (
        <div>
          <button type="button" onClick={() => setOpen(true)}>
            Open
          </button>
          <a href="#elsewhere">Elsewhere on the page</a>
          {open && (
            <div ref={containerRef} role="dialog" tabIndex={-1}>
              <button
                type="button"
                onClick={() => {
                  // Simulate a link inside the dialog moving focus to a
                  // destination element as part of navigating away, then
                  // the dialog closing as a side effect (e.g. MobileNav's
                  // nav links: onClick={onClose} alongside navigation).
                  document.querySelector<HTMLAnchorElement>("a")?.focus();
                  setOpen(false);
                }}
              >
                Navigate away
              </button>
            </div>
          )}
        </div>
      );
    }

    const user = userEvent.setup();
    render(<NavigatingDialog />);

    const openButton = screen.getByText("Open");
    await user.click(openButton);
    await user.click(screen.getByText("Navigate away"));

    expect(screen.getByText("Elsewhere on the page")).toHaveFocus();
    expect(openButton).not.toHaveFocus();
  });
});
