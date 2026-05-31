import { Film, RefreshCcw, Save, Trash2, UploadCloud } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

const defaultForm = {
  title: "Watch the Vision",
  description: "Discover the vision behind Global Health Conclave and our mission to advance healthcare beyond boundaries.",
};

function AdminTrailer({ api }) {
  const fileInputRef = useRef(null);
  const [trailer, setTrailer] = useState(null);
  const [form, setForm] = useState(defaultForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [cloudinaryStatus, setCloudinaryStatus] = useState("");
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
    setForm((current) => ({ ...current, [field]: value }));
  };

  const saveDetails = async (event) => {
    event.preventDefault();
    if (!form.title.trim()) {
      setError("Trailer title is required.");
      return;
    }

    setSaving(true);
    setError("");
    setSuccess("");
    try {
      const response = await api.put("/api/trailer", {
        title: form.title,
        description: form.description,
        videoUrl: trailer?.videoUrl || "",
        cloudinaryPublicId: trailer?.cloudinaryPublicId || "",
        thumbnailUrl: trailer?.thumbnailUrl || "",
      });
      setTrailer(response.data.trailer);
      setSuccess("Trailer details saved.");
    } catch (err) {
      setError(err.response?.data?.message || "Unable to save trailer details.");
    } finally {
      setSaving(false);
    }
  };

  const uploadTrailer = async (file) => {
    if (!file) return;

    const formData = new FormData();
    formData.append("video", file);
    formData.append("title", form.title);
    formData.append("description", form.description);

    setUploading(true);
    setUploadProgress(0);
    setCloudinaryStatus("Uploading to Cloudinary...");
    setError("");
    setSuccess("");

    try {
      const response = await api.post("/api/trailer/upload", formData, {
        onUploadProgress: (event) => {
          if (event.total) setUploadProgress(Math.round((event.loaded / event.total) * 100));
        },
      });
      setTrailer(response.data.trailer);
      setCloudinaryStatus("Cloudinary upload complete.");
      setSuccess("Trailer uploaded and published.");
      setUploadProgress(100);
    } catch (err) {
      setCloudinaryStatus("");
      setError(err.response?.data?.message || "Unable to upload trailer video.");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const removeTrailer = async () => {
    if (!window.confirm("Remove the current homepage trailer?")) return;
    setSaving(true);
    setError("");
    setSuccess("");
    try {
      const response = await api.delete("/api/trailer");
      setTrailer(response.data.trailer);
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

  return (
    <div className="admin-speakers-page admin-trailer-page">
      <section className="admin-panel">
        <div className="speaker-page-top">
          <div>
            <p className="admin-eyebrow">Homepage Trailer</p>
            <h1>Trailer Management</h1>
            <p className="admin-muted">Upload, preview and publish the featured homepage trailer from Cloudinary.</p>
          </div>
          <button className="admin-primary-button" onClick={() => fileInputRef.current?.click()} disabled={uploading}>
            <UploadCloud size={18} />
            {trailer?.videoUrl ? "Replace Trailer" : "Upload Trailer"}
          </button>
          <input
            ref={fileInputRef}
            className="media-hidden-input"
            type="file"
            accept="video/mp4,video/webm,video/quicktime,video/x-m4v"
            onChange={(event) => uploadTrailer(event.target.files?.[0])}
          />
        </div>

        {uploading && (
          <div className="media-upload-progress">
            <span><UploadCloud size={17} /> {cloudinaryStatus}</span>
            <strong>{uploadProgress}%</strong>
            <i><b style={{ width: `${uploadProgress}%` }} /></i>
          </div>
        )}

        {!uploading && cloudinaryStatus && <div className="admin-success">{cloudinaryStatus}</div>}
        {success && <div className="admin-success">{success}</div>}
        {error && <div className="admin-error">{error}</div>}
      </section>

      <section className="admin-trailer-grid">
        <article className="admin-panel trailer-preview-panel">
          <div className="speaker-page-top">
            <div>
              <p className="admin-eyebrow">Preview</p>
              <h2>Current Trailer</h2>
            </div>
            {trailer?.videoUrl && (
              <button className="admin-danger-button" onClick={removeTrailer} disabled={saving}>
                <Trash2 size={17} />
                Remove
              </button>
            )}
          </div>

          {trailer?.videoUrl ? (
            <div className="admin-trailer-preview">
              <video src={trailer.videoUrl} poster={trailer.thumbnailUrl || undefined} controls preload="metadata" />
            </div>
          ) : (
            <div className="admin-empty-state">
              <Film size={34} />
              No trailer is currently published.
            </div>
          )}
        </article>

        <form className="admin-panel trailer-form-panel" onSubmit={saveDetails}>
          <p className="admin-eyebrow">Content</p>
          <h2>Trailer Copy</h2>
          <label>
            Title
            <input value={form.title} onChange={(event) => updateField("title", event.target.value)} required />
          </label>
          <label>
            Description
            <textarea rows="5" value={form.description} onChange={(event) => updateField("description", event.target.value)} />
          </label>
          <div className="speaker-form-actions">
            <button className="admin-primary-button" type="submit" disabled={saving}>
              <Save size={18} />
              {saving ? "Saving..." : "Save Details"}
            </button>
            <button className="admin-secondary-button" type="button" onClick={loadTrailer} disabled={saving || uploading}>
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
