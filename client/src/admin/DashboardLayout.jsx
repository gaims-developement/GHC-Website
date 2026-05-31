import {
  Bell,
  BriefcaseBusiness,
  FlaskConical,
  Handshake,
  Image,
  LayoutDashboard,
  LogOut,
  Menu,
  CreditCard,
  BarChart3,
  ClipboardCheck,
  FileCheck2,
  RadioTower,
  HeartPulse,
  Rocket,
  Mic2,
  MoreHorizontal,
  QrCode,
  Search,
  Settings,
  Ticket,
  Users,
  Wrench,
  X,
} from "lucide-react";
import { useMemo, useState } from "react";

const fullAccess = ["SUPER_ADMIN", "ADMIN"];
const operationsAccess = [...fullAccess, "OPERATIONS"];
const checkinAccess = [...operationsAccess, "VOLUNTEER", "CHECKIN"];

const navItems = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard, keywords: ["home", "overview", "stats", "metrics"] },
  { id: "speakers", label: "Speakers", icon: Mic2, roles: fullAccess, keywords: ["faculty", "keynotes", "cms"] },
  { id: "workshops", label: "Workshops", icon: Wrench, roles: operationsAccess, keywords: ["sessions", "labs", "capacity"] },
  { id: "research", label: "Research", icon: FlaskConical, roles: [...fullAccess, "RESEARCH"], keywords: ["abstracts", "submissions", "review"] },
  { id: "registrations", label: "Registrations", icon: QrCode, roles: checkinAccess, keywords: ["delegates", "attendees", "qr"] },
  { id: "tickets", label: "Tickets", icon: Ticket, roles: fullAccess, keywords: ["passes", "pricing", "capacity"] },
  { id: "payments", label: "Payments", icon: CreditCard, roles: fullAccess, keywords: ["revenue", "transactions", "refunds"] },
  { id: "analytics", label: "Analytics", icon: BarChart3, roles: operationsAccess, keywords: ["charts", "reports", "insights"] },
  { id: "checkin", label: "Check-in", icon: ClipboardCheck, roles: checkinAccess, keywords: ["attendance", "scan", "volunteer"] },
  { id: "certificates", label: "Certificates", icon: FileCheck2, roles: operationsAccess, keywords: ["generate", "awards", "documents"] },
  { id: "operations", label: "Operations", icon: RadioTower, roles: checkinAccess, keywords: ["command", "launch", "tasks"] },
  { id: "system", label: "System Health", icon: HeartPulse, roles: operationsAccess, keywords: ["status", "health", "uptime"] },
  { id: "launch", label: "Launch", icon: Rocket, roles: operationsAccess, keywords: ["checklist", "go live", "deploy"] },
  { id: "partners", label: "Partners", icon: Handshake, roles: fullAccess, keywords: ["sponsors", "partnerships"] },
  { id: "media", label: "Media", icon: Image, roles: fullAccess, keywords: ["images", "uploads", "gallery"] },
  { id: "users", label: "Users", icon: Users, roles: fullAccess, keywords: ["admins", "roles", "accounts"] },
  { id: "settings", label: "Settings", icon: Settings, roles: fullAccess, keywords: ["configuration", "preferences", "setup"] },
];

function DashboardLayout({ children, user, activePage, onNavigate, onLogout }) {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchFocused, setSearchFocused] = useState(false);
  const visibleNavItems = navItems.filter((item) => !item.roles || item.roles.includes(user.role));
  const primaryMobileItems = ["VOLUNTEER", "CHECKIN"].includes(user.role)
    ? visibleNavItems.filter((item) => ["dashboard", "checkin", "operations", "registrations"].includes(item.id))
    : visibleNavItems.slice(0, 4);
  const searchResults = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return [];

    return visibleNavItems.filter((item) => {
      const searchable = [item.label, item.id, ...(item.keywords || [])].join(" ").toLowerCase();
      return searchable.includes(query);
    });
  }, [searchQuery, visibleNavItems]);
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
      handleNavigate(searchResults[0].id);
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
            <small>Phase 2C</small>
          </div>
          <button className="admin-sidebar-close" onClick={() => setOpen(false)} aria-label="Close sidebar">
            <X size={18} />
          </button>
        </div>

        <nav>
          {visibleNavItems.map((item) => {
            const Icon = item.icon;
            return (
              <button key={item.id} className={activePage === item.id ? "active" : ""} onClick={() => handleNavigate(item.id)}>
                <Icon size={18} />
                {item.label}
              </button>
            );
          })}
        </nav>

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
            <span>{user.name?.slice(0, 1) || "A"}</span>
            <div>
              <strong>{user.name}</strong>
              <small>{user.role}</small>
            </div>
          </div>
        </header>
        <main>{children}</main>
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
