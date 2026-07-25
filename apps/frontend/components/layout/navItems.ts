/** Shared primary navigation items for the sidebar and mobile nav. */

export interface NavItem {
  label: string;
  href: string;
  /** Emoji icon — TODO: replace with design-system icon set */
  icon: string;
}

export const navItems: NavItem[] = [
  { label: "Dashboard", href: "/", icon: "🏠" },
  { label: "Delegations", href: "/delegations", icon: "🤝" },
  { label: "Orders", href: "/orders", icon: "📦" },
  { label: "Wallet", href: "/wallet", icon: "👛" },
  { label: "Settings", href: "/settings", icon: "⚙️" },
];
