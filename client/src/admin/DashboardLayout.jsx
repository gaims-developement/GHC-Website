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
  Users,
  Wrench,
  X,
} from "lucide-react";
import { useState } from "react";

const fullAccess = ["SUPER_ADMIN", "ADMIN"];
const operationsAccess = [...fullAccess, "OPERATIONS"];
const checkinAccess = [...operationsAccess, "VOLUNTEER", "CHECKIN"];

const navItems = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "speakers", label: "Speakers", icon: Mic2, roles: fullAccess },
  { id: "workshops", label: "Workshops", icon: Wrench, roles: operationsAccess },
  { id: "research", label: "Research", icon: FlaskConical, roles: [...fullAccess, "RESEARCH"] },
  { id: "registrations", label: "Registrations", icon: QrCode, roles: checkinAccess },
  { id: "payments", label: "Payments", icon: CreditCard, roles: fullAccess },
  { id: "analytics", label: "Analytics", icon: BarChart3, roles: operationsAccess },
  { id: "checkin", label: "Check-in", icon: ClipboardCheck, roles: checkinAccess },
  { id: "certificates", label: "Certificates", icon: FileCheck2, roles: operationsAccess },
  { id: "operations", label: "Operations", icon: RadioTower, roles: checkinAccess },
  { id: "system", label: "System Health", icon: HeartPulse, roles: operationsAccess },
  { id: "launch", label: "Launch", icon: Rocket, roles: operationsAccess },
  { id: "partners", label: "Partners", icon: Handshake, roles: fullAccess },
  { id: "media", label: "Media", icon: Image, roles: fullAccess },
  { id: "users", label: "Users", icon: Users, roles: fullAccess },
  { id: "settings", label: "Settings", icon: Settings, roles: fullAccess },
];

function DashboardLayout({ children, user, activePage, onNavigate, onLogout }) {
  const [open, setOpen] = useState(false);
  const visibleNavItems = navItems.filter((item) => !item.roles || item.roles.includes(user.role));
  const primaryMobileItems = ["VOLUNTEER", "CHECKIN"].includes(user.role)
    ? visibleNavItems.filter((item) => ["dashboard", "checkin", "operations", "registrations"].includes(item.id))
    : visibleNavItems.slice(0, 4);

  const handleNavigate = (pageId) => {
    onNavigate(pageId);
    setOpen(false);
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
          <div className="admin-search">
            <Search size={17} />
            <input placeholder="Search CMS" />
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
