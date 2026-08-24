import type { HTMLAttributes, ReactNode } from "react";

/** Semantic tone for a badge — maps to a fixed background/text color pair. */
export type BadgeTone = "info" | "success" | "warning" | "error" | "neutral";

/** Props accepted by the shared badge component. */
export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: BadgeTone;
  children: ReactNode;
}

const toneStyles: Record<BadgeTone, string> = {
  info: "background:#dbeafe;color:#1e40af",
  success: "background:#dcfce7;color:#166534",
  warning: "background:#fef3c7;color:#92400e",
  error: "background:#fee2e2;color:#dc2626",
  neutral: "background:#e5e7eb;color:#374151",
};

/** Small coloured pill for status/severity labelling — TODO: migrate to design system tokens */
export function Badge({ tone = "neutral", children, style, ...props }: BadgeProps) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        padding: "0.125rem 0.625rem",
        borderRadius: "9999px",
        fontSize: "0.75rem",
        fontWeight: 500,
        lineHeight: 1.4,
        ...Object.fromEntries(
          toneStyles[tone].split(";").map((s) => {
            const [k, v] = s.split(":");
            return [
              k.trim().replace(/-([a-z])/g, (_, c) => c.toUpperCase()),
              v?.trim(),
            ];
          }),
        ),
        ...style,
      }}
      {...props}
    >
      {children}
    </span>
  );
}
