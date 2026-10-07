import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  Clock,
  Eye,
  FileText,
  Filter,
  RefreshCw,
  Send,
  Sparkles,
  UserCheck,
  UserPlus,
  Users,
  X,
} from "lucide-react";

export default function TeamLeadWorkspace({
  api,
  user,
  workflowRole,
  onOpenAbstract,
  onRefreshParent,
}) {
  const leadTeams = useMemo(() => {
    if (workflowRole?.isChairperson && workflowRole?.allTeams?.length > 0) {
      return workflowRole.allTeams;
    }
    return workflowRole?.leadTeams || [];
  }, [workflowRole]);

  const [selectedTeamId, setSelectedTeamId] = useState(
    leadTeams[0]?.id ? String(leadTeams[0].id) : ""
  );

  useEffect(() => {
    if (!selectedTeamId && leadTeams.length > 0) {
      setSelectedTeamId(String(leadTeams[0].id));
    }
  }, [leadTeams, selectedTeamId]);

  const [loading, setLoading] = useState(false);
  const [teamAbstracts, setTeamAbstracts] = useState([]);
  const [teamMembers, setTeamMembers] = useState([]);
  const [activeQueueTab, setActiveQueueTab] = useState("assign"); // "assign" | "revisions" | "endorse" | "all"
  const [searchQuery, setSearchQuery] = useState("");

  // Assign Reviewer Modal
  const [assignModalAbstract, setAssignModalAbstract] = useState(null);
  const [selectedReviewerId, setSelectedReviewerId] = useState("");
  const [assigning, setAssigning] = useState(false);

  // Revision Decision Modal
  const [revisionModalAbstract, setRevisionModalAbstract] = useState(null);
  const [revisionNotes, setRevisionNotes] = useState("");
  const [decisionSubmitting, setDecisionSubmitting] = useState(false);

  // Endorse Modal
  const [endorseModalAbstract, setEndorseModalAbstract] = useState(null);
  const [endorseNotes, setEndorseNotes] = useState("");
  const [endorseSubmitting, setEndorseSubmitting] = useState(false);

  // Fetch abstracts for selected team
  const loadTeamData = useCallback(async () => {
    if (!selectedTeamId) return;
    setLoading(true);
    try {
      const [abstractsRes, membersRes] = await Promise.all([
        api.get(`/api/research?admin=1&scope=lead&teamId=${selectedTeamId}&limit=150`).catch(() => ({ data: { submissions: [] } })),
        api.get(`/api/research/teams/${selectedTeamId}/members`).catch(() => ({ data: { members: [] } })),
      ]);
      setTeamAbstracts(abstractsRes.data?.submissions || []);
      setTeamMembers(membersRes.data?.members || []);
    } catch (err) {
      console.error("Failed to load team lead workspace data", err);
    } finally {
      setLoading(false);
    }
  }, [api, selectedTeamId]);

  useEffect(() => {
    loadTeamData();
  }, [loadTeamData]);

  // Queues Partitioning
  const needsAssignment = useMemo(() => {
    return teamAbstracts.filter(
      (a) =>
        a.workflowStage === "assigned_to_team" ||
        (!a.assignedReviewerId && !["accepted", "rejected"].includes(a.status))
    );
  }, [teamAbstracts]);

  const reviewerRevisionRequests = useMemo(() => {
    return teamAbstracts.filter((a) => a.workflowStage === "lead_revision_requested");
  }, [teamAbstracts]);

  const awaitingEndorsement = useMemo(() => {
    return teamAbstracts.filter((a) => a.workflowStage === "reviewer_reviewed");
  }, [teamAbstracts]);

  const endorsedCount = useMemo(() => {
    return teamAbstracts.filter((a) => a.workflowStage === "lead_approved").length;
  }, [teamAbstracts]);

  const completedCount = useMemo(() => {
    return teamAbstracts.filter((a) => ["accepted", "rejected"].includes(a.status)).length;
  }, [teamAbstracts]);

  // Filtered for "all" tab
  const filteredAll = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return teamAbstracts;
    return teamAbstracts.filter((a) =>
      [a.title, a.authors, a.presentingAuthor, a.abstractId, a.category, a.track, a.assignedReviewerName]
        .join(" ")
        .toLowerCase()
        .includes(q)
    );
  }, [teamAbstracts, searchQuery]);

  // Actions
  const handleAssignReviewerSubmit = async (e) => {
    e.preventDefault();
    if (!assignModalAbstract || !selectedReviewerId) return;
    setAssigning(true);
    try {
      await api.post(`/api/research/${assignModalAbstract.id}/reviewers`, {
        reviewerId: Number(selectedReviewerId),
      });
      setAssignModalAbstract(null);
      setSelectedReviewerId("");
      await loadTeamData();
      if (onRefreshParent) onRefreshParent();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to assign reviewer.");
    } finally {
      setAssigning(false);
    }
  };

  const handleApproveRevision = async (abstractId, notes) => {
    setDecisionSubmitting(true);
    try {
      const res = await api.post(`/api/research/${abstractId}/lead-decision`, {
        action: "approve_revision",
        notes,
      });
      alert(
        res.data?.emailSent
          ? "Revision request confirmed and email with secure revision link dispatched to author!"
          : "Revision status confirmed. Link generated."
      );
      setRevisionModalAbstract(null);
      setRevisionNotes("");
      await loadTeamData();
      if (onRefreshParent) onRefreshParent();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to confirm revision request.");
    } finally {
      setDecisionSubmitting(false);
    }
  };

  const handleRejectRevision = async (abstractId, notes) => {
    setDecisionSubmitting(true);
    try {
      await api.post(`/api/research/${abstractId}/lead-decision`, {
        action: "reject_revision",
        notes,
      });
      alert("Revision request rejected. Returned to reviewer.");
      setRevisionModalAbstract(null);
      setRevisionNotes("");
      await loadTeamData();
      if (onRefreshParent) onRefreshParent();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to reject revision request.");
    } finally {
      setDecisionSubmitting(false);
    }
  };

  const handleEndorseSubmit = async (e) => {
    e.preventDefault();
    if (!endorseModalAbstract) return;
    setEndorseSubmitting(true);
    try {
      await api.post(`/api/research/${endorseModalAbstract.id}/lead-decision`, {
        action: "endorse_review",
        notes: endorseNotes,
      });
      alert("Review endorsed and passed to the Scientific Chairperson for final verdict!");
      setEndorseModalAbstract(null);
      setEndorseNotes("");
      await loadTeamData();
      if (onRefreshParent) onRefreshParent();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to endorse review.");
    } finally {
      setEndorseSubmitting(false);
    }
  };

  const currentTeamName = useMemo(() => {
    const found = leadTeams.find((t) => String(t.id) === String(selectedTeamId));
    return found?.name || "Review Team";
  }, [leadTeams, selectedTeamId]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
      {/* Header Panel */}
      <section
        className="admin-panel"
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "1.25rem",
          borderRadius: "1rem",
          background: "linear-gradient(135deg, #ffffff 0%, #faf8ff 100%)",
          border: "1px solid #e9d5ff",
        }}
      >
        <div>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.5rem",
              padding: "0.25rem 0.75rem",
              borderRadius: "999px",
              background: "rgba(108, 74, 182, 0.1)",
              color: "#6C4AB6",
              fontSize: "0.75rem",
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: "0.05em",
              marginBottom: "0.4rem",
            }}
          >
            <UserCheck size={14} /> Team Lead Review Workspace
          </div>
          <h1 style={{ margin: "0 0 0.35rem 0", fontSize: "1.75rem", fontWeight: 800, color: "#111827" }}>
            {currentTeamName}
          </h1>
          <p className="admin-muted" style={{ margin: 0, fontSize: "0.9rem" }}>
            Assign team reviewers, approve revision requests, and endorse scored reviews to the Scientific Chairperson.
          </p>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flexWrap: "wrap" }}>
          {leadTeams.length > 1 && (
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <span style={{ fontSize: "0.85rem", fontWeight: 600, color: "#4b5563" }}>Active Team:</span>
              <select
                value={selectedTeamId}
                onChange={(e) => setSelectedTeamId(e.target.value)}
                style={{
                  padding: "0.5rem 0.85rem",
                  fontSize: "0.85rem",
                  fontWeight: 600,
                  borderRadius: "0.5rem",
                  border: "1px solid #d1d5db",
                  background: "#ffffff",
                  color: "#111827",
                }}
              >
                {leadTeams.map((t) => (
                  <option key={t.id} value={String(t.id)}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <button
            type="button"
            className="admin-icon-button"
            title="Refresh Team Queue"
            onClick={loadTeamData}
          >
            <RefreshCw size={16} className={loading ? "spin" : ""} />
          </button>
        </div>
      </section>

      {/* Metrics Row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "0.85rem" }}>
        {[
          { label: "Total Team Abstracts", value: teamAbstracts.length, color: "#6C4AB6", bg: "rgba(108,74,182,0.06)", tab: "all" },
          { label: "Needs Assignment", value: needsAssignment.length, color: "#2563eb", bg: "rgba(37,99,235,0.06)", tab: "assign" },
          { label: "Revision Requests", value: reviewerRevisionRequests.length, color: "#ea580c", bg: "rgba(234,88,12,0.06)", tab: "revisions" },
          { label: "Awaiting Endorsement", value: awaitingEndorsement.length, color: "#7c3aed", bg: "rgba(124,58,237,0.06)", tab: "endorse" },
          { label: "Endorsed to Chair", value: endorsedCount, color: "#059669", bg: "rgba(5,150,105,0.06)", tab: "all" },
          { label: "Final Decided", value: completedCount, color: "#0284c7", bg: "rgba(2,132,199,0.06)", tab: "all" },
        ].map((card) => (
          <div
            key={card.label}
            onClick={() => setActiveQueueTab(card.tab)}
            className="admin-panel"
            style={{
              cursor: "pointer",
              margin: 0,
              padding: "1rem",
              borderRadius: "0.85rem",
              border: activeQueueTab === card.tab ? `2px solid ${card.color}` : "1px solid #e5e7eb",
              transition: "transform 0.15s ease",
            }}
          >
            <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "#6b7280", textTransform: "uppercase" }}>
              {card.label}
            </span>
            <div style={{ fontSize: "1.75rem", fontWeight: 800, color: card.color, marginTop: "0.25rem" }}>
              {card.value}
            </div>
          </div>
        ))}
      </div>

      {/* Queue Tabs */}
      <div style={{ display: "flex", gap: "0.5rem", borderBottom: "1px solid #e5e7eb", paddingBottom: "0.25rem" }}>
        {[
          { id: "assign", label: `1. Assign Reviewers (${needsAssignment.length})`, icon: UserPlus },
          { id: "revisions", label: `2. Reviewer Revision Requests (${reviewerRevisionRequests.length})`, icon: AlertCircle },
          { id: "endorse", label: `3. Awaiting Endorsement (${awaitingEndorsement.length})`, icon: CheckCircle2 },
          { id: "all", label: `All Team Abstracts (${teamAbstracts.length})`, icon: FileText },
        ].map((tab) => {
          const Icon = tab.icon;
          const isSelected = activeQueueTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveQueueTab(tab.id)}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.45rem",
                padding: "0.75rem 1.25rem",
                border: "none",
                background: "transparent",
                borderBottom: isSelected ? "3px solid #6C4AB6" : "3px solid transparent",
                color: isSelected ? "#6C4AB6" : "#6b7280",
                fontWeight: isSelected ? 700 : 500,
                fontSize: "0.9rem",
                cursor: "pointer",
              }}
            >
              <Icon size={16} /> {tab.label}
            </button>
          );
        })}
      </div>

      {/* TAB 1: Assign Reviewers */}
      {activeQueueTab === "assign" && (
        <section className="admin-panel" style={{ margin: 0 }}>
          <div style={{ marginBottom: "1rem" }}>
            <h2 style={{ fontSize: "1.15rem", fontWeight: 700, margin: 0 }}>
              Abstracts Awaiting Reviewer Assignment ({needsAssignment.length})
            </h2>
            <p className="admin-muted" style={{ margin: "0.2rem 0 0 0", fontSize: "0.85rem" }}>
              These abstracts were assigned to your team by the Chairperson. Assign each abstract to a specific reviewer within your team.
            </p>
          </div>

          {needsAssignment.length === 0 ? (
            <div style={{ padding: "3rem", textAlign: "center", color: "#6b7280" }}>
              <CheckCircle2 size={36} style={{ color: "#059669", margin: "0 auto 0.5rem" }} />
              <p style={{ margin: 0, fontWeight: 600 }}>All abstracts assigned to this team currently have reviewers allocated.</p>
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "1rem" }}>
              {needsAssignment.map((abs) => (
                <div
                  key={abs.id}
                  style={{
                    border: "1px solid #e5e7eb",
                    borderRadius: "0.75rem",
                    padding: "1.25rem",
                    background: "#ffffff",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                    boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
                  }}
                >
                  <div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
                      <span style={{ fontFamily: "monospace", fontWeight: 700, color: "#6C4AB6", background: "rgba(108,74,182,0.08)", padding: "0.2rem 0.55rem", borderRadius: "6px", fontSize: "0.8rem" }}>
                        {abs.abstractId || `GHC-ABS-${String(abs.id).padStart(5, "0")}`}
                      </span>
                      <span style={{ fontSize: "0.75rem", textTransform: "capitalize", padding: "0.2rem 0.6rem", borderRadius: "999px", background: "#f3f4f6", color: "#4b5563", fontWeight: 600 }}>
                        {abs.category || "Poster"}
                      </span>
                    </div>

                    <h3 style={{ fontSize: "1rem", fontWeight: 700, margin: "0 0 0.4rem 0", color: "#111827", lineHeight: 1.35 }}>
                      {abs.title}
                    </h3>
                    <p style={{ fontSize: "0.85rem", color: "#6b7280", margin: "0 0 0.85rem 0" }}>
                      Author: {abs.presentingAuthor || abs.authors || "Not specified"} • {abs.institution || "Institution"}
                    </p>
                  </div>

                  <div style={{ display: "flex", gap: "0.5rem", marginTop: "1rem", borderTop: "1px solid #f3f4f6", paddingTop: "0.85rem" }}>
                    <button
                      type="button"
                      className="admin-secondary-button"
                      style={{ fontSize: "0.8rem", padding: "0.4rem 0.75rem", display: "inline-flex", alignItems: "center", gap: "0.3rem" }}
                      onClick={() => onOpenAbstract(abs)}
                    >
                      <Eye size={13} /> View
                    </button>
                    <button
                      type="button"
                      className="admin-primary-button"
                      style={{ fontSize: "0.8rem", padding: "0.4rem 0.85rem", flex: 1, display: "inline-flex", alignItems: "center", justifyContent: "center", gap: "0.4rem" }}
                      onClick={() => {
                        setAssignModalAbstract(abs);
                        setSelectedReviewerId("");
                      }}
                    >
                      <UserPlus size={14} /> Assign Reviewer
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* TAB 2: Reviewer Revision Requests */}
      {activeQueueTab === "revisions" && (
        <section className="admin-panel" style={{ margin: 0 }}>
          <div style={{ marginBottom: "1rem" }}>
            <h2 style={{ fontSize: "1.15rem", fontWeight: 700, margin: 0 }}>
              Reviewer Revision Requests ({reviewerRevisionRequests.length})
            </h2>
            <p className="admin-muted" style={{ margin: "0.2rem 0 0 0", fontSize: "0.85rem" }}>
              Reviewers have evaluated these abstracts and requested revisions. Confirming the revision will dispatch an email with a 14-day update link to the author.
            </p>
          </div>

          {reviewerRevisionRequests.length === 0 ? (
            <div style={{ padding: "3rem", textAlign: "center", color: "#6b7280" }}>
              <CheckCircle2 size={36} style={{ color: "#059669", margin: "0 auto 0.5rem" }} />
              <p style={{ margin: 0, fontWeight: 600 }}>No revision requests currently awaiting confirmation in this team.</p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              {reviewerRevisionRequests.map((abs) => (
                <div
                  key={abs.id}
                  style={{
                    border: "1px solid #fed7aa",
                    background: "#fffaf5",
                    borderRadius: "0.75rem",
                    padding: "1.25rem",
                    boxShadow: "0 1px 3px rgba(0,0,0,0.03)",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "0.5rem", marginBottom: "0.5rem" }}>
                    <div>
                      <span style={{ fontFamily: "monospace", fontWeight: 700, color: "#ea580c", background: "#ffedd5", padding: "0.2rem 0.55rem", borderRadius: "6px", fontSize: "0.8rem", marginRight: "0.5rem" }}>
                        {abs.abstractId || `GHC-ABS-${String(abs.id).padStart(5, "0")}`}
                      </span>
                      <strong style={{ fontSize: "1.05rem", color: "#111827" }}>{abs.title}</strong>
                    </div>
                    <span style={{ fontSize: "0.8rem", color: "#9a3412", fontWeight: 600 }}>
                      Assigned Reviewer: {abs.assignedReviewerName || "Team Reviewer"}
                    </span>
                  </div>

                  {abs.reviewerRevisionNotes && (
                    <div
                      style={{
                        margin: "0.75rem 0",
                        padding: "0.85rem 1rem",
                        background: "#ffffff",
                        border: "1px solid #fed7aa",
                        borderRadius: "0.5rem",
                      }}
                    >
                      <strong style={{ fontSize: "0.8rem", color: "#c2410c", textTransform: "uppercase", display: "block", marginBottom: "0.3rem" }}>
                        Reviewer Feedback / Requested Changes:
                      </strong>
                      <p style={{ margin: 0, fontSize: "0.9rem", color: "#374151", whiteSpace: "pre-wrap", lineHeight: 1.5 }}>
                        {abs.reviewerRevisionNotes}
                      </p>
                    </div>
                  )}

                  <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.6rem", marginTop: "0.85rem", flexWrap: "wrap" }}>
                    <button
                      type="button"
                      className="admin-secondary-button"
                      style={{ fontSize: "0.85rem" }}
                      onClick={() => onOpenAbstract(abs)}
                    >
                      <Eye size={14} /> Inspect Manuscript
                    </button>
                    <button
                      type="button"
                      style={{
                        padding: "0.45rem 1rem",
                        borderRadius: "0.5rem",
                        background: "#fef2f2",
                        color: "#dc2626",
                        border: "1px solid #fecaca",
                        fontWeight: 600,
                        fontSize: "0.85rem",
                        cursor: "pointer",
                      }}
                      onClick={() => handleRejectRevision(abs.id, "Team Lead requested reviewer to proceed without author revision.")}
                    >
                      Decline & Return to Reviewer
                    </button>
                    <button
                      type="button"
                      className="admin-primary-button"
                      style={{
                        fontSize: "0.85rem",
                        background: "#ea580c",
                        borderColor: "#ea580c",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "0.4rem",
                      }}
                      onClick={() => {
                        setRevisionModalAbstract(abs);
                        setRevisionNotes(abs.reviewerRevisionNotes || "");
                      }}
                    >
                      <Send size={14} /> Confirm & Dispatch Revision Email
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* TAB 3: Awaiting Endorsement */}
      {activeQueueTab === "endorse" && (
        <section className="admin-panel" style={{ margin: 0 }}>
          <div style={{ marginBottom: "1rem" }}>
            <h2 style={{ fontSize: "1.15rem", fontWeight: 700, margin: 0 }}>
              Reviews Awaiting Lead Endorsement ({awaitingEndorsement.length})
            </h2>
            <p className="admin-muted" style={{ margin: "0.2rem 0 0 0", fontSize: "0.85rem" }}>
              Reviewers have completed evaluating these abstracts. Review their scores and comments, add your remarks, and endorse to the Chairperson for the final verdict.
            </p>
          </div>

          {awaitingEndorsement.length === 0 ? (
            <div style={{ padding: "3rem", textAlign: "center", color: "#6b7280" }}>
              <CheckCircle2 size={36} style={{ color: "#059669", margin: "0 auto 0.5rem" }} />
              <p style={{ margin: 0, fontWeight: 600 }}>No completed reviews currently awaiting endorsement in this team.</p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              {awaitingEndorsement.map((abs) => (
                <div
                  key={abs.id}
                  style={{
                    border: "1px solid #e9d5ff",
                    background: "#fbf8ff",
                    borderRadius: "0.75rem",
                    padding: "1.25rem",
                    boxShadow: "0 1px 3px rgba(0,0,0,0.03)",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "0.5rem", marginBottom: "0.5rem" }}>
                    <div>
                      <span style={{ fontFamily: "monospace", fontWeight: 700, color: "#6C4AB6", background: "rgba(108,74,182,0.1)", padding: "0.2rem 0.55rem", borderRadius: "6px", fontSize: "0.8rem", marginRight: "0.5rem" }}>
                        {abs.abstractId || `GHC-ABS-${String(abs.id).padStart(5, "0")}`}
                      </span>
                      <strong style={{ fontSize: "1.05rem", color: "#111827" }}>{abs.title}</strong>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                      <span
                        style={{
                          fontSize: "0.8rem",
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
                      <span
                        style={{
                          fontSize: "0.85rem",
                          fontWeight: 800,
                          color: "#6C4AB6",
                          background: "#ffffff",
                          padding: "0.2rem 0.6rem",
                          borderRadius: "6px",
                          border: "1px solid #e9d5ff",
                        }}
                      >
                        Score: {abs.finalScore ?? "-"} / 50
                      </span>
                    </div>
                  </div>

                  <p style={{ fontSize: "0.85rem", color: "#6b7280", margin: "0.25rem 0 0.75rem 0" }}>
                    Author: {abs.presentingAuthor || abs.authors || "Author"} • Evaluated by: <strong>{abs.assignedReviewerName || "Reviewer"}</strong>
                  </p>

                  <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.6rem", marginTop: "0.85rem", flexWrap: "wrap" }}>
                    <button
                      type="button"
                      className="admin-secondary-button"
                      style={{ fontSize: "0.85rem" }}
                      onClick={() => onOpenAbstract(abs)}
                    >
                      <Eye size={14} /> Full Review Details
                    </button>
                    <button
                      type="button"
                      className="admin-primary-button"
                      style={{
                        fontSize: "0.85rem",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "0.4rem",
                      }}
                      onClick={() => {
                        setEndorseModalAbstract(abs);
                        setEndorseNotes("");
                      }}
                    >
                      <CheckCircle2 size={15} /> Endorse to Scientific Chairperson
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* TAB 4: All Team Abstracts */}
      {activeQueueTab === "all" && (
        <section className="admin-panel" style={{ margin: 0 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem", flexWrap: "wrap", gap: "0.75rem" }}>
            <div>
              <h2 style={{ fontSize: "1.15rem", fontWeight: 700, margin: 0 }}>
                All Abstracts in {currentTeamName} ({teamAbstracts.length})
              </h2>
            </div>
            <input
              type="text"
              placeholder="Search in team abstracts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ padding: "0.4rem 0.85rem", fontSize: "0.85rem", borderRadius: "8px", border: "1px solid #d1d5db", width: "240px" }}
            />
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
                      <strong title={abs.title} style={{ color: "#111827", maxWidth: "260px", display: "block" }}>
                        {abs.title}
                      </strong>
                    </td>
                    <td style={{ fontSize: "0.85rem" }}>{abs.presentingAuthor || abs.authors || "-"}</td>
                    <td style={{ fontSize: "0.85rem" }}>
                      {abs.assignedReviewerName ? (
                        <span style={{ fontWeight: 600, color: "#374151" }}>{abs.assignedReviewerName}</span>
                      ) : (
                        <span style={{ color: "#9ca3af", fontStyle: "italic" }}>Unassigned</span>
                      )}
                    </td>
                    <td>
                      <span
                        style={{
                          fontSize: "0.75rem",
                          fontWeight: 700,
                          padding: "0.2rem 0.55rem",
                          borderRadius: "999px",
                          background:
                            abs.workflowStage === "lead_approved" ? "#ecfdf5" :
                            abs.workflowStage === "lead_revision_requested" ? "#fff7ed" :
                            abs.workflowStage === "reviewer_reviewed" ? "#faf5ff" :
                            abs.workflowStage === "assigned_to_reviewer" ? "#eff6ff" : "#f3f4f6",
                          color:
                            abs.workflowStage === "lead_approved" ? "#059669" :
                            abs.workflowStage === "lead_revision_requested" ? "#c2410c" :
                            abs.workflowStage === "reviewer_reviewed" ? "#7c3aed" :
                            abs.workflowStage === "assigned_to_reviewer" ? "#2563eb" : "#4b5563",
                          textTransform: "capitalize",
                        }}
                      >
                        {(abs.workflowStage || abs.status || "submitted").replaceAll("_", " ")}
                      </span>
                    </td>
                    <td style={{ fontWeight: 700 }}>
                      {abs.finalScore !== null && abs.finalScore !== undefined ? `${abs.finalScore}/50` : "-"}
                    </td>
                    <td style={{ textAlign: "right" }}>
                      <button
                        type="button"
                        className="admin-secondary-button"
                        style={{ fontSize: "0.75rem", padding: "0.3rem 0.65rem" }}
                        onClick={() => onOpenAbstract(abs)}
                      >
                        <Eye size={12} /> View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* MODAL 1: Assign Reviewer */}
      {assignModalAbstract && (
        <div
          className="admin-modal-overlay"
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: "1rem" }}
        >
          <div
            className="admin-panel"
            style={{ maxWidth: "520px", width: "100%", borderRadius: "1rem", background: "#ffffff", padding: "1.75rem" }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
              <h3 style={{ margin: 0, fontSize: "1.2rem", fontWeight: 700 }}>Assign Reviewer</h3>
              <button type="button" className="admin-icon-button" onClick={() => setAssignModalAbstract(null)}>
                <X size={18} />
              </button>
            </div>

            <p style={{ fontSize: "0.85rem", color: "#6b7280", margin: "0 0 1.25rem 0" }}>
              Assigning abstract <strong>{assignModalAbstract.abstractId || assignModalAbstract.title}</strong> to a reviewer in <strong>{currentTeamName}</strong>.
            </p>

            <form onSubmit={handleAssignReviewerSubmit}>
              <div style={{ marginBottom: "1.25rem" }}>
                <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, color: "#374151", marginBottom: "0.4rem" }}>
                  Select Team Reviewer:
                </label>
                <select
                  value={selectedReviewerId}
                  onChange={(e) => setSelectedReviewerId(e.target.value)}
                  required
                  style={{ width: "100%", padding: "0.6rem 0.85rem", fontSize: "0.9rem", borderRadius: "0.5rem", border: "1px solid #d1d5db" }}
                >
                  <option value="">-- Choose Reviewer from {currentTeamName} --</option>
                  {teamMembers.map((m) => (
                    <option key={m.reviewer_id} value={String(m.reviewer_id)}>
                      {m.name} ({m.email}) {m.designation === "LEAD" ? "— [Team Lead]" : ""}
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.6rem" }}>
                <button
                  type="button"
                  className="admin-secondary-button"
                  onClick={() => setAssignModalAbstract(null)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={assigning || !selectedReviewerId}
                  className="admin-primary-button"
                >
                  {assigning ? "Assigning..." : "Confirm Assignment"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Confirm Revision Request */}
      {revisionModalAbstract && (
        <div
          className="admin-modal-overlay"
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: "1rem" }}
        >
          <div
            className="admin-panel"
            style={{ maxWidth: "560px", width: "100%", borderRadius: "1rem", background: "#ffffff", padding: "1.75rem" }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
              <h3 style={{ margin: 0, fontSize: "1.2rem", fontWeight: 700, color: "#ea580c" }}>
                Confirm Revision Request
              </h3>
              <button type="button" className="admin-icon-button" onClick={() => setRevisionModalAbstract(null)}>
                <X size={18} />
              </button>
            </div>

            <p style={{ fontSize: "0.85rem", color: "#4b5563", margin: "0 0 1rem 0" }}>
              Reviewer has flagged this abstract for revision. You can edit the revision feedback instructions below. Upon confirmation, an email with a secure submission link will be dispatched to <strong>{revisionModalAbstract.email || "the author"}</strong>.
            </p>

            <div style={{ marginBottom: "1.25rem" }}>
              <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, color: "#374151", marginBottom: "0.4rem" }}>
                Revision Instructions for Author:
              </label>
              <textarea
                rows={5}
                value={revisionNotes}
                onChange={(e) => setRevisionNotes(e.target.value)}
                placeholder="List required revisions, methodology clarifications, or section adjustments..."
                style={{ width: "100%", padding: "0.6rem", borderRadius: "0.5rem", border: "1px solid #d1d5db", fontSize: "0.85rem", lineHeight: 1.5 }}
              />
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.6rem" }}>
              <button
                type="button"
                className="admin-secondary-button"
                onClick={() => setRevisionModalAbstract(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={decisionSubmitting}
                className="admin-primary-button"
                style={{ background: "#ea580c", borderColor: "#ea580c" }}
                onClick={() => handleApproveRevision(revisionModalAbstract.id, revisionNotes)}
              >
                {decisionSubmitting ? "Dispatching..." : "Send Revision Email to Author"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: Endorse Review to Chairperson */}
      {endorseModalAbstract && (
        <div
          className="admin-modal-overlay"
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: "1rem" }}
        >
          <div
            className="admin-panel"
            style={{ maxWidth: "560px", width: "100%", borderRadius: "1rem", background: "#ffffff", padding: "1.75rem" }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
              <h3 style={{ margin: 0, fontSize: "1.2rem", fontWeight: 700, color: "#6C4AB6" }}>
                Endorse Review to Chairperson
              </h3>
              <button type="button" className="admin-icon-button" onClick={() => setEndorseModalAbstract(null)}>
                <X size={18} />
              </button>
            </div>

            <p style={{ fontSize: "0.85rem", color: "#4b5563", margin: "0 0 1rem 0" }}>
              The reviewer has evaluated <strong>{endorseModalAbstract.abstractId || endorseModalAbstract.title}</strong> with score <strong>{endorseModalAbstract.finalScore}/50</strong> and recommendation <strong>{endorseModalAbstract.reviewerRecommendedAction || "accept"}</strong>. Endorsing passes this abstract to the Scientific Chairperson for the final verdict.
            </p>

            <form onSubmit={handleEndorseSubmit}>
              <div style={{ marginBottom: "1.25rem" }}>
                <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, color: "#374151", marginBottom: "0.4rem" }}>
                  Team Lead Endorsement Remarks (Optional):
                </label>
                <textarea
                  rows={4}
                  value={endorseNotes}
                  onChange={(e) => setEndorseNotes(e.target.value)}
                  placeholder="e.g. Endorsed for oral presentation. High methodological quality."
                  style={{ width: "100%", padding: "0.6rem", borderRadius: "0.5rem", border: "1px solid #d1d5db", fontSize: "0.85rem" }}
                />
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.6rem" }}>
                <button
                  type="button"
                  className="admin-secondary-button"
                  onClick={() => setEndorseModalAbstract(null)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={endorseSubmitting}
                  className="admin-primary-button"
                >
                  {endorseSubmitting ? "Endorsing..." : "Confirm & Pass to Chairperson"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
