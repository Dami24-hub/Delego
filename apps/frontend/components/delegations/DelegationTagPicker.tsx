"use client";

import React, { useState } from "react";
import {
  COLOR_TAG_KEYS,
  COLOR_TAG_PALETTE,
  type ColorTag,
  type DelegationTagRecord,
} from "../../lib/delegationTags";

interface DelegationTagPickerProps {
  initialTag?: DelegationTagRecord;
  onSave: (record: DelegationTagRecord) => void;
  onCancel?: () => void;
}

export function DelegationTagPicker({
  initialTag,
  onSave,
  onCancel,
}: DelegationTagPickerProps) {
  const [label, setLabel] = useState(initialTag?.label || "");
  const [selectedColor, setSelectedColor] = useState<ColorTag>(
    initialTag?.colorTag || "indigo"
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      label: label.trim() || undefined,
      colorTag: selectedColor,
    });
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="delegation-tag-picker p-3 border rounded-lg bg-surface shadow-sm space-y-3"
      style={{
        background: "var(--color-bg-surface, #ffffff)",
        borderColor: "var(--color-border, #e2e8f0)",
      }}
    >
      <div>
        <label
          htmlFor="delegation-label-input"
          className="block text-xs font-semibold text-secondary mb-1"
        >
          Delegation Label
        </label>
        <input
          id="delegation-label-input"
          type="text"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          placeholder="e.g. Groceries, Client-A"
          className="w-full px-2.5 py-1.5 text-sm border rounded focus:outline-none focus:ring-2 focus:ring-primary"
          style={{
            background: "var(--color-bg-body, #f8fafc)",
            color: "var(--color-text-primary, #0f172a)",
            borderColor: "var(--color-border, #cbd5e1)",
          }}
        />
      </div>

      <div>
        <span className="block text-xs font-semibold text-secondary mb-1.5">
          Color Tag (8 Accessible Colors)
        </span>
        <div className="grid grid-cols-4 gap-1.5">
          {COLOR_TAG_KEYS.map((key) => {
            const meta = COLOR_TAG_PALETTE[key];
            const isSelected = selectedColor === key;
            return (
              <button
                key={key}
                type="button"
                onClick={() => setSelectedColor(key)}
                aria-label={`Select ${meta.label} color tag`}
                aria-pressed={isSelected}
                className={`flex items-center gap-1.5 p-1.5 rounded text-xs font-medium border transition ${
                  isSelected ? "ring-2 ring-primary" : ""
                }`}
                style={{
                  backgroundColor: meta.lightBg,
                  color: meta.lightText,
                  borderColor: isSelected ? meta.border : "transparent",
                }}
              >
                <span
                  className="w-2.5 h-2.5 rounded-full"
                  style={{ backgroundColor: meta.border }}
                />
                <span>{meta.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-1">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="px-3 py-1 text-xs font-medium text-secondary rounded hover:bg-slate-100"
          >
            Cancel
          </button>
        )}
        <button
          type="submit"
          className="px-3 py-1 text-xs font-semibold text-white bg-primary rounded hover:bg-primary-dark transition"
        >
          Save Label
        </button>
      </div>
    </form>
  );
}
