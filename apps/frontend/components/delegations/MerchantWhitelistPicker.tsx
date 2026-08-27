"use client";

import { useId, useMemo, useState } from "react";
import { Badge, Button } from "@delegolabs/ui";
import { useMerchantDirectory } from "../../hooks/useMerchantDirectory";
import { filterMerchants } from "../../lib/merchantDirectory";

export interface MerchantWhitelistPickerProps {
  /** Selected merchant ids. Ignored (but preserved) while `unrestricted` is true. */
  value: string[];
  onChange: (merchantIds: string[]) => void;
  /** "Allow all merchants" toggle state — off means the whitelist in `value` is enforced. */
  unrestricted: boolean;
  onUnrestrictedChange: (unrestricted: boolean) => void;
  /** Set once the user has tried to submit with an empty whitelist while restricted. */
  showEmptyWhitelistError?: boolean;
}

/**
 * Searchable merchant whitelist editor for the delegation scope step (#524):
 * an "allow all merchants" toggle, and — when off — an add/remove chip list
 * backed by the gateway's merchant directory. Requires at least one selected
 * merchant while restricted; `showEmptyWhitelistError` surfaces that as
 * inline guidance without blocking typing.
 */
export function MerchantWhitelistPicker({
  value,
  onChange,
  unrestricted,
  onUnrestrictedChange,
  showEmptyWhitelistError = false,
}: MerchantWhitelistPickerProps) {
  const { merchants, loading, error } = useMerchantDirectory();
  const [search, setSearch] = useState("");
  const toggleId = useId();
  const searchId = useId();

  const selected = useMemo(
    () => merchants.filter((m) => value.includes(m.id)),
    [merchants, value]
  );
  const results = useMemo(
    () =>
      filterMerchants(merchants, search).filter((m) => !value.includes(m.id)),
    [merchants, search, value]
  );

  const addMerchant = (id: string) => {
    if (!value.includes(id)) onChange([...value, id]);
    setSearch("");
  };

  const removeMerchant = (id: string) => {
    onChange(value.filter((existing) => existing !== id));
  };

  return (
    <div className="merchant-whitelist-picker">
      <label className="merchant-whitelist-toggle" htmlFor={toggleId}>
        <input
          id={toggleId}
          type="checkbox"
          checked={unrestricted}
          onChange={(e) => onUnrestrictedChange(e.target.checked)}
        />
        Allow all merchants
      </label>

      {!unrestricted && (
        <div className="merchant-whitelist-editor">
          {selected.length > 0 && (
            <ul
              className="merchant-whitelist-chips"
              aria-label="Selected merchants"
            >
              {selected.map((merchant) => (
                <li key={merchant.id}>
                  <Badge tone="info">
                    {merchant.name}
                    <button
                      type="button"
                      className="merchant-whitelist-chip-remove"
                      aria-label={`Remove ${merchant.name} from whitelist`}
                      onClick={() => removeMerchant(merchant.id)}
                    >
                      ×
                    </button>
                  </Badge>
                </li>
              ))}
            </ul>
          )}

          <label htmlFor={searchId} className="merchant-whitelist-search-label">
            Add a merchant
          </label>
          <input
            id={searchId}
            type="text"
            className="merchant-whitelist-search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search merchants…"
            disabled={loading}
          />

          {error && (
            <p className="settings-status error" role="alert">
              {error}
            </p>
          )}

          {!loading && !error && search && (
            <ul className="merchant-whitelist-results">
              {results.length === 0 ? (
                <li className="merchant-whitelist-no-results">
                  No matching merchants
                </li>
              ) : (
                results.map((merchant) => (
                  <li key={merchant.id}>
                    <Button
                      variant="ghost"
                      onClick={() => addMerchant(merchant.id)}
                    >
                      {merchant.name}
                    </Button>
                  </li>
                ))
              )}
            </ul>
          )}

          {showEmptyWhitelistError && value.length === 0 && (
            <p className="settings-status error" role="alert">
              Select at least one merchant, or turn on &ldquo;Allow all
              merchants&rdquo;.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
