import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  AlertTriangle,
  Braces,
  CheckCircle2,
  ExternalLink,
  Eye,
  FileCode,
  Globe,
  Image as ImageIcon,
  Link2,
  Pencil,
  Plus,
  RefreshCw,
  Save,
  Search,
  Sparkles,
  Trash2,
  Wand2,
  X,
} from "lucide-react";

const SITE_URL = "https://ghc.gaims.org";
const TITLE_MAX = 65;

const KEY_ROUTES = {
  home: "/",
  register: "/register",
  "abstract-registration": "/abstract-registration",
  "abstract-revision": "/abstract-revision",
  nominations: "/nominations",
  committees: "/committees",
  venue: "/venue",
  about: "/about",
  "visa-application": "/visa-application",
  "board-meeting-register": "/board-meeting-register",
  "annual-meeting-invite": "/annual-meeting-invite",
  partnership: "/partnership",
  "verify-certificate": "/verify-certificate",
  "workshop-detail": "/workshops",
  "workshop-registration": "/register/workshop",
  "dynamic-form": "/forms",
  "google-pay-test": "/google-pay-test",
  admin: "/admin",
};

const STATIC_PAGE_KEYS = Object.keys(KEY_ROUTES);

const EMPTY_FORM = {
  page_key: "",
  seo_title: "",
  seo_description: "",
  seo_keywords: "",
  og_image: "",
  canonical_url: "",
  schema_markup: "",
};

const prettyKey = (key) =>
  String(key || "")
    .split(/[-_]/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");

const pageRoute = (key) => KEY_ROUTES[key] || `/pages/${key}`;

const isValidJson = (value) => {
  const text = String(value || "").trim();
  if (!text) return true;
  try {
    JSON.parse(text);
    return true;
  } catch {
    return false;
  }
};

const prettifyJson = (value) => {
  const text = String(value || "").trim();
  if (!text) return "";
  try {
    return JSON.stringify(JSON.parse(text), null, 2);
  } catch {
    return text;
  }
};

const baseEventSchema = (route) => ({
  "@context": "https://schema.org",
  "@type": "Event",
  "@id": `${SITE_URL}${route.length > 1 ? route.replace(/\/+$/, "") : "/"}#event`,
  name: "Global Healthcare Conclave 2026",
  startDate: "2026-11-22",
  endDate: "2026-11-24",
  eventStatus: "https://schema.org/EventScheduled",
  eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
  location: {
    "@type": "Place",
    name: "All India Institute of Medical Sciences (AIIMS), New Delhi",
    address: { "@type": "PostalAddress", addressLocality: "New Delhi", addressRegion: "Delhi", addressCountry: "IN" },
  },
  organizer: { "@type": "Organization", name: "GAIMS", url: SITE_URL },
  url: `${SITE_URL}${route}`,
});

const stripProtocol = (url) => String(url || "").replace(/^https?:\/\//, "").replace(/\/+$/, "");

const computeChecks = (item) => {
  const title = String(item?.seo_title || "").trim();
  const description = String(item?.seo_description || "").trim();
  const checks = {
    title: title.length >= 30 && title.length <= TITLE_MAX,
    description: description.length >= 50 && description.length <= 160,
    keywords: Boolean(String(item?.seo_keywords || "").trim()),
    image: Boolean(String(item?.og_image || "").trim()),
    canonical: Boolean(String(item?.canonical_url || "").trim()),
    schema: isValidJson(item?.schema_markup),
  };
  const passed = Object.values(checks).filter(Boolean).length;
  const total = Object.keys(checks).length;
  const score = Math.round((passed / total) * 100);
  return { checks, passed, total, score };
};

const meterState = (value, min, max) => {
  const length = String(value || "").length;
  if (length === 0) return { state: "empty", pct: 0 };
  if (length < min) return { state: "low", pct: Math.min(100, (length / max) * 100) };
  if (length <= max) return { state: "good", pct: (length / max) * 100 };
  return { state: "long", pct: 100 };
};

const metricColor = (score) => (score >= 80 ? "var(--ghc-success)" : score >= 55 ? "var(--ghc-warning)" : "var(--ghc-danger)");

function ScoreRing({ score, size = 46 }) {
  const radius = (size - 8) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  const color = metricColor(score);
  return (
    <div className="seo-ring" style={{ width: size, height: size }} title={`SEO score ${score}/100`}>
      <svg width={size} height={size} role="img" aria-label={`SEO score ${score} out of 100`}>
        <circle cx={size / 2} cy={size / 2} r={radius} stroke="var(--ghc-border)" strokeWidth="4.5" fill="none" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth="4.5"
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          style={{ transition: "stroke-dashoffset 420ms ease, stroke 420ms ease" }}
        />
      </svg>
      <span style={{ color }}>{score}</span>
    </div>
  );
}

function ChoiceChip({ label, active, onClick, count }) {
  return (
    <button type="button" className={`seo-filter-chip${active ? " active" : ""}`} onClick={onClick}>
      {label}
      {count !== undefined && <span className="seo-filter-count">{count}</span>}
    </button>
  );
}

function KeywordInput({ value, onChange }) {
  const [draft, setDraft] = useState("");
  const keywords = String(value || "").split(",").map((part) => part.trim()).filter(Boolean);

  const commitDraft = () => {
    const pushed = draft.trim().replace(/,$/, "").trim();
    if (!pushed) return;
    const next = keywords.includes(pushed) ? keywords : [...keywords, pushed];
    onChange(next.join(", "));
    setDraft("");
  };

  const handleKeyDown = (event) => {
    if (event.key === "Enter" || event.key === ",") {
      event.preventDefault();
      commitDraft();
    } else if (event.key === "Backspace" && !draft && keywords.length) {
      onChange(keywords.slice(0, -1).join(", "));
    }
  };

  const removeKeyword = (keyword) => {
    onChange(keywords.filter((item) => item !== keyword).join(", "));
  };

  return (
    <div className={`seo-keyword-field${keywords.length ? " has-chips" : ""}`}>
      <div className="seo-keyword-chips">
        {keywords.map((keyword) => (
          <span className="seo-keyword-chip" key={keyword}>
            {keyword}
            <button type="button" onClick={() => removeKeyword(keyword)} aria-label={`Remove ${keyword}`}>
              <X size={11} />
            </button>
          </span>
        ))}
        <input
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={commitDraft}
          placeholder="Type a keyword and press Enter"
        />
      </div>
    </div>
  );
}

function SeoManagement({ api }) {
  const [items, setItems] = useState([]);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editing, setEditing] = useState(null);
  const [asset, setAsset] = useState(null);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setError("");
    try {
      const params = search ? `?search=${encodeURIComponent(search)}` : "";
      const response = await api.get(`/api/marketing/seo${params}`);
      const nextItems = response.data.items || [];
      setItems(nextItems);
      return nextItems;
    } catch (err) {
      setError(err.response?.data?.message || "Unable to load SEO pages.");
      return null;
    }
  }, [api, search]);

  useEffect(() => {
    const timer = setTimeout(load, 200);
    return () => clearTimeout(timer);
  }, [load]);

  const openEdit = (item) => {
    setEditing(item);
    setForm({ ...EMPTY_FORM, ...item });
    setMessage("");
    setError("");
    setDirty(false);
    setAsset(null);
  };

  const resetForm = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setDirty(false);
    setAsset(null);
    setMessage("");
    setError("");
  };

  const updateField = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
    setDirty(true);
  };

  const selectStaticKey = (key) => {
    const item = items.find((entry) => entry?.page_key === key);
    if (item) {
      openEdit(item);
      return;
    }
    setEditing(null);
    setForm({
      ...EMPTY_FORM,
      page_key: key,
      canonical_url: `${SITE_URL}${pageRoute(key)}`,
    });
    setDirty(true);
    setMessage("");
    setError("");
  };

  const applySchema = () => {
    let route = pageRoute(form.page_key);
    if (!route.startsWith("/")) route = `/${route}`;
    updateField("schema_markup", JSON.stringify(baseEventSchema(route), null, 2));
  };

  const submit = async () => {
    if (!form.page_key?.trim()) {
      setError("Page key is required before saving.");
      return;
    }
    const schemaText = String(form.schema_markup || "").trim();
    if (schemaText && !isValidJson(schemaText)) {
      setError("Schema markup must be valid JSON (or leave it empty).");
      return;
    }
    setError("");
    setSaving(true);
    try {
      const payload = new FormData();
      Object.entries(form).forEach(([field, value]) => {
        if (value !== undefined && value !== null && value !== "") payload.append(field, value);
      });
      if (asset) payload.append("asset", asset);
      if (editing?.id) {
        await api.put(`/api/marketing/seo/${editing.id}`, payload);
      } else {
        await api.post("/api/marketing/seo", payload);
      }
      setMessage(editing?.id ? "SEO settings updated and published." : "New page added to the SEO map.");
      setDirty(false);
      setAsset(null);
      if (!editing) {
        const nextItems = await load();
        const match = (nextItems || []).find((entry) => entry?.page_key === form.page_key);
        if (match) openEdit(match);
      } else {
        await load();
      }
    } catch (err) {
      setError(err.response?.data?.message || "Unable to save SEO settings.");
    } finally {
      setSaving(false);
    }
  };

  const removeEntry = async (entry) => {
    if (!window.confirm(`Delete SEO entry for "${entry.page_key}"? This does not remove the page itself.`)) return;
    setError("");
    try {
      await api.delete(`/api/marketing/seo/${entry.id}`);
      if (editing?.id === entry.id) resetForm();
      await load();
      setMessage("SEO entry deleted.");
    } catch (err) {
      setError(err.response?.data?.message || "Unable to delete SEO entry.");
    }
  };

  const list = useMemo(() => {
    let result = items;
    if (filter === "optimized") result = items.filter((item) => computeChecks(item).passed >= 5);
    if (filter === "attention") result = items.filter((item) => computeChecks(item).passed <= 3);
    return result;
  }, [items, filter]);

  const stats = useMemo(() => {
    const all = items.length || 1;
    const optimized = items.filter((item) => computeChecks(item).passed >= 5).length;
    const attention = items.filter((item) => computeChecks(item).passed <= 3).length;
    const avg = Math.round(items.reduce((sum, item) => sum + computeChecks(item).score, 0) / all);
    return { optimized, attention, avg };
  }, [items]);

  const draftChecks = useMemo(() => computeChecks(form), [form]);
  const titleMeter = meterState(form.seo_title, 30, TITLE_MAX);
  const descMeter = meterState(form.seo_description, 50, 160);
  const schemaValid = isValidJson(form.schema_markup);
  const previewUrl = form.canonical_url || `${SITE_URL}${pageRoute(form.page_key)}`;
  const truncatedTitle = String(form.seo_title || "").slice(0, TITLE_MAX);
  const truncatedDesc = String(form.seo_description || "").slice(0, 160);

  return (
    <div className="admin-speakers-page seo-page">
      <header className="seo-hero">
        <div className="seo-hero-copy">
          <p className="admin-eyebrow">
            <Sparkles size={14} /> Marketing · Search Engine Optimisation
          </p>
          <h1>SEO Management</h1>
          <p className="admin-muted">
            Optimise how every page appears in Google, WhatsApp and social shares. Changes go live instantly — no redeploy needed.
          </p>
        </div>
        <div className="seo-hero-actions">
          <button type="button" className="admin-secondary-button" onClick={load} title="Reload from server">
            <RefreshCw size={15} /> Sync
          </button>
          <button type="button" className="admin-primary-button" onClick={resetForm}>
            <Plus size={15} /> New page
          </button>
        </div>
      </header>

      <section className="payment-kpi-grid seo-stats">
        <article className="seo-stat">
          <span className="seo-stat-icon">
            <Globe size={17} />
          </span>
          <div>
            <strong>{items.length}</strong>
            <span>Pages tracked</span>
          </div>
        </article>
        <article className={`seo-stat ${stats.avg >= 80 ? "good" : stats.avg >= 55 ? "warn" : "bad"}`}>
          <span className="seo-stat-icon">
            <TrendIndicator score={stats.avg} />
          </span>
          <div>
            <strong>{stats.avg}/100</strong>
            <span>Average score</span>
          </div>
        </article>
        <article className="seo-stat good">
          <span className="seo-stat-icon">
            <CheckCircle2 size={17} />
          </span>
          <div>
            <strong>{stats.optimized}</strong>
            <span>Optimised</span>
          </div>
        </article>
        <article className="seo-stat bad">
          <span className="seo-stat-icon">
            <AlertTriangle size={17} />
          </span>
          <div>
            <strong>{stats.attention}</strong>
            <span>Need attention</span>
          </div>
        </article>
      </section>

      <div className="seo-main">
        <aside className="seo-list-pane">
          <div className="seo-list-head">
            <div className="seo-search">
              <Search size={15} />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Filter pages…"
              />
            </div>
            <div className="seo-filter-row">
              <ChoiceChip label="All" count={items.length} active={filter === "all"} onClick={() => setFilter("all")} />
              <ChoiceChip label="Optimised" active={filter === "optimized"} onClick={() => setFilter("optimized")} />
              <ChoiceChip label="Needs work" active={filter === "attention"} onClick={() => setFilter("attention")} />
            </div>
          </div>
          <div className="seo-list">
            {list.map((entry) => {
              const checks = computeChecks(entry);
              const active = editing?.id === entry.id;
              return (
                <article
                  key={entry.id || entry.page_key}
                  className={`seo-list-item${active ? " active" : ""}`}
                  onClick={() => openEdit(entry)}
                >
                  <ScoreRing score={checks.score} />
                  <div className="seo-list-body">
                    <strong>{prettyKey(entry.page_key)}</strong>
                    <span className="seo-path">
                      <Globe size={11} /> {SITE_URL}
                      {pageRoute(entry.page_key)}
                    </span>
                    <p>{String(entry.seo_title || "No page title set yet.").slice(0, 70)}</p>
                    <div className="seo-tags">
                      {entry.seo_keywords
                        ? String(entry.seo_keywords).split(",").map((item) => item.trim()).filter(Boolean).slice(0, 2).map((kw) => (
                            <span key={kw}>{kw}</span>
                          ))
                        : null}
                    </div>
                  </div>
                  <div className="seo-list-actions">
                    <button
                      type="button"
                      className="admin-icon-button"
                      title="Edit"
                      onClick={(event) => {
                        event.stopPropagation();
                        openEdit(entry);
                      }}
                    >
                      <Pencil size={14} />
                    </button>
                    <button
                      type="button"
                      className="admin-icon-button danger"
                      title="Delete entry"
                      onClick={(event) => {
                        event.stopPropagation();
                        removeEntry(entry);
                      }}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </article>
              );
            })}
            {!list.length ? (
              <div className="admin-empty-state">
                <Search size={26} />
                <p>No pages match your search.</p>
                <span className="admin-muted">Try a different keyword or clear the filter.</span>
              </div>
            ) : null}
          </div>
        </aside>

        <section className="seo-editor-pane">
          <div className="seo-editor-head">
            <div>
              <h2>
                {editing ? (
                  <>
                    <Pencil size={15} /> {prettyKey(editing.page_key)}
                  </>
                ) : (
                  <>
                    <Plus size={15} /> New page
                  </>
                )}
              </h2>
              <p className="admin-muted">
                {editing
                  ? `Last updated ${new Date(editing.updated_at).toLocaleString() || "—"}`
                  : "Pick a known page or enter a custom key."}
              </p>
            </div>
            {!editing && (
              <div className="seo-key-picker">
                <label htmlFor="seo-static-key">Quick start</label>
                <select
                  id="seo-static-key"
                  value=""
                  onChange={(event) => event.target.value && selectStaticKey(event.target.value)}
                >
                  <option value="">Choose a page…</option>
                  {STATIC_PAGE_KEYS.map((key) => (
                    <option key={key} value={key}>
                      {prettyKey(key)} · {pageRoute(key)}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          <div className="seo-editor-body">
            <div className="seo-form-grid">
              <label className="seo-field seo-field-wide">
                <span className="seo-label">
                  Page key <em>required</em>
                </span>
                <input
                  value={form.page_key}
                  onChange={(event) => updateField("page_key", event.target.value)}
                  placeholder="e.g. abstracts-awards"
                  list="seo-known-keys"
                />
                <datalist id="seo-known-keys">
                  {STATIC_PAGE_KEYS.map((key) => (
                    <option key={key} value={key} />
                  ))}
                </datalist>
                <small>Lowercase, dashes not spaces. Matched automatically when a visitor lands on that route.</small>
              </label>

              <div className="seo-live-score">
                <ScoreRing score={draftChecks.score} size={58} />
                <div>
                  <strong>{draftChecks.passed}/{draftChecks.total} checks</strong>
                  <span className={`seo-status-text ${draftChecks.score >= 80 ? "good" : draftChecks.score >= 55 ? "warn" : "bad"}`}>
                    {draftChecks.score >= 80 ? "Ready to rank" : draftChecks.score >= 55 ? "Almost optimised" : "Needs work"}
                  </span>
                </div>
              </div>

              <label className="seo-field seo-field-wide">
                <span className="seo-label">
                  <span>
                    <Eye size={13} /> SEO title
                  </span>
                  <span className={`seo-count ${titleMeter.state}`}>
                    {form.seo_title?.length || 0} / {TITLE_MAX}
                  </span>
                </span>
                <input
                  value={form.seo_title}
                  onChange={(event) => updateField("seo_title", event.target.value)}
                  placeholder="Clear, keyword-first title under 65 characters"
                />
                <span className={`seo-meter`}>
                  <i className={titleMeter.state} style={{ width: `${titleMeter.pct}%` }} />
                </span>
                <small className={titleMeter.state === "long" ? "seo-err" : ""}>
                  {titleMeter.state === "long"
                    ? "Too long — Google will cut it off in results."
                    : titleMeter.state === "low"
                    ? "Aim for 30+ characters for better ranking."
                    : "Great length for search results."}
                </small>
              </label>

              <label className="seo-field seo-field-wide">
                <span className="seo-label">
                  <span>
                    <FileCode size={13} /> Meta description
                  </span>
                  <span className={`seo-count ${descMeter.state}`}>
                    {form.seo_description?.length || 0} / 160
                  </span>
                </span>
                <textarea
                  value={form.seo_description}
                  onChange={(event) => updateField("seo_description", event.target.value)}
                  placeholder="A compelling 50–160 character summary that earns the click"
                  rows={3}
                />
                <span className="seo-meter">
                  <i className={descMeter.state} style={{ width: `${descMeter.pct}%` }} />
                </span>
                <small className={descMeter.state === "long" ? "seo-err" : ""}>
                  {descMeter.state === "long"
                    ? "Over 160 characters — search engines will truncate this."
                    : descMeter.state === "low"
                    ? "Aim for at least 50 characters."
                    : "Ideal length."}
                </small>
              </label>

              <label className="seo-field seo-field-wide">
                <span className="seo-label">
                  <span>
                    <TagIcon size={13} /> Keywords
                  </span>
                  <span className="seo-hint">comma separated</span>
                </span>
                <KeywordInput value={form.seo_keywords} onChange={(value) => updateField("seo_keywords", value)} />
              </label>

              <label className="seo-field">
                <span className="seo-label">
                  <span>
                    <Link2 size={13} /> Canonical URL
                  </span>
                </span>
                <input
                  value={form.canonical_url}
                  onChange={(event) => updateField("canonical_url", event.target.value)}
                  placeholder={`${SITE_URL}/…`}
                />
                <small>Signals the preferred URL to Google.</small>
              </label>

              <label className="seo-field">
                <span className="seo-label">
                  <span>
                    <ImageIcon size={13} /> Social share image
                  </span>
                </span>
                <input
                  value={form.og_image}
                  onChange={(event) => updateField("og_image", event.target.value)}
                  placeholder="https://…/share.png"
                />
                <input
                  type="file"
                  accept="image/*"
                  onChange={(event) => setAsset(event.target.files?.[0] || null)}
                  className="seo-file"
                />
                {asset ? <small className="seo-ok">Will upload: {asset.name}</small> : <small>1200 × 630 works best.</small>}
              </label>

              {form.og_image ? (
                <div className="seo-field seo-field-wide seo-og-preview">
                  <span className="seo-label">
                    <span>
                      <ImageIcon size={13} /> Preview
                    </span>
                  </span>
                  <img src={form.og_image} alt="OG thumbnail preview" onError={(event) => event.currentTarget.classList.add("broken")} />
                </div>
              ) : null}

              <div className="seo-field seo-field-wide">
                <div className="seo-label seo-schema-head">
                  <span>
                    <Braces size={13} /> Structured data (JSON-LD)
                  </span>
                  <div className="seo-schema-tools">
                    <button type="button" onClick={applySchema} title="Insert Event schema for this page">
                      <Sparkles size={12} /> Insert Event schema
                    </button>
                    <button type="button" onClick={() => updateField("schema_markup", prettifyJson(form.schema_markup))} title="Format JSON">
                      <Wand2 size={12} /> Format
                    </button>
                  </div>
                </div>
                <textarea
                  value={form.schema_markup}
                  onChange={(event) => updateField("schema_markup", event.target.value)}
                  placeholder="{ &quot;@context&quot;: &quot;https://schema.org&quot;, … }"
                  rows={8}
                  spellCheck={false}
                  className={`seo-json${schemaValid ? "" : " invalid"}`}
                />
                <small className={schemaValid ? "seo-ok" : "seo-err"}>
                  {form.schema_markup?.trim() ? (schemaValid ? "Valid JSON-LD — Google will parse this." : "Invalid JSON — fix before saving.") : "No schema yet. Insert the Event schema for rich results."}
                </small>
              </div>

              <div className="seo-goog-preview seo-field-wide">
                <span className="seo-label">
                  <span>
                    <Search size={13} /> Google result preview
                  </span>
                </span>
                <div className="seo-goog">
                  <div className="seo-goog-bar">
                    <i />
                    <i />
                    <i />
                    <span>
                      <LockIcon /> ghc.gaims.org
                    </span>
                  </div>
                  <div className="seo-goog-url">{stripProtocol(previewUrl)}</div>
                  <a href={previewUrl} target="_blank" rel="noreferrer" className="seo-goog-title">
                    {truncatedTitle || "Your SEO title appears here…"}
                  </a>
                  <p>
                    {truncatedDesc || "Your meta description appears here. Write something that makes people want to click."}
                  </p>
                  {form.og_image ? <img src={form.og_image} alt="" className="seo-goog-thumb" onError={(event) => event.currentTarget.style.display = "none"} /> : null}
                </div>
                <a className="seo-open-link" href={previewUrl} target="_blank" rel="noreferrer">
                  <ExternalLink size={12} /> Open live page
                </a>
              </div>
            </div>

            <div className="seo-editor-actions">
              {editing ? (
                <button type="button" className="admin-danger-button" onClick={() => removeEntry(editing)}>
                  <Trash2 size={15} /> Delete
                </button>
              ) : null}
              <button type="button" className="admin-secondary-button" onClick={resetForm} disabled={!dirty && !editing}>
                Discard
              </button>
              <button
                type="button"
                className="admin-primary-button"
                onClick={submit}
                disabled={saving}
              >
                <Save size={15} /> {saving ? "Saving…" : editing ? "Save changes" : "Add page"}
              </button>
            </div>
          </div>
        </section>
      </div>

      {message ? (
        <div className="seo-toast success">
          <CheckCircle2 size={17} /> {message}
          <button type="button" onClick={() => setMessage("")} aria-label="Dismiss">
            <X size={14} />
          </button>
        </div>
      ) : null}
      {error ? (
        <div className="seo-toast error">
          <AlertCircle size={17} /> {error}
          <button type="button" onClick={() => setError("")} aria-label="Dismiss">
            <X size={14} />
          </button>
        </div>
      ) : null}
    </div>
  );
}

function TagIcon({ size = 14 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2H2v10l9.29 9.29a1 1 0 0 0 1.42 0l8.58-8.58a1 1 0 0 0 0-1.42L12 2z" />
      <circle cx="7.5" cy="7.5" r="1" fill="currentColor" />
    </svg>
  );
}

function LockIcon() {
  return (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="11" width="18" height="11" rx="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  );
}

function TrendIndicator({ score }) {
  return score >= 80 ? <CheckCircle2 size={18} /> : score >= 55 ? <AlertTriangle size={18} /> : <AlertCircle size={18} />;
}

export default SeoManagement;