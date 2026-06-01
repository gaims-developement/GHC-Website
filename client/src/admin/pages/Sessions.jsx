import { AlertTriangle, Plus } from "lucide-react";
import { useEffect, useState } from "react";

const emptySession = { title: "", description: "", speakerId: "", sessionType: "lecture", hallId: "", trackId: "", startTime: "", endTime: "", cmeCreditPoints: 0, status: "draft" };
const sessionTypes = ["keynote", "panel", "workshop", "fireside_chat", "lecture", "case_discussion", "research_presentation", "round_table"];

function Sessions({ api }) {
  const [sessions, setSessions] = useState([]);
  const [speakers, setSpeakers] = useState([]);
  const [tracks, setTracks] = useState([]);
  const [halls, setHalls] = useState([]);
  const [form, setForm] = useState(emptySession);
  const [editingId, setEditingId] = useState(null);
  const [conflicts, setConflicts] = useState([]);

  const load = () => Promise.all([
    api.get("/api/speakers/sessions"),
    api.get("/api/speakers?admin=1"),
    api.get("/api/speakers/tracks"),
    api.get("/api/speakers/halls"),
  ]).then(([sessionRes, speakerRes, trackRes, hallRes]) => {
    setSessions(sessionRes.data.sessions || []);
    setSpeakers(speakerRes.data.speakers || []);
    setTracks(trackRes.data.tracks || []);
    setHalls(hallRes.data.halls || []);
  });

  useEffect(() => { load().catch(() => {}); }, [api]);

  const save = async (event) => {
    event.preventDefault();
    const payload = { ...form, startTime: form.startTime ? form.startTime.replace("T", " ") : null, endTime: form.endTime ? form.endTime.replace("T", " ") : null };
    const response = editingId ? await api.put(`/api/speakers/sessions/${editingId}`, payload) : await api.post("/api/speakers/sessions", payload);
    setConflicts(response.data.conflicts || []);
    setForm(emptySession);
    setEditingId(null);
    load();
  };

  const edit = (session) => {
    setEditingId(session.id);
    setForm({
      title: session.title || "",
      description: session.description || "",
      speakerId: session.speaker_id || "",
      sessionType: session.session_type || "lecture",
      hallId: session.hall_id || "",
      trackId: session.track_id || "",
      startTime: session.start_time ? String(session.start_time).slice(0, 16) : "",
      endTime: session.end_time ? String(session.end_time).slice(0, 16) : "",
      cmeCreditPoints: session.cme_credit_points || 0,
      status: session.status || "draft",
    });
  };

  return (
    <div className="admin-speakers-page">
      <section className="admin-panel">
        <p className="admin-eyebrow">Session Management</p>
        <h1>Sessions</h1>
        <p className="admin-muted">Schedule speakers across halls, tracks and time slots with conflict warnings.</p>
      </section>
      <section className="admin-panel">
        {conflicts.length > 0 && <div className="admin-error"><AlertTriangle size={16} /> Schedule conflict detected: {conflicts.map((item) => item.title).join(", ")}</div>}
        <form className="super-form-grid" onSubmit={save}>
          <label>Title<input value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} /></label>
          <label>Type<select value={form.sessionType} onChange={(event) => setForm({ ...form, sessionType: event.target.value })}>{sessionTypes.map((type) => <option key={type} value={type}>{type}</option>)}</select></label>
          <label>Speaker<select value={form.speakerId} onChange={(event) => setForm({ ...form, speakerId: event.target.value })}><option value="">Missing speaker</option>{speakers.map((speaker) => <option key={speaker.id} value={speaker.id}>{speaker.name}</option>)}</select></label>
          <label>Hall<select value={form.hallId} onChange={(event) => setForm({ ...form, hallId: event.target.value })}><option value="">Select hall</option>{halls.map((hall) => <option key={hall.id} value={hall.id}>{hall.name}</option>)}</select></label>
          <label>Track<select value={form.trackId} onChange={(event) => setForm({ ...form, trackId: event.target.value })}><option value="">Select track</option>{tracks.map((track) => <option key={track.id} value={track.id}>{track.name}</option>)}</select></label>
          <label>Start<input type="datetime-local" value={form.startTime} onChange={(event) => setForm({ ...form, startTime: event.target.value })} /></label>
          <label>End<input type="datetime-local" value={form.endTime} onChange={(event) => setForm({ ...form, endTime: event.target.value })} /></label>
          <label>CME Points<input type="number" value={form.cmeCreditPoints} onChange={(event) => setForm({ ...form, cmeCreditPoints: event.target.value })} /></label>
          <label>Status<select value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value })}><option value="draft">draft</option><option value="published">published</option><option value="cancelled">cancelled</option></select></label>
          <button className="admin-primary-button" type="submit"><Plus size={18} /> Save Session</button>
        </form>
      </section>
      <section className="admin-panel">
        <div className="speaker-table-wrap"><table className="speaker-table"><thead><tr><th>Title</th><th>Speaker</th><th>Hall</th><th>Track</th><th>Time</th><th>Status</th><th></th></tr></thead><tbody>
          {sessions.map((session) => <tr key={session.id}><td><strong>{session.title}</strong><small>{session.session_type}</small></td><td>{session.speaker_name || "Missing"}</td><td>{session.hall_name || "-"}</td><td>{session.track_name || "-"}</td><td>{session.start_time ? new Date(session.start_time).toLocaleString() : "-"}</td><td><span className={`status-pill ${session.status}`}>{session.status}</span></td><td><button className="admin-secondary-button" onClick={() => edit(session)}>Edit</button></td></tr>)}
        </tbody></table></div>
      </section>
    </div>
  );
}

export default Sessions;
