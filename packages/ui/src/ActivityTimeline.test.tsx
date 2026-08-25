import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { ActivityTimeline, type ActivityTimelineEvent } from "./ActivityTimeline.js";

const baseEvents: ActivityTimelineEvent[] = [
  {
    id: "1",
    type: "created",
    title: "Order placed",
    timestamp: new Date("2026-01-01T00:00:00.000Z"),
    tone: "success",
  },
  {
    id: "2",
    type: "escrowed",
    title: "Funds escrowed",
    timestamp: new Date("2026-01-02T00:00:00.000Z"),
    tone: "pending",
  },
  {
    id: "3",
    type: "disputed",
    title: "Order disputed",
    timestamp: new Date("2026-01-03T00:00:00.000Z"),
    tone: "failed",
  },
];

describe("ActivityTimeline", () => {
  it("renders events in the order given", () => {
    render(<ActivityTimeline events={baseEvents} />);
    const items = screen.getAllByRole("listitem");
    expect(items).toHaveLength(3);
    expect(items[0]).toHaveTextContent("Order placed");
    expect(items[1]).toHaveTextContent("Funds escrowed");
    expect(items[2]).toHaveTextContent("Order disputed");
  });

  it("maps each tone to a data-tone attribute on its step", () => {
    render(<ActivityTimeline events={baseEvents} />);
    const items = screen.getAllByRole("listitem");
    expect(items[0]).toHaveAttribute("data-tone", "success");
    expect(items[1]).toHaveAttribute("data-tone", "pending");
    expect(items[2]).toHaveAttribute("data-tone", "failed");
  });

  it("defaults to pending tone when omitted", () => {
    render(
      <ActivityTimeline
        events={[
          {
            id: "1",
            type: "x",
            title: "Untoned event",
            timestamp: new Date(),
          },
        ]}
      />
    );
    expect(screen.getByRole("listitem")).toHaveAttribute("data-tone", "pending");
  });

  it("renders the empty message when there are no events", () => {
    render(<ActivityTimeline events={[]} emptyMessage="Nothing here yet" />);
    expect(screen.getByText("Nothing here yet")).toBeDefined();
    expect(screen.queryAllByRole("listitem")).toHaveLength(0);
  });

  it("shows an absolute timestamp as a tooltip via the title attribute", () => {
    render(<ActivityTimeline events={[baseEvents[0]]} />);
    const time = screen.getByText(/just now|ago/);
    expect(time.getAttribute("title")).toBeTruthy();
  });

  it("renders an optional description", () => {
    render(
      <ActivityTimeline
        events={[{ ...baseEvents[0], description: "via ApprovalCard" }]}
      />
    );
    expect(screen.getByText("via ApprovalCard")).toBeDefined();
  });
});
