import { CheckCircle2, Plus } from "lucide-react";
import { useEffect, useState } from "react";

function Cme({ api }) {
  const [sessions, setSessions] = useState([]);
  const [records, setRecords] = useState([]);
  const [form, setForm] = useState({ sessionId: "", creditHours: 0, creditPoints: 0, approved: false });

  const load = () => Promise.all([api.get("/api/speakers/sessions"), api.get("/api/speakers/cme")]).then(([sessionsRes, cmeRes]) => {
    setSessions(sessionsRes.data.sessions || []);
    setRecords(cmeRes.data.records || []);
  });
  useEffect(() => { load().catch(() => {}); }, [api]);

  const save = async (event) => {
    event.preventDefault();
    await api.post("/api/speakers/cme", form);
    setForm({ sessionId: "", creditHours: 0, creditPoints: 0, approved: false });
    load();
  };

  return (
    <div className="admin-speakers-page">
      <section className="admin-panel"><p className="admin-eyebrow">CME</p><h1>CME Management</h1><p className="admin-muted">Assign credits, approve CME records and export accreditation data.</p></section>
      <section className="admin-panel">
        <form className="super-form-grid" onSubmit={save}>
          <label>Session<select value={form.sessionId} onChange={(event) => setForm({ ...form, sessionId: event.target.value })}><option value="">Select session</option>{sessions.map((session) => <option key={session.id} value={session.id}>{session.title}</option>)}</select></label>
          <label>Credit Hours<input type="number" value={form.creditHours} onChange={(event) => setForm({ ...form, creditHours: event.target.value })} /></label>
          <label>Credit Points<input type="number" value={form.creditPoints} onChange={(event) => setForm({ ...form, creditPoints: event.target.value })} /></label>
          <label className="super-inline-check"><input type="checkbox" checked={form.approved} onChange={(event) => setForm({ ...form, approved: event.target.checked })} /> Approved</label>
          <button className="admin-primary-button" type="submit"><Plus size={18} /> Save CME</button>
        </form>
      </section>
      <section className="admin-panel"><div className="speaker-table-wrap"><table className="speaker-table"><thead><tr><th>Session</th><th>Hours</th><th>Points</th><th>Approved</th><th>Approved By</th></tr></thead><tbody>{records.map((record) => <tr key={record.id}><td>{record.session_title}</td><td>{record.credit_hours}</td><td>{record.credit_points}</td><td>{record.approved ? <CheckCircle2 size={16} /> : "-"}</td><td>{record.approved_by_name || "-"}</td></tr>)}</tbody></table></div></section>
    </div>
  );
}

export default Cme;
