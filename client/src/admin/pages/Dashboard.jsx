import { Activity, Award, Banknote, CalendarClock, FileText, Gauge, Mic2, QrCode, Star, TicketCheck, Users, Wrench } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

const activities = [
  "Speaker CMS module enabled",
  "Workshop CMS module enabled",
  "Speaker image uploads stored in /uploads/speakers",
  "Workshop image uploads stored in /uploads/workshops",
  "Published speakers now power the public site",
  "Published workshops now power the public site",
  "Research CMS module enabled",
  "Accepted abstracts now power the public research hub",
  "Registration and ticket system enabled",
  "Speaker RBAC limited to SUPER_ADMIN, ADMIN and MEDIA",
  "Workshop RBAC includes SUPER_ADMIN, ADMIN, MEDIA and RESEARCH",
];

const emptySpeakerStats = { total: 0, featured: 0, keynotes: 0, drafts: 0 };
const emptyWorkshopStats = { upcoming: 0, seatsRemaining: 0, popularWorkshops: 0, occupancy: 0 };
const emptyResearchStats = { total: 0, underReview: 0, accepted: 0, rejected: 0, awardNominees: 0 };
const emptyRegistrationStats = { total: 0, paid: 0, pending: 0, attendance: 0, revenue: 0 };
const emptyPaymentStats = { revenue: 0, paid: 0, refunds: 0, pending: 0 };

const formatNumber = (value) => Number(value || 0).toLocaleString("en-US");
const formatRevenue = (value) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(Number(value || 0));

function Dashboard({ user, api }) {
  const [superDashboard, setSuperDashboard] = useState(null);
  const [speakerStats, setSpeakerStats] = useState(emptySpeakerStats);
  const [workshopStats, setWorkshopStats] = useState(emptyWorkshopStats);
  const [researchStats, setResearchStats] = useState(emptyResearchStats);
  const [registrationStats, setRegistrationStats] = useState(emptyRegistrationStats);
  const [paymentStats, setPaymentStats] = useState(emptyPaymentStats);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadDashboardStats = useCallback(async ({ silent = false } = {}) => {
    if (!silent) setLoading(true);
    setError("");

    if (user.role === "SUPER_ADMIN") {
      try {
        const response = await api.get("/api/super-admin/dashboard");
        setSuperDashboard(response.data);
      } catch {
        setError("Super Admin dashboard could not be refreshed.");
      } finally {
        setLoading(false);
      }
      return;
    }

    const [
      speakersResult,
      workshopsResult,
      researchResult,
      registrationsResult,
      paymentsResult,
    ] = await Promise.allSettled([
      api.get("/api/speakers/stats"),
      api.get("/api/workshops/stats"),
      api.get("/api/research/stats"),
      api.get("/api/register?limit=1&offset=0"),
      api.get("/api/payments"),
    ]);

    if (speakersResult.status === "fulfilled") {
      setSpeakerStats(speakersResult.value.data.stats || emptySpeakerStats);
    }
    if (workshopsResult.status === "fulfilled") {
      setWorkshopStats(workshopsResult.value.data.stats || emptyWorkshopStats);
    }
    if (researchResult.status === "fulfilled") {
      setResearchStats(researchResult.value.data.stats || emptyResearchStats);
    }
    if (registrationsResult.status === "fulfilled") {
      setRegistrationStats(registrationsResult.value.data.stats || emptyRegistrationStats);
    }
    if (paymentsResult.status === "fulfilled") {
      setPaymentStats(paymentsResult.value.data.stats || emptyPaymentStats);
    }

    const failed = [speakersResult, workshopsResult, researchResult, registrationsResult, paymentsResult]
      .some((result) => result.status === "rejected");

    if (failed) {
      setError("Some dashboard metrics could not be refreshed. Showing the latest available values.");
    }
    setLoading(false);
  }, [api, user.role]);

  useEffect(() => {
    const initialTimer = window.setTimeout(() => loadDashboardStats(), 0);
    const refreshTimer = setInterval(() => loadDashboardStats({ silent: true }), 30000);
    return () => {
      window.clearTimeout(initialTimer);
      clearInterval(refreshTimer);
    };
  }, [loadDashboardStats]);

  const metricValue = (value, formatter = formatNumber) => (loading ? "..." : formatter(value));

  const superKpis = superDashboard ? [
    { label: "Total registrations", value: metricValue(superDashboard.kpis.registrations), icon: QrCode },
    { label: "Total speakers", value: metricValue(superDashboard.kpis.speakers), icon: Mic2 },
    { label: "Total workshops", value: metricValue(superDashboard.kpis.workshops), icon: Wrench },
    { label: "Total sponsors", value: metricValue(superDashboard.kpis.sponsors), icon: Award },
    { label: "Scientific abstracts", value: metricValue(superDashboard.kpis.abstracts), icon: FileText },
    { label: "Total users", value: metricValue(superDashboard.kpis.users), icon: Users },
    { label: "Pending approvals", value: metricValue(superDashboard.kpis.pendingApprovals), icon: Activity },
    { label: "Revenue summary", value: metricValue(superDashboard.kpis.revenue, (value) => `INR ${Number(value || 0).toLocaleString("en-IN")}`), icon: Banknote },
  ] : [];

  const kpis = user.role === "SUPER_ADMIN" ? superKpis : [
    { label: "Delegates", value: metricValue(registrationStats.total), icon: Users },
    { label: "Abstracts", value: metricValue(researchStats.total), icon: FileText },
    { label: "Total speakers", value: metricValue(speakerStats.total), icon: Mic2 },
    { label: "Featured speakers", value: metricValue(speakerStats.featured), icon: Star },
    { label: "Keynotes", value: metricValue(speakerStats.keynotes), icon: Activity },
    { label: "Drafts", value: metricValue(speakerStats.drafts), icon: FileText },
    { label: "Workshops", value: metricValue(workshopStats.upcoming), icon: Wrench },
    { label: "Seats remaining", value: metricValue(workshopStats.seatsRemaining), icon: TicketCheck },
    { label: "Popular workshops", value: metricValue(workshopStats.popularWorkshops), icon: CalendarClock },
    { label: "Occupancy", value: loading ? "..." : `${workshopStats.occupancy || 0}%`, icon: Gauge },
    { label: "Research submissions", value: metricValue(researchStats.total), icon: FileText },
    { label: "Under review", value: metricValue(researchStats.underReview), icon: Activity },
    { label: "Accepted abstracts", value: metricValue(researchStats.accepted), icon: Star },
    { label: "Award nominees", value: metricValue(researchStats.awardNominees), icon: Award },
    { label: "Registrations", value: metricValue(registrationStats.total), icon: QrCode },
    { label: "Checked in", value: metricValue(registrationStats.attendance), icon: TicketCheck },
    { label: "Revenue", value: metricValue(paymentStats.revenue, formatRevenue), icon: Banknote },
  ];

  return (
    <div className="admin-dashboard">
      <section className="admin-hero-panel">
        <p className="admin-eyebrow">Dashboard</p>
        <h1>Welcome back, {user.name}</h1>
        <p className="admin-muted">
          {user.role === "SUPER_ADMIN"
            ? "Unrestricted command center for teams, content, analytics and conference operations."
            : "GHC CMS is live with authentication, roles, permissions and the admin shell."}
        </p>
      </section>

      {error && <div className="admin-error">{error}</div>}

      <section className="admin-kpi-grid">
        {kpis.map((kpi) => {
          const Icon = kpi.icon;
          return (
            <article className="admin-kpi-card" key={kpi.label}>
              <Icon size={20} />
              <strong>{kpi.value}</strong>
              <span>{kpi.label}</span>
            </article>
          );
        })}
      </section>

      <section className="admin-panel">
        <div className="admin-panel-heading">
          <div>
            <p className="admin-eyebrow">Recent activity</p>
            <h2>System timeline</h2>
          </div>
          <Activity size={20} />
        </div>
        <div className="admin-activity-list">
          {user.role === "SUPER_ADMIN" && superDashboard?.recentActivity?.length
            ? superDashboard.recentActivity.map((activity) => (
              <div key={activity.id}>
                <strong>{activity.action}</strong>
                <span>{activity.module || "cms"} {activity.user_name ? `by ${activity.user_name}` : ""}</span>
              </div>
            ))
            : activities.map((activity) => <div key={activity}>{activity}</div>)}
        </div>
      </section>
    </div>
  );
}

export default Dashboard;
