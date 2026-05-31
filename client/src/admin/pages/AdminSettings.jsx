import { Save, Settings as SettingsIcon } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

const emptySettings = {
  conference: {
    name: "",
    theme: "",
    venue: "",
    startDate: "",
    endDate: "",
  },
  registration: {
    registrationOpen: false,
    abstractSubmissionOpen: false,
  },
  socialLinks: {
    instagram: "",
    linkedin: "",
    twitter: "",
    website: "",
  },
  contact: {
    email: "",
    phone: "",
  },
};

function AdminSettings({ api }) {
  const [settings, setSettings] = useState(emptySettings);
  const [updatedAt, setUpdatedAt] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const loadSettings = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await api.get("/api/settings");
      setSettings({ ...emptySettings, ...(response.data.settings || {}) });
      setUpdatedAt(response.data.updatedAt || null);
    } catch (err) {
      setError(err.response?.data?.message || "Unable to load settings.");
    } finally {
      setLoading(false);
    }
  }, [api]);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  const setNestedValue = (section, key, value) => {
    setSettings((current) => ({
      ...current,
      [section]: {
        ...current[section],
        [key]: value,
      },
    }));
  };

  const validate = () => {
    if (!settings.conference.name.trim()) return "Conference name is required.";
    if (!settings.conference.venue.trim()) return "Venue is required.";
    if (settings.contact.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(settings.contact.email)) return "Contact email is invalid.";
    if (settings.conference.startDate && settings.conference.endDate && settings.conference.endDate < settings.conference.startDate) {
      return "End date cannot be before start date.";
    }
    return "";
  };

  const saveSettings = async (event) => {
    event.preventDefault();
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    setSaving(true);
    setError("");
    setSuccess("");
    try {
      const response = await api.put("/api/settings", settings);
      setSettings({ ...emptySettings, ...(response.data.settings || {}) });
      setUpdatedAt(response.data.updatedAt || null);
      setSuccess("Settings saved.");
    } catch (err) {
      setError(err.response?.data?.message || "Unable to save settings.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="admin-loading">Loading settings...</div>;
  }

  return (
    <form className="admin-settings-page" onSubmit={saveSettings}>
      <section className="admin-panel">
        <div className="speaker-page-top">
          <div>
            <p className="admin-eyebrow">Settings</p>
            <h1>Conference Settings</h1>
            <p className="admin-muted">Update conference details, registration availability, social links and public contact information.</p>
          </div>
          <button className="admin-primary-button" type="submit" disabled={saving}>
            <Save size={18} />
            {saving ? "Saving..." : "Save Settings"}
          </button>
        </div>
        {updatedAt && <p className="admin-muted">Last updated {new Date(updatedAt).toLocaleString()}</p>}
      </section>

      {error && <div className="admin-error">{error}</div>}
      {success && <div className="admin-success">{success}</div>}

      <section className="settings-form-grid">
        <div className="admin-panel settings-section">
          <div className="admin-panel-heading">
            <h2>Conference</h2>
            <SettingsIcon size={20} />
          </div>
          <label>Conference name<input value={settings.conference.name} onChange={(event) => setNestedValue("conference", "name", event.target.value)} required /></label>
          <label>Theme<input value={settings.conference.theme} onChange={(event) => setNestedValue("conference", "theme", event.target.value)} /></label>
          <label>Venue<input value={settings.conference.venue} onChange={(event) => setNestedValue("conference", "venue", event.target.value)} required /></label>
          <div className="speaker-form-grid">
            <label>Start date<input type="date" value={settings.conference.startDate || ""} onChange={(event) => setNestedValue("conference", "startDate", event.target.value)} /></label>
            <label>End date<input type="date" value={settings.conference.endDate || ""} onChange={(event) => setNestedValue("conference", "endDate", event.target.value)} /></label>
          </div>
        </div>

        <div className="admin-panel settings-section">
          <div className="admin-panel-heading"><h2>Registration</h2></div>
          <div className="settings-toggle-list">
            <label><input type="checkbox" checked={settings.registration.registrationOpen} onChange={(event) => setNestedValue("registration", "registrationOpen", event.target.checked)} /> Registration open</label>
            <label><input type="checkbox" checked={settings.registration.abstractSubmissionOpen} onChange={(event) => setNestedValue("registration", "abstractSubmissionOpen", event.target.checked)} /> Abstract submission open</label>
          </div>
        </div>

        <div className="admin-panel settings-section">
          <div className="admin-panel-heading"><h2>Social Links</h2></div>
          <label>Instagram<input value={settings.socialLinks.instagram} onChange={(event) => setNestedValue("socialLinks", "instagram", event.target.value)} placeholder="https://instagram.com/..." /></label>
          <label>LinkedIn<input value={settings.socialLinks.linkedin} onChange={(event) => setNestedValue("socialLinks", "linkedin", event.target.value)} placeholder="https://linkedin.com/..." /></label>
          <label>X/Twitter<input value={settings.socialLinks.twitter} onChange={(event) => setNestedValue("socialLinks", "twitter", event.target.value)} placeholder="https://x.com/..." /></label>
          <label>Website<input value={settings.socialLinks.website} onChange={(event) => setNestedValue("socialLinks", "website", event.target.value)} placeholder="https://..." /></label>
        </div>

        <div className="admin-panel settings-section">
          <div className="admin-panel-heading"><h2>Contact</h2></div>
          <label>Email<input type="email" value={settings.contact.email} onChange={(event) => setNestedValue("contact", "email", event.target.value)} /></label>
          <label>Phone<input value={settings.contact.phone} onChange={(event) => setNestedValue("contact", "phone", event.target.value)} /></label>
        </div>
      </section>
    </form>
  );
}

export default AdminSettings;
