import { Activity, Award, Banknote, CalendarClock, FileText, Gauge, Mic2, QrCode, Star, TicketCheck, Users, Wrench } from "lucide-react";
import { useEffect, useState } from "react";

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

function Dashboard({ user, api }) {
  const [speakerStats, setSpeakerStats] = useState({ total: 0, featured: 0, keynotes: 0, drafts: 0 });
  const [workshopStats, setWorkshopStats] = useState({ upcoming: 0, seatsRemaining: 0, popularWorkshops: 0, occupancy: 0 });
  const [researchStats, setResearchStats] = useState({ total: 0, underReview: 0, accepted: 0, rejected: 0, awardNominees: 0 });
  const [registrationStats, setRegistrationStats] = useState({ total: 0, paid: 0, pending: 0, attendance: 0, revenue: 0 });

  useEffect(() => {
    api.get("/api/speakers/stats").then((response) => {
      setSpeakerStats(response.data.stats || { total: 0, featured: 0, keynotes: 0, drafts: 0 });
    }).catch(() => {});

    api.get("/api/workshops/stats").then((response) => {
      setWorkshopStats(response.data.stats || { upcoming: 0, seatsRemaining: 0, popularWorkshops: 0, occupancy: 0 });
    }).catch(() => {});

    api.get("/api/research/stats").then((response) => {
      setResearchStats(response.data.stats || { total: 0, underReview: 0, accepted: 0, rejected: 0, awardNominees: 0 });
    }).catch(() => {});

    api.get("/api/register?limit=1&offset=0").then((response) => {
      setRegistrationStats(response.data.stats || { total: 0, paid: 0, pending: 0, attendance: 0, revenue: 0 });
    }).catch(() => {});
  }, [api]);

  const kpis = [
    { label: "Delegates", value: "2,000+", icon: Users },
    { label: "Abstracts", value: "420", icon: FileText },
    { label: "Total speakers", value: speakerStats.total || 0, icon: Mic2 },
    { label: "Featured speakers", value: speakerStats.featured || 0, icon: Star },
    { label: "Keynotes", value: speakerStats.keynotes || 0, icon: Activity },
    { label: "Drafts", value: speakerStats.drafts || 0, icon: FileText },
    { label: "Workshops", value: workshopStats.upcoming || 0, icon: Wrench },
    { label: "Seats remaining", value: workshopStats.seatsRemaining || 0, icon: TicketCheck },
    { label: "Popular workshops", value: workshopStats.popularWorkshops || 0, icon: CalendarClock },
    { label: "Occupancy", value: `${workshopStats.occupancy || 0}%`, icon: Gauge },
    { label: "Research submissions", value: researchStats.total || 0, icon: FileText },
    { label: "Under review", value: researchStats.underReview || 0, icon: Activity },
    { label: "Accepted abstracts", value: researchStats.accepted || 0, icon: Star },
    { label: "Award nominees", value: researchStats.awardNominees || 0, icon: Award },
    { label: "Registrations", value: registrationStats.total || 0, icon: QrCode },
    { label: "Checked in", value: registrationStats.attendance || 0, icon: TicketCheck },
    { label: "Revenue", value: "INR 18L", icon: Banknote },
  ];

  return (
    <div className="admin-dashboard">
      <section className="admin-hero-panel">
        <p className="admin-eyebrow">Dashboard</p>
        <h1>Welcome back, {user.name}</h1>
        <p className="admin-muted">GHC CMS Phase 2A is live with authentication, roles, permissions and the admin shell.</p>
      </section>

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
          {activities.map((activity) => <div key={activity}>{activity}</div>)}
        </div>
      </section>
    </div>
  );
}

export default Dashboard;
