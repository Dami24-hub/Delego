"use client";

import { useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { navItems } from "./navItems";

export interface MobileNavProps {
  /** Whether the drawer is currently open */
  open: boolean;
  /** Called when the drawer requests to close (backdrop, close button, nav) */
  onClose: () => void;
}

/**
 * Off-canvas navigation drawer for small screens.
 * Rendered by the Header, which owns the open/close state.
 */
export function MobileNav({ open, onClose }: MobileNavProps) {
  const pathname = usePathname();

  // Close on Escape and lock body scroll while the drawer is open.
  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKeyDown);

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [open, onClose]);

  return (
    <>
      <div
        className={`mobile-nav-overlay${open ? " open" : ""}`}
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        className={`mobile-nav-panel${open ? " open" : ""}`}
        role="dialog"
        aria-modal="true"
        aria-label="Primary navigation"
        aria-hidden={!open}
      >
        <div className="mobile-nav-header">
          <span className="sidebar-brand" style={{ margin: 0, padding: 0 }}>
            Delego
          </span>
          <button
            type="button"
            className="mobile-nav-close"
            onClick={onClose}
            aria-label="Close navigation menu"
          >
            ×
          </button>
        </div>
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
                    onClick={onClose}
                    tabIndex={open ? 0 : -1}
                  >
                    <span className="nav-icon" aria-hidden="true">
                      {item.icon}
                    </span>
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </div>
    </>
  );
}
