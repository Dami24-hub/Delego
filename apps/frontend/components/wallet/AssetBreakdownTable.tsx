/**
 * AssetBreakdownTable Component
 *
 * Renders an asset breakdown table (Asset Code, Balance, Issuer Domain via TOML lookup, Explorer link).
 * Formats numbers, handles XLM native asset, and links to stellar.expert according to network.
 */

"use client";

import type { HorizonBalance } from "../../hooks/useBalanceHistory";
import { useTomlCache } from "../../hooks/useTomlCache";

export interface AssetBreakdownTableProps {
  balances: HorizonBalance[];
  horizonUrl: string;
  isLiveNetwork: boolean;
}

function getExplorerUrl(
  assetType: string,
  assetCode?: string,
  assetIssuer?: string,
  isLive?: boolean
): string {
  const baseUrl = isLive
    ? "https://stellar.expert/explorer/public"
    : "https://stellar.expert/explorer/testnet";

  if (assetType === "native" || !assetCode || !assetIssuer) {
    return `${baseUrl}/asset/XLM`;
  }

  return `${baseUrl}/asset/${encodeURIComponent(assetCode)}-${encodeURIComponent(assetIssuer)}`;
}

export function AssetBreakdownTable({
  balances,
  horizonUrl,
  isLiveNetwork,
}: AssetBreakdownTableProps) {
  // Extract issuer IDs for non-native assets
  const issuerIds = balances
    .filter((b) => b.asset_type !== "native" && !!b.asset_issuer)
    .map((b) => b.asset_issuer!);

  const { getIssuerDomain } = useTomlCache(issuerIds, horizonUrl);

  if (!balances || balances.length === 0) {
    return null;
  }

  return (
    <div className="asset-table-wrap">
      <table className="asset-table" aria-label="Asset balances breakdown">
        <thead>
          <tr>
            <th scope="col">Asset</th>
            <th scope="col">Balance</th>
            <th scope="col">Issuer Domain</th>
            <th scope="col" className="text-right">
              Explorer
            </th>
          </tr>
        </thead>
        <tbody>
          {balances.map((item, index) => {
            const isNative = item.asset_type === "native";
            const code = isNative ? "XLM" : (item.asset_code ?? "Unknown");
            const issuer = item.asset_issuer;
            const domain = isNative
              ? "stellar.org"
              : issuer
                ? getIssuerDomain(issuer)
                : "N/A";
            const explorerUrl = getExplorerUrl(
              item.asset_type,
              item.asset_code,
              item.asset_issuer,
              isLiveNetwork
            );

            return (
              <tr key={code + (issuer ?? "") + index}>
                <td>
                  <div className="asset-code-cell">
                    <span
                      className={`asset-avatar ${isNative ? "native" : ""}`}
                    >
                      {code.slice(0, 3).toUpperCase()}
                    </span>
                    <div>
                      <span className="asset-code-badge">{code}</span>
                      {isNative && (
                        <span className="asset-subtitle">Native Token</span>
                      )}
                    </div>
                  </div>
                </td>
                <td className="font-mono">
                  {parseFloat(item.balance).toLocaleString(undefined, {
                    maximumFractionDigits: 7,
                    minimumFractionDigits: 2,
                  })}
                </td>
                <td>
                  <span className="asset-issuer-domain">{domain}</span>
                </td>
                <td className="text-right">
                  <a
                    href={explorerUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="asset-explorer-link"
                    title={`View ${code} on Stellar Expert`}
                    aria-label={`View ${code} on Stellar Expert explorer`}
                  >
                    View ↗
                  </a>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
