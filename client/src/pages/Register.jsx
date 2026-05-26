import axios from "axios";
import { ArrowLeft, ArrowRight, BadgeCheck, Check, Download, QrCode, ReceiptText, ShieldCheck, Tag, Ticket } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { setPageSeo, trackEvent } from "../utils/seo";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";
const GST_RATE = 0.18;

const emptyForm = {
  fullName: "",
  email: "",
  phone: "",
  institution: "",
  country: "",
  city: "",
  designation: "",
};

const loadRazorpay = () =>
  new Promise((resolve) => {
    if (window.Razorpay) return resolve(true);
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });

const money = (value, currency = "INR") =>
  `${currency} ${Number(value || 0).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;

function Register() {
  const [tickets, setTickets] = useState([]);
  const [selectedTicketId, setSelectedTicketId] = useState("");
  const [form, setForm] = useState(() => JSON.parse(localStorage.getItem("ghc_registration_draft") || "null") || emptyForm);
  const [step, setStep] = useState(1);
  const [couponCode, setCouponCode] = useState("");
  const [coupon, setCoupon] = useState(null);
  const [couponMessage, setCouponMessage] = useState("");
  const [registration, setRegistration] = useState(null);
  const [confirmation, setConfirmation] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const selectedTicket = useMemo(() =>
    tickets.find((t) => String(t.id) === String(selectedTicketId)),
    [selectedTicketId, tickets]
  );

  const totals = useMemo(() => {
    const subtotal = Number(selectedTicket?.price || 0);
    const discount = coupon?.discountType === "percent"
      ? subtotal * (Number(coupon.discountValue || 0) / 100)
      : Math.min(Number(coupon?.discountValue || 0), subtotal);
    const taxable = Math.max(subtotal - discount, 0);
    const gst = taxable * GST_RATE;
    return { subtotal, discount, gst, total: taxable + gst, currency: selectedTicket?.currency || "INR" };
  }, [coupon, selectedTicket]);

  useEffect(() => {
    setPageSeo({
      title: "Register",
      description: "Register and pay securely for Global Healthcare Conclave 2026.",
      path: "/register",
      schema: { "@context": "https://schema.org", "@type": "RegisterAction", name: "GHC 2026 Registration" },
    });
    axios.get(`${API_BASE_URL}/api/tickets`).then((res) => {
      const nextTickets = res.data.tickets || [];
      setTickets(nextTickets);
      setSelectedTicketId((cur) => cur || nextTickets[0]?.id || "");
    }).catch(() => {});
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => localStorage.setItem("ghc_registration_draft", JSON.stringify(form)), 500);
    return () => clearTimeout(timer);
  }, [form]);

  useEffect(() => { setCoupon(null); setCouponMessage(""); }, [selectedTicketId]);

  const setValue = (key, value) => setForm((cur) => ({ ...cur, [key]: value }));

  const validateDetails = () => {
    if (!selectedTicketId) return "Choose a ticket to continue.";
    if (!form.fullName.trim()) return "Full name is required.";
    if (!form.email.trim()) return "Email is required.";
    return "";
  };

  const applyCoupon = async () => {
    if (!couponCode.trim()) return;
    setCouponMessage("");
    try {
      const res = await axios.post(`${API_BASE_URL}/api/coupons/validate`, {
        code: couponCode, ticketTypeId: selectedTicketId, registrationId: registration?.id,
      });
      setCoupon(res.data.coupon);
      setCouponMessage(`${res.data.coupon.code} applied`);
    } catch (e) {
      setCoupon(null);
      setCouponMessage(e.response?.data?.message || "Coupon not valid");
    }
  };

  const ensureRegistration = async () => {
    if (registration) return registration;
    const res = await axios.post(`${API_BASE_URL}/api/register`, { ...form, ticketTypeId: selectedTicketId });
    trackEvent("register_click", { ticket_type_id: selectedTicketId });
    setRegistration(res.data.registration);
    localStorage.removeItem("ghc_registration_draft");
    return res.data.registration;
  };

  const pay = async () => {
    setBusy(true); setError("");
    try {
      const reg = await ensureRegistration();
      const loaded = await loadRazorpay();
      if (!loaded) throw new Error("Razorpay checkout could not be loaded.");
      const orderRes = await axios.post(`${API_BASE_URL}/api/payments/create-order`, {
        registrationId: reg.id, couponCode: coupon?.code || couponCode, provider: "razorpay",
      });
      const { order, keyId } = orderRes.data;
      if (!keyId) throw new Error("Razorpay key is not configured.");
      const checkout = new window.Razorpay({
        key: keyId, amount: order.amount, currency: order.currency,
        name: "Global Healthcare Conclave", description: selectedTicket?.name,
        order_id: order.id,
        prefill: { name: form.fullName, email: form.email, contact: form.phone },
        theme: { color: "#ff3d7f" },
        handler: async (payload) => {
          const verifyRes = await axios.post(`${API_BASE_URL}/api/payments/verify`, { ...payload, provider: "razorpay" });
          trackEvent("payment_success", { ticket_type_id: selectedTicketId, value: totals.total });
          setConfirmation(verifyRes.data); setStep(4); setBusy(false);
        },
        modal: { ondismiss: () => setBusy(false) },
      });
      checkout.open();
    } catch (e) {
      setError(e.response?.data?.message || e.message || "Payment could not be started.");
      setBusy(false);
    }
  };

  const next = async () => {
    setError("");
    if (step === 2) { const err = validateDetails(); if (err) { setError(err); return; } }
    if (step === 3) await pay();
    else setStep((cur) => Math.min(cur + 1, 3));
  };

  const progress = confirmation ? 100 : Math.round((step / 4) * 100);
  const invoiceUrl = confirmation?.payment?.invoiceUrl ? `${API_BASE_URL}${confirmation.payment.invoiceUrl}` : "";
  const ticketUrl = confirmation?.payment?.receiptUrl ? `${API_BASE_URL}${confirmation.payment.receiptUrl}` : "";

  const stepLabels = ["Choose Pass", "Your Details", "Confirm & Pay"];

  return (
    <div style={{ background: '#0a0a0f', minHeight: '100vh', fontFamily: "'Syne', sans-serif", color: '#fff' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:wght@300;400;500&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }

        .reg-header {
          display: flex; align-items: center; justify-content: space-between;
          padding: 18px 48px;
          border-bottom: 1px solid rgba(255,255,255,0.06);
          background: rgba(10,10,15,0.9); backdrop-filter: blur(20px);
          position: sticky; top: 0; z-index: 100;
        }
        .reg-header-back {
          display: flex; align-items: center; gap: 8px;
          color: rgba(255,255,255,0.6); text-decoration: none;
          font-size: 14px; font-family: 'DM Sans', sans-serif;
          transition: color 0.2s;
        }
        .reg-header-back:hover { color: #fff; }
        .reg-header-title {
          font-size: 13px; font-weight: 600; letter-spacing: 0.1em;
          text-transform: uppercase; color: rgba(255,255,255,0.4);
          font-family: 'DM Sans', sans-serif;
        }
        .reg-header-secure {
          display: flex; align-items: center; gap: 6px;
          font-size: 12px; color: rgba(255,255,255,0.4); font-family: 'DM Sans', sans-serif;
        }

        .reg-progress-bar {
          height: 2px; background: rgba(255,255,255,0.06);
          position: relative;
        }
        .reg-progress-fill {
          height: 100%; background: linear-gradient(90deg, #ff6b9d, #ff3d7f, #c026d3);
          transition: width 0.5s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .reg-step-nav {
          display: flex; justify-content: center; gap: 0;
          padding: 32px 48px 0; max-width: 700px; margin: 0 auto;
        }
        .reg-step-item {
          display: flex; align-items: center; gap: 10px; flex: 1;
        }
        .reg-step-num {
          width: 32px; height: 32px; border-radius: 50%;
          border: 2px solid rgba(255,255,255,0.15);
          background: transparent;
          display: flex; align-items: center; justify-content: center;
          font-size: 13px; font-weight: 700; flex-shrink: 0;
          transition: all 0.3s;
        }
        .reg-step-num.active {
          border-color: #ff3d7f;
          background: linear-gradient(135deg, #ff6b9d, #ff3d7f);
          box-shadow: 0 0 20px rgba(255,61,127,0.4);
        }
        .reg-step-num.done {
          border-color: #ff3d7f; background: rgba(255,61,127,0.15);
          color: #ff6b9d;
        }
        .reg-step-label {
          font-size: 12px; font-family: 'DM Sans', sans-serif;
          color: rgba(255,255,255,0.4); white-space: nowrap;
        }
        .reg-step-label.active { color: rgba(255,255,255,0.85); }
        .reg-step-line {
          flex: 1; height: 1px; background: rgba(255,255,255,0.1); margin: 0 10px;
        }

        .reg-body {
          max-width: 900px; margin: 0 auto; padding: 48px 48px 160px;
        }

        .reg-kicker {
          font-size: 11px; letter-spacing: 0.18em; text-transform: uppercase;
          color: #ff6b9d; font-family: 'DM Sans', sans-serif; font-weight: 600;
          margin-bottom: 12px;
        }
        .reg-title {
          font-size: clamp(2rem, 4vw, 2.8rem); font-weight: 800;
          letter-spacing: -1.5px; margin-bottom: 36px;
        }

        /* Ticket cards */
        .ticket-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 16px; }
        .ticket-card {
          border-radius: 20px; padding: 28px 24px;
          border: 1px solid rgba(255,255,255,0.08);
          background: rgba(255,255,255,0.03);
          cursor: pointer; text-align: left;
          transition: all 0.3s; position: relative; overflow: hidden;
        }
        .ticket-card:hover { border-color: rgba(255,61,127,0.3); background: rgba(255,61,127,0.05); transform: translateY(-3px); }
        .ticket-card.active {
          border-color: #ff3d7f; background: rgba(255,61,127,0.1);
          box-shadow: 0 0 0 1px #ff3d7f, 0 8px 30px rgba(255,61,127,0.2);
        }
        .ticket-card-glow {
          position: absolute; top: -30px; right: -30px; width: 120px; height: 120px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(255,61,127,0.15), transparent 70%);
          pointer-events: none; opacity: 0; transition: opacity 0.3s;
        }
        .ticket-card.active .ticket-card-glow { opacity: 1; }
        .ticket-icon { color: #ff6b9d; margin-bottom: 16px; }
        .ticket-name { font-size: 17px; font-weight: 700; margin-bottom: 10px; }
        .ticket-desc { font-size: 13px; color: rgba(255,255,255,0.5); font-family: 'DM Sans', sans-serif; line-height: 1.55; margin-bottom: 20px; }
        .ticket-price { font-size: 1.5rem; font-weight: 800; letter-spacing: -1px; background: linear-gradient(135deg, #ff6b9d, #ff3d7f); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; }
        .ticket-seats { font-size: 12px; color: rgba(255,255,255,0.35); font-family: 'DM Sans', sans-serif; margin-top: 6px; }

        /* Form */
        .form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
        .form-label { display: flex; flex-direction: column; gap: 8px; font-size: 13px; font-weight: 600; letter-spacing: 0.04em; color: rgba(255,255,255,0.7); font-family: 'DM Sans', sans-serif; }
        .form-label input {
          padding: 14px 18px; border-radius: 12px;
          border: 1px solid rgba(255,255,255,0.1);
          background: rgba(255,255,255,0.04);
          color: #fff; font-size: 15px; font-family: 'DM Sans', sans-serif;
          outline: none; transition: border-color 0.2s, background 0.2s;
        }
        .form-label input:focus { border-color: rgba(255,61,127,0.5); background: rgba(255,61,127,0.05); }
        .form-label input::placeholder { color: rgba(255,255,255,0.25); }

        /* Review */
        .review-grid { display: grid; grid-template-columns: 1fr 360px; gap: 32px; align-items: start; }
        .review-card {
          border-radius: 20px; padding: 28px;
          border: 1px solid rgba(255,255,255,0.08);
          background: rgba(255,255,255,0.03);
          display: flex; flex-direction: column; gap: 10px;
          margin-bottom: 20px;
        }
        .review-card strong { font-size: 18px; font-weight: 700; }
        .review-card span { font-size: 14px; color: rgba(255,255,255,0.5); font-family: 'DM Sans', sans-serif; }
        .review-card-badge {
          display: inline-flex; align-items: center; gap: 8px;
          margin-top: 4px; font-size: 13px; color: #ff6b9d;
          font-family: 'DM Sans', sans-serif;
        }
        .coupon-row {
          display: flex; gap: 10px; align-items: center;
          padding: 16px 18px; border-radius: 14px;
          border: 1px solid rgba(255,255,255,0.08);
          background: rgba(255,255,255,0.02);
        }
        .coupon-row input {
          flex: 1; background: none; border: none; outline: none;
          color: #fff; font-size: 14px; font-family: 'DM Sans', sans-serif;
          letter-spacing: 0.08em;
        }
        .coupon-row input::placeholder { color: rgba(255,255,255,0.25); }
        .coupon-row button {
          padding: 8px 18px; border-radius: 100px;
          background: linear-gradient(135deg, #ff6b9d, #ff3d7f);
          border: none; color: #fff; font-size: 13px; font-weight: 600;
          cursor: pointer; font-family: 'DM Sans', sans-serif;
          transition: opacity 0.2s;
        }
        .coupon-row button:hover { opacity: 0.85; }
        .coupon-msg { font-size: 13px; margin-top: 10px; font-family: 'DM Sans', sans-serif; }
        .coupon-msg.ok { color: #4ade80; }
        .coupon-msg.err { color: #f87171; }

        .summary-card {
          border-radius: 20px; padding: 28px;
          border: 1px solid rgba(255,255,255,0.08);
          background: rgba(255,255,255,0.03);
          position: sticky; top: 90px;
        }
        .summary-title { display: flex; align-items: center; gap: 10px; font-size: 16px; font-weight: 700; margin-bottom: 24px; }
        .summary-rows { display: flex; flex-direction: column; gap: 14px; }
        .summary-row { display: flex; justify-content: space-between; font-size: 14px; font-family: 'DM Sans', sans-serif; color: rgba(255,255,255,0.6); }
        .summary-row.total { padding-top: 16px; border-top: 1px solid rgba(255,255,255,0.08); font-size: 16px; font-weight: 700; color: #fff; }
        .summary-row.total dd { color: #ff6b9d; }
        .summary-secure { display: flex; align-items: center; gap: 8px; margin-top: 20px; font-size: 12px; color: rgba(255,255,255,0.35); font-family: 'DM Sans', sans-serif; }

        /* Success */
        .success-step { text-align: center; max-width: 480px; margin: 0 auto; }
        .success-card {
          border-radius: 24px; padding: 40px 32px;
          border: 1px solid rgba(255,61,127,0.2);
          background: linear-gradient(145deg, rgba(255,61,127,0.1), rgba(192,38,211,0.06));
          margin-top: 32px;
        }
        .success-card img { width: 160px; height: 160px; border-radius: 12px; margin: 16px auto; display: block; }
        .success-id { font-size: 22px; font-weight: 800; letter-spacing: -0.5px; margin-top: 16px; }
        .success-name { font-size: 15px; color: rgba(255,255,255,0.6); font-family: 'DM Sans', sans-serif; margin-top: 6px; }
        .success-ticket { display: inline-block; margin-top: 10px; padding: 6px 14px; border-radius: 100px; background: rgba(255,61,127,0.15); border: 1px solid rgba(255,61,127,0.3); font-size: 13px; color: #ff6b9d; font-family: 'DM Sans', sans-serif; }
        .success-actions { display: flex; gap: 12px; justify-content: center; margin-top: 28px; flex-wrap: wrap; }
        .success-actions a {
          display: inline-flex; align-items: center; gap: 8px;
          padding: 11px 20px; border-radius: 100px;
          border: 1px solid rgba(255,61,127,0.3); background: rgba(255,61,127,0.1);
          color: #ff6b9d; font-size: 13px; font-weight: 600;
          text-decoration: none; font-family: 'DM Sans', sans-serif;
          transition: background 0.2s, border-color 0.2s;
        }
        .success-actions a:hover { background: rgba(255,61,127,0.2); border-color: rgba(255,61,127,0.5); }

        .reg-error {
          margin-top: 16px; padding: 14px 18px; border-radius: 12px;
          background: rgba(248,113,113,0.1); border: 1px solid rgba(248,113,113,0.25);
          color: #f87171; font-size: 14px; font-family: 'DM Sans', sans-serif;
        }

        /* Bottom bar */
        .reg-bottom {
          position: fixed; bottom: 0; left: 0; right: 0;
          padding: 16px 48px;
          background: rgba(10,10,15,0.95); backdrop-filter: blur(20px);
          border-top: 1px solid rgba(255,255,255,0.06);
          display: flex; align-items: center; justify-content: space-between;
          gap: 16px;
        }
        .reg-bottom-back {
          padding: 12px 24px; border-radius: 100px;
          border: 1px solid rgba(255,255,255,0.1); background: rgba(255,255,255,0.04);
          color: rgba(255,255,255,0.6); font-size: 14px; font-weight: 500;
          cursor: pointer; font-family: 'DM Sans', sans-serif;
          transition: all 0.2s;
        }
        .reg-bottom-back:disabled { opacity: 0.3; cursor: not-allowed; }
        .reg-bottom-back:not(:disabled):hover { color: #fff; border-color: rgba(255,255,255,0.25); }
        .reg-bottom-right { display: flex; align-items: center; gap: 16px; }
        .reg-bottom-price { font-size: 15px; color: rgba(255,255,255,0.5); font-family: 'DM Sans', sans-serif; }
        .reg-bottom-next {
          display: inline-flex; align-items: center; gap: 8px;
          padding: 14px 28px; border-radius: 100px;
          background: linear-gradient(135deg, #ff6b9d, #ff3d7f);
          border: none; color: #fff; font-size: 14px; font-weight: 600;
          cursor: pointer; font-family: 'DM Sans', sans-serif;
          box-shadow: 0 8px 30px rgba(255,61,127,0.4);
          transition: opacity 0.2s, transform 0.2s;
        }
        .reg-bottom-next:disabled { opacity: 0.5; cursor: not-allowed; transform: none; }
        .reg-bottom-next:not(:disabled):hover { transform: translateY(-2px); }

        .reg-home-link {
          display: flex; justify-content: center; padding: 32px;
        }
        .reg-home-link a {
          display: inline-flex; align-items: center; gap: 8px;
          padding: 14px 28px; border-radius: 100px;
          background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1);
          color: rgba(255,255,255,0.7); text-decoration: none;
          font-size: 14px; font-family: 'DM Sans', sans-serif;
          transition: all 0.2s;
        }
        .reg-home-link a:hover { background: rgba(255,255,255,0.08); color: #fff; }

        @media (max-width: 768px) {
          .reg-header { padding: 16px 20px; }
          .reg-body { padding: 32px 20px 140px; }
          .form-grid { grid-template-columns: 1fr; }
          .review-grid { grid-template-columns: 1fr; }
          .reg-bottom { padding: 14px 20px; }
          .ticket-grid { grid-template-columns: 1fr; }
        }
      `}</style>

      {/* Header */}
      <header className="reg-header">
        <a href="/" className="reg-header-back"><ArrowLeft size={16} /> GHC 2026</a>
        <span className="reg-header-title">Secure Checkout</span>
        <div className="reg-header-secure"><ShieldCheck size={14} /> Razorpay</div>
      </header>

      {/* Progress */}
      <div className="reg-progress-bar">
        <div className="reg-progress-fill" style={{ width: `${progress}%` }} />
      </div>

      {/* Step indicators */}
      {!confirmation && (
        <div className="reg-step-nav">
          {stepLabels.map((label, i) => {
            const n = i + 1;
            const isActive = step === n;
            const isDone = step > n;
            return (
              <div className="reg-step-item" key={label}>
                <div className={`reg-step-num ${isActive ? 'active' : isDone ? 'done' : ''}`}>
                  {isDone ? <Check size={14} /> : n}
                </div>
                <span className={`reg-step-label ${isActive ? 'active' : ''}`}>{label}</span>
                {i < stepLabels.length - 1 && <div className="reg-step-line" />}
              </div>
            );
          })}
        </div>
      )}

      <div className="reg-body">

        {/* Step 1 */}
        {step === 1 && (
          <div>
            <p className="reg-kicker">Step 1 of 3</p>
            <h1 className="reg-title">Choose your pass.</h1>
            <div className="ticket-grid">
              {tickets.map((ticket) => (
                <button
                  key={ticket.id}
                  className={`ticket-card${String(selectedTicketId) === String(ticket.id) ? ' active' : ''}`}
                  onClick={() => setSelectedTicketId(ticket.id)}
                >
                  <div className="ticket-card-glow" />
                  <div className="ticket-icon"><Ticket size={24} /></div>
                  <div className="ticket-name">{ticket.name}</div>
                  <div className="ticket-desc">{ticket.description}</div>
                  <div className="ticket-price">{money(ticket.price, ticket.currency)}</div>
                  <div className="ticket-seats">{ticket.remaining} seats remaining</div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 2 */}
        {step === 2 && (
          <div>
            <p className="reg-kicker">Step 2 of 3</p>
            <h1 className="reg-title">Your details.</h1>
            <div className="form-grid">
              <label className="form-label">Full name<input value={form.fullName} onChange={(e) => setValue("fullName", e.target.value)} placeholder="Dr. Jane Smith" /></label>
              <label className="form-label">Email<input type="email" value={form.email} onChange={(e) => setValue("email", e.target.value)} placeholder="jane@hospital.com" /></label>
              <label className="form-label">Phone<input value={form.phone} onChange={(e) => setValue("phone", e.target.value)} placeholder="+91 98765 43210" /></label>
              <label className="form-label">Institution<input value={form.institution} onChange={(e) => setValue("institution", e.target.value)} placeholder="AIIMS, New Delhi" /></label>
              <label className="form-label">Designation<input value={form.designation} onChange={(e) => setValue("designation", e.target.value)} placeholder="Senior Cardiologist" /></label>
              <label className="form-label">Country<input value={form.country} onChange={(e) => setValue("country", e.target.value)} placeholder="India" /></label>
              <label className="form-label">City<input value={form.city} onChange={(e) => setValue("city", e.target.value)} placeholder="Mumbai" /></label>
            </div>
          </div>
        )}

        {/* Step 3 */}
        {step === 3 && (
          <div>
            <p className="reg-kicker">Step 3 of 3</p>
            <h1 className="reg-title">Confirm and pay.</h1>
            <div className="review-grid">
              <div>
                <div className="review-card">
                  <strong>{form.fullName}</strong>
                  <span>{form.email}</span>
                  {form.phone && <span>{form.phone}</span>}
                  <div className="review-card-badge"><BadgeCheck size={16} /> {selectedTicket?.name}</div>
                </div>

                <div className="coupon-row">
                  <Tag size={16} style={{ color: 'rgba(255,255,255,0.3)', flexShrink: 0 }} />
                  <input
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                    placeholder="Enter coupon code"
                  />
                  <button type="button" onClick={applyCoupon}>Apply</button>
                </div>
                {couponMessage && (
                  <p className={`coupon-msg ${coupon ? 'ok' : 'err'}`}>{couponMessage}</p>
                )}
              </div>

              <aside className="summary-card">
                <div className="summary-title"><ReceiptText size={18} /> Ticket Summary</div>
                <div className="summary-rows">
                  <div className="summary-row"><dt>Ticket</dt><dd>{selectedTicket?.name}</dd></div>
                  <div className="summary-row"><dt>Subtotal</dt><dd>{money(totals.subtotal, totals.currency)}</dd></div>
                  <div className="summary-row"><dt>Discount</dt><dd style={{ color: '#4ade80' }}>-{money(totals.discount, totals.currency)}</dd></div>
                  <div className="summary-row"><dt>GST (18%)</dt><dd>{money(totals.gst, totals.currency)}</dd></div>
                  <div className="summary-row total"><dt>Total</dt><dd>{money(totals.total, totals.currency)}</dd></div>
                </div>
                <div className="summary-secure"><ShieldCheck size={13} /> Secured by Razorpay</div>
              </aside>
            </div>
          </div>
        )}

        {/* Step 4 — Success */}
        {step === 4 && confirmation && (
          <div className="success-step">
            <p className="reg-kicker">Payment Successful</p>
            <h1 className="reg-title">Your ticket is ready.</h1>
            <div className="success-card">
              <QrCode size={36} style={{ color: '#ff6b9d', margin: '0 auto', display: 'block' }} />
              {confirmation.registration.qrCode && (
                <img src={confirmation.registration.qrCode} alt="QR Code" />
              )}
              <div className="success-id">{confirmation.registration.registrationId}</div>
              <div className="success-name">{confirmation.registration.fullName}</div>
              <div className="success-ticket">{confirmation.registration.ticketName}</div>
              <div className="success-actions">
                {ticketUrl && <a href={ticketUrl} target="_blank" rel="noreferrer"><Download size={14} /> Ticket</a>}
                {invoiceUrl && <a href={invoiceUrl} target="_blank" rel="noreferrer"><Download size={14} /> Invoice</a>}
                <a href={confirmation.registration.qrCode} download={`GHC-${confirmation.registration.registrationId}-QR.png`}>
                  <QrCode size={14} /> QR Code
                </a>
              </div>
            </div>
          </div>
        )}

        {error && <div className="reg-error">{error}</div>}
      </div>

      {/* Bottom nav */}
      {!confirmation && (
        <nav className="reg-bottom">
          <button
            className="reg-bottom-back"
            disabled={step === 1 || busy}
            onClick={() => setStep((cur) => Math.max(cur - 1, 1))}
          >
            Back
          </button>
          <div className="reg-bottom-right">
            <span className="reg-bottom-price">
              {step === 3 ? money(totals.total, totals.currency) : selectedTicket?.name || 'Select a ticket'}
            </span>
            <button className="reg-bottom-next" disabled={busy} onClick={next}>
              {step === 3 ? (busy ? 'Processing…' : 'Pay Now') : 'Next'} <ArrowRight size={16} />
            </button>
          </div>
        </nav>
      )}

      {confirmation && (
        <div className="reg-home-link">
          <a href="/"><Check size={16} /> Return to site</a>
        </div>
      )}
    </div>
  );
}

export default Register;