import { Plus } from "lucide-react";
import { useEffect, useState } from "react";

const configs = {
  reviewers: { title: "Reviewers", list: "/api/research/reviewers", save: "/api/research/reviewers", key: "reviewers", fields: ["userId", "specialization", "designation", "institution", "country"] },
  judges: { title: "Judges", list: "/api/research/judges", save: "/api/research/judges", key: "judges", fields: ["userId", "specialization", "designation"] },
  awards: { title: "Awards", list: "/api/research/awards", save: "/api/research/awards", key: "awards", fields: ["name", "description", "category", "prize"] },
  categories: { title: "Abstract Categories", list: "/api/research/categories", save: "/api/research/categories", key: "categories", fields: ["name", "description", "submissionType"] },
  criteria: { title: "Scoring Criteria", list: "/api/research/criteria", save: "/api/research/criteria", key: "criteria", fields: ["name", "weight"] },
};

function ScientificDirectory({ api, type }) {
  const config = configs[type] || configs.reviewers;
  const [rows, setRows] = useState([]);
  const [form, setForm] = useState({});
  const [editingId, setEditingId] = useState(null);

  const load = () => api.get(config.list).then((response) => setRows(response.data[config.key] || []));
  useEffect(() => { load().catch(() => {}); }, [api, type]);

  const save = async (event) => {
    event.preventDefault();
    if (editingId) await api.put(`${config.save}/${editingId}`, form);
    else await api.post(config.save, form);
    setForm({});
    setEditingId(null);
    load();
  };

  return (
    <div className="admin-speakers-page">
      <section className="admin-panel"><p className="admin-eyebrow">Scientific</p><h1>{config.title}</h1><p className="admin-muted">CMS-driven records with no hardcoded categories or awards.</p></section>
      <section className="admin-panel">
        <form className="super-form-grid" onSubmit={save}>
          {config.fields.map((field) => <label key={field}>{field}<input value={form[field] || ""} onChange={(event) => setForm({ ...form, [field]: event.target.value })} /></label>)}
          <button className="admin-primary-button" type="submit"><Plus size={18} /> Save</button>
        </form>
      </section>
      <section className="admin-panel"><div className="speaker-table-wrap"><table className="speaker-table"><thead><tr>{config.fields.map((field) => <th key={field}>{field}</th>)}<th></th></tr></thead><tbody>{rows.map((row) => <tr key={row.id}>{config.fields.map((field) => <td key={field}>{row[field] || row[field.replace(/[A-Z]/g, (m) => `_${m.toLowerCase()}`)]}</td>)}<td><button className="admin-secondary-button" onClick={() => { setEditingId(row.id); setForm(row); }}>Edit</button></td></tr>)}</tbody></table></div></section>
    </div>
  );
}

export default ScientificDirectory;
