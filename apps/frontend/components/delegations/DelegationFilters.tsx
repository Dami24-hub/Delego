"use client";

import type { Delegation } from "@delegolabs/types";
import { DelegationTagBadge } from "./DelegationTagBadge";
import type { ColorTag } from "../../lib/delegationTags";

type DelegationStatus = Delegation["status"];

const ALL_STATUSES: DelegationStatus[] = [
  "active",
  "paused",
  "revoked",
  "expired",
];

export interface DelegationFiltersProps {
  search: string;
  onSearchChange: (value: string) => void;
  selectedStatuses: DelegationStatus[];
  onToggleStatus: (status: DelegationStatus) => void;
  availableLabels?: Array<{ label: string; colorTag?: ColorTag }>;
  selectedLabel?: string;
  onSelectLabel?: (label: string | undefined) => void;
}

/** Search box, status chips, and filter-by-label chips for delegations list (#510, #600). */
export function DelegationFilters({
  search,
  onSearchChange,
  selectedStatuses,
  onToggleStatus,
  availableLabels = [],
  selectedLabel,
  onSelectLabel,
}: DelegationFiltersProps) {
  return (
    <div className="order-filters space-y-3">
      <div className="order-filters-row">
        <input
          type="search"
          className="order-search"
          placeholder="Search by agent, wallet ID, or label"
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

      {availableLabels.length > 0 && onSelectLabel && (
        <fieldset className="delegation-label-filter">
          <legend className="order-status-filter-legend">
            Filter by label
          </legend>
          <div className="flex flex-wrap gap-1.5 pt-1">
            <button
              type="button"
              className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border transition ${
                !selectedLabel
                  ? "bg-indigo-600 text-white border-indigo-600"
                  : "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300"
              }`}
              onClick={() => onSelectLabel(undefined)}
            >
              All labels
            </button>
            {availableLabels.map(({ label, colorTag }) => {
              const active = selectedLabel === label;
              return (
                <button
                  key={label}
                  type="button"
                  onClick={() => onSelectLabel(active ? undefined : label)}
                  className={`transition ${active ? "ring-2 ring-indigo-500" : ""}`}
                >
                  <DelegationTagBadge label={label} colorTag={colorTag} />
                </button>
              );
            })}
          </div>
        </fieldset>
      )}
    </div>
  );
}
