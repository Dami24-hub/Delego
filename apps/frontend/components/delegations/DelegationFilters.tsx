"use client";

import type { Delegation } from "@delegolabs/types";

type DelegationStatus = Delegation["status"];

const ALL_STATUSES: DelegationStatus[] = ["active", "paused", "revoked", "expired"];

export interface DelegationFiltersProps {
  search: string;
  onSearchChange: (value: string) => void;
  selectedStatuses: DelegationStatus[];
  onToggleStatus: (status: DelegationStatus) => void;
}

/** Search box and status chips for the delegations list page (#510). */
export function DelegationFilters({
  search,
  onSearchChange,
  selectedStatuses,
  onToggleStatus,
}: DelegationFiltersProps) {
  return (
    <div className="order-filters">
      <div className="order-filters-row">
        <input
          type="search"
          className="order-search"
          placeholder="Search by agent or wallet ID"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          aria-label="Search delegations"
        />
      </div>
      <fieldset className="order-status-filter">
        <legend className="order-status-filter-legend">Filter by status</legend>
        <div className="order-status-chips">
          {ALL_STATUSES.map((status) => {
            const active = selectedStatuses.includes(status);
            return (
              <button
                key={status}
                type="button"
                className={`order-chip${active ? " order-chip--active" : ""}`}
                aria-pressed={active}
                onClick={() => onToggleStatus(status)}
              >
                {status}
              </button>
            );
          })}
        </div>
      </fieldset>
    </div>
  );
}
