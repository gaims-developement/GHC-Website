import { Download, FileUp, Mail, Search, Send, UserCheck, Users } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { parseCsv } from "../utils/csv";

const IMPORT_CHUNK_SIZE = 500;

const HEADER_ALIASES = {
  fullName: ["name", "full name", "fullname", "delegate name", "delegate", "participant name", "participant", "candidate name"],
  firstName: ["first name", "firstname", "given name"],
  lastName: ["last name", "lastname", "surname", "family name"],
  email: ["email", "email address", "email id", "e mail", "mail"],
  phone: ["phone", "phone number", "mobile", "mobile number", "contact", "contact number", "whatsapp", "whatsapp number"],
  city: ["city", "location", "town"],
};

const normalizeHeader = (header) => header.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();

const mapRows = (table) => {
  const [headerRow, ...dataRows] = table;
  const headers = (headerRow || []).map(normalizeHeader);
  const columnOf = (field) => headers.findIndex((h) => HEADER_ALIASES[field].includes(h));
  const columns = Object.fromEntries(Object.keys(HEADER_ALIASES).map((field) => [field, columnOf(field)]));

  if (columns.fullName < 0 && columns.firstName < 0) {
    throw new Error('Could not find a name column. Add a header such as "Name" or "Full Name" (or "First Name" and "Last Name").');
  }

  const cell = (row, field) => (columns[field] >= 0 ? (row[columns[field]] || "").trim() : "");
  return dataRows.map((row) => ({
    fullName: cell(row, "fullName") || [cell(row, "firstName"), cell(row, "lastName")].filter(Boolean).join(" "),
    email: cell(row, "email"),
    phone: cell(row, "phone"),
    city: cell(row, "city"),
  }));
};

// Quote every cell and neutralise spreadsheet formulas (CSV injection).
const csvCell = (value) => {
  let text = value === null || value === undefined ? "" : String(value);
  if (/^[=+\-@]/.test(text)) text = `'${text}`;
  return `"${text.replace(/"/g, '""')}"`;
};

const formatDateTime = (value) => (value ? new Date(value).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" }) : "");

function Delegates({ api, onNavigate }) {
  const [delegates, setDelegates] = useState([]);
  const [stats, setStats] = useState({ total: 0, present: 0, absent: 0 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [pending, setPending] = useState(null);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [sendingId, setSendingId] = useState(null);
  const [notice, setNotice] = useState("");
  const [bulk, setBulk] = useState(null);
  const [openStatusId, setOpenStatusId] = useState(null);
  const stopBulkRef = useRef(false);
  const fileInput = useRef(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const response = await api.get("/api/delegates");
      setDelegates(response.data.delegates || []);
      setStats(response.data.stats || { total: 0, present: 0, absent: 0 });
    } catch (err) {
      setError(err.response?.data?.message || "Unable to load delegates.");
    } finally {
      setLoading(false);
    }
  }, [api]);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return delegates;
    return delegates.filter((d) =>
      [d.registrationId, d.fullName, d.email, d.phone, d.city].join(" ").toLowerCase().includes(q)
    );
  }, [delegates, search]);

  const handleFile = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    setError("");
    setResult(null);
    if (!file) return;
    try {
      const rows = mapRows(parseCsv(await file.text()));
      if (!rows.length) throw new Error("The CSV file has no delegate rows.");
      setPending({ fileName: file.name, rows });
    } catch (err) {
      setPending(null);
      setError(err.message || "Unable to read the CSV file.");
    }
  };

  const runImport = async () => {
    if (!pending) return;
    setImporting(true);
    setError("");
    const summary = { added: 0, skippedExisting: [], skippedDuplicateInFile: [], invalidRows: [] };
    try {
      for (let start = 0; start < pending.rows.length; start += IMPORT_CHUNK_SIZE) {
        const chunk = pending.rows.slice(start, start + IMPORT_CHUNK_SIZE);
        const response = await api.post("/api/delegates/import", { rows: chunk });
        const data = response.data || {};
        summary.added += data.added || 0;
        summary.skippedExisting.push(...(data.skippedExisting || []));
        summary.skippedDuplicateInFile.push(...(data.skippedDuplicateInFile || []));
        // Server row numbers are 1-based within the chunk; +1 more for the CSV header line.
        summary.invalidRows.push(...(data.invalidRows || []).map((n) => n + start + 1));
      }
      setResult(summary);
      setPending(null);
    } catch (err) {
      setError(`${err.response?.data?.message || "Import failed."} ${summary.added ? `${summary.added} delegate(s) were added before the error.` : ""}`);
    } finally {
      setImporting(false);
      load();
    }
  };

  const sendConfirmation = async (delegate) => {
    if (delegate.confirmationSentAt && !window.confirm(`A confirmation email was already sent to ${delegate.fullName} on ${formatDateTime(delegate.confirmationSentAt)}. Send it again?`)) return;
    setSendingId(delegate.id);
    setError("");
    setNotice("");
    try {
      const response = await api.post(`/api/delegates/${delegate.id}/send-confirmation`);
      applyUpdate(response.data.delegate);
      setNotice(`Registration confirmation email sent to ${response.data.recipient}.`);
    } catch (err) {
      if (err.response?.data?.delegate) applyUpdate(err.response.data.delegate);
      setError(err.response?.data?.message || `Could not send the confirmation email to ${delegate.fullName}.`);
    } finally {
      setSendingId(null);
    }
  };

  const applyUpdate = (updated) => setDelegates((current) => current.map((d) => (d.id === updated.id ? updated : d)));

  const unsent = delegates.filter((d) => d.email && !d.confirmationSentAt);
  const withoutEmail = delegates.filter((d) => !d.email).length;

  // Sends one email at a time (with a short pause, to respect the mail provider's rate limit) so progress is visible and can be stopped.
  const bulkSend = async () => {
    const queue = unsent;
    if (!queue.length) return;
    const skippedNote = withoutEmail ? `\n\n${withoutEmail} delegate(s) without an email address will be skipped.` : "";
    if (!window.confirm(`Send the registration confirmation email to ${queue.length} delegate(s) who haven't been emailed yet?${skippedNote}`)) return;

    stopBulkRef.current = false;
    setError("");
    setNotice("");
    const progress = { running: true, total: queue.length, done: 0, sent: 0, failed: 0, skipped: 0, current: "", failures: [] };
    setBulk({ ...progress });
    for (const delegate of queue) {
      if (stopBulkRef.current) break;
      progress.current = delegate.fullName;
      setBulk({ ...progress });
      try {
        const response = await api.post(`/api/delegates/${delegate.id}/send-confirmation`, { onlyIfNotSent: true });
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

  const mailStatus = (d) => {
    if (!d.email) return { label: "No email", color: "#6b7280", background: "#f3f4f6", detail: "No email address on file for this delegate." };
    const lastFailed = d.confirmationLastError && (!d.confirmationSentAt || new Date(d.confirmationLastAttemptAt) > new Date(d.confirmationSentAt));
    if (lastFailed) {
      return { label: "Failed", color: "#b91c1c", background: "#fee2e2", detail: `Last attempt ${formatDateTime(d.confirmationLastAttemptAt)} failed: ${d.confirmationLastError}${d.confirmationSentAt ? ` (previously sent ${formatDateTime(d.confirmationSentAt)})` : ""}` };
    }
    if (d.confirmationSentAt) {
      return { label: "Sent", color: "#047857", background: "#d1fae5", detail: `Sent to ${d.email} on ${formatDateTime(d.confirmationSentAt)}${d.confirmationSendCount > 1 ? ` · sent ${d.confirmationSendCount} times` : ""}` };
    }
    return { label: "Not sent", color: "#b45309", background: "#fef3c7", detail: `Confirmation email has not been sent to ${d.email} yet.` };
  };

  const exportCsv = () => {
    const header = ["Registration ID", "Name", "Email", "Phone", "City", "Confirmation Email Sent", "Attendance", "Attended At"];
    const lines = delegates.map((d) =>
      [d.registrationId, d.fullName, d.email, d.phone, d.city, formatDateTime(d.confirmationSentAt), d.isPresent ? "Present" : "Absent", formatDateTime(d.attendedAt)]
        .map(csvCell)
        .join(",")
    );
    const blob = new Blob([`﻿${[header.map(csvCell).join(","), ...lines].join("\r\n")}`], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `ghc-delegates-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="admin-speakers-page">
      <section className="admin-panel">
        <p className="admin-eyebrow">Delegates</p>
        <h1>Delegate List</h1>
        <p className="admin-muted">
          Import delegates from a CSV file. Names already in the list are skipped, and every new delegate gets a unique registration ID.
        </p>
        <div style={{ display: "flex", gap: "0.6rem", flexWrap: "wrap", marginTop: "1rem" }}>
          <input ref={fileInput} type="file" accept=".csv,text/csv" onChange={handleFile} style={{ display: "none" }} />
          <button className="admin-primary-button" type="button" onClick={() => fileInput.current?.click()} disabled={importing}>
            <FileUp size={18} /> Import CSV
          </button>
          <button className="admin-secondary-button" type="button" onClick={exportCsv} disabled={!delegates.length}>
            <Download size={18} /> Export CSV
          </button>
          <button className="admin-secondary-button" type="button" onClick={() => onNavigate?.("delegate-attendance")}>
            <UserCheck size={18} /> Attendance
          </button>
          <button
            className="admin-primary-button"
            type="button"
            onClick={bulkSend}
            disabled={!unsent.length || bulk?.running || sendingId !== null}
            title={unsent.length ? `Email the ${unsent.length} delegate(s) who haven't been sent the confirmation yet` : "Everyone with an email address has already been sent the confirmation"}
          >
            <Send size={18} /> Bulk Send ({unsent.length})
          </button>
        </div>
        <p className="admin-muted" style={{ fontSize: "0.8rem", marginTop: "0.75rem" }}>
          CSV columns: <strong>Name</strong> (required, or First Name + Last Name), and optionally Email, Phone, City.
        </p>
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
                ? `Bulk send stopped after ${bulk.done} of ${bulk.total}`
                : `Bulk send complete — ${bulk.total} processed`}
            </strong>
            {bulk.running ? (
              <button className="admin-secondary-button" type="button" onClick={() => { stopBulkRef.current = true; }}>Stop</button>
            ) : (
              <button className="admin-secondary-button" type="button" onClick={() => setBulk(null)}>Dismiss</button>
            )}
          </div>
          <div style={{ height: "8px", background: "#e5e7eb", borderRadius: "999px", overflow: "hidden", margin: "0.6rem 0" }}>
            <div style={{ height: "100%", width: `${bulk.total ? (bulk.done / bulk.total) * 100 : 0}%`, background: "#173B8F", transition: "width 0.2s" }} />
          </div>
          <div style={{ display: "flex", gap: "1.25rem", fontSize: "0.85rem", flexWrap: "wrap" }}>
            <span style={{ color: "#047857" }}><strong>{bulk.sent}</strong> sent</span>
            <span style={{ color: "#b91c1c" }}><strong>{bulk.failed}</strong> failed</span>
            {bulk.skipped > 0 && <span style={{ color: "#6b7280" }}><strong>{bulk.skipped}</strong> already sent (skipped)</span>}
          </div>
          {!bulk.running && bulk.failures.length > 0 && (
            <details style={{ marginTop: "0.5rem", fontSize: "0.85rem" }}>
              <summary>Show failures — you can run Bulk Send again to retry them</summary>
              <ul style={{ margin: "0.4rem 0 0 1rem" }}>{bulk.failures.map((f) => <li key={f}>{f}</li>)}</ul>
            </details>
          )}
        </section>
      )}

      {notice && (
        <section className="admin-panel" style={{ borderColor: "#bbf7d0", background: "#f0fdf4", color: "#166534", display: "flex", justifyContent: "space-between", gap: "1rem", alignItems: "center" }}>
          <span>{notice}</span>
          <button className="admin-secondary-button" type="button" onClick={() => setNotice("")}>Dismiss</button>
        </section>
      )}

      {pending && (
        <section className="admin-panel">
          <h2 style={{ marginTop: 0, fontSize: "1.1rem" }}>Ready to import</h2>
          <p className="admin-muted">
            <strong>{pending.fileName}</strong> — {pending.rows.length} row(s) found. Preview of the first rows:
          </p>
          <div className="speaker-table-wrap">
            <table className="speaker-table">
              <thead><tr><th>Name</th><th>Email</th><th>Phone</th><th>City</th></tr></thead>
              <tbody>
                {pending.rows.slice(0, 5).map((row, index) => (
                  <tr key={index}>
                    <td><strong>{row.fullName || <em style={{ color: "#dc2626" }}>missing</em>}</strong></td>
                    <td>{row.email}</td><td>{row.phone}</td><td>{row.city}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div style={{ display: "flex", gap: "0.6rem", marginTop: "1rem" }}>
            <button className="admin-primary-button" type="button" onClick={runImport} disabled={importing}>
              {importing ? "Importing..." : `Import ${pending.rows.length} row(s)`}
            </button>
            <button className="admin-secondary-button" type="button" onClick={() => setPending(null)} disabled={importing}>Cancel</button>
          </div>
        </section>
      )}

      {result && (
        <section className="admin-panel" style={{ borderColor: "#bbf7d0", background: "#f0fdf4" }}>
          <h2 style={{ marginTop: 0, fontSize: "1.1rem", color: "#166534" }}>Import complete — {result.added} new delegate(s) added</h2>
          {result.skippedExisting.length > 0 && (
            <details style={{ marginTop: "0.5rem" }}>
              <summary>{result.skippedExisting.length} skipped — name already in the list</summary>
              <p className="admin-muted" style={{ fontSize: "0.85rem" }}>{result.skippedExisting.join(", ")}</p>
            </details>
          )}
          {result.skippedDuplicateInFile.length > 0 && (
            <details style={{ marginTop: "0.5rem" }}>
              <summary>{result.skippedDuplicateInFile.length} skipped — repeated within the CSV</summary>
              <p className="admin-muted" style={{ fontSize: "0.85rem" }}>{result.skippedDuplicateInFile.join(", ")}</p>
            </details>
          )}
          {result.invalidRows.length > 0 && (
            <p style={{ marginTop: "0.5rem", fontSize: "0.85rem", color: "#b45309" }}>
              {result.invalidRows.length} row(s) had no name and were ignored (CSV line {result.invalidRows.slice(0, 20).join(", ")}{result.invalidRows.length > 20 ? ", …" : ""}).
            </p>
          )}
          <button className="admin-secondary-button" type="button" style={{ marginTop: "0.75rem" }} onClick={() => setResult(null)}>Dismiss</button>
        </section>
      )}

      <section className="admin-panel">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "1rem", flexWrap: "wrap", marginBottom: "1rem" }}>
          <div style={{ display: "flex", gap: "1.5rem", fontSize: "0.9rem" }}>
            <span><strong>{stats.total}</strong> delegates</span>
            <span style={{ color: "#059669" }}><strong>{stats.present}</strong> present</span>
            <span style={{ color: "#6b7280" }}><strong>{stats.absent}</strong> not yet marked</span>
          </div>
          <label style={{ display: "flex", alignItems: "center", gap: "0.4rem", border: "1px solid #d1d5db", borderRadius: "0.5rem", padding: "0.4rem 0.6rem", minWidth: "240px" }}>
            <Search size={16} color="#6b7280" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search name, ID, email, phone" style={{ border: "none", outline: "none", flex: 1 }} />
          </label>
        </div>
        <div className="speaker-table-wrap">
          <table className="speaker-table">
            <thead>
              <tr><th>Registration ID</th><th>Name</th><th>Email</th><th>Phone</th><th>Attendance</th><th>Confirmation Email</th></tr>
            </thead>
            <tbody>
              {filtered.map((d) => (
                <tr key={d.id}>
                  <td><strong>{d.registrationId}</strong></td>
                  <td>
                    {(() => {
                      const status = mailStatus(d);
                      return (
                        <>
                          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
                            <span>{d.fullName}</span>
                            <button
                              type="button"
                              onClick={() => setOpenStatusId(openStatusId === d.id ? null : d.id)}
                              title={status.detail}
                              aria-expanded={openStatusId === d.id}
                              style={{ display: "inline-flex", alignItems: "center", gap: "0.25rem", border: "none", borderRadius: "999px", padding: "0.15rem 0.55rem", fontSize: "0.72rem", fontWeight: 700, cursor: "pointer", color: status.color, background: status.background, whiteSpace: "nowrap" }}
                            >
                              <Mail size={12} /> {status.label}
                            </button>
                          </div>
                          {openStatusId === d.id && (
                            <div style={{ fontSize: "0.75rem", color: status.color, marginTop: "0.3rem", maxWidth: "360px" }}>{status.detail}</div>
                          )}
                        </>
                      );
                    })()}
                  </td>
                  <td>{d.email || "-"}</td>
                  <td>{d.phone || "-"}</td>
                  <td>
                    <span className={d.isPresent ? "status-pill accepted" : "status-pill"}>{d.isPresent ? "Present" : "—"}</span>
                  </td>
                  <td>
                    <button
                      className={d.confirmationSentAt ? "admin-secondary-button" : "admin-primary-button"}
                      type="button"
                      style={{ fontSize: "0.8rem", padding: "0.35rem 0.7rem", whiteSpace: "nowrap" }}
                      disabled={!d.email || sendingId === d.id || bulk?.running}
                      title={d.email ? `Send registration confirmation email to ${d.email}` : "No email address for this delegate"}
                      onClick={() => sendConfirmation(d)}
                    >
                      <Mail size={14} /> {sendingId === d.id ? "Sending..." : d.confirmationSentAt ? "Resend Confirmation" : "Send Registration Confirmation Email"}
                    </button>
                    {d.confirmationSentAt && (
                      <div style={{ fontSize: "0.72rem", color: "#059669", marginTop: "0.2rem" }}>Sent {formatDateTime(d.confirmationSentAt)}</div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!loading && !filtered.length && (
          <div className="admin-empty-state"><Users size={18} /> {delegates.length ? "No delegates match your search" : "No delegates yet — import a CSV to get started"}</div>
        )}
      </section>
    </div>
  );
}

export default Delegates;
