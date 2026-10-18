import { Download, FileDown, Minus, Plus, RotateCcw } from "lucide-react";
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import InvitationPoster from "../../components/invitation-poster/InvitationPoster";
import { DEFAULT_POSTER_CONTENT, EMAIL_POSTER_HEIGHT, POSTER_HEIGHT, POSTER_WIDTH } from "../../components/invitation-poster/posterConfig";

const EXPORT_PIXEL_RATIO = 2; // 2400 x 3600 PNG
// PDF page: 8 x 12 in (2:3), the poster at 300 dpi from the 2x render.
const PDF_PAGE_PT = [576, 864];

const FIELDS = [
  { key: "dateLine1", label: "Date (line 1)" },
  { key: "dateLine2", label: "Date (line 2)" },
  { key: "venueLine1", label: "Venue (line 1)" },
  { key: "venueLine2", label: "Venue (line 2)" },
  { key: "registrationUrl", label: "Registration URL (QR code)" },
  { key: "website", label: "Website" },
];

const waitForImages = (node) =>
  Promise.all(
    [...node.querySelectorAll("img")].map((img) =>
      img.complete && img.naturalWidth ? null : new Promise((resolve, reject) => {
        img.addEventListener("load", resolve, { once: true });
        img.addEventListener("error", () => reject(new Error(`Could not load ${img.getAttribute("src")}`)), { once: true });
      })
    )
  );

const download = (href, filename) => {
  const link = document.createElement("a");
  link.href = href;
  link.download = filename;
  link.click();
};

export default function InvitationPosterGenerator() {
  const [content, setContent] = useState(DEFAULT_POSTER_CONTENT);
  const [zoom, setZoom] = useState(1);
  // "email" is the artwork used by the invitation email (save it as server/assets/email/invitation-poster.jpg).
  const [variant, setVariant] = useState("print");
  const [fitScale, setFitScale] = useState(0.4);
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const frameRef = useRef(null);
  const posterRef = useRef(null);

  // Fit the full poster to the preview column, then apply the zoom on top.
  useLayoutEffect(() => {
    const frame = frameRef.current;
    if (!frame) return undefined;
    const update = () => setFitScale(Math.min(1, frame.clientWidth / POSTER_WIDTH));
    update();
    const observer = new ResizeObserver(update);
    observer.observe(frame);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    document.title = "Invitation Poster | GHC Admin";
  }, []);

  const scale = fitScale * zoom;
  const posterHeight = variant === "email" ? EMAIL_POSTER_HEIGHT : POSTER_HEIGHT;

  // Renders the poster at its native size (no preview transform) after fonts and images are ready.
  const renderPng = useCallback(async () => {
    const node = posterRef.current;
    await document.fonts.ready;
    await waitForImages(node);
    const { toPng } = await import("html-to-image");
    const options = {
      width: POSTER_WIDTH,
      height: posterHeight,
      pixelRatio: EXPORT_PIXEL_RATIO,
      cacheBust: true,
      style: { transform: "none", margin: "0" },
    };
    // The first pass warms html-to-image's font and image cache; the second is the reliable one.
    await toPng(node, options);
    return toPng(node, options);
  }, [posterHeight]);

  const run = async (label, task) => {
    setBusy(label);
    setError("");
    try {
      await task();
    } catch (err) {
      setError(err?.message || "Export failed. Please try again.");
    } finally {
      setBusy("");
    }
  };

  const downloadPng = () => run("png", async () => {
    download(await renderPng(), variant === "email" ? "GHC-2026-Invitation-email-artwork.png" : "GHC-2026-Invitation.png");
  });

  const downloadPdf = () => run("pdf", async () => {
    const dataUrl = await renderPng();
    const { jsPDF } = await import("jspdf");
    const pdf = new jsPDF({ orientation: "portrait", unit: "pt", format: PDF_PAGE_PT, compress: true });
    pdf.addImage(dataUrl, "PNG", 0, 0, PDF_PAGE_PT[0], PDF_PAGE_PT[1], undefined, "FAST");
    pdf.save("GHC-2026-Invitation.pdf");
  });

  return (
    <div className="admin-speakers-page">
      <section className="admin-panel">
        <p className="admin-eyebrow">Delegates</p>
        <h1>Invitation Poster</h1>
        <p className="admin-muted">
          The GHC 2026 invitation poster ({POSTER_WIDTH} × {POSTER_HEIGHT}). The gold nameplate is intentionally left blank so a name can be added later.
          PNG downloads at {POSTER_WIDTH * EXPORT_PIXEL_RATIO} × {POSTER_HEIGHT * EXPORT_PIXEL_RATIO}; PDF is an 8 × 12 in print page.
        </p>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "0.75rem", marginTop: "1rem" }}>
          {FIELDS.map(({ key, label }) => (
            <label key={key} style={{ display: "flex", flexDirection: "column", gap: "0.3rem", fontSize: "0.85rem", fontWeight: 600 }}>
              {label}
              <input
                value={content[key]}
                onChange={(event) => setContent((current) => ({ ...current, [key]: event.target.value }))}
                style={{ padding: "0.55rem 0.7rem", borderRadius: "8px", border: "1px solid #d0d5dd", fontWeight: 400 }}
              />
            </label>
          ))}
        </div>

        <div style={{ display: "flex", gap: "0.6rem", flexWrap: "wrap", alignItems: "center", marginTop: "1rem" }}>
          <button className="admin-primary-button" type="button" onClick={downloadPng} disabled={Boolean(busy)}>
            <Download size={18} /> {busy === "png" ? "Rendering..." : "Download PNG"}
          </button>
          <button className="admin-primary-button" type="button" onClick={downloadPdf} disabled={Boolean(busy) || variant === "email"} title={variant === "email" ? "The email artwork is a PNG only" : undefined} style={{ background: "#B8913D", borderColor: "#B8913D" }}>
            <FileDown size={18} /> {busy === "pdf" ? "Rendering..." : "Download PDF"}
          </button>
          <div style={{ display: "flex", gap: "0.35rem" }}>
            {[["print", "Poster"], ["email", "Email artwork"]].map(([key, label]) => (
              <button key={key} type="button" className="admin-secondary-button" onClick={() => setVariant(key)} style={variant === key ? { background: "#173B8F", color: "#fff", borderColor: "#173B8F" } : undefined}>
                {label}
              </button>
            ))}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.35rem", marginLeft: "auto" }}>
            <button type="button" className="admin-secondary-button" onClick={() => setZoom((z) => Math.max(0.5, +(z - 0.25).toFixed(2)))} title="Zoom out"><Minus size={16} /></button>
            <span style={{ minWidth: "3.5rem", textAlign: "center", fontSize: "0.85rem" }}>{Math.round(zoom * 100)}%</span>
            <button type="button" className="admin-secondary-button" onClick={() => setZoom((z) => Math.min(3, +(z + 0.25).toFixed(2)))} title="Zoom in"><Plus size={16} /></button>
            <button type="button" className="admin-secondary-button" onClick={() => { setZoom(1); setContent(DEFAULT_POSTER_CONTENT); }} title="Reset zoom and text"><RotateCcw size={16} /></button>
          </div>
        </div>
        {error && <p style={{ color: "#b42318", marginTop: "0.75rem" }}>{error}</p>}
      </section>

      <section className="admin-panel" style={{ background: "#0b1220" }}>
        <div ref={frameRef} style={{ width: "100%", maxWidth: 720, margin: "0 auto", overflow: "auto" }}>
          <div style={{ width: POSTER_WIDTH * scale, height: posterHeight * scale, margin: "0 auto", boxShadow: "0 20px 60px rgba(0,0,0,0.5)" }}>
            <InvitationPoster
              ref={posterRef}
              content={content}
              variant={variant}
              style={{ transform: `scale(${scale})`, transformOrigin: "top left" }}
            />
          </div>
        </div>
      </section>
    </div>
  );
}
