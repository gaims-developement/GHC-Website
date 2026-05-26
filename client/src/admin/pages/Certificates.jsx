import { Award, Download, FileCheck2, Search, Send } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

const certificateTypes = ["Delegate", "Speaker", "Volunteer", "Workshop", "Research"];

function Certificates({ api }) {
  const [certificates, setCertificates] = useState([]);
  const [registrationId, setRegistrationId] = useState("");
  const [certificateType, setCertificateType] = useState("Delegate");
  const [search, setSearch] = useState("");

  const load = useCallback(() => {
    api.get("/api/certificates").then((response) => setCertificates(response.data.certificates || [])).catch(() => {});
  }, [api]);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = useMemo(() => {
    const term = search.toLowerCase();
    return certificates.filter((certificate) => [certificate.fullName, certificate.registrationCode, certificate.certificateType].join(" ").toLowerCase().includes(term));
  }, [certificates, search]);

  const generate = async () => {
    if (!registrationId.trim()) return;
    await api.post("/api/certificates/generate", { registrationId: registrationId.trim(), certificateType });
    setRegistrationId("");
    load();
  };

  const issued = certificates.filter((item) => item.issued).length;
  const pending = certificates.length - issued;

  return (
    <div className="admin-speakers-page cert-page">
      <section className="admin-panel">
        <div className="speaker-page-top">
          <div>
            <p className="admin-eyebrow">Certificate Engine</p>
            <h1>Certificates</h1>
            <p className="admin-muted">Generate delegate, speaker, volunteer, workshop and research certificates with QR verification.</p>
          </div>
          <Award size={28} />
        </div>
        <div className="ops-kpi-grid checkin-stats">
          <article><FileCheck2 size={20} /><strong>{issued}</strong><span>Issued</span></article>
          <article><Send size={20} /><strong>{pending}</strong><span>Pending</span></article>
        </div>
      </section>

      <section className="admin-panel certificate-form-panel">
        <label>Registration ID<input value={registrationId} onChange={(event) => setRegistrationId(event.target.value)} placeholder="GHC2026-0001" /></label>
        <label>Certificate type
          <select value={certificateType} onChange={(event) => setCertificateType(event.target.value)}>
            {certificateTypes.map((type) => <option key={type} value={type}>{type}</option>)}
          </select>
        </label>
        <button className="admin-primary-button" onClick={generate}><FileCheck2 size={18} /> Generate PDF</button>
      </section>

      <section className="admin-panel">
        <label className="speaker-search"><Search size={17} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search certificates" /></label>
      </section>

      <section className="payment-card-grid">
        {filtered.map((certificate) => (
          <article className="payment-card" key={certificate.id}>
            <div>
              <span className={certificate.issued ? "status-pill paid" : "status-pill pending"}>{certificate.issued ? "issued" : "pending"}</span>
              <strong>{certificate.fullName || "Delegate"}</strong>
              <p>{certificate.registrationCode}</p>
            </div>
            <dl>
              <div><dt>Type</dt><dd>{certificate.certificateType}</dd></div>
              <div><dt>Event</dt><dd>Global Healthcare Conclave 2026</dd></div>
              <div><dt>Verification</dt><dd>QR enabled</dd></div>
            </dl>
            <div className="payment-card-actions">
              {certificate.pdfUrl && <a href={`${api.defaults.baseURL}${certificate.pdfUrl}`} target="_blank" rel="noreferrer"><Download size={17} /> PDF</a>}
            </div>
          </article>
        ))}
      </section>
    </div>
  );
}

export default Certificates;
