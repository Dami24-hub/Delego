import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, beforeEach } from "vitest";
import { CurrencySwitcher } from "./CurrencySwitcher";
import { CurrencyProvider } from "../../hooks/useCurrency";
import { CURRENCY_STORAGE_KEY } from "../../lib/currencies";

function renderSwitcher() {
  return render(
    <CurrencyProvider>
      <CurrencySwitcher />
    </CurrencyProvider>
  );
}

describe("CurrencySwitcher", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("lists every supported currency as an option", () => {
    renderSwitcher();

    expect(screen.getByRole("option", { name: "XLM" })).toBeInTheDocument();
    expect(
      screen.getByRole("option", { name: "USDC-equivalent estimate" })
    ).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "USD" })).toBeInTheDocument();
  });

  it("defaults to XLM", () => {
    renderSwitcher();
    expect(screen.getByRole("combobox")).toHaveValue("XLM");
  });

  it("switching to an estimate mode persists the choice", async () => {
    const user = userEvent.setup();
    renderSwitcher();

    await user.selectOptions(screen.getByRole("combobox"), "USD");

    expect(screen.getByRole("combobox")).toHaveValue("USD");
    expect(window.localStorage.getItem(CURRENCY_STORAGE_KEY)).toBe("USD");
  });

  it("shows a staleness indicator once the fallback rate loads in an estimate mode", async () => {
    const user = userEvent.setup();
    renderSwitcher();

    await user.selectOptions(screen.getByRole("combobox"), "USD");

    expect(await screen.findByRole("status")).toHaveTextContent(
      /placeholder|cached/i
    );
  });

  it("does not show a staleness indicator in XLM mode", () => {
    renderSwitcher();
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });
});
