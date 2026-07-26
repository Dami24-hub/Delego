export default function Loading() {
  return (
    <div className="settings-page">
      <header className="header">
        <h1>Settings</h1>
        <p>Loading settings...</p>
      </header>

      <div className="card skeleton">
        <div className="skeleton-title" />
        <div className="skeleton-form">
          <div className="skeleton-input" />
          <div className="skeleton-input" />
          <div className="skeleton-button" />
        </div>
      </div>
    </div>
  );
}
