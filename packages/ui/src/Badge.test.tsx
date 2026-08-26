import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { axe } from "vitest-axe";
import { Badge } from "./Badge.js";

describe("Badge", () => {
  it("has no accessibility violations", async () => {
    const { container } = render(
      <>
        <Badge tone="neutral">Neutral</Badge>
        <Badge tone="info">Info</Badge>
        <Badge tone="success">Success</Badge>
        <Badge tone="warning">Warning</Badge>
        <Badge tone="error">Error</Badge>
      </>
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it("renders children text", () => {
    render(<Badge>New</Badge>);
    expect(screen.getByText("New")).toBeDefined();
  });

  it("renders neutral tone by default", () => {
    const { container } = render(<Badge>Default</Badge>);
    const badge = container.querySelector("span");
    expect(badge?.style.background).toBe("rgb(229, 231, 235)");
  });

  it("renders info tone", () => {
    const { container } = render(<Badge tone="info">Info</Badge>);
    const badge = container.querySelector("span");
    expect(badge?.style.background).toBe("rgb(219, 234, 254)");
  });

  it("renders success tone", () => {
    const { container } = render(<Badge tone="success">Success</Badge>);
    const badge = container.querySelector("span");
    expect(badge?.style.background).toBe("rgb(220, 252, 231)");
  });

  it("renders warning tone", () => {
    const { container } = render(<Badge tone="warning">Warning</Badge>);
    const badge = container.querySelector("span");
    expect(badge?.style.background).toBe("rgb(254, 243, 199)");
  });

  it("spreads additional props", () => {
    render(<Badge data-testid="my-badge">Styled</Badge>);
    expect(screen.getByTestId("my-badge")).toBeDefined();
  });
});

