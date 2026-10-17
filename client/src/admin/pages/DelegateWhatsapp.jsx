import { Mail, MessageCircle, Search, Send } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

const formatDateTime = (value) => (value ? new Date(value).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" }) : "");

const hasValidEmail = (d) => Boolean(d.email) && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(d.email);

const linkStatus = (d) => {
  if (!hasValidEmail(d)) return { label: "No email", color: "#6b7280", background: "#f3f4f6", detail: "No valid email address on file for this delegate." };
  const lastFailed = d.whatsappInviteLastError && (!d.whatsappInviteSentAt || new Date(d.whatsappInviteLastAttemptAt) > new Date(d.whatsappInviteSentAt));
  if (lastFailed) return { label: "Failed", color: "#b91c1c", background: "#fee2e2", detail: `Last attempt ${formatDateTime(d.whatsappInviteLastAttemptAt)} failed: ${d.whatsappInviteLastError}` };
  if (d.whatsappInviteSentAt) return { label: "Link sent", color: "#047857", background: "#d1fae5", detail: `Sent on ${formatDateTime(d.whatsappInviteSentAt)}${d.whatsappInviteSendCount > 1 ? ` · sent ${d.whatsappInviteSendCount} times` : ""}` };
  return { label: "Not sent", color: "#b45309", background: "#fef3c7", detail: "The WhatsApp group link has not been sent yet." };
};

// Delegates from the Delegate List (imported there from CSV) who haven't been given the WhatsApp group link yet.
function DelegateWhatsapp({ api, onNavigate }) {
  const [delegates, setDelegates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [bulk, setBulk] = useState(null);
  const [sendingId, setSendingId] = useState(null);
  const [query, setQuery] = useState("");
  const [showSent, setShowSent] = useState(false);
  const stopBulkRef = useRef(false);

  const load = useCallback(async () => {
    try {
      const response = await api.get("/api/delegates");
      setDelegates(response.data.delegates || []);
    } catch (err) {
      setError(err.response?.data?.message || "Could not load the delegate list.");
    } finally {
      setLoading(false);
    }
  }, [api]);

  useEffect(() => {
    load();
  }, [load]);

  const applyUpdate = (updated) => setDelegates((current) => current.map((d) => (d.id === updated.id ? updated : d)));

  const notSent = delegates.filter((d) => !d.whatsappInviteSentAt);
  const sendable = notSent.filter(hasValidEmail);
  const withoutEmail = notSent.length - sendable.length;
  const sentCount = delegates.length - notSent.length;

  // Sends one email at a time (with a short pause, to respect the mail provider's rate limit) so progress is visible and can be stopped.
  const sendAll = async () => {
    const queue = sendable;
    if (!queue.length) return;
    const skippedNote = withoutEmail ? `\n\n${withoutEmail} delegate(s) without an email address will be skipped.` : "";
    if (!window.confirm(`Send the WhatsApp group link to ${queue.length} delegate(s) who haven't received it yet?${skippedNote}`)) return;

    stopBulkRef.current = false;
    setError("");
    const progress = { running: true, total: queue.length, done: 0, sent: 0, failed: 0, skipped: 0, current: "", failures: [] };
    setBulk({ ...progress });
    for (const delegate of queue) {
      if (stopBulkRef.current) break;
      progress.current = delegate.fullName;
      setBulk({ ...progress });
      try {
        const response = await api.post(`/api/delegates/${delegate.id}/send-whatsapp-invite`, { onlyIfNotSent: true });
        applyUpdate(response.data.delegate);
        progress.sent += 1;
      } catch (err) {
        if (err.response?.data?.delegate) applyUpdate(err.response.data.delegate);
        if (err.response?.status === 409) {
          progress.skipped += 1;
        } else {
          progress.failed += 1;
          progress.failures.push(`${delegate.fullName}: ${err.response?.data?.message || "request failed"}`);
        }
      }
      progress.done += 1;
      setBulk({ ...progress });
      await new Promise((resolve) => setTimeout(resolve, 700));
    }
    progress.running = false;
    progress.stopped = stopBulkRef.current;
    progress.current = "";
    setBulk({ ...progress });
  };

  const sendOne = async (delegate) => {
    if (delegate.whatsappInviteSentAt && !window.confirm(`${delegate.fullName} was already sent the WhatsApp group link. Send it again?`)) return;
    setSendingId(delegate.id);
    setError("");
    try {
      const response = await api.post(`/api/delegates/${delegate.id}/send-whatsapp-invite`);
      applyUpdate(response.data.delegate);
    } catch (err) {
      if (err.response?.data?.delegate) applyUpdate(err.response.data.delegate);
      setError(err.response?.data?.message || `Could not send the WhatsApp group link to ${delegate.fullName}.`);
    } finally {
      setSendingId(null);
    }
  };

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return (showSent ? delegates : notSent).filter((d) =>
      !q || d.fullName.toLowerCase().includes(q) || (d.email || "").toLowerCase().includes(q) || (d.registrationId || "").toLowerCase().includes(q)
    );
  }, [delegates, notSent, query, showSent]);

  return (
    <div className="admin-speakers-page">
      <section className="admin-panel">
        <p className="admin-eyebrow">Delegates</p>
        <h1>WhatsApp Group</h1>
        <p className="admin-muted">
          Delegates from the Delegate List who haven't been sent the Delegate WhatsApp group link yet. New delegates appear here
          as soon as they are imported in the Delegate List.
        </p>
        <div style={{ display: "flex", gap: "0.6rem", flexWrap: "wrap", marginTop: "1rem" }}>
          <button
            className="admin-primary-button"
            type="button"
            onClick={sendAll}
            disabled={!sendable.length || bulk?.running || sendingId !== null}
            title={sendable.length ? `Email the ${sendable.length} delegate(s) who haven't had the link yet` : "Every delegate with an email address has already been sent the link"}
            style={{ background: "#25D366", borderColor: "#25D366" }}
          >
            <Send size={18} /> Send WhatsApp Link ({sendable.length})
          </button>
          <button className="admin-secondary-button" type="button" onClick={() => onNavigate?.("delegates")}>
            Delegate List
          </button>
        </div>
        <div style={{ display: "flex", gap: "1.25rem", fontSize: "0.9rem", marginTop: "0.75rem", flexWrap: "wrap" }}>
          <span><strong>{delegates.length}</strong> delegates</span>
          <span style={{ color: "#047857" }}><strong>{sentCount}</strong> link sent</span>
          <span style={{ color: "#b45309" }}><strong>{notSent.length}</strong> not sent</span>
          {withoutEmail > 0 && <span style={{ color: "#6b7280" }}><strong>{withoutEmail}</strong> without an email address</span>}
        </div>
      </section>

      {error && (
        <section className="admin-panel" style={{ borderColor: "#fecaca", background: "#fef2f2", color: "#b91c1c" }}>
          {error}
        </section>
      )}

      {bulk && (
        <section className="admin-panel" style={{ borderColor: bulk.failed ? "#fde68a" : "#bfdbfe", background: bulk.running ? "#eff6ff" : bulk.failed ? "#fffbeb" : "#f0fdf4" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "1rem", flexWrap: "wrap" }}>
            <strong>
              {bulk.running
                ? `Sending ${Math.min(bulk.done + 1, bulk.total)} of ${bulk.total}… ${bulk.current}`
                : bulk.stopped
                ? `Sending stopped after ${bulk.done} of ${bulk.total}`
                : `Sending complete — ${bulk.total} processed`}
            </strong>
            {bulk.running ? (
              <button className="admin-secondary-button" type="button" onClick={() => { stopBulkRef.current = true; }}>Stop</button>
            ) : (
              <button className="admin-secondary-button" type="button" onClick={() => setBulk(null)}>Dismiss</button>
            )}
          </div>
          <div style={{ height: "8px", background: "#e5e7eb", borderRadius: "999px", overflow: "hidden", margin: "0.6rem 0" }}>
            <div style={{ height: "100%", width: `${bulk.total ? (bulk.done / bulk.total) * 100 : 0}%`, background: "#25D366", transition: "width 0.2s" }} />
          </div>
          <div style={{ display: "flex", gap: "1.25rem", fontSize: "0.85rem", flexWrap: "wrap" }}>
            <span style={{ color: "#047857" }}><strong>{bulk.sent}</strong> sent</span>
            <span style={{ color: "#b91c1c" }}><strong>{bulk.failed}</strong> failed</span>
            {bulk.skipped > 0 && <span style={{ color: "#6b7280" }}><strong>{bulk.skipped}</strong> already sent (skipped)</span>}
          </div>
          {!bulk.running && bulk.failures.length > 0 && (
            <details style={{ marginTop: "0.5rem", fontSize: "0.85rem" }}>
              <summary>Show failures — press Send WhatsApp Link again to retry them</summary>
              <ul style={{ margin: "0.4rem 0 0 1rem" }}>{bulk.failures.map((f) => <li key={f}>{f}</li>)}</ul>
            </details>
          )}
        </section>
      )}

      <section className="admin-panel">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "1rem", flexWrap: "wrap", marginBottom: "0.75rem" }}>
          <h2 style={{ margin: 0, fontSize: "1.1rem", display: "flex", alignItems: "center", gap: "0.4rem" }}>
            <MessageCircle size={18} /> {showSent ? "All delegates" : "Not given the WhatsApp link yet"}
          </h2>
          <div style={{ display: "flex", gap: "0.75rem", alignItems: "center", flexWrap: "wrap" }}>
            <label style={{ display: "flex", alignItems: "center", gap: "0.35rem", fontSize: "0.85rem" }}>
              <input type="checkbox" checked={showSent} onChange={(e) => setShowSent(e.target.checked)} /> Show delegates already sent
            </label>
            <label style={{ display: "flex", alignItems: "center", gap: "0.4rem", border: "1px solid #d1d5db", borderRadius: "0.5rem", padding: "0.35rem 0.6rem" }}>
              <Search size={16} />
              <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search name, email or ID" style={{ border: 0, outline: "none", minWidth: "12rem" }} />
            </label>
          </div>
        </div>
        {loading ? (
          <p className="admin-muted">Loading…</p>
        ) : !visible.length ? (
          <p className="admin-muted">{showSent || query ? "No delegates match." : "Everyone on the Delegate List has been sent the WhatsApp group link."}</p>
        ) : (
          <div className="speaker-table-wrap">
            <table className="speaker-table">
              <thead><tr><th>Name</th><th>Registration ID</th><th>Email</th><th>Status</th><th>Action</th></tr></thead>
              <tbody>
                {visible.map((d) => {
                  const status = linkStatus(d);
                  return (
                    <tr key={d.id}>
                      <td><strong>{d.fullName}</strong></td>
                      <td>{d.registrationId}</td>
                      <td>{d.email || <em style={{ color: "#6b7280" }}>none</em>}</td>
                      <td>
                        <span title={status.detail} style={{ display: "inline-block", padding: "0.15rem 0.6rem", borderRadius: "999px", fontSize: "0.75rem", fontWeight: 700, color: status.color, background: status.background }}>
                          {status.label}
                        </span>
                      </td>
                      <td>
                        <div className="speaker-actions">
                          <button type="button" onClick={() => sendOne(d)} disabled={!hasValidEmail(d) || sendingId === d.id || bulk?.running}>
                            <Mail size={15} /> {sendingId === d.id ? "Sending..." : d.whatsappInviteSentAt ? "Resend" : "Send Link"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

export default DelegateWhatsapp;
