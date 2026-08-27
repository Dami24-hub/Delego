"use client";

import type { Escrow } from "@delegolabs/types";

type EscrowStatus = Escrow["status"];

const ALL_STATUSES: EscrowStatus[] = [
  "Funded",
  "Released",
  "Refunded",
  "Disputed",
];

export interface EscrowFiltersProps {
  search: string;
  onSearchChange: (value: string) => void;
  selectedStatuses: EscrowStatus[];
  onToggleStatus: (status: EscrowStatus) => void;
}

/** Search box and status chips for the escrows list page (#510). */
export function EscrowFilters({
  search,
  onSearchChange,
  selectedStatuses,
  onToggleStatus,
}: EscrowFiltersProps) {
  return (
    <div className="order-filters">
      <div className="order-filters-row">
        <input
          type="search"
          className="order-search"
          placeholder="Search by escrow, order, buyer, or seller"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          aria-label="Search escrows"
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
