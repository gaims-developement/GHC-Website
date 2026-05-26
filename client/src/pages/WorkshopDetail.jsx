import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import { ArrowLeft, ArrowRight, CalendarDays, CheckCircle2, Clock3, Image, MapPin, Users, WalletCards } from "lucide-react";
import { categoryColors, formatWorkshopDate, getWorkshopBySlug, getWorkshopTimeRange, normalizeWorkshop } from "../data/workshops";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

const imageSrc = (src) => src?.startsWith("/uploads") ? `${API_BASE_URL}${src}` : src;

const DetailSection = ({ title, children }) => (
  <section className="workshop-detail-block">
    <h2>{title}</h2>
    {children}
  </section>
);

const ListOrPlaceholder = ({ items, placeholder }) => (
  items?.length ? (
    <ul className="workshop-detail-checklist">
      {items.map((item) => <li key={item}><CheckCircle2 className="h-4 w-4" />{item}</li>)}
    </ul>
  ) : <p className="placeholder">{placeholder}</p>
);

export default function WorkshopDetail() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [remoteWorkshop, setRemoteWorkshop] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    setLoading(true);
    axios.get(`${API_BASE_URL}/api/workshops/${slug}`)
      .then((response) => {
        if (active && response.data.workshop) setRemoteWorkshop(normalizeWorkshop(response.data.workshop));
      })
      .catch(() => {
        if (active) setRemoteWorkshop(null);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, [slug]);

  const workshop = useMemo(() => remoteWorkshop || getWorkshopBySlug(slug), [remoteWorkshop, slug]);

  if (!workshop && !loading) {
    return (
      <main className="workshop-detail-page">
        <div className="workshop-detail-topbar">
          <button type="button" onClick={() => navigate(-1)}><ArrowLeft className="h-4 w-4" />Back</button>
        </div>
        <section className="workshop-detail-empty">
          <h1>Workshop not found</h1>
          <p>This workshop may have been removed or is not published yet.</p>
          <button type="button" onClick={() => navigate("/")}>Return Home</button>
        </section>
      </main>
    );
  }

  if (!workshop) {
    return <main className="workshop-detail-page"><section className="workshop-detail-empty"><h1>Loading workshop...</h1></section></main>;
  }

  const colors = categoryColors[workshop.category] || categoryColors.Research;
  const filledPercent = workshop.seats.total ? Math.min(100, (workshop.seats.filled / workshop.seats.total) * 100) : 0;
  const remaining = Math.max(0, workshop.seats.total - workshop.seats.filled);
  const isFull = remaining === 0 && workshop.seats.total > 0;
  const badge = isFull ? "Sold out" : workshop.featured ? "Featured" : workshop.badge || workshop.category;
  const registerHref = `/register/workshop/${workshop.id}`;

  return (
    <main className="workshop-detail-page">
      <div className="workshop-detail-topbar">
        <button type="button" onClick={() => navigate(-1)}><ArrowLeft className="h-4 w-4" />Back</button>
        <a className="primary" href={registerHref}>{isFull ? "Join Waitlist" : "Register"} <ArrowRight className="h-4 w-4" /></a>
      </div>

      <div className="workshop-detail-layout">
        <div className="workshop-detail-main">
          <section className="workshop-hero-image">
            {workshop.image || workshop.imageUrl ? (
              <img src={imageSrc(workshop.image || workshop.imageUrl)} alt={workshop.title} />
            ) : (
              <div><Image className="h-8 w-8" /><span>Cover image not set</span></div>
            )}
            <i />
            <span className={`workshop-hero-badge ${isFull ? "soldout" : ""}`}>{badge}</span>
          </section>

          <section className="workshop-detail-header">
            <div className="workshop-detail-pills">
              <span style={{ background: colors.bg, color: colors.color }}>{workshop.category}</span>
              <span>{workshop.duration || "Duration TBA"}</span>
              <span><WalletCards className="h-3 w-3" />{Number(workshop.price || 0) ? `₹${Number(workshop.price).toLocaleString("en-IN")}` : "Price TBA"}</span>
            </div>
            <h1>{workshop.title}</h1>
            <div className="workshop-detail-facilitator">
              <span>{workshop.facilitator.initials}</span>
              <div>
                <strong>{workshop.facilitator.name || "Faculty TBA"}</strong>
                <small>{workshop.facilitator.designation || "Faculty"}</small>
              </div>
            </div>
            <div className="workshop-detail-meta">
              <span><CalendarDays className="h-4 w-4" />{formatWorkshopDate(workshop.date)}</span>
              <span><Clock3 className="h-4 w-4" />{getWorkshopTimeRange(workshop)}</span>
              <span><MapPin className="h-4 w-4" />{workshop.venue || workshop.room || "Venue TBA"}</span>
              <span><Users className="h-4 w-4" />{remaining} seats remaining</span>
            </div>
          </section>

          <section className="workshop-seat-detail">
            <div>
              <span>Remaining seats</span>
              {isFull ? <b className="full">Sold out</b> : <b>{remaining} available</b>}
            </div>
            <span className="workshop-seat-bar"><i style={{ width: `${filledPercent}%` }} /></span>
          </section>

          <section className="workshop-detail-content">
            <DetailSection title="About workshop">
              <p className={!workshop.description ? "placeholder" : ""}>{workshop.description || "Description not yet added."}</p>
            </DetailSection>

            <DetailSection title="Learning outcomes">
              <ListOrPlaceholder items={workshop.learningOutcomes} placeholder="Learning outcomes will be published soon." />
            </DetailSection>

            <DetailSection title="Faculty">
              <div className="workshop-faculty-card">
                <span>{workshop.facilitator.initials}</span>
                <div><strong>{workshop.facilitator.name || "Faculty TBA"}</strong><p>{workshop.facilitator.designation || "Details will be announced soon."}</p></div>
              </div>
            </DetailSection>

            <DetailSection title="Schedule">
              {workshop.agenda.length ? (
                <div className="workshop-agenda-list">
                  {workshop.agenda.map((item, index) => (
                    <article key={`${item.time}-${item.title}-${index}`}>
                      <time>{item.time || "TBA"}</time>
                      <div>
                        <strong>{item.title}</strong>
                        {item.desc && <p>{item.desc}</p>}
                      </div>
                    </article>
                  ))}
                </div>
              ) : <p className="placeholder">Schedule will be published soon.</p>}
            </DetailSection>

            <DetailSection title="Requirements / prerequisites">
              <div className="workshop-requirements">
                {[...(workshop.requirements || []), ...(workshop.prerequisites ? [workshop.prerequisites] : [])].map((item) => <span key={item}>{item}</span>)}
              </div>
              {!workshop.requirements?.length && !workshop.prerequisites && <p className="placeholder">No special prerequisites announced.</p>}
            </DetailSection>

            <DetailSection title="Who should attend">
              <ListOrPlaceholder items={workshop.whoShouldAttend} placeholder="Audience guidance will be published soon." />
            </DetailSection>

            <DetailSection title="Venue">
              <p>{workshop.venue || workshop.room || "Venue will be announced soon."}</p>
            </DetailSection>

            <DetailSection title="FAQs">
              {workshop.faqs?.length ? (
                <div className="workshop-faq-list">
                  {workshop.faqs.map((item) => <article key={item.question}><strong>{item.question}</strong><p>{item.answer}</p></article>)}
                </div>
              ) : <p className="placeholder">FAQs will be added soon.</p>}
            </DetailSection>
          </section>
        </div>

        <aside className="workshop-register-panel">
          <span>{isFull ? "Sold out" : `${remaining} seats remaining`}</span>
          <strong>{Number(workshop.price || 0) ? `₹${Number(workshop.price).toLocaleString("en-IN")}` : "Price TBA"}</strong>
          <p>{workshop.duration || "Duration TBA"} · {workshop.venue || "Venue TBA"}</p>
          <a href={registerHref}>{isFull ? "Join Waitlist" : "Register for Workshop"} <ArrowRight className="h-4 w-4" /></a>
        </aside>
      </div>

      <div className="workshop-sticky-register">
        <a className={isFull ? "muted" : ""} href={registerHref}>
          {isFull ? "Join Waitlist" : "Register for Workshop"} <ArrowRight className="h-4 w-4" />
        </a>
      </div>
    </main>
  );
}
