import { describe, it, expect } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { AnnounceProvider, useAnnounce } from "./useAnnounce";

function Announcer({ message, assertive = false }: { message: string; assertive?: boolean }) {
  const { announce } = useAnnounce();
  return (
    <button
      type="button"
      onClick={() => announce(message, assertive ? "assertive" : "polite")}
    >
      Trigger
    </button>
  );
}

describe("useAnnounce", () => {
  it("renders empty polite and assertive live regions by default", () => {
    render(
      <AnnounceProvider>
        <div />
      </AnnounceProvider>
    );

    const regions = document.querySelectorAll("[aria-live]");
    expect(regions).toHaveLength(2);
    regions.forEach((region) => expect(region.textContent).toBe(""));
  });

  it("announces a message into the polite region", async () => {
    render(
      <AnnounceProvider>
        <Announcer message="Order approved." />
      </AnnounceProvider>
    );

    screen.getByText("Trigger").click();

    await waitFor(() => {
      const politeRegion = document.querySelector('[aria-live="polite"]');
      expect(politeRegion?.textContent).toBe("Order approved.");
    });
  });

  it("announces a message into the assertive region", async () => {
    render(
      <AnnounceProvider>
        <Announcer message="Something failed." assertive />
      </AnnounceProvider>
    );

    screen.getByText("Trigger").click();

    await waitFor(() => {
      const assertiveRegion = document.querySelector('[aria-live="assertive"]');
      expect(assertiveRegion?.textContent).toBe("Something failed.");
    });
  });

  it("throws when used outside an AnnounceProvider", () => {
    function Bare() {
      useAnnounce();
      return null;
    }
    expect(() => render(<Bare />)).toThrow(
      "useAnnounce must be used within an AnnounceProvider"
    );
  });
});
