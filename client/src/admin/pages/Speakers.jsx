import { useCallback, useEffect, useMemo, useState } from "react";
import { Plus, Search, Filter, Sparkles, X, Users } from "lucide-react";
import SpeakerCard from "../components/speakers/SpeakerCard";
import SpeakerForm from "../components/speakers/SpeakerForm";
import SpeakerTable from "../components/speakers/SpeakerTable";

function Speakers({ api }) {
  const [speakers, setSpeakers] = useState([]);
  const [editingSpeaker, setEditingSpeaker] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState("");
  const [sectionFilter, setSectionFilter] = useState("all"); // 'all' | 'current' | 'past'
  const [statusFilter, setStatusFilter] = useState("all");
  const [tierFilter, setTierFilter] = useState("all"); // 'all' | 'featured' | 'keynote'

  const loadSpeakers = useCallback(() => {
    api.get("/api/speakers?admin=1").then((response) => setSpeakers(response.data.speakers || []));
  }, [api]);

  useEffect(() => {
    loadSpeakers();
  }, [loadSpeakers]);

  // Compute counts for the segmented control
  const counts = useMemo(() => {
    const total = speakers.length;
    const current = speakers.filter((s) => s.speakerType === "current" || !s.speakerType).length;
    const past = speakers.filter((s) => s.speakerType === "past").length;
    return { total, current, past };
  }, [speakers]);

  const filteredSpeakers = useMemo(() => {
    return speakers.filter((speaker) => {
      const isCurrent = speaker.speakerType === "current" || !speaker.speakerType;
      const isPast = speaker.speakerType === "past";

      // 1. Section filter (Current vs Past vs All)
      if (sectionFilter === "current" && !isCurrent) return false;
      if (sectionFilter === "past" && !isPast) return false;

      // 2. Status filter
      if (statusFilter !== "all" && speaker.status !== statusFilter) return false;

      // 3. Tier / Badge filter
      if (tierFilter === "featured" && !speaker.featured) return false;
      if (tierFilter === "keynote" && !speaker.keynote) return false;

      // 4. Text search
      if (search.trim()) {
        const query = search.toLowerCase();
        const haystack = [
          speaker.name,
          speaker.designation,
          speaker.institution,
          speaker.topic,
          speaker.achievements,
          speaker.bio,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();

        if (!haystack.includes(query)) return false;
      }

      return true;
    });
  }, [speakers, sectionFilter, statusFilter, tierFilter, search]);

  const hasActiveFilters = search.trim() !== "" || sectionFilter !== "all" || statusFilter !== "all" || tierFilter !== "all";

  const resetFilters = () => {
    setSearch("");
    setSectionFilter("all");
    setStatusFilter("all");
    setTierFilter("all");
  };

  const openForm = (speaker = null) => {
    setEditingSpeaker(speaker);
    setShowForm(true);
    // Smooth scroll into view of form
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const closeForm = () => {
    setEditingSpeaker(null);
    setShowForm(false);
  };

  const submitSpeaker = async (form, photo) => {
    const formData = new FormData();
    Object.entries(form).forEach(([key, value]) => {
      if (value !== undefined && value !== null) formData.append(key, value);
    });
    if (photo) formData.append("photo", photo);

    if (editingSpeaker?.id) {
      await api.put(`/api/speakers/${editingSpeaker.id}`, formData);
    } else {
      await api.post("/api/speakers", formData);
    }

    closeForm();
    loadSpeakers();
  };

  const deleteSpeaker = async (speaker) => {
    if (!window.confirm(`Delete ${speaker.name}?`)) return;
    await api.delete(`/api/speakers/${speaker.id}`);
    loadSpeakers();
  };

  const publishSpeaker = async (speaker) => {
    await api.patch(`/api/speakers/${speaker.id}/publish`);
    loadSpeakers();
  };

  const toggleFeature = async (speaker) => {
    await api.put(`/api/speakers/${speaker.id}`, { ...speaker, featured: !speaker.featured });
    loadSpeakers();
  };

  const currentSpeakers = useMemo(() => {
    return filteredSpeakers.filter((s) => s.speakerType === "current" || !s.speakerType);
  }, [filteredSpeakers]);

  const legacySpeakers = useMemo(() => {
    return filteredSpeakers.filter((s) => s.speakerType === "past");
  }, [filteredSpeakers]);

  return (
    <div className="admin-speakers-page">
      <section className="admin-panel">
        <div className="speaker-page-top">
          <div>
            <p className="admin-eyebrow">Speaker CMS</p>
            <h1>Speaker Management</h1>
            <p className="admin-muted">Manage profiles, social links, documents, travel readiness, sessions and public speaker sync.</p>
          </div>
          <button className="admin-primary-button" onClick={() => openForm()}>
            <Plus size={18} />
            Add Speaker
          </button>
        </div>

        {/* Modern Proper Filter Toolbar */}
        <div className="speaker-toolbar-v2">
          {/* Top Row: Search and Section Segmented Control */}
          <div className="speaker-toolbar-row-top">
            <div className="speaker-search-box">
              <Search size={18} style={{ color: "#94A3B8", flexShrink: 0 }} />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search by name, topic, institution, achievements..."
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  style={{ background: "transparent", border: "none", cursor: "pointer", color: "#94A3B8", display: "flex", alignItems: "center" }}
                  title="Clear search"
                >
                  <X size={16} />
                </button>
              )}
            </div>

            {/* Segmented Control for Edition */}
            <div className="speaker-segmented-control" role="tablist">
              <button
                type="button"
                className={`speaker-segmented-btn ${sectionFilter === "all" ? "active" : ""}`}
                onClick={() => setSectionFilter("all")}
              >
                <span>All Speakers</span>
                <span className="badge-count">{counts.total}</span>
              </button>
              <button
                type="button"
                className={`speaker-segmented-btn ${sectionFilter === "current" ? "active" : ""}`}
                onClick={() => setSectionFilter("current")}
              >
                <span>Current (GHC 2026)</span>
                <span className="badge-count">{counts.current}</span>
              </button>
              <button
                type="button"
                className={`speaker-segmented-btn ${sectionFilter === "past" ? "active" : ""}`}
                onClick={() => setSectionFilter("past")}
              >
                <span>Legacy Speakers</span>
                <span className="badge-count">{counts.past}</span>
              </button>
            </div>
          </div>

          {/* Bottom Row: Detailed Dropdown Filters & Status Meta */}
          <div className="speaker-toolbar-row-bottom">
            <div className="speaker-dropdown-group">
              {/* Status Select */}
              <div className={`speaker-filter-select-wrap ${statusFilter !== "all" ? "has-value" : ""}`}>
                <Filter size={14} style={{ color: statusFilter !== "all" ? "var(--ghc-primary)" : "#64748B" }} />
                <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                  <option value="all">All Statuses</option>
                  <option value="published">Published</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="draft">Draft</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>

              {/* Tier / Role Select */}
              <div className={`speaker-filter-select-wrap ${tierFilter !== "all" ? "has-value" : ""}`}>
                <Sparkles size={14} style={{ color: tierFilter !== "all" ? "var(--ghc-primary)" : "#64748B" }} />
                <select value={tierFilter} onChange={(e) => setTierFilter(e.target.value)}>
                  <option value="all">All Tiers & Badges</option>
                  <option value="featured">Featured Speakers</option>
                  <option value="keynote">Keynote Speakers</option>
                </select>
              </div>

              {/* Clear filters button */}
              {hasActiveFilters && (
                <button type="button" className="speaker-clear-btn" onClick={resetFilters}>
                  <X size={13} />
                  Clear filters
                </button>
              )}
            </div>

            {/* Results counter */}
            <div style={{ fontSize: "0.84rem", color: "#64748B", fontWeight: 500 }}>
              Showing <strong style={{ color: "#0F172A", fontWeight: 700 }}>{filteredSpeakers.length}</strong> of {speakers.length} speakers
            </div>
          </div>
        </div>
      </section>

      {showForm && (
        <section className="admin-panel" style={{ marginTop: "1.5rem" }}>
          <SpeakerForm key={editingSpeaker?.id || "new-speaker"} speaker={editingSpeaker} onSubmit={submitSpeaker} onCancel={closeForm} />
        </section>
      )}

      {/* LINE 1: Current Speakers Section */}
      {(sectionFilter === "all" || sectionFilter === "current") && currentSpeakers.length > 0 && (
        <div style={{ marginTop: "1.75rem" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.85rem" }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <h2 style={{ fontSize: "1.15rem", fontWeight: 800, color: "#0F172A", margin: 0 }}>Current Speakers (GHC 2026)</h2>
                <span style={{ fontSize: "0.75rem", fontWeight: 700, padding: "2px 8px", borderRadius: "999px", background: "#e0f2fe", color: "#0369a1" }}>
                  {currentSpeakers.length} active
                </span>
              </div>
              <p style={{ fontSize: "0.82rem", color: "#64748B", margin: "0.2rem 0 0" }}>
                Active conclave keynote speakers, chairs, and scheduled clinical session leaders.
              </p>
            </div>
          </div>
          <section className="speaker-card-row">
            {currentSpeakers.map((speaker) => (
              <SpeakerCard key={speaker.id} speaker={speaker} onEdit={openForm} />
            ))}
          </section>
        </div>
      )}

      {/* LINE 2: Legacy Speakers Section */}
      {(sectionFilter === "all" || sectionFilter === "past") && legacySpeakers.length > 0 && (
        <div style={{ marginTop: "2rem" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.85rem" }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <h2 style={{ fontSize: "1.15rem", fontWeight: 800, color: "#0F172A", margin: 0 }}>Legacy Speakers</h2>
                <span style={{ fontSize: "0.75rem", fontWeight: 700, padding: "2px 8px", borderRadius: "999px", background: "#ede9fe", color: "#6d28d9" }}>
                  {legacySpeakers.length} legacy
                </span>
              </div>
              <p style={{ fontSize: "0.82rem", color: "#64748B", margin: "0.2rem 0 0" }}>
                Distinguished medical luminaries, past chairs, and faculty from previous conclave editions.
              </p>
            </div>
          </div>
          <section className="speaker-card-row">
            {legacySpeakers.map((speaker) => (
              <SpeakerCard key={speaker.id} speaker={speaker} onEdit={openForm} />
            ))}
          </section>
        </div>
      )}

      {/* Table Section */}
      <section className="admin-panel" style={{ marginTop: "2rem" }}>
        {filteredSpeakers.length === 0 ? (
          <div style={{ textAlign: "center", padding: "3rem 1rem", color: "#64748B" }}>
            <Users size={40} style={{ margin: "0 auto 1rem", color: "#CBD5E1", strokeWidth: 1.5 }} />
            <h3 style={{ fontSize: "1.1rem", fontWeight: 700, color: "#1E293B", marginBottom: "0.4rem" }}>No speakers found</h3>
            <p style={{ fontSize: "0.88rem", maxWidth: "24rem", margin: "0 auto 1.25rem" }}>
              No speakers matched your current search and filter criteria.
            </p>
            {hasActiveFilters && (
              <button type="button" className="speaker-btn-secondary" onClick={resetFilters}>
                Reset all filters
              </button>
            )}
          </div>
        ) : sectionFilter === "all" ? (
          <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
            {currentSpeakers.length > 0 && (
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.85rem" }}>
                  <h3 style={{ fontSize: "1.05rem", fontWeight: 700, color: "#0F172A", margin: 0 }}>Current Speakers Directory</h3>
                  <span style={{ fontSize: "0.72rem", fontWeight: 700, padding: "2px 8px", borderRadius: "999px", background: "#e0f2fe", color: "#0369a1" }}>
                    {currentSpeakers.length}
                  </span>
                </div>
                <SpeakerTable speakers={currentSpeakers} onEdit={openForm} onDelete={deleteSpeaker} onPublish={publishSpeaker} onFeature={toggleFeature} />
              </div>
            )}

            {legacySpeakers.length > 0 && (
              <div style={{ borderTop: "1px solid #F1F5F9", paddingTop: "1.75rem" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.85rem" }}>
                  <h3 style={{ fontSize: "1.05rem", fontWeight: 700, color: "#0F172A", margin: 0 }}>Legacy Speakers Directory</h3>
                  <span style={{ fontSize: "0.72rem", fontWeight: 700, padding: "2px 8px", borderRadius: "999px", background: "#ede9fe", color: "#6d28d9" }}>
                    {legacySpeakers.length}
                  </span>
                </div>
                <SpeakerTable speakers={legacySpeakers} onEdit={openForm} onDelete={deleteSpeaker} onPublish={publishSpeaker} onFeature={toggleFeature} />
              </div>
            )}
          </div>
        ) : (
          <SpeakerTable speakers={filteredSpeakers} onEdit={openForm} onDelete={deleteSpeaker} onPublish={publishSpeaker} onFeature={toggleFeature} />
        )}
      </section>
    </div>
  );
}

export default Speakers;

