import React, { useState, useEffect } from "react";
import {
  BarChart3,
  Download,
  RefreshCw,
  TrendingUp,
  Users,
  CheckCircle2,
  Clock,
  ShieldCheck,
  Award,
  FileSpreadsheet,
} from "lucide-react";

export default function WorkshopReports({ api }) {
  const [reports, setReports] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchReports = async () => {
    setLoading(true);
    try {
      const res = await api.get("/api/workshops/reports");
      setReports(res.data);
    } catch (err) {
      console.error("Failed to load workshop reports", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const exportToCSV = () => {
    if (!reports?.breakdown?.length) return;

    const headers = [
      "Workshop ID",
      "Workshop Title",
      "Venue",
      "Capacity",
      "Total Applications",
      "Under Review",
      "GHC Pass Verified",
      "GHC Pass Not Found",
      "Confirmed Seats",
      "Available Seats",
      "Occupancy Rate (%)",
      "Attended",
      "Certificates Issued",
    ];

    const rows = reports.breakdown.map((w) => [
      w.id,
      `"${w.title.replace(/"/g, '""')}"`,
      `"${(w.venue || "New Delhi").replace(/"/g, '""')}"`,
      w.capacity,
      w.totalApplications,
      w.underReview,
      w.ghcPassVerified,
      w.ghcPassNotFound,
      w.confirmed,
      w.availableSeats,
      `${w.occupancyRate}%`,
      w.attended,
      w.certificatesIssued,
    ]);

    const csvContent = [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `GHC_Workshop_Report_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const summary = reports?.summary || {};
  const breakdown = reports?.breakdown || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
            Workshop Reports & Analytics
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Real-time seat utilization, GHC pass verification, attendance rates, and certificate metrics.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchReports}
            className="p-2 border border-gray-200 hover:bg-gray-50 text-gray-700 rounded-xl transition flex items-center gap-1.5 text-xs font-semibold"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            <span>Refresh</span>
          </button>
          <button
            onClick={exportToCSV}
            disabled={!breakdown.length}
            className="px-4 py-2 bg-[#173B8F] hover:bg-[#122e70] text-white rounded-xl text-xs font-bold transition flex items-center gap-2 shadow-sm disabled:opacity-50"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* KPI Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-500 uppercase">Overall Seat Occupancy</span>
            <TrendingUp className="w-4 h-4 text-blue-600" />
          </div>
          <span className="text-3xl font-extrabold text-gray-900 mt-3 block">
            {summary.overallOccupancy ?? 0}%
          </span>
          <span className="text-xs text-gray-500 mt-1 block">
            {summary.totalConfirmed ?? 0} confirmed of {summary.totalCapacity ?? 0} seats
          </span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-500 uppercase">Total Applications</span>
            <Users className="w-4 h-4 text-indigo-600" />
          </div>
          <span className="text-3xl font-extrabold text-gray-900 mt-3 block">
            {summary.totalApplications ?? 0}
          </span>
          <span className="text-xs text-gray-500 mt-1 block">
            {summary.underReview ?? 0} awaiting review
          </span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-500 uppercase">GHC Pass Verified</span>
            <ShieldCheck className="w-4 h-4 text-teal-600" />
          </div>
          <span className="text-3xl font-extrabold text-gray-900 mt-3 block">
            {summary.ghcPassVerified ?? 0}
          </span>
          <span className="text-xs text-gray-500 mt-1 block">
            Matched against GHC/CLIRNET database
          </span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-500 uppercase">Attendance & Certs</span>
            <Award className="w-4 h-4 text-purple-600" />
          </div>
          <span className="text-3xl font-extrabold text-gray-900 mt-3 block">
            {summary.attended ?? 0}
          </span>
          <span className="text-xs text-gray-500 mt-1 block">
            {summary.certificatesIssued ?? 0} certificates generated
          </span>
        </div>
      </div>

      {/* Breakdown Table */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-gray-200 bg-gray-50/50">
          <h2 className="text-sm font-bold text-gray-900">Workshop-by-Workshop Performance</h2>
          <p className="text-xs text-gray-500">Seat capacity, applications, verification, attendance and certificates.</p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-50 text-gray-600 uppercase font-semibold border-b border-gray-200">
              <tr>
                <th className="py-3.5 px-4">Workshop</th>
                <th className="py-3.5 px-4">Capacity</th>
                <th className="py-3.5 px-4">Applications</th>
                <th className="py-3.5 px-4">Under Review</th>
                <th className="py-3.5 px-4">Pass Verified</th>
                <th className="py-3.5 px-4">Confirmed</th>
                <th className="py-3.5 px-4">Available</th>
                <th className="py-3.5 px-4">Occupancy</th>
                <th className="py-3.5 px-4">Attended</th>
                <th className="py-3.5 px-4">Certs Issued</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={10} className="py-10 text-center text-gray-500">
                    Loading workshop reports...
                  </td>
                </tr>
              ) : breakdown.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-10 text-center text-gray-500">
                    No workshop data available.
                  </td>
                </tr>
              ) : (
                breakdown.map((row) => (
                  <tr key={row.id} className="hover:bg-blue-50/30 transition">
                    <td className="py-3.5 px-4">
                      <span className="font-bold text-gray-900 block">{row.title}</span>
                      <span className="text-[10px] text-gray-500 block">{row.organizer || "New Delhi"}</span>
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-gray-700">{row.capacity}</td>
                    <td className="py-3.5 px-4 font-semibold text-blue-700">{row.totalApplications}</td>
                    <td className="py-3.5 px-4 text-amber-700 font-semibold">{row.underReview}</td>
                    <td className="py-3.5 px-4 text-teal-700 font-semibold">{row.ghcPassVerified}</td>
                    <td className="py-3.5 px-4 text-emerald-700 font-bold">{row.confirmed}</td>
                    <td className="py-3.5 px-4 text-gray-700">{row.availableSeats}</td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-gray-900">{row.occupancyRate}%</span>
                        <div className="w-16 bg-gray-200 h-1.5 rounded-full overflow-hidden">
                          <div
                            className={`h-full ${
                              row.occupancyRate >= 100
                                ? "bg-red-500"
                                : row.occupancyRate >= 75
                                ? "bg-amber-500"
                                : "bg-emerald-500"
                            }`}
                            style={{ width: `${Math.min(100, row.occupancyRate)}%` }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-gray-800 font-semibold">{row.attended}</td>
                    <td className="py-3.5 px-4 text-purple-700 font-semibold">{row.certificatesIssued}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
