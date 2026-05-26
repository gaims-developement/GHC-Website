import { Check, Rocket, X } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

const fallback = ["Payments", "SMTP", "SEO", "Tickets", "Research", "Certificates", "Deploy", "Analytics"].map((label) => ({
  id: label.toLowerCase(),
  label,
  complete: false,
}));

function LaunchChecklist({ api }) {
  const [items, setItems] = useState(fallback);

  const load = useCallback(() => {
    api.get("/api/system/launch-checklist").then((response) => setItems(response.data.items || fallback)).catch(() => {});
  }, [api]);

  useEffect(() => {
    load();
  }, [load]);

  const complete = items.filter((item) => item.complete).length;

  return (
    <div className="admin-speakers-page ops-page">
      <section className="admin-panel">
        <div className="speaker-page-top">
          <div>
            <p className="admin-eyebrow">Launch Tools</p>
            <h1>Launch Checklist</h1>
            <p className="admin-muted">{complete} of {items.length} launch checks are complete.</p>
          </div>
          <Rocket size={30} />
        </div>
      </section>

      <section className="payment-card-grid">
        {items.map((item) => (
          <article className="payment-card launch-check-card" key={item.id}>
            <div>
              <span className={item.complete ? "status-pill paid" : "status-pill pending"}>{item.complete ? "ready" : "needs review"}</span>
              <strong>{item.label}</strong>
            </div>
            <div className="launch-check-icon">
              {item.complete ? <Check size={24} /> : <X size={24} />}
            </div>
          </article>
        ))}
      </section>
    </div>
  );
}

export default LaunchChecklist;
