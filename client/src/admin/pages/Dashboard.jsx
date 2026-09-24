import {
  Activity,
  AlertCircle,
  AlertTriangle,
  ArrowRight,
  Award,
  CalendarDays,
  CheckCircle2,
  Clock,
  Database,
  FileCheck2,
  FileText,
  Mail,
  MapPin,
  Mic2,
  PlaneTakeoff,
  RefreshCw,
  Server,
  ShieldCheck,
  Sparkles,
  Store,
  Users,
  Wrench,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";

const formatNumber = (value) => Number(value || 0).toLocaleString("en-US");

function Dashboard({ user, api, onNavigate }) {
  const [researchStats, setResearchStats] = useState({ total: 0, underReview: 0, accepted: 0, rejected: 0 });
  const [speakerStats, setSpeakerStats] = useState({ total: 0, drafts: 0, featured: 0 });
  const [workshopStats, setWorkshopStats] = useState({ upcoming: 0, seatsRemaining: 0, occupancy: 0 });
  const [workshops, setWorkshops] = useState([]);
  const [visas, setVisas] = useState({ total: 0, pending: 0, approved: 0, rejected: 0 });
  const [certificates, setCertificates] = useState({ totalGenerated: 0, pendingCertificates: 0, issuedToday: 0 });
  const [activeSponsors, setActiveSponsors] = useState(0);
  const [sessions, setSessions] = useState([]);
  const [systemData, setSystemData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadAllData = useCallback(async () => {
    setLoading(true);
    setError("");

    const results = await Promise.allSettled([
      api.get("/api/research/stats"),
      api.get("/api/speakers/stats"),
      api.get("/api/workshops/stats"),
      api.get("/api/workshops"),
      api.get("/api/visa-applications"),
      api.get("/api/certificates/dashboard"),
      api.get("/api/sponsorship/dashboard"),
      api.get("/api/speakers/sessions"),
      api.get("/api/system-admin/dashboard"),
    ]);

    const [
      resResearch,
      resSpeakers,
      resWorkshopStats,
      resWorkshops,
      resVisas,
      resCerts,
      resSponsors,
      resSessions,
      resSystem,
    ] = results;

    if (resResearch.status === "fulfilled") {
      setResearchStats(resResearch.value.data.stats || { total: 0, underReview: 0, accepted: 0, rejected: 0 });
    }
    if (resSpeakers.status === "fulfilled") {
      setSpeakerStats(resSpeakers.value.data.stats || { total: 0, drafts: 0, featured: 0 });
    }
    if (resWorkshopStats.status === "fulfilled") {
      setWorkshopStats(resWorkshopStats.value.data.stats || { upcoming: 0, seatsRemaining: 0, occupancy: 0 });
    }
    if (resWorkshops.status === "fulfilled") {
      setWorkshops(resWorkshops.value.data.workshops || []);
    }
    if (resVisas.status === "fulfilled") {
      const vData = resVisas.value.data;
      if (vData.stats) {
        setVisas(vData.stats);
      } else if (Array.isArray(vData.data)) {
        const apps = vData.data;
        const pending = apps.filter((a) => a.status === "Pending").length;
        const approved = apps.filter((a) => a.status === "Approved" || a.status === "Letter Generated").length;
        setVisas({ total: apps.length, pending, approved, rejected: apps.length - pending - approved });
      }
    }
    if (resCerts.status === "fulfilled") {
      setCertificates(resCerts.value.data.metrics || { totalGenerated: 0, pendingCertificates: 0, issuedToday: 0 });
    }
    if (resSponsors.status === "fulfilled") {
      const sp = resSponsors.value.data.sponsors;
      setActiveSponsors(Array.isArray(sp) ? sp.length : 0);
    }
    if (resSessions.status === "fulfilled") {
      setSessions(resSessions.value.data.sessions || []);
    }
    if (resSystem.status === "fulfilled") {
      setSystemData(resSystem.value.data);
    }

    setLoading(false);
  }, [api]);

  useEffect(() => {
    loadAllData();
  }, [loadAllData]);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
  const firstName = user?.name ? user.name.split(" ")[0] : "Admin";

  const confirmedSpeakers = Math.max(0, (speakerStats.total || 0) - (speakerStats.drafts || 0));
  const pendingVisas = visas.pending || 0;
  const pendingAbstracts = researchStats.underReview || 0;
  const pendingCerts = certificates.pendingCertificates || 0;
  const totalPendingActions = pendingVisas + pendingAbstracts + (speakerStats.drafts || 0) + pendingCerts;

  // Key metrics cards
  const kpis = [
    { label: "Total Abstracts", value: formatNumber(researchStats.total), icon: FileText, color: "#6C63FF", action: "research" },
    { label: "Under Review", value: formatNumber(researchStats.underReview), icon: Clock, color: "#f59e0b", action: "research" },
    { label: "Confirmed Speakers", value: formatNumber(confirmedSpeakers), icon: Mic2, color: "#10b981", action: "speakers" },
    { label: "Active Workshops", value: formatNumber(workshopStats.upcoming || workshops.length), icon: Wrench, color: "#3b82f6", action: "workshops" },
    { label: "Pending Visas", value: formatNumber(pendingVisas), icon: PlaneTakeoff, color: "#ec4899", action: "visa-applications" },
    { label: "Certificates Issued", value: formatNumber(certificates.totalGenerated), icon: Award, color: "#8b5cf6", action: "certificate-reports" },
    { label: "Active Sponsors", value: formatNumber(activeSponsors), icon: Store, color: "#06b6d4", action: "partners" },
    { label: "Pending Actions", value: formatNumber(totalPendingActions), icon: AlertCircle, color: totalPendingActions > 0 ? "#ef4444" : "#10b981" },
  ];

  // Pipeline calculations
  const totalSubmissions = researchStats.total || 0;
  const underReviewPct = totalSubmissions > 0 ? Math.round((researchStats.underReview / totalSubmissions) * 100) : 0;
  const acceptedPct = totalSubmissions > 0 ? Math.round((researchStats.accepted / totalSubmissions) * 100) : 0;
  const rejectedPct = totalSubmissions > 0 ? Math.round((researchStats.rejected / totalSubmissions) * 100) : 0;

  const navigateTo = (page) => {
    if (onNavigate) onNavigate(page);
  };

  return (
    <div className="admin-dashboard">
      {/* 1. Welcome / Hero Area */}
      <section className="admin-hero-panel">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "1rem" }}>
          <div>
            <p className="admin-eyebrow" style={{ color: "#6C63FF", fontWeight: "600", marginBottom: "0.25rem" }}>
              {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}
            </p>
            <h1 style={{ fontSize: "1.875rem", fontWeight: "700", color: "#17172B", marginBottom: "0.5rem" }}>
              {greeting}, {firstName}! 👋
            </h1>
            <p className="admin-muted" style={{ fontSize: "1rem", margin: 0 }}>
              Here's what's happening with GHC and the web portal today.
            </p>
          </div>
          <button className="admin-primary-button" type="button" onClick={loadAllData} disabled={loading}>
            <RefreshCw size={16} className={loading ? "animate-spin" : ""} /> Refresh Data
          </button>
        </div>
      </section>

      {error && <div className="admin-error">{error}</div>}

      {/* 2. Key Statistics Grid */}
      <section className="admin-kpi-grid">
        {kpis.map((kpi) => {
          const Icon = kpi.icon;
          return (
            <article
              key={kpi.label}
              className="admin-kpi-card"
              style={{ cursor: kpi.action ? "pointer" : "default" }}
              onClick={() => kpi.action && navigateTo(kpi.action)}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ padding: "8px", borderRadius: "10px", backgroundColor: `${kpi.color}15`, color: kpi.color, display: "inline-flex" }}>
                  <Icon size={20} />
                </span>
                {kpi.action && <ArrowRight size={14} style={{ color: "#94a3b8" }} />}
              </div>
              <strong style={{ fontSize: "1.75rem", marginTop: "0.75rem", display: "block" }}>
                {loading ? "..." : kpi.value}
              </strong>
              <span style={{ fontSize: "0.875rem", color: "#64748b", fontWeight: "500" }}>{kpi.label}</span>
            </article>
          );
        })}
      </section>

      {/* 3. Pending Actions & System Health Split */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))", gap: "1.5rem" }}>
        {/* Pending Actions */}
        <section className="admin-panel" style={{ margin: 0 }}>
          <div className="admin-panel-heading">
            <div>
              <p className="admin-eyebrow">Requires Attention</p>
              <h2>Pending Actions</h2>
            </div>
            <span className="status-pill" style={{ backgroundColor: totalPendingActions > 0 ? "#fef2f2" : "#f0fdf4", color: totalPendingActions > 0 ? "#ef4444" : "#10b981", fontWeight: "600" }}>
              {totalPendingActions} Pending
            </span>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", marginTop: "1rem" }}>
            {pendingAbstracts > 0 && (
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px", borderRadius: "12px", backgroundColor: "#fffbeb", border: "1px solid #fef3c7" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <Clock size={18} style={{ color: "#d97706" }} />
                  <div>
                    <strong style={{ fontSize: "14px", color: "#92400e" }}>{pendingAbstracts} abstracts awaiting review</strong>
                    <p style={{ fontSize: "12px", color: "#b45309", margin: 0 }}>Scientific committee review pending</p>
                  </div>
                </div>
                <button className="admin-secondary-button" type="button" onClick={() => navigateTo("research")} style={{ fontSize: "12px", padding: "6px 12px" }}>
                  Review
                </button>
              </div>
            )}

            {pendingVisas > 0 && (
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px", borderRadius: "12px", backgroundColor: "#fdf2f8", border: "1px solid #fce7f3" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <PlaneTakeoff size={18} style={{ color: "#db2777" }} />
                  <div>
                    <strong style={{ fontSize: "14px", color: "#9d174d" }}>{pendingVisas} visa applications pending</strong>
                    <p style={{ fontSize: "12px", color: "#be185d", margin: 0 }}>Invitation letter generation required</p>
                  </div>
                </div>
                <button className="admin-secondary-button" type="button" onClick={() => navigateTo("visa-applications")} style={{ fontSize: "12px", padding: "6px 12px" }}>
                  Review
                </button>
              </div>
            )}

            {speakerStats.drafts > 0 && (
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px", borderRadius: "12px", backgroundColor: "#f8fafc", border: "1px solid #e2e8f0" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <Mic2 size={18} style={{ color: "#64748b" }} />
                  <div>
                    <strong style={{ fontSize: "14px", color: "#1e293b" }}>{speakerStats.drafts} draft speaker profiles</strong>
                    <p style={{ fontSize: "12px", color: "#64748b", margin: 0 }}>Ready to be reviewed and published</p>
                  </div>
                </div>
                <button className="admin-secondary-button" type="button" onClick={() => navigateTo("speakers")} style={{ fontSize: "12px", padding: "6px 12px" }}>
                  View
                </button>
              </div>
            )}

            {totalPendingActions === 0 && (
              <div style={{ textAlign: "center", padding: "2rem 1rem", color: "#10b981" }}>
                <CheckCircle2 size={36} style={{ margin: "0 auto 0.5rem" }} />
                <strong style={{ display: "block", color: "#065f46" }}>All caught up!</strong>
                <p style={{ fontSize: "13px", color: "#047857", margin: 0 }}>No critical operational items awaiting your review.</p>
              </div>
            )}
          </div>
        </section>

        {/* System Health */}
        <section className="admin-panel" style={{ margin: 0 }}>
          <div className="admin-panel-heading">
            <div>
              <p className="admin-eyebrow">Technical Health</p>
              <h2>System Health</h2>
            </div>
            <button className="admin-secondary-button" type="button" onClick={() => navigateTo("api-monitoring")} style={{ fontSize: "12px", padding: "6px 12px" }}>
              API Monitoring
            </button>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginTop: "1rem" }}>
            <div style={{ padding: "14px", borderRadius: "12px", backgroundColor: "#f8fafc", border: "1px solid #e2e8f0", display: "flex", alignItems: "center", gap: "12px" }}>
              <Server size={20} style={{ color: "#10b981" }} />
              <div>
                <span style={{ fontSize: "11px", color: "#64748b", display: "block" }}>API Gateway</span>
                <strong style={{ fontSize: "13px", color: "#0f172a" }}>Operational</strong>
              </div>
            </div>

            <div style={{ padding: "14px", borderRadius: "12px", backgroundColor: "#f8fafc", border: "1px solid #e2e8f0", display: "flex", alignItems: "center", gap: "12px" }}>
              <Database size={20} style={{ color: "#10b981" }} />
              <div>
                <span style={{ fontSize: "11px", color: "#64748b", display: "block" }}>Database</span>
                <strong style={{ fontSize: "13px", color: "#0f172a" }}>{systemData?.statuses?.database || "Healthy"}</strong>
              </div>
            </div>

            <div style={{ padding: "14px", borderRadius: "12px", backgroundColor: "#f8fafc", border: "1px solid #e2e8f0", display: "flex", alignItems: "center", gap: "12px" }}>
              <Mail size={20} style={{ color: "#10b981" }} />
              <div>
                <span style={{ fontSize: "11px", color: "#64748b", display: "block" }}>Email Service</span>
                <strong style={{ fontSize: "13px", color: "#0f172a" }}>Operational</strong>
              </div>
            </div>

            <div style={{ padding: "14px", borderRadius: "12px", backgroundColor: "#f8fafc", border: "1px solid #e2e8f0", display: "flex", alignItems: "center", gap: "12px" }}>
              <ShieldCheck size={20} style={{ color: "#6C63FF" }} />
              <div>
                <span style={{ fontSize: "11px", color: "#64748b", display: "block" }}>System Score</span>
                <strong style={{ fontSize: "13px", color: "#6C63FF" }}>{systemData?.healthScore || 100}%</strong>
              </div>
            </div>
          </div>

          <div style={{ marginTop: "1rem", padding: "10px 14px", borderRadius: "10px", backgroundColor: "#f1f5f9", display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: "12px", color: "#475569" }}>
            <span>SSL & HTTPS: Valid</span>
            <span>Audit Trail: Active</span>
          </div>
        </section>
      </div>

      {/* 4. Abstract Pipeline */}
      <section className="admin-panel">
        <div className="admin-panel-heading">
          <div>
            <p className="admin-eyebrow">Scientific Submissions</p>
            <h2>Abstract Pipeline</h2>
          </div>
          <button className="admin-secondary-button" type="button" onClick={() => navigateTo("research")}>
            Manage Abstracts <ArrowRight size={14} style={{ marginLeft: "4px" }} />
          </button>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "1rem", marginTop: "1.25rem" }}>
          <div style={{ padding: "1rem", borderRadius: "14px", backgroundColor: "#f8fafc", borderLeft: "4px solid #6C63FF" }}>
            <span style={{ fontSize: "12px", color: "#64748b", fontWeight: "600", textTransform: "uppercase" }}>1. Submitted</span>
            <strong style={{ display: "block", fontSize: "1.75rem", color: "#17172B", marginTop: "0.25rem" }}>{researchStats.total || 0}</strong>
            <small style={{ fontSize: "12px", color: "#94a3b8" }}>100% of pipeline</small>
          </div>

          <div style={{ padding: "1rem", borderRadius: "14px", backgroundColor: "#f8fafc", borderLeft: "4px solid #f59e0b" }}>
            <span style={{ fontSize: "12px", color: "#64748b", fontWeight: "600", textTransform: "uppercase" }}>2. Under Review</span>
            <strong style={{ display: "block", fontSize: "1.75rem", color: "#17172B", marginTop: "0.25rem" }}>{researchStats.underReview || 0}</strong>
            <small style={{ fontSize: "12px", color: "#94a3b8" }}>{underReviewPct}% of total</small>
          </div>

          <div style={{ padding: "1rem", borderRadius: "14px", backgroundColor: "#f8fafc", borderLeft: "4px solid #10b981" }}>
            <span style={{ fontSize: "12px", color: "#64748b", fontWeight: "600", textTransform: "uppercase" }}>3. Accepted</span>
            <strong style={{ display: "block", fontSize: "1.75rem", color: "#17172B", marginTop: "0.25rem" }}>{researchStats.accepted || 0}</strong>
            <small style={{ fontSize: "12px", color: "#94a3b8" }}>{acceptedPct}% acceptance rate</small>
          </div>

          <div style={{ padding: "1rem", borderRadius: "14px", backgroundColor: "#f8fafc", borderLeft: "4px solid #ef4444" }}>
            <span style={{ fontSize: "12px", color: "#64748b", fontWeight: "600", textTransform: "uppercase" }}>4. Rejected</span>
            <strong style={{ display: "block", fontSize: "1.75rem", color: "#17172B", marginTop: "0.25rem" }}>{researchStats.rejected || 0}</strong>
            <small style={{ fontSize: "12px", color: "#94a3b8" }}>{rejectedPct}% of total</small>
          </div>
        </div>
      </section>

      {/* 5. Upcoming Schedule & Workshops Side-by-Side */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(380px, 1fr))", gap: "1.5rem" }}>
        {/* Upcoming Schedule */}
        <section className="admin-panel" style={{ margin: 0 }}>
          <div className="admin-panel-heading">
            <div>
              <p className="admin-eyebrow">Program Schedule</p>
              <h2>Upcoming Sessions</h2>
            </div>
            <button className="admin-secondary-button" type="button" onClick={() => navigateTo("schedule")}>
              Full Schedule
            </button>
          </div>

          <div style={{ marginTop: "1rem", display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            {sessions.slice(0, 4).map((session) => (
              <div key={session.id} style={{ padding: "12px 16px", borderRadius: "12px", backgroundColor: "#ffffff", border: "1px solid #f1f5f9", boxShadow: "0 2px 6px rgba(0,0,0,0.02)" }}>
                <strong style={{ fontSize: "14px", color: "#1e293b", display: "block" }}>{session.title}</strong>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "12px", marginTop: "6px", fontSize: "12px", color: "#64748b" }}>
                  {session.start_time && (
                    <span style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}>
                      <Clock size={12} />
                      {new Date(session.start_time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  )}
                  {session.hall_name && (
                    <span style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}>
                      <MapPin size={12} /> {session.hall_name}
                    </span>
                  )}
                  {session.speaker_name && (
                    <span style={{ color: "#6C63FF", fontWeight: "500" }}>@{session.speaker_name}</span>
                  )}
                </div>
              </div>
            ))}
            {sessions.length === 0 && (
              <p className="admin-muted" style={{ textAlign: "center", padding: "2rem" }}>No scheduled sessions yet.</p>
            )}
          </div>
        </section>

        {/* Upcoming Workshops */}
        <section className="admin-panel" style={{ margin: 0 }}>
          <div className="admin-panel-heading">
            <div>
              <p className="admin-eyebrow">Interactive Tracks</p>
              <h2>Workshops</h2>
            </div>
            <button className="admin-secondary-button" type="button" onClick={() => navigateTo("workshops")}>
              All Workshops
            </button>
          </div>

          <div className="speaker-table-wrap" style={{ marginTop: "1rem" }}>
            <table className="speaker-table">
              <thead>
                <tr>
                  <th>Workshop</th>
                  <th>Date</th>
                  <th>Seats</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {workshops.slice(0, 4).map((ws) => (
                  <tr key={ws.id}>
                    <td>
                      <strong style={{ fontSize: "13px" }}>{ws.title}</strong>
                      <small style={{ display: "block", color: "#64748b" }}>{ws.faculty || "Faculty TBD"}</small>
                    </td>
                    <td>{ws.date ? new Date(ws.date).toLocaleDateString() : "-"}</td>
                    <td>{ws.registeredCount || 0} / {ws.capacity || 0}</td>
                    <td>
                      <span className={`status-pill ${ws.status === "published" ? "paid" : "pending"}`}>
                        {ws.status || "draft"}
                      </span>
                    </td>
                  </tr>
                ))}
                {workshops.length === 0 && (
                  <tr><td colSpan={4} style={{ textAlign: "center" }}>No workshops found.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      {/* 6. Recent Activity Timeline */}
      <section className="admin-panel">
        <div className="admin-panel-heading">
          <div>
            <p className="admin-eyebrow">Audit Log</p>
            <h2>Recent System Activity</h2>
          </div>
          <Activity size={20} style={{ color: "#6C63FF" }} />
        </div>

        <div className="admin-activity-list" style={{ marginTop: "1rem" }}>
          {systemData?.recentActivity?.length ? (
            systemData.recentActivity.slice(0, 6).map((activity) => (
              <div key={activity.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: "1px solid #f1f5f9" }}>
                <div>
                  <strong style={{ fontSize: "13px", color: "#1e293b" }}>{activity.action}</strong>
                  <span style={{ fontSize: "12px", color: "#64748b", marginLeft: "8px" }}>
                    {activity.module ? `in ${activity.module}` : ""} {activity.user_name ? `by ${activity.user_name}` : ""}
                  </span>
                </div>
                <small style={{ fontSize: "11px", color: "#94a3b8" }}>
                  {activity.created_at ? new Date(activity.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "Recent"}
                </small>
              </div>
            ))
          ) : (
            <p className="admin-muted">No recent activity logs recorded.</p>
          )}
        </div>
      </section>
    </div>
  );
}

export default Dashboard;
