export type ColorTag =
  | "slate"
  | "indigo"
  | "emerald"
  | "amber"
  | "rose"
  | "cyan"
  | "violet"
  | "teal";

export interface DelegationTagMeta {
  key: ColorTag;
  label: string;
  // CSS styles for badges meeting WCAG AA contrast on light and dark themes
  lightBg: string;
  lightText: string;
  darkBg: string;
  darkText: string;
  border: string;
}

export const COLOR_TAG_PALETTE: Record<ColorTag, DelegationTagMeta> = {
  slate: {
    key: "slate",
    label: "Slate",
    lightBg: "#f1f5f9",
    lightText: "#334155",
    darkBg: "#1e293b",
    darkText: "#cbd5e1",
    border: "#cbd5e1",
  },
  indigo: {
    key: "indigo",
    label: "Indigo",
    lightBg: "#e0e7ff",
    lightText: "#3730a3",
    darkBg: "#312e81",
    darkText: "#c7d2fe",
    border: "#818cf8",
  },
  emerald: {
    key: "emerald",
    label: "Emerald",
    lightBg: "#d1fae5",
    lightText: "#065f46",
    darkBg: "#064e3b",
    darkText: "#a7f3d0",
    border: "#34d399",
  },
  amber: {
    key: "amber",
    label: "Amber",
    lightBg: "#fef3c7",
    lightText: "#92400e",
    darkBg: "#78350f",
    darkText: "#fde68a",
    border: "#fbbf24",
  },
  rose: {
    key: "rose",
    label: "Rose",
    lightBg: "#ffe4e6",
    lightText: "#9f1239",
    darkBg: "#881337",
    darkText: "#fecdd3",
    border: "#fb7185",
  },
  cyan: {
    key: "cyan",
    label: "Cyan",
    lightBg: "#cffaff",
    lightText: "#155e75",
    darkBg: "#164e63",
    darkText: "#a5f3fc",
    border: "#22d3ee",
  },
  violet: {
    key: "violet",
    label: "Violet",
    lightBg: "#ede9fe",
    lightText: "#5b21b6",
    darkBg: "#4c1d95",
    darkText: "#ddd6fe",
    border: "#a78bfa",
  },
  teal: {
    key: "teal",
    label: "Teal",
    lightBg: "#ccfbf1",
    lightText: "#115e59",
    darkBg: "#134e4a",
    darkText: "#99f6e4",
    border: "#2dd4bf",
  },
};

export const COLOR_TAG_KEYS: ColorTag[] = Object.keys(
  COLOR_TAG_PALETTE
) as ColorTag[];

const STORAGE_KEY = "delego_delegation_tags";

export interface DelegationTagRecord {
  label?: string;
  colorTag?: ColorTag;
}

export type DelegationTagsMap = Record<string, DelegationTagRecord>;

export function loadDelegationTags(): DelegationTagsMap {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return typeof parsed === "object" && parsed !== null ? parsed : {};
  } catch {
    return {};
  }
}

export function saveDelegationTags(tags: DelegationTagsMap): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.getItem(STORAGE_KEY);
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(tags));
  } catch {
    /* ignore localStorage errors */
  }
}

export function setDelegationTag(
  delegationId: string,
  record: DelegationTagRecord
): DelegationTagsMap {
  const current = loadDelegationTags();
  const updated = {
    ...current,
    [delegationId]: {
      ...current[delegationId],
      ...record,
    },
  };
  saveDelegationTags(updated);
  return updated;
}
