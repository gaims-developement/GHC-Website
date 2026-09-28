import React, { useState, useEffect, useCallback } from "react";
import {
  Search,
  Filter,
  CheckCircle2,
  Clock,
  AlertCircle,
  Eye,
  RefreshCw,
  FileSpreadsheet,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  Building,
  GraduationCap,
  Sparkles,
  Check,
} from "lucide-react";
import WorkshopApplicationDetailModal from "./WorkshopApplicationDetailModal";

export default function WorkshopApplications({ api }) {
  const [applications, setApplications] = useState([]);
  const [workshops, setWorkshops] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 15, total: 0, totalPages: 1 });
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState("");
  const [workshopFilter, setWorkshopFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [ghcPassFilter, setGhcPassFilter] = useState("all");

  // Detail Modal
  const [selectedApplication, setSelectedApplication] = useState(null);
  const [confirmOnOpen, setConfirmOnOpen] = useState(false);

  const fetchWorkshops = useCallback(async () => {
    try {
      const res = await api.get("/api/workshops?admin=1");
      setWorkshops(res.data.workshops || []);
    } catch (err) {
      console.error("Failed to load workshops list", err);
    }
  }, [api]);

  const fetchApplications = useCallback(
    async (page = 1) => {
      setLoading(true);
      try {
        const params = new URLSearchParams({
          page: String(page),
          limit: "15",
        });
        if (search.trim()) params.append("search", search.trim());
        if (workshopFilter !== "all") params.append("workshopId", workshopFilter);
        if (statusFilter !== "all") params.append("status", statusFilter);
        if (ghcPassFilter !== "all") params.append("ghcPassStatus", ghcPassFilter);

        const res = await api.get(`/api/workshops/applications?${params.toString()}`);
        setApplications(res.data.applications || []);
        if (res.data.pagination) {
          setPagination(res.data.pagination);
        }
      } catch (err) {
        console.error("Failed to load applications", err);
      } finally {
        setLoading(false);
      }
    },
    [api, search, workshopFilter, statusFilter, ghcPassFilter]
  );

  useEffect(() => {
    fetchWorkshops();
  }, [fetchWorkshops]);

  useEffect(() => {
    fetchApplications(1);
  }, [fetchApplications]);

  const handleUpdateApplication = (updatedApp) => {
    setApplications((prev) =>
      prev.map((app) => (app.id === updatedApp.id ? { ...app, ...updatedApp } : app))
    );
    if (selectedApplication?.id === updatedApp.id) {
      setSelectedApplication(updatedApp);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "CONFIRMED":
        return "bg-emerald-100 text-emerald-800 border-emerald-200";
      case "REJECTED":
        return "bg-red-100 text-red-800 border-red-200";
      case "GHC_PASS_VERIFIED":
        return "bg-teal-100 text-teal-800 border-teal-200";
      case "GHC_PASS_NOT_FOUND":
        return "bg-orange-100 text-orange-800 border-orange-200";
      case "UNDER_REVIEW":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "SUBMITTED":
      default:
        return "bg-amber-100 text-amber-800 border-amber-200";
    }
  };

  const getGhcPassBadge = (status) => {
    switch (status) {
      case "VERIFIED":
        return "text-teal-700 bg-teal-50 border-teal-200";
      case "NOT_FOUND":
        return "text-orange-700 bg-orange-50 border-orange-200";
      default:
        return "text-gray-600 bg-gray-50 border-gray-200";
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
            Workshop Applications
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Review delegate submissions, verify GHC Passes, allocate seats, and manage registration IDs.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => fetchApplications(pagination.page)}
            className="p-2 border border-gray-200 hover:bg-gray-50 text-gray-700 rounded-xl transition flex items-center gap-1.5 text-xs font-semibold"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Search */}
          <div className="relative">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by name, email, mobile..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#173B8F] bg-gray-50/50"
            />
          </div>

          {/* Workshop Filter */}
          <div>
            <select
              value={workshopFilter}
              onChange={(e) => setWorkshopFilter(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#173B8F] bg-gray-50/50"
            >
              <option value="all">All Workshops</option>
              {workshops.map((ws) => (
                <option key={ws.id} value={ws.id}>
                  {ws.title}
                </option>
              ))}
            </select>
          </div>

          {/* Application Status Filter */}
          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#173B8F] bg-gray-50/50"
            >
              <option value="all">All Application Statuses</option>
              <option value="SUBMITTED">Submitted</option>
              <option value="UNDER_REVIEW">Under Review</option>
              <option value="GHC_PASS_VERIFIED">GHC Pass Verified</option>
              <option value="CONFIRMED">Confirmed</option>
              <option value="GHC_PASS_NOT_FOUND">GHC Pass Not Found</option>
              <option value="REJECTED">Rejected</option>
            </select>
          </div>

          {/* GHC Pass Status Filter */}
          <div>
            <select
              value={ghcPassFilter}
              onChange={(e) => setGhcPassFilter(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#173B8F] bg-gray-50/50"
            >
              <option value="all">All GHC Pass Statuses</option>
              <option value="PENDING">Pass Pending</option>
              <option value="VERIFIED">Pass Verified</option>
              <option value="NOT_FOUND">Pass Not Found</option>
            </select>
          </div>
        </div>
      </div>

      {/* Applications Table */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-50 border-b border-gray-200 text-gray-600 uppercase font-semibold tracking-wider">
              <tr>
                <th className="py-3.5 px-4">Applicant</th>
                <th className="py-3.5 px-4">Workshop</th>
                <th className="py-3.5 px-4">Institution</th>
                <th className="py-3.5 px-4">Email</th>
                <th className="py-3.5 px-4">Mobile</th>
                <th className="py-3.5 px-4">GHC Pass</th>
                <th className="py-3.5 px-4">Application Status</th>
                <th className="py-3.5 px-4">Submitted At</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-gray-500 font-medium">
                    Loading workshop applications...
                  </td>
                </tr>
              ) : applications.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-gray-500">
                    No workshop applications matched your criteria.
                  </td>
                </tr>
              ) : (
                applications.map((app) => (
                  <tr key={app.id} className="hover:bg-blue-50/40 transition">
                    <td className="py-3.5 px-4">
                      <div>
                        <span className="font-bold text-gray-900 block">{app.fullName}</span>
                        <span className="font-mono text-[10px] text-gray-400 block">
                          {app.applicationId}
                        </span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="font-semibold text-gray-800 block">{app.workshopTitle}</span>
                      <span className="text-[10px] text-gray-500 block">
                        {app.workshopOrganizer || "New Delhi"}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="text-gray-700 block truncate max-w-[150px]">
                        {app.institution}
                      </span>
                      <span className="text-[10px] text-gray-400">
                        {app.designation} ({app.academicLevel})
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <a href={`mailto:${app.email}`} className="text-blue-600 hover:underline">
                        {app.email}
                      </a>
                    </td>
                    <td className="py-3.5 px-4 text-gray-700 font-mono">
                      {app.mobile}
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-md font-bold text-[10px] border ${getGhcPassBadge(
                          app.ghcPassStatus
                        )}`}
                      >
                        {app.ghcPassStatus}
                      </span>
                      {app.ghcRegistrationId && (
                        <span className="block font-mono text-[10px] text-gray-500 mt-0.5">
                          {app.ghcRegistrationId}
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full font-bold text-[10px] border ${getStatusBadge(
                          app.applicationStatus
                        )}`}
                      >
                        {app.applicationStatus}
                      </span>
                      {app.workshopRegistrationId && (
                        <span className="block font-mono font-bold text-[10px] text-emerald-700 mt-0.5">
                          {app.workshopRegistrationId}
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-gray-500 whitespace-nowrap">
                      {new Date(app.createdAt).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="inline-flex items-center gap-1.5 justify-end">
                        {app.applicationStatus !== "CONFIRMED" && app.applicationStatus !== "REJECTED" && (
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedApplication(app);
                              setConfirmOnOpen(true);
                            }}
                            className="px-2.5 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 font-bold transition inline-flex items-center gap-1 shadow-xs text-xs"
                            title="Confirm Application"
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>Confirm</span>
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedApplication(app);
                            setConfirmOnOpen(false);
                          }}
                          className="px-2.5 py-1.5 rounded-lg border border-gray-200 hover:bg-white text-gray-700 font-bold hover:text-blue-600 transition inline-flex items-center gap-1 shadow-xs text-xs"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Review</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        {pagination.totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-t border-gray-200 text-xs">
            <span className="text-gray-500">
              Showing page <strong>{pagination.page}</strong> of <strong>{pagination.totalPages}</strong> ({pagination.total} total)
            </span>
            <div className="flex items-center gap-2">
              <button
                disabled={pagination.page <= 1}
                onClick={() => fetchApplications(pagination.page - 1)}
                className="p-1.5 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 disabled:opacity-40 transition"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                disabled={pagination.page >= pagination.totalPages}
                onClick={() => fetchApplications(pagination.page + 1)}
                className="p-1.5 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 disabled:opacity-40 transition"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {selectedApplication && (
        <WorkshopApplicationDetailModal
          application={selectedApplication}
          autoOpenConfirm={confirmOnOpen}
          onClose={() => {
            setSelectedApplication(null);
            setConfirmOnOpen(false);
          }}
          onUpdate={handleUpdateApplication}
          api={api}
        />
      )}
    </div>
  );
}
