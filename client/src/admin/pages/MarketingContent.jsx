import { Archive, CheckCircle2, Plus, Save, Search, Trash2 } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

const configs = {
  announcements: {
    apiType: "announcements",
    title: "Announcements",
    empty: { title: "", slug: "", content: "", featured_image: "", status: "draft", publish_date: "", is_pinned: false, is_featured: false },
    fields: [["title", "Title"], ["slug", "Slug"], ["content", "Content", "textarea"], ["featured_image", "Featured Image URL"], ["status", "Status", "workflow"], ["publish_date", "Publish Date", "datetime-local"]],
  },
  news: {
    apiType: "news",
    title: "News Articles",
    empty: { title: "", slug: "", excerpt: "", content: "", cover_image: "", category: "", status: "draft", publish_date: "", is_featured: false },
    fields: [["title", "Title"], ["slug", "Slug"], ["excerpt", "Excerpt", "textarea"], ["content", "Content", "textarea"], ["cover_image", "Cover Image URL"], ["category", "Category"], ["status", "Status", "workflow"], ["publish_date", "Publish Date", "datetime-local"]],
  },
  homepage: {
    apiType: "homepage",
    title: "Homepage Sections",
    empty: { section_name: "", title: "", subtitle: "", content: "", config: "{}", is_visible: true, display_order: 0 },
    fields: [["section_name", "Section Name"], ["title", "Title"], ["subtitle", "Subtitle", "textarea"], ["content", "Content", "textarea"], ["config", "JSON Config", "textarea"], ["display_order", "Display Order", "number"]],
  },
  banners: {
    apiType: "banners",
    title: "Hero Banners",
    empty: { title: "", subtitle: "", button_text: "", button_link: "", background_image: "", display_order: 0, is_active: true, start_date: "", end_date: "" },
    fields: [["title", "Title"], ["subtitle", "Subtitle", "textarea"], ["button_text", "Button Text"], ["button_link", "Button Link"], ["background_image", "Background Image URL"], ["display_order", "Display Order", "number"], ["start_date", "Start Date", "datetime-local"], ["end_date", "End Date", "datetime-local"]],
  },
  gallery: {
    apiType: "albums",
    title: "Gallery Albums",
    empty: { title: "", description: "", cover_image: "", event_date: "", is_featured: false, display_order: 0 },
    fields: [["title", "Title"], ["description", "Description", "textarea"], ["cover_image", "Cover Image URL"], ["event_date", "Event Date", "date"], ["display_order", "Display Order", "number"]],
  },
  campaigns: {
    apiType: "campaigns",
    title: "Social Campaigns",
    empty: { campaign_name: "", description: "", start_date: "", end_date: "", status: "draft" },
    fields: [["campaign_name", "Campaign Name"], ["description", "Description", "textarea"], ["start_date", "Start Date", "date"], ["end_date", "End Date", "date"], ["status", "Status", "campaignStatus"]],
  },
  "media-partners": {
    apiType: "partners",
    title: "Media Partners",
    empty: { organization_name: "", logo_url: "", website: "", tier: "", description: "", display_order: 0, is_active: true },
    fields: [["organization_name", "Organization Name"], ["logo_url", "Logo URL"], ["website", "Website"], ["tier", "Tier"], ["description", "Description", "textarea"], ["display_order", "Display Order", "number"]],
  },
  notifications: {
    apiType: "notifications",
    title: "Website Notifications",
    empty: { title: "", message: "", notification_type: "info", start_date: "", end_date: "", is_active: true },
    fields: [["title", "Title"], ["message", "Message", "textarea"], ["notification_type", "Type", "notificationType"], ["start_date", "Start Date", "datetime-local"], ["end_date", "End Date", "datetime-local"]],
  },
  seo: {
    apiType: "seo",
    title: "SEO Management",
    empty: { page_key: "", seo_title: "", seo_description: "", seo_keywords: "", og_image: "", canonical_url: "", schema_markup: "{}" },
    fields: [["page_key", "Page Key"], ["seo_title", "SEO Title"], ["seo_description", "SEO Description", "textarea"], ["seo_keywords", "SEO Keywords"], ["og_image", "OG Image"], ["canonical_url", "Canonical URL"], ["schema_markup", "Schema Markup JSON", "textarea"]],
  },
};

function MarketingContent({ api, type = "announcements" }) {
  const config = configs[type] || configs.announcements;
  const [items, setItems] = useState([]);
  const [form, setForm] = useState(config.empty);
  const [editing, setEditing] = useState(null);
  const [asset, setAsset] = useState(null);
  const [search, setSearch] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setError("");
    try {
      const response = await api.get(`/api/marketing/${config.apiType}${search ? `?search=${encodeURIComponent(search)}` : ""}`);
      setItems(response.data.items || []);
    } catch (err) {
      setError(err.response?.data?.message || `Unable to load ${config.title.toLowerCase()}.`);
    }
  }, [api, config.apiType, config.title, search]);

  useEffect(() => {
    const timer = setTimeout(load, 200);
    return () => clearTimeout(timer);
  }, [load]);

  useEffect(() => {
    queueMicrotask(() => {
      setForm(config.empty);
      setEditing(null);
    });
  }, [config.empty]);

  const visibleItems = useMemo(() => items.map((item) => ({
    ...item,
    titleText: item.title || item.section_name || item.campaign_name || item.organization_name || item.page_key || item.caption,
    statusText: item.status || (item.is_active === 0 || item.is_visible === 0 ? "inactive" : "active"),
  })), [items]);

  const updateField = (field, value) => setForm((current) => ({ ...current, [field]: value }));

  const openEdit = (item) => {
    setEditing(item);
    setForm({ ...config.empty, ...item });
    setMessage("");
    setError("");
  };

  const submit = async (event) => {
    event.preventDefault();
    const payload = new FormData();
    Object.entries(form).forEach(([key, value]) => payload.append(key, value ?? ""));
    if (asset) payload.append("asset", asset);
    try {
      if (editing?.id) await api.put(`/api/marketing/${config.apiType}/${editing.id}`, payload);
      else await api.post(`/api/marketing/${config.apiType}`, payload);
      setMessage(`${config.title} saved.`);
      setForm(config.empty);
      setEditing(null);
      setAsset(null);
      await load();
    } catch (err) {
      setError(err.response?.data?.message || `Unable to save ${config.title.toLowerCase()}.`);
    }
  };

  const remove = async (item) => {
    if (!window.confirm(`Delete ${item.titleText || item.title || "this item"}?`)) return;
    await api.delete(`/api/marketing/${config.apiType}/${item.id}`);
    await load();
  };

  const changeStatus = async (item, status) => {
    const payload = new FormData();
    Object.entries({ ...item, status }).forEach(([key, value]) => {
      if (value !== undefined && value !== null) payload.append(key, value);
    });
    await api.put(`/api/marketing/${config.apiType}/${item.id}`, payload);
    setMessage(status === "published" ? "Content published." : "Content archived.");
    await load();
  };

  return (
    <div className="admin-speakers-page marketing-workspace">
      <section className="admin-panel">
        <div className="speaker-page-top">
          <div>
            <p className="admin-eyebrow">Marketing CMS</p>
            <h1>{config.title}</h1>
            <p className="admin-muted">Create, schedule, approve, publish and sync website content without hardcoded page data.</p>
          </div>
        </div>
        <label className="speaker-search"><Search size={17} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder={`Search ${config.title.toLowerCase()}`} /></label>
      </section>

      {message && <div className="admin-success">{message}</div>}
      {error && <div className="admin-error">{error}</div>}

      <section className="admin-panel">
        <form className="speaker-form" onSubmit={submit}>
          <div className="speaker-form-fields">
            <p className="admin-eyebrow">{editing ? "Edit" : "Create"} {config.title}</p>
            <div className="speaker-form-grid">
              {config.fields.map(([field, label, inputType]) => (
                <label key={field}>{label}{renderField({ field, inputType, form, updateField })}</label>
              ))}
              <label>Upload Asset<input type="file" onChange={(event) => setAsset(event.target.files?.[0] || null)} /></label>
            </div>
            <div className="speaker-toggle-row">
              {"is_active" in form && <label><input type="checkbox" checked={Boolean(form.is_active)} onChange={(event) => updateField("is_active", event.target.checked)} /> Active</label>}
              {"is_visible" in form && <label><input type="checkbox" checked={Boolean(form.is_visible)} onChange={(event) => updateField("is_visible", event.target.checked)} /> Visible</label>}
              {"is_pinned" in form && <label><input type="checkbox" checked={Boolean(form.is_pinned)} onChange={(event) => updateField("is_pinned", event.target.checked)} /> Pinned</label>}
              {"is_featured" in form && <label><input type="checkbox" checked={Boolean(form.is_featured)} onChange={(event) => updateField("is_featured", event.target.checked)} /> Featured</label>}
            </div>
            <div className="speaker-form-actions">
              <button type="submit"><Save size={16} /> Save</button>
              {editing && <button type="button" onClick={() => { setEditing(null); setForm(config.empty); }}>Cancel</button>}
            </div>
          </div>
        </form>
      </section>

      <section className="payment-card-grid">
        {visibleItems.map((item) => (
          <article className="payment-card" key={item.id}>
            <span className="status-pill">{String(item.statusText).replaceAll("_", " ")}</span>
            <strong>{item.titleText}</strong>
            <p>{item.excerpt || item.subtitle || item.description || item.category || "No summary"}</p>
            <dl>
              {item.publish_date && <div><dt>Publish</dt><dd>{new Date(item.publish_date).toLocaleString()}</dd></div>}
              {item.display_order !== undefined && <div><dt>Order</dt><dd>{item.display_order}</dd></div>}
              {item.category && <div><dt>Category</dt><dd>{item.category}</dd></div>}
            </dl>
            <div className="payment-card-actions">
              <button onClick={() => openEdit(item)}><Plus size={16} /> Edit</button>
              {["draft", "review", "approved"].includes(item.status) && <button onClick={() => changeStatus(item, "published")}><CheckCircle2 size={16} /> Publish</button>}
              {item.status !== "archived" && item.status && <button onClick={() => changeStatus(item, "archived")}><Archive size={16} /> Archive</button>}
              <button onClick={() => remove(item)}><Trash2 size={16} /> Delete</button>
            </div>
          </article>
        ))}
        {!visibleItems.length && <div className="admin-empty-state">No {config.title.toLowerCase()} found.</div>}
      </section>
    </div>
  );
}

function renderField({ field, inputType, form, updateField }) {
  if (inputType === "textarea") return <textarea rows="4" value={form[field] ?? ""} onChange={(event) => updateField(field, event.target.value)} />;
  if (inputType === "workflow") return <select value={form[field] ?? "draft"} onChange={(event) => updateField(field, event.target.value)}><option value="draft">Draft</option><option value="review">Review</option><option value="approved">Approved</option><option value="published">Published</option><option value="archived">Archived</option></select>;
  if (inputType === "campaignStatus") return <select value={form[field] ?? "draft"} onChange={(event) => updateField(field, event.target.value)}><option value="draft">Draft</option><option value="active">Active</option><option value="completed">Completed</option></select>;
  if (inputType === "notificationType") return <select value={form[field] ?? "info"} onChange={(event) => updateField(field, event.target.value)}><option value="info">Info</option><option value="warning">Warning</option><option value="success">Success</option></select>;
  return <input type={inputType || "text"} value={form[field] ?? ""} onChange={(event) => updateField(field, event.target.value)} />;
}

export default MarketingContent;
