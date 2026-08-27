import { describe, it, expect, beforeEach } from "vitest";
import { renderHook, waitFor, act } from "@testing-library/react";
import { useDelegationWizardDraft } from "./useDelegationWizardDraft";

describe("useDelegationWizardDraft", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("starts with an empty draft at step 0 and no stored draft flagged", async () => {
    const { result } = renderHook(() => useDelegationWizardDraft("wallet-1"));

    await waitFor(() => expect(result.current.hydrated).toBe(true));
    expect(result.current.draft.walletId).toBe("wallet-1");
    expect(result.current.stepIndex).toBe(0);
    expect(result.current.hasStoredDraft).toBe(false);
  });

  it("persists updates and resuming restores step position", async () => {
    const { result, unmount } = renderHook(() =>
      useDelegationWizardDraft("wallet-1")
    );
    await waitFor(() => expect(result.current.hydrated).toBe(true));

    act(() => {
      result.current.updateDraft({
        ...result.current.draft,
        agentId: "agent-1",
      });
    });
    act(() => {
      result.current.goToStep(2);
    });
    unmount();

    const { result: resumed } = renderHook(() =>
      useDelegationWizardDraft("wallet-1")
    );
    await waitFor(() => expect(resumed.current.hydrated).toBe(true));
    expect(resumed.current.hasStoredDraft).toBe(true);

    act(() => {
      resumed.current.resumeDraft();
    });

    expect(resumed.current.draft.agentId).toBe("agent-1");
    expect(resumed.current.stepIndex).toBe(2);
    expect(resumed.current.hasStoredDraft).toBe(false);
  });

  it("discardDraft clears storage and resets to an empty draft", async () => {
    const { result } = renderHook(() => useDelegationWizardDraft("wallet-1"));
    await waitFor(() => expect(result.current.hydrated).toBe(true));

    act(() => {
      result.current.updateDraft({
        ...result.current.draft,
        agentId: "agent-1",
      });
      result.current.goToStep(1);
    });
    act(() => {
      result.current.discardDraft();
    });

    expect(result.current.draft.agentId).toBe("");
    expect(result.current.stepIndex).toBe(0);
    expect(
      window.localStorage.getItem("delego_delegation_wizard_draft")
    ).toBeNull();
  });

  it("ignores a corrupt stored draft", async () => {
    window.localStorage.setItem("delego_delegation_wizard_draft", "not-json");
    const { result } = renderHook(() => useDelegationWizardDraft("wallet-1"));

    await waitFor(() => expect(result.current.hydrated).toBe(true));
    expect(result.current.hasStoredDraft).toBe(false);
  });
});
