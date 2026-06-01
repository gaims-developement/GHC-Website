import { Upload } from "lucide-react";
import { useEffect, useState } from "react";

function SpeakerResources({ api }) {
  const [sessions, setSessions] = useState([]);
  const [resources, setResources] = useState([]);
  const [form, setForm] = useState({ sessionId: "", resourceName: "", resourceType: "pdf", fileUrl: "" });
  const [file, setFile] = useState(null);

  const load = () => Promise.all([api.get("/api/speakers/sessions"), api.get("/api/speakers/resources")]).then(([sessionsRes, resourcesRes]) => {
    setSessions(sessionsRes.data.sessions || []);
    setResources(resourcesRes.data.resources || []);
  });
  useEffect(() => { load().catch(() => {}); }, [api]);

  const save = async (event) => {
    event.preventDefault();
    const data = new FormData();
    Object.entries(form).forEach(([key, value]) => data.append(key, value));
    if (file) data.append("file", file);
    await api.post("/api/speakers/resources", data);
    setForm({ sessionId: "", resourceName: "", resourceType: "pdf", fileUrl: "" });
    setFile(null);
    load();
  };

  return (
    <div className="admin-speakers-page">
      <section className="admin-panel"><p className="admin-eyebrow">Resources</p><h1>Session Resources</h1><p className="admin-muted">Upload presentations, handouts, videos, and external links.</p></section>
      <section className="admin-panel">
        <form className="super-form-grid" onSubmit={save}>
          <label>Session<select value={form.sessionId} onChange={(event) => setForm({ ...form, sessionId: event.target.value })}><option value="">Select session</option>{sessions.map((session) => <option key={session.id} value={session.id}>{session.title}</option>)}</select></label>
          <label>Name<input value={form.resourceName} onChange={(event) => setForm({ ...form, resourceName: event.target.value })} /></label>
          <label>Type<select value={form.resourceType} onChange={(event) => setForm({ ...form, resourceType: event.target.value })}>{["pdf", "ppt", "video", "external_link"].map((type) => <option key={type} value={type}>{type}</option>)}</select></label>
          <label>External URL<input value={form.fileUrl} onChange={(event) => setForm({ ...form, fileUrl: event.target.value })} /></label>
          <label>File<input type="file" onChange={(event) => setFile(event.target.files?.[0] || null)} /></label>
          <button className="admin-primary-button" type="submit"><Upload size={18} /> Upload</button>
        </form>
      </section>
      <section className="payment-card-grid">{resources.map((resource) => <article className="payment-card" key={resource.id}><strong>{resource.resource_name}</strong><p>{resource.session_title}</p><span className="status-pill">{resource.resource_type}</span>{resource.file_url && <a className="admin-secondary-button" href={resource.file_url} target="_blank" rel="noreferrer">Open</a>}</article>)}</section>
    </div>
  );
}

export default SpeakerResources;
