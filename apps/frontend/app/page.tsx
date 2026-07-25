"use client";

import { Button, Card } from "@delego/ui";
import { useDelegations } from "../hooks/useDelegations";
import { ExpiryCountdown } from "../components/delegations/ExpiryCountdown";
export default function HomePage() {
  const { delegations, loading } = useDelegations();
  
  return (
    <main className="container">
      <header className="header">
        <h1>Delego</h1>
        <p>AI commerce with approval and spending controls</p>
      </header>

      <section className="grid">
        <Card title="Delegations">
          <p>Grant AI agents scoped shopping authority.</p>
          <div className="flex flex-col gap-2 mt-4 mb-4">
            {loading ? (
              <p>Loading delegations...</p>
            ) : delegations.length === 0 ? (
              <p>No active delegations.</p>
            ) : (
              delegations.map(d => (
                <div key={d.id} className="flex justify-between items-center p-2 border rounded">
                  <span>Agent: {d.agentId}</span>
                  <ExpiryCountdown expiresAt={d.policy.expiresAt} />
                </div>
              ))
            )}
          </div>
          <Button variant="primary">Create Delegation</Button>
        </Card>

        <Card title="Orders">
          <p>Track purchases initiated by your agents.</p>
          {/* TODO: List recent orders */}
        </Card>

        <Card title="Wallet">
          <p>Connect your Stellar wallet.</p>
          {/* TODO: Wallet connection via Soroban permissions */}
          <Button variant="secondary">Connect Wallet</Button>
        </Card>
      </section>
    </main>
  );
}
