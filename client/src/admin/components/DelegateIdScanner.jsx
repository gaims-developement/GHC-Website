import { Check, ShieldAlert, X } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import DelegateQrScanner from "./DelegateQrScanner";

const STATUS_LABELS = { pending: "Not yet reviewed", verified: "Verified by the team", rejected: "Rejected by the team" };

// Stays on-site staff's decision: the scan only shows the person and their ID, and attendance waits for Confirm.
const describePreview = ({ delegate }) => ({
  tone: delegate.isPresent || !delegate.idCheck || delegate.idCheck.status === "rejected" ? "warning" : "success",
  title: delegate.fullName,
  detail: delegate.isPresent ? `${delegate.registrationId} — already marked present` : `${delegate.registrationId} — check their ID below`,
});

function DelegateIdScanner({ api, onCheckedIn }) {
  const [scanned, setScanned] = useState(null);
  const [imageUrl, setImageUrl] = useState("");
  const [imageError, setImageError] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const delegateId = scanned?.id;
  const hasId = Boolean(scanned?.idCheck);

  useEffect(() => {
    if (!delegateId || !hasId) return undefined;
    let cancelled = false;
    let objectUrl = "";
    setImageUrl("");
    setImageError("");
    api.get(`/api/delegates/${delegateId}/id-document`, { responseType: "blob" })
      .then((response) => {
        if (cancelled) return;
        objectUrl = URL.createObjectURL(response.data);
        setImageUrl(objectUrl);
      })
      .catch(() => !cancelled && setImageError("The ID image could not be loaded. Check their physical ID instead."));
    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [api, delegateId, hasId, scanned]);

  const handleScan = useCallback((delegate) => {
    setError("");
    setNotice("");
    setScanned(delegate);
  }, []);

  const confirm = async () => {
    setSaving(true);
    setError("");
    try {
      const response = await api.post("/api/delegates/check-in", { code: scanned.code });
      onCheckedIn?.(response.data.delegate);
      setNotice(`✓ ${scanned.fullName} marked present`);
      setScanned(null);
    } catch (err) {
      setError(err.response?.data?.message || "Could not mark this delegate present. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const check = scanned?.idCheck;

  return (
    <>
      <DelegateQrScanner
        api={api}
        endpoint="/api/delegates/check-in/preview"
        title="QR Check-in"
        submitLabel="Look up"
        describeResult={describePreview}
        onCheckedIn={handleScan}
      />
      {notice && <section className="admin-panel" role="status" style={{ borderColor: "#6ee7b7", background: "#ecfdf5", color: "#065f46", fontWeight: 800 }}>{notice}</section>}
      {scanned && (
        <section className="admin-panel">
          <h2 style={{ margin: "0 0 0.5rem", fontSize: "1.15rem" }}>{scanned.fullName}</h2>
          {check ? (
            <>
              <p className="admin-muted" style={{ margin: "0 0 0.75rem" }}>
                Name on ID: <strong>{check.nameOnId}</strong> · {check.idTypeLabel} ending {check.numberLast4} · {STATUS_LABELS[check.status] || check.status}
              </p>
              {imageUrl && <img src={imageUrl} alt={`Photo ID submitted by ${scanned.fullName}`} style={{ display: "block", width: "100%", maxWidth: "520px", maxHeight: "60vh", objectFit: "contain", borderRadius: "0.75rem", border: "1px solid #e5e7eb", marginBottom: "0.75rem" }} />}
              {!imageUrl && !imageError && <p className="admin-muted">Loading ID…</p>}
              {imageError && <p style={{ color: "#b91c1c" }}>{imageError}</p>}
            </>
          ) : (
            <p style={{ display: "flex", gap: "0.5rem", alignItems: "center", color: "#92400e", fontWeight: 700, margin: "0 0 0.75rem" }}>
              <ShieldAlert size={20} /> No ID on file. Check their physical ID.
            </p>
          )}
          {error && <p style={{ color: "#b91c1c" }}>{error}</p>}
          <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
            {!scanned.isPresent && (
              <button className="admin-primary-button" type="button" disabled={saving} onClick={confirm}>
                <Check size={16} /> {saving ? "Saving…" : "ID matches, mark present"}
              </button>
            )}
            <button className="admin-secondary-button" type="button" disabled={saving} onClick={() => setScanned(null)}>
              <X size={16} /> {scanned.isPresent ? "Close" : "Does not match, close"}
            </button>
          </div>
        </section>
      )}
    </>
  );
}

export default DelegateIdScanner;
