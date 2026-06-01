import { Download, FileText, MessageSquareText, RefreshCw } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

function FormSubmissions({ api, activePage }) {
  const formId = useMemo(() => activePage?.match(/^form-(\d+)-submissions$/)?.[1], [activePage]);
  const [form, setForm] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const [selected, setSelected] = useState(null);
  const [note, setNote] = useState("");
  const [error, setError] = useState("");

  const load = useCallback(() => {
    if (!formId) return;
    setError("");
    Promise.all([api.get(`/api/forms/${formId}`), api.get(`/api/forms/${formId}/submissions`)])
      .then(([formResponse, submissionsResponse]) => {
        setForm(formResponse.data.form);
        setSubmissions(submissionsResponse.data.submissions || []);
        setSelected(null);
      })
      .catch((requestError) => setError(requestError.response?.data?.message || "Unable to load submissions."));
  }, [api, formId]);

  useEffect(() => {
    queueMicrotask(load);
  }, [load]);

  const openSubmission = async (submission) => {
    const response = await api.get(`/api/forms/${formId}/submissions/${submission.id}`);
    setSelected(response.data.submission);
  };

  const updateStatus = async (status) => {
    if (!selected) return;
    await api.put(`/api/forms/${formId}/submissions/${selected.id}`, { status });
    const response = await api.get(`/api/forms/${formId}/submissions/${selected.id}`);
    setSelected(response.data.submission);
    load();
  };

  const addNote = async (event) => {
    event.preventDefault();
    if (!selected || !note.trim()) return;
    await api.post(`/api/forms/${formId}/submissions/${selected.id}/notes`, { note });
    setNote("");
    const response = await api.get(`/api/forms/${formId}/submissions/${selected.id}`);
    setSelected(response.data.submission);
  };

  return (
    <div className="admin-speakers-page ops-page">
      <section className="admin-panel">
        <div className="speaker-page-top">
          <div>
            <p className="admin-eyebrow">Submissions</p>
            <h1>{form?.title || "Form submissions"}</h1>
            <p className="admin-muted">Review responses, add notes, approve, reject, request changes and export records.</p>
          </div>
          <div className="export-button-row">
            <button className="admin-secondary-button" type="button" onClick={load}><RefreshCw size={18} /> Refresh</button>
            <a className="admin-primary-button" href={`${api.defaults.baseURL}/api/forms/${formId}/submissions/export.csv`}><Download size={18} /> CSV</a>
          </div>
        </div>
        {error && <div className="admin-error">{error}</div>}
      </section>

      <section className="settings-form-grid">
        <div className="admin-panel">
          <div className="speaker-table-wrap">
            <table className="speaker-table">
              <thead><tr><th>ID</th><th>Status</th><th>Submitted</th><th>Reviewer</th><th>Action</th></tr></thead>
              <tbody>
                {submissions.map((submission) => (
                  <tr key={submission.id}>
                    <td><strong>{submission.submission_id}</strong></td>
                    <td><span className={`status-pill ${submission.status === "approved" ? "paid" : submission.status === "rejected" ? "cancelled" : "pending"}`}>{submission.status}</span></td>
                    <td>{submission.submitted_at ? new Date(submission.submitted_at).toLocaleString() : "-"}</td>
                    <td>{submission.reviewer_name || "-"}</td>
                    <td><button className="admin-secondary-button" type="button" onClick={() => openSubmission(submission)}>Open</button></td>
                  </tr>
                ))}
                {!submissions.length && <tr><td colSpan="5">No submissions yet.</td></tr>}
              </tbody>
            </table>
          </div>
        </div>

        <div className="admin-panel settings-section">
          <h2>Review</h2>
          {selected ? (
            <>
              <p className="admin-muted">{selected.submission_id}</p>
              <div className="export-button-row">
                {["under_review", "approved", "rejected", "archived"].map((status) => <button key={status} className="admin-secondary-button" type="button" onClick={() => updateStatus(status)}>{status.replace("_", " ")}</button>)}
                <a className="admin-secondary-button" href={`${api.defaults.baseURL}/api/forms/${formId}/submissions/${selected.id}.pdf`}><FileText size={16} /> PDF</a>
              </div>
              <div className="speaker-table-wrap">
                <table className="speaker-table">
                  <tbody>
                    {Object.entries(selected.submission_data || {}).map(([key, value]) => (
                      <tr key={key}><th>{key}</th><td>{Array.isArray(value) ? value.join(", ") : String(value ?? "-")}</td></tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <h3>Files</h3>
              {(selected.files || []).map((file) => <a key={file.id} href={file.file_url} target="_blank" rel="noreferrer">{file.original_name || file.file_url}</a>)}
              <form onSubmit={addNote}>
                <label>Note<textarea value={note} onChange={(event) => setNote(event.target.value)} /></label>
                <button className="admin-primary-button" type="submit"><MessageSquareText size={18} /> Add note</button>
              </form>
              {(selected.notes || []).map((item) => <div className="admin-success" key={item.id}><strong>{item.added_by_name || "Reviewer"}</strong><br />{item.note}</div>)}
            </>
          ) : (
            <p className="admin-muted">Select a submission to review.</p>
          )}
        </div>
      </section>
    </div>
  );
}

export default FormSubmissions;
