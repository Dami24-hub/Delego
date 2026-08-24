import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { NextIntlClientProvider } from "next-intl";
import { MobileNav } from "./MobileNav";
import messages from "../../messages/en.json";

vi.mock("next/navigation", () => ({
  usePathname: () => "/",
}));

function renderMobileNav(props: React.ComponentProps<typeof MobileNav>) {
  return render(
    <NextIntlClientProvider locale="en" messages={messages}>
      <MobileNav {...props} />
    </NextIntlClientProvider>
  );
}

describe("MobileNav", () => {
  it("moves focus into the panel and traps Tab when open", async () => {
    const user = userEvent.setup();
    renderMobileNav({ open: true, onClose: () => {} });

    expect(screen.getByRole("dialog", { name: /primary navigation/i })).toHaveAttribute(
      "aria-modal",
      "true"
    );

    // Initial focus lands on the first focusable element (close button).
    expect(screen.getByRole("button", { name: /close navigation menu/i })).toHaveFocus();

    // Shift+Tab from the first element wraps to the last nav link.
    await user.tab({ shift: true });
    const links = screen.getAllByRole("link");
    expect(links[links.length - 1]).toHaveFocus();
  });

  it("calls onClose on Escape", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    renderMobileNav({ open: true, onClose });

    await user.keyboard("{Escape}");

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("restores focus to the trigger element after closing", () => {
    function Harness() {
      return (
        <NextIntlClientProvider locale="en" messages={messages}>
          <div>
            <button type="button">Open menu</button>
            <MobileNav open onClose={() => {}} />
          </div>
        </NextIntlClientProvider>
      );
    }

    const trigger = document.createElement("button");
    document.body.appendChild(trigger);
    trigger.focus();

    const { unmount } = render(<Harness />);
    expect(screen.getByRole("button", { name: /close navigation menu/i })).toHaveFocus();

    unmount();
    expect(trigger).toHaveFocus();
    trigger.remove();
  });

  it("calls onClose when the backdrop is clicked", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    const { container } = renderMobileNav({ open: true, onClose });

    const overlay = container.querySelector(".mobile-nav-overlay");
    expect(overlay).not.toBeNull();
    await user.click(overlay as Element);

    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
