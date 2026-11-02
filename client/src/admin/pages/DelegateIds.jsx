import { Check, Download, Eye, Search, Send, X } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import PhoneCell from "../components/PhoneCell";

const STATUS_STYLES = {
  none: { label: "Not submitted", color: "#b45309", background: "#fef3c7" },
  pending: { label: "To review", color: "#1d4ed8", background: "#dbeafe" },
  verified: { label: "Verified", color: "#047857", background: "#d1fae5" },
  rejected: { label: "Rejected", color: "#b91c1c", background: "#fee2e2" },
};
const FILTERS = [["all", "All"], ["none", "Not submitted"], ["pending", "To review"], ["verified", "Verified"], ["rejected", "Rejected"]];
const statusOf = (delegate) => delegate.submission?.status || "none";
const formatDateTime = (value) => (value ? new Date(value).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" }) : "");

function DelegateIds({ api }) {
  const [delegates, setDelegates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [busyId, setBusyId] = useState(null);
  const [bulk, setBulk] = useState(null);
  const [viewing, setViewing] = useState(null);
  const stopBulkRef = useRef(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const response = await api.get("/api/delegates/ids");
      setDelegates(response.data.delegates || []);
    } catch (err) {
      setError(err.response?.data?.message || "Unable to load delegate IDs.");
    } finally {
      setLoading(false);
    }
  }, [api]);

  useEffect(() => {
    load();
  }, [load]);

  const applyUpdate = useCallback((updated) => {
    setDelegates((current) => current.map((d) => (d.id === updated.id ? updated : d)));
  }, []);

  const closeViewer = useCallback(() => {
    setViewing((current) => {
      if (current?.url) URL.revokeObjectURL(current.url);
      return null;
    });
  }, []);

  useEffect(() => closeViewer, [closeViewer]);

  const counts = useMemo(() => delegates.reduce((all, d) => ({ ...all, [statusOf(d)]: (all[statusOf(d)] || 0) + 1 }), {}), [delegates]);
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return delegates.filter((d) => {
      if (filter !== "all" && statusOf(d) !== filter) return false;
      return !q || [d.registrationId, d.fullName, d.email, d.phone, d.submission?.nameOnId].join(" ").toLowerCase().includes(q);
    });
  }, [delegates, search, filter]);
  const unsent = delegates.filter((d) => !d.requestSentAt && !d.submission && d.email);

  // One email at a time with a short pause, the same as the reminder emails.
  const sendAll = async () => {
    if (!unsent.length || !window.confirm(`Send the photo ID request to ${unsent.length} delegate(s) who haven't received it yet?`)) return;
    stopBulkRef.current = false;
    setError("");
    const progress = { running: true, total: unsent.length, done: 0, sent: 0, failed: 0, failures: [] };
    setBulk({ ...progress });
    for (const delegate of unsent) {
      if (stopBulkRef.current) break;
      try {
        const response = await api.post(`/api/delegates/${delegate.id}/send-id-request`, { onlyIfNotSent: true });
        applyUpdate(response.data.delegate);
        progress.sent += 1;
      } catch (err) {
        if (err.response?.data?.delegate) applyUpdate(err.response.data.delegate);
        if (err.response?.status !== 409) {
          progress.failed += 1;
          progress.failures.push(`${delegate.fullName}: ${err.response?.data?.message || "request failed"}`);
        }
      }
      progress.done += 1;
      setBulk({ ...progress });
      await new Promise((resolve) => setTimeout(resolve, 700));
    }
    setBulk({ ...progress, running: false });
  };

  const sendOne = async (delegate) => {
    if (delegate.requestSentAt && !window.confirm(`${delegate.fullName} was already sent this email. Send it again?`)) return;
    setBusyId(delegate.id);
    setError("");
    try {
      const response = await api.post(`/api/delegates/${delegate.id}/send-id-request`);
      applyUpdate(response.data.delegate);
    } catch (err) {
      if (err.response?.data?.delegate) applyUpdate(err.response.data.delegate);
      setError(err.response?.data?.message || `Could not email ${delegate.fullName}.`);
    } finally {
      setBusyId(null);
    }
  };

  const sendCollegeIdUpdate = async (delegate) => {
    const again = delegate.collegeIdUpdateSentAt ? ` They were already asked on ${formatDateTime(delegate.collegeIdUpdateSentAt)}.` : "";
    if (!window.confirm(`Email ${delegate.fullName} asking them to upload their College ID?${again}`)) return;
    setBusyId(delegate.id);
    setError("");
    try {
      const response = await api.post(`/api/delegates/${delegate.id}/send-id-request`, { collegeIdUpdate: true });
      applyUpdate(response.data.delegate);
    } catch (err) {
      if (err.response?.data?.delegate) applyUpdate(err.response.data.delegate);
      setError(err.response?.data?.message || `Could not email ${delegate.fullName}.`);
    } finally {
      setBusyId(null);
    }
  };

  const view = async (delegate) => {
    setBusyId(delegate.id);
    setError("");
    try {
      const response = await api.get(`/api/delegates/${delegate.id}/id-document`, { responseType: "blob" });
      closeViewer();
      setViewing({ delegateId: delegate.id, url: URL.createObjectURL(response.data) });
    } catch {
      setError(`The ID for ${delegate.fullName} could not be loaded.`);
    } finally {
      setBusyId(null);
    }
  };

  const review = async (delegate, status) => {
    const reason = status === "rejected" ? window.prompt(`Why is this ID being rejected? ${delegate.fullName} will see this on their form.`) : "";
    if (status === "rejected" && !reason?.trim()) return;
    setBusyId(delegate.id);
    setError("");
    try {
      const response = await api.patch(`/api/delegates/${delegate.id}/id-status`, { status, reason });
      applyUpdate(response.data.delegate);
      closeViewer();
    } catch (err) {
      setError(err.response?.data?.message || "Could not save this review.");
    } finally {
      setBusyId(null);
    }
  };

  const exportList = async () => {
    setError("");
    try {
      const response = await api.get("/api/delegates/ids/export", { responseType: "blob" });
      const url = URL.createObjectURL(response.data);
      const link = document.createElement("a");
      link.href = url;
      link.download = "GHC_Venue_ID_List.docx";
      link.click();
      URL.revokeObjectURL(url);
    } catch {
      setError("The venue list could not be downloaded.");
    }
  };

  const viewingDelegate = delegates.find((d) => d.id === viewing?.delegateId);

  return (
    <div className="admin-speakers-page">
      <section className="admin-panel">
        <p className="admin-eyebrow">Delegates</p>
        <h1>Photo IDs</h1>
        <p className="admin-muted">Email each delegate their private ID form, review what they submit, and download the list for the venue. Every view and download is logged.</p>
        <div style={{ display: "flex", gap: "1.25rem", flexWrap: "wrap", alignItems: "center", marginTop: "0.75rem", fontSize: "0.95rem" }}>
          {FILTERS.slice(1).map(([id, label]) => <span key={id} style={{ color: STATUS_STYLES[id].color }}><strong>{counts[id] || 0}</strong> {label.toLowerCase()}</span>)}
        </div>
        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", marginTop: "0.9rem" }}>
          <button className="admin-primary-button" type="button" disabled={!unsent.length || bulk?.running} onClick={sendAll}><Send size={16} /> Email All Not Sent ({unsent.length})</button>
          <button className="admin-secondary-button" type="button" onClick={exportList}><Download size={16} /> Download Venue List</button>
          {bulk?.running && <button className="admin-secondary-button" type="button" onClick={() => { stopBulkRef.current = true; }}>Stop</button>}
        </div>
      </section>

      {error && <section className="admin-panel" style={{ borderColor: "#fecaca", background: "#fef2f2", color: "#b91c1c" }}>{error}</section>}

      {bulk && (
        <section className="admin-panel" role="status">
          {bulk.running ? `Sending ${bulk.done} of ${bulk.total}…` : `Finished: ${bulk.sent} sent, ${bulk.failed} failed`}
          {!bulk.running && bulk.failures.length > 0 && <ul style={{ margin: "0.4rem 0 0 1rem" }}>{bulk.failures.map((f) => <li key={f}>{f}</li>)}</ul>}
        </section>
      )}

      {viewing && viewingDelegate && (
        <section className="admin-panel">
          <h2 style={{ margin: "0 0 0.4rem", fontSize: "1.1rem" }}>{viewingDelegate.fullName}</h2>
          <p className="admin-muted" style={{ margin: "0 0 0.75rem" }}>
            Name on ID: <strong>{viewingDelegate.submission?.nameOnId}</strong> · {viewingDelegate.submission?.idTypeLabel} ending {viewingDelegate.submission?.numberLast4}
          </p>
          <img src={viewing.url} alt={`Photo ID submitted by ${viewingDelegate.fullName}`} style={{ display: "block", width: "100%", maxWidth: "620px", maxHeight: "70vh", objectFit: "contain", borderRadius: "0.75rem", border: "1px solid #e5e7eb", marginBottom: "0.75rem" }} />
          <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
            <button className="admin-primary-button" type="button" disabled={busyId !== null} onClick={() => review(viewingDelegate, "verified")}><Check size={16} /> Verify</button>
            <button className="admin-secondary-button" type="button" disabled={busyId !== null} onClick={() => review(viewingDelegate, "rejected")}><X size={16} /> Reject</button>
            <button className="admin-secondary-button" type="button" onClick={closeViewer}>Close</button>
          </div>
        </section>
      )}

      <section className="admin-panel">
        <div style={{ display: "flex", gap: "0.6rem", flexWrap: "wrap", marginBottom: "1rem" }}>
          <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", border: "1px solid #d1d5db", borderRadius: "0.6rem", padding: "0.6rem 0.75rem", flex: "1 1 260px" }}>
            <Search size={18} color="#6b7280" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by name, registration ID, email or phone" aria-label="Search delegates" style={{ border: "none", outline: "none", flex: 1, fontSize: "1rem", minWidth: 0 }} />
          </label>
          <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap" }}>
            {FILTERS.map(([id, label]) => (
              <button key={id} type="button" className={filter === id ? "admin-primary-button" : "admin-secondary-button"} onClick={() => setFilter(id)}>{label}</button>
            ))}
          </div>
        </div>

        <div style={{ display: "grid", gap: "0.5rem" }}>
          {filtered.map((d) => {
            const style = STATUS_STYLES[statusOf(d)];
            return (
              <div key={d.id} style={{ display: "flex", alignItems: "center", gap: "0.75rem", flexWrap: "wrap", padding: "0.75rem 1rem", border: "1px solid #e5e7eb", borderRadius: "0.75rem", background: "#ffffff" }}>
                <div style={{ flex: "1 1 240px", minWidth: 0 }}>
                  <div style={{ fontWeight: 700, color: "#111827", overflowWrap: "anywhere" }}>{d.fullName}</div>
                  <div style={{ fontSize: "0.8rem", color: "#6b7280", overflowWrap: "anywhere" }}>
                    {d.registrationId} · {d.email || "No email"} · <PhoneCell phone={d.submission?.phone || d.phone} />
                  </div>
                  <div style={{ fontSize: "0.75rem", color: d.requestLastError ? "#b91c1c" : "#6b7280", marginTop: "0.15rem" }}>
                    {d.submission
                      ? `${d.submission.idTypeLabel} ending ${d.submission.numberLast4} · submitted ${formatDateTime(d.submission.submittedAt)}${d.submission.rejectionReason ? ` · rejected: ${d.submission.rejectionReason}` : ""}`
                      : d.requestLastError
                      ? `Email failed: ${d.requestLastError}`
                      : d.requestSentAt
                      ? `Emailed ${formatDateTime(d.requestSentAt)}`
                      : "Not emailed yet"}
                  </div>
                  {d.collegeIdUpdateSentAt && <div style={{ fontSize: "0.75rem", color: "#6b7280", marginTop: "0.15rem" }}>Asked for College ID {formatDateTime(d.collegeIdUpdateSentAt)}</div>}
                </div>
                <span style={{ padding: "0.2rem 0.6rem", borderRadius: "999px", fontSize: "0.75rem", fontWeight: 700, color: style.color, background: style.background }}>{style.label}</span>
                {d.submission && <button className="admin-secondary-button" type="button" disabled={busyId === d.id} onClick={() => view(d)}><Eye size={16} /> View</button>}
                {d.submission && !(statusOf(d) === "verified" && d.submission.idType === "college_id") && <button className="admin-secondary-button" type="button" disabled={busyId === d.id || !d.email} onClick={() => sendCollegeIdUpdate(d)}><Send size={16} /> Ask for College ID</button>}
                {!["verified", "pending"].includes(statusOf(d)) && <button className="admin-secondary-button" type="button" disabled={busyId === d.id || !d.email} onClick={() => sendOne(d)}><Send size={16} /> {d.requestSentAt ? "Resend" : "Email"}</button>}
              </div>
            );
          })}
        </div>
        {!loading && !filtered.length && <div className="admin-empty-state">No delegates match</div>}
      </section>
    </div>
  );
}

export default DelegateIds;
