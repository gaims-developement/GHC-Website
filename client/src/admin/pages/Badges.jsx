import { BadgeCheck, Download, FileStack } from "lucide-react";
import { useEffect, useState } from "react";

function Badges({ api }) {
  const [badges, setBadges] = useState([]);

  const load = () => api.get("/api/register/badges?limit=200").then((response) => setBadges(response.data.badges || []));

  useEffect(() => {
    load().catch(() => {});
  }, [api]);

  const markGenerated = async (registration) => {
    await api.patch(`/api/register/${registration.id}/badge`);
    load();
  };

  const printBadge = (registration) => {
    const html = `<html><body style="font-family:Arial;padding:32px"><div style="width:320px;border:1px solid #ddd;padding:24px;text-align:center"><h2>${registration.fullName}</h2><p>${registration.institution || ""}</p><strong>${registration.registrationId}</strong><p>${registration.ticketName || ""}</p>${registration.qrCode ? `<img src="${registration.qrCode}" style="width:140px;height:140px"/>` : ""}</div><script>window.print()</script></body></html>`;
    const win = window.open("", "_blank");
    win.document.write(html);
    win.document.close();
    markGenerated(registration);
  };

  return (
    <div className="admin-speakers-page">
      <section className="admin-panel">
        <div className="admin-panel-heading">
          <div>
            <p className="admin-eyebrow">Badge Management</p>
            <h1>Conference Badges</h1>
            <p className="admin-muted">Generate badges with name, institution, registration ID, QR code and category.</p>
          </div>
          <button className="admin-primary-button" type="button" onClick={() => badges.forEach(printBadge)}><FileStack size={18} /> Bulk Generate</button>
        </div>
      </section>
      <section className="payment-card-grid">
        {badges.map((registration) => (
          <article className="payment-card" key={registration.id}>
            <div>
              <span className={registration.badgeGenerated ? "status-pill accepted" : "status-pill pending"}>{registration.badgeGenerated ? "generated" : "pending"}</span>
              <strong>{registration.fullName}</strong>
              <p>{registration.registrationId}</p>
            </div>
            <dl>
              <div><dt>Institution</dt><dd>{registration.institution || "-"}</dd></div>
              <div><dt>Category</dt><dd>{registration.ticketName || "-"}</dd></div>
            </dl>
            {registration.qrCode && <img className="badge-qr" src={registration.qrCode} alt="" />}
            <button className="admin-secondary-button" type="button" onClick={() => printBadge(registration)}><Download size={17} /> PDF</button>
          </article>
        ))}
        {!badges.length && <div className="admin-empty-state"><BadgeCheck size={18} /> No badges ready</div>}
      </section>
    </div>
  );
}

export default Badges;
