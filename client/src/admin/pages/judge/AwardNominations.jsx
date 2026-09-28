import React, { useEffect, useState, useCallback } from "react";
import {
  Trophy,
  Search,
  Filter,
  Eye,
  CheckCircle2,
  XCircle,
  Clock,
  RefreshCw,
  Award,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  FileQuestion,
} from "lucide-react";
import NominationDetailModal from "./NominationDetailModal";

export default function AwardNominations({ api, onNavigate, user }) {
  const [nominations, setNominations] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  
  // Search & Filter state
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [paymentStatusFilter, setPaymentStatusFilter] = useState("ALL");
  const [page, setPage] = useState(1);
  const [limit] = useState(15);
  
  // Dynamic categories from database
  const [awardCategories, setAwardCategories] = useState([]);
  
  // Active selected nomination for modal
  const [selectedNomination, setSelectedNomination] = useState(null);

  const userRole = (user?.role || "").toUpperCase();
  const isAdmin = userRole === "ADMIN" || userRole === "SUPER_ADMIN" || Boolean(user?.permissions?.includes("manage_awards"));

  const fetchCategories = useCallback(async () => {
    try {
      const res = await api.get("/api/judge/categories");
      const list = res.data.awards || [];
      setAwardCategories(list);
    } catch (err) {
      console.warn("Failed to load dynamic award categories:", err.message);
    }
  }, [api]);

  const fetchNominations = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params = {
        search: search.trim() || undefined,
        awardCategory: categoryFilter !== "ALL" ? categoryFilter : undefined,
        status: statusFilter !== "ALL" ? statusFilter : undefined,
        paymentStatus: paymentStatusFilter !== "ALL" ? paymentStatusFilter : undefined,
        page,
        limit,
      };

      const res = await api.get("/api/judge/nominations", { params });
      setNominations(res.data.nominations || []);
      setTotal(res.data.total || 0);
    } catch (err) {
      console.error("Failed to load nominations:", err);
      setError(err.response?.data?.message || "Failed to load nominations. Please ensure you have Judge review permissions.");
    } finally {
      setLoading(false);
    }
  }, [api, search, categoryFilter, statusFilter, paymentStatusFilter, page, limit]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  useEffect(() => {
    fetchNominations();
  }, [fetchNominations]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchNominations();
  };

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

  const totalPages = Math.ceil(total / limit) || 1;

  return (
    <div className="space-y-6 p-6 max-w-7xl mx-auto font-['Outfit']">
      
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-indigo-50 text-indigo-700 mb-2 border border-indigo-100">
            <Trophy className="w-3.5 h-3.5" /> Award Evaluation
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
            Award Nominations
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Review nominees and make your award decision.
          </p>
        </div>

        <button
          onClick={fetchNominations}
          disabled={loading}
          className="self-start sm:self-auto inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-sm font-semibold transition-all shadow-sm active:scale-95"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          Refresh Records
        </button>
      </div>

      {/* Error alert */}
      {error && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-800 text-sm flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Search & Filter Bar */}
      <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        
        {/* Search Input */}
        <form onSubmit={handleSearchSubmit} className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by nominee, award, institution, organisation..."
            className="w-full pl-10 pr-24 py-2.5 rounded-xl border border-slate-300 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
          />
          {search && (
            <button
              type="button"
              onClick={() => {
                setSearch("");
                setPage(1);
              }}
              className="absolute right-14 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400 hover:text-slate-700"
            >
              Clear
            </button>
          )}
          <button
            type="submit"
            className="absolute right-2 top-1/2 -translate-y-1/2 px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition-colors"
          >
            Find
          </button>
        </form>

        {/* Filters Group */}
        <div className="flex flex-wrap items-center gap-3">
          
          {/* Award Category Filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider hidden sm:inline">
              Category:
            </span>
            <select
              value={categoryFilter}
              onChange={(e) => {
                setCategoryFilter(e.target.value);
                setPage(1);
              }}
              className="px-3 py-2 rounded-xl border border-slate-300 text-sm font-medium text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="ALL">All Categories</option>
              {awardCategories.map((c) => (
                <option key={c.id || c.name} value={c.name}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider hidden sm:inline">
              Status:
            </span>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="px-3 py-2 rounded-xl border border-slate-300 text-sm font-medium text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="ALL">All Statuses</option>
              <option value="PENDING">Pending</option>
              <option value="ACCEPTED">Accepted</option>
              <option value="REJECTED">Rejected</option>
            </select>
          </div>

          {/* Admin Payment Status Filter (Section 26 requirement) */}
          {isAdmin && (
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider hidden sm:inline">
                Payment:
              </span>
              <select
                value={paymentStatusFilter}
                onChange={(e) => {
                  setPaymentStatusFilter(e.target.value);
                  setPage(1);
                }}
                className="px-3 py-2 rounded-xl border border-slate-300 text-sm font-medium text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="ALL">All Payments</option>
                <option value="PAYMENT_ID_SUBMITTED">ID Submitted</option>
                <option value="PAYMENT_VERIFIED">Payment Verified</option>
                <option value="PAYMENT_PENDING">Pending</option>
                <option value="PAYMENT_FAILED">Payment Issue</option>
              </select>
            </div>
          )}

        </div>

      </div>

      {/* Nominations Table */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden">
        
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-slate-50 text-[11px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200">
                <th className="py-4 px-6">Nominee</th>
                <th className="py-4 px-6">Award Category</th>
                <th className="py-4 px-6">Institution / Organisation</th>
                <th className="py-4 px-6">Designation</th>
                {isAdmin && <th className="py-4 px-6">Payment ID</th>}
                <th className="py-4 px-6">Submitted</th>
                <th className="py-4 px-6">Status</th>
                <th className="py-4 px-6 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={isAdmin ? 8 : 7} className="py-14 text-center text-slate-400">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-indigo-500" />
                    Loading nominations...
                  </td>
                </tr>
              ) : nominations.length === 0 ? (
                <tr>
                  <td colSpan={isAdmin ? 8 : 7} className="py-16 text-center text-slate-500">
                    <FileQuestion className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                    <p className="font-bold text-slate-700 text-base">
                      No nominations have been submitted yet.
                    </p>
                    <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                      {search || categoryFilter !== "ALL" || statusFilter !== "ALL" || paymentStatusFilter !== "ALL"
                        ? "No nominations matched your search and filter criteria. Try resetting the filters."
                        : "When candidates submit nominations via the GHC Awards portal, their complete profiles will appear here for your review."}
                    </p>
                  </td>
                </tr>
              ) : (
                nominations.map((nom) => (
                  <tr
                    key={nom.id}
                    className="hover:bg-slate-50/80 transition-colors group cursor-pointer"
                    onClick={() => setSelectedNomination(nom)}
                  >
                    {/* Nominee */}
                    <td className="py-4 px-6 font-semibold text-slate-900">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-indigo-50 text-indigo-700 flex items-center justify-center font-bold text-xs shrink-0">
                          {nom.fullName ? nom.fullName.charAt(0).toUpperCase() : "N"}
                        </div>
                        <div>
                          <span className="block leading-tight text-slate-900 group-hover:text-indigo-600 transition-colors font-bold">
                            {nom.fullName}
                          </span>
                          <span className="text-[11px] font-mono text-slate-400">
                            {nom.nominationId}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Award Category */}
                    <td className="py-4 px-6">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-100">
                        <Award className="w-3 h-3" />
                        {nom.awardCategory}
                        {nom.ageCategory && (
                          <span className="text-[10px] text-indigo-500 ml-0.5">
                            ({nom.ageCategory.replace("_", " ")})
                          </span>
                        )}
                      </span>
                    </td>

                    {/* Institution / Organisation */}
                    <td className="py-4 px-6 text-slate-600">
                      <span className="font-medium text-slate-800 block truncate max-w-[200px]">
                        {nom.organisation || nom.medicalCollege || "—"}
                      </span>
                      {nom.medicalCollege && nom.organisation && nom.medicalCollege !== nom.organisation && (
                        <span className="text-xs text-slate-400 block truncate max-w-[200px]">
                          {nom.medicalCollege}
                        </span>
                      )}
                    </td>

                    {/* Designation */}
                    <td className="py-4 px-6 text-slate-700 font-medium whitespace-nowrap">
                      {nom.designation || "—"}
                    </td>

                    {/* Admin Payment Info (Section 14 & 16 requirement) */}
                    {isAdmin && (
                      <td className="py-4 px-6 whitespace-nowrap">
                        {nom.paymentId ? (
                          <div>
                            <span className="font-mono text-xs font-bold text-slate-800 block">
                              {nom.paymentId}
                            </span>
                            <span
                              className={`inline-block px-2 py-0.5 mt-0.5 rounded text-[10px] font-bold ${
                                nom.paymentStatus === "PAYMENT_VERIFIED"
                                  ? "bg-emerald-100 text-emerald-800"
                                  : "bg-purple-50 text-purple-700 border border-purple-200"
                              }`}
                            >
                              {nom.paymentStatus === "PAYMENT_VERIFIED" ? "Verified" : "CLIRNET ID"}
                            </span>
                          </div>
                        ) : (
                          <span className="text-xs text-slate-400 italic">No Payment</span>
                        )}
                      </td>
                    )}

                    {/* Submitted Date */}
                    <td className="py-4 px-6 text-slate-500 whitespace-nowrap text-xs">
                      {formatDate(nom.createdAt)}
                    </td>

                    {/* Status */}
                    <td className="py-4 px-6 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
                          nom.status === "ACCEPTED"
                            ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                            : nom.status === "REJECTED"
                            ? "bg-rose-100 text-rose-800 border border-rose-200"
                            : "bg-amber-100 text-amber-800 border border-amber-200"
                        }`}
                      >
                        {nom.status === "ACCEPTED" ? (
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        ) : nom.status === "REJECTED" ? (
                          <XCircle className="w-3 h-3 text-rose-600" />
                        ) : (
                          <Clock className="w-3 h-3 text-amber-600" />
                        )}
                        {nom.status}
                      </span>
                    </td>

                    {/* Action */}
                    <td className="py-4 px-6 text-right whitespace-nowrap">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedNomination(nom);
                        }}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-600 text-indigo-700 hover:text-white font-semibold text-xs transition-colors shadow-sm"
                      >
                        <Eye className="w-3.5 h-3.5" /> View
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        {total > 0 && (
          <div className="p-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-50/50 text-xs text-slate-600">
            <div>
              Showing{" "}
              <strong>{(page - 1) * limit + 1}</strong> to{" "}
              <strong>{Math.min(page * limit, total)}</strong> of{" "}
              <strong>{total}</strong> nominations
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(p - 1, 1))}
                className="px-3 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed font-medium inline-flex items-center gap-1 transition-colors"
              >
                <ChevronLeft className="w-3.5 h-3.5" /> Previous
              </button>
              <span className="font-bold text-slate-800 px-2">
                Page {page} of {totalPages}
              </span>
              <button
                type="button"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
                className="px-3 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed font-medium inline-flex items-center gap-1 transition-colors"
              >
                Next <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

      </div>

      {/* Review Modal */}
      {selectedNomination && (
        <NominationDetailModal
          nomination={selectedNomination}
          api={api}
          user={user}
          onClose={() => setSelectedNomination(null)}
          onDecisionSuccess={(updated) => {
            setSelectedNomination(updated);
            fetchNominations();
          }}
        />
      )}

    </div>
  );
}
