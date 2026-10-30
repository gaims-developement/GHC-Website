import { BellRing, FileUp, Mail, Search, Send, Trash2 } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { readSheet } from "read-excel-file/browser";
import PhoneCell from "../components/PhoneCell";
import { parseCsv } from "../utils/csv";

// Name, email and abstract ID are required; any other columns (S. No., etc.) are ignored.
const HEADER_ALIASES = {
  fullName: ["name", "full name", "fullname", "author", "presenting author", "participant name", "participant"],
  firstName: ["first name", "firstname", "given name"],
  lastName: ["last name", "lastname", "surname", "family name"],
  email: ["email", "email address", "email id", "e mail", "mail"],
  phone: ["phone", "phone number", "phone no", "mobile", "mobile number", "mobile no", "contact", "contact number", "whatsapp"],
  abstractId: ["abstract id", "abstract no", "abstract number", "abstract code", "abstract", "abstract ids"],
};

const normalizeHeader = (header) => String(header ?? "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();

const mapRows = (table) => {
  const [headerRow, ...dataRows] = table;
  const headers = (headerRow || []).map(normalizeHeader);
  const columnOf = (field) => headers.findIndex((h) => HEADER_ALIASES[field].includes(h));
  const columns = Object.fromEntries(Object.keys(HEADER_ALIASES).map((field) => [field, columnOf(field)]));

  if (columns.fullName < 0 && columns.firstName < 0) {
    throw new Error('Could not find a name column. Add a header such as "Name" or "Full Name" (or "First Name" and "Last Name").');
  }
  if (columns.email < 0) {
    throw new Error('Could not find an email column. Add a header such as "Email".');
  }
  if (columns.abstractId < 0) {
    throw new Error('Could not find an abstract column. Add a header such as "Abstract ID".');
  }

  const cell = (row, field) => (columns[field] >= 0 ? String(row[columns[field]] ?? "").trim() : "");
  return dataRows
    .map((row) => ({
      fullName: cell(row, "fullName") || [cell(row, "firstName"), cell(row, "lastName")].filter(Boolean).join(" "),
      email: cell(row, "email"),
      phone: cell(row, "phone"),
      abstractId: cell(row, "abstractId"),
    }))
    .filter((row) => row.fullName || row.email);
};

// Excel files are read in the browser; CSV goes through the shared parser.
const readTable = async (file) => {
  if (/\.xlsx$/i.test(file.name)) return readSheet(file);
  if (/\.xls$/i.test(file.name)) throw new Error("Old .xls files aren't supported. Save the sheet as .xlsx or .csv and upload again.");
  return parseCsv(await file.text());
};

const formatDateTime = (value) => (value ? new Date(value).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" }) : "");

const mailStatus = (reminder) => {
  const lastFailed = reminder.lastError && (!reminder.sentAt || new Date(reminder.lastAttemptAt) > new Date(reminder.sentAt));
  if (lastFailed) return { label: "Failed", color: "#b91c1c", background: "#fee2e2", detail: `Last attempt ${formatDateTime(reminder.lastAttemptAt)} failed: ${reminder.lastError}` };
  if (reminder.sentAt) return { label: "Sent", color: "#047857", background: "#d1fae5", detail: `Sent on ${formatDateTime(reminder.sentAt)}${reminder.sendCount > 1 ? ` · sent ${reminder.sendCount} times` : ""}` };
  return { label: "Not sent", color: "#b45309", background: "#fef3c7", detail: "Reminder has not been sent yet." };
};

function Reminders({ api }) {
  const [reminders, setReminders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [pending, setPending] = useState(null);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState(null);
  const [bulk, setBulk] = useState(null);
  const [sendingId, setSendingId] = useState(null);
  const [query, setQuery] = useState("");
  const fileInput = useRef(null);
  const stopBulkRef = useRef(false);

  const load = useCallback(async () => {
    try {
      const response = await api.get("/api/reminders");
      setReminders(response.data.reminders || []);
    } catch (err) {
      setError(err.response?.data?.message || "Could not load the reminder list.");
    } finally {
      setLoading(false);
    }
  }, [api]);

  useEffect(() => {
    load();
  }, [load]);

  const applyUpdate = (updated) => setReminders((current) => current.map((r) => (r.id === updated.id ? updated : r)));

  const handleFile = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    setError("");
    setResult(null);
    if (!file) return;
    try {
      const rows = mapRows(await readTable(file));
      if (!rows.length) throw new Error("The file has no rows to import.");
      setPending({ fileName: file.name, rows });
    } catch (err) {
      setPending(null);
      setError(err.message || "Unable to read the file.");
    }
  };

  // Sent as one request, not chunks: rows for the same person are merged on the server and must arrive together.
  const runImport = async () => {
    if (!pending) return;
    setImporting(true);
    setError("");
    try {
      const response = await api.post("/api/reminders/import", { rows: pending.rows });
      const data = response.data || {};
      setResult({
        added: data.added || 0,
        skippedExisting: data.skippedExisting || [],
        mergedInFile: data.mergedInFile || 0,
        // Server row numbers are 1-based; +1 more for the header line.
        invalidRows: (data.invalidRows || []).map((n) => n + 1),
      });
      setPending(null);
    } catch (err) {
      setError(err.response?.data?.message || "Import failed.");
    } finally {
      setImporting(false);
      load();
    }
  };

  const unsent = reminders.filter((r) => !r.sentAt);

  // Sends one email at a time (with a short pause, to respect the mail provider's rate limit) so progress is visible and can be stopped.
  const sendAll = async () => {
    const queue = unsent;
    if (!queue.length) return;
    if (!window.confirm(`Send the registration reminder email to ${queue.length} person(s) who haven't received it yet?`)) return;

    stopBulkRef.current = false;
    setError("");
    const progress = { running: true, total: queue.length, done: 0, sent: 0, failed: 0, skipped: 0, current: "", failures: [] };
    setBulk({ ...progress });
    for (const reminder of queue) {
      if (stopBulkRef.current) break;
      progress.current = reminder.fullName;
      setBulk({ ...progress });
      try {
        const response = await api.post(`/api/reminders/${reminder.id}/send`, { onlyIfNotSent: true });
        applyUpdate(response.data.reminder);
        progress.sent += 1;
      } catch (err) {
        if (err.response?.data?.reminder) applyUpdate(err.response.data.reminder);
        if (err.response?.status === 409) {
          progress.skipped += 1;
        } else {
          progress.failed += 1;
          progress.failures.push(`${reminder.fullName}: ${err.response?.data?.message || "request failed"}`);
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

  const sendOne = async (reminder) => {
    if (reminder.sentAt && !window.confirm(`${reminder.fullName} was already sent the reminder. Send it again?`)) return;
    setSendingId(reminder.id);
    setError("");
    try {
      const response = await api.post(`/api/reminders/${reminder.id}/send`);
      applyUpdate(response.data.reminder);
    } catch (err) {
      if (err.response?.data?.reminder) applyUpdate(err.response.data.reminder);
      setError(err.response?.data?.message || `Could not send the reminder to ${reminder.fullName}.`);
    } finally {
      setSendingId(null);
    }
  };

  const removeReminder = async (reminder) => {
    if (!window.confirm(`Remove ${reminder.fullName} (${reminder.email}) from the reminder list?`)) return;
    try {
      await api.delete(`/api/reminders/${reminder.id}`);
      setReminders((current) => current.filter((r) => r.id !== reminder.id));
    } catch (err) {
      setError(err.response?.data?.message || "Could not remove this person.");
    }
  };

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return reminders;
    return reminders.filter((r) => [r.fullName, r.email, r.abstractIds].some((value) => String(value || "").toLowerCase().includes(q)));
  }, [reminders, query]);

  const sentCount = reminders.length - unsent.length;

  return (
    <div className="admin-speakers-page">
      <section className="admin-panel">
        <p className="admin-eyebrow">Delegates</p>
        <h1>Reminders</h1>
        <p className="admin-muted">
          Upload an Excel (.xlsx) or CSV file of people whose abstract is accepted but who haven't registered, then send them the
          registration reminder. The email names each person's accepted abstract and includes a Complete Your Registration button.
          Someone with two abstracts gets one email listing both, and email addresses already on the list are skipped.
        </p>
        <div style={{ display: "flex", gap: "0.6rem", flexWrap: "wrap", marginTop: "1rem" }}>
          <input ref={fileInput} type="file" accept=".xlsx,.csv,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" onChange={handleFile} style={{ display: "none" }} />
          <button className="admin-primary-button" type="button" onClick={() => fileInput.current?.click()} disabled={importing || bulk?.running}>
            <FileUp size={18} /> Upload Excel / CSV
          </button>
          <button
            className="admin-primary-button"
            type="button"
            onClick={sendAll}
            disabled={!unsent.length || bulk?.running || sendingId !== null}
            title={unsent.length ? `Email the ${unsent.length} person(s) who haven't been sent the reminder yet` : "Everyone on the list has already been sent the reminder"}
            style={{ background: "#B8913D", borderColor: "#B8913D" }}
          >
            <Send size={18} /> Send Email ({unsent.length})
          </button>
        </div>
        <p className="admin-muted" style={{ fontSize: "0.8rem", marginTop: "0.75rem" }}>
          Columns: <strong>Name</strong> (or First Name + Last Name), <strong>Email</strong> and <strong>Abstract ID</strong>, plus an optional <strong>Phone Number</strong>. Any other columns are ignored.
        </p>
        <div style={{ display: "flex", gap: "1.25rem", fontSize: "0.9rem", marginTop: "0.5rem", flexWrap: "wrap" }}>
          <span><strong>{reminders.length}</strong> on the list</span>
          <span style={{ color: "#047857" }}><strong>{sentCount}</strong> sent</span>
          <span style={{ color: "#b45309" }}><strong>{unsent.length}</strong> not sent</span>
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
            <div style={{ height: "100%", width: `${bulk.total ? (bulk.done / bulk.total) * 100 : 0}%`, background: "#B8913D", transition: "width 0.2s" }} />
          </div>
          <div style={{ display: "flex", gap: "1.25rem", fontSize: "0.85rem", flexWrap: "wrap" }}>
            <span style={{ color: "#047857" }}><strong>{bulk.sent}</strong> sent</span>
            <span style={{ color: "#b91c1c" }}><strong>{bulk.failed}</strong> failed</span>
            {bulk.skipped > 0 && <span style={{ color: "#6b7280" }}><strong>{bulk.skipped}</strong> already sent (skipped)</span>}
          </div>
          {!bulk.running && bulk.failures.length > 0 && (
            <details style={{ marginTop: "0.5rem", fontSize: "0.85rem" }}>
              <summary>Show failures — press Send Email again to retry them</summary>
              <ul style={{ margin: "0.4rem 0 0 1rem" }}>{bulk.failures.map((f) => <li key={f}>{f}</li>)}</ul>
            </details>
          )}
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
              <thead><tr><th>Name</th><th>Email</th><th>Phone</th><th>Abstract ID</th></tr></thead>
              <tbody>
                {pending.rows.slice(0, 5).map((row, index) => (
                  <tr key={index}>
                    <td><strong>{row.fullName || <em style={{ color: "#dc2626" }}>missing</em>}</strong></td>
                    <td>{row.email || <em style={{ color: "#dc2626" }}>missing</em>}</td>
                    <td>{row.phone || "-"}</td>
                    <td>{row.abstractId || <em style={{ color: "#dc2626" }}>missing</em>}</td>
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
          <h2 style={{ marginTop: 0, fontSize: "1.1rem", color: "#166534" }}>Import complete — {result.added} new person(s) added</h2>
          {result.mergedInFile > 0 && <p className="admin-muted">{result.mergedInFile} extra row(s) for someone already in the file were merged, so that person gets one email listing all their abstracts.</p>}
          {result.skippedExisting.length > 0 && <p className="admin-muted">{result.skippedExisting.length} already on the list (skipped): {result.skippedExisting.slice(0, 10).join(", ")}{result.skippedExisting.length > 10 ? "…" : ""}</p>}
          {result.invalidRows.length > 0 && <p className="admin-muted" style={{ color: "#b91c1c" }}>{result.invalidRows.length} row(s) skipped because the name, email or abstract ID was missing or invalid (rows {result.invalidRows.slice(0, 15).join(", ")}{result.invalidRows.length > 15 ? "…" : ""}).</p>}
          <button className="admin-secondary-button" type="button" onClick={() => setResult(null)}>Dismiss</button>
        </section>
      )}

      <section className="admin-panel">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "1rem", flexWrap: "wrap", marginBottom: "0.75rem" }}>
          <h2 style={{ margin: 0, fontSize: "1.1rem", display: "flex", alignItems: "center", gap: "0.4rem" }}><BellRing size={18} /> Reminder list</h2>
          <label style={{ display: "flex", alignItems: "center", gap: "0.4rem", border: "1px solid #d1d5db", borderRadius: "0.5rem", padding: "0.35rem 0.6rem" }}>
            <Search size={16} />
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search name, email or abstract" style={{ border: 0, outline: "none", minWidth: "12rem" }} />
          </label>
        </div>
        {loading ? (
          <p className="admin-muted">Loading…</p>
        ) : !reminders.length ? (
          <p className="admin-muted">No one on the list yet. Upload an Excel or CSV file to get started.</p>
        ) : (
          <div className="speaker-table-wrap">
            <table className="speaker-table">
              <thead><tr><th>Name</th><th>Abstract ID</th><th>Email</th><th>Phone</th><th>Status</th><th>Actions</th></tr></thead>
              <tbody>
                {filtered.map((reminder) => {
                  const status = mailStatus(reminder);
                  return (
                    <tr key={reminder.id}>
                      <td><strong>{reminder.fullName}</strong></td>
                      <td>{reminder.abstractIds}</td>
                      <td>{reminder.email}</td>
                      <td style={{ whiteSpace: "nowrap", minWidth: "150px" }}><PhoneCell phone={reminder.phone} /></td>
                      <td>
                        <span title={status.detail} style={{ display: "inline-block", padding: "0.15rem 0.6rem", borderRadius: "999px", fontSize: "0.75rem", fontWeight: 700, color: status.color, background: status.background }}>
                          {status.label}
                        </span>
                      </td>
                      <td>
                        <div className="speaker-actions">
                          <button type="button" onClick={() => sendOne(reminder)} disabled={sendingId === reminder.id || bulk?.running} title={reminder.sentAt ? "Send the reminder again" : "Send the reminder"}>
                            <Mail size={15} /> {sendingId === reminder.id ? "Sending..." : reminder.sentAt ? "Resend" : "Send"}
                          </button>
                          <button type="button" onClick={() => removeReminder(reminder)} disabled={bulk?.running} title="Remove from the list">
                            <Trash2 size={15} />
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

export default Reminders;
