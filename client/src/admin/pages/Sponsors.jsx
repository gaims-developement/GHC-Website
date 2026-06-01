import { Archive, Building2, CircleDollarSign, FileSignature, Handshake, ListChecks, Plus, Search, Store, X } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

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

const money = (value) => `₹${Number(value || 0).toLocaleString("en-IN")}`;
const assetSrc = (api, src) => src?.startsWith("/uploads") ? `${api.defaults.baseURL}${src}` : src;

const viewFromPage = (activePage) => {
  if (activePage === "sponsors-create") return { mode: "create" };
  const match = activePage.match(/^sponsor-(\d+)$/);
  if (match) return { mode: "detail", id: match[1] };
  return { mode: "list" };
};

function Sponsors({ api, activePage, onNavigate }) {
  const view = viewFromPage(activePage);
  const [metrics, setMetrics] = useState({});
  const [activity, setActivity] = useState([]);
  const [sponsors, setSponsors] = useState([]);
  const [tiers, setTiers] = useState([]);
  const [detail, setDetail] = useState(null);
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

  useEffect(() => {
    if (view.mode === "create") {
      queueMicrotask(() => {
        setForm(emptySponsor);
        setDetail(null);
      });
      return;
    }

    if (view.mode !== "detail") return;
    api.get(`/api/sponsors/${view.id}`).then((response) => {
      const sponsor = response.data.sponsor;
      setDetail(sponsor);
      setForm({
        ...emptySponsor,
        ...sponsor,
        tierId: sponsor.tierId || "",
      });
    }).catch((err) => setError(err.response?.data?.message || "Unable to load sponsor."));
  }, [api, view.id, view.mode]);

  const filteredSponsors = useMemo(() => sponsors.filter((sponsor) => {
    const text = [sponsor.companyName, sponsor.tierName, sponsor.contactPerson, sponsor.email].join(" ").toLowerCase();
    return text.includes(search.toLowerCase()) && (statusFilter === "all" || sponsor.status === statusFilter);
  }), [sponsors, search, statusFilter]);

  const pipelineSponsors = useMemo(() => {
    const grouped = Object.fromEntries(pipeline.map(([key]) => [key, []]));
    filteredSponsors.forEach((sponsor) => {
      const key = grouped[sponsor.status] ? sponsor.status : "prospect";
      grouped[key].push(sponsor);
    });
    return grouped;
  }, [filteredSponsors]);

  const updateField = (field, value) => setForm((current) => ({ ...current, [field]: value }));

  const submitSponsor = async (event) => {
    event.preventDefault();
    const formData = new FormData();
    Object.entries(form).forEach(([key, value]) => formData.append(key, value ?? ""));
    if (logo) formData.append("logo", logo);
    if (banner) formData.append("banner", banner);
    setSaving(true);
    setError("");
    try {
      const response = view.mode === "detail"
        ? await api.put(`/api/sponsors/${view.id}`, formData)
        : await api.post("/api/sponsors", formData);
      const nextId = response.data.sponsor?.id || view.id;
      await loadBase();
      onNavigate(`sponsor-${nextId}`);
    } catch (err) {
      setError(err.response?.data?.message || "Unable to save sponsor.");
    } finally {
      setSaving(false);
    }
  };

  const archiveSponsor = async () => {
    await api.patch(`/api/sponsors/${view.id}/archive`);
    await loadBase();
    onNavigate("sponsors");
  };

  if (view.mode === "create" || view.mode === "detail") {
    const preview = logo ? URL.createObjectURL(logo) : assetSrc(api, form.logoUrl);
    return (
      <div className="admin-speakers-page sponsor-workspace">
        <section className="admin-panel">
          <div className="speaker-page-top">
            <div>
              <p className="admin-eyebrow">Sponsorship CRM</p>
              <h1>{view.mode === "create" ? "Create Sponsor" : form.companyName || "Sponsor Detail"}</h1>
              <p className="admin-muted">Manage sponsor profile, financial status, media assets and pipeline stage.</p>
            </div>
            <button className="admin-secondary-button" onClick={() => onNavigate("sponsors")}><X size={17} /> Close</button>
          </div>
        </section>

        {error && <div className="admin-error">{error}</div>}

        <section className="admin-panel">
          <form className="speaker-form sponsor-form" onSubmit={submitSponsor}>
            <div className="speaker-form-fields">
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
                {view.mode === "detail" && <button type="button" onClick={archiveSponsor}><Archive size={16} /> Archive</button>}
              </div>
            </div>
            <aside className="partner-preview">
              <span>{preview ? <img src={preview} alt="" /> : (form.companyName || "SP").slice(0, 2).toUpperCase()}</span>
              <strong>{form.companyName || "Sponsor"}</strong>
              <small>{tiers.find((tier) => String(tier.id) === String(form.tierId))?.name || "Unassigned tier"}</small>
            </aside>
          </form>
        </section>

        {detail && (
          <section className="payment-card-grid">
            <SummaryCard title="Deliverables" value={`${detail.deliverableCompletion || 0}%`} helper={`${detail.completedDeliverables}/${detail.totalDeliverables} completed`} icon={ListChecks} />
            <SummaryCard title="Contracts" value={detail.contracts?.length || 0} helper="Uploaded documents" icon={FileSignature} />
            <SummaryCard title="Invoices" value={detail.invoices?.length || 0} helper={money(detail.invoices?.reduce((sum, item) => sum + Number(item.amount || 0), 0))} icon={CircleDollarSign} />
            <SummaryCard title="Stalls" value={detail.stalls?.length || 0} helper={detail.stalls?.map((stall) => stall.stall_number).join(", ") || "No stall allocated"} icon={Store} />
          </section>
        )}
      </div>
    );
  }

  return (
    <div className="admin-speakers-page sponsor-workspace">
      <section className="admin-panel">
        <div className="speaker-page-top">
          <div>
            <p className="admin-eyebrow">Sponsorship CRM</p>
            <h1>Sponsors</h1>
            <p className="admin-muted">Track sponsor pipeline, revenue, contracts, deliverables and exhibitor allocation.</p>
          </div>
          <button className="admin-primary-button" onClick={() => onNavigate("sponsors-create")}><Plus size={18} /> Add Sponsor</button>
        </div>
        <div className="speaker-toolbar">
          <label className="speaker-search"><Search size={17} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search sponsors" /></label>
          <div className="speaker-filter-row">
            <button className={statusFilter === "all" ? "active" : ""} onClick={() => setStatusFilter("all")}>All</button>
            {pipeline.map(([key, label]) => <button key={key} className={statusFilter === key ? "active" : ""} onClick={() => setStatusFilter(key)}>{label}</button>)}
          </div>
        </div>
      </section>

      {error && <div className="admin-error">{error}</div>}

      <section className="admin-kpi-grid">
        <SummaryCard title="Total Sponsors" value={metrics.totalSponsors || 0} icon={Handshake} />
        <SummaryCard title="Confirmed" value={metrics.confirmedSponsors || 0} icon={Building2} />
        <SummaryCard title="Pending" value={metrics.pendingSponsors || 0} icon={ListChecks} />
        <SummaryCard title="Revenue" value={money(metrics.revenue)} icon={CircleDollarSign} />
        <SummaryCard title="Outstanding" value={money(metrics.outstanding)} icon={CircleDollarSign} />
        <SummaryCard title="Exhibitors" value={metrics.exhibitorsConfirmed || 0} icon={Store} />
        <SummaryCard title="Contracts Pending" value={metrics.contractsPending || 0} icon={FileSignature} />
        <SummaryCard title="Deliverables Pending" value={metrics.deliverablesPending || 0} icon={ListChecks} />
      </section>

      <section className="sponsor-pipeline">
        {pipeline.map(([key, label]) => (
          <article className="sponsor-pipeline-column" key={key}>
            <header><strong>{label}</strong><span>{pipelineSponsors[key]?.length || 0}</span></header>
            {(pipelineSponsors[key] || []).map((sponsor) => (
              <button className="sponsor-pipeline-card" key={sponsor.id} onClick={() => onNavigate(`sponsor-${sponsor.id}`)}>
                <strong>{sponsor.companyName}</strong>
                <span>{sponsor.tierName || "Unassigned"}</span>
                <small>{money(sponsor.contractValue)} · {sponsor.deliverableCompletion || 0}% deliverables</small>
              </button>
            ))}
          </article>
        ))}
      </section>

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
              <button onClick={() => onNavigate(`sponsor-${sponsor.id}`)}>Open</button>
            </div>
          </article>
        ))}
      </section>

      <section className="admin-panel">
        <h2>Recent Sponsorship Activity</h2>
        <div className="activity-feed">
          {activity.map((item) => <div key={item.id}><strong>{item.action?.replaceAll("_", " ")}</strong><span>{item.user_name || "System"} · {new Date(item.timestamp).toLocaleString()}</span></div>)}
          {!activity.length && <p className="admin-muted">No sponsorship activity yet.</p>}
        </div>
      </section>
    </div>
  );
}

function SummaryCard({ title, value, helper, icon: Icon }) {
  return <article className="admin-kpi-card"><Icon size={20} /><strong>{value}</strong><span>{title}</span>{helper && <small>{helper}</small>}</article>;
}

export default Sponsors;
