import { Plus } from "lucide-react";
import { useEffect, useState } from "react";

function Presentations({ api }) {
  const [sessions, setSessions] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [abstracts, setAbstracts] = useState([]);
  const [form, setForm] = useState({ title: "", sessionType: "poster", hallId: "", date: "", startTime: "", endTime: "" });
  const [assignment, setAssignment] = useState({ abstractId: "", sessionId: "", presentationOrder: 0, posterNumber: "", posterUrl: "" });

  const load = () => Promise.all([api.get("/api/research/presentation-sessions"), api.get("/api/research/presentation-assignments"), api.get("/api/research?admin=1")]).then(([s, a, abs]) => {
    setSessions(s.data.sessions || []);
    setAssignments(a.data.assignments || []);
    setAbstracts(abs.data.submissions || []);
  });
  useEffect(() => { load().catch(() => {}); }, [api]);

  const saveSession = async (event) => {
    event.preventDefault();
    await api.post("/api/research/presentation-sessions", form);
    setForm({ title: "", sessionType: "poster", hallId: "", date: "", startTime: "", endTime: "" });
    load();
  };

  const saveAssignment = async (event) => {
    event.preventDefault();
    await api.post("/api/research/presentation-assignments", assignment);
    setAssignment({ abstractId: "", sessionId: "", presentationOrder: 0, posterNumber: "", posterUrl: "" });
    load();
  };

  return (
    <div className="admin-speakers-page">
      <section className="admin-panel"><p className="admin-eyebrow">Scientific Program</p><h1>Presentation Sessions</h1><p className="admin-muted">Create poster/oral sessions and assign abstracts to presentation slots.</p></section>
      <section className="admin-panel"><form className="super-form-grid" onSubmit={saveSession}>
        <label>Title<input value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} /></label>
        <label>Type<select value={form.sessionType} onChange={(event) => setForm({ ...form, sessionType: event.target.value })}><option value="poster">Poster</option><option value="oral">Oral</option></select></label>
        <label>Hall ID<input value={form.hallId} onChange={(event) => setForm({ ...form, hallId: event.target.value })} /></label>
        <label>Date<input type="date" value={form.date} onChange={(event) => setForm({ ...form, date: event.target.value })} /></label>
        <label>Start<input type="time" value={form.startTime} onChange={(event) => setForm({ ...form, startTime: event.target.value })} /></label>
        <label>End<input type="time" value={form.endTime} onChange={(event) => setForm({ ...form, endTime: event.target.value })} /></label>
        <button className="admin-primary-button" type="submit"><Plus size={18} /> Create Session</button>
      </form></section>
      <section className="admin-panel"><form className="super-form-grid" onSubmit={saveAssignment}>
        <label>Abstract<select value={assignment.abstractId} onChange={(event) => setAssignment({ ...assignment, abstractId: event.target.value })}><option value="">Select</option>{abstracts.map((item) => <option key={item.id} value={item.id}>{item.title}</option>)}</select></label>
        <label>Session<select value={assignment.sessionId} onChange={(event) => setAssignment({ ...assignment, sessionId: event.target.value })}><option value="">Select</option>{sessions.map((item) => <option key={item.id} value={item.id}>{item.title}</option>)}</select></label>
        <label>Order<input type="number" value={assignment.presentationOrder} onChange={(event) => setAssignment({ ...assignment, presentationOrder: event.target.value })} /></label>
        <label>Poster Number<input value={assignment.posterNumber} onChange={(event) => setAssignment({ ...assignment, posterNumber: event.target.value })} /></label>
        <label>Poster URL<input value={assignment.posterUrl} onChange={(event) => setAssignment({ ...assignment, posterUrl: event.target.value })} /></label>
        <button className="admin-primary-button" type="submit">Assign Abstract</button>
      </form></section>
      <section className="admin-panel"><div className="speaker-table-wrap"><table className="speaker-table"><thead><tr><th>Session</th><th>Type</th><th>Date</th><th>Start</th><th>End</th></tr></thead><tbody>{sessions.map((session) => <tr key={session.id}><td>{session.title}</td><td>{session.session_type}</td><td>{session.date}</td><td>{session.start_time}</td><td>{session.end_time}</td></tr>)}</tbody></table></div></section>
      <section className="payment-card-grid">{assignments.map((item) => <article className="payment-card" key={item.id}><strong>Abstract #{item.abstract_id}</strong><p>Session #{item.session_id}</p><span className="status-pill">Order {item.presentation_order}</span><span>{item.poster_number}</span></article>)}</section>
    </div>
  );
}

export default Presentations;
