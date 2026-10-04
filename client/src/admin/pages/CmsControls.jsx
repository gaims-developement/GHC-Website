import { Handshake, Save } from "lucide-react";
import { useEffect, useState } from "react";

const defaults = {
  homepage: { title: "", intro: "" },
  hero: { headline: "", subheadline: "", imageUrl: "", collaboratingOrg: "" },
  trailer: { title: "", videoUrl: "" },
  announcements: [],
  contact: { email: "", phone: "" },
  venue: { name: "", address: "" },
  faq: [],
  earlyBirdManualOff: false,
};

function CmsControls({ api }) {
  const [controls, setControls] = useState(defaults);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    api.get("/api/super-admin/cms-controls")
      .then((response) => setControls({ ...defaults, ...(response.data.controls || {}) }))
      .catch(() => {});
  }, [api]);

  const updateSection = (section, field, value) => {
    setControls((current) => ({ ...current, [section]: { ...(current[section] || {}), [field]: value } }));
  };

  const submit = async (event) => {
    event.preventDefault();
    await api.put("/api/super-admin/cms-controls", { controls });
    setSaved(true);
    window.setTimeout(() => setSaved(false), 2200);
  };

  return (
    <div className="admin-settings-page">
      <section className="admin-panel">
        <div className="speaker-page-top">
          <div>
            <p className="admin-eyebrow">Global CMS</p>
            <h1>CMS Controls</h1>
            <p className="admin-muted">Manage homepage, hero, trailer, announcements, contact, venue and FAQ content globally.</p>
          </div>
          <button
            type="button"
            className="admin-secondary-button"
            onClick={() => window.location.href = "/admin/collaboration"}
            style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem" }}
          >
            <Handshake size={18} /> Collaboration
          </button>
        </div>
        {saved && <div className="admin-success">CMS controls saved.</div>}
      </section>

      <form className="settings-form-grid" onSubmit={submit}>
        <section className="admin-panel settings-section">
          <p className="admin-eyebrow">Registration & Early Bird</p>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.85rem", padding: "1.2rem", backgroundColor: "#f8fafc", borderRadius: "0.75rem", border: "1px solid #e2e8f0" }}>
            <div>
              <strong style={{ fontSize: "1.05rem", color: controls.earlyBirdManualOff ? "#dc2626" : "#0d9488" }}>
                Status: {controls.earlyBirdManualOff ? "Early Bird Manually Turned Off (Regular Registration Active)" : "Early Bird Active (Ends Oct 15, 2026 at 11:59 PM IST)"}
              </strong>
              <p style={{ margin: "0.5rem 0 0", fontSize: "0.875rem", color: "#64748b", lineHeight: 1.5 }}>
                Early bird rates: <strong>GAIMS Elite Member 2500 / 1500</strong> & <strong>Non-Elite 3000 / 2000</strong>.
                Website countdown is live until <strong>15th October 2026, 11:59 PM IST</strong>. You can manually disable or enable early bird here at any time.
              </p>
            </div>
            <div>
              <button
                type="button"
                className={controls.earlyBirdManualOff ? "admin-primary-button" : "admin-secondary-button"}
                style={{
                  cursor: "pointer",
                  backgroundColor: controls.earlyBirdManualOff ? "#0d9488" : "#dc2626",
                  color: "#ffffff",
                  borderColor: controls.earlyBirdManualOff ? "#0d9488" : "#dc2626",
                  fontWeight: "700",
                  padding: "0.65rem 1.4rem",
                  borderRadius: "0.5rem",
                  fontSize: "0.95rem"
                }}
                onClick={async () => {
                  const updated = !controls.earlyBirdManualOff;
                  const newControls = { ...controls, earlyBirdManualOff: updated };
                  setControls(newControls);
                  try {
                    await api.put("/api/super-admin/cms-controls", { controls: newControls });
                    setSaved(true);
                    window.setTimeout(() => setSaved(false), 2200);
                  } catch (e) {
                    console.error("Failed to toggle early bird:", e);
                  }
                }}
              >
                {controls.earlyBirdManualOff ? "Turn on Early Bird" : "Turn off Early Bird manually"}
              </button>
            </div>
          </div>
        </section>
        <section className="admin-panel settings-section">
          <p className="admin-eyebrow">Homepage</p>
          <label>Title<input value={controls.homepage?.title || ""} onChange={(event) => updateSection("homepage", "title", event.target.value)} /></label>
          <label>Intro<input value={controls.homepage?.intro || ""} onChange={(event) => updateSection("homepage", "intro", event.target.value)} /></label>
        </section>
        <section className="admin-panel settings-section">
          <p className="admin-eyebrow">Hero</p>
          <label>Headline<input value={controls.hero?.headline || ""} onChange={(event) => updateSection("hero", "headline", event.target.value)} /></label>
          <label>Subheadline<input value={controls.hero?.subheadline || ""} onChange={(event) => updateSection("hero", "subheadline", event.target.value)} /></label>
          <label>Image URL<input value={controls.hero?.imageUrl || ""} onChange={(event) => updateSection("hero", "imageUrl", event.target.value)} /></label>
          <label>Collaborating Organisation<input value={controls.hero?.collaboratingOrg || ""} onChange={(event) => updateSection("hero", "collaboratingOrg", event.target.value)} placeholder="e.g. AIIMS Student Association (leave empty to hide)" /></label>
        </section>
        <section className="admin-panel settings-section">
          <p className="admin-eyebrow">Trailer</p>
          <label>Title<input value={controls.trailer?.title || ""} onChange={(event) => updateSection("trailer", "title", event.target.value)} /></label>
          <label>Video URL<input value={controls.trailer?.videoUrl || ""} onChange={(event) => updateSection("trailer", "videoUrl", event.target.value)} /></label>
        </section>
        <section className="admin-panel settings-section">
          <p className="admin-eyebrow">Contact</p>
          <label>Email<input value={controls.contact?.email || ""} onChange={(event) => updateSection("contact", "email", event.target.value)} /></label>
          <label>Phone<input value={controls.contact?.phone || ""} onChange={(event) => updateSection("contact", "phone", event.target.value)} /></label>
        </section>
        <section className="admin-panel settings-section">
          <p className="admin-eyebrow">Venue</p>
          <label>Name<input value={controls.venue?.name || ""} onChange={(event) => updateSection("venue", "name", event.target.value)} /></label>
          <label>Address<input value={controls.venue?.address || ""} onChange={(event) => updateSection("venue", "address", event.target.value)} /></label>
        </section>
        <section className="admin-panel settings-section">
          <p className="admin-eyebrow">Announcements and FAQ</p>
          <label>Announcements<textarea value={(controls.announcements || []).join("\n")} onChange={(event) => setControls({ ...controls, announcements: event.target.value.split("\n").filter(Boolean) })} /></label>
          <label>FAQ<textarea value={(controls.faq || []).join("\n")} onChange={(event) => setControls({ ...controls, faq: event.target.value.split("\n").filter(Boolean) })} /></label>
          <button className="admin-primary-button" type="submit"><Save size={18} /> Save controls</button>
        </section>
      </form>
    </div>
  );
}

export default CmsControls;
