import { AlertCircle, CheckCircle2, ExternalLink, Handshake, RefreshCcw, Save, Sparkles, Trash2 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

const getOrgLogo = (name) => {
  const lower = name.toLowerCase();
  if (lower.includes("aiims")) return "/assets/logos/aiimsstudentassociation.jpg";
  if (lower.includes("gaims")) return "/assets/logos/gaims.png";
  if (lower.includes("faima")) return "/assets/logos/faima.jpg";
  if (lower.includes("afpi")) return "/assets/logos/afpi.png";
  if (lower.includes("ircf")) return "/assets/logos/ircf.jpg";
  if (lower.includes("aeme")) return "/assets/logos/aeme.jpg";
  if (lower.includes("gjms")) return "/assets/logos/GJMS logo.png";
  if (lower.includes("smr")) return "/assets/logos/SMR.jpeg";
  return null;
};

function AdminCollaboration({ api }) {
  const [collaboratingOrg, setCollaboratingOrg] = useState("");
  const [savedOrg, setSavedOrg] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const loadSettings = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await api.get("/api/settings");
      const currentOrg = response.data?.settings?.conference?.collaboratingOrg || "";
      setCollaboratingOrg(currentOrg);
      setSavedOrg(currentOrg);
    } catch (err) {
      setError(err.response?.data?.message || "Unable to load collaboration settings.");
    } finally {
      setLoading(false);
    }
  }, [api]);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  const saveCollaboration = async (newVal = collaboratingOrg) => {
    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const currentRes = await api.get("/api/settings");
      const currentSettings = currentRes.data?.settings || {};

      const updatedSettings = {
        ...currentSettings,
        conference: {
          ...currentSettings.conference,
          collaboratingOrg: newVal.trim(),
        },
      };

      await api.put("/api/settings", updatedSettings);

      // Also sync to cms-controls if available
      try {
        const cmsRes = await api.get("/api/super-admin/cms-controls");
        const currentControls = cmsRes.data?.controls || {};
        await api.put("/api/super-admin/cms-controls", {
          controls: {
            ...currentControls,
            hero: {
              ...(currentControls.hero || {}),
              collaboratingOrg: newVal.trim(),
            },
          },
        });
      } catch (_) {}

      setCollaboratingOrg(newVal.trim());
      setSavedOrg(newVal.trim());
      setSuccess(
        newVal.trim()
          ? "Collaborating organisation saved! It will now be displayed on the homepage hero."
          : "Collaboration cleared! The section is now hidden from the homepage hero."
      );
    } catch (err) {
      setError(err.response?.data?.message || "Failed to save collaboration settings.");
    } finally {
      setSaving(false);
    }
  };

  const clearCollaboration = async () => {
    if (!window.confirm("Remove collaborating organisation and hide it from the homepage hero?")) return;
    await saveCollaboration("");
  };

  const applyPreset = (presetValue) => {
    setCollaboratingOrg(presetValue);
  };

  const orgList = collaboratingOrg
    .split(/[,;\n]+/)
    .map((s) => s.trim())
    .filter(Boolean);

  const isVisibleOnHomepage = Boolean(savedOrg.trim());

  if (loading) {
    return <div className="admin-empty-state">Loading collaboration settings...</div>;
  }

  return (
    <div className="admin-speakers-page">
      <section className="admin-panel">
        <div className="speaker-page-top">
          <div>
            <p className="admin-eyebrow">Homepage Hero Section</p>
            <h1>Collaboration Management</h1>
            <p className="admin-muted">
              Control the &ldquo;In collaboration with&rdquo; badge displayed directly beneath the main title on the homepage hero.
            </p>
          </div>
          <div style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
            <a
              href="/#home"
              target="_blank"
              rel="noopener noreferrer"
              className="admin-secondary-button"
              style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem" }}
            >
              <ExternalLink size={16} />
              View on Homepage
            </a>
            <button className="admin-primary-button" onClick={() => saveCollaboration()} disabled={saving}>
              <Save size={18} />
              {saving ? "Saving..." : "Save Collaboration"}
            </button>
          </div>
        </div>

        {/* Status Indicator */}
        <div
          style={{
            marginTop: "1.25rem",
            padding: "0.85rem 1.25rem",
            borderRadius: "0.75rem",
            display: "flex",
            alignItems: "center",
            gap: "0.75rem",
            fontSize: "0.875rem",
            fontWeight: 600,
            background: isVisibleOnHomepage ? "#ECFDF5" : "#F8FAFC",
            border: `1px solid ${isVisibleOnHomepage ? "#A7F3D0" : "#E2E8F0"}`,
            color: isVisibleOnHomepage ? "#065F46" : "#64748B",
          }}
        >
          {isVisibleOnHomepage ? (
            <>
              <CheckCircle2 size={18} className="text-emerald-600" />
              <span>
                Currently <strong>Visible</strong> on the homepage hero with: &ldquo;{savedOrg}&rdquo;
              </span>
            </>
          ) : (
            <>
              <AlertCircle size={18} className="text-slate-400" />
              <span>
                Currently <strong>Hidden</strong> on homepage hero (No collaborating organisation configured).
              </span>
            </>
          )}
        </div>

        {success && <div className="admin-success" style={{ marginTop: "1rem" }}>{success}</div>}
        {error && <div className="admin-error" style={{ marginTop: "1rem" }}>{error}</div>}
      </section>

      <section className="admin-trailer-grid" style={{ marginTop: "1.5rem" }}>
        {/* Preview Panel */}
        <article className="admin-panel trailer-preview-panel">
          <div className="speaker-page-top">
            <div>
              <p className="admin-eyebrow">Live Preview</p>
              <h2>Homepage Hero Badge</h2>
            </div>
            {collaboratingOrg.trim() && (
              <button className="admin-danger-button" onClick={clearCollaboration} disabled={saving} type="button">
                <Trash2 size={16} />
                Clear / Hide
              </button>
            )}
          </div>

          <div
            style={{
              padding: "2rem",
              borderRadius: "1rem",
              background: "#F8FAFC",
              border: "1px solid #E2E8F0",
              minHeight: "140px",
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
            }}
          >
            {orgList.length > 0 ? (
              <div className="flex flex-wrap items-center gap-2.5 sm:gap-3 text-xs sm:text-sm font-bold uppercase tracking-wide text-[#101828]">
                <span className="text-[#101828] whitespace-nowrap">In collaboration with</span>
                <div className="inline-flex flex-wrap items-center gap-2 sm:gap-2.5">
                  {orgList.map((org, index) => {
                    const logo = getOrgLogo(org);
                    return (
                      <div
                        key={`${org}-${index}`}
                        className="inline-flex items-center gap-2 bg-white/95 backdrop-blur-md border border-gray-200 px-3.5 py-1.5 rounded-full shadow-sm whitespace-nowrap shrink-0"
                      >
                        {logo && (
                          <img
                            src={logo}
                            alt={org}
                            className="h-5 sm:h-6 w-5 sm:w-6 rounded-full object-cover shrink-0"
                          />
                        )}
                        <span className="text-[#101828] font-bold text-xs sm:text-sm">
                          {org}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div style={{ textAlign: "center", color: "#94A3B8", fontSize: "0.9rem" }}>
                <Handshake size={32} style={{ margin: "0 auto 0.5rem auto", opacity: 0.5 }} />
                Badge is currently hidden. Type an organisation below to see it live!
              </div>
            )}
          </div>

          <p className="admin-muted" style={{ fontSize: "0.8rem", marginTop: "1rem" }}>
            * This matches the exact responsive styling, fonts, pill borders, and auto-resolved logos as seen by public visitors.
          </p>
        </article>

        {/* Configuration Form */}
        <form
          className="admin-panel trailer-form-panel"
          onSubmit={(e) => {
            e.preventDefault();
            saveCollaboration();
          }}
        >
          <p className="admin-eyebrow">Settings</p>
          <h2>Collaborating Organisation</h2>

          <label>
            Organisation Name(s)
            <input
              type="text"
              value={collaboratingOrg}
              onChange={(e) => setCollaboratingOrg(e.target.value)}
              placeholder="e.g. AIIMS Student Association, GAIMS"
            />
          </label>
          <span style={{ fontSize: "0.75rem", color: "#64748B", display: "block", marginTop: "-0.35rem", marginBottom: "1rem" }}>
            Separate multiple organisations with a comma (,). Leave blank to completely hide the section from the homepage.
          </span>

          {/* Quick Presets */}
          <div style={{ marginBottom: "1.25rem" }}>
            <span style={{ fontSize: "0.78rem", fontWeight: 700, color: "#475467", display: "block", marginBottom: "0.5rem" }}>
              Quick Presets:
            </span>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
              <button
                type="button"
                className="admin-secondary-button"
                style={{ fontSize: "0.75rem", padding: "0.35rem 0.75rem" }}
                onClick={() => applyPreset("AIIMS Student Association")}
              >
                AIIMS Student Association
              </button>
              <button
                type="button"
                className="admin-secondary-button"
                style={{ fontSize: "0.75rem", padding: "0.35rem 0.75rem" }}
                onClick={() => applyPreset("GAIMS")}
              >
                GAIMS
              </button>
              <button
                type="button"
                className="admin-secondary-button"
                style={{ fontSize: "0.75rem", padding: "0.35rem 0.75rem" }}
                onClick={() => applyPreset("AIIMS Student Association, GAIMS")}
              >
                AIIMS Student Association, GAIMS
              </button>
            </div>
          </div>

          <div className="speaker-form-actions">
            <button className="admin-primary-button" type="submit" disabled={saving}>
              <Save size={18} />
              {saving ? "Saving..." : "Save Collaboration"}
            </button>
            <button className="admin-secondary-button" type="button" onClick={loadSettings} disabled={saving}>
              <RefreshCcw size={17} />
              Reset
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}

export default AdminCollaboration;
