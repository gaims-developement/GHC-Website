import { LogIn, Plus, ShieldCheck } from "lucide-react";
import { useEffect, useState } from "react";

const emptyForm = { name: "", email: "", password: "", roleId: "" };

function Users({ user, api, onImpersonate }) {
  const [metadata, setMetadata] = useState({ users: [], roles: [], permissions: [] });
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState("");

  const load = () => {
    api.get("/api/super-admin/metadata")
      .then((response) => {
        setMetadata(response.data);
        setForm((current) => ({ ...current, roleId: current.roleId || response.data.roles?.[0]?.id || "" }));
      })
      .catch(() => setError("Unable to load users and roles."));
  };

  useEffect(load, [api]);

  const submit = async (event) => {
    event.preventDefault();
    setError("");
    try {
      await api.post("/api/super-admin/users", form);
      setForm({ ...emptyForm, roleId: metadata.roles?.[0]?.id || "" });
      load();
    } catch (requestError) {
      setError(requestError.response?.data?.message || "User could not be created.");
    }
  };

  const impersonate = async (targetUser) => {
    const response = await api.post(`/api/super-admin/impersonate/${targetUser.id}`);
    onImpersonate(response.data);
  };

  const togglePermission = async (role, permissionKey) => {
    const permissions = new Set(role.permissions || []);
    if (permissions.has(permissionKey)) permissions.delete(permissionKey);
    else permissions.add(permissionKey);

    await api.put(`/api/super-admin/roles/${role.id}/permissions`, { permissions: Array.from(permissions) });
    load();
  };

  return (
    <div className="admin-speakers-page">
      <section className="admin-panel">
        <p className="admin-eyebrow">Users</p>
        <h1>Admin Users</h1>
        <p className="admin-muted">Create role-backed CMS users and enter Team Admin dashboards with a full audit trail.</p>
        {error && <div className="admin-error">{error}</div>}
      </section>

      <section className="admin-panel">
        <div className="admin-panel-heading">
          <div>
            <p className="admin-eyebrow">Create</p>
            <h2>New user</h2>
          </div>
          <Plus size={20} />
        </div>
        <form className="super-form-grid" onSubmit={submit}>
          <label>Name<input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} /></label>
          <label>Email<input type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} /></label>
          <label>Password<input type="password" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} /></label>
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
              <tr><th>Name</th><th>Email</th><th>Role</th><th>Created</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {metadata.users.map((cmsUser) => (
                <tr key={cmsUser.id}>
                  <td><strong>{cmsUser.name}</strong></td>
                  <td>{cmsUser.email}</td>
                  <td><span className="status-pill">{cmsUser.role || "Unassigned"}</span></td>
                  <td>{cmsUser.created_at ? new Date(cmsUser.created_at).toLocaleDateString() : "-"}</td>
                  <td>
                    {user.role === "SUPER_ADMIN" && cmsUser.id !== user.id && cmsUser.role !== "SUPER_ADMIN" && (
                      <button className="admin-secondary-button" type="button" onClick={() => impersonate(cmsUser)}>
                        <LogIn size={16} /> Impersonate
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="admin-panel">
        <p className="admin-eyebrow">Permissions</p>
        <h2>Role permissions</h2>
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
    </div>
  );
}

export default Users;
