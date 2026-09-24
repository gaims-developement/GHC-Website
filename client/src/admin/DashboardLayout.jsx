import {
  Activity,
  Bell,
  BellRing,
  Archive,
  BadgeCheck,
  BadgePercent,
  BriefcaseBusiness,
  Building2,
  Bus,
  BarChart3,
  CalendarClock,
  CalendarDays,
  ChartColumn,
  ClipboardCheck,
  ClipboardList,
  CreditCard,
  Cloud,
  Database,
  FileSignature,
  FileCheck2,
  FileSpreadsheet,
  FileText,
  FolderUp,
  Film,
  FlaskConical,
  Handshake,
  HeartPulse,
  Hotel,
  Image,
  Images,
  GraduationCap,
  Home,
  LayoutDashboard,
  Layers3,
  ListChecks,
  LogOut,
  Mail,
  Menu,
  Megaphone,
  MessageSquareText,
  Mic2,
  MapPinned,
  Microscope,
  MonitorCheck,
  Network,
  Newspaper,
  PanelsTopLeft,
  PackageCheck,
  PenLine,
  Presentation,
  PlaneTakeoff,
  RadioTower,
  Rocket,
  MoreHorizontal,
  QrCode,
  Search,
  SearchCheck,
  Settings,
  Share2,
  ShieldCheck,
  ShieldAlert,
  Siren,
  SlidersHorizontal,
  Scale,
  Smartphone,
  ReceiptText,
  Store,
  Ticket,
  Trophy,
  ToggleLeft,
  Users,
  UserCheck,
  UserPlus,
  Waypoints,
  Wrench,
  X,
} from "lucide-react";
import { useState } from "react";

const icons = {
  Activity,
  BarChart3,
  Archive,
  BadgeCheck,
  BadgePercent,
  BriefcaseBusiness,
  Building2,
  Bus,
  Bell,
  BellRing,
  ClipboardCheck,
  CalendarClock,
  CalendarDays,
  ChartColumn,
  CreditCard,
  Cloud,
  Database,
  FileSignature,
  ClipboardList,
  FileCheck2,
  FileSpreadsheet,
  FileText,
  FolderUp,
  Film,
  FlaskConical,
  Handshake,
  HeartPulse,
  Hotel,
  Image,
  Images,
  GraduationCap,
  Home,
  LayoutDashboard,
  Layers3,
  ListChecks,
  Mail,
  Megaphone,
  MessageSquareText,
  Mic2,
  MapPinned,
  Microscope,
  MonitorCheck,
  Network,
  Newspaper,
  PanelsTopLeft,
  PackageCheck,
  PenLine,
  Presentation,
  PlaneTakeoff,
  QrCode,
  RadioTower,
  Rocket,
  SearchCheck,
  Settings,
  Share2,
  ShieldCheck,
  ShieldAlert,
  Siren,
  SlidersHorizontal,
  Scale,
  Smartphone,
  ReceiptText,
  Store,
  Ticket,
  Trophy,
  ToggleLeft,
  Users,
  UserCheck,
  UserPlus,
  Waypoints,
  Wrench,
};

const NAV_SECTIONS = [
  {
    id: "dashboard",
    title: "",
    items: [
      { id: "dashboard", label: "Dashboard", icon: LayoutDashboard, permissions: ["dashboard.view", "view_dashboard"] },
    ],
  },
  {
    id: "event",
    title: "EVENT",
    items: [
      { id: "speakers", label: "Speakers", icon: Mic2, permissions: ["manage_speakers", "speakers.manage"] },
      { id: "schedule", label: "Schedule", icon: CalendarDays, permissions: ["manage_schedules", "schedule.manage"] },
      { id: "workshops", label: "Workshops", icon: Wrench, permissions: ["manage_workshops", "workshops.manage"] },
      { id: "hospitality", label: "Hospitality", icon: Hotel, permissions: ["manage_venues", "venues.manage", "hospitality.manage"], aliases: ["venues"] },
      { id: "logistics", label: "Logistics", icon: Bus, permissions: ["manage_logistics", "logistics.manage"] },
      { id: "resources", label: "Resources", icon: Archive, permissions: ["manage_resources", "resources.manage"] },
    ],
  },
  {
    id: "scientific",
    title: "SCIENTIFIC",
    items: [
      { id: "scientific", label: "Scientific Dashboard", icon: Microscope, permissions: ["manage_scientific", "scientific.manage", "manage_abstracts", "review_abstracts"] },
      { id: "scientific-team", label: "Scientific Team", icon: Users, permissions: ["users.manage", "manage_system", "manage_scientific", "manage_reviewers", "scientific.manage", "review_abstracts"] },
      { id: "abstract-report", label: "Abstract Report", icon: ClipboardCheck, permissions: ["manage_scientific", "scientific.manage", "manage_abstracts", "review_abstracts"] },
      { id: "research", label: "Abstract Management", icon: FileText, permissions: ["manage_abstracts", "research.manage", "abstracts.manage"], aliases: ["abstracts"] },
      { id: "reviews", label: "Reviews", icon: ClipboardCheck, permissions: ["manage_reviews", "reviews.manage", "review_abstracts"] },
      { id: "scientific-reports", label: "Scientific Reports", icon: ChartColumn, permissions: ["view_scientific_reports", "scientific.reports", "publish_scientific_program"] },
    ],
  },
  {
    id: "awards-certificates",
    title: "AWARDS & CERTIFICATES",
    items: [
      { id: "awards", label: "Awards", icon: Trophy, permissions: ["manage_awards", "awards.manage"] },
      { id: "certificate-templates", label: "Certificate Templates", icon: Layers3, permissions: ["manage_templates", "certificates.manage"] },
      { id: "certificate-generate", label: "Generate Certificates", icon: FileCheck2, permissions: ["generate_certificates", "certificates.manage"] },
      { id: "certificate-bulk", label: "Bulk Certificates", icon: FolderUp, permissions: ["generate_certificates", "certificates.manage"] },
      { id: "certificate-signatures", label: "Digital Signatures", icon: PenLine, permissions: ["manage_signatures", "certificates.manage"] },
      { id: "certificate-accreditation", label: "Accreditations", icon: BadgePercent, permissions: ["manage_accreditation", "certificates.manage"] },
      { id: "certificate-reports", label: "Certificate Reports", icon: ReceiptText, permissions: ["view_certificate_reports", "certificates.manage"] },
    ],
  },
  {
    id: "partners-committees",
    title: "PARTNERS & COMMITTEES",
    items: [
      { id: "partners", label: "Event Sponsors", icon: Building2, permissions: ["manage_sponsors", "partners.manage"] },
      { id: "sponsorships", label: "Sponsorships", icon: Store, permissions: ["manage_sponsors", "sponsorship.manage", "manage_exhibitors"], aliases: ["exhibitors"] },
      { id: "committees", label: "Committees", icon: Users, permissions: ["manage_homepage", "committees.manage", "manage_committees"] },
    ],
  },
  {
    id: "reports-analytics",
    title: "REPORTS & ANALYTICS",
    items: [
      { id: "analytics", label: "Analytics", icon: BarChart3, permissions: ["analytics.view", "view_analytics"] },
      { id: "event-reports", label: "Event Reports", icon: FileSpreadsheet, permissions: ["view_event_reports", "event.reports"] },
      { id: "sponsorship-reports", label: "Sponsorship Reports", icon: ChartColumn, permissions: ["view_sponsorship_reports", "sponsorship.reports"] },
      { id: "logistics-reports", label: "Logistics Reports", icon: FileSpreadsheet, permissions: ["view_logistics_reports", "logistics.reports"] },
      { id: "certificate-reports-analytics", targetId: "certificate-reports", label: "Certificate Reports", icon: ReceiptText, permissions: ["view_certificate_reports", "certificates.manage"] },
    ],
  },
  {
    id: "website",
    title: "WEBSITE",
    items: [
      { id: "trailer", label: "Trailers", icon: Film, permissions: ["cms.manage", "manage_trailer"] },
      { id: "seo", label: "SEO", icon: SearchCheck, permissions: ["manage_seo", "seo.manage"] },
      { id: "settings", label: "Website Settings", icon: Settings, permissions: ["settings.manage", "manage_settings"] },
      { id: "collaboration", label: "Collaboration", icon: Handshake, permissions: ["settings.manage", "manage_settings", "cms.manage"] },
    ],
  },
  {
    id: "administration",
    title: "ADMINISTRATION",
    items: [
      { id: "users", label: "Users", icon: Users, permissions: ["users.manage", "manage_users", "manage_system", "manage_roles"] },
      { id: "system-audit-logs", label: "Audit Logs", icon: ShieldCheck, permissions: ["view_audit_logs", "manage_system"] },
      { id: "visa-applications", label: "Visa Applications", icon: PlaneTakeoff, permissions: ["manage_system", "visa.manage"] },
      { id: "api-monitoring", label: "API Monitoring", icon: Activity, permissions: ["view_system_reports", "manage_system", "api.monitor"] },
      { id: "system-email-templates", label: "Email Templates", icon: Mail, permissions: ["manage_system", "view_system_reports", "manage_settings"] },
      { id: "collaboration", label: "Collaboration", icon: Handshake, permissions: ["manage_system", "manage_settings", "settings.manage"] },
    ],
  },
];

function DashboardLayout({ api, children, user, activePage, eventContext, impersonating, onEventContextChange, onNavigate, onLogout, onReturnToSuperAdmin }) {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchFocused, setSearchFocused] = useState(false);

  const accountDisplayName = (() => {
    const rawName = (user?.name || "").trim();
    const rawRole = (user?.role || "").toUpperCase();
    if (rawName === "GHC Super Admin" || rawRole === "SUPER_ADMIN" || rawName.toLowerCase() === "super admin") {
      return "Super Admin";
    }
    return rawName || "Admin";
  })();

  const userRole = (user?.role || "").toUpperCase();
  const isSuperAdmin = userRole === "SUPER_ADMIN" || userRole === "ADMIN";
  const isChairperson =
    userRole === "SCIENTIFIC_CHAIRPERSON" ||
    userRole === "CHAIRPERSON" ||
    userRole === "SCIENTIFIC_COMMITTEE_CHAIR";
  const isScientificOnly =
    (isChairperson ||
      userRole === "SCIENTIFIC_REVIEWER" ||
      userRole === "REVIEWER" ||
      userRole === "RESEARCH") &&
    !isSuperAdmin;
  const userPermissions = user?.permissions || [];

  const visibleSections = NAV_SECTIONS.map((section) => {
    if (isScientificOnly) {
      if (section.id !== "scientific") return null;
      return {
        ...section,
        items: section.items
          .filter((item) => ["scientific", "scientific-team", "abstract-report"].includes(item.id))
          .map((item) => ({
            ...item,
            navigationId: item.targetId || item.id,
          })),
      };
    }

    const allowedItems = section.items.filter((item) => {
      if (item.id === "reviews" && isChairperson) return false;
      if (isSuperAdmin) return true;
      if (!item.permissions || item.permissions.length === 0) return true;
      return item.permissions.some((p) => userPermissions.includes(p));
    });
    return {
      ...section,
      items: allowedItems.map((item) => ({
        ...item,
        navigationId: item.targetId || item.id,
      })),
    };
  }).filter((section) => section && section.items && section.items.length > 0);

  const flatVisibleItems = visibleSections.flatMap((s) => s.items);
  const primaryMobileItems = flatVisibleItems.slice(0, 4);

  const query = searchQuery.trim().toLowerCase();
  const searchResults = query
    ? flatVisibleItems.filter((item) => {
      const searchable = [item.label, item.navigationId, ...(item.aliases || [])].join(" ").toLowerCase();
      return searchable.includes(query);
    })
    : [];
  const showSearchResults = searchFocused && searchQuery.trim().length > 0;

  const handleNavigate = (pageId) => {
    onNavigate(pageId);
    setOpen(false);
    setSearchFocused(false);
    setSearchQuery("");
  };

  const handleSearchKeyDown = (event) => {
    if (event.key === "Enter" && searchResults[0]) {
      event.preventDefault();
      handleNavigate(searchResults[0].navigationId);
    }

    if (event.key === "Escape") {
      setSearchFocused(false);
      setSearchQuery("");
    }
  };

  return (
    <div className="admin-shell">
      <aside className={open ? "admin-sidebar open" : "admin-sidebar"} id="admin-mobile-sidebar">
        <div className="admin-brand">
          <span><BriefcaseBusiness size={19} /></span>
          <div>
            <strong>GHC CMS</strong>
          </div>
          <button className="admin-sidebar-close" onClick={() => setOpen(false)} aria-label="Close sidebar">
            <X size={18} />
          </button>
        </div>

        <nav className="admin-nav-grouped">
          {visibleSections.map((section) => (
            <div key={section.id} className="admin-nav-section">
              {section.title && <div className="admin-nav-section-title">{section.title}</div>}
              <div className="admin-nav-section-items">
                {section.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = activePage === item.navigationId || (item.aliases && item.aliases.includes(activePage));
                  return (
                    <button
                      key={item.id}
                      className={isActive ? "active" : ""}
                      onClick={() => handleNavigate(item.navigationId)}
                      type="button"
                    >
                      <Icon size={18} />
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        <button className="admin-logout" style={{ marginBottom: "10px", color: "black" }} onClick={() => window.location.href = "/"}>
          <Home size={18} />
          Back to Website
        </button>

        <button className="admin-logout" onClick={onLogout}>
          <LogOut size={18} />
          Logout
        </button>
      </aside>
      {open && <button className="admin-sidebar-backdrop" aria-label="Close navigation menu" onClick={() => setOpen(false)} />}

      <div className="admin-main">
        <header className="admin-topbar">
          <button
            className="admin-menu-button"
            type="button"
            aria-label="Open navigation menu"
            aria-controls="admin-mobile-sidebar"
            aria-expanded={open}
            onClick={() => setOpen(true)}
          >
            <Menu size={18} />
          </button>
          <div className="admin-search-wrap">
            <label className="admin-search">
            <Search size={17} />
              <input
                value={searchQuery}
                onBlur={() => window.setTimeout(() => setSearchFocused(false), 120)}
                onChange={(event) => setSearchQuery(event.target.value)}
                onFocus={() => setSearchFocused(true)}
                onKeyDown={handleSearchKeyDown}
                placeholder="Search CMS"
              />
            </label>
            {showSearchResults && (
              <div className="admin-search-results">
                {searchResults.length > 0 ? (
                  searchResults.map((item) => {
                    const Icon = item.icon;
                    return (
                      <button key={item.id} type="button" onMouseDown={() => handleNavigate(item.id)}>
                        <Icon size={16} />
                        <span>{item.label}</span>
                      </button>
                    );
                  })
                ) : (
                  <div>No CMS sections found</div>
                )}
              </div>
            )}
          </div>
          <button className="admin-icon-button" aria-label="Notifications">
            <Bell size={18} />
          </button>
          <div className="admin-profile">
            <span>{accountDisplayName.slice(0, 1) || "S"}</span>
            <div>
              <strong>{accountDisplayName}</strong>
            </div>
          </div>
        </header>
        <main>{children}</main>
        {impersonating && (
          <button className="admin-impersonation-return" type="button" onClick={onReturnToSuperAdmin}>
            Return to Super Admin
          </button>
        )}
      </div>

      <nav className="admin-bottom-nav" aria-label="Admin mobile navigation">
        {primaryMobileItems.map((item) => {
          const Icon = item.icon;
          return (
            <button key={item.id} className={activePage === item.id ? "active" : ""} onClick={() => handleNavigate(item.id)}>
              <Icon size={18} />
              <span>{item.label}</span>
            </button>
          );
        })}
        <button className={!primaryMobileItems.some((item) => item.id === activePage) ? "active" : ""} onClick={() => setOpen(true)}>
          <MoreHorizontal size={18} />
          <span>More</span>
        </button>
      </nav>
    </div>
  );
}

export default DashboardLayout;
