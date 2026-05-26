function Settings() {
  return (
    <div className="admin-panel">
      <p className="admin-eyebrow">Settings</p>
      <h1>System Settings</h1>
      <p className="admin-muted">Environment, conference defaults, permissions and security controls will be expanded in upcoming phases.</p>
      <div className="admin-settings-grid">
        <div><strong>Auth</strong><span>JWT + HTTP-only cookie ready</span></div>
        <div><strong>RBAC</strong><span>Role permissions seeded</span></div>
        <div><strong>Database</strong><span>MySQL schema auto-created</span></div>
      </div>
    </div>
  );
}

export default Settings;
