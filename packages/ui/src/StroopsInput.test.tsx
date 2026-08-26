import { describe, it, expect, vi } from "vitest";
import { render } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "vitest-axe";
import { StroopsInput } from "./StroopsInput.js";

describe("StroopsInput", () => {
  it("has no accessibility violations", async () => {
    const { container } = render(
      <StroopsInput value={10_000_000n} currencySymbol="XLM" />
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it("has no accessibility violations with error state", async () => {
    const { container } = render(
      <StroopsInput value={10_000_000n} error="Amount exceeds limit" />
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it("displays XLM value when stroops provided", () => {
    const { container } = render(<StroopsInput value={10_000_000n} />);
    const input = container.querySelector("input");
    expect(input?.value).toBe("1");
  });

  it("displays currency symbol", () => {
    const { container } = render(<StroopsInput value={10_000_000n} />);
    const symbol = container.querySelector("div:last-child");
    expect(symbol?.textContent).toBe("XLM");
  });

  it("displays custom currency symbol", () => {
    const { container } = render(
      <StroopsInput value={10_000_000n} currencySymbol="USDC" />,
    );
    const symbol = container.querySelector("div:last-child");
    expect(symbol?.textContent).toBe("USDC");
  });

  it("handles empty initial value", () => {
    const { container } = render(<StroopsInput />);
    const input = container.querySelector("input");
    expect(input?.value).toBe("");
  });

  it("emits stroops when user types", async () => {
    const user = userEvent.setup();
    const handleChange = vi.fn();
    const { container } = render(<StroopsInput onChange={handleChange} />);

    const input = container.querySelector("input") as HTMLInputElement;
    await user.type(input, "5.5");

    // Should have called onChange with 55000000 stroops (5.5 * 10000000)
    expect(handleChange).toHaveBeenLastCalledWith(55_000_000n);
  });

  it("converts 1 XLM to 10 million stroops", async () => {
    const user = userEvent.setup();
    const handleChange = vi.fn();
    const { container } = render(<StroopsInput onChange={handleChange} />);

    const input = container.querySelector("input") as HTMLInputElement;
    await user.type(input, "1");

    expect(handleChange).toHaveBeenLastCalledWith(10_000_000n);
  });

  it("limits decimal places to specified decimals", async () => {
    const user = userEvent.setup();
    const handleChange = vi.fn();
    const { container } = render(
      <StroopsInput onChange={handleChange} decimals={2} />,
    );

    const input = container.querySelector("input") as HTMLInputElement;
    await user.type(input, "5.123");

    // Only first 2 decimal places accepted
    expect(input?.value).toBe("5.12");
  });

  it("handles single decimal point", async () => {
    const user = userEvent.setup();
    const handleChange = vi.fn();
    const { container } = render(<StroopsInput onChange={handleChange} />);

    const input = container.querySelector("input") as HTMLInputElement;
    await user.type(input, ".");

    expect(handleChange).toHaveBeenCalledWith(0n);
  });

  it("is disabled when disabled prop set", () => {
    const { container } = render(<StroopsInput disabled />);
    const input = container.querySelector("input");
    expect(input?.disabled).toBe(true);
  });

  it("displays error message", () => {
    const { container } = render(<StroopsInput error="Amount exceeds limit" />);
    const errorDiv = container.querySelector('[role="alert"]');
    expect(errorDiv?.textContent).toBe("Amount exceeds limit");
  });

  it("sets aria-invalid when error exists", () => {
    const { container } = render(<StroopsInput error="Invalid amount" />);
    const input = container.querySelector("input");
    expect(input?.getAttribute("aria-invalid")).toBe("true");
  });

  it("has accessible label for currency", () => {
    const { container } = render(<StroopsInput />);
    const input = container.querySelector("input");
    expect(input?.getAttribute("aria-label")).toBe("Amount in XLM");
  });

  it("spreads additional props to input", () => {
    const { container } = render(
      <StroopsInput data-testid="stroops-field" placeholder="Enter amount" />,
    );
    const input = container.querySelector("input");
    expect(input?.getAttribute("data-testid")).toBe("stroops-field");
    expect(input?.getAttribute("placeholder")).toBe("Enter amount");
  });

  it("sets input mode to decimal for mobile", () => {
    const { container } = render(<StroopsInput />);
    const input = container.querySelector("input");
    expect(input?.getAttribute("inputMode")).toBe("decimal");
  });

  it("displays zero for zero stroops", () => {
    const { container } = render(<StroopsInput value={0n} />);
    const input = container.querySelector("input");
    expect(input?.value).toBe("0");
  });

  it("converts large XLM amounts correctly", () => {
    const { container } = render(<StroopsInput value={1_000_000_000_000n} />);
    const input = container.querySelector("input");
    expect(input?.value).toBe("100000");
  });

  it("reformats the display value to the canonical form on blur", async () => {
    const user = userEvent.setup();
    const { container } = render(<StroopsInput />);

    const input = container.querySelector("input") as HTMLInputElement;
    await user.type(input, "5.100");
    await user.tab();

    expect(input.value).toBe("5.1");
  });

  it("calls the caller's onBlur handler when provided", async () => {
    const user = userEvent.setup();
    const handleBlur = vi.fn();
    const { container } = render(
      <StroopsInput value={10_000_000n} onBlur={handleBlur} />,
    );

    const input = container.querySelector("input") as HTMLInputElement;
    await user.click(input);
    await user.tab();

    expect(handleBlur).toHaveBeenCalledTimes(1);
  });

  it("does not reformat on blur when the field is empty", async () => {
    const user = userEvent.setup();
    const { container } = render(<StroopsInput />);

    const input = container.querySelector("input") as HTMLInputElement;
    await user.click(input);
    await user.tab();

    expect(input.value).toBe("");
  });

  it("shows the raw stroops helper text when showStroopsHint is set", () => {
    const { container } = render(
      <StroopsInput value={1_500_000n} showStroopsHint />,
    );

    expect(container.textContent).toContain("1,500,000 stroops");
  });

  it("hides the stroops helper text when there is an error", () => {
    const { container } = render(
      <StroopsInput
        value={1_500_000n}
        showStroopsHint
        error="Amount exceeds limit"
      />,
    );

    expect(container.textContent).not.toContain("stroops");
  });

  it("does not show the stroops helper text by default", () => {
    const { container } = render(<StroopsInput value={1_500_000n} />);
    expect(container.textContent).not.toContain("stroops");
  });

  it("rejects non-numeric characters and leaves the value unchanged", async () => {
    const user = userEvent.setup();
    const handleChange = vi.fn();
    const { container } = render(<StroopsInput onChange={handleChange} />);

    const input = container.querySelector("input") as HTMLInputElement;
    await user.type(input, "5");
    handleChange.mockClear();
    await user.type(input, "a");

    expect(input.value).toBe("5");
    expect(handleChange).not.toHaveBeenCalled();
  });
});

