import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ViewTransitions } from "./ViewTransitions";

function mockMatchMedia(reducedMotion: boolean) {
  window.matchMedia = vi.fn().mockImplementation((query: string) => ({
    matches: query.includes("prefers-reduced-motion") ? reducedMotion : false,
    media: query,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    addListener: vi.fn(),
    removeListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })) as unknown as typeof window.matchMedia;
}

function renderInternalLink(href = "/orders") {
  const main = document.createElement("main");
  main.className = "app-content";
  const anchor = document.createElement("a");
  anchor.href = href;
  anchor.textContent = "Go";
  main.appendChild(anchor);
  document.body.appendChild(main);
  return anchor;
}

describe("ViewTransitions", () => {
  let startViewTransition: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    startViewTransition = vi.fn().mockReturnValue({
      updateCallbackDone: Promise.resolve(),
      skipTransition: vi.fn(),
    });
    (
      document as unknown as { startViewTransition?: unknown }
    ).startViewTransition = startViewTransition;
  });

  afterEach(() => {
    delete (document as unknown as { startViewTransition?: unknown })
      .startViewTransition;
    document.body.innerHTML = "";
    vi.restoreAllMocks();
  });

  it("starts a view transition on an internal link click", async () => {
    mockMatchMedia(false);
    const user = userEvent.setup();
    render(<ViewTransitions />);
    const anchor = renderInternalLink();

    await user.click(anchor);

    expect(startViewTransition).toHaveBeenCalledTimes(1);
  });

  it("does nothing when the browser has no View Transitions support", async () => {
    delete (document as unknown as { startViewTransition?: unknown })
      .startViewTransition;
    mockMatchMedia(false);
    const user = userEvent.setup();
    render(<ViewTransitions />);
    const anchor = renderInternalLink();

    await user.click(anchor);

    expect(startViewTransition).not.toHaveBeenCalled();
  });

  it("bypasses entirely when the user prefers reduced motion", async () => {
    mockMatchMedia(true);
    const user = userEvent.setup();
    render(<ViewTransitions />);
    const anchor = renderInternalLink();

    await user.click(anchor);

    expect(startViewTransition).not.toHaveBeenCalled();
  });

  it("ignores clicks on external links", async () => {
    mockMatchMedia(false);
    const user = userEvent.setup();
    render(<ViewTransitions />);
    const anchor = renderInternalLink("https://example.com/");

    await user.click(anchor);

    expect(startViewTransition).not.toHaveBeenCalled();
  });
});
