import React, { useEffect, useState } from "react";
import {
  Trophy,
  Clock,
  CheckCircle2,
  XCircle,
  FileText,
  ArrowRight,
  Eye,
  RefreshCw,
  Award,
  AlertCircle,
  Building,
} from "lucide-react";
import NominationDetailModal from "./NominationDetailModal";

export default function AwardJudgeDashboard({ api, onNavigate }) {
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    accepted: 0,
    rejected: 0,
  });
  const [pendingNominations, setPendingNominations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedNomination, setSelectedNomination] = useState(null);

  const fetchDashboardData = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await api.get("/api/judge/dashboard-stats");
      setStats(response.data.stats || { total: 0, pending: 0, accepted: 0, rejected: 0 });
      setPendingNominations(response.data.pendingNominations || []);
    } catch (err) {
      console.error("Failed to load judge dashboard data:", err);
      setError(err.response?.data?.message || "Failed to load dashboard data. Please check your judge permissions.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const formatDate = (dateStr) => {
    if (!dateStr) return "N/A";
    try {
      return new Date(dateStr).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="space-y-8 p-6 max-w-7xl mx-auto font-['Outfit']">
      
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-amber-100 text-amber-900 mb-2 border border-amber-200">
            <Trophy className="w-3.5 h-3.5" /> GHC Award Jury
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
            Award Judge Dashboard
          </h1>
          <p className="text-sm text-slate-700 mt-1">
            Review and evaluate award nominations submitted to GHC.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchDashboardData}
            disabled={loading}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-sm font-semibold transition-all shadow-sm active:scale-95"
            title="Refresh dashboard metrics"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>
          <button
            onClick={() => onNavigate("award-nominations")}
            className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold transition-all shadow-md shadow-indigo-600/20 active:scale-95"
          >
            View All Nominations <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Error notification banner if any */}
      {error && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-800 text-sm flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Summary KPI Cards - Only Award Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        
        {/* Total Nominations Card */}
        <div className="p-6 rounded-2xl bg-white border border-slate-200/90 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Total Nominations
            </span>
            <span className="p-2.5 rounded-xl bg-indigo-50 text-indigo-700 group-hover:scale-110 transition-transform">
              <Trophy className="w-5 h-5" />
            </span>
          </div>
          <div className="mt-4">
            <span className="text-4xl font-extrabold text-slate-900 tracking-tight">
              {loading ? "..." : stats.total}
            </span>
            <p className="text-xs text-slate-600 mt-1">Submitted award candidates</p>
          </div>
        </div>

        {/* Pending Review Card */}
        <div className="p-6 rounded-2xl bg-white border border-slate-200/90 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Pending Review
            </span>
            <span className="p-2.5 rounded-xl bg-amber-50 text-amber-700 group-hover:scale-110 transition-transform">
              <Clock className="w-5 h-5" />
            </span>
          </div>
          <div className="mt-4">
            <span className="text-4xl font-extrabold text-amber-700 tracking-tight">
              {loading ? "..." : stats.pending}
            </span>
            <p className="text-xs text-slate-600 mt-1">Awaiting judge evaluation</p>
          </div>
        </div>

        {/* Accepted Card */}
        <div className="p-6 rounded-2xl bg-white border border-slate-200/90 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Accepted
            </span>
            <span className="p-2.5 rounded-xl bg-emerald-50 text-emerald-700 group-hover:scale-110 transition-transform">
              <CheckCircle2 className="w-5 h-5" />
            </span>
          </div>
          <div className="mt-4">
            <span className="text-4xl font-extrabold text-emerald-700 tracking-tight">
              {loading ? "..." : stats.accepted}
            </span>
            <p className="text-xs text-slate-600 mt-1">Confirmed award nominees</p>
          </div>
        </div>

        {/* Rejected Card */}
        <div className="p-6 rounded-2xl bg-white border border-slate-200/90 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Rejected
            </span>
            <span className="p-2.5 rounded-xl bg-rose-50 text-rose-700 group-hover:scale-110 transition-transform">
              <XCircle className="w-5 h-5" />
            </span>
          </div>
          <div className="mt-4">
            <span className="text-4xl font-extrabold text-rose-700 tracking-tight">
              {loading ? "..." : stats.rejected}
            </span>
            <p className="text-xs text-slate-600 mt-1">Declined applications</p>
          </div>
        </div>

      </div>

      {/* Pending Nominations Section */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden">
        
        <div className="p-6 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-slate-50/50">
          <div>
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Clock className="w-5 h-5 text-amber-500" /> Pending Nominations
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Nominations requiring your attention and decision.
            </p>
          </div>

          <button
            onClick={() => onNavigate("award-nominations")}
            className="text-xs font-bold text-indigo-600 hover:text-indigo-800 inline-flex items-center gap-1 transition-colors self-start sm:self-center"
          >
            Go to Full Nominations Table <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Table Content */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-slate-50 text-[11px] font-bold text-slate-700 uppercase tracking-wider border-b border-slate-200">
                <th className="py-3.5 px-6">Nominee Name</th>
                <th className="py-3.5 px-6">Award Category</th>
                <th className="py-3.5 px-6">Institution / Organisation</th>
                <th className="py-3.5 px-6">Submission Date</th>
                <th className="py-3.5 px-6">Status</th>
                <th className="py-3.5 px-6 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan="6" className="py-12 text-center text-slate-400">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-indigo-500" />
                    Loading pending nominations...
                  </td>
                </tr>
              ) : pendingNominations.length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-12 text-center text-slate-500">
                    <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-2 opacity-80" />
                    <p className="font-semibold text-slate-700">No pending nominations require review!</p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      All submitted candidates have been evaluated or no new nominations exist.
                    </p>
                  </td>
                </tr>
              ) : (
                pendingNominations.map((nom) => (
                  <tr
                    key={nom.id}
                    className="hover:bg-slate-50/80 transition-colors group cursor-pointer"
                    onClick={() => setSelectedNomination(nom)}
                  >
                    <td className="py-4 px-6 font-semibold text-slate-900">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-indigo-50 text-indigo-700 flex items-center justify-center font-bold text-xs shrink-0">
                          {nom.fullName ? nom.fullName.charAt(0).toUpperCase() : "N"}
                        </div>
                        <div>
                          <span className="block leading-tight">{nom.fullName}</span>
                          <span className="text-[11px] font-mono text-slate-400">{nom.nominationId}</span>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-100">
                        <Award className="w-3 h-3" />
                        {nom.awardCategory}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-slate-600">
                      <span className="font-medium text-slate-800 block truncate max-w-[200px]">
                        {nom.organisation || nom.medicalCollege || "—"}
                      </span>
                      {nom.designation && (
                        <span className="text-xs text-slate-400 block truncate max-w-[200px]">
                          {nom.designation}
                        </span>
                      )}
                    </td>
                    <td className="py-4 px-6 text-slate-500 whitespace-nowrap text-xs">
                      {formatDate(nom.createdAt)}
                    </td>
                    <td className="py-4 px-6 whitespace-nowrap">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                        {nom.status}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-right whitespace-nowrap">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedNomination(nom);
                        }}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-600 text-indigo-700 hover:text-white font-semibold text-xs transition-colors shadow-sm"
                      >
                        <Eye className="w-3.5 h-3.5" /> View Nomination
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

      </div>

      {/* Review Modal */}
      {selectedNomination && (
        <NominationDetailModal
          nomination={selectedNomination}
          api={api}
          onClose={() => setSelectedNomination(null)}
          onDecisionSuccess={(updated) => {
            setSelectedNomination(updated);
            fetchDashboardData();
          }}
        />
      )}

    </div>
  );
}
