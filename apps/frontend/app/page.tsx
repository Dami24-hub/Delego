import { Button, Card } from "@delego/ui";

/** Dashboard landing page for the main Delego experience. */
export default function HomePage() {
  return (
    <div className="settings-page">
      <header className="header">
        <h1>Delego</h1>
        <p>AI commerce with approval and spending controls</p>
      </header>

      <section className="grid">
        <Card title="Delegations">
          <p>Grant AI agents scoped shopping authority.</p>
          {/* TODO: List active delegations */}
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
    </div>
  );
}
