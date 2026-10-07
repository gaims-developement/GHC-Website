import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  Clock,
  ExternalLink,
  Eye,
  FileText,
  Filter,
  Microscope,
  RefreshCw,
  Send,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Star,
  UserCheck,
  UserPlus,
  Users,
  X,
} from "lucide-react";

export default function ScientificTeamLead({ api, user, onNavigate }) {
  const [roleLoading, setRoleLoading] = useState(true);
  const [workflowRole, setWorkflowRole] = useState({
    isChairperson: false,
    isTeamLead: false,
    isReviewer: false,
    leadTeams: [],
    memberTeams: [],
    allTeams: [],
  });

  // Active Lead Team
  const [selectedTeamId, setSelectedTeamId] = useState("");
  const [dataLoading, setDataLoading] = useState(false);
  const [teamAbstracts, setTeamAbstracts] = useState([]);
  const [teamMembers, setTeamMembers] = useState([]);

  // Active Queue / Tab
  const [activeTab, setActiveTab] = useState("assign"); // "assign" | "revisions" | "endorse" | "all" | "reviewers"
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");

  // Modals State
  const [assignModalAbstract, setAssignModalAbstract] = useState(null);
  const [selectedReviewerId, setSelectedReviewerId] = useState("");
  const [assignSubmitting, setAssignSubmitting] = useState(false);

  const [revisionModalAbstract, setRevisionModalAbstract] = useState(null);
  const [revisionNotes, setRevisionNotes] = useState("");
  const [decisionSubmitting, setDecisionSubmitting] = useState(false);

  const [endorseModalAbstract, setEndorseModalAbstract] = useState(null);
  const [endorseNotes, setEndorseNotes] = useState("");
  const [endorseSubmitting, setEndorseSubmitting] = useState(false);

  const [detailModalAbstract, setDetailModalAbstract] = useState(null);

  // 1. Fetch user workflow role
  useEffect(() => {
    setRoleLoading(true);
    api
      .get("/api/research/workflow-role")
      .then((res) => {
        const data = res.data || {};
        setWorkflowRole(data);
        const availableTeams = data.isChairperson && data.allTeams?.length > 0
          ? data.allTeams
          : data.leadTeams || [];
        if (availableTeams.length > 0) {
          setSelectedTeamId(String(availableTeams[0].id));
        }
      })
      .catch((err) => {
        console.error("Failed to load workflow role", err);
      })
      .finally(() => {
        setRoleLoading(false);
      });
  }, [api]);

  const availableLeadTeams = useMemo(() => {
    if (workflowRole.isChairperson && workflowRole.allTeams?.length > 0) {
      return workflowRole.allTeams;
    }
    return workflowRole.leadTeams || [];
  }, [workflowRole]);

  const currentTeam = useMemo(() => {
    return availableLeadTeams.find((t) => String(t.id) === String(selectedTeamId)) || availableLeadTeams[0] || null;
  }, [availableLeadTeams, selectedTeamId]);

  // 2. Load team data (Abstracts strictly assigned to this team & Team Reviewers)
  const loadTeamData = useCallback(async () => {
    if (!selectedTeamId) return;
    setDataLoading(true);
    try {
      const [abstractsRes, membersRes] = await Promise.all([
        api.get(`/api/research?admin=1&scope=lead&teamId=${selectedTeamId}&limit=150`).catch(() => ({ data: { submissions: [] } })),
        api.get(`/api/research/teams/${selectedTeamId}/members`).catch(() => ({ data: { members: [] } })),
      ]);
      setTeamAbstracts(abstractsRes.data?.submissions || []);
      setTeamMembers(membersRes.data?.members || []);
    } catch (err) {
      console.error("Failed to load team lead data", err);
    } finally {
      setDataLoading(false);
    }
  }, [api, selectedTeamId]);

  useEffect(() => {
    if (selectedTeamId) {
      loadTeamData();
    }
  }, [selectedTeamId, loadTeamData]);

  // 3. Queue Partitioning
  const needsAssignmentQueue = useMemo(() => {
    return teamAbstracts.filter(
      (a) =>
        a.workflowStage === "assigned_to_team" ||
        (!a.assignedReviewerId && !["accepted", "rejected"].includes(a.status))
    );
  }, [teamAbstracts]);

  const revisionRequestsQueue = useMemo(() => {
    return teamAbstracts.filter((a) => a.workflowStage === "lead_revision_requested");
  }, [teamAbstracts]);

  const awaitingEndorsementQueue = useMemo(() => {
    return teamAbstracts.filter((a) => a.workflowStage === "reviewer_reviewed");
  }, [teamAbstracts]);

  const endorsedToChairCount = useMemo(() => {
    return teamAbstracts.filter((a) => a.workflowStage === "lead_approved").length;
  }, [teamAbstracts]);

  const underReviewCount = useMemo(() => {
    return teamAbstracts.filter((a) => a.workflowStage === "assigned_to_reviewer").length;
  }, [teamAbstracts]);

  // Directory Filter
  const filteredAll = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return teamAbstracts.filter((a) => {
      if (categoryFilter !== "all" && a.category?.toLowerCase() !== categoryFilter.toLowerCase()) return false;
      if (!q) return true;
      return [a.title, a.authors, a.presentingAuthor, a.abstractId, a.category, a.track, a.assignedReviewerName]
        .join(" ")
        .toLowerCase()
        .includes(q);
    });
  }, [teamAbstracts, searchQuery, categoryFilter]);

  // 4. Action Handlers
  const handleAssignReviewerSubmit = async (e) => {
    e.preventDefault();
    if (!assignModalAbstract || !selectedReviewerId) return;
    setAssignSubmitting(true);
    try {
      await api.post(`/api/research/${assignModalAbstract.id}/reviewers`, {
        reviewerId: Number(selectedReviewerId),
      });
      setAssignModalAbstract(null);
      setSelectedReviewerId("");
      await loadTeamData();
      alert(`✓ Reviewer successfully assigned to ${assignModalAbstract.abstractId || assignModalAbstract.title}!`);
    } catch (err) {
      alert(err.response?.data?.message || "Failed to assign reviewer.");
    } finally {
      setAssignSubmitting(false);
    }
  };

  const handleRevisionDecision = async (action) => {
    if (!revisionModalAbstract) return;
    setDecisionSubmitting(true);
    try {
      const res = await api.post(`/api/research/${revisionModalAbstract.id}/lead-decision`, {
        action,
        notes: revisionNotes,
      });
      const isApproved = action === "approve_revision";
      setRevisionModalAbstract(null);
      setRevisionNotes("");
      await loadTeamData();
      if (isApproved) {
        alert(
          res.data?.emailSent
            ? `✓ Revision approved! Notification email with secure revision link sent to author.`
            : `✓ Revision approved! Status updated to Revision Requested.`
        );
      } else {
        alert("✓ Revision request dismissed. Abstract returned to reviewer.");
      }
    } catch (err) {
      alert(err.response?.data?.message || "Failed to submit revision decision.");
    } finally {
      setDecisionSubmitting(false);
    }
  };

  const handleEndorseDecision = async () => {
    if (!endorseModalAbstract) return;
    setEndorseSubmitting(true);
    try {
      await api.post(`/api/research/${endorseModalAbstract.id}/lead-decision`, {
        action: "endorse_review",
        notes: endorseNotes,
      });
      setEndorseModalAbstract(null);
      setEndorseNotes("");
      await loadTeamData();
      alert("✓ Abstract review successfully endorsed! It is now submitted to the Scientific Chairperson for final verdict.");
    } catch (err) {
      alert(err.response?.data?.message || "Failed to endorse review.");
    } finally {
      setEndorseSubmitting(false);
    }
  };

  // Render Access Denied if not team lead or chair
  if (!roleLoading && !workflowRole.isTeamLead && !workflowRole.isChairperson) {
    return (
      <div className="admin-speakers-page" style={{ padding: "2rem" }}>
        <section className="admin-panel" style={{ textAlign: "center", padding: "4rem 2rem", borderRadius: "1.25rem" }}>
          <ShieldAlert size={48} style={{ color: "#dc2626", margin: "0 auto 1rem" }} />
          <h2 style={{ fontSize: "1.5rem", fontWeight: 800, color: "#111827", margin: "0 0 0.5rem 0" }}>
            Access Restricted: Team Leader Only
          </h2>
          <p className="admin-muted" style={{ maxWidth: "540px", margin: "0 auto 1.5rem auto", fontSize: "0.95rem" }}>
            You are not currently designated as a Leader of any Scientific Reviewer Team. Only team leaders can access this dashboard to view and manage their team's assigned abstracts.
          </p>
          {onNavigate && (
            <button
              type="button"
              className="admin-primary-button"
              onClick={() => onNavigate("scientific")}
            >
              Return to Scientific Portal
            </button>
          )}
        </section>
      </div>
    );
  }

  return (
    <div className="admin-speakers-page" style={{ padding: "1.5rem 2rem" }}>
      {/* Page Header */}
      <section
        className="admin-panel"
        style={{
          padding: "1.75rem 2rem",
          borderRadius: "1.25rem",
          marginBottom: "1.5rem",
          background: "linear-gradient(135deg, #ffffff 0%, #faf8ff 100%)",
          border: "1px solid #e9d5ff",
          boxShadow: "0 4px 20px rgba(108, 74, 182, 0.05)",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "1rem" }}>
          <div>
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.4rem",
                padding: "0.25rem 0.75rem",
                borderRadius: "999px",
                background: "rgba(108,74,182,0.1)",
                color: "#6C4AB6",
                fontSize: "0.78rem",
                fontWeight: 800,
                textTransform: "uppercase",
                letterSpacing: "0.04em",
                marginBottom: "0.5rem",
              }}
            >
              <ShieldCheck size={14} /> Reviewer Team Leader Command Center
            </div>
            <h1 style={{ fontSize: "1.85rem", fontWeight: 800, margin: 0, color: "#111827", letterSpacing: "-0.02em" }}>
              {currentTeam ? `${currentTeam.name} Lead Dashboard` : "Scientific Team Lead Dashboard"}
            </h1>
            <p className="admin-muted" style={{ margin: "0.35rem 0 0 0", fontSize: "0.92rem" }}>
              Overseeing <strong>only the abstracts assigned to {currentTeam?.name || "your team"}</strong>. Allocate reviewers, authorize revisions, and endorse evaluations.
            </p>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flexWrap: "wrap" }}>
            {/* Active Team Switcher if multiple teams or Chairperson */}
            {availableLeadTeams.length > 1 && (
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", background: "#ffffff", padding: "0.4rem 0.75rem", borderRadius: "0.6rem", border: "1px solid #d1d5db" }}>
                <span style={{ fontSize: "0.82rem", fontWeight: 700, color: "#6b7280" }}>Team:</span>
                <select
                  value={selectedTeamId}
                  onChange={(e) => setSelectedTeamId(e.target.value)}
                  style={{ border: "none", background: "transparent", fontSize: "0.85rem", fontWeight: 700, color: "#6C4AB6", cursor: "pointer", outline: "none" }}
                >
                  {availableLeadTeams.map((t) => (
                    <option key={t.id} value={String(t.id)}>
                      👥 {t.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {currentTeam && availableLeadTeams.length === 1 && (
              <div style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem", padding: "0.4rem 0.85rem", background: "#ffffff", borderRadius: "0.6rem", border: "1px solid #e5e7eb", fontSize: "0.85rem", fontWeight: 700, color: "#6C4AB6" }}>
                👥 {currentTeam.name} ({teamMembers.length} Members)
              </div>
            )}

            <button
              type="button"
              className="admin-secondary-button"
              onClick={() => {
                if (onNavigate) {
                  onNavigate("scientific-team");
                } else {
                  setActiveTab("reviewers");
                }
              }}
              style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem", fontWeight: 700 }}
              title="View Scientific Team members and add reviewers"
            >
              <Users size={15} /> Scientific Team
            </button>

            <button
              type="button"
              className="admin-secondary-button"
              onClick={loadTeamData}
              title="Refresh Team Data"
              style={{ display: "inline-flex", alignItems: "center", gap: "0.35rem" }}
            >
              <RefreshCw size={14} className={dataLoading ? "spin" : ""} /> Refresh
            </button>
          </div>
        </div>
      </section>

      {/* KPI Cards Grid (Scoped Strictly to this Team) */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))", gap: "1rem", marginBottom: "1.5rem" }}>
        <div
          onClick={() => setActiveTab("all")}
          style={{
            cursor: "pointer",
            background: "#ffffff",
            border: activeTab === "all" ? "2px solid #6C4AB6" : "1px solid #e5e7eb",
            borderRadius: "1rem",
            padding: "1.1rem",
            boxShadow: "0 2px 8px rgba(0,0,0,0.03)",
            transition: "all 0.15s ease",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.4rem" }}>
            <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "#6b7280", textTransform: "uppercase" }}>Total Team Abstracts</span>
            <FileText size={16} style={{ color: "#6C4AB6" }} />
          </div>
          <div style={{ fontSize: "1.75rem", fontWeight: 800, color: "#111827" }}>{teamAbstracts.length}</div>
          <span style={{ fontSize: "0.75rem", color: "#9ca3af" }}>In your team's jurisdiction</span>
        </div>

        <div
          onClick={() => setActiveTab("assign")}
          style={{
            cursor: "pointer",
            background: "#ffffff",
            border: activeTab === "assign" ? "2px solid #2563eb" : "1px solid #e5e7eb",
            borderRadius: "1rem",
            padding: "1.1rem",
            boxShadow: "0 2px 8px rgba(0,0,0,0.03)",
            transition: "all 0.15s ease",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.4rem" }}>
            <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "#2563eb", textTransform: "uppercase" }}>Needs Reviewer</span>
            <UserPlus size={16} style={{ color: "#2563eb" }} />
          </div>
          <div style={{ fontSize: "1.75rem", fontWeight: 800, color: "#2563eb" }}>{needsAssignmentQueue.length}</div>
          <span style={{ fontSize: "0.75rem", color: "#2563eb" }}>Queue 1: Allocate members</span>
        </div>

        <div
          onClick={() => setActiveTab("revisions")}
          style={{
            cursor: "pointer",
            background: "#ffffff",
            border: activeTab === "revisions" ? "2px solid #d97706" : "1px solid #e5e7eb",
            borderRadius: "1rem",
            padding: "1.1rem",
            boxShadow: "0 2px 8px rgba(0,0,0,0.03)",
            transition: "all 0.15s ease",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.4rem" }}>
            <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "#d97706", textTransform: "uppercase" }}>Revision Requests</span>
            <AlertCircle size={16} style={{ color: "#d97706" }} />
          </div>
          <div style={{ fontSize: "1.75rem", fontWeight: 800, color: "#d97706" }}>{revisionRequestsQueue.length}</div>
          <span style={{ fontSize: "0.75rem", color: "#d97706" }}>Queue 2: Awaiting author email</span>
        </div>

        <div
          onClick={() => setActiveTab("endorse")}
          style={{
            cursor: "pointer",
            background: "#ffffff",
            border: activeTab === "endorse" ? "2px solid #7c3aed" : "1px solid #e5e7eb",
            borderRadius: "1rem",
            padding: "1.1rem",
            boxShadow: "0 2px 8px rgba(0,0,0,0.03)",
            transition: "all 0.15s ease",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.4rem" }}>
            <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "#7c3aed", textTransform: "uppercase" }}>Awaiting Endorsement</span>
            <CheckCircle2 size={16} style={{ color: "#7c3aed" }} />
          </div>
          <div style={{ fontSize: "1.75rem", fontWeight: 800, color: "#7c3aed" }}>{awaitingEndorsementQueue.length}</div>
          <span style={{ fontSize: "0.75rem", color: "#7c3aed" }}>Queue 3: Ready for Chair</span>
        </div>

        <div
          onClick={() => setActiveTab("reviewers")}
          style={{
            cursor: "pointer",
            background: "#ffffff",
            border: activeTab === "reviewers" ? "2px solid #059669" : "1px solid #e5e7eb",
            borderRadius: "1rem",
            padding: "1.1rem",
            boxShadow: "0 2px 8px rgba(0,0,0,0.03)",
            transition: "all 0.15s ease",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.4rem" }}>
            <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "#059669", textTransform: "uppercase" }}>Scientific Team</span>
            <Users size={16} style={{ color: "#059669" }} />
          </div>
          <div style={{ fontSize: "1.75rem", fontWeight: 800, color: "#059669" }}>{teamMembers.length}</div>
          <span style={{ fontSize: "0.75rem", color: "#059669" }}>Members in {currentTeam?.name || "your team"}</span>
        </div>
      </div>

      {/* Navigation Queue Tabs */}
      <div style={{ display: "flex", gap: "0.5rem", borderBottom: "1px solid #e5e7eb", marginBottom: "1.5rem" }}>
        {[
          { id: "assign", label: `Queue 1: Assign Reviewers (${needsAssignmentQueue.length})`, icon: UserPlus, color: "#2563eb" },
          { id: "revisions", label: `Queue 2: Revision Requests (${revisionRequestsQueue.length})`, icon: AlertCircle, color: "#d97706" },
          { id: "endorse", label: `Queue 3: Awaiting Endorsement (${awaitingEndorsementQueue.length})`, icon: CheckCircle2, color: "#7c3aed" },
          { id: "all", label: `All Team Abstracts (${teamAbstracts.length})`, icon: FileText, color: "#6C4AB6" },
          { id: "reviewers", label: `Scientific Team (${teamMembers.length})`, icon: Users, color: "#059669" },
        ].map((tab) => {
          const Icon = tab.icon;
          const isSelected = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.45rem",
                padding: "0.75rem 1.25rem",
                border: "none",
                background: "transparent",
                borderBottom: isSelected ? `3px solid ${tab.color}` : "3px solid transparent",
                color: isSelected ? tab.color : "#6b7280",
                fontWeight: isSelected ? 800 : 600,
                fontSize: "0.88rem",
                cursor: "pointer",
                transition: "all 0.15s ease",
              }}
            >
              <Icon size={16} /> {tab.label}
            </button>
          );
        })}
      </div>

      {/* ============================================================ */}
      {/* QUEUE 1: Assign Reviewers */}
      {/* ============================================================ */}
      {activeTab === "assign" && (
        <section className="admin-panel" style={{ margin: 0, padding: "1.75rem", borderRadius: "1rem" }}>
          <div style={{ marginBottom: "1.25rem" }}>
            <h2 style={{ fontSize: "1.2rem", fontWeight: 800, margin: "0 0 0.25rem 0", color: "#111827" }}>
              Queue 1: Abstracts Awaiting Reviewer Allocation ({needsAssignmentQueue.length})
            </h2>
            <p className="admin-muted" style={{ margin: 0, fontSize: "0.85rem" }}>
              These research abstracts have been assigned to <strong>{currentTeam?.name}</strong> by the Scientific Chairperson. Delegate them to your team's reviewers below.
            </p>
          </div>

          {needsAssignmentQueue.length === 0 ? (
            <div style={{ padding: "3.5rem 2rem", textAlign: "center", color: "#6b7280" }}>
              <CheckCircle2 size={40} style={{ margin: "0 auto 0.75rem", color: "#16a34a", opacity: 0.8 }} />
              <h3 style={{ fontSize: "1.1rem", fontWeight: 700, margin: "0 0 0.35rem 0", color: "#111827" }}>
                Queue Clear! All Team Abstracts Are Assigned
              </h3>
              <p style={{ margin: 0, fontSize: "0.85rem" }}>
                There are no pending abstracts in {currentTeam?.name} waiting for reviewer allocation.
              </p>
            </div>
          ) : (
            <div className="speaker-table-wrap">
              <table className="speaker-table">
                <thead>
                  <tr>
                    <th>Code</th>
                    <th>Title of Research</th>
                    <th>Presenting Author</th>
                    <th>Category</th>
                    <th>Status</th>
                    <th style={{ textAlign: "right" }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {needsAssignmentQueue.map((abs) => (
                    <tr key={abs.id}>
                      <td>
                        <span style={{ fontFamily: "monospace", fontWeight: 700, color: "#6C4AB6", background: "rgba(108,74,182,0.06)", padding: "0.2rem 0.5rem", borderRadius: "6px" }}>
                          {abs.abstractId || `GHC-ABS-${String(abs.id).padStart(5, "0")}`}
                        </span>
                      </td>
                      <td>
                        <strong title={abs.title} style={{ color: "#111827", maxWidth: "320px", display: "block" }}>
                          {abs.title}
                        </strong>
                      </td>
                      <td>
                        <div>{abs.presentingAuthor || abs.authors || "Not specified"}</div>
                        <span style={{ fontSize: "0.75rem", color: "#6b7280" }}>{abs.institution || "GAIMS"}</span>
                      </td>
                      <td>
                        <span style={{ fontSize: "0.8rem", color: "#4b5563" }}>
                          {abs.category || "Poster"} • {abs.track || "Scientific"}
                        </span>
                      </td>
                      <td>
                        <span style={{ fontSize: "0.75rem", fontWeight: 700, padding: "0.2rem 0.6rem", borderRadius: "999px", background: "#f0fdf4", color: "#16a34a" }}>
                          Assigned to {currentTeam?.name}
                        </span>
                      </td>
                      <td style={{ textAlign: "right" }}>
                        <div style={{ display: "inline-flex", gap: "0.4rem" }}>
                          <button
                            type="button"
                            className="admin-secondary-button"
                            style={{ padding: "0.35rem 0.65rem", fontSize: "0.8rem" }}
                            onClick={() => setDetailModalAbstract(abs)}
                          >
                            <Eye size={13} /> View
                          </button>
                          <button
                            type="button"
                            className="admin-primary-button"
                            style={{ padding: "0.35rem 0.85rem", fontSize: "0.8rem", display: "inline-flex", alignItems: "center", gap: "0.35rem" }}
                            onClick={() => {
                              setAssignModalAbstract(abs);
                              setSelectedReviewerId("");
                            }}
                          >
                            <UserPlus size={14} /> Assign Reviewer
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}

      {/* ============================================================ */}
      {/* QUEUE 2: Revision Requests */}
      {/* ============================================================ */}
      {activeTab === "revisions" && (
        <section className="admin-panel" style={{ margin: 0, padding: "1.75rem", borderRadius: "1rem" }}>
          <div style={{ marginBottom: "1.25rem" }}>
            <h2 style={{ fontSize: "1.2rem", fontWeight: 800, margin: "0 0 0.25rem 0", color: "#d97706" }}>
              Queue 2: Author Revision Requests ({revisionRequestsQueue.length})
            </h2>
            <p className="admin-muted" style={{ margin: 0, fontSize: "0.85rem" }}>
              A reviewer on your team evaluated these abstracts and requested updates from the author. Review their notes and approve dispatching an official revision email with a secure link.
            </p>
          </div>

          {revisionRequestsQueue.length === 0 ? (
            <div style={{ padding: "3.5rem 2rem", textAlign: "center", color: "#6b7280" }}>
              <CheckCircle2 size={40} style={{ margin: "0 auto 0.75rem", color: "#16a34a", opacity: 0.8 }} />
              <h3 style={{ fontSize: "1.1rem", fontWeight: 700, margin: "0 0 0.35rem 0", color: "#111827" }}>
                No Pending Revision Requests
              </h3>
              <p style={{ margin: 0, fontSize: "0.85rem" }}>
                No reviewers have flagged abstracts requiring author revision in {currentTeam?.name}.
              </p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              {revisionRequestsQueue.map((abs) => (
                <div
                  key={abs.id}
                  style={{
                    border: "1px solid #fde68a",
                    background: "#fffbeb",
                    borderRadius: "0.85rem",
                    padding: "1.25rem",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.5rem", flexWrap: "wrap", gap: "0.5rem" }}>
                    <div>
                      <span style={{ fontFamily: "monospace", fontWeight: 700, color: "#6C4AB6", marginRight: "0.5rem" }}>
                        {abs.abstractId || `GHC-ABS-${String(abs.id).padStart(5, "0")}`}
                      </span>
                      <strong style={{ fontSize: "1rem", color: "#111827" }}>{abs.title}</strong>
                    </div>
                    <span style={{ fontSize: "0.75rem", fontWeight: 700, padding: "0.2rem 0.6rem", borderRadius: "999px", background: "#fef3c7", color: "#b45309" }}>
                      ⚠️ Revision Flagged by {abs.assignedReviewerName || "Reviewer"}
                    </span>
                  </div>

                  <p style={{ fontSize: "0.85rem", color: "#4b5563", margin: "0 0 0.75rem 0" }}>
                    Author: <strong>{abs.presentingAuthor || abs.authors}</strong> ({abs.email || "No email"}) • {abs.institution || "GAIMS"}
                  </p>

                  <div style={{ background: "#ffffff", border: "1px solid #fde68a", borderRadius: "0.6rem", padding: "0.85rem", marginBottom: "1rem" }}>
                    <div style={{ fontSize: "0.78rem", fontWeight: 700, color: "#92400e", textTransform: "uppercase", marginBottom: "0.35rem" }}>
                      Reviewer's Revision Notes & Required Fixes:
                    </div>
                    <div style={{ fontSize: "0.88rem", color: "#1f2937", lineHeight: 1.5, whiteSpace: "pre-wrap" }}>
                      {abs.reviewerRevisionNotes || abs.reviewNotes || "Reviewer requested revisions but did not provide notes."}
                    </div>
                  </div>

                  <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.6rem" }}>
                    <button
                      type="button"
                      className="admin-secondary-button"
                      style={{ fontSize: "0.85rem" }}
                      onClick={() => setDetailModalAbstract(abs)}
                    >
                      <Eye size={14} /> View Full Abstract
                    </button>
                    <button
                      type="button"
                      className="admin-primary-button"
                      style={{ fontSize: "0.85rem", background: "#d97706", borderColor: "#d97706", display: "inline-flex", alignItems: "center", gap: "0.4rem" }}
                      onClick={() => {
                        setRevisionModalAbstract(abs);
                        setRevisionNotes(abs.reviewerRevisionNotes || "");
                      }}
                    >
                      <Send size={14} /> Review & Approve Revision Email
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* ============================================================ */}
      {/* QUEUE 3: Awaiting Lead Endorsement */}
      {/* ============================================================ */}
      {activeTab === "endorse" && (
        <section className="admin-panel" style={{ margin: 0, padding: "1.75rem", borderRadius: "1rem" }}>
          <div style={{ marginBottom: "1.25rem" }}>
            <h2 style={{ fontSize: "1.2rem", fontWeight: 800, margin: "0 0 0.25rem 0", color: "#7c3aed" }}>
              Queue 3: Awaiting Team Lead Endorsement ({awaitingEndorsementQueue.length})
            </h2>
            <p className="admin-muted" style={{ margin: 0, fontSize: "0.85rem" }}>
              Your team's reviewers have completed their evaluation and submitted scores (/50). Inspect their assessment and endorse it to the <strong>Scientific Chairperson</strong> for final conference decision.
            </p>
          </div>

          {awaitingEndorsementQueue.length === 0 ? (
            <div style={{ padding: "3.5rem 2rem", textAlign: "center", color: "#6b7280" }}>
              <CheckCircle2 size={40} style={{ margin: "0 auto 0.75rem", color: "#16a34a", opacity: 0.8 }} />
              <h3 style={{ fontSize: "1.1rem", fontWeight: 700, margin: "0 0 0.35rem 0", color: "#111827" }}>
                All Reviews Endorsed!
              </h3>
              <p style={{ margin: 0, fontSize: "0.85rem" }}>
                No completed reviews are currently waiting for your endorsement in {currentTeam?.name}.
              </p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              {awaitingEndorsementQueue.map((abs) => (
                <div
                  key={abs.id}
                  style={{
                    border: "1px solid #e9d5ff",
                    background: "#faf5ff",
                    borderRadius: "0.85rem",
                    padding: "1.25rem",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.5rem", flexWrap: "wrap", gap: "0.5rem" }}>
                    <div>
                      <span style={{ fontFamily: "monospace", fontWeight: 700, color: "#6C4AB6", marginRight: "0.5rem" }}>
                        {abs.abstractId || `GHC-ABS-${String(abs.id).padStart(5, "0")}`}
                      </span>
                      <strong style={{ fontSize: "1.05rem", color: "#111827" }}>{abs.title}</strong>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                      <span
                        style={{
                          fontSize: "0.75rem",
                          fontWeight: 700,
                          padding: "0.2rem 0.6rem",
                          borderRadius: "999px",
                          background: abs.reviewerRecommendedAction === "accept" ? "#dcfce7" : "#fee2e2",
                          color: abs.reviewerRecommendedAction === "accept" ? "#15803d" : "#b91c1c",
                          textTransform: "capitalize",
                        }}
                      >
                        Recommendation: {abs.reviewerRecommendedAction || "Accept"}
                      </span>
                      <span style={{ fontSize: "0.95rem", fontWeight: 800, color: "#6C4AB6", background: "#ffffff", padding: "0.25rem 0.75rem", borderRadius: "8px", border: "1px solid #c4b5fd" }}>
                        Score: {abs.finalScore ?? "-"} / 50
                      </span>
                    </div>
                  </div>

                  <p style={{ fontSize: "0.85rem", color: "#6b7280", margin: "0.2rem 0 0.85rem 0" }}>
                    Author: {abs.presentingAuthor || abs.authors} • Reviewed by: <strong>{abs.assignedReviewerName || "Reviewer"}</strong>
                  </p>

                  <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.6rem" }}>
                    <button
                      type="button"
                      className="admin-secondary-button"
                      style={{ fontSize: "0.85rem" }}
                      onClick={() => setDetailModalAbstract(abs)}
                    >
                      <Eye size={14} /> Full Review Details
                    </button>
                    <button
                      type="button"
                      className="admin-primary-button"
                      style={{ fontSize: "0.85rem", display: "inline-flex", alignItems: "center", gap: "0.4rem" }}
                      onClick={() => {
                        setEndorseModalAbstract(abs);
                        setEndorseNotes("");
                      }}
                    >
                      <CheckCircle2 size={15} /> Endorse to Chairperson
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* ============================================================ */}
      {/* TAB 4: All Team Abstracts */}
      {/* ============================================================ */}
      {activeTab === "all" && (
        <section className="admin-panel" style={{ margin: 0, padding: "1.75rem", borderRadius: "1rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem", flexWrap: "wrap", gap: "0.75rem" }}>
            <div>
              <h2 style={{ fontSize: "1.2rem", fontWeight: 800, margin: "0 0 0.25rem 0", color: "#111827" }}>
                All Abstracts Assigned to {currentTeam?.name} ({teamAbstracts.length})
              </h2>
              <p className="admin-muted" style={{ margin: 0, fontSize: "0.85rem" }}>
                Complete archive of research abstracts assigned to your team.
              </p>
            </div>

            <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", alignItems: "center" }}>
              <input
                type="text"
                placeholder="Search title, code, author..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ padding: "0.45rem 0.85rem", fontSize: "0.85rem", borderRadius: "8px", border: "1px solid #d1d5db", width: "220px" }}
              />
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                style={{ padding: "0.45rem 0.85rem", fontSize: "0.85rem", borderRadius: "8px", border: "1px solid #d1d5db" }}
              >
                <option value="all">All Categories</option>
                <option value="poster">Poster</option>
                <option value="oral">Oral</option>
              </select>
            </div>
          </div>

          <div className="speaker-table-wrap">
            <table className="speaker-table">
              <thead>
                <tr>
                  <th>Code</th>
                  <th>Title of Research</th>
                  <th>Author</th>
                  <th>Assigned Reviewer</th>
                  <th>Workflow Stage</th>
                  <th>Score</th>
                  <th style={{ textAlign: "right" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredAll.map((abs) => (
                  <tr key={abs.id}>
                    <td>
                      <span style={{ fontFamily: "monospace", fontWeight: 700, color: "#6C4AB6" }}>
                        {abs.abstractId || `GHC-ABS-${String(abs.id).padStart(5, "0")}`}
                      </span>
                    </td>
                    <td>
                      <strong title={abs.title} style={{ color: "#111827", maxWidth: "280px", display: "block" }}>
                        {abs.title}
                      </strong>
                    </td>
                    <td style={{ fontSize: "0.85rem" }}>{abs.presentingAuthor || abs.authors || "-"}</td>
                    <td style={{ fontSize: "0.85rem" }}>
                      {abs.assignedReviewerName ? (
                        <span style={{ fontWeight: 600, color: "#374151" }}>{abs.assignedReviewerName}</span>
                      ) : (
                        <span style={{ color: "#9ca3af", fontStyle: "italic" }}>Not assigned</span>
                      )}
                    </td>
                    <td>
                      <span
                        style={{
                          display: "inline-block",
                          padding: "0.2rem 0.6rem",
                          borderRadius: "999px",
                          fontSize: "0.72rem",
                          fontWeight: 700,
                          textTransform: "capitalize",
                          background:
                            abs.workflowStage === "accepted" ? "#dcfce7" :
                            abs.workflowStage === "rejected" ? "#fee2e2" :
                            abs.workflowStage === "lead_approved" ? "#fef3c7" :
                            abs.workflowStage === "lead_revision_requested" ? "#fff7ed" :
                            abs.workflowStage === "reviewer_reviewed" ? "#ede9fe" :
                            abs.workflowStage === "assigned_to_reviewer" ? "#eff6ff" : "#f0fdf4",
                          color:
                            abs.workflowStage === "accepted" ? "#15803d" :
                            abs.workflowStage === "rejected" ? "#b91c1c" :
                            abs.workflowStage === "lead_approved" ? "#b45309" :
                            abs.workflowStage === "lead_revision_requested" ? "#c2410c" :
                            abs.workflowStage === "reviewer_reviewed" ? "#6C4AB6" :
                            abs.workflowStage === "assigned_to_reviewer" ? "#1d4ed8" : "#15803d",
                        }}
                      >
                        {abs.workflowStage === "lead_approved" ? "⭐ Endorsed to Chair" :
                         abs.workflowStage === "lead_revision_requested" ? "⚠️ Revision Flagged" :
                         abs.workflowStage === "reviewer_reviewed" ? "Reviewed (Awaiting Lead)" :
                         abs.workflowStage === "assigned_to_reviewer" ? "Under Evaluation" :
                         abs.workflowStage === "assigned_to_team" ? "Assigned to Team" :
                         (abs.workflowStage || abs.status || "Assigned").replaceAll("_", " ")}
                      </span>
                    </td>
                    <td style={{ fontWeight: 700 }}>
                      {abs.finalScore !== null && abs.finalScore !== undefined ? `${abs.finalScore}/50` : "-"}
                    </td>
                    <td style={{ textAlign: "right" }}>
                      <button
                        type="button"
                        className="admin-secondary-button"
                        style={{ padding: "0.3rem 0.6rem", fontSize: "0.78rem" }}
                        onClick={() => setDetailModalAbstract(abs)}
                      >
                        <Eye size={13} /> View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* ============================================================ */}
      {/* TAB 5: Scientific Team Directory */}
      {activeTab === "reviewers" && (
        <section className="admin-panel" style={{ margin: 0, padding: "1.75rem", borderRadius: "1rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1.25rem", flexWrap: "wrap", gap: "0.75rem" }}>
            <div>
              <h2 style={{ fontSize: "1.2rem", fontWeight: 800, margin: "0 0 0.25rem 0", color: "#059669" }}>
                Scientific Team Members — {currentTeam?.name} ({teamMembers.length})
              </h2>
              <p className="admin-muted" style={{ margin: 0, fontSize: "0.85rem" }}>
                Scientific reviewers registered in {currentTeam?.name || "your team"}. When allocating abstracts, only these reviewers can be selected.
              </p>
            </div>
            {onNavigate && (
              <button
                type="button"
                className="admin-primary-button"
                onClick={() => onNavigate("scientific-team")}
                style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem", fontSize: "0.85rem" }}
              >
                <UserPlus size={15} /> Add Team Member
              </button>
            )}
          </div>

          {teamMembers.length === 0 ? (
            <div style={{ padding: "3rem 2rem", textAlign: "center", color: "#6b7280" }}>
              <Users size={36} style={{ margin: "0 auto 0.5rem", opacity: 0.4 }} />
              <p style={{ margin: "0 0 0.75rem 0", fontWeight: 600 }}>No reviewers assigned to this team yet.</p>
              {onNavigate && (
                <button
                  type="button"
                  className="admin-primary-button"
                  onClick={() => onNavigate("scientific-team")}
                  style={{ fontSize: "0.85rem" }}
                >
                  <UserPlus size={15} /> Add First Team Member
                </button>
              )}
            </div>
          ) : (
            <div className="speaker-table-wrap">
              <table className="speaker-table">
                <thead>
                  <tr>
                    <th>Reviewer Name</th>
                    <th>Role in Team</th>
                    <th>Institution &amp; Country</th>
                    <th>Email Address</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {teamMembers.map((m) => (
                    <tr key={m.membership_id || m.reviewer_id}>
                      <td>
                        <strong style={{ color: "#111827" }}>{m.name}</strong>
                      </td>
                      <td>
                        <span
                          style={{
                            fontSize: "0.75rem",
                            fontWeight: 700,
                            padding: "0.2rem 0.6rem",
                            borderRadius: "999px",
                            background: m.designation === "LEAD" ? "rgba(108,74,182,0.12)" : "#f0fdf4",
                            color: m.designation === "LEAD" ? "#6C4AB6" : "#15803d",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "0.3rem",
                          }}
                        >
                          {m.designation === "LEAD" ? "👑 Team Lead" : "Reviewer Member"}
                        </span>
                      </td>
                      <td style={{ fontSize: "0.85rem" }}>
                        {m.institution || "GAIMS"} {m.country ? `• ${m.country}` : ""}
                      </td>
                      <td style={{ fontSize: "0.85rem", color: "#6b7280" }}>{m.email}</td>
                      <td>
                        <span style={{ fontSize: "0.72rem", fontWeight: 700, color: "#16a34a", background: "#f0fdf4", padding: "0.15rem 0.5rem", borderRadius: "999px" }}>
                          Active
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}

      {/* ============================================================ */}
      {/* MODAL 1: Assign Reviewer Modal */}
      {/* ============================================================ */}
      {assignModalAbstract && (
        <div className="admin-modal-overlay" style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1100, padding: "1rem" }}>
          <div className="admin-panel" style={{ maxWidth: "560px", width: "100%", borderRadius: "1.25rem", background: "#ffffff", padding: "1.75rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
              <h3 style={{ margin: 0, fontSize: "1.25rem", fontWeight: 800, color: "#111827" }}>
                Delegate Abstract to Team Reviewer
              </h3>
              <button type="button" className="admin-icon-button" onClick={() => setAssignModalAbstract(null)}>
                <X size={18} />
              </button>
            </div>

            <div style={{ background: "#faf5ff", border: "1px solid #e9d5ff", borderRadius: "0.75rem", padding: "0.85rem", marginBottom: "1.25rem" }}>
              <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "#6C4AB6", textTransform: "uppercase" }}>Abstract:</div>
              <strong style={{ fontSize: "0.95rem", color: "#111827", display: "block", marginTop: "0.2rem" }}>
                {assignModalAbstract.title}
              </strong>
              <span style={{ fontSize: "0.78rem", color: "#6b7280" }}>
                {assignModalAbstract.abstractId || `GHC-ABS-${String(assignModalAbstract.id).padStart(5, "0")}`} • Category: {assignModalAbstract.category || "Poster"}
              </span>
            </div>

            <form onSubmit={handleAssignReviewerSubmit}>
              <div style={{ marginBottom: "1.25rem" }}>
                <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 700, color: "#374151", marginBottom: "0.4rem" }}>
                  Select Reviewer from {currentTeam?.name}:
                </label>
                <select
                  required
                  value={selectedReviewerId}
                  onChange={(e) => setSelectedReviewerId(e.target.value)}
                  style={{ width: "100%", padding: "0.75rem", borderRadius: "0.6rem", border: "1px solid #d1d5db", fontSize: "0.9rem" }}
                >
                  <option value="">-- Choose a Reviewer --</option>
                  {teamMembers.map((m) => (
                    <option key={m.reviewer_id} value={String(m.reviewer_id)}>
                      {m.name} ({m.designation === "LEAD" ? "Lead" : "Member"}) — {m.email}
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.6rem" }}>
                <button type="button" className="admin-secondary-button" onClick={() => setAssignModalAbstract(null)}>
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={assignSubmitting || !selectedReviewerId}
                  className="admin-primary-button"
                >
                  {assignSubmitting ? "Assigning..." : "Assign to Reviewer"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* MODAL 2: Approve Revision Modal */}
      {/* ============================================================ */}
      {revisionModalAbstract && (
        <div className="admin-modal-overlay" style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1100, padding: "1rem" }}>
          <div className="admin-panel" style={{ maxWidth: "620px", width: "100%", borderRadius: "1.25rem", background: "#ffffff", padding: "1.75rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
              <h3 style={{ margin: 0, fontSize: "1.25rem", fontWeight: 800, color: "#d97706" }}>
                Approve Author Revision Request
              </h3>
              <button type="button" className="admin-icon-button" onClick={() => setRevisionModalAbstract(null)}>
                <X size={18} />
              </button>
            </div>

            <p style={{ fontSize: "0.85rem", color: "#4b5563", margin: "0 0 1rem 0" }}>
              Approving this request will immediately dispatch an official conference email to <strong>{revisionModalAbstract.email || "the author"}</strong> with a secure, single-use link allowing them to upload revised abstract files.
            </p>

            <div style={{ marginBottom: "1.25rem" }}>
              <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 700, color: "#374151", marginBottom: "0.4rem" }}>
                Revision Feedback / Instructions for Author:
              </label>
              <textarea
                rows={5}
                value={revisionNotes}
                onChange={(e) => setRevisionNotes(e.target.value)}
                style={{ width: "100%", padding: "0.75rem", borderRadius: "0.6rem", border: "1px solid #d1d5db", fontSize: "0.88rem", lineHeight: 1.5 }}
                placeholder="Enter instructions for the author regarding required updates..."
              />
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <button
                type="button"
                className="admin-secondary-button"
                style={{ color: "#dc2626", borderColor: "#fecaca" }}
                disabled={decisionSubmitting}
                onClick={() => handleRevisionDecision("reject_revision")}
              >
                Dismiss Request
              </button>

              <div style={{ display: "flex", gap: "0.6rem" }}>
                <button type="button" className="admin-secondary-button" onClick={() => setRevisionModalAbstract(null)}>
                  Cancel
                </button>
                <button
                  type="button"
                  className="admin-primary-button"
                  style={{ background: "#d97706", borderColor: "#d97706" }}
                  disabled={decisionSubmitting}
                  onClick={() => handleRevisionDecision("approve_revision")}
                >
                  {decisionSubmitting ? "Dispatching..." : "Approve & Send Email"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* MODAL 3: Endorse Review Modal */}
      {/* ============================================================ */}
      {endorseModalAbstract && (
        <div className="admin-modal-overlay" style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1100, padding: "1rem" }}>
          <div className="admin-panel" style={{ maxWidth: "580px", width: "100%", borderRadius: "1.25rem", background: "#ffffff", padding: "1.75rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
              <h3 style={{ margin: 0, fontSize: "1.25rem", fontWeight: 800, color: "#7c3aed" }}>
                Endorse Evaluation to Scientific Chairperson
              </h3>
              <button type="button" className="admin-icon-button" onClick={() => setEndorseModalAbstract(null)}>
                <X size={18} />
              </button>
            </div>

            <p style={{ fontSize: "0.85rem", color: "#4b5563", margin: "0 0 1rem 0" }}>
              As Team Leader, your endorsement confirms that the review criteria have been met. This abstract will move to the Chairperson's final decision queue.
            </p>

            <div style={{ background: "#f5f3ff", border: "1px solid #ddd6fe", borderRadius: "0.75rem", padding: "0.85rem", marginBottom: "1.25rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.3rem" }}>
                <span style={{ fontSize: "0.78rem", fontWeight: 700, color: "#6C4AB6" }}>Reviewer Recommendation:</span>
                <strong style={{ fontSize: "0.85rem", color: "#111827", textTransform: "capitalize" }}>{endorseModalAbstract.reviewerRecommendedAction || "Accept"}</strong>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ fontSize: "0.78rem", fontWeight: 700, color: "#6C4AB6" }}>Total Score:</span>
                <strong style={{ fontSize: "0.85rem", color: "#111827" }}>{endorseModalAbstract.finalScore ?? "-"} / 50</strong>
              </div>
            </div>

            <div style={{ marginBottom: "1.25rem" }}>
              <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 700, color: "#374151", marginBottom: "0.4rem" }}>
                Team Leader Endorsement Remarks (Optional):
              </label>
              <textarea
                rows={3}
                value={endorseNotes}
                onChange={(e) => setEndorseNotes(e.target.value)}
                style={{ width: "100%", padding: "0.75rem", borderRadius: "0.6rem", border: "1px solid #d1d5db", fontSize: "0.88rem" }}
                placeholder="Add any remarks for the Scientific Chairperson..."
              />
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.6rem" }}>
              <button type="button" className="admin-secondary-button" onClick={() => setEndorseModalAbstract(null)}>
                Cancel
              </button>
              <button
                type="button"
                className="admin-primary-button"
                disabled={endorseSubmitting}
                onClick={handleEndorseDecision}
              >
                {endorseSubmitting ? "Endorsing..." : "Confirm & Endorse"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* MODAL 4: Full Abstract Detail Modal */}
      {/* ============================================================ */}
      {detailModalAbstract && (
        <div className="admin-modal-overlay" style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1100, padding: "1rem" }}>
          <div className="admin-panel" style={{ maxWidth: "800px", width: "100%", maxHeight: "90vh", overflowY: "auto", borderRadius: "1.25rem", background: "#ffffff", padding: "2rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1rem", borderBottom: "1px solid #f3f4f6", paddingBottom: "1rem" }}>
              <div>
                <span style={{ fontSize: "0.75rem", fontWeight: 800, color: "#6C4AB6", background: "rgba(108,74,182,0.08)", padding: "0.2rem 0.6rem", borderRadius: "999px" }}>
                  {detailModalAbstract.abstractId || `GHC-ABS-${String(detailModalAbstract.id).padStart(5, "0")}`}
                </span>
                <h3 style={{ margin: "0.5rem 0 0 0", fontSize: "1.25rem", fontWeight: 800, color: "#111827" }}>
                  {detailModalAbstract.title}
                </h3>
              </div>
              <button type="button" className="admin-icon-button" onClick={() => setDetailModalAbstract(null)}>
                <X size={18} />
              </button>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1.25rem", fontSize: "0.85rem" }}>
              <div>
                <span style={{ color: "#6b7280", display: "block" }}>Presenting Author:</span>
                <strong>{detailModalAbstract.presentingAuthor || detailModalAbstract.authors || "-"}</strong>
              </div>
              <div>
                <span style={{ color: "#6b7280", display: "block" }}>Institution:</span>
                <strong>{detailModalAbstract.institution || "GAIMS"}</strong>
              </div>
              <div>
                <span style={{ color: "#6b7280", display: "block" }}>Category &amp; Track:</span>
                <strong>{detailModalAbstract.category || "Poster"} • {detailModalAbstract.track || "Scientific"}</strong>
              </div>
              <div>
                <span style={{ color: "#6b7280", display: "block" }}>Assigned Reviewer:</span>
                <strong>{detailModalAbstract.assignedReviewerName || "None"}</strong>
              </div>
            </div>

            {/* Document PDF Link */}
            {(detailModalAbstract.pdfUrl || detailModalAbstract.fileUrl) && (
              <div style={{ marginBottom: "1.25rem" }}>
                <a
                  href={detailModalAbstract.pdfUrl || detailModalAbstract.fileUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="admin-secondary-button"
                  style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem", fontSize: "0.85rem", color: "#6C4AB6", borderColor: "#c4b5fd" }}
                >
                  <ExternalLink size={14} /> Open Abstract Manuscript PDF
                </a>
              </div>
            )}

            {/* Abstract Text */}
            {detailModalAbstract.abstractText && (
              <div style={{ marginBottom: "1.5rem" }}>
                <h4 style={{ fontSize: "0.88rem", fontWeight: 700, color: "#374151", margin: "0 0 0.4rem 0" }}>
                  Abstract Text:
                </h4>
                <div style={{ fontSize: "0.85rem", lineHeight: 1.6, color: "#4b5563", background: "#f9fafb", padding: "1rem", borderRadius: "0.6rem", maxHeight: "200px", overflowY: "auto" }}>
                  {detailModalAbstract.abstractText}
                </div>
              </div>
            )}

            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <button type="button" className="admin-secondary-button" onClick={() => setDetailModalAbstract(null)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
