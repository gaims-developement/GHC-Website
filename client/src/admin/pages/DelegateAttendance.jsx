import { Check, RotateCcw, Search, Users } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import DelegateQrScanner from "../components/DelegateQrScanner";

const formatTime = (value) => (value ? new Date(value).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" }) : "");

function DelegateAttendance({ api, onNavigate }) {
  const [delegates, setDelegates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [savingId, setSavingId] = useState(null);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const response = await api.get("/api/delegates");
      setDelegates(response.data.delegates || []);
    } catch (err) {
      setError(err.response?.data?.message || "Unable to load delegates.");
    } finally {
      setLoading(false);
    }
  }, [api]);

  useEffect(() => {
    load();
  }, [load]);

  const presentCount = delegates.filter((d) => d.isPresent).length;

  const applyUpdate = useCallback((updated) => {
    setDelegates((current) => current.map((d) => (d.id === updated.id ? updated : d)));
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return delegates.filter((d) => {
      if (filter === "present" && !d.isPresent) return false;
      if (filter === "absent" && d.isPresent) return false;
      if (!q) return true;
      return [d.registrationId, d.fullName, d.email, d.phone].join(" ").toLowerCase().includes(q);
    });
  }, [delegates, search, filter]);

  const mark = async (delegate, present) => {
    if (!present && !window.confirm(`Remove attendance for ${delegate.fullName}?`)) return;
    setSavingId(delegate.id);
    setError("");
    try {
      const response = await api.patch(`/api/delegates/${delegate.id}/attendance`, { present });
      applyUpdate(response.data.delegate);
    } catch (err) {
      setError(err.response?.data?.message || `Could not update attendance for ${delegate.fullName}. Please try again.`);
    } finally {
      setSavingId(null);
    }
  };

  return (
    <div className="admin-speakers-page">
      <section className="admin-panel">
        <p className="admin-eyebrow">Delegates</p>
        <h1>Attendance</h1>
        <p className="admin-muted">Scan the QR code from a delegate's confirmation email, or search for them and tap the tick to mark them present.</p>
        <div style={{ display: "flex", gap: "1.5rem", flexWrap: "wrap", alignItems: "center", marginTop: "0.75rem", fontSize: "0.95rem" }}>
          <span style={{ color: "#059669" }}><strong>{presentCount}</strong> present</span>
          <span style={{ color: "#6b7280" }}><strong>{delegates.length - presentCount}</strong> remaining</span>
          <span><strong>{delegates.length}</strong> total</span>
          <button className="admin-secondary-button" type="button" onClick={() => onNavigate?.("delegates")} style={{ marginLeft: "auto" }}>
            <Users size={16} /> Delegate List
          </button>
        </div>
      </section>

      {error && (
        <section className="admin-panel" style={{ borderColor: "#fecaca", background: "#fef2f2", color: "#b91c1c" }}>{error}</section>
      )}

      <DelegateQrScanner api={api} onCheckedIn={applyUpdate} />

      <section className="admin-panel">
        <div style={{ display: "flex", gap: "0.6rem", flexWrap: "wrap", marginBottom: "1rem" }}>
          <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", border: "1px solid #d1d5db", borderRadius: "0.6rem", padding: "0.6rem 0.75rem", flex: "1 1 260px" }}>
            <Search size={18} color="#6b7280" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, registration ID, email or phone"
              style={{ border: "none", outline: "none", flex: 1, fontSize: "1rem", minWidth: 0 }}
            />
          </label>
          <div style={{ display: "flex", gap: "0.4rem" }}>
            {[["all", "All"], ["absent", "Not marked"], ["present", "Present"]].map(([id, label]) => (
              <button
                key={id}
                type="button"
                className={filter === id ? "admin-primary-button" : "admin-secondary-button"}
                onClick={() => setFilter(id)}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <div style={{ display: "grid", gap: "0.5rem" }}>
          {filtered.map((d) => (
            <div
              key={d.id}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.75rem",
                padding: "0.75rem 1rem",
                border: `1px solid ${d.isPresent ? "#bbf7d0" : "#e5e7eb"}`,
                background: d.isPresent ? "#f0fdf4" : "#ffffff",
                borderRadius: "0.75rem",
              }}
            >
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 700, color: "#111827", overflowWrap: "anywhere" }}>{d.fullName}</div>
                <div style={{ fontSize: "0.8rem", color: "#6b7280", overflowWrap: "anywhere" }}>
                  {d.registrationId}{d.phone ? ` · ${d.phone}` : ""}
                </div>
                {d.isPresent && <div style={{ fontSize: "0.75rem", color: "#059669", marginTop: "0.15rem" }}>Marked present {formatTime(d.attendedAt)}</div>}
              </div>
              {d.isPresent ? (
                <button
                  type="button"
                  className="admin-secondary-button"
                  title="Undo attendance"
                  aria-label={`Undo attendance for ${d.fullName}`}
                  disabled={savingId === d.id}
                  onClick={() => mark(d, false)}
                >
                  <RotateCcw size={16} /> Undo
                </button>
              ) : (
                <button
                  type="button"
                  title="Mark present"
                  aria-label={`Mark ${d.fullName} present`}
                  disabled={savingId === d.id}
                  onClick={() => mark(d, true)}
                  style={{
                    width: "48px",
                    height: "48px",
                    flexShrink: 0,
                    borderRadius: "999px",
                    border: "2px solid #059669",
                    background: savingId === d.id ? "#d1fae5" : "#ffffff",
                    color: "#059669",
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: "pointer",
                  }}
                >
                  <Check size={24} strokeWidth={3} />
                </button>
              )}
            </div>
          ))}
        </div>
        {!loading && !filtered.length && (
          <div className="admin-empty-state"><Users size={18} /> {delegates.length ? "No delegates match" : "No delegates yet — import them from the Delegate List"}</div>
        )}
      </section>
    </div>
  );
}

export default DelegateAttendance;
