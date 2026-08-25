import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { NotificationSettingsCard } from "./NotificationSettingsCard";

class MockNotification {
  static permission: NotificationPermission = "default";
  static requestPermission = vi.fn<() => Promise<NotificationPermission>>();
}

describe("NotificationSettingsCard", () => {
  beforeEach(() => {
    localStorage.clear();
    MockNotification.permission = "default";
    MockNotification.requestPermission = vi.fn().mockResolvedValue("granted");
    vi.stubGlobal("Notification", MockNotification);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("does not render when the Notification API is unsupported", () => {
    vi.unstubAllGlobals();
    render(<NotificationSettingsCard />);
    expect(screen.queryByText(/desktop notifications/i)).toBeNull();
  });

  it("renders unchecked by default", () => {
    render(<NotificationSettingsCard />);
    expect(screen.getByRole("checkbox")).not.toBeChecked();
  });

  it("checking it requests permission (the opt-in prompt) and enables the kill switch on grant", async () => {
    const user = userEvent.setup();
    render(<NotificationSettingsCard />);
    await user.click(screen.getByRole("checkbox"));
    expect(MockNotification.requestPermission).toHaveBeenCalledTimes(1);
    expect(screen.getByRole("checkbox")).toBeChecked();
  });

  it("does not enable the kill switch when permission is denied", async () => {
    MockNotification.requestPermission = vi.fn().mockResolvedValue("denied");
    const user = userEvent.setup();
    render(<NotificationSettingsCard />);
    await user.click(screen.getByRole("checkbox"));
    expect(screen.getByRole("checkbox")).not.toBeChecked();
  });

  it("disables the control entirely once permission is denied at the browser level", () => {
    MockNotification.permission = "denied";
    render(<NotificationSettingsCard />);
    expect(screen.getByRole("checkbox")).toBeDisabled();
    expect(screen.getByText(/blocked in your browser settings/i)).toBeDefined();
  });
});
