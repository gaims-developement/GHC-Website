import { Key, LogIn, Plus, RefreshCw, Shield, ShieldCheck, Trash2, Users as UsersIcon } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

const emptyForm = { name: "", email: "", password: "", roleId: "" };
const boolValue = (value) => value === true || value === 1;

function Users({ user, api, onImpersonate, initialTab = "users" }) {
  const [activeTab, setActiveTab] = useState(initialTab);
  const [metadata, setMetadata] = useState({ users: [], roles: [], permissions: [] });
  const [sessions, setSessions] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [roleForm, setRoleForm] = useState({ name: "" });
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(() => {
    setLoading(true);
    setError("");
    setMessage("");

    const promises = [
      api.get("/api/super-admin/metadata").then((res) => setMetadata(res.data)).catch(() => {}),
      api.get("/api/system-admin/sessions").then((res) => setSessions(res.data.sessions || [])).catch(() => {}),
    ];

    Promise.allSettled(promises).finally(() => setLoading(false));
  }, [api]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    if (metadata.roles?.length && !form.roleId) {
      setForm((current) => ({ ...current, roleId: metadata.roles[0].id }));
    }
  }, [metadata.roles]);

  const submitUser = async (event) => {
    event.preventDefault();
    setError("");
    setMessage("");
    try {
      await api.post("/api/super-admin/users", form);
      setForm({ ...emptyForm, roleId: metadata.roles?.[0]?.id || "" });
      setMessage("User created successfully.");
      loadData();
    } catch (requestError) {
      setError(requestError.response?.data?.message || "User could not be created.");
    }
  };

  const createRole = async (event) => {
    event.preventDefault();
    setError("");
    setMessage("");
    try {
      await api.post("/api/system-admin/roles", roleForm);
      setRoleForm({ name: "" });
      setMessage("Role created successfully.");
      loadData();
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Role could not be created.");
    }
  };

  const impersonate = async (targetUser) => {
    try {
      const response = await api.post(`/api/super-admin/impersonate/${targetUser.id}`);
      onImpersonate(response.data);
    } catch (err) {
      setError(err.response?.data?.message || "Impersonation failed.");
    }
  };

  const togglePermission = async (role, permissionKey) => {
    const permissions = new Set(role.permissions || []);
    if (permissions.has(permissionKey)) permissions.delete(permissionKey);
    else permissions.add(permissionKey);

    try {
      await api.put(`/api/super-admin/roles/${role.id}/permissions`, { permissions: Array.from(permissions) });
      loadData();
    } catch (err) {
      setError(err.response?.data?.message || "Could not update permissions.");
    }
  };

  const updateUserSecurity = async (targetUser, changes) => {
    try {
      await api.put(`/api/system-admin/users/${targetUser.id}`, {
        isActive: boolValue(targetUser.is_active),
        isLocked: boolValue(targetUser.is_locked),
        forcePasswordReset: boolValue(targetUser.force_password_reset),
        ...changes,
      });
      loadData();
    } catch (err) {
      setError(err.response?.data?.message || "Could not update user security settings.");
    }
  };

  const terminateSession = async (session) => {
    try {
      await api.delete(`/api/system-admin/sessions/${session.id}`);
      setMessage("Session terminated.");
      loadData();
    } catch (err) {
      setError(err.response?.data?.message || "Could not terminate session.");
    }
  };

  const tabs = [
    { id: "users", label: "All Users", icon: UsersIcon },
    { id: "roles", label: "Roles & Permissions", icon: Shield },
    { id: "sessions", label: "Active Sessions", icon: Key },
  ];

  return (
    <div className="admin-speakers-page">
      <section className="admin-panel">
        <div className="speaker-page-top">
          <div>
            <p className="admin-eyebrow">Administration</p>
            <h1>User & Access Management</h1>
            <p className="admin-muted">Manage system users, define role-based access permissions, and monitor active sessions.</p>
          </div>
          <button className="admin-primary-button" type="button" onClick={loadData}>
            <RefreshCw size={18} /> Refresh
          </button>
        </div>

        <div className="admin-tabs" style={{ marginTop: '1.5rem', display: 'flex', gap: '1rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.5rem' }}>
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                type="button"
                className={`admin-tab ${activeTab === tab.id ? 'active' : ''}`}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.5rem 1rem',
                  background: 'none',
                  border: 'none',
                  borderBottom: activeTab === tab.id ? '2px solid #6C63FF' : '2px solid transparent',
                  color: activeTab === tab.id ? '#6C63FF' : '#64748b',
                  fontWeight: activeTab === tab.id ? '600' : '400',
                  cursor: 'pointer',
                }}
              >
                <Icon size={16} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {error && <div className="admin-error" style={{ marginTop: '1rem' }}>{error}</div>}
        {message && <div className="admin-success" style={{ marginTop: '1rem' }}>{message}</div>}
      </section>

      {activeTab === "users" && (
        <>
          <section className="admin-panel">
            <div className="admin-panel-heading">
              <div>
                <p className="admin-eyebrow">New Administrator</p>
                <h2>Create User</h2>
              </div>
              <Plus size={20} />
            </div>
            <form className="super-form-grid" onSubmit={submitUser}>
              <label>Name<input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} required /></label>
              <label>Email<input type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} required /></label>
              <label>Password<input type="password" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} required /></label>
              <label>Role
                <select value={form.roleId} onChange={(event) => setForm({ ...form, roleId: event.target.value })}>
                  {metadata.roles.map((role) => <option key={role.id} value={role.id}>{role.name}</option>)}
                </select>
              </label>
              <button className="admin-primary-button" type="submit"><ShieldCheck size={18} /> Create user</button>
            </form>
          </section>

          <section className="admin-panel">
            <div className="speaker-table-wrap">
              <table className="speaker-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Role</th>
                    <th>Active</th>
                    <th>Locked</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {metadata.users.map((cmsUser) => (
                    <tr key={cmsUser.id}>
                      <td><strong>{cmsUser.name}</strong></td>
                      <td>{cmsUser.email}</td>
                      <td><span className="status-pill">{cmsUser.role || "Unassigned"}</span></td>
                      <td>
                        <input
                          type="checkbox"
                          checked={boolValue(cmsUser.is_active !== undefined ? cmsUser.is_active : true)}
                          onChange={(e) => updateUserSecurity(cmsUser, { isActive: e.target.checked })}
                        />
                      </td>
                      <td>
                        <input
                          type="checkbox"
                          checked={boolValue(cmsUser.is_locked)}
                          onChange={(e) => updateUserSecurity(cmsUser, { isLocked: e.target.checked })}
                        />
                      </td>
                      <td>
                        {user.role === "SUPER_ADMIN" && cmsUser.id !== user.id && cmsUser.role !== "SUPER_ADMIN" && (
                          <button className="admin-secondary-button" type="button" onClick={() => impersonate(cmsUser)}>
                            <LogIn size={16} /> Impersonate
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                  {metadata.users.length === 0 && !loading && (
                    <tr><td colSpan={6}>No users found.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}

      {activeTab === "roles" && (
        <>
          <section className="admin-panel">
            <div className="admin-panel-heading">
              <div>
                <p className="admin-eyebrow">New Role</p>
                <h2>Create Role</h2>
              </div>
              <Plus size={20} />
            </div>
            <form className="super-form-grid" onSubmit={createRole}>
              <label>Role name<input value={roleForm.name} onChange={(event) => setRoleForm({ name: event.target.value })} required /></label>
              <button className="admin-primary-button" type="submit"><Plus size={18} /> Create role</button>
            </form>
          </section>

          <section className="admin-panel">
            <p className="admin-eyebrow">Permissions</p>
            <h2>Role Permission Matrix</h2>
            <div className="super-role-grid">
              {metadata.roles.map((role) => (
                <article key={role.id}>
                  <strong>{role.name}</strong>
                  <div>
                    {metadata.permissions.map((permission) => (
                      <label key={permission.key}>
                        <input
                          type="checkbox"
                          checked={(role.permissions || []).includes(permission.key)}
                          disabled={role.name === "SUPER_ADMIN"}
                          onChange={() => togglePermission(role, permission.key)}
                        />
                        <span>{permission.key}</span>
                      </label>
                    ))}
                  </div>
                </article>
              ))}
            </div>
          </section>
        </>
      )}

      {activeTab === "sessions" && (
        <section className="admin-panel">
          <p className="admin-eyebrow">Realtime Security</p>
          <h2>Active Admin Sessions</h2>
          <div className="speaker-table-wrap">
            <table className="speaker-table">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Email</th>
                  <th>Device / Browser</th>
                  <th>IP Address</th>
                  <th>Last Activity</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {sessions.map((sess) => (
                  <tr key={sess.id}>
                    <td><strong>{sess.user_name || "Admin"}</strong></td>
                    <td>{sess.email || "-"}</td>
                    <td>{sess.device || "Browser"}</td>
                    <td>{sess.ip_address || "-"}</td>
                    <td>{sess.last_activity ? new Date(sess.last_activity).toLocaleString() : "-"}</td>
                    <td>
                      <button className="admin-secondary-button" type="button" onClick={() => terminateSession(sess)}>
                        <Trash2 size={16} /> Terminate
                      </button>
                    </td>
                  </tr>
                ))}
                {sessions.length === 0 && (
                  <tr><td colSpan={6}>No other active sessions.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
}

export default Users;

