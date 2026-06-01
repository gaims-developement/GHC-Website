import { Plus } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

const configs = {
  tracks: { title: "Tracks", endpoint: "/api/speakers/tracks", key: "tracks", fields: ["name", "description", "color"] },
  halls: { title: "Halls", endpoint: "/api/speakers/halls", key: "halls", fields: ["venueId", "name", "capacity", "location", "floor", "hallType", "status"] },
};

function SpeakerDirectories({ api, type = "tracks" }) {
  const config = configs[type];
  const [rows, setRows] = useState([]);
  const [form, setForm] = useState({});
  const [editingId, setEditingId] = useState(null);

  const load = useCallback(() => api.get(config.endpoint).then((response) => setRows(response.data[config.key] || [])), [api, config.endpoint, config.key]);
  useEffect(() => { load().catch(() => {}); }, [load]);

  const save = async (event) => {
    event.preventDefault();
    if (editingId) await api.put(`${config.endpoint}/${editingId}`, form);
    else await api.post(config.endpoint, form);
    setForm({});
    setEditingId(null);
    load();
  };

  const edit = (row) => {
    setEditingId(row.id);
    setForm({ ...row, venueId: row.venue_id, hallType: row.hall_type });
  };

  return (
    <div className="admin-speakers-page">
      <section className="admin-panel">
        <p className="admin-eyebrow">Speaker/CME</p>
        <h1>{config.title}</h1>
        <p className="admin-muted">CMS-driven {config.title.toLowerCase()} with no hardcoded values.</p>
      </section>
      <section className="admin-panel">
        <form className="super-form-grid" onSubmit={save}>
          {config.fields.map((field) => <label key={field}>{field}<input type={field === "color" ? "color" : field === "capacity" || field === "venueId" ? "number" : "text"} value={form[field] || (field === "color" ? "#4fc3f7" : "")} onChange={(event) => setForm({ ...form, [field]: event.target.value })} /></label>)}
          <button className="admin-primary-button" type="submit"><Plus size={18} /> Save</button>
        </form>
      </section>
      <section className="admin-panel">
        <div className="speaker-table-wrap"><table className="speaker-table"><thead><tr>{config.fields.map((field) => <th key={field}>{field}</th>)}<th></th></tr></thead><tbody>{rows.map((row) => <tr key={row.id}>{config.fields.map((field) => <td key={field}>{field === "color" ? <span className="color-chip" style={{ background: row[field] }} /> : row[field]}</td>)}<td><button className="admin-secondary-button" onClick={() => edit(row)}>Edit</button></td></tr>)}</tbody></table></div>
      </section>
    </div>
  );
}

export default SpeakerDirectories;
