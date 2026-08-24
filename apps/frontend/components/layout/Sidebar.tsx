"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { navItems } from "./navItems";

/**
 * Desktop sidebar navigation.
 * Hidden below the mobile breakpoint (see `.sidebar` rules in globals.css),
 * where navigation is provided by the Header + MobileNav pair instead.
 */
export function Sidebar() {
  const pathname = usePathname();
  const t = useTranslations("nav");
  const tApp = useTranslations("app");

  return (
    <aside className="sidebar" aria-label={t("primaryNavigation")}>
      <p className="sidebar-brand">{tApp("brand")}</p>
      <nav>
        <ul className="nav-list">
          {navItems.map((item) => {
            const isActive =
              item.href === "/"
                ? pathname === "/"
                : pathname.startsWith(item.href);
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`nav-link${isActive ? " active" : ""}`}
                  aria-current={isActive ? "page" : undefined}
                >
                  <span className="nav-icon" aria-hidden="true">
                    {item.icon}
                  </span>
                  {t(item.labelKey)}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </aside>
  );
}
