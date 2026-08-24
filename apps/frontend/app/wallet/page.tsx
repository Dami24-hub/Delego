"use client";

import { useCallback, useEffect, useState } from "react";
import { Card } from "@delegolabs/ui";
import { useWallet } from "../../hooks/useWallet";
import { useNetwork } from "../../hooks/useNetwork";
import { useNotifications } from "../../hooks/useNotifications";
import { WalletConnectButton } from "../../components/wallet/WalletConnectButton";

const STATUS_LABEL: Record<string, string> = {
  checking: "Checking for Freighter…",
  unavailable: "Freighter extension not detected",
  disconnected: "Not connected",
  connecting: "Connecting…",
  connected: "Connected",
  error: "Connection error",
};

type AccountBalance = {
  asset_type: string;
  balance: string;
};

function readNativeBalance(records: AccountBalance[] | undefined): number {
  const native = records?.find((entry) => entry.asset_type === "native");
  return native ? Number(native.balance) : 0;
}

export default function WalletPage() {
  const { status, address, network, networkPassphrase, error } = useWallet();
  const { network: activeNetwork } = useNetwork();
  const notifications = useNotifications();
  const [balance, setBalance] = useState<number | null>(null);
  const [balanceStatus, setBalanceStatus] = useState<"idle" | "loading" | "error">("idle");
  const [funding, setFunding] = useState(false);
  const [fundError, setFundError] = useState<string | null>(null);

  const loadBalance = useCallback(async () => {
    if (!address || activeNetwork.isLive) {
      setBalance(null);
      setBalanceStatus("idle");
      return;
    }

    setBalanceStatus("loading");
    try {
      const response = await fetch(
        `${activeNetwork.horizonUrl}/accounts/${encodeURIComponent(address)}`
      );

      if (response.status === 404) {
        setBalance(0);
        setBalanceStatus("idle");
        return;
      }

      if (!response.ok) {
        throw new Error("Could not read account balance");
      }

      const account = (await response.json()) as { balances?: AccountBalance[] };
      setBalance(readNativeBalance(account.balances));
      setBalanceStatus("idle");
    } catch {
      setBalance(null);
      setBalanceStatus("error");
    }
  }, [activeNetwork.horizonUrl, activeNetwork.isLive, address]);

  useEffect(() => {
    void loadBalance();
  }, [loadBalance]);

  async function fundAccount() {
    if (!address || funding) return;

    setFunding(true);
    setFundError(null);
    try {
      const response = await fetch(
        `https://friendbot.stellar.org?addr=${encodeURIComponent(address)}`
      );

      if (!response.ok) {
        throw new Error(
          response.status === 429
            ? "Friendbot is rate limiting this account. Please wait a minute and try again."
            : "Friendbot could not fund this account. Please try again."
        );
      }

      await loadBalance();
      notifications.add({
        type: "success",
        title: "Testnet account funded",
        message: "Friendbot sent test XLM to your connected wallet.",
      });
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Friendbot could not fund this account. Please try again.";
      setFundError(message);
      notifications.add({ type: "error", title: "Funding failed", message });
    } finally {
      setFunding(false);
    }
  }

  const showFriendbotCard =
    status === "connected" &&
    !!address &&
    !activeNetwork.isLive &&
    balanceStatus !== "loading" &&
    balance === 0;

  return (
    <div className="settings-page">
      <header className="header">
        <h1>Wallet</h1>
        <p>Connect your Stellar wallet via the Freighter browser extension</p>
      </header>

      <Card title="Connection" ariaLabel="Wallet connection status">
        <div className="settings-section">
          <div className="wallet-status-row">
            <span
              className={`status-badge status-${
                status === "connected" ? "active" : "pending"
              }`}
            >
              {STATUS_LABEL[status] ?? status}
            </span>
          </div>

          {status === "connected" && address && (
            <dl className="wallet-detail-list">
              <div className="wallet-detail-row">
                <dt>Address</dt>
                <dd style={{ fontFamily: "monospace" }}>{address}</dd>
              </div>
              <div className="wallet-detail-row">
                <dt>Network</dt>
                <dd>{network ?? "Unknown"}</dd>
              </div>
              {!activeNetwork.isLive && balance !== null && (
                <div className="wallet-detail-row">
                  <dt>Testnet balance</dt>
                  <dd>{balance.toLocaleString(undefined, { maximumFractionDigits: 7 })} XLM</dd>
                </div>
              )}
              {networkPassphrase && (
                <div className="wallet-detail-row">
                  <dt>Passphrase</dt>
                  <dd style={{ fontFamily: "monospace", fontSize: "0.8125rem" }}>
                    {networkPassphrase}
                  </dd>
                </div>
              )}
            </dl>
          )}

          {status !== "connected" && error && (
            <p className="settings-status error" role="alert">
              {error}
            </p>
          )}

          {status === "unavailable" && (
            <p className="settings-toggle-hint">
              Install the{" "}
              <a href="https://www.freighter.app/" target="_blank" rel="noopener noreferrer">
                Freighter wallet extension
              </a>{" "}
              to connect your Stellar account to Delego.
            </p>
          )}

          {showFriendbotCard && (
            <div className="friendbot-card" role="status">
              <div>
                <h2>Fund your testnet account</h2>
                <p>
                  This connected testnet account has no XLM yet. Friendbot can send free test funds so demos and contract calls can continue.
                </p>
                {fundError && <p className="settings-status error">{fundError}</p>}
              </div>
              <button
                type="button"
                className="friendbot-button"
                onClick={fundAccount}
                disabled={funding}
              >
                {funding ? "Funding…" : "Fund your account"}
              </button>
            </div>
          )}

          {balanceStatus === "error" && !activeNetwork.isLive && (
            <p className="settings-status error" role="alert">
              Could not read the testnet balance right now.
            </p>
          )}

          <div className="form-actions">
            <WalletConnectButton showDetails={false} />
          </div>
        </div>
      </Card>

      <Card title="About Soroban Permissions">
        <p>
          Once connected, your wallet address is used to grant scoped spending
          permissions to AI agents. Delego never has access to your private
          key — every transaction is signed locally in the Freighter
          extension before it is submitted to Stellar.
        </p>
      </Card>
    </div>
  );
}
