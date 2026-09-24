import { useCallback, useEffect, useState } from "react";
import axios from "axios";
import { API_BASE_URL } from "../config/api";
import DashboardLayout from "./DashboardLayout";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Speakers from "./pages/Speakers";
import Sessions from "./pages/Sessions";
import Schedule from "./pages/Schedule";
import SpeakerDirectories from "./pages/SpeakerDirectories";
import SpeakerResources from "./pages/SpeakerResources";
import Cme from "./pages/Cme";
import Workshops from "./pages/Workshops";
import Events from "./pages/Events";
import EventDirectory from "./pages/EventDirectory";
import HospitalityCMS from "./pages/HospitalityCMS";
import EventReports from "./pages/EventReports";
import Research from "./pages/Research";
import Scientific from "./pages/Scientific";
import ScientificTeam from "./pages/ScientificTeam";
import ScientificDirectory from "./pages/ScientificDirectory";
import Reviews from "./pages/Reviews";
import Presentations from "./pages/Presentations";
import ScientificReports from "./pages/ScientificReports";
import Registrations from "./pages/Registrations";
import AdminTickets from "./pages/AdminTickets";
import AdminPartners from "./pages/AdminPartners";
import SponsorshipDirectory from "./pages/SponsorshipDirectory";
import SponsorshipReports from "./pages/SponsorshipReports";
import Payments from "./pages/Payments";
import Analytics from "./pages/Analytics";
import Badges from "./pages/Badges";
import Coupons from "./pages/Coupons";
import RegistrationReports from "./pages/RegistrationReports";
import AdminMedia from "./pages/AdminMedia";
import Marketing from "./pages/Marketing";
import MarketingContent from "./pages/MarketingContent";
import SeoManagement from "./pages/SeoManagement";
import AdminTrailer from "./pages/AdminTrailer";
import Checkin from "./pages/Checkin";
import Certificates from "./pages/Certificates";
import CertificateDirectory from "./pages/CertificateDirectory";
import CertificateReports from "./pages/CertificateReports";
import CommitteesCMS from "./pages/CommitteesCMS";
import Operations from "./pages/Operations";
import Logistics from "./pages/Logistics";
import LogisticsDirectory from "./pages/LogisticsDirectory";
import LogisticsReports from "./pages/LogisticsReports";
import Volunteers from "./pages/Volunteers";
import VolunteerDirectory from "./pages/VolunteerDirectory";
import VolunteerReports from "./pages/VolunteerReports";
import Forms from "./pages/Forms";
import FormBuilder from "./pages/FormBuilder";
import FormSubmissions from "./pages/FormSubmissions";
import MobileApp from "./pages/MobileApp";
import MobileDirectory from "./pages/MobileDirectory";
import CorePlatform from "./pages/CorePlatform";
import CoreDirectory from "./pages/CoreDirectory";
import SystemAdmin from "./pages/SystemAdmin";
import SystemDirectory from "./pages/SystemDirectory";
import LaunchChecklist from "./pages/LaunchChecklist";
import Users from "./pages/Users";
import AdminSettings from "./pages/AdminSettings";
import CmsControls from "./pages/CmsControls";
import TeamManagement from "./pages/TeamManagement";
import TeamMonitoring from "./pages/TeamMonitoring";
import VisaApplications from "./pages/VisaApplications";
import VisaApplicationDetails from "./pages/VisaApplicationDetails";
import VisaSettings from "./pages/VisaSettings";
import "./admin.css";

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
});

const readCookie = (name) => document.cookie.split("; ").find((item) => item.startsWith(`${name}=`))?.split("=")[1];
const emptyEventContext = {
  eventId: null,
  eventSlug: null,
  eventName: null,
  isGlobalView: false,
};

const readStoredEventContext = () => {
  try {
    return JSON.parse(localStorage.getItem("ghc_admin_event_context") || "null") || emptyEventContext;
  } catch {
    return emptyEventContext;
  }
};

api.interceptors.request.use((config) => {
  const csrf = readCookie("csrf_token");
  if (csrf) config.headers["x-csrf-token"] = csrf;
  return config;
});

const pages = {
  dashboard: Dashboard,
  speakers: Speakers,
  sessions: Schedule, // Redirected to Schedule
  schedule: Schedule,
  tracks: (props) => <SpeakerDirectories {...props} type="tracks" />,
  halls: Schedule, // Redirected to Schedule
  cme: Schedule, // Redirected to Schedule
  resources: SpeakerResources,
  workshops: Workshops,
  events: Events,
  "event-registrations": (props) => <EventDirectory {...props} type="event-registrations" />,
  "event-payments": (props) => <EventDirectory {...props} type="event-payments" />,
  "event-feedback": (props) => <EventDirectory {...props} type="event-feedback" />,
  "event-certificates": (props) => <EventDirectory {...props} type="event-certificates" />,
  "event-resources": (props) => <EventDirectory {...props} type="event-resources" />,
  venues: (props) => <HospitalityCMS {...props} />,
  hospitality: (props) => <HospitalityCMS {...props} />,
  "event-reports": EventReports,
  research: Research,
  scientific: (props) => <Scientific {...props} initialTab="overview" />,
  "scientific-team": (props) => <Scientific {...props} initialTab="team" />,
  "abstract-report": (props) => <Scientific {...props} initialTab="abstract-report" />,
  abstracts: Research,
  reviewers: (props) => <ScientificDirectory {...props} type="reviewers" />,
  reviews: Reviews,
  "presentation-sessions": Presentations,
  posters: Presentations,
  judges: (props) => <CommitteesCMS {...props} initialTab="jury" />,
  awards: (props) => <ScientificDirectory {...props} type="awards" />,
  "scientific-reports": ScientificReports,
  registrations: Registrations,
  tickets: AdminTickets,
  payments: Payments,
  badges: Badges,
  coupons: Coupons,
  reports: RegistrationReports,
  partners: AdminPartners,
  sponsorships: (props) => <AdminPartners {...props} initialTab="sponsors" />,
  sponsors: (props) => <AdminPartners {...props} initialTab="sponsors" />,
  exhibitors: (props) => <SponsorshipDirectory {...props} type="exhibitors" />,
  stalls: (props) => <SponsorshipDirectory {...props} type="stalls" />,
  contracts: (props) => <SponsorshipDirectory {...props} type="contracts" />,
  invoices: (props) => <SponsorshipDirectory {...props} type="invoices" />,
  deliverables: (props) => <SponsorshipDirectory {...props} type="deliverables" />,
  "sponsorship-reports": SponsorshipReports,
  media: AdminMedia,
  marketing: Marketing,
  announcements: (props) => <VolunteerDirectory {...props} type="announcements" />,
  news: (props) => <MarketingContent {...props} type="news" />,
  homepage: (props) => <MarketingContent {...props} type="homepage" />,
  banners: (props) => <MarketingContent {...props} type="banners" />,
  gallery: (props) => <MarketingContent {...props} type="gallery" />,
  campaigns: (props) => <MarketingContent {...props} type="campaigns" />,
  "media-partners": (props) => <MarketingContent {...props} type="media-partners" />,
  notifications: (props) => <MarketingContent {...props} type="notifications" />,
  "media-library": AdminMedia,
  seo: (props) => <SeoManagement {...props} />,
  trailer: AdminTrailer,
  analytics: Analytics,
  checkin: Checkin,
  certificates: Certificates,
  "certificate-templates": (props) => <CertificateDirectory {...props} type="certificate-templates" />,
  "certificate-generate": (props) => <CertificateDirectory {...props} type="certificate-generate" />,
  "certificate-bulk": (props) => <CertificateDirectory {...props} type="certificate-bulk" />,
  "certificate-signatures": (props) => <CertificateDirectory {...props} type="certificate-signatures" />,
  "certificate-accreditation": (props) => <CertificateDirectory {...props} type="certificate-accreditation" />,
  "certificate-reports": CertificateReports,
  committees: CommitteesCMS,
  operations: Operations,
  logistics: Logistics,
  accommodation: (props) => <LogisticsDirectory {...props} type="accommodation" />,
  transport: (props) => <LogisticsDirectory {...props} type="transport" />,
  vendors: (props) => <LogisticsDirectory {...props} type="vendors" />,
  inventory: (props) => <LogisticsDirectory {...props} type="inventory" />,
  volunteers: Volunteers,
  recruitment: (props) => <VolunteerDirectory {...props} type="recruitment" />,
  interviews: (props) => <VolunteerDirectory {...props} type="interviews" />,
  departments: (props) => <VolunteerDirectory {...props} type="departments" />,
  shifts: (props) => <VolunteerDirectory {...props} type="shifts" />,
  attendance: (props) => <VolunteerDirectory {...props} type="attendance" />,
  tasks: (props) => <VolunteerDirectory {...props} type="tasks" />,
  "volunteer-reports": VolunteerReports,
  forms: Forms,
  "forms-create": FormBuilder,
  "form-submissions": FormSubmissions,
  mobile: MobileApp,
  "mobile-users": (props) => <MobileDirectory {...props} type="users" />,
  "mobile-notifications": (props) => <MobileDirectory {...props} type="notifications" />,
  "mobile-analytics": (props) => <MobileDirectory {...props} type="analytics" />,
  "mobile-settings": (props) => <MobileDirectory {...props} type="settings" />,
  core: CorePlatform,
  "core-files": (props) => <CoreDirectory {...props} type="files" />,
  "core-tasks": (props) => <CoreDirectory {...props} type="tasks" />,
  "core-approvals": (props) => <CoreDirectory {...props} type="approvals" />,
  "core-search": (props) => <CoreDirectory {...props} type="search" />,
  "core-settings": (props) => <CoreDirectory {...props} type="settings" />,
  security: (props) => <LogisticsDirectory {...props} type="security" />,
  emergency: (props) => <LogisticsDirectory {...props} type="emergency" />,
  "logistics-reports": LogisticsReports,
  system: SystemAdmin,
  "api-monitoring": (props) => <SystemAdmin {...props} initialTab="api-monitoring" />,
  "system-api-monitoring": (props) => <SystemAdmin {...props} initialTab="api-monitoring" />,

  // Visa Applications
  "visa-applications": (props) => <VisaApplications {...props} />,
  "visa-settings": (props) => <VisaSettings {...props} />,

  "system-audit-logs": (props) => <SystemDirectory {...props} type="audit-logs" />,
  "system-users": (props) => <Users {...props} initialTab="users" />,
  "system-roles": (props) => <Users {...props} initialTab="roles" />,
  "system-sessions": (props) => <Users {...props} initialTab="sessions" />,
  "system-feature-flags": (props) => <SystemDirectory {...props} type="feature-flags" />,
  launch: LaunchChecklist,
  users: (props) => <Users {...props} initialTab="users" />,
  settings: AdminSettings,
  "cms-controls": CmsControls,
  teams: TeamManagement,
  "team-monitoring": TeamMonitoring,
};

const pageFromPath = () => {
  const parts = window.location.pathname.split("/").filter(Boolean);
  if (parts[0] !== "admin") return null;
  if (parts[1] === "teams" && parts[2] === "create") return "teams-create";
  if (parts[1] === "teams" && parts[2] && parts[3] === "members") return `team-${parts[2]}-members`;
  if (parts[1] === "teams" && parts[2] && parts[3] === "modules") return `team-${parts[2]}-modules`;
  if (parts[1] === "teams" && parts[2]) return `team-${parts[2]}`;
  if (parts[1] === "registrations" && parts[2] === "create") return "registrations-create";
  if (parts[1] === "registrations" && parts[2]) return `registration-${parts[2]}`;
  if (parts[1] === "events" && parts[2] === "create") return "events-create";
  if (parts[1] === "events" && parts[2]) return `event-${parts[2]}`;
  if (parts[1] === "scientific" && parts[2] === "reports") return "scientific-reports";
  if (parts[1] === "scientific" && parts[2] === "team") return "scientific-team";
  if (parts[1] === "scientific" && parts[2] === "abstract-report") return "abstract-report";
  if (parts[1] === "sponsorship" && parts[2] === "reports") return "sponsorship-reports";
  if (parts[1] === "logistics" && parts[2] === "reports") return "logistics-reports";
  if (parts[1] === "certificates" && parts[2]) return `certificate-${parts[2]}`;
  if (parts[1] === "system" && parts[2]) return `system-${parts[2]}`;
  if (parts[1] === "forms" && parts[2] === "create") return "forms-create";
  if (parts[1] === "forms" && parts[2] === "templates") return "forms-templates";
  if (parts[1] === "forms" && parts[2] === "analytics") return "forms-analytics";
  if (parts[1] === "forms" && parts[2] && parts[3] === "submissions") return `form-${parts[2]}-submissions`;
  if (parts[1] === "forms" && parts[2]) return `form-${parts[2]}`;
  if (parts[1] === "mobile" && parts[2]) return `mobile-${parts[2]}`;
  if (parts[1] === "core" && parts[2]) return `core-${parts[2]}`;
  if (parts[1] === "visa-applications" && parts[2] && parts[2] !== "settings") return `visa-application-${parts[2]}`;
  return parts[1] || null;
};

function PlaceholderPage({ title }) {
  return (
    <div className="admin-panel">
      <p className="admin-eyebrow">CMS module</p>
      <h1>{title}</h1>
      <p className="admin-muted">This module shell is reserved for the next CMS phase.</p>
    </div>
  );
}

function AdminApp({ initialPage = "dashboard" }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem("ghc_admin_token"));
  const [activePage, setActivePage] = useState(() => pageFromPath() || initialPage);
  const [loading, setLoading] = useState(Boolean(token));
  const [impersonating, setImpersonating] = useState(() => Boolean(localStorage.getItem("ghc_super_admin_token")));
  const [eventContext, setEventContext] = useState(readStoredEventContext);

  useEffect(() => {
    api.defaults.headers.common.Authorization = token ? `Bearer ${token}` : "";
  }, [token]);

  useEffect(() => {
    if (eventContext.isGlobalView) {
      api.defaults.headers.common["x-global-view"] = "true";
      delete api.defaults.headers.common["x-event-id"];
      delete api.defaults.headers.common["x-event-slug"];
      return;
    }

    delete api.defaults.headers.common["x-global-view"];

    if (eventContext.eventId) {
      api.defaults.headers.common["x-event-id"] = String(eventContext.eventId);
    } else {
      delete api.defaults.headers.common["x-event-id"];
    }

    if (eventContext.eventSlug) {
      api.defaults.headers.common["x-event-slug"] = eventContext.eventSlug;
    } else {
      delete api.defaults.headers.common["x-event-slug"];
    }
  }, [eventContext]);

  useEffect(() => {
    if (!token) return;

    api
      .get("/api/auth/me")
      .then((response) => {
        const currentUser = response.data.user || response.data;
        setUser(currentUser);
        const role = (currentUser?.role || "").toUpperCase();
        const isSuper = role === "SUPER_ADMIN" || role === "ADMIN";
        const isScientific =
          role === "SCIENTIFIC_CHAIRPERSON" ||
          role === "CHAIRPERSON" ||
          role === "SCIENTIFIC_REVIEWER" ||
          role === "REVIEWER" ||
          role === "RESEARCH";
        if (isScientific && !isSuper && (activePage === "dashboard" || !activePage)) {
          setActivePage("scientific");
          window.history.replaceState(null, "", "/admin/scientific");
        }
      })
      .catch(() => {
        localStorage.removeItem("ghc_admin_token");
        setToken(null);
        setUser(null);
      })
      .finally(() => setLoading(false));
  }, [token]);

  const handleLogin = ({ token: nextToken, user: nextUser }) => {
    localStorage.setItem("ghc_admin_token", nextToken);
    setToken(nextToken);
    setUser(nextUser);
  };

  const handleLogout = async () => {
    try {
      await api.post("/api/auth/logout");
    } catch {
      // Local logout should still complete if the API is unavailable.
    }

    localStorage.removeItem("ghc_admin_token");
    localStorage.removeItem("ghc_super_admin_token");
    setToken(null);
    setUser(null);
    setImpersonating(false);
    setActivePage("dashboard");
  };

  const handleNavigate = (pageId) => {
    setActivePage(pageId);
    const path = pageId === "dashboard" ? "/admin" : pageId === "teams-create" ? "/admin/teams/create" : pageId === "registrations-create" ? "/admin/registrations/create" : pageId.startsWith("registration-") ? pageId.replace(/^registration-(.+)$/, "/admin/registrations/$1") : pageId === "events-create" ? "/admin/events/create" : pageId.startsWith("event-") ? pageId.replace(/^event-(.+)$/, "/admin/events/$1") : pageId === "sponsors-create" ? "/admin/sponsors/create" : pageId.startsWith("sponsor-") ? pageId.replace(/^sponsor-(.+)$/, "/admin/sponsors/$1") : pageId.startsWith("team-")
      ? pageId.replace(/^team-([^-]+)-members$/, "/admin/teams/$1/members").replace(/^team-([^-]+)-modules$/, "/admin/teams/$1/modules").replace(/^team-([^-]+)$/, "/admin/teams/$1")
      : pageId === "scientific-reports" ? "/admin/scientific/reports"
      : pageId === "sponsorship-reports" ? "/admin/sponsorship/reports"
      : pageId === "logistics-reports" ? "/admin/logistics/reports"
      : pageId.startsWith("certificate-") ? pageId.replace(/^certificate-(.+)$/, "/admin/certificates/$1")
      : pageId.startsWith("system-") ? pageId.replace(/^system-(.+)$/, "/admin/system/$1")
      : pageId === "forms-create" ? "/admin/forms/create"
      : pageId === "forms-templates" ? "/admin/forms/templates"
      : pageId === "forms-analytics" ? "/admin/forms/analytics"
      : pageId.startsWith("form-") ? pageId.replace(/^form-(\d+)-submissions$/, "/admin/forms/$1/submissions").replace(/^form-(\d+)$/, "/admin/forms/$1")
      : pageId.startsWith("mobile-") ? pageId.replace(/^mobile-(.+)$/, "/admin/mobile/$1")
      : pageId.startsWith("core-") ? pageId.replace(/^core-(.+)$/, "/admin/core/$1")
      : pageId.startsWith("visa-application-") ? pageId.replace(/^visa-application-(.+)$/, "/admin/visa-applications/$1")
      : `/admin/${pageId}`;
    window.history.pushState({}, "", path);
  };

  const handleEventContextChange = useCallback((nextContext) => {
    setEventContext(nextContext);
    localStorage.setItem("ghc_admin_event_context", JSON.stringify(nextContext));
  }, []);

  const handleImpersonate = ({ token: nextToken, user: nextUser }) => {
    localStorage.setItem("ghc_super_admin_token", token);
    localStorage.setItem("ghc_admin_token", nextToken);
    setToken(nextToken);
    setUser(nextUser);
    setImpersonating(true);
    setActivePage("dashboard");
  };

  const handleReturnToSuperAdmin = () => {
    const originalToken = localStorage.getItem("ghc_super_admin_token");
    if (!originalToken) return;
    localStorage.removeItem("ghc_super_admin_token");
    localStorage.setItem("ghc_admin_token", originalToken);
    setToken(originalToken);
    setUser(null);
    setImpersonating(false);
    setLoading(true);
    setActivePage("dashboard");
  };

  if (loading) {
    return <div className="admin-loading">Loading GHC CMS...</div>;
  }

  if (!user) {
    return <Login api={api} onLogin={handleLogin} />;
  }

  const Page = pages[activePage] || (activePage.startsWith("team-") ? TeamManagement : activePage.startsWith("registration-") ? Registrations : activePage.startsWith("event-") ? Events : activePage.match(/^form-\d+-submissions$/) ? FormSubmissions : activePage.match(/^form-\d+$/) ? FormBuilder : activePage.startsWith("visa-application-") ? VisaApplicationDetails : null);

  return (
    <DashboardLayout
      api={api}
      user={user}
      activePage={activePage}
      eventContext={eventContext}
      impersonating={impersonating}
      onEventContextChange={handleEventContextChange}
      onNavigate={handleNavigate}
      onLogout={handleLogout}
      onReturnToSuperAdmin={handleReturnToSuperAdmin}
    >
      {Page ? <Page user={user} api={api} activePage={activePage} onNavigate={handleNavigate} onImpersonate={handleImpersonate} /> : <PlaceholderPage title={activePage} />}
    </DashboardLayout>
  );
}

export default AdminApp;
