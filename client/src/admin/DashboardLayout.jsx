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
import { useEffect, useRef, useState } from "react";

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
      { id: "workshop-applications", label: "Workshop Applications", icon: ClipboardCheck, permissions: ["workshop_application_view", "manage_workshops"] },
      { id: "workshop-attendance", label: "Workshop Attendance", icon: UserCheck, permissions: ["workshop_attendance_manage", "manage_workshops"] },
      { id: "workshop-certificates", label: "Workshop Certificates", icon: BadgeCheck, permissions: ["workshop_certificate_manage", "manage_workshops"] },
      { id: "workshop-reports", label: "Workshop Reports", icon: BarChart3, permissions: ["workshop_reports_view", "manage_workshops"] },
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
      { id: "scientific-team-lead", label: "Team Lead Dashboard", icon: ShieldCheck, permissions: ["manage_scientific", "scientific.manage", "manage_abstracts", "review_abstracts"] },
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
      { id: "award-nominations", label: "Award Nominations", icon: Trophy, permissions: ["award_nomination_view", "manage_awards"] },
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
      { id: "system-email", label: "Emails", icon: Mail, permissions: ["manage_system", "view_system_reports", "manage_settings"] },
      { id: "system-email-templates", label: "Email Templates", icon: Mail, permissions: ["manage_system", "view_system_reports", "manage_settings"] },
      { id: "collaboration", label: "Collaboration", icon: Handshake, permissions: ["manage_system", "manage_settings", "settings.manage"] },
    ],
  },
];

function DashboardLayout({ api, children, user, activePage, eventContext, impersonating, onEventContextChange, onNavigate, onLogout, onReturnToSuperAdmin }) {
  const [open, setOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const searchInputRef = useRef(null);

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
  const userPermissions = user?.permissions || [];
  const isAwardJudge =
    (userRole === "AWARD_JUDGE" ||
      userRole === "JUDGE" ||
      userRole === "AWARD_JURY" ||
      userRole === "AWARD JUDGE" ||
      (userPermissions.includes("award_nomination_view") && !isSuperAdmin));

  const isTeamLead =
    userRole === "SCIENTIFIC_TEAM_LEAD" ||
    userRole === "TEAM_LEAD" ||
    userPermissions.includes("assign_reviewers") ||
    user?.email === "gauravjayadev@gmail.com";

  const isChairperson =
    userRole === "SCIENTIFIC_CHAIRPERSON" ||
    userRole === "CHAIRPERSON" ||
    userRole === "SCIENTIFIC_COMMITTEE_CHAIR";

  const isScientificOnly =
    (isChairperson ||
      isTeamLead ||
      userRole === "SCIENTIFIC_REVIEWER" ||
      userRole === "REVIEWER" ||
      userRole === "RESEARCH") &&
    !isSuperAdmin &&
    !isAwardJudge;

  const isWorkshopTeam =
    (userRole === "WORKSHOP_TEAM" ||
      userRole === "WORKSHOP_LEAD" ||
      userRole === "WORKSHOP" ||
      (userPermissions.includes("workshop_application_view") && !isSuperAdmin && !isAwardJudge && !isScientificOnly));

  const visibleSections = isAwardJudge
    ? [
        {
          id: "judge-main",
          title: "",
          items: [
            { id: "dashboard", label: "Dashboard", icon: LayoutDashboard, navigationId: "dashboard" },
            { id: "award-nominations", label: "Award Nominations", icon: Trophy, navigationId: "award-nominations" },
          ],
        },
      ]
    : isWorkshopTeam
    ? [
        {
          id: "workshop-main",
          title: "WORKSHOPS",
          items: [
            { id: "dashboard", label: "Dashboard", icon: LayoutDashboard, navigationId: "dashboard" },
            { id: "workshops", label: "Workshops", icon: Wrench, navigationId: "workshops" },
            { id: "workshop-applications", label: "Workshop Applications", icon: ClipboardCheck, navigationId: "workshop-applications" },
            { id: "workshop-attendance", label: "Workshop Attendance", icon: UserCheck, navigationId: "workshop-attendance" },
            { id: "workshop-certificates", label: "Workshop Certificates", icon: BadgeCheck, navigationId: "workshop-certificates" },
            { id: "workshop-reports", label: "Workshop Reports", icon: BarChart3, navigationId: "workshop-reports" },
          ],
        },
      ]
    : NAV_SECTIONS.map((section) => {
        if (isScientificOnly) {
          if (section.id !== "scientific") return null;
          let allowedIds = [];
          if (isTeamLead) {
            // Team Leader Dashboard: dedicated standalone view with team reviewers & abstract reports
            allowedIds = ["scientific-team-lead", "scientific-team", "abstract-report"];
          } else if (isChairperson) {
            // Scientific Chairperson Dashboard: chairperson oversight, abstract allocation, committee oversight (NO team lead dashboard)
            allowedIds = ["scientific", "scientific-team", "abstract-report", "research", "scientific-reports"];
          } else {
            // Reviewer
            allowedIds = ["reviews", "abstract-report"];
          }

          return {
            ...section,
            items: section.items
              .filter((item) => allowedIds.includes(item.id))
              .map((item) => ({
                ...item,
                navigationId: item.targetId || item.id,
              })),
          };
        }

        const allowedItems = section.items.filter((item) => {
          if (item.id === "reviews" && isChairperson) return false;
          if (item.id === "scientific-team-lead" && !isTeamLead && !isSuperAdmin) return false;
          if (item.id === "scientific" && isTeamLead && !isSuperAdmin) return false;
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
  const displayedSearchResults = query ? searchResults.slice(0, 8) : flatVisibleItems.slice(0, 8);

  useEffect(() => {
    const handleGlobalShortcut = (event) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setSearchOpen(true);
      }
    };

    window.addEventListener("keydown", handleGlobalShortcut);
    return () => window.removeEventListener("keydown", handleGlobalShortcut);
  }, []);

  useEffect(() => {
    if (!searchOpen) return;
    const focusTimer = window.setTimeout(() => searchInputRef.current?.focus(), 40);
    return () => window.clearTimeout(focusTimer);
  }, [searchOpen]);

  const handleNavigate = (pageId) => {
    onNavigate(pageId);
    setOpen(false);
    setSearchOpen(false);
    setSearchQuery("");
  };

  const handleSearchKeyDown = (event) => {
    if (event.key === "Enter" && displayedSearchResults[0]) {
      event.preventDefault();
      handleNavigate(displayedSearchResults[0].navigationId);
    }

    if (event.key === "Escape") {
      setSearchOpen(false);
      setSearchQuery("");
    }
  };

  return (
    <div className="admin-shell">
      <aside className={open ? "admin-sidebar open" : "admin-sidebar"} id="admin-mobile-sidebar">
        <div className="admin-brand">
          <span>{isAwardJudge ? <Trophy size={19} /> : <BriefcaseBusiness size={19} />}</span>
          <div>
            <strong>{isAwardJudge ? "Award Judge" : "GHC CMS"}</strong>
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

        <div style={{ marginTop: "auto", borderTop: "1px solid rgba(0,0,0,0.06)", paddingTop: "10px" }}>
          <button className="admin-logout" style={{ marginBottom: "10px", color: "black" }} onClick={() => window.location.href = "/"}>
            <Home size={18} />
            Back to Website
          </button>

          <button className="admin-logout" onClick={onLogout}>
            <LogOut size={18} />
            Logout
          </button>
        </div>
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
            <button className="admin-search-trigger" type="button" onClick={() => setSearchOpen(true)}>
              <span><Search size={17} /> Search CMS</span>
              <kbd>Ctrl K</kbd>
            </button>
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

      {searchOpen && (
        <div className="admin-command-overlay" role="dialog" aria-modal="true" aria-label="Search CMS">
          <button className="admin-command-backdrop" type="button" aria-label="Close search" onClick={() => setSearchOpen(false)} />
          <section className="admin-command-panel">
            <div className="admin-command-search">
              <Search size={20} />
              <input
                ref={searchInputRef}
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                onKeyDown={handleSearchKeyDown}
                placeholder="Search pages, reports, abstract tools..."
              />
              <kbd>Esc</kbd>
            </div>

            <div className="admin-command-results">
              <p>{query ? "Results" : "Quick access"}</p>
              {displayedSearchResults.length > 0 ? (
                displayedSearchResults.map((item) => {
                  const Icon = item.icon;
                  return (
                    <button key={item.id} type="button" onClick={() => handleNavigate(item.navigationId)}>
                      <span><Icon size={18} /> {item.label}</span>
                      <small>{item.navigationId}</small>
                    </button>
                  );
                })
              ) : (
                <div className="admin-command-empty">No CMS sections found</div>
              )}
            </div>
          </section>
        </div>
      )}

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
