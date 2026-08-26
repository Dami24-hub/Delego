import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { axe } from "vitest-axe";
import { Amount } from "./Amount.js";

describe("Amount", () => {
  it("has no accessibility violations", async () => {
    const { container } = render(<Amount stroops={10_000_000n} />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it("renders the XLM value with the XLM symbol by default", () => {
    const { container } = render(<Amount stroops={10_000_000n} />);
    expect(container.textContent).toBe("1.00 XLM");
  });

  it("renders a USD estimate with the alternate XLM value as a tooltip", () => {
    const { container } = render(
      <Amount stroops={10_000_000n} currency="USD" xlmUsdRate={0.5} />,
    );
    const span = container.querySelector("span");
    expect(span?.textContent).toContain("$0.50");
    expect(span?.getAttribute("title")).toBe("1.00 XLM");
  });

  it("renders a USDC estimate with the USDC symbol", () => {
    const { container } = render(
      <Amount stroops={10_000_000n} currency="USDC_ESTIMATE" xlmUsdRate={0.5} />,
    );
    expect(container.textContent).toContain("USDC");
  });

  it("falls back to XLM when a conversion currency is requested without a rate", () => {
    const { container } = render(
      <Amount stroops={10_000_000n} currency="USD" />,
    );
    expect(container.textContent).toBe("1.00 XLM");
  });

  it("omits the title attribute when there is no alternate value", () => {
    const { container } = render(<Amount stroops={10_000_000n} />);
    const span = container.querySelector("span");
    expect(span?.hasAttribute("title")).toBe(false);
  });

  it("respects a locale override", () => {
    const { container } = render(
      <Amount stroops={12_345_000_000n} locale="de-DE" />,
    );
    // German locale uses "." as the thousands separator and "," as decimal.
    expect(container.textContent).toContain("1.234,50");
  });
});
