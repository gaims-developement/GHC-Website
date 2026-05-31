import { ArrowDown, ArrowUp, Edit3, ExternalLink, Plus, Search, ToggleLeft, ToggleRight, Trash2, X } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

const emptyForm = {
  name: "",
  logo: "",
  website: "",
  tier: "Gold",
  displayOrder: 0,
  active: true,
};

const imageSrc = (api, src) => src?.startsWith("/uploads") ? `${api.defaults.baseURL}${src}` : src;

const toForm = (partner) => ({
  name: partner.name || "",
  logo: partner.logo || "",
  website: partner.website || "",
  tier: partner.tier || "Gold",
  displayOrder: partner.displayOrder || 0,
  active: Boolean(partner.active),
});

function AdminPartners({ api }) {
  const [partners, setPartners] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [logoFile, setLogoFile] = useState(null);
  const [editingPartner, setEditingPartner] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState("");
  const [tierFilter, setTierFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [formError, setFormError] = useState("");

  const loadPartners = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await api.get("/api/partners?admin=1");
      setPartners(response.data.partners || []);
    } catch (err) {
      setError(err.response?.data?.message || "Unable to load partners.");
    } finally {
      setLoading(false);
    }
  }, [api]);

  useEffect(() => {
    loadPartners();
  }, [loadPartners]);

  const tiers = useMemo(() => {
    const values = partners.map((partner) => partner.tier).filter(Boolean);
    return ["all", ...Array.from(new Set(["Platinum", "Gold", "Silver", "Bronze", ...values]))];
  }, [partners]);

  const filteredPartners = useMemo(() => {
    return partners.filter((partner) => {
      const matchesSearch = [partner.name, partner.website, partner.tier].join(" ").toLowerCase().includes(search.toLowerCase());
      const matchesTier = tierFilter === "all" || partner.tier === tierFilter;
      return matchesSearch && matchesTier;
    });
  }, [partners, search, tierFilter]);

  const logoPreview = logoFile ? URL.createObjectURL(logoFile) : imageSrc(api, form.logo);

  const openForm = (partner = null) => {
    setEditingPartner(partner);
    setForm(partner ? toForm(partner) : { ...emptyForm, displayOrder: partners.length + 1 });
    setLogoFile(null);
    setFormError("");
    setShowForm(true);
  };

  const closeForm = () => {
    setEditingPartner(null);
    setForm(emptyForm);
    setLogoFile(null);
    setFormError("");
    setShowForm(false);
  };

  const updateField = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const validateForm = () => {
    if (!form.name.trim()) return "Partner name is required.";
    if (form.website && !/^https?:\/\//i.test(form.website)) return "Website must start with http:// or https://.";
    return "";
  };

  const submitPartner = async (event) => {
    event.preventDefault();
    const validationError = validateForm();
    if (validationError) {
      setFormError(validationError);
      return;
    }

    const formData = new FormData();
    formData.append("name", form.name.trim());
    formData.append("logoUrl", form.logo.trim());
    formData.append("website", form.website.trim());
    formData.append("tier", form.tier.trim());
    formData.append("displayOrder", form.displayOrder || 0);
    formData.append("active", String(form.active));
    if (logoFile) formData.append("logo", logoFile);

    setSaving(true);
    setFormError("");
    try {
      if (editingPartner?.id) {
        await api.put(`/api/partners/${editingPartner.id}`, formData);
      } else {
        await api.post("/api/partners", formData);
      }
      closeForm();
      await loadPartners();
    } catch (err) {
      setFormError(err.response?.data?.message || "Unable to save partner.");
    } finally {
      setSaving(false);
    }
  };

  const togglePartner = async (partner) => {
    const formData = new FormData();
    formData.append("name", partner.name);
    formData.append("logoUrl", partner.logo || "");
    formData.append("website", partner.website || "");
    formData.append("tier", partner.tier || "");
    formData.append("displayOrder", partner.displayOrder || 0);
    formData.append("active", String(!partner.active));
    await api.put(`/api/partners/${partner.id}`, formData);
    loadPartners();
  };

  const deletePartner = async (partner) => {
    if (!window.confirm(`Delete ${partner.name}?`)) return;
    await api.delete(`/api/partners/${partner.id}`);
    loadPartners();
  };

  const movePartner = async (partner, direction) => {
    const ordered = [...partners].sort((a, b) => Number(a.displayOrder || 0) - Number(b.displayOrder || 0));
    const index = ordered.findIndex((item) => item.id === partner.id);
    const nextIndex = index + direction;
    if (index < 0 || nextIndex < 0 || nextIndex >= ordered.length) return;

    [ordered[index], ordered[nextIndex]] = [ordered[nextIndex], ordered[index]];
    const items = ordered.map((item, itemIndex) => ({ id: item.id, displayOrder: itemIndex + 1 }));
    await api.patch("/api/partners/reorder", { items });
    loadPartners();
  };

  return (
    <div className="admin-speakers-page admin-partners-page">
      <section className="admin-panel">
        <div className="speaker-page-top">
          <div>
            <p className="admin-eyebrow">Partner CMS</p>
            <h1>Sponsor Management</h1>
            <p className="admin-muted">Manage sponsor logos, partner tiers, websites, display order and publication state.</p>
          </div>
          <button className="admin-primary-button" onClick={() => openForm()}><Plus size={18} /> Add Partner</button>
        </div>

        <div className="speaker-toolbar">
          <label className="speaker-search"><Search size={17} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search partners" /></label>
          <div className="speaker-filter-row">
            {tiers.map((tier) => <button key={tier} className={tierFilter === tier ? "active" : ""} onClick={() => setTierFilter(tier)}>{tier}</button>)}
          </div>
        </div>
      </section>

      {error && <div className="admin-error">{error}</div>}

      {showForm && (
        <section className="admin-panel">
          <form className="speaker-form partner-form" onSubmit={submitPartner}>
            <div className="speaker-form-fields">
              <p className="admin-eyebrow">{editingPartner ? "Edit Partner" : "New Partner"}</p>
              {formError && <div className="admin-error">{formError}</div>}
              <div className="speaker-form-grid">
                <label>Name<input value={form.name} onChange={(event) => updateField("name", event.target.value)} required /></label>
                <label>Tier<input value={form.tier} onChange={(event) => updateField("tier", event.target.value)} /></label>
                <label>Website<input value={form.website} onChange={(event) => updateField("website", event.target.value)} placeholder="https://example.com" /></label>
                <label>Display order<input type="number" value={form.displayOrder} onChange={(event) => updateField("displayOrder", event.target.value)} /></label>
              </div>
              <label>Logo URL<input value={form.logo} onChange={(event) => updateField("logo", event.target.value)} placeholder="https://..." /></label>
              <label>Upload logo<input type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml" onChange={(event) => setLogoFile(event.target.files?.[0] || null)} /></label>
              <div className="speaker-toggle-row">
                <label><input type="checkbox" checked={form.active} onChange={(event) => updateField("active", event.target.checked)} /> Active</label>
              </div>
              <div className="speaker-form-actions">
                <button type="submit" disabled={saving}>{saving ? "Saving..." : "Save Partner"}</button>
                <button type="button" onClick={closeForm}>Cancel</button>
              </div>
            </div>
            <aside className="partner-preview">
              <span>{logoPreview ? <img src={logoPreview} alt="" /> : form.name?.slice(0, 2).toUpperCase() || "SP"}</span>
              <strong>{form.name || "Sponsor name"}</strong>
              <small>{form.tier || "Sponsor tier"}</small>
            </aside>
          </form>
        </section>
      )}

      <section className="payment-card-grid partner-card-grid">
        {loading ? <div className="admin-empty-state">Loading partners...</div> : filteredPartners.map((partner) => (
          <article className="payment-card partner-card" key={partner.id}>
            <div className="partner-card-logo">
              {partner.logo ? <img src={imageSrc(api, partner.logo)} alt={partner.name} /> : partner.name?.slice(0, 2).toUpperCase()}
            </div>
            <div>
              <span className={`status-pill ${partner.active ? "published" : "closed"}`}>{partner.active ? "Active" : "Inactive"}</span>
              <strong>{partner.name}</strong>
              <p>{partner.tier || "Unassigned tier"}</p>
            </div>
            <dl>
              <div><dt>Website</dt><dd>{partner.website || "Not set"}</dd></div>
              <div><dt>Order</dt><dd>{partner.displayOrder}</dd></div>
            </dl>
            <div className="partner-action-grid">
              <button onClick={() => openForm(partner)}><Edit3 size={16} /> Edit</button>
              <button onClick={() => togglePartner(partner)}>{partner.active ? <ToggleRight size={16} /> : <ToggleLeft size={16} />} {partner.active ? "Disable" : "Enable"}</button>
              <button onClick={() => movePartner(partner, -1)}><ArrowUp size={16} /> Up</button>
              <button onClick={() => movePartner(partner, 1)}><ArrowDown size={16} /> Down</button>
              {partner.website && <a href={partner.website} target="_blank" rel="noreferrer"><ExternalLink size={16} /> Visit</a>}
              <button onClick={() => deletePartner(partner)}><Trash2 size={16} /> Delete</button>
            </div>
          </article>
        ))}
        {!loading && filteredPartners.length === 0 && <div className="admin-empty-state">No partners found.</div>}
      </section>
    </div>
  );
}

export default AdminPartners;
