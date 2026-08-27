"use client";

import React from "react";
import { COLOR_TAG_PALETTE, type ColorTag } from "../../lib/delegationTags";

interface DelegationTagBadgeProps {
  label?: string;
  colorTag?: ColorTag;
  className?: string;
}

export function DelegationTagBadge({
  label,
  colorTag,
  className = "",
}: DelegationTagBadgeProps) {
  if (!label && !colorTag) return null;

  const colorMeta = colorTag
    ? COLOR_TAG_PALETTE[colorTag]
    : COLOR_TAG_PALETTE.slate;
  const text = label || colorMeta.label;

  return (
    <span
      className={`delegation-tag-badge inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${className}`}
      style={{
        backgroundColor: "var(--tag-bg, " + colorMeta.lightBg + ")",
        color: "var(--tag-color, " + colorMeta.lightText + ")",
        borderColor: colorMeta.border,
      }}
      data-color-tag={colorTag || "slate"}
    >
      <span
        className="w-2 h-2 rounded-full"
        style={{ backgroundColor: colorMeta.border }}
        aria-hidden="true"
      />
      <span>{text}</span>
    </span>
  );
}
