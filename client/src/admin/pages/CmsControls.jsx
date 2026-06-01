import { Save } from "lucide-react";
import { useEffect, useState } from "react";

const defaults = {
  homepage: { title: "", intro: "" },
  hero: { headline: "", subheadline: "", imageUrl: "" },
  trailer: { title: "", videoUrl: "" },
  announcements: [],
  contact: { email: "", phone: "" },
  venue: { name: "", address: "" },
  faq: [],
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
        <p className="admin-eyebrow">Global CMS</p>
        <h1>CMS Controls</h1>
        <p className="admin-muted">Manage homepage, hero, trailer, announcements, contact, venue and FAQ content globally.</p>
        {saved && <div className="admin-success">CMS controls saved.</div>}
      </section>

      <form className="settings-form-grid" onSubmit={submit}>
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
