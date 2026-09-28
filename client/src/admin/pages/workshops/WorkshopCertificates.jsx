import React, { useState, useEffect, useCallback } from "react";
import {
  BadgeCheck,
  Search,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  ExternalLink,
  Award,
  FileCheck2,
  Building,
  GraduationCap,
} from "lucide-react";

export default function WorkshopCertificates({ api }) {
  const [delegates, setDelegates] = useState([]);
  const [workshops, setWorkshops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [workshopFilter, setWorkshopFilter] = useState("all");
  const [eligibilityFilter, setEligibilityFilter] = useState("all");
  const [issuingId, setIssuingId] = useState(null);
  const [statusMessage, setStatusMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const fetchWorkshops = useCallback(async () => {
    try {
      const res = await api.get("/api/workshops?admin=1");
      setWorkshops(res.data.workshops || []);
    } catch (err) {
      console.error("Failed to load workshops", err);
    }
  }, [api]);

  const fetchDelegates = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        status: "CONFIRMED",
        limit: "100",
      });
      if (workshopFilter !== "all") params.append("workshopId", workshopFilter);
      if (search.trim()) params.append("search", search.trim());

      const res = await api.get(`/api/workshops/applications?${params.toString()}`);
      setDelegates(res.data.applications || []);
    } catch (err) {
      console.error("Failed to load workshop delegates", err);
    } finally {
      setLoading(false);
    }
  }, [api, workshopFilter, search]);

  useEffect(() => {
    fetchWorkshops();
  }, [fetchWorkshops]);

  useEffect(() => {
    fetchDelegates();
  }, [fetchDelegates]);

  const handleIssueCertificate = async (delegate) => {
    setIssuingId(delegate.id);
    setStatusMessage("");
    setErrorMessage("");
    try {
      const res = await api.post(`/api/workshops/applications/${delegate.id}/certificate`);
      setStatusMessage(`Certificate generated! Certificate Number: ${res.data.certificateNumber}`);
      setDelegates((prev) =>
        prev.map((d) =>
          d.id === delegate.id
            ? {
                ...d,
                certificateIssued: 1,
                certificateId: res.data.certificateNumber,
              }
            : d
        )
      );
    } catch (err) {
      setErrorMessage(err.response?.data?.error || "Certificate issuance failed");
    } finally {
      setIssuingId(null);
    }
  };

  const filteredDelegates = delegates.filter((d) => {
    const isEligible = Boolean(d.attended) && d.applicationStatus === "CONFIRMED";
    const isIssued = Boolean(d.certificateIssued);

    if (eligibilityFilter === "eligible") return isEligible && !isIssued;
    if (eligibilityFilter === "issued") return isIssued;
    if (eligibilityFilter === "not_eligible") return !isEligible;
    return true;
  });

  const totalConfirmed = delegates.length;
  const eligibleCount = delegates.filter((d) => d.attended && !d.certificateIssued).length;
  const issuedCount = delegates.filter((d) => d.certificateIssued).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
            Workshop Certificates
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Generate and manage verified digital certificates for delegates who confirmed and attended GHC Workshops.
          </p>
        </div>
        <button
          onClick={fetchDelegates}
          className="p-2 border border-gray-200 hover:bg-gray-50 text-gray-700 rounded-xl transition flex items-center gap-1.5 text-xs font-semibold self-start"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          <span>Refresh</span>
        </button>
      </div>

      {statusMessage && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-xs font-semibold text-emerald-800 rounded-xl flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{statusMessage}</span>
        </div>
      )}
      {errorMessage && (
        <div className="p-3 bg-red-50 border border-red-200 text-xs font-semibold text-red-800 rounded-xl flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs">
          <span className="text-xs text-gray-500 font-semibold block uppercase">Total Confirmed</span>
          <span className="text-2xl font-extrabold text-gray-900">{totalConfirmed}</span>
        </div>
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs">
          <span className="text-xs text-purple-700 font-semibold block uppercase">Eligible for Certificate</span>
          <span className="text-2xl font-extrabold text-purple-600">{eligibleCount}</span>
        </div>
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs">
          <span className="text-xs text-emerald-700 font-semibold block uppercase">Certificates Issued</span>
          <span className="text-2xl font-extrabold text-emerald-600">{issuedCount}</span>
        </div>
      </div>

      {/* Filter Row */}
      <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="relative">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by Registration ID, name, email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#173B8F] bg-gray-50/50"
            />
          </div>

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

          <div>
            <select
              value={eligibilityFilter}
              onChange={(e) => setEligibilityFilter(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#173B8F] bg-gray-50/50"
            >
              <option value="all">All Statuses</option>
              <option value="eligible">Eligible (Attended, Not Issued)</option>
              <option value="issued">Certificate Issued</option>
              <option value="not_eligible">Not Yet Attended</option>
            </select>
          </div>
        </div>
      </div>

      {/* Certificate Table */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-50 border-b border-gray-200 text-gray-600 uppercase font-semibold">
              <tr>
                <th className="py-3.5 px-4">Registration ID</th>
                <th className="py-3.5 px-4">Delegate</th>
                <th className="py-3.5 px-4">Workshop</th>
                <th className="py-3.5 px-4">Attendance</th>
                <th className="py-3.5 px-4">Certificate Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-10 text-center text-gray-500">
                    Loading delegate records...
                  </td>
                </tr>
              ) : filteredDelegates.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-10 text-center text-gray-500">
                    No delegates found matching the criteria.
                  </td>
                </tr>
              ) : (
                filteredDelegates.map((d) => {
                  const isPresent = Boolean(d.attended);
                  const isIssued = Boolean(d.certificateIssued);

                  return (
                    <tr key={d.id} className="hover:bg-purple-50/30 transition">
                      <td className="py-3.5 px-4 font-mono font-bold text-gray-900">
                        {d.workshopRegistrationId || "PENDING"}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="font-bold text-gray-900 block">{d.fullName}</span>
                        <span className="text-[10px] text-gray-500 block">{d.institution}</span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="font-semibold text-gray-800 block">{d.workshopTitle}</span>
                        <span className="text-[10px] text-gray-500 block">New Delhi</span>
                      </td>
                      <td className="py-3.5 px-4">
                        {isPresent ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                            <CheckCircle2 className="w-3 h-3" />
                            Attended
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                            Not Marked Present
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        {isIssued ? (
                          <div>
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-800">
                              <BadgeCheck className="w-3.5 h-3.5" />
                              Issued
                            </span>
                            <span className="block font-mono text-[10px] text-purple-900 font-semibold mt-0.5">
                              {d.certificateId}
                            </span>
                          </div>
                        ) : isPresent ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800">
                            Eligible to Issue
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-gray-100 text-gray-500">
                            Attendance Required
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        {isIssued ? (
                          <span className="text-xs font-semibold text-emerald-700 inline-flex items-center gap-1">
                            <CheckCircle2 className="w-4 h-4" />
                            Generated
                          </span>
                        ) : isPresent ? (
                          <button
                            onClick={() => handleIssueCertificate(d)}
                            disabled={issuingId === d.id}
                            className="px-3 py-1.5 rounded-lg text-xs font-bold transition inline-flex items-center gap-1.5 bg-[#7C3AED] hover:bg-[#6D28D9] text-white shadow-xs"
                          >
                            <Award className="w-3.5 h-3.5" />
                            <span>{issuingId === d.id ? "Generating..." : "Issue Certificate"}</span>
                          </button>
                        ) : (
                          <span className="text-xs text-gray-400 font-medium">Ineligible</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
