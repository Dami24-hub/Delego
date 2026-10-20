"use client";

import { useState } from "react";
import { decimalToStroops, stroopsToDecimal } from "../../lib/productForm";
import {
  MAX_SKU_VARIANTS,
  applyBatchPrice,
  buildVariantMatrix,
  updateVariant,
  type ProductAttribute,
  type ProductVariant,
} from "../../lib/variantMatrix";

interface VariantMatrixEditorProps {
  baseSku: string;
  defaultPriceStroops: string;
  defaultStock: number;
  attributes: ProductAttribute[];
  variants: ProductVariant[];
  onChange: (attributes: ProductAttribute[], variants: ProductVariant[]) => void;
}

const inputStyle = {
  padding: "0.375rem 0.5rem",
  borderRadius: "0.375rem",
  border: "1px solid #d1d5db",
  font: "inherit",
  fontSize: "0.8125rem",
} as const;

export function VariantMatrixEditor({
  baseSku,
  defaultPriceStroops,
  defaultStock,
  attributes,
  variants,
  onChange,
}: VariantMatrixEditorProps) {
  const [batchPrice, setBatchPrice] = useState("");
  const [valueDrafts, setValueDrafts] = useState<Record<number, string>>({});

  function rebuild(nextAttributes: ProductAttribute[]) {
    const { variants: nextVariants } = buildVariantMatrix(
      nextAttributes,
      { baseSku, priceStroops: defaultPriceStroops, stockCount: defaultStock },
      variants
    );
    onChange(nextAttributes, nextVariants);
  }

  const truncated = variants.length >= MAX_SKU_VARIANTS;

  return (
    <fieldset style={{ border: "1px solid #e5e7eb", borderRadius: "0.75rem", padding: "0.75rem" }}>
      <legend style={{ fontSize: "0.8125rem", fontWeight: 700, padding: "0 0.25rem" }}>
        Variant matrix
      </legend>
      <p style={{ margin: "0 0 0.75rem", fontSize: "0.75rem", color: "#6b7280" }}>
        Add attributes such as Size or Color. Up to {MAX_SKU_VARIANTS} SKUs are kept.
      </p>

      {attributes.map((attribute, index) => (
        <div key={index} style={{ display: "flex", flexDirection: "column", gap: "0.375rem", marginBottom: "0.75rem" }}>
          <div style={{ display: "flex", gap: "0.5rem" }}>
            <input
              aria-label={`Attribute ${index + 1} name`}
              placeholder="Attribute name"
              value={attribute.name}
              onChange={(event) => {
                const next = attributes.map((item, i) =>
                  i === index ? { ...item, name: event.target.value } : item
                );
                rebuild(next);
              }}
              style={{ ...inputStyle, flex: 1 }}
            />
            <button
              type="button"
              onClick={() => rebuild(attributes.filter((_, i) => i !== index))}
              style={{ ...inputStyle, cursor: "pointer" }}
            >
              Remove
            </button>
          </div>
          <div style={{ display: "flex", gap: "0.375rem", flexWrap: "wrap" }}>
            {attribute.values.map((value) => (
              <button
                key={value}
                type="button"
                aria-label={`Remove ${attribute.name || "attribute"} ${value}`}
                onClick={() =>
                  rebuild(
                    attributes.map((item, i) =>
                      i === index ? { ...item, values: item.values.filter((v) => v !== value) } : item
                    )
                  )
                }
                style={{ ...inputStyle, cursor: "pointer", background: "#f3f4f6" }}
              >
                {value} ×
              </button>
            ))}
          </div>
          <div style={{ display: "flex", gap: "0.5rem" }}>
            <input
              aria-label={`Add ${attribute.name || "attribute"} option`}
              placeholder="Add option"
              value={valueDrafts[index] ?? ""}
              onChange={(event) => setValueDrafts((prev) => ({ ...prev, [index]: event.target.value }))}
              onKeyDown={(event) => {
                if (event.key !== "Enter") return;
                event.preventDefault();
                const value = (valueDrafts[index] ?? "").trim();
                if (!value) return;
                rebuild(
                  attributes.map((item, i) =>
                    i === index ? { ...item, values: [...item.values, value] } : item
                  )
                );
                setValueDrafts((prev) => ({ ...prev, [index]: "" }));
              }}
              style={{ ...inputStyle, flex: 1 }}
            />
            <button
              type="button"
              onClick={() => {
                const value = (valueDrafts[index] ?? "").trim();
                if (!value) return;
                rebuild(
                  attributes.map((item, i) =>
                    i === index ? { ...item, values: [...item.values, value] } : item
                  )
                );
                setValueDrafts((prev) => ({ ...prev, [index]: "" }));
              }}
              style={{ ...inputStyle, cursor: "pointer" }}
            >
              Add option
            </button>
          </div>
        </div>
      ))}

      <button
        type="button"
        onClick={() => onChange([...attributes, { name: "", values: [] }], variants)}
        style={{ ...inputStyle, cursor: "pointer", marginBottom: "0.75rem" }}
      >
        Add attribute
      </button>

      {truncated && (
        <p role="status" style={{ color: "#b45309", fontSize: "0.75rem" }}>
          Only the first {MAX_SKU_VARIANTS} variants are kept.
        </p>
      )}

      {variants.length > 0 && (
        <>
          <div style={{ display: "flex", gap: "0.5rem", alignItems: "center", margin: "0.5rem 0" }}>
            <label style={{ fontSize: "0.75rem", fontWeight: 600 }}>
              Batch price
              <input
                aria-label="Batch price"
                inputMode="decimal"
                value={batchPrice}
                placeholder="0.00"
                onChange={(event) => setBatchPrice(event.target.value)}
                style={{ ...inputStyle, marginLeft: "0.5rem", width: "6rem" }}
              />
            </label>
            <button
              type="button"
              onClick={() => {
                const stroops = decimalToStroops(batchPrice);
                if (stroops === null) return;
                onChange(attributes, applyBatchPrice(variants, stroops.toString()));
              }}
              style={{ ...inputStyle, cursor: "pointer" }}
            >
              Apply to all
            </button>
          </div>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.75rem" }}>
              <thead>
                <tr style={{ textAlign: "left" }}>
                  <th style={{ padding: "0.25rem" }}>SKU</th>
                  <th style={{ padding: "0.25rem" }}>Options</th>
                  <th style={{ padding: "0.25rem" }}>Price</th>
                  <th style={{ padding: "0.25rem" }}>Stock</th>
                  <th style={{ padding: "0.25rem" }}>Barcode</th>
                </tr>
              </thead>
              <tbody>
                {variants.map((variant) => (
                  <tr key={variant.sku}>
                    <td style={{ padding: "0.25rem" }}>{variant.sku}</td>
                    <td style={{ padding: "0.25rem" }}>
                      {Object.entries(variant.attributes)
                        .map(([name, value]) => `${name}: ${value}`)
                        .join(", ")}
                    </td>
                    <td style={{ padding: "0.25rem" }}>
                      <input
                        aria-label={`Price for ${variant.sku}`}
                        defaultValue={stroopsToDecimal(variant.priceStroops)}
                        key={`${variant.sku}-${variant.priceStroops}`}
                        onBlur={(event) => {
                          const stroops = decimalToStroops(event.target.value);
                          if (stroops === null) return;
                          onChange(
                            attributes,
                            updateVariant(variants, variant.sku, { priceStroops: stroops.toString() })
                          );
                        }}
                        style={{ ...inputStyle, width: "5.5rem" }}
                      />
                    </td>
                    <td style={{ padding: "0.25rem" }}>
                      <input
                        aria-label={`Stock for ${variant.sku}`}
                        type="number"
                        min={0}
                        step={1}
                        value={variant.stockCount}
                        onChange={(event) => {
                          const stockCount = Number(event.target.value);
                          if (!Number.isInteger(stockCount) || stockCount < 0) return;
                          onChange(attributes, updateVariant(variants, variant.sku, { stockCount }));
                        }}
                        style={{ ...inputStyle, width: "4.5rem" }}
                      />
                    </td>
                    <td style={{ padding: "0.25rem" }}>
                      <input
                        aria-label={`Barcode for ${variant.sku}`}
                        value={variant.barcode ?? ""}
                        onChange={(event) =>
                          onChange(
                            attributes,
                            updateVariant(variants, variant.sku, {
                              barcode: event.target.value || undefined,
                            })
                          )
                        }
                        style={{ ...inputStyle, width: "6rem" }}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </fieldset>
  );
}
