import { BadgeCheck, Camera, ClipboardCheck, History, QrCode, Search, ShieldCheck, TicketCheck } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

function Checkin({ api }) {
  const [stats, setStats] = useState({ total: 0, checkedIn: 0, pendingArrivals: 0 });
  const [logs, setLogs] = useState([]);
  const [scanValue, setScanValue] = useState("");
  const [result, setResult] = useState(null);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(() => {
    api.get("/api/checkin").then((response) => {
      setStats(response.data.stats || { total: 0, checkedIn: 0, pendingArrivals: 0 });
      setLogs(response.data.logs || []);
    }).catch(() => {});
  }, [api]);

  useEffect(() => {
    load();
  }, [load]);

  const scan = async () => {
    if (!scanValue.trim()) return;
    setBusy(true);
    setMessage("");
    try {
      const response = await api.post("/api/checkin/scan", { qrData: scanValue.trim() });
      setResult(response.data);
      setScanValue("");
      load();
    } catch (error) {
      setMessage(error.response?.data?.message || "Scan failed");
      setResult(error.response?.data || null);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="admin-speakers-page checkin-page">
      <section className="checkin-scanner-panel">
        <div className="scanner-frame">
          <Camera size={42} />
          <span />
          <p>QR scanner ready</p>
        </div>
        <label className="scanner-input">
          <Search size={18} />
          <input value={scanValue} onChange={(event) => setScanValue(event.target.value)} placeholder="Paste or scan registration QR" onKeyDown={(event) => event.key === "Enter" && scan()} />
        </label>
        {message && <p className="checkout-error">{message}</p>}
      </section>

      <section className="ops-kpi-grid checkin-stats">
        <article><TicketCheck size={20} /><strong>{stats.checkedIn}</strong><span>Checked in</span></article>
        <article><QrCode size={20} /><strong>{stats.pendingArrivals}</strong><span>Pending arrivals</span></article>
        <article><ClipboardCheck size={20} /><strong>{stats.total}</strong><span>Total registrations</span></article>
      </section>

      {result?.registration && (
        <section className="admin-panel checkin-result-card">
          <p className="admin-eyebrow">Validated Registration</p>
          <div className="checkin-profile">
            <span><BadgeCheck size={24} /></span>
            <div>
              <h1>{result.registration.fullName}</h1>
              <p>{result.registration.registrationId} · {result.registration.ticketName}</p>
            </div>
          </div>
          <div className="checkin-status-grid">
            <span className={`status-pill ${result.registration.paymentStatus}`}>{result.registration.paymentStatus}</span>
            <span className={`status-pill ${result.registration.registrationStatus}`}>{result.registration.registrationStatus}</span>
            <span className="status-pill accepted">{result.workshopAccess ? "Workshop access" : "No workshop access"}</span>
          </div>
          <div className="checkin-history-list">
            {(result.history || []).map((item) => (
              <div key={item.id}><History size={16} /> {item.checkinTime} {item.workshopTitle ? `· ${item.workshopTitle}` : ""}</div>
            ))}
          </div>
        </section>
      )}

      <section className="payment-card-grid">
        {logs.map((log) => (
          <article className="payment-card" key={log.id}>
            <div>
              <span className="status-pill paid">checked in</span>
              <strong>{log.fullName}</strong>
              <p>{log.registrationCode}</p>
            </div>
            <dl>
              <div><dt>Ticket</dt><dd>{log.ticketName}</dd></div>
              <div><dt>Check-in</dt><dd>{log.checkinTime}</dd></div>
              <div><dt>Workshop</dt><dd>{log.workshopTitle || "Main conference"}</dd></div>
            </dl>
          </article>
        ))}
      </section>

      <nav className="volunteer-action-bar">
        <button onClick={scan} disabled={busy}><ShieldCheck size={18} /> Scan</button>
        <button onClick={load}><History size={18} /> Logs</button>
      </nav>
    </div>
  );
}

export default Checkin;
