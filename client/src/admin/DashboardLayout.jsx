import {
  Bell,
  BellRing,
  Archive,
  BadgeCheck,
  BadgePercent,
  BriefcaseBusiness,
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
import EventSelector from "./components/EventSelector";

const icons = {
  BarChart3,
  Archive,
  BadgeCheck,
  BadgePercent,
  BriefcaseBusiness,
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

function DashboardLayout({ api, children, user, activePage, eventContext, impersonating, onEventContextChange, onNavigate, onLogout, onReturnToSuperAdmin }) {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchFocused, setSearchFocused] = useState(false);
  const visibleNavItems = (user.modules || []).map((module) => ({
    id: module.route_key || module.routeKey,
    label: module.label,
    icon: icons[module.icon] || LayoutDashboard,
    keywords: [module.module_key || module.moduleKey, module.permission_key || module.permissionKey].filter(Boolean),
  })).filter((item) => item.id);
  const primaryMobileItems = visibleNavItems.slice(0, 4);
  const query = searchQuery.trim().toLowerCase();
  const searchResults = query
    ? visibleNavItems.filter((item) => {
      const searchable = [item.label, item.id, ...(item.keywords || [])].join(" ").toLowerCase();
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
          <EventSelector
            api={api}
            user={user}
            selectedEventId={eventContext?.eventId}
            globalView={eventContext?.isGlobalView}
            onChange={onEventContextChange}
          />
          <div className="admin-profile">
            <span>{user.name?.slice(0, 1) || "A"}</span>
            <div>
              <strong>{user.name}</strong>
              <small>{user.role}</small>
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
