"use client";

import { useRouter } from "next/navigation";
import { Button, Card } from "@delego/ui";
import { WalletConnectButton } from "../components/wallet/WalletConnectButton";

/** Dashboard landing page for the main Delego experience. */
export default function HomePage() {
  const router = useRouter();

  return (
    <div className="settings-page">
      <header className="header">
        <h1>Delego</h1>
        <p>AI commerce with approval and spending controls</p>
      </header>

      <section className="grid">
        <Card title="Delegations">
          <p>Grant AI agents scoped shopping authority.</p>
          <Button variant="primary" onClick={() => router.push("/delegations")}>
            Manage Delegations
          </Button>
        </Card>

        <Card title="Orders">
          <p>Track purchases initiated by your agents.</p>
          {/* TODO: List recent orders */}
        </Card>

        <Card title="Wallet">
          <p>Connect your Stellar wallet.</p>
          <WalletConnectButton showDetails={false} />
        </Card>
      </section>
    </div>
  );
}
