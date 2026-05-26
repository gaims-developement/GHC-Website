import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import { ArrowLeft, ArrowRight, CheckCircle2, TicketPercent } from "lucide-react";
import { getWorkshopById, loadWorkshops, normalizeWorkshop, saveWorkshops } from "../data/workshops";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

export default function WorkshopRegister() {
  const { id } = useParams();
  const navigate = useNavigate();
  const localWorkshop = useMemo(() => getWorkshopById(id), [id]);
  const [remoteWorkshop, setRemoteWorkshop] = useState(null);
  const [coupon, setCoupon] = useState("");
  const [paid, setPaid] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", phone: "", institution: "" });
  const workshop = remoteWorkshop || localWorkshop;

  useEffect(() => {
    let active = true;
    axios.get(`${API_BASE_URL}/api/workshops/${id}`)
      .then((response) => {
        if (active && response.data.workshop) setRemoteWorkshop(normalizeWorkshop(response.data.workshop));
      })
      .catch(() => {});
    return () => { active = false; };
  }, [id]);

  const price = Number(workshop?.price || 0);
  const discount = coupon.trim().toUpperCase() === "STUDENT50" ? price * 0.5 : 0;
  const total = Math.max(0, price - discount);

  const update = (event) => setForm((current) => ({ ...current, [event.target.name]: event.target.value }));

  const submit = (event) => {
    event.preventDefault();
    const registrations = JSON.parse(localStorage.getItem("ghc_workshop_registrations") || "[]");
    const registration = {
      id: `wreg-${Date.now()}`,
      workshopId: id,
      workshop: workshop?.title,
      ...form,
      amount: total,
      status: "confirmed",
      createdAt: new Date().toISOString(),
    };
    localStorage.setItem("ghc_workshop_registrations", JSON.stringify([registration, ...registrations]));
    saveWorkshops(loadWorkshops().map((item) => String(item.id) === String(id) ? {
      ...item,
      seats: { ...item.seats, filled: Math.min(Number(item.seats.total || 0), Number(item.seats.filled || 0) + 1) },
    } : item));
    setPaid(true);
  };

  if (!workshop) {
    return (
      <main className="workshop-register-page">
        <div className="workshop-detail-topbar"><button type="button" onClick={() => navigate(-1)}><ArrowLeft className="h-4 w-4" />Back</button></div>
        <section className="workshop-detail-empty"><h1>Workshop not found</h1></section>
      </main>
    );
  }

  return (
    <main className="workshop-register-page">
      <div className="workshop-detail-topbar">
        <button type="button" onClick={() => navigate(-1)}><ArrowLeft className="h-4 w-4" />Back</button>
      </div>
      <section className="workshop-register-shell">
        {paid ? (
          <div className="workshop-payment-success">
            <CheckCircle2 className="h-10 w-10" />
            <h1>Workshop Registration Confirmed</h1>
            <p>Confirmation email, QR code, payment receipt and calendar invite will be sent to {form.email}.</p>
            <a href={`/workshops/${workshop.slug}`}>View Workshop</a>
          </div>
        ) : (
          <>
            <header>
              <span>Workshop checkout</span>
              <h1>Register for Workshop</h1>
              <p>{workshop.title}</p>
            </header>
            <form onSubmit={submit} className="workshop-register-grid">
              <div className="workshop-register-form">
                <label>Name<input name="name" value={form.name} onChange={update} required /></label>
                <label>Email<input name="email" type="email" value={form.email} onChange={update} required /></label>
                <label>Phone<input name="phone" value={form.phone} onChange={update} required /></label>
                <label>Institution<input name="institution" value={form.institution} onChange={update} required /></label>
              </div>
              <aside className="workshop-ticket-summary">
                <h2>Ticket summary</h2>
                <div><span>Workshop</span><strong>{workshop.title}</strong></div>
                <div><span>Price</span><strong>{price ? `₹${price.toLocaleString("en-IN")}` : "Price TBA"}</strong></div>
                <label><TicketPercent className="h-4 w-4" /><input value={coupon} onChange={(event) => setCoupon(event.target.value)} placeholder="Coupon code" /></label>
                {discount > 0 && <div><span>Coupon</span><strong>-₹{discount.toLocaleString("en-IN")}</strong></div>}
                <div className="total"><span>Total</span><strong>{total ? `₹${total.toLocaleString("en-IN")}` : "Pay at venue"}</strong></div>
                <button type="submit">Pay now <ArrowRight className="h-4 w-4" /></button>
              </aside>
            </form>
          </>
        )}
      </section>
    </main>
  );
}
