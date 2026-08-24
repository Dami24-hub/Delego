import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, beforeEach, vi } from "vitest";
import { NextIntlClientProvider } from "next-intl";
import { LanguageSwitcher } from "./LanguageSwitcher";
import messages from "../../messages/en.json";
import { LOCALE_COOKIE } from "../../i18n/config";

function renderSwitcher(locale = "en") {
  return render(
    <NextIntlClientProvider locale={locale} messages={messages}>
      <LanguageSwitcher />
    </NextIntlClientProvider>
  );
}

describe("LanguageSwitcher", () => {
  beforeEach(() => {
    document.cookie = `${LOCALE_COOKIE}=; path=/; max-age=0`;
  });

  it("lists every supported locale as an option", () => {
    renderSwitcher();

    expect(screen.getByRole("option", { name: "English" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "Deutsch" })).toBeInTheDocument();
  });

  it("selects the active locale by default", () => {
    renderSwitcher("en");
    expect(screen.getByRole("combobox")).toHaveValue("en");
  });

  it("sets the locale cookie and reloads when a new language is chosen", async () => {
    const user = userEvent.setup();
    const reloadSpy = vi.fn();
    Object.defineProperty(window, "location", {
      value: { ...window.location, reload: reloadSpy },
      writable: true,
    });

    renderSwitcher();

    await user.selectOptions(screen.getByRole("combobox"), "de");

    expect(document.cookie).toContain(`${LOCALE_COOKIE}=de`);
    expect(reloadSpy).toHaveBeenCalledTimes(1);
  });
});
