import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { PauseResumeConfirmModal } from "./PauseResumeConfirmModal";

describe("PauseResumeConfirmModal", () => {
  it("does not render when isOpen is false", () => {
    render(
      <PauseResumeConfirmModal
        isOpen={false}
        action="pause"
        agentId="agent-123"
        onConfirm={vi.fn()}
        onCancel={vi.fn()}
      />
    );
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("renders pause explanations and triggers onConfirm and onCancel", () => {
    const handleConfirm = vi.fn();
    const handleCancel = vi.fn();

    render(
      <PauseResumeConfirmModal
        isOpen={true}
        action="pause"
        agentId="agent-123"
        onConfirm={handleConfirm}
        onCancel={handleCancel}
      />
    );

    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByText("Pause Delegation for agent-123?")).toBeInTheDocument();
    expect(screen.getByText(/No new spends can be initiated/i)).toBeInTheDocument();

    fireEvent.click(screen.getByText("Pause Delegation"));
    expect(handleConfirm).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByText("Cancel"));
    expect(handleCancel).toHaveBeenCalledTimes(1);
  });
});
