"use client";

import { useEffect, useState } from "react";
import { Button, Card } from "@delegolabs/ui";
import { listCachedReads, type CachedRead } from "../../lib/offlineCache";

/**
 * Branded offline fallback — the service worker serves this for any
 * navigation that fails with no cached copy of its own (see
 * handleNavigate in public/sw.js). Lists what's still available to read
 * from Cache Storage so "offline" isn't a dead end.
 */
export default function OfflinePage() {
  const [reads, setReads] = useState<CachedRead[] | null>(null);

  useEffect(() => {
    listCachedReads().then(setReads);
  }, []);

  return (
    <div className="settings-page">
      <header className="header">
        <h1>You&apos;re offline</h1>
        <p>
          Delego can&apos;t reach the network right now. Reconnect and reload
          to pick up where you left off — in the meantime, here&apos;s what
          you can still look at.
        </p>
      </header>

      <Card title="Available offline">
        {reads === null ? (
          <p>Checking what&apos;s cached…</p>
        ) : reads.length === 0 ? (
          <p>Nothing cached yet — visit a page while online to save it here.</p>
        ) : (
          <ul className="offline-cached-list">
            {reads.map((read) => (
              <li key={read.url}>
                <span className="offline-cached-label">{read.label}</span>
                {read.cachedAt && (
                  <span className="offline-cached-time">
                    saved {read.cachedAt.toLocaleString()}
                  </span>
                )}
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Button onClick={() => window.location.reload()}>Try again</Button>
    </div>
  );
}
