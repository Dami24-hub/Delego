// @vitest-environment jsdom

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { MockApiProvider } from "./MockApiProvider";
import { enableDemoMode } from "../../lib/demoMode";

const mockStart = vi.fn().mockResolvedValue(undefined);

vi.mock("../../mocks/browser", () => ({
  worker: { start: (...args: unknown[]) => mockStart(...args) },
}));

describe("MockApiProvider", () => {
  const originalEnv = process.env.NEXT_PUBLIC_MOCK_API;

  beforeEach(() => {
    mockStart.mockClear();
    window.sessionStorage.clear();
  });

  afterEach(() => {
    process.env.NEXT_PUBLIC_MOCK_API = originalEnv;
  });

  it("renders children immediately when neither mock mode nor demo mode is active", async () => {
    delete process.env.NEXT_PUBLIC_MOCK_API;

    render(
      <MockApiProvider>
        <p>App content</p>
      </MockApiProvider>
    );

    await waitFor(() => expect(screen.getByText("App content")).toBeInTheDocument());
    expect(mockStart).not.toHaveBeenCalled();
  });

  it("starts the MSW worker when NEXT_PUBLIC_MOCK_API=true", async () => {
    process.env.NEXT_PUBLIC_MOCK_API = "true";

    render(
      <MockApiProvider>
        <p>App content</p>
      </MockApiProvider>
    );

    await waitFor(() => expect(mockStart).toHaveBeenCalledWith({ onUnhandledRequest: "bypass" }));
    await waitFor(() => expect(screen.getByText("App content")).toBeInTheDocument());
  });

  it("starts the MSW worker when demo mode is active, even without the env flag", async () => {
    delete process.env.NEXT_PUBLIC_MOCK_API;
    enableDemoMode();

    render(
      <MockApiProvider>
        <p>App content</p>
      </MockApiProvider>
    );

    await waitFor(() => expect(mockStart).toHaveBeenCalledWith({ onUnhandledRequest: "bypass" }));
    await waitFor(() => expect(screen.getByText("App content")).toBeInTheDocument());
  });
});
