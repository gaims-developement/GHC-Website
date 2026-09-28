import React, { useEffect, useState } from "react";
import {
  Wrench,
  Users,
  CheckCircle2,
  Clock3,
  AlertCircle,
  FileCheck2,
  ArrowRight,
  TrendingUp,
  MapPin,
  CalendarDays,
  ShieldCheck,
  UserCheck,
  BadgeCheck,
  BarChart3,
  RefreshCw,
} from "lucide-react";

export default function WorkshopTeamDashboard({ api, onNavigate, user }) {
  const [stats, setStats] = useState(null);
  const [workshops, setWorkshops] = useState([]);
  const [recentApplications, setRecentApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchDashboardData = async () => {
    try {
      const [statsRes, appsRes] = await Promise.all([
        api.get("/api/workshops/stats"),
        api.get("/api/workshops/applications?limit=5"),
      ]);
      setStats(statsRes.data.stats || {});
      setWorkshops(statsRes.data.workshopBreakdown || []);
      setRecentApplications(appsRes.data.applications || []);
    } catch (err) {
      console.error("Failed to load workshop dashboard stats", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchDashboardData();
  };

  const statCards = [
    {
      title: "Total Workshops",
      value: stats?.totalWorkshops ?? 0,
      sub: `${stats?.openWorkshops ?? 0} currently open`,
      icon: Wrench,
      color: "text-blue-600 bg-blue-50 border-blue-100",
      navigate: "workshops",
    },
    {
      title: "Total Applications",
      value: stats?.totalApplications ?? 0,
      sub: "Total submitted across workshops",
      icon: Users,
      color: "text-indigo-600 bg-indigo-50 border-indigo-100",
      navigate: "workshop-applications",
    },
    {
      title: "Under Review",
      value: stats?.underReview ?? 0,
      sub: "Awaiting review or GHC verification",
      icon: Clock3,
      color: "text-amber-600 bg-amber-50 border-amber-100",
      navigate: "workshop-applications",
    },
    {
      title: "GHC Pass Verified",
      value: stats?.ghcPassVerified ?? 0,
      sub: "Valid GHC delegate pass verified",
      icon: ShieldCheck,
      color: "text-teal-600 bg-teal-50 border-teal-100",
      navigate: "workshop-applications",
    },
    {
      title: "Confirmed",
      value: stats?.confirmed ?? 0,
      sub: "Official Workshop ID issued",
      icon: CheckCircle2,
      color: "text-emerald-600 bg-emerald-50 border-emerald-100",
      navigate: "workshop-applications",
    },
    {
      title: "Pending GHC Pass",
      value: stats?.pendingGhcPass ?? 0,
      sub: "Pass lookup pending or not found",
      icon: AlertCircle,
      color: "text-orange-600 bg-orange-50 border-orange-100",
      navigate: "workshop-applications",
    },
    {
      title: "Available Seats",
      value: stats?.availableSeats ?? 0,
      sub: `Out of ${stats?.totalCapacity ?? 0} total capacity`,
      icon: TrendingUp,
      color: "text-purple-600 bg-purple-50 border-purple-100",
      navigate: "workshops",
    },
    {
      title: "Open Workshops",
      value: stats?.openWorkshops ?? 0,
      sub: "Accepting delegate applications",
      icon: BadgeCheck,
      color: "text-cyan-600 bg-cyan-50 border-cyan-100",
      navigate: "workshops",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-[#173B8F] via-[#2563EB] to-[#7C3AED] rounded-2xl p-6 text-white shadow-md relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 text-xs font-semibold backdrop-blur-md mb-2">
              <Wrench className="w-3.5 h-3.5" />
              <span>Workshop Team Dashboard</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
              Welcome, {user?.name || "Workshop Team Member"}
            </h1>
            <p className="mt-1 text-sm text-blue-100 max-w-2xl">
              Monitor real-time applications, verify delegate GHC passes, manage seat allocations, and track attendance for GHC 2026 Workshops in New Delhi.
            </p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-sm font-semibold transition border border-white/20 backdrop-blur-sm"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
              <span>Refresh Stats</span>
            </button>
            <button
              onClick={() => onNavigate("workshop-applications")}
              className="inline-flex items-center gap-2 px-4 py-2 bg-white text-[#173B8F] hover:bg-blue-50 rounded-xl text-sm font-bold shadow-sm transition"
            >
              <span>Review Applications</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card, idx) => {
          const Icon = card.icon;
          return (
            <div
              key={idx}
              onClick={() => card.navigate && onNavigate(card.navigate)}
              className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition cursor-pointer flex flex-col justify-between group"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  {card.title}
                </span>
                <span className={`p-2 rounded-xl border ${card.color}`}>
                  <Icon className="w-4 h-4" />
                </span>
              </div>
              <div className="mt-4">
                <span className="text-3xl font-extrabold text-gray-900 group-hover:text-[#173B8F] transition">
                  {loading ? "..." : card.value}
                </span>
                <p className="mt-1 text-xs text-gray-500 font-medium">{card.sub}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Two Column Section: Workshops Breakdown + Recent Applications */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Workshops Capacity Breakdown (2 Cols) */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-lg font-bold text-gray-900">Active Workshops & Seats</h2>
              <p className="text-xs text-gray-500">Live seat utilization and capacity status</p>
            </div>
            <button
              onClick={() => onNavigate("workshops")}
              className="text-xs font-bold text-[#173B8F] hover:underline inline-flex items-center gap-1"
            >
              <span>Manage Workshops</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-4">
            {workshops.map((ws) => {
              const cap = Number(ws.capacity || 0);
              const conf = Number(ws.confirmedCount || 0);
              const avail = Math.max(0, cap - conf);
              const pct = cap ? Math.min(100, Math.round((conf / cap) * 100)) : 0;

              return (
                <div
                  key={ws.id}
                  className="p-4 rounded-xl border border-gray-100 hover:border-blue-200 transition bg-gray-50/50"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-gray-900 text-sm">{ws.title}</span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-100 text-blue-800">
                          {ws.organizer || "New Delhi"}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 mt-0.5">
                        Dates: {ws.duration || "22nd & 23rd"} • Venue: {ws.venue || "New Delhi"}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-bold text-gray-900">
                        {conf} / {cap} seats confirmed
                      </span>
                      <span className="block text-[11px] text-gray-500">
                        {avail} seats available ({pct}% full)
                      </span>
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="w-full bg-gray-200 h-2 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all duration-500 ${
                        pct >= 100
                          ? "bg-red-500"
                          : pct >= 80
                          ? "bg-amber-500"
                          : "bg-emerald-500"
                      }`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-gray-500 mt-2 font-medium">
                    <span>Applications: {ws.applicationCount || 0}</span>
                    <span>Verified: {ws.verifiedCount || 0}</span>
                    <button
                      onClick={() => onNavigate("workshop-applications")}
                      className="text-blue-600 font-bold hover:underline"
                    >
                      View Applications →
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Quick Actions & Recent Applications (1 Col) */}
        <div className="space-y-6">
          {/* Quick Action Hub */}
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4">
              Workshop Management Hub
            </h3>
            <div className="space-y-2.5">
              <button
                onClick={() => onNavigate("workshop-applications")}
                className="w-full flex items-center justify-between p-3 rounded-xl border border-gray-100 hover:bg-blue-50/50 hover:border-blue-200 transition text-left group"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-blue-50 text-blue-600 group-hover:bg-blue-100 transition">
                    <ClipboardCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-sm font-bold text-gray-900 block">Workshop Applications</span>
                    <span className="text-xs text-gray-500">Review & confirm delegates</span>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-blue-600 transition" />
              </button>

              <button
                onClick={() => onNavigate("workshop-attendance")}
                className="w-full flex items-center justify-between p-3 rounded-xl border border-gray-100 hover:bg-teal-50/50 hover:border-teal-200 transition text-left group"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-teal-50 text-teal-600 group-hover:bg-teal-100 transition">
                    <UserCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-sm font-bold text-gray-900 block">Workshop Attendance</span>
                    <span className="text-xs text-gray-500">Mark check-ins for delegates</span>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-teal-600 transition" />
              </button>

              <button
                onClick={() => onNavigate("workshop-certificates")}
                className="w-full flex items-center justify-between p-3 rounded-xl border border-gray-100 hover:bg-purple-50/50 hover:border-purple-200 transition text-left group"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-purple-50 text-purple-600 group-hover:bg-purple-100 transition">
                    <BadgeCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-sm font-bold text-gray-900 block">Workshop Certificates</span>
                    <span className="text-xs text-gray-500">Issue attendance certificates</span>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-purple-600 transition" />
              </button>

              <button
                onClick={() => onNavigate("workshop-reports")}
                className="w-full flex items-center justify-between p-3 rounded-xl border border-gray-100 hover:bg-emerald-50/50 hover:border-emerald-200 transition text-left group"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600 group-hover:bg-emerald-100 transition">
                    <BarChart3 className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-sm font-bold text-gray-900 block">Workshop Reports</span>
                    <span className="text-xs text-gray-500">Breakdown & CSV exports</span>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-emerald-600 transition" />
              </button>
            </div>
          </div>

          {/* Recent Applications Mini-List */}
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">
                Recent Applications
              </h3>
              <button
                onClick={() => onNavigate("workshop-applications")}
                className="text-xs font-bold text-[#173B8F] hover:underline"
              >
                View all
              </button>
            </div>

            {recentApplications.length === 0 ? (
              <p className="text-xs text-gray-500 py-3 text-center">No applications received yet.</p>
            ) : (
              <div className="divide-y divide-gray-100">
                {recentApplications.map((app) => (
                  <div
                    key={app.id}
                    onClick={() => onNavigate("workshop-applications")}
                    className="py-2.5 flex items-center justify-between hover:bg-gray-50 px-2 rounded-lg transition cursor-pointer"
                  >
                    <div>
                      <span className="text-xs font-bold text-gray-900 block truncate max-w-[140px]">
                        {app.fullName}
                      </span>
                      <span className="text-[11px] text-gray-500 block truncate max-w-[140px]">
                        {app.workshopTitle}
                      </span>
                    </div>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                        app.applicationStatus === "CONFIRMED"
                          ? "bg-emerald-100 text-emerald-800"
                          : app.applicationStatus === "REJECTED"
                          ? "bg-red-100 text-red-800"
                          : "bg-amber-100 text-amber-800"
                      }`}
                    >
                      {app.applicationStatus}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function ClipboardCheck(props) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect width="8" height="4" x="8" y="2" rx="1" ry="1" />
      <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
      <path d="m9 14 2 2 4-4" />
    </svg>
  );
}
