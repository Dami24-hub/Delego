/** Shared primary navigation items for the sidebar and mobile nav. */
/** Single navigation entry used by the app shell. */
export interface NavItem {
  /** Key under the "nav" namespace in messages/*.json */
  labelKey:
    | "dashboard"
    | "delegations"
    | "orders"
    | "approvals"
    | "tracking"
    | "analytics"
    | "wallet"
    | "settings";
  href: string;
  /** Emoji icon — TODO: replace with design-system icon set */
  icon: string;
}

/** Canonical navigation items for the main application shell. */
export const navItems: NavItem[] = [
  { labelKey: "dashboard", href: "/", icon: "🏠" },
  { labelKey: "delegations", href: "/delegations", icon: "🤝" },
  { labelKey: "orders", href: "/orders", icon: "📦" },
  { labelKey: "approvals", href: "/approvals", icon: "🛡️" },
  { labelKey: "tracking", href: "/tracking", icon: "🚚" },
  { labelKey: "analytics", href: "/analytics", icon: "📊" },
  { labelKey: "wallet", href: "/wallet", icon: "👛" },
  { labelKey: "settings", href: "/settings", icon: "⚙️" },
];
