import React, { useState, useEffect, useCallback } from "react";
import {
  UserCheck,
  Search,
  CheckCircle2,
  XCircle,
  RefreshCw,
  QrCode,
  Building,
  GraduationCap,
  Calendar,
  ShieldCheck,
  AlertCircle,
} from "lucide-react";

export default function WorkshopAttendance({ api }) {
  const [participants, setParticipants] = useState([]);
  const [workshops, setWorkshops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [workshopFilter, setWorkshopFilter] = useState("all");
  const [attendanceFilter, setAttendanceFilter] = useState("all");
  const [updatingId, setUpdatingId] = useState(null);
  const [statusMessage, setStatusMessage] = useState("");

  const fetchWorkshops = useCallback(async () => {
    try {
      const res = await api.get("/api/workshops?admin=1");
      setWorkshops(res.data.workshops || []);
    } catch (err) {
      console.error("Failed to load workshops", err);
    }
  }, [api]);

  const fetchConfirmedParticipants = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        status: "CONFIRMED",
        limit: "100",
      });
      if (workshopFilter !== "all") params.append("workshopId", workshopFilter);
      if (search.trim()) params.append("search", search.trim());

      const res = await api.get(`/api/workshops/applications?${params.toString()}`);
      setParticipants(res.data.applications || []);
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
    fetchConfirmedParticipants();
  }, [fetchConfirmedParticipants]);

  const handleToggleAttendance = async (participant) => {
    const nextAttended = !participant.attended;
    setUpdatingId(participant.id);
    setStatusMessage("");
    try {
      const res = await api.post(`/api/workshops/applications/${participant.id}/attendance`, {
        attended: nextAttended,
      });
      setStatusMessage(res.data.message || "Attendance updated.");
      setParticipants((prev) =>
        prev.map((p) =>
          p.id === participant.id
            ? {
                ...p,
                attended: nextAttended ? 1 : 0,
                attendedAt: nextAttended ? new Date().toISOString() : null,
              }
            : p
        )
      );
    } catch (err) {
      alert(err.response?.data?.error || "Failed to update attendance");
    } finally {
      setUpdatingId(null);
    }
  };

  const filteredParticipants = participants.filter((p) => {
    if (attendanceFilter === "attended") return Boolean(p.attended);
    if (attendanceFilter === "absent") return !p.attended;
    return true;
  });

  const totalConfirmed = participants.length;
  const attendedCount = participants.filter((p) => p.attended).length;
  const pendingCount = totalConfirmed - attendedCount;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
            Workshop Attendance & Check-in
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Track and mark attendance for confirmed workshop participants in New Delhi.
          </p>
        </div>
        <button
          onClick={fetchConfirmedParticipants}
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

      {/* Summary Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs">
          <span className="text-xs text-gray-500 font-semibold block uppercase">Confirmed Seats</span>
          <span className="text-2xl font-extrabold text-gray-900">{totalConfirmed}</span>
        </div>
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs">
          <span className="text-xs text-emerald-700 font-semibold block uppercase">Marked Present</span>
          <span className="text-2xl font-extrabold text-emerald-600">{attendedCount}</span>
        </div>
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs">
          <span className="text-xs text-amber-700 font-semibold block uppercase">Pending Check-in</span>
          <span className="text-2xl font-extrabold text-amber-600">{pendingCount}</span>
        </div>
      </div>

      {/* Filters */}
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
              value={attendanceFilter}
              onChange={(e) => setAttendanceFilter(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#173B8F] bg-gray-50/50"
            >
              <option value="all">All Attendance Status</option>
              <option value="attended">Present Only</option>
              <option value="absent">Pending Check-in Only</option>
            </select>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-50 border-b border-gray-200 text-gray-600 uppercase font-semibold">
              <tr>
                <th className="py-3.5 px-4">Registration ID</th>
                <th className="py-3.5 px-4">Participant Name</th>
                <th className="py-3.5 px-4">Workshop</th>
                <th className="py-3.5 px-4">Contact</th>
                <th className="py-3.5 px-4">Institution</th>
                <th className="py-3.5 px-4">Attendance Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-gray-500">
                    Loading workshop participants...
                  </td>
                </tr>
              ) : filteredParticipants.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-gray-500">
                    No confirmed participants found matching the criteria.
                  </td>
                </tr>
              ) : (
                filteredParticipants.map((p) => {
                  const isPresent = Boolean(p.attended);
                  return (
                    <tr key={p.id} className="hover:bg-blue-50/30 transition">
                      <td className="py-3.5 px-4 font-mono font-bold text-gray-900">
                        {p.workshopRegistrationId || "PENDING"}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="font-bold text-gray-900 block">{p.fullName}</span>
                        <span className="text-[10px] text-gray-500 block">{p.email}</span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="font-semibold text-gray-800 block">{p.workshopTitle}</span>
                        <span className="text-[10px] text-gray-500 block">New Delhi</span>
                      </td>
                      <td className="py-3.5 px-4 text-gray-700 font-mono">
                        {p.mobile}
                      </td>
                      <td className="py-3.5 px-4 text-gray-700">
                        <span className="block truncate max-w-[150px]">{p.institution}</span>
                        <span className="text-[10px] text-gray-400">{p.academicLevel}</span>
                      </td>
                      <td className="py-3.5 px-4">
                        {isPresent ? (
                          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Present</span>
                          </div>
                        ) : (
                          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-gray-100 text-gray-600">
                            <Clock className="w-3.5 h-3.5" />
                            <span>Pending</span>
                          </div>
                        )}
                        {p.attendedAt && (
                          <span className="block text-[10px] text-gray-400 mt-0.5">
                            {new Date(p.attendedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => handleToggleAttendance(p)}
                          disabled={updatingId === p.id}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition inline-flex items-center gap-1.5 ${
                            isPresent
                              ? "bg-red-50 text-red-700 hover:bg-red-100 border border-red-200"
                              : "bg-[#173B8F] text-white hover:bg-[#122e70] shadow-xs"
                          }`}
                        >
                          <UserCheck className="w-3.5 h-3.5" />
                          <span>{isPresent ? "Mark Absent" : "Mark Present"}</span>
                        </button>
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

function Clock(props) {
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
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  );
}
