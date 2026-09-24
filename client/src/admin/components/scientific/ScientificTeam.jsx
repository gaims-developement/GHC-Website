import { useEffect, useMemo, useState, useCallback } from "react";
import {
  Users,
  UserPlus,
  Search,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RotateCcw,
  ShieldAlert,
  ShieldCheck,
  RefreshCw,
  Mail,
  Building2,
  Stethoscope,
  Award,
  FileCheck,
  X,
  Lock,
  Unlock,
  ClipboardCheck,
} from "lucide-react";

function ScientificTeam({ api, isSuperAdmin = false, onReviewerUpdated }) {
  const [reviewers, setReviewers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  // Modals
  const [selectedReviewer, setSelectedReviewer] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showSuspendModal, setShowSuspendModal] = useState(false);
  const [suspensionReason, setSuspensionReason] = useState("");
  const [submittingAction, setSubmittingAction] = useState(false);

  // New Reviewer Form State
  const [newReviewer, setNewReviewer] = useState({
    name: "",
    email: "",
    password: "Reviewer@123",
    specialization: "",
    designation: "",
    institution: "GAIMS",
    country: "India",
  });
  const [addError, setAddError] = useState("");

  const loadReviewers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get("/api/research/reviewers");
      setReviewers(res.data.reviewers || []);
    } catch (err) {
      console.error("Failed to load reviewers", err);
    } finally {
      setLoading(false);
    }
  }, [api]);

  useEffect(() => {
    loadReviewers();
  }, [loadReviewers]);

  // KPI Calculations
  const stats = useMemo(() => {
    const total = reviewers.length;
    const active = reviewers.filter((r) => (r.status || "active") === "active").length;
    const suspended = reviewers.filter((r) => r.status === "suspended").length;
    const reinstatementPending = reviewers.filter((r) => r.reinstatement_status === "pending").length;
    const totalCompleted = reviewers.reduce((sum, r) => sum + Number(r.completed_reviews || 0), 0);
    return { total, active, suspended, reinstatementPending, totalCompleted };
  }, [reviewers]);

  // Filtered List
  const filteredReviewers = useMemo(() => {
    return reviewers.filter((rev) => {
      const q = search.toLowerCase().trim();
      const matchesSearch =
        !q ||
        [rev.name, rev.email, rev.specialization, rev.designation, rev.institution]
          .filter(Boolean)
          .join(" ")
          .toLowerCase()
          .includes(q);

      if (!matchesSearch) return false;

      if (statusFilter === "all") return true;
      if (statusFilter === "active") return (rev.status || "active") === "active";
      if (statusFilter === "suspended") return rev.status === "suspended";
      if (statusFilter === "pending_reinstatement") return rev.reinstatement_status === "pending";
      return true;
    });
  }, [reviewers, search, statusFilter]);

  // Handle Add Reviewer
  const handleAddReviewerSubmit = async (e) => {
    e.preventDefault();
    setAddError("");
    setSubmittingAction(true);
    try {
      await api.post("/api/research/reviewers", newReviewer);
      setShowAddModal(false);
      setNewReviewer({
        name: "",
        email: "",
        password: "Reviewer@123",
        specialization: "",
        designation: "",
        institution: "GAIMS",
        country: "India",
      });
      await loadReviewers();
      if (onReviewerUpdated) onReviewerUpdated();
    } catch (err) {
      setAddError(err.response?.data?.message || "Failed to create reviewer account.");
    } finally {
      setSubmittingAction(false);
    }
  };

  // Handle Suspend
  const handleSuspendConfirm = async () => {
    if (!selectedReviewer) return;
    setSubmittingAction(true);
    try {
      await api.patch(`/api/research/reviewers/${selectedReviewer.id}/suspend`, {
        status: "suspended",
        reason: suspensionReason,
      });
      setShowSuspendModal(false);
      setSuspensionReason("");
      setSelectedReviewer(null);
      await loadReviewers();
      if (onReviewerUpdated) onReviewerUpdated();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to suspend reviewer.");
    } finally {
      setSubmittingAction(false);
    }
  };

  // Handle Reinstate / Unsuspend
  const handleReinstate = async (reviewerId) => {
    setSubmittingAction(true);
    try {
      await api.patch(`/api/research/reviewers/${reviewerId}/reinstate`);
      setSelectedReviewer(null);
      await loadReviewers();
      if (onReviewerUpdated) onReviewerUpdated();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to reinstate reviewer.");
    } finally {
      setSubmittingAction(false);
    }
  };

  return (
    <div className="admin-speakers-page" style={{ maxWidth: "1380px", margin: "0 auto", paddingBottom: "4rem" }}>
      {/* Page Header */}
      <section className="admin-panel" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <div style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem", padding: "0.25rem 0.75rem", borderRadius: "999px", background: "rgba(108, 74, 182, 0.08)", color: "#6C4AB6", fontSize: "0.75rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "0.5rem" }}>
            <Users size={14} /> Scientific Workforce
          </div>
          <h1 style={{ margin: "0 0 0.25rem 0", fontSize: "1.75rem", fontWeight: 800 }}>
            {isSuperAdmin ? "Scientific Team Management" : "Scientific Committee Reviewers"}
          </h1>
          <p className="admin-muted" style={{ margin: 0, fontSize: "0.95rem" }}>
            Directly add reviewers, monitor individual evaluation breakdown, and control reviewer account status.
          </p>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flexWrap: "wrap" }}>
          <button
            type="button"
            className="admin-primary-button"
            style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem", fontWeight: 700 }}
            onClick={() => setShowAddModal(true)}
          >
            <UserPlus size={16} /> Add Reviewer
          </button>
          <button
            type="button"
            className="admin-icon-button"
            onClick={loadReviewers}
            title="Refresh List"
          >
            <RefreshCw size={16} className={loading ? "spin" : ""} />
          </button>
        </div>
      </section>

      {/* KPI Stats Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "1rem", margin: "1.25rem 0" }}>
        {[
          { label: "Total Reviewers", value: stats.total, icon: Users, color: "#6C4AB6", filter: "all" },
          { label: "Active Reviewers", value: stats.active, icon: CheckCircle2, color: "#059669", filter: "active" },
          { label: "Suspended", value: stats.suspended, icon: ShieldAlert, color: "#dc2626", filter: "suspended" },
          { label: "Reinstatement Requests", value: stats.reinstatementPending, icon: AlertTriangle, color: "#d97706", filter: "pending_reinstatement" },
          { label: "Completed Evaluations", value: stats.totalCompleted, icon: ClipboardCheck, color: "#2563eb", filter: "all" },
        ].map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.label}
              onClick={() => setStatusFilter(card.filter)}
              className="admin-panel"
              style={{
                cursor: "pointer",
                margin: 0,
                padding: "1.25rem",
                borderRadius: "1rem",
                border: statusFilter === card.filter ? `2px solid ${card.color}` : "1px solid #f3f4f6",
                transition: "all 0.15s ease",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
                <span style={{ fontSize: "0.8rem", fontWeight: 600, color: "#6b7280" }}>{card.label}</span>
                <Icon size={18} style={{ color: card.color }} />
              </div>
              <div style={{ fontSize: "1.85rem", fontWeight: 800, color: card.color }}>{card.value}</div>
            </div>
          );
        })}
      </div>

      {/* Search and Filter Row */}
      <section className="admin-panel" style={{ padding: "1.25rem", marginBottom: "1.5rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
          <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
            {[
              { id: "all", label: `All (${stats.total})` },
              { id: "active", label: `Active (${stats.active})` },
              { id: "suspended", label: `Suspended (${stats.suspended})` },
              { id: "pending_reinstatement", label: `Reinstatement Pending (${stats.reinstatementPending})` },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                className={statusFilter === tab.id ? "active" : ""}
                onClick={() => setStatusFilter(tab.id)}
                style={{
                  padding: "0.4rem 0.85rem",
                  borderRadius: "999px",
                  fontSize: "0.8rem",
                  fontWeight: statusFilter === tab.id ? 700 : 500,
                  border: statusFilter === tab.id ? "1px solid #6C4AB6" : "1px solid #e5e7eb",
                  background: statusFilter === tab.id ? "rgba(108,74,182,0.08)" : "#fff",
                  color: statusFilter === tab.id ? "#6C4AB6" : "#4b5563",
                  cursor: "pointer",
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <Search size={16} style={{ color: "#9ca3af" }} />
            <input
              type="text"
              placeholder="Search reviewer name, email, specialization..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ padding: "0.45rem 0.85rem", fontSize: "0.85rem", borderRadius: "8px", border: "1px solid #d1d5db", width: "280px" }}
            />
          </div>
        </div>
      </section>

      {/* Reviewers Table */}
      <section className="admin-panel" style={{ padding: 0, overflow: "hidden" }}>
        {loading ? (
          <div style={{ padding: "3rem", textAlign: "center", color: "#6b7280" }}>Loading reviewers directory...</div>
        ) : filteredReviewers.length === 0 ? (
          <div style={{ padding: "3.5rem 1.5rem", textAlign: "center", color: "#6b7280" }}>
            <Users size={36} style={{ margin: "0 auto 0.75rem", opacity: 0.4 }} />
            <h3 style={{ margin: "0 0 0.5rem 0", fontWeight: 700 }}>No reviewers found</h3>
            <p className="admin-muted" style={{ margin: "0 0 1.25rem 0" }}>
              Add a new reviewer by clicking the button above to assign scientific evaluation duties.
            </p>
            <button
              type="button"
              className="admin-primary-button"
              onClick={() => setShowAddModal(true)}
              style={{ fontSize: "0.85rem" }}
            >
              <UserPlus size={15} /> Add First Reviewer
            </button>
          </div>
        ) : (
          <div className="speaker-table-wrap">
            <table className="speaker-table">
              <thead>
                <tr>
                  <th>Reviewer Name & Email</th>
                  <th>Specialization & Role</th>
                  <th>Institution</th>
                  <th style={{ textAlign: "center" }}>Reviews Done</th>
                  <th style={{ textAlign: "center" }}>Decisions (App / Rev / Rej)</th>
                  <th style={{ textAlign: "center" }}>Status</th>
                  <th style={{ textAlign: "right" }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredReviewers.map((rev) => {
                  const isSuspended = rev.status === "suspended";
                  const hasPendingReinstatement = rev.reinstatement_status === "pending";
                  const completed = Number(rev.completed_reviews || 0);
                  const approved = Number(rev.approved_count || 0);
                  const revision = Number(rev.revision_count || 0);
                  const rejected = Number(rev.rejected_count || 0);

                  return (
                    <tr
                      key={rev.id}
                      onClick={() => setSelectedReviewer(rev)}
                      style={{ cursor: "pointer" }}
                    >
                      <td>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                          <div style={{ width: "36px", height: "36px", borderRadius: "50%", background: isSuspended ? "#fee2e2" : "rgba(108, 74, 182, 0.1)", color: isSuspended ? "#dc2626" : "#6C4AB6", display: "grid", placeItems: "center", fontWeight: 700, fontSize: "0.9rem" }}>
                            {(rev.name || "R").charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <strong style={{ color: "#111827", display: "block" }}>{rev.name}</strong>
                            <span style={{ fontSize: "0.75rem", color: "#6b7280" }}>{rev.email}</span>
                          </div>
                        </div>
                      </td>
                      <td>
                        <div style={{ fontSize: "0.85rem", fontWeight: 600, color: "#374151" }}>
                          {rev.specialization || "General Medicine"}
                        </div>
                        <span style={{ fontSize: "0.75rem", color: "#9ca3af" }}>
                          {rev.designation || "Reviewer"}
                        </span>
                      </td>
                      <td style={{ fontSize: "0.85rem", color: "#4b5563" }}>
                        <div>{rev.institution || "GAIMS"}</div>
                        <span style={{ fontSize: "0.75rem", color: "#9ca3af" }}>{rev.country || "India"}</span>
                      </td>
                      <td style={{ textAlign: "center", fontWeight: 800, fontSize: "1rem", color: completed > 0 ? "#6C4AB6" : "#6b7280" }}>
                        {completed}
                      </td>
                      <td style={{ textAlign: "center" }}>
                        <div style={{ display: "inline-flex", gap: "0.35rem", fontSize: "0.75rem", fontWeight: 700 }}>
                          <span title="Approved" style={{ padding: "0.15rem 0.4rem", borderRadius: "4px", background: "#ecfdf5", color: "#059669" }}>
                            {approved} ✓
                          </span>
                          <span title="Sent for Revision" style={{ padding: "0.15rem 0.4rem", borderRadius: "4px", background: "#fffbeb", color: "#d97706" }}>
                            {revision} ⟳
                          </span>
                          <span title="Rejected" style={{ padding: "0.15rem 0.4rem", borderRadius: "4px", background: "#fef2f2", color: "#dc2626" }}>
                            {rejected} ✕
                          </span>
                        </div>
                      </td>
                      <td style={{ textAlign: "center" }}>
                        {hasPendingReinstatement ? (
                          <span style={{ display: "inline-flex", alignItems: "center", gap: "0.3rem", padding: "0.25rem 0.65rem", borderRadius: "999px", background: "#fffbeb", color: "#d97706", fontSize: "0.75rem", fontWeight: 700 }}>
                            <AlertTriangle size={12} /> Reinstatement Pending
                          </span>
                        ) : isSuspended ? (
                          <span style={{ display: "inline-flex", alignItems: "center", gap: "0.3rem", padding: "0.25rem 0.65rem", borderRadius: "999px", background: "#fef2f2", color: "#dc2626", fontSize: "0.75rem", fontWeight: 700 }}>
                            <Lock size={12} /> Suspended
                          </span>
                        ) : (
                          <span style={{ display: "inline-flex", alignItems: "center", gap: "0.3rem", padding: "0.25rem 0.65rem", borderRadius: "999px", background: "#ecfdf5", color: "#059669", fontSize: "0.75rem", fontWeight: 700 }}>
                            <CheckCircle2 size={12} /> Active
                          </span>
                        )}
                      </td>
                      <td style={{ textAlign: "right" }}>
                        <button
                          type="button"
                          className="admin-secondary-button"
                          style={{ padding: "0.3rem 0.7rem", fontSize: "0.8rem", fontWeight: 600 }}
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedReviewer(rev);
                          }}
                        >
                          Details & Manage
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* POPUP: Reviewer Details Modal */}
      {selectedReviewer && (
        <div
          className="admin-modal-overlay"
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
            padding: "1rem",
          }}
          onClick={() => setSelectedReviewer(null)}
        >
          <div
            className="admin-panel"
            style={{
              width: "100%",
              maxWidth: "680px",
              maxHeight: "90vh",
              overflowY: "auto",
              margin: 0,
              padding: "2rem",
              borderRadius: "1.25rem",
              boxShadow: "0 25px 50px -12px rgba(0,0,0,0.25)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1.5rem", borderBottom: "1px solid #f3f4f6", paddingBottom: "1rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                <div style={{ width: "48px", height: "48px", borderRadius: "50%", background: selectedReviewer.status === "suspended" ? "#fee2e2" : "rgba(108, 74, 182, 0.1)", color: selectedReviewer.status === "suspended" ? "#dc2626" : "#6C4AB6", display: "grid", placeItems: "center", fontSize: "1.25rem", fontWeight: 800 }}>
                  {(selectedReviewer.name || "R").charAt(0).toUpperCase()}
                </div>
                <div>
                  <h2 style={{ fontSize: "1.35rem", fontWeight: 800, margin: 0, color: "#111827" }}>
                    {selectedReviewer.name}
                  </h2>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginTop: "0.25rem", fontSize: "0.85rem", color: "#6b7280" }}>
                    <Mail size={14} /> {selectedReviewer.email}
                  </div>
                </div>
              </div>

              <button
                type="button"
                className="admin-icon-button"
                onClick={() => setSelectedReviewer(null)}
              >
                <X size={18} />
              </button>
            </div>

            {/* Status Notification / Alert */}
            {selectedReviewer.reinstatement_status === "pending" && (
              <div style={{ padding: "1rem", borderRadius: "0.75rem", background: "#fffbeb", border: "1px solid #fde68a", marginBottom: "1.25rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "0.75rem" }}>
                  <div>
                    <strong style={{ color: "#b45309", display: "flex", alignItems: "center", gap: "0.4rem", fontSize: "0.9rem" }}>
                      <AlertTriangle size={16} /> Reinstatement Application Received
                    </strong>
                    <p style={{ margin: "0.4rem 0 0 0", fontSize: "0.85rem", color: "#78350f" }}>
                      <strong>Applicant Note:</strong> {selectedReviewer.reinstatement_reason || "Requested reinstatement to active reviewer status."}
                    </p>
                    {selectedReviewer.reinstatement_requested_at && (
                      <span style={{ fontSize: "0.75rem", color: "#92400e", marginTop: "0.25rem", display: "block" }}>
                        Submitted on: {new Date(selectedReviewer.reinstatement_requested_at).toLocaleString()}
                      </span>
                    )}
                  </div>
                  <button
                    type="button"
                    className="admin-primary-button"
                    style={{ fontSize: "0.8rem", padding: "0.35rem 0.75rem", background: "#059669", borderColor: "#059669", whiteSpace: "nowrap" }}
                    onClick={() => handleReinstate(selectedReviewer.id)}
                    disabled={submittingAction}
                  >
                    <Unlock size={14} /> Approve Reinstatement
                  </button>
                </div>
              </div>
            )}

            {selectedReviewer.status === "suspended" && (
              <div style={{ padding: "1rem", borderRadius: "0.75rem", background: "#fef2f2", border: "1px solid #fecaca", marginBottom: "1.25rem" }}>
                <strong style={{ color: "#b91c1c", display: "flex", alignItems: "center", gap: "0.4rem", fontSize: "0.9rem" }}>
                  <Lock size={16} /> Reviewer Account Suspended
                </strong>
                <p style={{ margin: "0.3rem 0 0 0", fontSize: "0.85rem", color: "#991b1b" }}>
                  {selectedReviewer.suspension_reason ? `Reason: ${selectedReviewer.suspension_reason}` : "Account is locked. Reviewer cannot access reviews or submit scores."}
                </p>
                {selectedReviewer.suspended_at && (
                  <span style={{ fontSize: "0.75rem", color: "#b91c1c", marginTop: "0.25rem", display: "block" }}>
                    Suspended on: {new Date(selectedReviewer.suspended_at).toLocaleString()}
                  </span>
                )}
              </div>
            )}

            {/* Performance Breakdown Metrics (Requested by User) */}
            <div style={{ marginBottom: "1.5rem" }}>
              <h3 style={{ fontSize: "0.95rem", fontWeight: 700, margin: "0 0 0.85rem 0", color: "#374151", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                Reviewer Performance & Decision Metrics
              </h3>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "0.75rem" }}>
                <div style={{ padding: "1rem", borderRadius: "0.75rem", background: "#f9fafb", border: "1px solid #e5e7eb", textAlign: "center" }}>
                  <span style={{ fontSize: "0.75rem", fontWeight: 600, color: "#6b7280", display: "block" }}>Reviews Done</span>
                  <div style={{ fontSize: "1.75rem", fontWeight: 800, color: "#6C4AB6", marginTop: "0.25rem" }}>
                    {selectedReviewer.completed_reviews || 0}
                  </div>
                  <span style={{ fontSize: "0.7rem", color: "#9ca3af" }}>Total completed</span>
                </div>

                <div style={{ padding: "1rem", borderRadius: "0.75rem", background: "#ecfdf5", border: "1px solid #a7f3d0", textAlign: "center" }}>
                  <span style={{ fontSize: "0.75rem", fontWeight: 600, color: "#065f46", display: "block" }}>Approved</span>
                  <div style={{ fontSize: "1.75rem", fontWeight: 800, color: "#059669", marginTop: "0.25rem" }}>
                    {selectedReviewer.approved_count || 0}
                  </div>
                  <span style={{ fontSize: "0.7rem", color: "#047857" }}>Accepted</span>
                </div>

                <div style={{ padding: "1rem", borderRadius: "0.75rem", background: "#fffbeb", border: "1px solid #fde68a", textAlign: "center" }}>
                  <span style={{ fontSize: "0.75rem", fontWeight: 600, color: "#92400e", display: "block" }}>Revisions</span>
                  <div style={{ fontSize: "1.75rem", fontWeight: 800, color: "#d97706", marginTop: "0.25rem" }}>
                    {selectedReviewer.revision_count || 0}
                  </div>
                  <span style={{ fontSize: "0.7rem", color: "#b45309" }}>Sent for revision</span>
                </div>

                <div style={{ padding: "1rem", borderRadius: "0.75rem", background: "#fef2f2", border: "1px solid #fecaca", textAlign: "center" }}>
                  <span style={{ fontSize: "0.75rem", fontWeight: 600, color: "#991b1b", display: "block" }}>Rejected</span>
                  <div style={{ fontSize: "1.75rem", fontWeight: 800, color: "#dc2626", marginTop: "0.25rem" }}>
                    {selectedReviewer.rejected_count || 0}
                  </div>
                  <span style={{ fontSize: "0.7rem", color: "#b91c1c" }}>Declined</span>
                </div>
              </div>
            </div>

            {/* Additional Profile Info */}
            <div style={{ background: "#f9fafb", borderRadius: "0.75rem", padding: "1.25rem", marginBottom: "1.5rem", border: "1px solid #e5e7eb" }}>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "0.85rem", fontSize: "0.85rem" }}>
                <div>
                  <strong style={{ color: "#374151" }}>Specialization:</strong>
                  <div style={{ color: "#111827", marginTop: "0.15rem" }}>{selectedReviewer.specialization || "General Medicine"}</div>
                </div>
                <div>
                  <strong style={{ color: "#374151" }}>Designation:</strong>
                  <div style={{ color: "#111827", marginTop: "0.15rem" }}>{selectedReviewer.designation || "Reviewer"}</div>
                </div>
                <div>
                  <strong style={{ color: "#374151" }}>Institution:</strong>
                  <div style={{ color: "#111827", marginTop: "0.15rem" }}>{selectedReviewer.institution || "GAIMS"}</div>
                </div>
                <div>
                  <strong style={{ color: "#374151" }}>Country:</strong>
                  <div style={{ color: "#111827", marginTop: "0.15rem" }}>{selectedReviewer.country || "India"}</div>
                </div>
                <div>
                  <strong style={{ color: "#374151" }}>Workload Assigned:</strong>
                  <div style={{ color: "#111827", marginTop: "0.15rem" }}>{selectedReviewer.assigned_count || 0} abstracts</div>
                </div>
                <div>
                  <strong style={{ color: "#374151" }}>Workload Pending:</strong>
                  <div style={{ color: "#111827", marginTop: "0.15rem" }}>{selectedReviewer.pending_count || 0} abstracts</div>
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "1rem", borderTop: "1px solid #f3f4f6", paddingTop: "1.25rem" }}>
              <div>
                {selectedReviewer.status === "suspended" ? (
                  <button
                    type="button"
                    className="admin-primary-button"
                    style={{ background: "#059669", borderColor: "#059669", display: "inline-flex", alignItems: "center", gap: "0.4rem" }}
                    onClick={() => handleReinstate(selectedReviewer.id)}
                    disabled={submittingAction}
                  >
                    <Unlock size={15} /> Unsuspend Reviewer
                  </button>
                ) : (
                  <button
                    type="button"
                    className="admin-secondary-button"
                    style={{ color: "#dc2626", borderColor: "#fecaca", background: "#fef2f2", display: "inline-flex", alignItems: "center", gap: "0.4rem", fontWeight: 700 }}
                    onClick={() => {
                      setSuspensionReason("");
                      setShowSuspendModal(true);
                    }}
                    disabled={submittingAction}
                  >
                    <Lock size={15} /> Suspend Reviewer
                  </button>
                )}
              </div>

              <button
                type="button"
                className="admin-secondary-button"
                onClick={() => setSelectedReviewer(null)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* POPUP: Suspend Confirmation Modal */}
      {showSuspendModal && selectedReviewer && (
        <div
          className="admin-modal-overlay"
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.6)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1100,
            padding: "1rem",
          }}
          onClick={() => setShowSuspendModal(false)}
        >
          <div
            className="admin-panel"
            style={{
              width: "100%",
              maxWidth: "480px",
              margin: 0,
              padding: "2rem",
              borderRadius: "1rem",
              boxShadow: "0 25px 50px -12px rgba(0,0,0,0.3)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ width: "48px", height: "48px", borderRadius: "50%", background: "#fee2e2", color: "#dc2626", display: "grid", placeItems: "center", marginBottom: "1rem" }}>
              <ShieldAlert size={24} />
            </div>

            <h2 style={{ fontSize: "1.3rem", fontWeight: 800, margin: "0 0 0.5rem 0", color: "#111827" }}>
              Suspend {selectedReviewer.name}?
            </h2>
            <p className="admin-muted" style={{ fontSize: "0.875rem", margin: "0 0 1.25rem 0" }}>
              When suspended, the reviewer dashboard will be completely locked. They will not be able to evaluate abstracts and will only see an option to <strong>Apply for reinstatement</strong>.
            </p>

            <div style={{ marginBottom: "1.25rem" }}>
              <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, color: "#374151", marginBottom: "0.4rem" }}>
                Reason for suspension (optional)
              </label>
              <textarea
                rows={3}
                placeholder="e.g. Inactivity, conflict of interest, or pending review..."
                value={suspensionReason}
                onChange={(e) => setSuspensionReason(e.target.value)}
                style={{ width: "100%", padding: "0.6rem", borderRadius: "0.5rem", border: "1px solid #d1d5db", fontSize: "0.85rem", boxSizing: "border-box" }}
              />
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem" }}>
              <button
                type="button"
                className="admin-secondary-button"
                onClick={() => setShowSuspendModal(false)}
                disabled={submittingAction}
              >
                Cancel
              </button>
              <button
                type="button"
                className="admin-primary-button"
                style={{ background: "#dc2626", borderColor: "#dc2626" }}
                onClick={handleSuspendConfirm}
                disabled={submittingAction}
              >
                {submittingAction ? "Suspending..." : "Confirm Suspension"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* POPUP: Add Reviewer Modal */}
      {showAddModal && (
        <div
          className="admin-modal-overlay"
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
            padding: "1rem",
          }}
          onClick={() => setShowAddModal(false)}
        >
          <div
            className="admin-panel"
            style={{
              width: "100%",
              maxWidth: "600px",
              maxHeight: "90vh",
              overflowY: "auto",
              margin: 0,
              padding: "2rem",
              borderRadius: "1.25rem",
              boxShadow: "0 25px 50px -12px rgba(0,0,0,0.25)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem", borderBottom: "1px solid #f3f4f6", paddingBottom: "0.75rem" }}>
              <div>
                <h2 style={{ fontSize: "1.3rem", fontWeight: 800, margin: 0, color: "#111827" }}>
                  Add Scientific Reviewer
                </h2>
                <p className="admin-muted" style={{ margin: "0.2rem 0 0 0", fontSize: "0.85rem" }}>
                  Create a new reviewer user with direct assignment to the scientific committee reviewer role.
                </p>
              </div>
              <button
                type="button"
                className="admin-icon-button"
                onClick={() => setShowAddModal(false)}
              >
                <X size={18} />
              </button>
            </div>

            {addError && (
              <div style={{ padding: "0.75rem 1rem", borderRadius: "0.5rem", background: "#fef2f2", color: "#b91c1c", fontSize: "0.85rem", marginBottom: "1rem" }}>
                {addError}
              </div>
            )}

            <form onSubmit={handleAddReviewerSubmit}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1rem" }}>
                <div>
                  <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, color: "#374151", marginBottom: "0.35rem" }}>
                    Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Dr. Rajesh Patel"
                    value={newReviewer.name}
                    onChange={(e) => setNewReviewer({ ...newReviewer, name: e.target.value })}
                    style={{ width: "100%", padding: "0.6rem", borderRadius: "0.5rem", border: "1px solid #d1d5db", fontSize: "0.85rem", boxSizing: "border-box" }}
                  />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, color: "#374151", marginBottom: "0.35rem" }}>
                    Email Address *
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="rajesh.patel@gaims.org"
                    value={newReviewer.email}
                    onChange={(e) => setNewReviewer({ ...newReviewer, email: e.target.value })}
                    style={{ width: "100%", padding: "0.6rem", borderRadius: "0.5rem", border: "1px solid #d1d5db", fontSize: "0.85rem", boxSizing: "border-box" }}
                  />
                </div>
              </div>

              <div style={{ marginBottom: "1rem" }}>
                <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, color: "#374151", marginBottom: "0.35rem" }}>
                  Temporary Password
                </label>
                <input
                  type="text"
                  value={newReviewer.password}
                  onChange={(e) => setNewReviewer({ ...newReviewer, password: e.target.value })}
                  style={{ width: "100%", padding: "0.6rem", borderRadius: "0.5rem", border: "1px solid #d1d5db", fontSize: "0.85rem", boxSizing: "border-box" }}
                />
                <span style={{ fontSize: "0.75rem", color: "#6b7280", marginTop: "0.2rem", display: "block" }}>
                  Default is <code>Reviewer@123</code>. The reviewer can use this to sign into the portal.
                </span>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1rem" }}>
                <div>
                  <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, color: "#374151", marginBottom: "0.35rem" }}>
                    Specialization
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Cardiology, Public Health, Pediatrics"
                    value={newReviewer.specialization}
                    onChange={(e) => setNewReviewer({ ...newReviewer, specialization: e.target.value })}
                    style={{ width: "100%", padding: "0.6rem", borderRadius: "0.5rem", border: "1px solid #d1d5db", fontSize: "0.85rem", boxSizing: "border-box" }}
                  />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, color: "#374151", marginBottom: "0.35rem" }}>
                    Designation
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Associate Professor, Consultant"
                    value={newReviewer.designation}
                    onChange={(e) => setNewReviewer({ ...newReviewer, designation: e.target.value })}
                    style={{ width: "100%", padding: "0.6rem", borderRadius: "0.5rem", border: "1px solid #d1d5db", fontSize: "0.85rem", boxSizing: "border-box" }}
                  />
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1.5rem" }}>
                <div>
                  <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, color: "#374151", marginBottom: "0.35rem" }}>
                    Institution / Hospital
                  </label>
                  <input
                    type="text"
                    placeholder="GAIMS"
                    value={newReviewer.institution}
                    onChange={(e) => setNewReviewer({ ...newReviewer, institution: e.target.value })}
                    style={{ width: "100%", padding: "0.6rem", borderRadius: "0.5rem", border: "1px solid #d1d5db", fontSize: "0.85rem", boxSizing: "border-box" }}
                  />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, color: "#374151", marginBottom: "0.35rem" }}>
                    Country
                  </label>
                  <input
                    type="text"
                    placeholder="India"
                    value={newReviewer.country}
                    onChange={(e) => setNewReviewer({ ...newReviewer, country: e.target.value })}
                    style={{ width: "100%", padding: "0.6rem", borderRadius: "0.5rem", border: "1px solid #d1d5db", fontSize: "0.85rem", boxSizing: "border-box" }}
                  />
                </div>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem" }}>
                <button
                  type="button"
                  className="admin-secondary-button"
                  onClick={() => setShowAddModal(false)}
                  disabled={submittingAction}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="admin-primary-button"
                  disabled={submittingAction}
                >
                  {submittingAction ? "Adding Reviewer..." : "Create Reviewer Account"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default ScientificTeam;
