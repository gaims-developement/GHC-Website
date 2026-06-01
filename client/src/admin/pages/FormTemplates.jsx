import { Layers3, Plus } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

function FormTemplates({ api, onNavigate }) {
  const [templates, setTemplates] = useState([]);
  const [error, setError] = useState("");

  const load = useCallback(() => {
    api.get("/api/forms/metadata")
      .then((response) => setTemplates(response.data.templates || []))
      .catch((requestError) => setError(requestError.response?.data?.message || "Unable to load templates."));
  }, [api]);

  useEffect(() => {
    queueMicrotask(load);
  }, [load]);

  return (
    <div className="admin-speakers-page">
      <section className="admin-panel">
        <div className="speaker-page-top">
          <div>
            <p className="admin-eyebrow">Forms</p>
            <h1>Form Templates</h1>
            <p className="admin-muted">Reusable form schemas for applications, surveys, feedback, registrations and nominations.</p>
          </div>
          <button className="admin-primary-button" type="button" onClick={() => onNavigate("forms-create")}><Plus size={18} /> Build from scratch</button>
        </div>
        {error && <div className="admin-error">{error}</div>}
      </section>
      <section className="super-role-grid">
        {templates.map((template) => (
          <article key={template.id}>
            <Layers3 size={20} />
            <strong>{template.title}</strong>
            <span className="admin-muted">{template.category || "Template"}</span>
            <p>{template.description}</p>
          </article>
        ))}
        {!templates.length && <article><strong>No templates yet</strong><p className="admin-muted">Templates are database-driven and can be seeded or added through the CMS API.</p></article>}
      </section>
    </div>
  );
}

export default FormTemplates;
