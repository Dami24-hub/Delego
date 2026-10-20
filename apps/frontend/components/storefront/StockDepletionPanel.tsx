"use client";

import { useEffect, useState } from "react";
import {
  availableToSell,
  resolveStockPhase,
  stockBadgeText,
  submitRestockRequest,
  type StockDepletionInfo,
} from "../../lib/stockDepletion";

const badgeColors: Record<string, { bg: string; fg: string }> = {
  low: { bg: "#fffbeb", fg: "#b45309" },
  backorder: { bg: "#eff6ff", fg: "#1d4ed8" },
  out_of_stock: { bg: "#fef2f2", fg: "#b91c1c" },
};

export function StockDepletionPanel({
  merchantId,
  stock,
  mode,
}: {
  merchantId: string;
  stock: StockDepletionInfo;
  mode: "card" | "detail";
}) {
  const available = availableToSell(stock);
  const phase = resolveStockPhase(stock);
  const badge = stockBadgeText(stock);
  const colors = badgeColors[phase];
  const [displayed, setDisplayed] = useState(available);
  const [dropping, setDropping] = useState(false);
  const [email, setEmail] = useState("");
  const [publicKey, setPublicKey] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (available < displayed) {
      setDropping(true);
      const timer = window.setTimeout(() => setDropping(false), 600);
      setDisplayed(available);
      return () => window.clearTimeout(timer);
    }
    setDisplayed(available);
  }, [available, displayed]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
      {badge && colors && (
        <span
          data-testid="stock-depletion-badge"
          style={{
            alignSelf: "flex-start",
            padding: "0.125rem 0.5rem",
            borderRadius: "999px",
            background: colors.bg,
            color: colors.fg,
            fontSize: "0.75rem",
            fontWeight: 700,
          }}
        >
          {badge}
        </span>
      )}
      {mode === "detail" && (
        <p
          data-testid="stock-countdown"
          style={{
            margin: 0,
            fontSize: "1.25rem",
            fontWeight: 700,
            fontVariantNumeric: "tabular-nums",
            color: dropping ? "#b91c1c" : "#111827",
          }}
        >
          {displayed} left
          {stock.reservedStock > 0 ? ` · ${stock.reservedStock} reserved` : ""}
        </p>
      )}
      {phase === "out_of_stock" && (
        <form
          onSubmit={(event) => {
            event.preventDefault();
            void submitRestockRequest({
              merchantId,
              productId: stock.productId,
              email,
              publicKey,
            }).then((result) => {
              if (!result.ok) {
                setMessage(result.message);
                return;
              }
              setDone(true);
              setMessage("We'll notify you when this item is back.");
            });
          }}
          style={{ display: "flex", flexDirection: "column", gap: "0.375rem" }}
        >
          <span style={{ fontSize: "0.8125rem", fontWeight: 600 }}>Notify Me When Available</span>
          <input
            type="email"
            aria-label="Restock email"
            placeholder="Email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            style={{ padding: "0.375rem 0.5rem", borderRadius: "0.375rem", border: "1px solid #d1d5db" }}
          />
          <input
            aria-label="Restock Stellar public key"
            placeholder="Stellar public key"
            value={publicKey}
            onChange={(event) => setPublicKey(event.target.value)}
            style={{ padding: "0.375rem 0.5rem", borderRadius: "0.375rem", border: "1px solid #d1d5db" }}
          />
          <button type="submit" disabled={done} style={{ alignSelf: "flex-start", cursor: "pointer" }}>
            Notify me
          </button>
          {message && (
            <p role="status" style={{ margin: 0, fontSize: "0.75rem", color: done ? "#047857" : "#b91c1c" }}>
              {message}
            </p>
          )}
        </form>
      )}
    </div>
  );
}
