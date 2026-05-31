import { useEffect, useState } from "react";
import axios from "axios";
import { API_BASE_URL } from "../config/api";
import DashboardLayout from "./DashboardLayout";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Speakers from "./pages/Speakers";
import Workshops from "./pages/Workshops";
import Research from "./pages/Research";
import Registrations from "./pages/Registrations";
import AdminTickets from "./pages/AdminTickets";
import AdminPartners from "./pages/AdminPartners";
import Payments from "./pages/Payments";
import Analytics from "./pages/Analytics";
import AdminMedia from "./pages/AdminMedia";
import Checkin from "./pages/Checkin";
import Certificates from "./pages/Certificates";
import Operations from "./pages/Operations";
import SystemHealth from "./pages/SystemHealth";
import LaunchChecklist from "./pages/LaunchChecklist";
import Users from "./pages/Users";
import AdminSettings from "./pages/AdminSettings";
import "./admin.css";

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
});

const readCookie = (name) => document.cookie.split("; ").find((item) => item.startsWith(`${name}=`))?.split("=")[1];

api.interceptors.request.use((config) => {
  const csrf = readCookie("csrf_token");
  if (csrf) config.headers["x-csrf-token"] = csrf;
  return config;
});

const pages = {
  dashboard: Dashboard,
  speakers: Speakers,
  workshops: Workshops,
  research: Research,
  registrations: Registrations,
  tickets: AdminTickets,
  payments: Payments,
  partners: AdminPartners,
  media: AdminMedia,
  analytics: Analytics,
  checkin: Checkin,
  certificates: Certificates,
  operations: Operations,
  system: SystemHealth,
  launch: LaunchChecklist,
  users: Users,
  settings: AdminSettings,
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
  const [activePage, setActivePage] = useState(initialPage);
  const [loading, setLoading] = useState(Boolean(token));

  useEffect(() => {
    api.defaults.headers.common.Authorization = token ? `Bearer ${token}` : "";
  }, [token]);

  useEffect(() => {
    if (!token) return;

    api
      .get("/api/auth/me")
      .then((response) => setUser(response.data.user || response.data))
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
    setToken(null);
    setUser(null);
    setActivePage("dashboard");
  };

  if (loading) {
    return <div className="admin-loading">Loading GHC CMS...</div>;
  }

  if (!user) {
    return <Login api={api} onLogin={handleLogin} />;
  }

  const Page = pages[activePage];

  return (
    <DashboardLayout user={user} activePage={activePage} onNavigate={setActivePage} onLogout={handleLogout}>
      {Page ? <Page user={user} api={api} /> : <PlaceholderPage title={activePage} />}
    </DashboardLayout>
  );
}

export default AdminApp;
