import { Film, Link, RefreshCcw, Save, Trash2, Video } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { getVideoEmbedInfo } from "../../utils/videoEmbed";

const defaultForm = {
  title: "Watch the Vision",
  description: "Discover the vision behind Global Health Conclave and our mission to advance healthcare beyond boundaries.",
  videoUrl: "",
  thumbnailUrl: "",
};

function AdminTrailer({ api }) {
  const [trailer, setTrailer] = useState(null);
  const [form, setForm] = useState(defaultForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const loadTrailer = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await api.get("/api/trailer");
      const nextTrailer = response.data.trailer || {};
      setTrailer(nextTrailer);
      setForm({
        title: nextTrailer.title || defaultForm.title,
        description: nextTrailer.description || defaultForm.description,
        videoUrl: nextTrailer.videoUrl || "",
        thumbnailUrl: nextTrailer.thumbnailUrl || "",
      });
    } catch (err) {
      setError(err.response?.data?.message || "Unable to load trailer details.");
    } finally {
      setLoading(false);
    }
  }, [api]);

  useEffect(() => {
    loadTrailer();
  }, [loadTrailer]);

  const updateField = (field, value) => {
    setForm((current) => {
      const updated = { ...current, [field]: value };
      // If user pasted a YouTube link and has no custom thumbnail, auto-fill thumbnail
      if (field === "videoUrl" && value.trim()) {
        const info = getVideoEmbedInfo(value);
        if (info?.thumbnailUrl && !current.thumbnailUrl) {
          updated.thumbnailUrl = info.thumbnailUrl;
        }
      }
      return updated;
    });
  };

  const saveDetails = async (event) => {
    if (event) event.preventDefault();
    if (!form.title.trim()) {
      setError("Trailer title is required.");
      return;
    }
    if (!form.videoUrl.trim()) {
      setError("Trailer video link is required.");
      return;
    }

    setSaving(true);
    setError("");
    setSuccess("");
    try {
      const response = await api.put("/api/trailer", {
        title: form.title.trim(),
        description: form.description.trim(),
        videoUrl: form.videoUrl.trim(),
        thumbnailUrl: form.thumbnailUrl.trim(),
      });
      const updated = response.data.trailer || {};
      setTrailer(updated);
      setForm({
        title: updated.title || form.title,
        description: updated.description || form.description,
        videoUrl: updated.videoUrl || form.videoUrl,
        thumbnailUrl: updated.thumbnailUrl || form.thumbnailUrl,
      });
      setSuccess("Trailer video link and details saved successfully.");
    } catch (err) {
      setError(err.response?.data?.message || "Unable to save trailer details.");
    } finally {
      setSaving(false);
    }
  };

  const removeTrailer = async () => {
    if (!window.confirm("Remove the current homepage trailer video link?")) return;
    setSaving(true);
    setError("");
    setSuccess("");
    try {
      const response = await api.delete("/api/trailer");
      const updated = response.data.trailer || {};
      setTrailer(updated);
      setForm((current) => ({
        ...current,
        videoUrl: "",
        thumbnailUrl: "",
      }));
      setSuccess("Trailer removed from homepage.");
    } catch (err) {
      setError(err.response?.data?.message || "Unable to remove trailer.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="admin-empty-state">Loading trailer CMS...</div>;
  }

  // Active video URL for preview (user's input or saved trailer)
  const activeVideoUrl = form.videoUrl || trailer?.videoUrl || "";
  const embedInfo = getVideoEmbedInfo(activeVideoUrl);

  return (
    <div className="admin-speakers-page admin-trailer-page">
      <section className="admin-panel">
        <div className="speaker-page-top">
          <div>
            <p className="admin-eyebrow">Homepage Trailer</p>
            <h1>Trailer Management</h1>
            <p className="admin-muted">
              Configure the featured homepage trailer using a video link (YouTube, Vimeo, Google Drive, or direct video URL).
            </p>
          </div>
          <button className="admin-primary-button" onClick={saveDetails} disabled={saving}>
            <Save size={18} />
            {saving ? "Saving..." : "Save Trailer"}
          </button>
        </div>

        {success && <div className="admin-success">{success}</div>}
        {error && <div className="admin-error">{error}</div>}
      </section>

      <section className="admin-trailer-grid">
        <article className="admin-panel trailer-preview-panel">
          <div className="speaker-page-top">
            <div>
              <p className="admin-eyebrow">Preview</p>
              <h2>{form.videoUrl ? "Live Preview" : "Current Trailer"}</h2>
            </div>
            {trailer?.videoUrl && (
              <button className="admin-danger-button" onClick={removeTrailer} disabled={saving} type="button">
                <Trash2 size={17} />
                Remove
              </button>
            )}
          </div>

          {embedInfo ? (
            <div className="admin-trailer-preview">
              {embedInfo.type === "direct" ? (
                <video
                  src={embedInfo.embedUrl}
                  poster={form.thumbnailUrl || trailer?.thumbnailUrl || undefined}
                  controls
                  preload="metadata"
                />
              ) : (
                <iframe
                  src={embedInfo.embedUrl}
                  title="Trailer Preview"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                />
              )}
            </div>
          ) : (
            <div className="admin-empty-state">
              <Film size={34} />
              No trailer video link configured. Enter a video link below to preview and publish.
            </div>
          )}

          {embedInfo && (
            <div style={{ marginTop: "0.75rem", display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.8rem", color: "#64748B" }}>
              <Video size={15} />
              <span>
                Detected type: <strong>{embedInfo.type.toUpperCase()}</strong>
              </span>
            </div>
          )}
        </article>

        <form className="admin-panel trailer-form-panel" onSubmit={saveDetails}>
          <p className="admin-eyebrow">Content & Link</p>
          <h2>Trailer Video Details</h2>

          <label>
            Video Link / URL *
            <input
              type="text"
              value={form.videoUrl}
              onChange={(event) => updateField("videoUrl", event.target.value)}
              placeholder="e.g. https://www.youtube.com/watch?v=... or https://youtu.be/..."
              required
            />
          </label>
          <span style={{ fontSize: "0.75rem", color: "#64748B", display: "block", marginTop: "-0.35rem", marginBottom: "0.75rem" }}>
            Paste any YouTube, Vimeo, Google Drive, or direct MP4/video link.
          </span>

          <label>
            Title *
            <input
              value={form.title}
              onChange={(event) => updateField("title", event.target.value)}
              placeholder="e.g. Watch the Vision"
              required
            />
          </label>

          <label>
            Poster / Thumbnail URL (Optional)
            <input
              value={form.thumbnailUrl}
              onChange={(event) => updateField("thumbnailUrl", event.target.value)}
              placeholder="https://... (auto-detected for YouTube)"
            />
          </label>

          <label>
            Description
            <textarea
              rows="4"
              value={form.description}
              onChange={(event) => updateField("description", event.target.value)}
              placeholder="Brief description of the trailer..."
            />
          </label>

          <div className="speaker-form-actions">
            <button className="admin-primary-button" type="submit" disabled={saving}>
              <Save size={18} />
              {saving ? "Saving..." : "Save Details"}
            </button>
            <button className="admin-secondary-button" type="button" onClick={loadTrailer} disabled={saving}>
              <RefreshCcw size={17} />
              Reload
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}

export default AdminTrailer;
