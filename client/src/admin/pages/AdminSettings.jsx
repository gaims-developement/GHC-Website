import { Save, Settings as SettingsIcon } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

const emptySettings = {
  conference: {
    name: "",
    theme: "",
    venue: "",
    startDate: "",
    endDate: "",
    collaboratingOrg: "",
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

  const toggleCallStatus = async () => {
    const newValue = !settings.registration.abstractSubmissionOpen;
    
    // Optimistically update UI
    setSettings((current) => ({
      ...current,
      registration: {
        ...current.registration,
        abstractSubmissionOpen: newValue,
      },
    }));

    const newSettings = {
      ...settings,
      registration: {
        ...settings.registration,
        abstractSubmissionOpen: newValue
      }
    };
    
    setSaving(true);
    setError("");
    setSuccess("");
    try {
      const response = await api.put("/api/settings", newSettings);
      setSettings({ ...emptySettings, ...(response.data.settings || {}) });
      setUpdatedAt(response.data.updatedAt || null);
      setSuccess(`Abstract calls have been ${newValue ? 'opened' : 'closed'}.`);
    } catch (err) {
      setError(err.response?.data?.message || "Unable to update call status.");
      // Revert on error
      setSettings((current) => ({
        ...current,
        registration: {
          ...current.registration,
          abstractSubmissionOpen: !newValue,
        },
      }));
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
          <label>
            Collaborating Organisation
            <input
              value={settings.conference.collaboratingOrg || ""}
              onChange={(event) => setNestedValue("conference", "collaboratingOrg", event.target.value)}
              placeholder="e.g. AIIMS Student Association (leave empty to hide)"
            />
          </label>
          <span style={{ fontSize: '0.75rem', color: '#64748B', display: 'block', marginTop: '-0.35rem', marginBottom: '0.75rem' }}>
            Shown in the Hero section as &quot;In collaboration with&quot;. If left blank, this will not be displayed.
          </span>
          <div className="speaker-form-grid">
            <label>Start date<input type="date" value={settings.conference.startDate || ""} onChange={(event) => setNestedValue("conference", "startDate", event.target.value)} /></label>
            <label>End date<input type="date" value={settings.conference.endDate || ""} onChange={(event) => setNestedValue("conference", "endDate", event.target.value)} /></label>
          </div>
        </div>

        <div className="admin-panel settings-section">
          <div className="admin-panel-heading"><h2>Call Status</h2></div>
          <div className="settings-toggle-list" style={{ marginTop: '0.5rem', marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <button
                type="button"
                onClick={toggleCallStatus}
                disabled={saving}
                style={{
                  padding: '12px 24px',
                  borderRadius: '8px',
                  fontWeight: 'bold',
                  color: 'white',
                  border: 'none',
                  cursor: 'pointer',
                  backgroundColor: settings.registration.abstractSubmissionOpen ? '#10b981' : '#ef4444',
                  transition: 'background-color 0.3s'
                }}
              >
                {settings.registration.abstractSubmissionOpen ? "Stop Calls" : "Start Calls"}
              </button>
              <span className="admin-muted">
                {settings.registration.abstractSubmissionOpen ? "Calls are currently open." : "Calls are currently closed."}
              </span>
            </div>
          </div>

          <div className="admin-panel-heading"><h2>Registration</h2></div>
          <div className="settings-toggle-list">
            <label><input type="checkbox" checked={settings.registration.registrationOpen} onChange={(event) => setNestedValue("registration", "registrationOpen", event.target.checked)} /> Registration open</label>
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
