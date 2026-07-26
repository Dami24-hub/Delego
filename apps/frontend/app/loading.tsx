export default function Loading() {
  return (
    <div className="settings-page">
      <header className="header">
        <h1>Delego</h1>
        <p>Loading...</p>
      </header>

      <section className="grid">
        <div className="card skeleton">
          <div className="skeleton-title" />
          <div className="skeleton-text" />
          <div className="skeleton-button" />
        </div>
        <div className="card skeleton">
          <div className="skeleton-title" />
          <div className="skeleton-text" />
        </div>
        <div className="card skeleton">
          <div className="skeleton-title" />
          <div className="skeleton-text" />
          <div className="skeleton-button" />
        </div>
      </section>
    </div>
  );
}
