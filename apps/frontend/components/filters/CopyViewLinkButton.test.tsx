import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { CopyViewLinkButton } from "./CopyViewLinkButton";

const messages = {
  filters: { copyLink: "Copy link to this view", copied: "Link copied" },
};

function renderButton() {
  return render(
    <NextIntlClientProvider locale="en" messages={messages}>
      <CopyViewLinkButton />
    </NextIntlClientProvider>
  );
}

describe("CopyViewLinkButton", () => {
  beforeEach(() => {
    Object.assign(navigator, {
      clipboard: { writeText: vi.fn().mockResolvedValue(undefined) },
    });
  });

  it("copies the current URL and shows confirmation", async () => {
    renderButton();

    fireEvent.click(
      screen.getByRole("button", { name: "Copy link to this view" })
    );

    await waitFor(() =>
      expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
        window.location.href
      )
    );
    expect(await screen.findByText("Link copied")).toBeInTheDocument();
  });

  it("does not throw when clipboard access is denied", async () => {
    Object.assign(navigator, {
      clipboard: { writeText: vi.fn().mockRejectedValue(new Error("denied")) },
    });
    renderButton();

    fireEvent.click(
      screen.getByRole("button", { name: "Copy link to this view" })
    );

    await waitFor(() =>
      expect(navigator.clipboard.writeText).toHaveBeenCalled()
    );
    expect(screen.queryByText("Link copied")).not.toBeInTheDocument();
  });
});
