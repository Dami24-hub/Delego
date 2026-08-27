import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { NotificationSettingsCard } from "./NotificationSettingsCard";
import { NotificationProvider } from "../../hooks/useNotifications";

class MockNotification {
  static permission: NotificationPermission = "default";
  static requestPermission = vi.fn<() => Promise<NotificationPermission>>();
}

function renderCard() {
  return render(
    <NotificationProvider>
      <NotificationSettingsCard />
    </NotificationProvider>
  );
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

  it("does not render desktop toggle when the Notification API is unsupported", () => {
    vi.unstubAllGlobals();
    renderCard();
    expect(
      screen.queryByText(/Notify me about approvals when this tab/i)
    ).toBeNull();
  });

  it("renders desktop toggle unchecked by default", () => {
    renderCard();
    const checkboxes = screen.getAllByRole("checkbox");
    // Desktop checkbox is the last checkbox
    const desktopCheckbox = checkboxes[checkboxes.length - 1];
    expect(desktopCheckbox).not.toBeChecked();
  });

  it("checking it requests permission and enables desktop notifications on grant", async () => {
    const user = userEvent.setup();
    renderCard();
    const checkboxes = screen.getAllByRole("checkbox");
    const desktopCheckbox = checkboxes[checkboxes.length - 1];
    await user.click(desktopCheckbox);
    expect(MockNotification.requestPermission).toHaveBeenCalledTimes(1);
    expect(desktopCheckbox).toBeChecked();
  });

  it("does not enable desktop notifications when permission is denied", async () => {
    MockNotification.requestPermission = vi.fn().mockResolvedValue("denied");
    const user = userEvent.setup();
    renderCard();
    const checkboxes = screen.getAllByRole("checkbox");
    const desktopCheckbox = checkboxes[checkboxes.length - 1];
    await user.click(desktopCheckbox);
    expect(desktopCheckbox).not.toBeChecked();
  });

  it("disables the control entirely once permission is denied at the browser level", () => {
    MockNotification.permission = "denied";
    renderCard();
    const checkboxes = screen.getAllByRole("checkbox");
    const desktopCheckbox = checkboxes[checkboxes.length - 1];
    expect(desktopCheckbox).toBeDisabled();
    expect(screen.getByText(/blocked in your browser settings/i)).toBeDefined();
  });
});
