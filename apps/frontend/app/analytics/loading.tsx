export default function Loading() {
  return (
    <div className="settings-page">
      <header className="header">
        <h1>Analytics</h1>
        <p>Loading analytics...</p>
      </header>

      <section className="grid">
        <div className="card skeleton">
          <div className="skeleton-title" />
          <div className="skeleton-text" />
        </div>
        <div className="card skeleton">
          <div className="skeleton-title" />
          <div className="skeleton-text" />
        </div>
        <div className="card skeleton">
          <div className="skeleton-title" />
          <div className="skeleton-text" />
        </div>
      </section>

      <div className="card skeleton">
        <div className="skeleton-title" />
        <div className="skeleton-form">
          <div className="skeleton-input" />
          <div className="skeleton-input" />
          <div className="skeleton-input" />
        </div>
      </div>
    </div>
  );
}
