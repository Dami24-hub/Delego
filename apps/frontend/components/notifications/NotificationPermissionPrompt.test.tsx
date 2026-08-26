import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { NotificationPermissionPrompt } from "./NotificationPermissionPrompt";

class MockNotification {
  static permission: NotificationPermission = "default";
  static requestPermission = vi.fn<() => Promise<NotificationPermission>>();
}

describe("NotificationPermissionPrompt", () => {
  beforeEach(() => {
    localStorage.clear();
    MockNotification.permission = "default";
    MockNotification.requestPermission = vi.fn().mockResolvedValue("granted");
    vi.stubGlobal("Notification", MockNotification);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("shows the prompt when permission is still default and it hasn't been dismissed", () => {
    render(<NotificationPermissionPrompt />);
    expect(screen.getByText(/notified about approvals/i)).toBeDefined();
  });

  it("does not render when the Notification API is unsupported", () => {
    vi.unstubAllGlobals();
    render(<NotificationPermissionPrompt />);
    expect(screen.queryByText(/notified about approvals/i)).toBeNull();
  });

  it("does not render again after 'Not now' is dismissed, even across remounts", async () => {
    const user = userEvent.setup();
    const { unmount } = render(<NotificationPermissionPrompt />);
    await user.click(screen.getByRole("button", { name: /not now/i }));
    expect(screen.queryByText(/notified about approvals/i)).toBeNull();
    unmount();

    render(<NotificationPermissionPrompt />);
    expect(screen.queryByText(/notified about approvals/i)).toBeNull();
  });

  it("requests permission and hides the prompt after clicking Enable", async () => {
    const user = userEvent.setup();
    render(<NotificationPermissionPrompt />);
    await user.click(screen.getByRole("button", { name: /^enable$/i }));
    expect(MockNotification.requestPermission).toHaveBeenCalledTimes(1);
    expect(screen.queryByText(/notified about approvals/i)).toBeNull();
  });
});
