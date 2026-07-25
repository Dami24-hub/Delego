import type { HTMLAttributes, ReactNode } from "react";

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  title?: string;
  children: ReactNode;
  /** Optional ARIA label for accessibility */
  ariaLabel?: string;
  /** Optional ARIA describedby for additional context */
  ariaDescribedBy?: string;
}

/** Simple card container with accessibility support — TODO: add variants and theming */
export function Card({
  title,
  children,
  style,
  ariaLabel,
  ariaDescribedBy,
  ...props
}: CardProps) {
  const cardId = props.id || `card-${Math.random().toString(36).slice(2, 9)}`;

  return (
    <div
      id={cardId}
      role="region"
      aria-label={ariaLabel}
      aria-describedby={ariaDescribedBy}
      style={{
        border: "1px solid #e5e7eb",
        borderRadius: "0.5rem",
        padding: "1rem",
        background: "#fff",
        ...style,
      }}
      {...props}
    >
      {title && (
        <h3
          id={`${cardId}-title`}
          style={{ margin: "0 0 0.5rem", fontSize: "1rem" }}
        >
          {title}
        </h3>
      )}
      {children}
    </div>
  );
}
