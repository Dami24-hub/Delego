// @vitest-environment jsdom

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, waitFor } from "@testing-library/react";
import DemoEntryPage from "./page";
import { isDemoMode } from "../../lib/demoMode";

const mockReplace = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: mockReplace }),
}));

describe("DemoEntryPage", () => {
  beforeEach(() => {
    window.sessionStorage.clear();
    mockReplace.mockClear();
  });

  it("turns on demo mode and redirects to the dashboard", async () => {
    render(<DemoEntryPage />);

    await waitFor(() => expect(isDemoMode()).toBe(true));
    expect(mockReplace).toHaveBeenCalledWith("/");
  });
});
