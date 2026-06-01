import { Copy, FileText, Image, Plus, Search, Trash2, UploadCloud } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

const filters = ["all", "image", "video", "raw"];

const formatSize = (bytes) => {
  const value = Number(bytes || 0);
  if (value < 1024) return `${value} B`;
  if (value < 1024 * 1024) return `${Math.round(value / 1024)} KB`;
  return `${(value / 1024 / 1024).toFixed(1)} MB`;
};

function AdminMedia({ api }) {
  const fileInputRef = useRef(null);
  const [assets, setAssets] = useState([]);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState("");
  const [copiedId, setCopiedId] = useState(null);

  const loadMedia = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (filter !== "all") params.set("type", filter);
      const response = await api.get(`/api/media?${params.toString()}`);
      setAssets(response.data.assets || []);
    } catch (err) {
      setError(err.response?.data?.message || "Unable to load media assets.");
    } finally {
      setLoading(false);
    }
  }, [api, filter, search]);

  useEffect(() => {
    const timer = setTimeout(loadMedia, 250);
    return () => clearTimeout(timer);
  }, [loadMedia]);

  const stats = useMemo(() => ({
    total: assets.length,
    images: assets.filter((asset) => asset.resourceType === "image").length,
    documents: assets.filter((asset) => asset.resourceType !== "image").length,
  }), [assets]);

  const uploadFile = async (file) => {
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);
    setUploading(true);
    setUploadProgress(0);
    setError("");

    try {
      await api.post("/api/media", formData, {
        onUploadProgress: (event) => {
          if (event.total) setUploadProgress(Math.round((event.loaded / event.total) * 100));
        },
      });
      setUploadProgress(100);
      await loadMedia();
    } catch (err) {
      setError(err.response?.data?.message || "Unable to upload media asset.");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const copyUrl = async (asset) => {
    await navigator.clipboard.writeText(asset.url);
    setCopiedId(asset.id);
    window.setTimeout(() => setCopiedId(null), 1400);
  };

  const deleteAsset = async (asset) => {
    if (!window.confirm(`Delete ${asset.originalName || asset.filename}?`)) return;
    await api.delete(`/api/media/${asset.id}`);
    loadMedia();
  };

  return (
    <div className="admin-speakers-page admin-media-page">
      <section className="admin-panel">
        <div className="speaker-page-top">
          <div>
            <p className="admin-eyebrow">Media Library</p>
            <h1>CMS Assets</h1>
            <p className="admin-muted">Upload, organize, copy and remove images or PDFs stored in Cloudinary.</p>
          </div>
          <button className="admin-primary-button" onClick={() => fileInputRef.current?.click()} disabled={uploading}>
            <Plus size={18} />
            Add Asset
          </button>
          <input
            ref={fileInputRef}
            className="media-hidden-input"
            type="file"
            accept="image/png,image/jpeg,image/webp,image/svg+xml,video/mp4,video/webm,application/pdf,.doc,.docx,.xls,.xlsx"
            onChange={(event) => uploadFile(event.target.files?.[0])}
          />
        </div>

        <div className="workshop-kpi-row">
          <span><strong>{stats.total}</strong>Total assets</span>
          <span><strong>{stats.images}</strong>Images</span>
          <span><strong>{stats.documents}</strong>PDFs/docs</span>
        </div>

        {uploading && (
          <div className="media-upload-progress">
            <span><UploadCloud size={17} /> Uploading asset</span>
            <strong>{uploadProgress}%</strong>
            <i><b style={{ width: `${uploadProgress}%` }} /></i>
          </div>
        )}

        <div className="speaker-toolbar">
          <label className="speaker-search"><Search size={17} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search media" /></label>
          <div className="speaker-filter-row">
            {filters.map((item) => <button key={item} className={filter === item ? "active" : ""} onClick={() => setFilter(item)}>{item === "raw" ? "pdf" : item}</button>)}
          </div>
        </div>
      </section>

      {error && <div className="admin-error">{error}</div>}

      <section className="media-gallery">
        {loading ? <div className="admin-empty-state">Loading media...</div> : assets.map((asset) => {
          const isImage = asset.resourceType === "image";
          const Icon = isImage ? Image : FileText;
          return (
            <article className="media-card" key={asset.id}>
              <div className="media-thumb">
                {isImage ? <img src={asset.url} alt={asset.originalName || asset.filename} /> : <Icon size={34} />}
              </div>
              <div>
                <strong>{asset.originalName || asset.filename}</strong>
                <p>{asset.fileType} · {formatSize(asset.sizeBytes)}</p>
              </div>
              <div className="media-actions">
                <button onClick={() => copyUrl(asset)}><Copy size={16} /> {copiedId === asset.id ? "Copied" : "Copy URL"}</button>
                <button onClick={() => deleteAsset(asset)}><Trash2 size={16} /> Delete</button>
              </div>
            </article>
          );
        })}
        {!loading && assets.length === 0 && <div className="admin-empty-state">No media assets found.</div>}
      </section>
    </div>
  );
}

export default AdminMedia;
