import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  Crown,
  EllipsisVertical,
  Eye,
  Pencil,
  Plus,
  RefreshCw,
  Trash2,
  UserMinus,
  UserPlus,
  Users,
  X,
} from "lucide-react";

const emptyTeamForm = { name: "" };
const emptyMembershipForm = { teamId: "", reviewerId: "", designation: "MEMBER" };
const emptyNewReviewerForm = {
  name: "",
  email: "",
  password: "Reviewer@123",
  specialization: "",
  designation: "",
  institution: "GAIMS",
  country: "India",
  teamDesignation: "MEMBER",
};

function Modal({ children, onClose, width = 560 }) {
  return (
    <div className="admin-modal-overlay reviewer-team-modal-overlay" onMouseDown={onClose}>
      <div className="admin-panel reviewer-team-modal" style={{ maxWidth: width }} onMouseDown={(event) => event.stopPropagation()}>
        {children}
      </div>
    </div>
  );
}

function ReviewerTeams({ api, user, onReviewerUpdated }) {
  const [teams, setTeams] = useState([]);
  const [reviewers, setReviewers] = useState([]);
  const [workflowRole, setWorkflowRole] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [menuTeamId, setMenuTeamId] = useState(null);
  const [teamModal, setTeamModal] = useState(null);
  const [teamForm, setTeamForm] = useState(emptyTeamForm);
  const [membershipModal, setMembershipModal] = useState(null);
  const [membershipForm, setMembershipForm] = useState(emptyMembershipForm);
  const [addType, setAddType] = useState("existing");
  const [newReviewerForm, setNewReviewerForm] = useState(emptyNewReviewerForm);
  const [viewTeam, setViewTeam] = useState(null);
  const [deleteConfirmTeam, setDeleteConfirmTeam] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  const loadData = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [teamsResponse, reviewersResponse, roleResponse] = await Promise.all([
        api.get("/api/research/teams"),
        api.get("/api/research/reviewers").catch(() => ({ data: { reviewers: [] } })),
        api.get("/api/research/workflow-role").catch(() => ({ data: {} })),
      ]);
      setTeams(teamsResponse.data?.teams || []);
      setReviewers(reviewersResponse.data?.reviewers || []);
      setWorkflowRole(roleResponse.data || {});
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Unable to load reviewer teams.");
    } finally {
      setLoading(false);
    }
  }, [api]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadData();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [loadData]);

  const isSuperOrAdmin = useMemo(() => {
    const role = (user?.role || "").toUpperCase();
    return (
      role === "SUPER_ADMIN" ||
      role === "ADMIN" ||
      role === "SCIENTIFIC_CHAIRPERSON" ||
      role === "CHAIRPERSON" ||
      workflowRole?.isChairperson === true
    );
  }, [user, workflowRole]);

  const isLeadOnly = useMemo(() => {
    if (isSuperOrAdmin) return false;
    const role = (user?.role || "").toUpperCase();
    return (
      role === "SCIENTIFIC_TEAM_LEAD" ||
      role === "TEAM_LEAD" ||
      user?.permissions?.includes("assign_reviewers") ||
      workflowRole?.isTeamLead === true
    );
  }, [isSuperOrAdmin, user, workflowRole]);

  const leadTeamIds = useMemo(() => {
    const ids = new Set();
    if (workflowRole?.leadTeams?.length) {
      workflowRole.leadTeams.forEach((t) => ids.add(Number(t.id)));
    }
    teams.forEach((t) => {
      const isLead = t.members?.some(
        (m) =>
          m.designation === "LEAD" &&
          (m.email?.toLowerCase() === user?.email?.toLowerCase() || Number(m.user_id) === Number(user?.id))
      );
      if (isLead) ids.add(Number(t.id));
    });
    return Array.from(ids);
  }, [workflowRole, teams, user]);

  const displayedTeams = useMemo(() => {
    if (!isLeadOnly) return teams;
    if (leadTeamIds.length > 0) {
      return teams.filter((t) => leadTeamIds.includes(Number(t.id)));
    }
    return teams.slice(0, 1);
  }, [isLeadOnly, leadTeamIds, teams]);

  const myTeam = displayedTeams[0] || null;

  const membershipByReviewer = useMemo(() => {
    const map = new Map();
    teams.forEach((team) => team.members?.forEach((member) => map.set(Number(member.reviewer_id), { ...member, team })));
    return map;
  }, [teams]);

  const unassignedReviewers = reviewers.filter((reviewer) => !membershipByReviewer.has(Number(reviewer.id)));

  const openCreateTeam = () => {
    setTeamForm(emptyTeamForm);
    setTeamModal({ mode: "create" });
    setError("");
  };

  const openEditTeam = (team) => {
    setTeamForm({ name: team.name || "" });
    setTeamModal({ mode: "edit", team });
    setMenuTeamId(null);
    setError("");
  };

  const saveTeam = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      if (teamModal.mode === "create") await api.post("/api/research/teams", { name: teamForm.name });
      else await api.patch(`/api/research/teams/${teamModal.team.id}`, { name: teamForm.name });
      setTeamModal(null);
      await loadData();
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Unable to save the team.");
    } finally {
      setSaving(false);
    }
  };

  const openDeleteTeam = (team) => {
    setMenuTeamId(null);
    setDeleteError("");
    setDeleteConfirmTeam(team);
  };

  const confirmDeleteTeam = async () => {
    if (!deleteConfirmTeam) return;
    setDeleting(true);
    setDeleteError("");
    try {
      await api.delete(`/api/research/teams/${deleteConfirmTeam.id}`);
      setDeleteConfirmTeam(null);
      await loadData();
    } catch (requestError) {
      setDeleteError(requestError.response?.data?.message || "Unable to delete the team.");
    } finally {
      setDeleting(false);
    }
  };

  const openAddReviewer = (team = null) => {
    const targetTeam = team || myTeam || teams[0];
    const targetTeamId = targetTeam ? String(targetTeam.id) : "";
    setMembershipForm({
      ...emptyMembershipForm,
      teamId: targetTeamId,
      designation: "MEMBER",
    });
    setNewReviewerForm({
      ...emptyNewReviewerForm,
      teamDesignation: "MEMBER",
    });
    setAddType("existing");
    setMembershipModal({ mode: "add", defaultTeam: targetTeam });
    setMenuTeamId(null);
    setError("");
  };

  const openEditMembership = (team, member) => {
    setMembershipForm({ teamId: String(team.id), reviewerId: String(member.reviewer_id), designation: member.designation });
    setMembershipModal({ mode: "edit", sourceTeamId: team.id, member });
    setError("");
  };

  const persistMembership = async (replaceLead = false) => {
    const targetTeamId = isLeadOnly && myTeam ? String(myTeam.id) : membershipForm.teamId;
    const payload = {
      ...membershipForm,
      teamId: targetTeamId,
      designation: isLeadOnly ? "MEMBER" : (membershipForm.designation || "MEMBER"),
      replaceLead,
    };
    if (membershipModal.mode === "edit") {
      return api.patch(
        `/api/research/teams/${membershipModal.sourceTeamId}/members/${membershipForm.reviewerId}`,
        payload
      );
    }
    return api.post(`/api/research/teams/${targetTeamId}/members`, payload);
  };

  const saveMembership = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      await persistMembership(false);
      setMembershipModal(null);
      await loadData();
      onReviewerUpdated?.();
    } catch (requestError) {
      const response = requestError.response?.data;
      if (response?.code === "TEAM_LEAD_EXISTS" && window.confirm(`${response.message}\n\nReplace the existing Lead? The current Lead will become a Member.`)) {
        try {
          await persistMembership(true);
          setMembershipModal(null);
          await loadData();
          onReviewerUpdated?.();
        } catch (replacementError) {
          setError(replacementError.response?.data?.message || "Unable to replace the team Lead.");
        }
      } else if (response?.code !== "TEAM_LEAD_EXISTS") {
        setError(response?.message || "Unable to save reviewer membership.");
      }
    } finally {
      setSaving(false);
    }
  };

  const saveNewReviewer = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError("");

    const targetTeamId = isLeadOnly && myTeam ? String(myTeam.id) : membershipForm.teamId;
    if (!targetTeamId) {
      setError("Please select a team.");
      setSaving(false);
      return;
    }

    try {
      // 1. Create new reviewer profile & user credentials
      const reviewerRes = await api.post("/api/research/reviewers", {
        name: newReviewerForm.name.trim(),
        email: newReviewerForm.email.trim(),
        password: newReviewerForm.password || "Reviewer@123",
        specialization: newReviewerForm.specialization?.trim() || null,
        designation: newReviewerForm.designation?.trim() || null,
        institution: newReviewerForm.institution?.trim() || "GAIMS",
        country: newReviewerForm.country?.trim() || "India",
      });

      const newReviewerId = reviewerRes.data?.id;
      if (!newReviewerId) {
        throw new Error("Reviewer was created but ID could not be retrieved.");
      }

      // 2. Add newly created reviewer to the team with selected designation
      const addPayload = {
        reviewerId: newReviewerId,
        designation: isLeadOnly ? "MEMBER" : (newReviewerForm.teamDesignation || "MEMBER"),
        replaceLead: false,
      };

      try {
        await api.post(`/api/research/teams/${targetTeamId}/members`, addPayload);
      } catch (addError) {
        const resp = addError.response?.data;
        if (
          resp?.code === "TEAM_LEAD_EXISTS" &&
          window.confirm(`${resp.message}\n\nReplace the existing Lead? The current Lead will become a Member.`)
        ) {
          await api.post(`/api/research/teams/${targetTeamId}/members`, {
            ...addPayload,
            replaceLead: true,
          });
        } else {
          throw addError;
        }
      }

      setMembershipModal(null);
      setNewReviewerForm(emptyNewReviewerForm);
      await loadData();
      onReviewerUpdated?.();
    } catch (requestError) {
      setError(requestError.response?.data?.message || requestError.message || "Failed to create reviewer account.");
    } finally {
      setSaving(false);
    }
  };

  const removeMember = async (team, member) => {
    if (!window.confirm(`Remove ${member.name} from ${team.name}? Existing abstract assignments and reviews will remain unchanged.`)) return;
    try {
      await api.delete(`/api/research/teams/${team.id}/members/${member.reviewer_id}`);
      await loadData();
      onReviewerUpdated?.();
    } catch (requestError) {
      window.alert(requestError.response?.data?.message || "Unable to remove the reviewer.");
    }
  };

  const reviewerOptions = membershipModal?.mode === "edit"
    ? reviewers
    : reviewers.filter((reviewer) => !membershipByReviewer.has(Number(reviewer.id)));

  return (
    <div className="reviewer-teams-page">
      <section className="admin-panel reviewer-teams-header">
        <div>
          <span className="reviewer-teams-eyebrow">
            <Users size={14} /> {isLeadOnly ? "My Reviewer Team" : "Reviewer Assignment"}
          </span>
          <h1>{isLeadOnly ? (myTeam?.name ? `${myTeam.name} Directory` : "My Reviewer Team") : "Reviewer Teams"}</h1>
          <p className="admin-muted">
            {isLeadOnly
              ? `Reviewers registered in ${myTeam?.name || "your team"}. You can add new members to your team below.`
              : "Organize reviewers into configurable teams without changing their abstract assignments or review history."}
          </p>
        </div>
        <div className="reviewer-team-header-actions">
          {isLeadOnly ? (
            myTeam && (
              <button type="button" className="admin-primary-button" onClick={() => openAddReviewer(myTeam)}>
                <UserPlus size={16} /> Add Team Member
              </button>
            )
          ) : (
            <button type="button" className="admin-primary-button" onClick={openCreateTeam}>
              <Plus size={16} /> Create Team
            </button>
          )}
          <button type="button" className="admin-icon-button" title="Refresh teams" onClick={loadData}>
            <RefreshCw size={16} className={loading ? "spin" : ""} />
          </button>
        </div>
      </section>

      {error && !teamModal && !membershipModal && <div className="reviewer-team-alert"><AlertCircle size={17} /> {error}</div>}

      {loading ? (
        <section className="admin-panel reviewer-teams-empty">Loading reviewer teams...</section>
      ) : displayedTeams.length === 0 ? (
        <section className="admin-panel reviewer-teams-empty">
          <Users size={40} />
          <h2>{isLeadOnly ? "No reviewer team assigned to your account." : "No reviewer teams created yet."}</h2>
          <p className="admin-muted">
            {isLeadOnly
              ? "You are not currently designated as a Lead of any team. Please contact the Scientific Chairperson."
              : "Create the first team, then assign existing reviewer accounts as Lead or Member."}
          </p>
          {!isLeadOnly && (
            <button type="button" className="admin-primary-button" onClick={openCreateTeam}>
              <Plus size={16} /> Create Team
            </button>
          )}
        </section>
      ) : (
        <section className="reviewer-team-grid" aria-label="Reviewer teams">
          {displayedTeams.map((team) => (
            <article className="reviewer-team-card" key={team.id}>
              <header>
                <div>
                  <span>{Number(team.member_count)} {Number(team.member_count) === 1 ? "Reviewer" : "Reviewers"}</span>
                  <h2>{team.name}</h2>
                  {team.description && <p>{team.description}</p>}
                </div>
                <div className="reviewer-team-menu-wrap">
                  {!isLeadOnly ? (
                    <>
                      <button type="button" className="admin-icon-button" aria-label={`Manage ${team.name}`} onClick={() => setMenuTeamId(menuTeamId === team.id ? null : team.id)}>
                        <EllipsisVertical size={18} />
                      </button>
                      {menuTeamId === team.id && (
                        <div className="reviewer-team-menu">
                          <button type="button" onClick={() => { setViewTeam(team); setMenuTeamId(null); }}>
                            <Eye size={14} /> View Team
                          </button>
                          <button type="button" onClick={() => openEditTeam(team)}>
                            <Pencil size={14} /> Edit / Rename
                          </button>
                          <button type="button" onClick={() => openAddReviewer(team)}>
                            <UserPlus size={14} /> Add Reviewer
                          </button>
                          <button type="button" className="danger" onClick={() => openDeleteTeam(team)}>
                            <Trash2 size={14} /> Delete Team
                          </button>
                        </div>
                      )}
                    </>
                  ) : (
                    <button
                      type="button"
                      className="admin-secondary-button"
                      style={{ fontSize: "0.8rem", padding: "0.3rem 0.65rem", display: "inline-flex", alignItems: "center", gap: "0.35rem" }}
                      onClick={() => openAddReviewer(team)}
                    >
                      <UserPlus size={14} /> Add Member
                    </button>
                  )}
                </div>
              </header>

              <div className="reviewer-team-members">
                {!team.members?.length ? (
                  <div className="reviewer-team-card-empty">No reviewers assigned yet.</div>
                ) : team.members.map((member) => (
                  <div className={`reviewer-team-member ${member.designation === "LEAD" ? "is-lead" : ""}`} key={member.reviewer_id}>
                    <div className="reviewer-team-avatar">{member.designation === "LEAD" ? <Crown size={16} /> : (member.name || "R").charAt(0)}</div>
                    <div className="reviewer-team-member-copy">
                      <strong>{member.name}</strong>
                      <span>{member.designation === "LEAD" ? "Lead" : "Member"} · {member.email}</span>
                    </div>
                    <div className="reviewer-team-member-actions">
                      {!isLeadOnly && (
                        <button type="button" title="Edit membership" onClick={() => openEditMembership(team, member)}>
                          <Pencil size={14} />
                        </button>
                      )}
                      {(!isLeadOnly || member.designation !== "LEAD") && (
                        <button type="button" title="Remove reviewer" onClick={() => removeMember(team, member)}>
                          <UserMinus size={14} />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <button type="button" className="reviewer-team-add-button" onClick={() => openAddReviewer(team)}>
                <UserPlus size={15} /> Add Member to {team.name}
              </button>
            </article>
          ))}
        </section>
      )}

      {!isLeadOnly && unassignedReviewers.length > 0 && (
        <section className="admin-panel reviewer-unassigned-panel">
          <div>
            <h2>Unassigned Reviewers</h2>
            <p className="admin-muted">{unassignedReviewers.length} reviewer account{unassignedReviewers.length === 1 ? "" : "s"} currently outside a team.</p>
          </div>
          <button type="button" className="admin-secondary-button" onClick={() => openAddReviewer()}>
            <UserPlus size={15} /> Assign Reviewer
          </button>
        </section>
      )}

      {teamModal && (
        <Modal onClose={() => !saving && setTeamModal(null)}>
          <div className="reviewer-team-modal-header">
            <div><h2>{teamModal.mode === "create" ? "Create Reviewer Team" : "Edit Reviewer Team"}</h2><p>Team names are configurable and must be unique.</p></div>
            <button type="button" className="admin-icon-button" onClick={() => setTeamModal(null)}><X size={18} /></button>
          </div>
          {error && <div className="reviewer-team-alert"><AlertCircle size={16} /> {error}</div>}
          <form className="reviewer-team-form" onSubmit={saveTeam}>
            <label>Team Name *<input required maxLength={150} value={teamForm.name} onChange={(event) => setTeamForm({ ...teamForm, name: event.target.value })} placeholder="e.g. Alpha" autoFocus /></label>
            <div className="reviewer-team-form-actions"><button type="button" className="admin-secondary-button" onClick={() => setTeamModal(null)}>Cancel</button><button type="submit" className="admin-primary-button" disabled={saving}>{saving ? "Saving..." : teamModal.mode === "create" ? "Create Team" : "Save Changes"}</button></div>
          </form>
        </Modal>
      )}

      {membershipModal && (
        <Modal
          onClose={() => !saving && setMembershipModal(null)}
          width={membershipModal.mode === "add" && addType === "new" ? 640 : 540}
        >
          <div className="reviewer-team-modal-header">
            <div>
              <h2>{membershipModal.mode === "edit" ? "Edit Team Assignment" : "Add Reviewer"}</h2>
              <p>
                {membershipModal.mode === "edit"
                  ? "Update team designation or reassign to another team."
                  : "Add an existing reviewer or create a new reviewer ID."}
              </p>
            </div>
            <button type="button" className="admin-icon-button" onClick={() => !saving && setMembershipModal(null)}>
              <X size={18} />
            </button>
          </div>

          {membershipModal.mode === "add" && (
            <div className="reviewer-add-type-toggle">
              <button
                type="button"
                className={`reviewer-add-type-btn ${addType === "existing" ? "active" : ""}`}
                onClick={() => {
                  setAddType("existing");
                  setError("");
                }}
              >
                <Users size={16} />
                <span>Add Existing</span>
              </button>
              <button
                type="button"
                className={`reviewer-add-type-btn ${addType === "new" ? "active" : ""}`}
                onClick={() => {
                  setAddType("new");
                  setError("");
                }}
              >
                <UserPlus size={16} />
                <span>Add New</span>
              </button>
            </div>
          )}

          {error && (
            <div className="reviewer-team-alert" style={{ marginTop: "0.85rem" }}>
              <AlertCircle size={16} /> {error}
            </div>
          )}

          {membershipModal.mode === "add" && addType === "new" ? (
            /* EXPANDED FORM: CREATE NEW REVIEWER ID */
            <form className="reviewer-team-form" onSubmit={saveNewReviewer}>
              <label>
                Team *
                {isLeadOnly ? (
                  <input
                    disabled
                    value={myTeam?.name || "Your Team"}
                    style={{ background: "#f9fafb", cursor: "not-allowed", fontWeight: 600 }}
                  />
                ) : (
                  <select
                    required
                    value={membershipForm.teamId}
                    onChange={(event) => setMembershipForm({ ...membershipForm, teamId: event.target.value })}
                  >
                    <option value="">Select Team</option>
                    {teams.map((team) => (
                      <option value={team.id} key={team.id}>
                        {team.name}
                      </option>
                    ))}
                  </select>
                )}
              </label>

              <div className="reviewer-team-grid-2">
                <label>
                  Full Name *
                  <input
                    type="text"
                    required
                    placeholder="e.g. Dr. Rajesh Patel"
                    value={newReviewerForm.name}
                    onChange={(e) => setNewReviewerForm({ ...newReviewerForm, name: e.target.value })}
                    autoFocus
                  />
                </label>

                <label>
                  Email Address *
                  <input
                    type="email"
                    required
                    placeholder="e.g. rajesh.patel@gaims.org"
                    value={newReviewerForm.email}
                    onChange={(e) => setNewReviewerForm({ ...newReviewerForm, email: e.target.value })}
                  />
                </label>
              </div>

              <div className="reviewer-team-grid-2">
                <label>
                  Specialization
                  <input
                    type="text"
                    placeholder="e.g. Cardiology, Public Health"
                    value={newReviewerForm.specialization}
                    onChange={(e) => setNewReviewerForm({ ...newReviewerForm, specialization: e.target.value })}
                  />
                </label>

                <label>
                  Designation / Title
                  <input
                    type="text"
                    placeholder="e.g. Associate Professor, Consultant"
                    value={newReviewerForm.designation}
                    onChange={(e) => setNewReviewerForm({ ...newReviewerForm, designation: e.target.value })}
                  />
                </label>
              </div>

              <div className="reviewer-team-grid-2">
                <label>
                  Institution / Hospital
                  <input
                    type="text"
                    placeholder="e.g. GAIMS"
                    value={newReviewerForm.institution}
                    onChange={(e) => setNewReviewerForm({ ...newReviewerForm, institution: e.target.value })}
                  />
                </label>

                <label>
                  Temporary Password
                  <input
                    type="text"
                    placeholder="Reviewer@123"
                    value={newReviewerForm.password}
                    onChange={(e) => setNewReviewerForm({ ...newReviewerForm, password: e.target.value })}
                  />
                </label>
              </div>

              {isLeadOnly ? (
                <div style={{ padding: "0.75rem 1rem", background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: "8px", display: "flex", alignItems: "center", gap: "0.6rem" }}>
                  <Users size={18} color="#16a34a" />
                  <div>
                    <strong style={{ color: "#166534", fontSize: "0.88rem", display: "block" }}>Adding as Reviewer Member</strong>
                    <span style={{ color: "#15803d", fontSize: "0.78rem" }}>New reviewer will be added to your team ({myTeam?.name}) to evaluate assigned abstracts.</span>
                  </div>
                </div>
              ) : (
                <div>
                  <span style={{ display: "block", color: "#374151", fontSize: "0.84rem", fontWeight: 700, marginBottom: "0.45rem" }}>
                    Role in Team *
                  </span>
                  <div className="reviewer-role-picker">
                    <label className={`reviewer-role-card ${newReviewerForm.teamDesignation === "MEMBER" ? "selected" : ""}`}>
                      <input
                        type="radio"
                        name="newReviewerDesignation"
                        value="MEMBER"
                        checked={newReviewerForm.teamDesignation === "MEMBER"}
                        onChange={() => setNewReviewerForm({ ...newReviewerForm, teamDesignation: "MEMBER" })}
                      />
                      <div className="reviewer-role-card-body">
                        <div className="reviewer-role-card-title">
                          <Users size={16} />
                          <strong>Member</strong>
                        </div>
                        <span className="reviewer-role-card-desc">Review assigned abstracts for this team</span>
                      </div>
                    </label>

                    <label className={`reviewer-role-card ${newReviewerForm.teamDesignation === "LEAD" ? "selected" : ""}`}>
                      <input
                        type="radio"
                        name="newReviewerDesignation"
                        value="LEAD"
                        checked={newReviewerForm.teamDesignation === "LEAD"}
                        onChange={() => setNewReviewerForm({ ...newReviewerForm, teamDesignation: "LEAD" })}
                      />
                      <div className="reviewer-role-card-body">
                        <div className="reviewer-role-card-title">
                          <Crown size={16} style={{ color: "#b45309" }} />
                          <strong>Team Lead</strong>
                        </div>
                        <span className="reviewer-role-card-desc">Leads and coordinates reviewer assignments</span>
                      </div>
                    </label>
                  </div>
                </div>
              )}

              <div className="reviewer-team-form-actions">
                <button type="button" className="admin-secondary-button" onClick={() => setMembershipModal(null)}>
                  Cancel
                </button>
                <button type="submit" className="admin-primary-button" disabled={saving}>
                  <UserPlus size={15} />
                  {saving ? "Creating & Adding..." : "Create & Add Reviewer"}
                </button>
              </div>
            </form>
          ) : (
            /* EXISTING REVIEWER FORM (or EDIT FORM) */
            <form className="reviewer-team-form" onSubmit={saveMembership}>
              <label>
                Team *
                {isLeadOnly ? (
                  <input
                    disabled
                    value={myTeam?.name || "Your Team"}
                    style={{ background: "#f9fafb", cursor: "not-allowed", fontWeight: 600 }}
                  />
                ) : (
                  <select
                    required
                    value={membershipForm.teamId}
                    onChange={(event) => setMembershipForm({ ...membershipForm, teamId: event.target.value })}
                  >
                    <option value="">Select Team</option>
                    {teams.map((team) => (
                      <option value={team.id} key={team.id}>
                        {team.name}
                      </option>
                    ))}
                  </select>
                )}
              </label>

              <label>
                Reviewer *
                {membershipModal.mode === "edit" ? (
                  <input
                    disabled
                    value={`${membershipModal.member?.name || ""} — ${membershipModal.member?.email || ""}`}
                    style={{ background: "#f9fafb", cursor: "not-allowed" }}
                  />
                ) : (
                  <select
                    required
                    value={membershipForm.reviewerId}
                    onChange={(event) => setMembershipForm({ ...membershipForm, reviewerId: event.target.value })}
                  >
                    <option value="">Select Existing Reviewer</option>
                    {reviewerOptions.map((reviewer) => (
                      <option value={reviewer.id} key={reviewer.id}>
                        {reviewer.name} — {reviewer.email} {reviewer.institution ? `(${reviewer.institution})` : ""}
                      </option>
                    ))}
                  </select>
                )}
              </label>

              {reviewerOptions.length === 0 && membershipModal.mode !== "edit" && (
                <p className="reviewer-team-help">
                  All existing reviewers are already assigned to a team. Switch to "Add New" above to register a new ID.
                </p>
              )}

              {isLeadOnly ? (
                <div style={{ padding: "0.75rem 1rem", background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: "8px", display: "flex", alignItems: "center", gap: "0.6rem" }}>
                  <Users size={18} color="#16a34a" />
                  <div>
                    <strong style={{ color: "#166534", fontSize: "0.88rem", display: "block" }}>Adding as Reviewer Member</strong>
                    <span style={{ color: "#15803d", fontSize: "0.78rem" }}>Reviewer will join your team ({myTeam?.name}) as a reviewing member.</span>
                  </div>
                </div>
              ) : (
                <div>
                  <span style={{ display: "block", color: "#374151", fontSize: "0.84rem", fontWeight: 700, marginBottom: "0.45rem" }}>
                    Role in Team *
                  </span>
                  <div className="reviewer-role-picker">
                    <label className={`reviewer-role-card ${membershipForm.designation === "MEMBER" ? "selected" : ""}`}>
                      <input
                        type="radio"
                        name="membershipDesignation"
                        value="MEMBER"
                        checked={membershipForm.designation === "MEMBER"}
                        onChange={() => setMembershipForm({ ...membershipForm, designation: "MEMBER" })}
                      />
                      <div className="reviewer-role-card-body">
                        <div className="reviewer-role-card-title">
                          <Users size={16} />
                          <strong>Member</strong>
                        </div>
                        <span className="reviewer-role-card-desc">Review assigned abstracts for this team</span>
                      </div>
                    </label>

                    <label className={`reviewer-role-card ${membershipForm.designation === "LEAD" ? "selected" : ""}`}>
                      <input
                        type="radio"
                        name="membershipDesignation"
                        value="LEAD"
                        checked={membershipForm.designation === "LEAD"}
                        onChange={() => setMembershipForm({ ...membershipForm, designation: "LEAD" })}
                      />
                      <div className="reviewer-role-card-body">
                        <div className="reviewer-role-card-title">
                          <Crown size={16} style={{ color: "#b45309" }} />
                          <strong>Team Lead</strong>
                        </div>
                        <span className="reviewer-role-card-desc">Leads and coordinates reviewer assignments</span>
                      </div>
                    </label>
                  </div>
                </div>
              )}

              <div className="reviewer-team-form-actions">
                <button type="button" className="admin-secondary-button" onClick={() => setMembershipModal(null)}>
                  Cancel
                </button>
                <button
                  type="submit"
                  className="admin-primary-button"
                  disabled={saving || (reviewerOptions.length === 0 && membershipModal.mode !== "edit")}
                >
                  {saving ? "Saving..." : membershipModal.mode === "edit" ? "Save Assignment" : "Add to Team"}
                </button>
              </div>
            </form>
          )}
        </Modal>
      )}

      {viewTeam && (
        <Modal onClose={() => setViewTeam(null)} width={680}>
          <div className="reviewer-team-modal-header"><div><h2>{viewTeam.name}</h2><p>{viewTeam.description || "Reviewer team details"}</p></div><button type="button" className="admin-icon-button" onClick={() => setViewTeam(null)}><X size={18} /></button></div>
          <div className="reviewer-team-view-list">
            {!viewTeam.members?.length ? <p className="admin-muted">No reviewers assigned yet.</p> : viewTeam.members.map((member) => <div key={member.reviewer_id}><span className={member.designation === "LEAD" ? "lead" : ""}>{member.designation === "LEAD" ? <Crown size={14} /> : <Users size={14} />}{member.designation === "LEAD" ? "Lead" : "Member"}</span><div><strong>{member.name}</strong><small>{member.email}</small></div></div>)}
          </div>
          <div className="reviewer-team-form-actions"><button type="button" className="admin-primary-button" onClick={() => { const team = viewTeam; setViewTeam(null); openAddReviewer(team); }}><UserPlus size={15} /> Add Reviewer</button></div>
        </Modal>
      )}

      {deleteConfirmTeam && (
        <Modal onClose={() => !deleting && setDeleteConfirmTeam(null)} width={480}>
          <div className="reviewer-team-modal-header">
            <div>
              <h2>{Number(deleteConfirmTeam.member_count) > 0 ? "Cannot Delete Team" : "Delete Team"}</h2>
              <p>
                {Number(deleteConfirmTeam.member_count) > 0
                  ? "Teams with assigned members cannot be removed."
                  : "This action will permanently delete the reviewer team."}
              </p>
            </div>
            <button
              type="button"
              className="admin-icon-button"
              onClick={() => !deleting && setDeleteConfirmTeam(null)}
              aria-label="Close"
            >
              <X size={18} />
            </button>
          </div>

          {deleteError && (
            <div className="reviewer-team-alert">
              <AlertCircle size={16} /> {deleteError}
            </div>
          )}

          <div style={{ padding: "0.75rem 0 1.25rem", color: "#374151", fontSize: "0.92rem", lineHeight: 1.5 }}>
            {Number(deleteConfirmTeam.member_count) > 0 ? (
              <p style={{ margin: 0 }}>
                <strong>{deleteConfirmTeam.name}</strong> currently has{" "}
                <strong>{Number(deleteConfirmTeam.member_count)} reviewer{Number(deleteConfirmTeam.member_count) === 1 ? "" : "s"}</strong>.
                {" "}Please remove or reassign all reviewers before deleting this team.
              </p>
            ) : (
              <p style={{ margin: 0 }}>
                Are you sure you want to delete <strong>{deleteConfirmTeam.name}</strong>? Reviewer accounts and review records will not be deleted.
              </p>
            )}
          </div>

          <div className="reviewer-team-form-actions">
            <button
              type="button"
              className="admin-secondary-button"
              onClick={() => setDeleteConfirmTeam(null)}
              disabled={deleting}
            >
              {Number(deleteConfirmTeam.member_count) > 0 ? "Close" : "Cancel"}
            </button>
            {Number(deleteConfirmTeam.member_count) === 0 && (
              <button
                type="button"
                className="admin-danger-button"
                onClick={confirmDeleteTeam}
                disabled={deleting}
              >
                <Trash2 size={15} />
                {deleting ? "Deleting..." : "Delete Team"}
              </button>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
}

export default ReviewerTeams;
