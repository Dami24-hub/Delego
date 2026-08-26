import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { axe } from "vitest-axe";
import { Stepper } from "./Stepper.js";

const steps = [
  { id: "agent", label: "Choose agent" },
  { id: "scope", label: "Scope" },
  { id: "limits", label: "Limits" },
  { id: "review", label: "Review" },
];

describe("Stepper", () => {
  it("has no accessibility violations", async () => {
    const { container } = render(<Stepper steps={steps} currentIndex={1} />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it("renders every step label", () => {
    render(<Stepper steps={steps} currentIndex={0} />);
    for (const step of steps) {
      expect(screen.getByText(step.label)).toBeDefined();
    }
  });

  it("marks the current step with aria-current", () => {
    render(<Stepper steps={steps} currentIndex={2} />);
    const current = screen.getByRole("button", { name: "Limits" });
    expect(current.getAttribute("aria-current")).toBe("step");
  });

  it("does not mark completed or upcoming steps as current", () => {
    render(<Stepper steps={steps} currentIndex={2} />);
    expect(screen.getByRole("button", { name: "Choose agent" }).getAttribute("aria-current")).toBeNull();
    expect(screen.getByRole("button", { name: "Review" }).getAttribute("aria-current")).toBeNull();
  });

  it("disables upcoming and current steps from selection", () => {
    const onStepSelect = vi.fn();
    render(<Stepper steps={steps} currentIndex={1} onStepSelect={onStepSelect} />);

    fireEvent.click(screen.getByRole("button", { name: "Scope" }));
    fireEvent.click(screen.getByRole("button", { name: "Limits" }));
    expect(onStepSelect).not.toHaveBeenCalled();
  });

  it("lets a completed step be selected to jump back", () => {
    const onStepSelect = vi.fn();
    render(<Stepper steps={steps} currentIndex={2} onStepSelect={onStepSelect} />);

    fireEvent.click(screen.getByRole("button", { name: "Choose agent" }));
    expect(onStepSelect).toHaveBeenCalledWith(0);
  });

  it("renders a checkmark for completed steps", () => {
    render(<Stepper steps={steps} currentIndex={2} />);
    const completed = screen.getByRole("button", { name: "Choose agent" });
    expect(completed.textContent).toContain("✓");
  });
});

