import {
  Archive,
  ArrowDown,
  ArrowUp,
  BarChart3,
  Building2,
  CircleDollarSign,
  Edit3,
  ExternalLink,
  Handshake,
  Layers3,
  ListChecks,
  Pencil,
  Plus,
  Search,
  Store,
  ToggleLeft,
  ToggleRight,
  Trash2,
  TrendingUp,
  X,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

const money = (value) => `₹${Number(value || 0).toLocaleString("en-IN")}`;

const pipeline = [
  ["prospect", "Lead"],
  ["contacted", "Contacted"],
  ["proposal_sent", "Proposal Sent"],
  ["negotiating", "Negotiation"],
  ["confirmed", "Confirmed"],
  ["payment_pending", "Payment Pending"],
  ["completed", "Completed"],
  ["cancelled", "Cancelled"],
];

const TABS = [
  { id: "partners", label: "Partners", icon: Handshake },
  { id: "sponsors", label: "Sponsors", icon: Building2 },
  { id: "tiers", label: "Sponsor Tiers", icon: Layers3 },
  { id: "reports", label: "Reports", icon: BarChart3 },
];

const imageSrc = (api, src) => src?.startsWith("/uploads") ? `${api.defaults.baseURL}${src}` : src;

function SummaryCard({ title, value, helper, icon: Icon }) {
  return <article className="admin-kpi-card"><Icon size={20} /><strong>{value}</strong><span>{title}</span>{helper && <small>{helper}</small>}</article>;
}

function AdminPartners({ api }) {
  const [tab, setTab] = useState("partners");

  return (
    <div className="admin-speakers-page partner-hub">
      <section className="admin-panel partner-hub-head">
        <div className="speaker-page-top">
          <div>
            <p className="admin-eyebrow">Partner CMS</p>
            <h1>Public Partner</h1>
            <p className="admin-muted">Manage the partners shown on the homepage, the sponsorship pipeline, website-visible sponsor tiers and performance reports — all in one place.</p>
          </div>
        </div>
        <nav className="partner-hub-tabs" role="tablist" aria-label="Public Partner sections">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={tab === id}
              className={`partner-hub-tab${tab === id ? " active" : ""}`}
              onClick={() => setTab(id)}
            >
              <Icon size={15} /> {label}
            </button>
          ))}
        </nav>
      </section>

      {tab === "partners" && <PartnersTab api={api} />}
      {tab === "sponsors" && <SponsorsTab api={api} />}
      {tab === "tiers" && <TiersTab api={api} />}
      {tab === "reports" && <ReportsTab api={api} />}
    </div>
  );
}

const emptyPartner = {
  name: "",
  logo: "",
  website: "",
  tier: "Gold",
  displayOrder: 0,
  active: true,
};

const toPartnerForm = (partner) => ({
  name: partner.name || "",
  logo: partner.logo || "",
  website: partner.website || "",
  tier: partner.tier || "Gold",
  displayOrder: partner.displayOrder || 0,
  active: Boolean(partner.active),
});

function PartnersTab({ api }) {
  const [partners, setPartners] = useState([]);
  const [form, setForm] = useState(emptyPartner);
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
    queueMicrotask(loadPartners);
  }, [loadPartners]);

  const tiers = useMemo(() => {
    const values = partners.map((partner) => partner.tier).filter(Boolean);
    return ["all", ...Array.from(new Set(["Platinum", "Gold", "Silver", "Bronze", ...values]))];
  }, [partners]);

  const filteredPartners = useMemo(() => partners.filter((partner) => {
    const matchesSearch = [partner.name, partner.website, partner.tier].join(" ").toLowerCase().includes(search.toLowerCase());
    const matchesTier = tierFilter === "all" || partner.tier === tierFilter;
    return matchesSearch && matchesTier;
  }), [partners, search, tierFilter]);

  const logoPreview = logoFile ? URL.createObjectURL(logoFile) : imageSrc(api, form.logo);

  const openForm = (partner = null) => {
    setEditingPartner(partner);
    setForm(partner ? toPartnerForm(partner) : { ...emptyPartner, displayOrder: partners.length + 1 });
    setLogoFile(null);
    setFormError("");
    setShowForm(true);
  };

  const closeForm = () => {
    setEditingPartner(null);
    setForm(emptyPartner);
    setLogoFile(null);
    setFormError("");
    setShowForm(false);
  };

  const updateField = (field, value) => setForm((current) => ({ ...current, [field]: value }));

  const submitPartner = async (event) => {
    event.preventDefault();
    if (!form.name.trim()) {
      setFormError("Partner name is required.");
      return;
    }
    if (form.website && !/^https?:\/\//i.test(form.website)) {
      setFormError("Website must start with http:// or https://.");
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
    <div className="partner-tab-pane">
      <section className="admin-panel">
        <div className="speaker-page-top">
          <div>
            <p className="admin-eyebrow">Homepage partners</p>
            <h2 className="partner-tab-title">Partners</h2>
            <p className="admin-muted">These logos appear in the “Our Sponsors” section of the homepage, in display order.</p>
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

const emptySponsor = {
  companyName: "",
  tierId: "",
  contactPerson: "",
  designation: "",
  email: "",
  phone: "",
  website: "",
  linkedin: "",
  country: "",
  city: "",
  companyDescription: "",
  logoUrl: "",
  bannerUrl: "",
  status: "prospect",
  contractValue: 0,
  amountReceived: 0,
  paymentStatus: "pending",
  notes: "",
};

function SponsorsTab({ api }) {
  const [metrics, setMetrics] = useState({});
  const [activity, setActivity] = useState([]);
  const [sponsors, setSponsors] = useState([]);
  const [tiers, setTiers] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptySponsor);
  const [logo, setLogo] = useState(null);
  const [banner, setBanner] = useState(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const loadBase = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [dashboardResponse, sponsorsResponse, tiersResponse] = await Promise.all([
        api.get("/api/sponsorship/dashboard"),
        api.get("/api/sponsors?includeInactive=1"),
        api.get("/api/sponsor-tiers"),
      ]);
      setMetrics(dashboardResponse.data.metrics || {});
      setActivity(dashboardResponse.data.recentActivity || []);
      setSponsors(sponsorsResponse.data.sponsors || []);
      setTiers(tiersResponse.data.tiers || []);
    } catch (err) {
      setError(err.response?.data?.message || "Unable to load sponsorship data.");
    } finally {
      setLoading(false);
    }
  }, [api]);

  useEffect(() => {
    queueMicrotask(loadBase);
  }, [loadBase]);

  const filteredSponsors = useMemo(() => sponsors.filter((sponsor) => {
    const text = [sponsor.companyName, sponsor.tierName, sponsor.contactPerson, sponsor.email].join(" ").toLowerCase();
    return text.includes(search.toLowerCase()) && (statusFilter === "all" || sponsor.status === statusFilter);
  }), [sponsors, search, statusFilter]);

  const updateField = (field, value) => setForm((current) => ({ ...current, [field]: value }));

  const openForm = (sponsor = null) => {
    setEditingId(sponsor?.id || null);
    setForm(sponsor ? { ...emptySponsor, ...sponsor, tierId: sponsor.tierId || "" } : emptySponsor);
    setLogo(null);
    setBanner(null);
    setError("");
    setShowForm(true);
  };

  const closeForm = () => {
    setEditingId(null);
    setForm(emptySponsor);
    setLogo(null);
    setBanner(null);
    setShowForm(false);
  };

  const submitSponsor = async (event) => {
    event.preventDefault();
    const formData = new FormData();
    Object.entries(form).forEach(([key, value]) => formData.append(key, value ?? ""));
    if (logo) formData.append("logo", logo);
    if (banner) formData.append("banner", banner);
    setSaving(true);
    setError("");
    try {
      if (editingId) {
        await api.put(`/api/sponsors/${editingId}`, formData);
      } else {
        await api.post("/api/sponsors", formData);
      }
      closeForm();
      await loadBase();
    } catch (err) {
      setError(err.response?.data?.message || "Unable to save sponsor.");
    } finally {
      setSaving(false);
    }
  };

  const archiveSponsor = async () => {
    if (!editingId || !window.confirm(`Archive ${form.companyName}? It will stop appearing in reports and public lists.`)) return;
    try {
      await api.patch(`/api/sponsors/${editingId}/archive`);
      closeForm();
      await loadBase();
    } catch (err) {
      setError(err.response?.data?.message || "Unable to archive sponsor.");
    }
  };

  const previewSrc = logo ? URL.createObjectURL(logo) : imageSrc(api, form.logoUrl);

  return (
    <div className="partner-tab-pane">
      <section className="admin-panel">
        <div className="speaker-page-top">
          <div>
            <p className="admin-eyebrow">Sponsorship pipeline</p>
            <h2 className="partner-tab-title">Sponsors</h2>
            <p className="admin-muted">Track every sponsor from lead to completed. Confirmed sponsors linked to a website-visible tier appear on the /partnership page.</p>
          </div>
          <button className="admin-primary-button" onClick={() => openForm()}><Plus size={18} /> Add Sponsor</button>
        </div>

        <section className="admin-kpi-grid">
          <SummaryCard title="Total Sponsors" value={metrics.totalSponsors || 0} icon={Handshake} />
          <SummaryCard title="Confirmed" value={metrics.confirmedSponsors || 0} icon={Building2} />
          <SummaryCard title="Pending" value={metrics.pendingSponsors || 0} icon={ListChecks} />
          <SummaryCard title="Revenue" value={money(metrics.revenue)} icon={CircleDollarSign} />
          <SummaryCard title="Outstanding" value={money(metrics.outstanding)} icon={TrendingUp} />
          <SummaryCard title="Exhibitors" value={metrics.exhibitorsConfirmed || 0} icon={Store} />
          <SummaryCard title="Contracts Pending" value={metrics.contractsPending || 0} icon={ListChecks} />
          <SummaryCard title="Deliverables Pending" value={metrics.deliverablesPending || 0} icon={ListChecks} />
        </section>

        <div className="speaker-toolbar">
          <label className="speaker-search"><Search size={17} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search sponsors" /></label>
          <div className="speaker-filter-row">
            <button className={statusFilter === "all" ? "active" : ""} onClick={() => setStatusFilter("all")}>All</button>
            {pipeline.map(([key, label]) => <button key={key} className={statusFilter === key ? "active" : ""} onClick={() => setStatusFilter(key)}>{label}</button>)}
          </div>
        </div>
      </section>

      {error && <div className="admin-error">{error}</div>}

      {showForm && (
        <section className="admin-panel">
          <form className="speaker-form sponsor-form" onSubmit={submitSponsor}>
            <div className="speaker-form-fields">
              <p className="admin-eyebrow">{editingId ? "Edit Sponsor" : "New Sponsor"}</p>
              <div className="speaker-form-grid">
                <label>Company Name<input value={form.companyName} onChange={(event) => updateField("companyName", event.target.value)} required /></label>
                <label>Tier<select value={form.tierId || ""} onChange={(event) => updateField("tierId", event.target.value)}><option value="">Unassigned</option>{tiers.map((tier) => <option key={tier.id} value={tier.id}>{tier.name}</option>)}</select></label>
                <label>Status<select value={form.status} onChange={(event) => updateField("status", event.target.value)}>{pipeline.map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select></label>
                <label>Payment Status<select value={form.paymentStatus} onChange={(event) => updateField("paymentStatus", event.target.value)}><option value="pending">Pending</option><option value="partial">Partial</option><option value="paid">Paid</option></select></label>
                <label>Contract Value<input type="number" value={form.contractValue} onChange={(event) => updateField("contractValue", event.target.value)} /></label>
                <label>Amount Received<input type="number" value={form.amountReceived} onChange={(event) => updateField("amountReceived", event.target.value)} /></label>
                <label>Contact Person<input value={form.contactPerson || ""} onChange={(event) => updateField("contactPerson", event.target.value)} /></label>
                <label>Designation<input value={form.designation || ""} onChange={(event) => updateField("designation", event.target.value)} /></label>
                <label>Email<input type="email" value={form.email || ""} onChange={(event) => updateField("email", event.target.value)} /></label>
                <label>Phone<input value={form.phone || ""} onChange={(event) => updateField("phone", event.target.value)} /></label>
                <label>Website<input value={form.website || ""} onChange={(event) => updateField("website", event.target.value)} /></label>
                <label>LinkedIn<input value={form.linkedin || ""} onChange={(event) => updateField("linkedin", event.target.value)} /></label>
                <label>Country<input value={form.country || ""} onChange={(event) => updateField("country", event.target.value)} /></label>
                <label>City<input value={form.city || ""} onChange={(event) => updateField("city", event.target.value)} /></label>
              </div>
              <label>Description<textarea rows="4" value={form.companyDescription || ""} onChange={(event) => updateField("companyDescription", event.target.value)} /></label>
              <label>Notes<textarea rows="3" value={form.notes || ""} onChange={(event) => updateField("notes", event.target.value)} /></label>
              <div className="speaker-form-grid">
                <label>Logo URL<input value={form.logoUrl || ""} onChange={(event) => updateField("logoUrl", event.target.value)} /></label>
                <label>Banner URL<input value={form.bannerUrl || ""} onChange={(event) => updateField("bannerUrl", event.target.value)} /></label>
                <label>Upload Logo<input type="file" accept="image/*" onChange={(event) => setLogo(event.target.files?.[0] || null)} /></label>
                <label>Upload Banner<input type="file" accept="image/*" onChange={(event) => setBanner(event.target.files?.[0] || null)} /></label>
              </div>
              <div className="speaker-form-actions">
                <button type="submit" disabled={saving}>{saving ? "Saving..." : "Save Sponsor"}</button>
                {editingId && <button type="button" onClick={archiveSponsor}><Archive size={16} /> Archive</button>}
                <button type="button" onClick={closeForm}><X size={16} /> Cancel</button>
              </div>
            </div>
            <aside className="partner-preview">
              <span>{previewSrc ? <img src={previewSrc} alt="" /> : form.companyName?.slice(0, 2).toUpperCase() || "SP"}</span>
              <strong>{form.companyName || "Sponsor"}</strong>
              <small>{tiers.find((tier) => String(tier.id) === String(form.tierId))?.name || "Unassigned tier"}</small>
            </aside>
          </form>
        </section>
      )}

      {!showForm && (
        <>
          <section className="payment-card-grid">
            {loading ? <div className="admin-empty-state">Loading sponsors...</div> : filteredSponsors.map((sponsor) => (
              <article className="payment-card" key={sponsor.id}>
                <span className={`status-pill ${sponsor.status === "completed" ? "published" : sponsor.status === "cancelled" ? "closed" : ""}`}>{sponsor.status?.replaceAll("_", " ")}</span>
                <strong>{sponsor.companyName}</strong>
                <p>{sponsor.tierName || "Unassigned tier"}</p>
                <dl>
                  <div><dt>Contact</dt><dd>{sponsor.contactPerson || sponsor.email || "Not set"}</dd></div>
                  <div><dt>Revenue</dt><dd>{money(sponsor.contractValue)}</dd></div>
                  <div><dt>Received</dt><dd>{money(sponsor.amountReceived)}</dd></div>
                  <div><dt>Deliverables</dt><dd>{sponsor.deliverableCompletion || 0}%</dd></div>
                </dl>
                <div className="payment-card-actions">
                  <button onClick={() => { setSearch(""); setStatusFilter("all"); openForm(sponsor); }}><Pencil size={14} /> Edit</button>
                </div>
              </article>
            ))}
            {!loading && filteredSponsors.length === 0 && <div className="admin-empty-state">No sponsors found.</div>}
          </section>

          <section className="admin-panel">
            <h2>Recent Sponsorship Activity</h2>
            <div className="activity-feed">
              {activity.map((item) => <div key={item.id}><strong>{item.action?.replaceAll("_", " ")}</strong><span>{item.user_name || "System"} · {new Date(item.timestamp).toLocaleString()}</span></div>)}
              {!activity.length && <p className="admin-muted">No sponsorship activity yet.</p>}
            </div>
          </section>
        </>
      )}
    </div>
  );
}

const emptyTier = { name: "", description: "", priorityOrder: 0, isActive: true, websiteVisibility: true };

function TiersTab({ api }) {
  const [tiers, setTiers] = useState([]);
  const [form, setForm] = useState(emptyTier);
  const [editingId, setEditingId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const loadTiers = useCallback(async () => {
    setError("");
    try {
      const response = await api.get("/api/sponsor-tiers");
      setTiers(response.data.tiers || []);
    } catch (err) {
      setError(err.response?.data?.message || "Unable to load sponsor tiers.");
    }
  }, [api]);

  useEffect(() => {
    queueMicrotask(loadTiers);
  }, [loadTiers]);

  const openForm = (tier = null) => {
    setEditingId(tier?.id || null);
    setForm(tier ? { name: tier.name || "", description: tier.description || "", priorityOrder: tier.priority_order || tier.priorityOrder || 0, isActive: tier.is_active !== false, websiteVisibility: tier.website_visibility !== false } : emptyTier);
    setError("");
    setShowForm(true);
  };

  const closeForm = () => {
    setEditingId(null);
    setForm(emptyTier);
    setShowForm(false);
  };

  const updateField = (field, value) => setForm((current) => ({ ...current, [field]: value }));

  const submitTier = async (event) => {
    event.preventDefault();
    if (!form.name.trim()) {
      setError("Tier name is required.");
      return;
    }
    const payload = {
      name: form.name.trim(),
      description: form.description.trim(),
      priorityOrder: Number(form.priorityOrder || 0),
      isActive: form.isActive,
      websiteVisibility: form.websiteVisibility,
    };
    setSaving(true);
    setError("");
    try {
      if (editingId) {
        await api.put(`/api/sponsor-tiers/${editingId}`, payload);
      } else {
        await api.post("/api/sponsor-tiers", payload);
      }
      closeForm();
      await loadTiers();
    } catch (err) {
      setError(err.response?.data?.message || "Unable to save tier.");
    } finally {
      setSaving(false);
    }
  };

  const toggleField = async (tier, field) => {
    try {
      await api.put(`/api/sponsor-tiers/${tier.id}`, {
        name: tier.name,
        description: tier.description || "",
        priorityOrder: tier.priority_order || tier.priorityOrder || 0,
        isActive: field === "is_active" ? tier.is_active === 0 || !tier.is_active : !!tier.is_active,
        websiteVisibility: field === "website_visibility" ? tier.website_visibility === 0 || !tier.website_visibility : !!tier.website_visibility,
      });
      await loadTiers();
    } catch (err) {
      setError(err.response?.data?.message || "Unable to update tier.");
    }
  };

  const deleteTier = async (tier) => {
    if (!window.confirm(`Delete tier "${tier.name}"? Sponsors keep their current tier reference but will show as unassigned.`)) return;
    try {
      await api.delete(`/api/sponsor-tiers/${tier.id}`);
      if (editingId === tier.id) closeForm();
      await loadTiers();
    } catch (err) {
      setError(err.response?.data?.message || "Unable to delete tier.");
    }
  };

  return (
    <div className="partner-tab-pane">
      <section className="admin-panel">
        <div className="speaker-page-top">
          <div>
            <p className="admin-eyebrow">Sponsorship packages</p>
            <h2 className="partner-tab-title">Sponsor Tiers</h2>
            <p className="admin-muted">Tiers marked “Visible on website” appear on the /partnership page and on sponsor badges across the site.</p>
          </div>
          <button className="admin-primary-button" onClick={() => openForm()}><Plus size={18} /> Add Tier</button>
        </div>
      </section>

      {error && <div className="admin-error">{error}</div>}

      {showForm && (
        <section className="admin-panel">
          <form className="speaker-form" onSubmit={submitTier}>
            <div className="speaker-form-fields">
              <p className="admin-eyebrow">{editingId ? "Edit Tier" : "New Tier"}</p>
              <div className="speaker-form-grid">
                <label>Name<input value={form.name} onChange={(event) => updateField("name", event.target.value)} required /></label>
                <label>Priority order<input type="number" value={form.priorityOrder} onChange={(event) => updateField("priorityOrder", event.target.value)} /></label>
              </div>
              <label>Description<textarea rows="3" value={form.description} onChange={(event) => updateField("description", event.target.value)} placeholder="What does this tier include?" /></label>
              <div className="speaker-toggle-row">
                <label><input type="checkbox" checked={form.isActive} onChange={(event) => updateField("isActive", event.target.checked)} /> Active</label>
                <label><input type="checkbox" checked={form.websiteVisibility} onChange={(event) => updateField("websiteVisibility", event.target.checked)} /> Visible on website</label>
              </div>
              <div className="speaker-form-actions">
                <button type="submit" disabled={saving}>{saving ? "Saving..." : "Save Tier"}</button>
                <button type="button" onClick={closeForm}><X size={16} /> Cancel</button>
              </div>
            </div>
          </form>
        </section>
      )}

      <section className="admin-panel">
        <div className="tier-table">
          <div className="tier-row tier-row-head">
            <span>Name</span>
            <span>Description</span>
            <span>Priority</span>
            <span>Status</span>
            <span>Actions</span>
          </div>
          {tiers.map((tier) => {
            const active = tier.is_active !== 0 && tier.is_active !== false;
            const visible = tier.website_visibility !== 0 && tier.website_visibility !== false;
            return (
              <div className="tier-row" key={tier.id}>
                <span className="tier-name">{tier.name}</span>
                <span className="tier-desc">{tier.description || "—"}</span>
                <span className="tier-prio">{tier.priority_order || tier.priorityOrder || 0}</span>
                <span className="tier-statuses">
                  <span className={`status-pill ${active ? "published" : "closed"}`}>{active ? "Active" : "Inactive"}</span>
                  <span className={`status-pill ${visible ? "published" : "closed"}`}>{visible ? "On website" : "Hidden"}</span>
                </span>
                <span className="tier-actions">
                  <button title="Edit" onClick={() => openForm(tier)}><Pencil size={14} /></button>
                  <button title="Toggle active" onClick={() => toggleField(tier, "is_active")}>{active ? <ToggleRight size={15} /> : <ToggleLeft size={15} />}</button>
                  <button title="Toggle website visibility" onClick={() => toggleField(tier, "website_visibility")}>{visible ? <EyeIcon /> : <EyeOffIcon />}</button>
                  <button className="danger" title="Delete" onClick={() => deleteTier(tier)}><Trash2 size={14} /></button>
                </span>
              </div>
            );
          })}
          {!tiers.length && <p className="admin-muted tier-empty">No sponsor tiers yet. Add your first tier to get started.</p>}
        </div>
      </section>
    </div>
  );
}

function ReportsTab({ api }) {
  const [reports, setReports] = useState({ byStatus: [], revenueByTier: [], trends: [], deliverables: [], occupancy: [] });
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    try {
      const response = await api.get("/api/sponsorship/reports");
      setReports(response.data || {});
    } catch (err) {
      setError(err.response?.data?.message || "Unable to load sponsorship reports.");
    }
  }, [api]);

  useEffect(() => {
    queueMicrotask(load);
  }, [load]);

  const totalRevenue = useMemo(() => reports.revenueByTier?.reduce((sum, item) => sum + Number(item.contractValue || 0), 0) || 0, [reports.revenueByTier]);
  const received = useMemo(() => reports.revenueByTier?.reduce((sum, item) => sum + Number(item.received || 0), 0) || 0, [reports.revenueByTier]);
  const totalDeliverables = useMemo(() => reports.deliverables?.reduce((sum, item) => sum + Number(item.total || 0), 0) || 0, [reports.deliverables]);
  const occupiedStalls = useMemo(() => reports.occupancy?.filter((item) => item.status !== "available").reduce((sum, item) => sum + Number(item.total || 0), 0) || 0, [reports.occupancy]);

  return (
    <div className="partner-tab-pane">
      <section className="admin-panel">
        <div className="speaker-page-top">
          <div>
            <p className="admin-eyebrow">Sponsorship analytics</p>
            <h2 className="partner-tab-title">Reports</h2>
            <p className="admin-muted">Pipeline conversion, revenue by tier, growth trends, deliverables and exhibition occupancy.</p>
          </div>
          <button className="admin-secondary-button" onClick={load}><TrendingUp size={16} /> Refresh</button>
        </div>
      </section>

      {error && <div className="admin-error">{error}</div>}

      <section className="admin-kpi-grid">
        <SummaryCard title="Contracted Revenue" value={money(totalRevenue)} icon={CircleDollarSign} />
        <SummaryCard title="Received Revenue" value={money(received)} icon={TrendingUp} />
        <SummaryCard title="Deliverables" value={totalDeliverables} icon={ListChecks} />
        <SummaryCard title="Allocated Stalls" value={occupiedStalls} icon={Store} />
      </section>

      <section className="sponsor-report-grid">
        <Chart title="Pipeline by Status" rows={reports.byStatus || []} labelKey="status" valueKey="total" icon={BarChart3} />
        <Chart title="Revenue by Tier" rows={reports.revenueByTier || []} labelKey="tier" valueKey="contractValue" format={money} icon={CircleDollarSign} />
        <Chart title="Monthly Sponsor Growth" rows={reports.trends || []} labelKey="month" valueKey="sponsors" icon={BarChart3} />
        <Chart title="Revenue Trend" rows={reports.trends || []} labelKey="month" valueKey="revenue" format={money} icon={TrendingUp} />
        <Chart title="Deliverable Status" rows={reports.deliverables || []} labelKey="status" valueKey="total" icon={ListChecks} />
        <Chart title="Stall Occupancy" rows={reports.occupancy || []} labelKey="status" valueKey="total" icon={Store} />
      </section>
    </div>
  );
}

function Chart({ title, rows, labelKey, valueKey, format = (value) => value, icon: Icon }) {
  const max = Math.max(...rows.map((row) => Number(row[valueKey] || 0)), 1);
  return (
    <article className="admin-panel sponsor-chart">
      <h2><Icon size={18} /> {title}</h2>
      <div className="sponsor-chart-bars">
        {rows.map((row) => {
          const value = Number(row[valueKey] || 0);
          return (
            <div className="sponsor-chart-row" key={`${row[labelKey]}-${value}`}>
              <span>{String(row[labelKey] || "Unassigned").replaceAll("_", " ")}</span>
              <i><b style={{ width: `${Math.max((value / max) * 100, 4)}%` }} /></i>
              <strong>{format(value)}</strong>
            </div>
          );
        })}
        {!rows.length && <p className="admin-muted">No data yet.</p>}
      </div>
    </article>
  );
}

function EyeIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function EyeOffIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a13.45 13.45 0 0 1 5.06-5.94" />
      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a13.67 13.67 0 0 1-1.16 1.71" />
      <path d="M14.12 14.12a3 3 0 1 1-4.24-4.24" />
      <path d="M1 1l22 22" />
    </svg>
  );
}

export default AdminPartners;