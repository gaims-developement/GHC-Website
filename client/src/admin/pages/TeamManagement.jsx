import { Archive, ArrowLeft, Edit3, KeyRound, Plus, Search, Trash2, UserMinus, Users, Workflow } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

const emptyTeam = { name: "", description: "", icon: "", color: "#4fc3f7", isActive: true, moduleIds: [] };
const emptyMember = { name: "", email: "", phone: "", password: "", roleId: "", isActive: true };
const emptyModule = { name: "", slug: "", description: "", routeKey: "", icon: "LayoutDashboard", permissionKey: "", displayOrder: 500 };

const routeInfo = (activePage) => {
  if (activePage === "teams-create") return { mode: "create" };
  const members = activePage.match(/^team-(\d+)-members$/);
  if (members) return { mode: "members", teamId: members[1] };
  const modules = activePage.match(/^team-(\d+)-modules$/);
  if (modules) return { mode: "modules", teamId: modules[1] };
  const detail = activePage.match(/^team-(\d+)$/);
  if (detail) return { mode: "detail", teamId: detail[1] };
  return { mode: "list" };
};

function TeamManagement({ api, activePage, onNavigate }) {
  const view = routeInfo(activePage);
  const [metadata, setMetadata] = useState({ modules: [], roles: [], permissions: [] });
  const [teams, setTeams] = useState([]);
  const [team, setTeam] = useState(null);
  const [teamForm, setTeamForm] = useState(emptyTeam);
  const [memberForm, setMemberForm] = useState(emptyMember);
  const [moduleForm, setModuleForm] = useState(emptyModule);
  const [editingMember, setEditingMember] = useState(null);
  const [filters, setFilters] = useState({ search: "", status: "", sort: "created" });
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const memberRoles = useMemo(
    () => metadata.roles.filter((role) => !["SUPER_ADMIN", "ADMIN"].includes(role.name)),
    [metadata.roles]
  );

  const selectedModules = useMemo(() => new Set((teamForm.moduleIds || []).map(Number)), [teamForm.moduleIds]);

  const loadMetadata = () => api.get("/api/super-admin/metadata").then((response) => {
    setMetadata(response.data);
    const firstRole = response.data.roles.find((role) => role.name === "TEAM_ADMIN") || response.data.roles[0];
    setMemberForm((current) => ({ ...current, roleId: current.roleId || firstRole?.id || "" }));
  });

  const loadTeams = () => {
    const params = new URLSearchParams(Object.entries(filters).filter(([, value]) => value));
    return api.get(`/api/super-admin/teams?${params}`).then((response) => setTeams(response.data.teams || []));
  };

  const loadTeam = (teamId) => api.get(`/api/super-admin/teams/${teamId}`).then((response) => {
    const nextTeam = response.data.team;
    setTeam(nextTeam);
    setTeamForm({
      name: nextTeam.name || "",
      description: nextTeam.description || "",
      icon: nextTeam.icon || "",
      color: nextTeam.color || "#4fc3f7",
      isActive: nextTeam.isActive !== false,
      moduleIds: (nextTeam.modules || []).map((module) => module.id),
    });
  });

  useEffect(() => {
    loadMetadata().catch(() => setError("Unable to load teams metadata."));
  }, [api]);

  useEffect(() => {
    if (view.mode === "list" || view.mode === "members") loadTeams().catch(() => setError("Unable to load teams."));
  }, [api, filters.search, filters.status, filters.sort, view.mode]);

  useEffect(() => {
    if (view.teamId) loadTeam(view.teamId).catch(() => setError("Unable to load team."));
    let resetTimer;
    if (view.mode === "create") resetTimer = window.setTimeout(() => setTeamForm(emptyTeam), 0);
    return () => window.clearTimeout(resetTimer);
  }, [api, view.mode, view.teamId]);

  const toggleModule = (moduleId) => {
    const next = new Set(teamForm.moduleIds);
    if (next.has(moduleId)) next.delete(moduleId);
    else next.add(moduleId);
    setTeamForm({ ...teamForm, moduleIds: Array.from(next) });
  };

  const saveTeam = async (event) => {
    event.preventDefault();
    setError("");
    const response = view.mode === "create"
      ? await api.post("/api/super-admin/teams", teamForm)
      : await api.put(`/api/super-admin/teams/${view.teamId}`, teamForm);
    onNavigate(`team-${response.data.id || view.teamId}`);
  };

  const archiveTeam = async (teamId) => {
    await api.patch(`/api/super-admin/teams/${teamId}/archive`);
    loadTeams();
  };

  const deleteTeam = async (teamId) => {
    if (!window.confirm("Delete this team permanently?")) return;
    await api.delete(`/api/super-admin/teams/${teamId}`);
    onNavigate("teams");
  };

  const saveMember = async (event) => {
    event.preventDefault();
    if (editingMember) {
      await api.put(`/api/super-admin/teams/${view.teamId}/members/${editingMember.id}`, { ...memberForm, password: undefined });
    } else {
      await api.post(`/api/super-admin/teams/${view.teamId}/members`, memberForm);
    }
    setMemberForm({ ...emptyMember, roleId: memberRoles[0]?.id || "" });
    setEditingMember(null);
    setMessage(editingMember ? "Member updated." : "Member added with login credentials.");
    loadTeam(view.teamId);
  };

  const editMember = (member) => {
    setEditingMember(member);
    setMemberForm({
      name: member.name || "",
      email: member.email || "",
      phone: member.phone || "",
      password: "",
      roleId: member.roleId || memberRoles[0]?.id || "",
      isActive: member.isActive !== false,
    });
  };

  const memberAction = async (action, member, payload = {}) => {
    await api.patch(`/api/super-admin/teams/${view.teamId}/members/${member.id}/${action}`, payload);
    loadTeam(view.teamId);
  };

  const removeMember = async (member) => {
    await api.delete(`/api/super-admin/teams/${view.teamId}/members/${member.id}`);
    loadTeam(view.teamId);
  };

  const saveModules = async () => {
    await api.put(`/api/super-admin/teams/${view.teamId}`, teamForm);
    setMessage("Assigned modules updated.");
    loadTeam(view.teamId);
  };

  const createModule = async (event) => {
    event.preventDefault();
    await api.post("/api/super-admin/modules", moduleForm);
    setModuleForm(emptyModule);
    await loadMetadata();
    setMessage("Module created.");
  };

  if (view.mode === "create" || view.mode === "detail") {
    return (
      <div className="admin-speakers-page">
        <TeamHeader title={view.mode === "create" ? "Create Team" : team?.name || "Team"} onBack={() => onNavigate("teams")} />
        {view.mode === "detail" && team && (
          <section className="admin-kpi-grid">
            <article className="admin-kpi-card"><Users size={20} /><strong>{team.members?.length || 0}</strong><span>Number of Members</span></article>
            <article className="admin-kpi-card"><Workflow size={20} /><strong>{team.modules?.length || 0}</strong><span>Assigned Modules</span></article>
            <article className="admin-kpi-card"><Archive size={20} /><strong>{team.pendingTasks || 0}</strong><span>Pending Tasks</span></article>
            <article className="admin-kpi-card"><Search size={20} /><strong>{team.createdAt ? new Date(team.createdAt).toLocaleDateString() : "-"}</strong><span>Created Date</span></article>
            <article className="admin-kpi-card"><Search size={20} /><strong>{team.lastActivity ? new Date(team.lastActivity).toLocaleDateString() : "None"}</strong><span>Last Activity</span></article>
          </section>
        )}
        <section className="admin-panel">
          {message && <div className="admin-success">{message}</div>}
          {error && <div className="admin-error">{error}</div>}
          <form className="super-team-form" onSubmit={saveTeam}>
            <div className="super-form-grid">
              <label>Team Name<input value={teamForm.name} onChange={(event) => setTeamForm({ ...teamForm, name: event.target.value })} /></label>
              <label>Icon<input value={teamForm.icon} onChange={(event) => setTeamForm({ ...teamForm, icon: event.target.value })} /></label>
              <label>Theme Color<input type="color" value={teamForm.color} onChange={(event) => setTeamForm({ ...teamForm, color: event.target.value })} /></label>
              <label className="super-inline-check"><input type="checkbox" checked={teamForm.isActive} onChange={(event) => setTeamForm({ ...teamForm, isActive: event.target.checked })} /> Active</label>
            </div>
            <label className="super-full-label">Description<textarea value={teamForm.description} onChange={(event) => setTeamForm({ ...teamForm, description: event.target.value })} /></label>
            <ModulePicker modules={metadata.modules} selectedModules={selectedModules} onToggle={toggleModule} />
            <div className="speaker-form-actions">
              <button type="submit">{view.mode === "create" ? "Create team" : "Save team"}</button>
              {view.teamId && <button type="button" onClick={() => onNavigate(`team-${view.teamId}-members`)}>Members</button>}
              {view.teamId && <button type="button" onClick={() => onNavigate(`team-${view.teamId}-modules`)}>Modules</button>}
            </div>
          </form>
        </section>
      </div>
    );
  }

  if (view.mode === "members" && team) {
    return (
      <div className="admin-speakers-page">
        <TeamHeader title={`${team.name} Members`} onBack={() => onNavigate(`team-${team.id}`)} />
        <section className="admin-panel">
          {message && <div className="admin-success">{message}</div>}
          <form className="super-team-form" onSubmit={saveMember}>
            <div className="super-form-grid">
              <label>Name<input value={memberForm.name} onChange={(event) => setMemberForm({ ...memberForm, name: event.target.value })} /></label>
              <label>Email<input type="email" value={memberForm.email} onChange={(event) => setMemberForm({ ...memberForm, email: event.target.value })} /></label>
              <label>Phone<input value={memberForm.phone} onChange={(event) => setMemberForm({ ...memberForm, phone: event.target.value })} /></label>
              {!editingMember && <label>Password<input type="password" value={memberForm.password} onChange={(event) => setMemberForm({ ...memberForm, password: event.target.value })} /></label>}
              <label>Role<select value={memberForm.roleId} onChange={(event) => setMemberForm({ ...memberForm, roleId: event.target.value })}>{memberRoles.map((role) => <option key={role.id} value={role.id}>{role.name}</option>)}</select></label>
              <label className="super-inline-check"><input type="checkbox" checked={memberForm.isActive} onChange={(event) => setMemberForm({ ...memberForm, isActive: event.target.checked })} /> Active</label>
            </div>
            <div className="speaker-form-actions">
              <button type="submit">{editingMember ? "Save member" : "Add member"}</button>
              {editingMember && <button type="button" onClick={() => { setEditingMember(null); setMemberForm({ ...emptyMember, roleId: memberRoles[0]?.id || "" }); }}>Cancel</button>}
            </div>
          </form>
        </section>
        <MembersTable team={team} teams={teams} onEdit={editMember} onDeactivate={(member) => memberAction("deactivate", member)} onReset={(member) => {
          const password = window.prompt("New password");
          if (password) memberAction("password", member, { password });
        }} onTransfer={(member, teamId) => memberAction("transfer", member, { teamId })} onRemove={removeMember} />
      </div>
    );
  }

  if (view.mode === "modules" && team) {
    return (
      <div className="admin-speakers-page">
        <TeamHeader title={`${team.name} Modules`} onBack={() => onNavigate(`team-${team.id}`)} />
        <section className="admin-panel">
          {message && <div className="admin-success">{message}</div>}
          <ModulePicker modules={metadata.modules} selectedModules={selectedModules} onToggle={toggleModule} />
          <button className="admin-primary-button" type="button" onClick={saveModules}><Workflow size={18} /> Save assigned modules</button>
        </section>
        <section className="admin-panel">
          <p className="admin-eyebrow">Module Registry</p>
          <h2>Create database-driven module</h2>
          <form className="super-form-grid" onSubmit={createModule}>
            <label>Name<input value={moduleForm.name} onChange={(event) => setModuleForm({ ...moduleForm, name: event.target.value })} /></label>
            <label>Slug<input value={moduleForm.slug} onChange={(event) => setModuleForm({ ...moduleForm, slug: event.target.value })} /></label>
            <label>Description<input value={moduleForm.description} onChange={(event) => setModuleForm({ ...moduleForm, description: event.target.value })} /></label>
            <label>Route Key<input value={moduleForm.routeKey} onChange={(event) => setModuleForm({ ...moduleForm, routeKey: event.target.value })} /></label>
            <label>Permission<select value={moduleForm.permissionKey} onChange={(event) => setModuleForm({ ...moduleForm, permissionKey: event.target.value })}><option value="">Team assignment only</option>{metadata.permissions.map((permission) => <option key={permission.key} value={permission.key}>{permission.key}</option>)}</select></label>
            <button className="admin-primary-button" type="submit"><Plus size={18} /> Create module</button>
          </form>
        </section>
      </div>
    );
  }

  return (
    <div className="admin-speakers-page">
      <section className="admin-panel">
        <div className="admin-panel-heading">
          <div>
            <p className="admin-eyebrow">Teams</p>
            <h1>Team Management</h1>
            <p className="admin-muted">Create unlimited custom departments and assign database-driven modules.</p>
          </div>
          <button className="admin-primary-button" type="button" onClick={() => onNavigate("teams-create")}><Plus size={18} /> Create</button>
        </div>
        <div className="super-filter-row">
          <label><Search size={16} /><input placeholder="Search teams" value={filters.search} onChange={(event) => setFilters({ ...filters, search: event.target.value })} /></label>
          <select value={filters.status} onChange={(event) => setFilters({ ...filters, status: event.target.value })}><option value="">All</option><option value="active">Active</option><option value="inactive">Inactive</option></select>
          <select value={filters.sort} onChange={(event) => setFilters({ ...filters, sort: event.target.value })}><option value="created">Created Date</option><option value="name">Name</option><option value="members">Members</option></select>
        </div>
      </section>
      <section className="super-team-grid">
        {teams.map((item) => <TeamCard key={item.id} team={item} onOpen={() => onNavigate(`team-${item.id}`)} onArchive={() => archiveTeam(item.id)} onDelete={() => deleteTeam(item.id)} />)}
      </section>
    </div>
  );
}

function TeamHeader({ title, onBack }) {
  return (
    <section className="admin-panel">
      <button className="admin-secondary-button" type="button" onClick={onBack}><ArrowLeft size={16} /> Back</button>
      <p className="admin-eyebrow">Team</p>
      <h1>{title}</h1>
    </section>
  );
}

function ModulePicker({ modules, selectedModules, onToggle }) {
  return (
    <fieldset className="super-module-picker">
      <legend>Assigned Modules</legend>
      {modules.map((module) => (
        <label key={module.id}>
          <input type="checkbox" checked={selectedModules.has(module.id)} onChange={() => onToggle(module.id)} />
          <span>{module.name || module.label}</span>
        </label>
      ))}
    </fieldset>
  );
}

function TeamCard({ team, onOpen, onArchive, onDelete }) {
  return (
    <article className="admin-panel super-team-card">
      <button type="button" className="super-team-open" onClick={onOpen}>
        <span style={{ background: team.color || "#4fc3f7" }}>{team.icon || team.name?.slice(0, 1)}</span>
        <strong>{team.name}</strong>
        <small>{team.slug}</small>
      </button>
      <p className="admin-muted">{team.description || "No description"}</p>
      <div className="super-team-meta">
        <span>{team.memberCount} members</span>
        <span>{team.assignedModules?.length || 0} modules</span>
        <span>{team.pendingTasks || 0} pending tasks</span>
        <span>{team.lastActivity ? new Date(team.lastActivity).toLocaleDateString() : "No activity"}</span>
        <span>{team.createdAt ? new Date(team.createdAt).toLocaleDateString() : "No date"}</span>
      </div>
      <div className="speaker-actions">
        <button type="button" onClick={onOpen} aria-label="Edit team"><Edit3 size={16} /></button>
        <button type="button" onClick={onArchive} aria-label="Archive team"><Archive size={16} /></button>
        <button type="button" onClick={onDelete} aria-label="Delete team"><Trash2 size={16} /></button>
      </div>
    </article>
  );
}

function MembersTable({ team, teams, onEdit, onDeactivate, onReset, onTransfer, onRemove }) {
  return (
    <section className="admin-panel">
      <div className="speaker-table-wrap">
        <table className="speaker-table">
          <thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Status</th><th>Transfer</th><th>Actions</th></tr></thead>
          <tbody>
            {(team.members || []).map((member) => (
              <tr key={member.id}>
                <td><strong>{member.name}</strong><small>{member.phone}</small></td>
                <td>{member.email}</td>
                <td>{member.role}</td>
                <td><span className={member.isActive === false ? "status-pill rejected" : "status-pill accepted"}>{member.isActive === false ? "Inactive" : "Active"}</span></td>
                <td><select className="super-table-select" value={team.id} onChange={(event) => onTransfer(member, event.target.value)}>{teams.filter((item) => item.id !== team.id).map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></td>
                <td><div className="speaker-actions">
                  <button type="button" onClick={() => onEdit(member)}><Edit3 size={16} /></button>
                  <button type="button" onClick={() => onReset(member)}><KeyRound size={16} /></button>
                  <button type="button" onClick={() => onDeactivate(member)}><UserMinus size={16} /></button>
                  <button type="button" onClick={() => onRemove(member)}><Trash2 size={16} /></button>
                </div></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export default TeamManagement;
