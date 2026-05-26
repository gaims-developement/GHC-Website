import { Banknote, Clock3, Download, RefreshCcw, RotateCcw, Search, TrendingUp } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

const filters = ["all", "paid", "failed", "refunded", "pending"];

function Payments({ api }) {
  const [payments, setPayments] = useState([]);
  const [stats, setStats] = useState({ revenue: 0, paid: 0, refunds: 0, pending: 0 });
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  const loadPayments = useCallback(() => {
    const params = new URLSearchParams();
    if (filter !== "all") params.set("status", filter);
    if (debouncedSearch) params.set("search", debouncedSearch);
    api.get(`/api/payments?${params.toString()}`).then((response) => {
      setPayments(response.data.payments || []);
      setStats(response.data.stats || { revenue: 0, paid: 0, refunds: 0, pending: 0 });
    });
  }, [api, debouncedSearch, filter]);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    loadPayments();
  }, [loadPayments]);

  const chartSegments = useMemo(() => {
    const total = Math.max(payments.length, 1);
    return filters.slice(1).map((status) => ({
      status,
      count: payments.filter((payment) => payment.status === status || (status === "pending" && ["created", "pending"].includes(payment.status))).length,
      width: `${Math.max((payments.filter((payment) => payment.status === status || (status === "pending" && ["created", "pending"].includes(payment.status))).length / total) * 100, 6)}%`,
    }));
  }, [payments]);

  const refund = async (payment) => {
    await api.post("/api/payments/refund", { paymentId: payment.id });
    loadPayments();
  };

  return (
    <div className="admin-speakers-page admin-payments-page">
      <section className="admin-panel">
        <div className="speaker-page-top">
          <div>
            <p className="admin-eyebrow">Payment CMS</p>
            <h1>Payments</h1>
            <p className="admin-muted">Revenue, Razorpay transactions, refunds, invoices and payment state.</p>
          </div>
          <button className="admin-primary-button" onClick={loadPayments}><RefreshCcw size={18} /> Refresh</button>
        </div>

        <div className="payment-kpi-grid">
          <article><TrendingUp size={20} /><strong>INR {Number(stats.revenue || 0).toLocaleString("en-IN")}</strong><span>Revenue</span></article>
          <article><Banknote size={20} /><strong>{stats.paid}</strong><span>Paid registrations</span></article>
          <article><RotateCcw size={20} /><strong>{stats.refunds}</strong><span>Refunds</span></article>
          <article><Clock3 size={20} /><strong>{stats.pending}</strong><span>Pending</span></article>
        </div>

        <div className="payment-chart" aria-label="Payment status chart">
          {chartSegments.map((segment) => <span key={segment.status} className={segment.status} style={{ width: segment.width }}>{segment.count} {segment.status}</span>)}
        </div>

        <div className="speaker-toolbar">
          <label className="speaker-search"><Search size={17} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search payments" /></label>
          <div className="speaker-filter-row">
            {filters.map((item) => <button key={item} className={filter === item ? "active" : ""} onClick={() => setFilter(item)}>{item}</button>)}
          </div>
        </div>
      </section>

      <section className="payment-card-grid">
        {payments.map((payment) => (
          <article className="payment-card" key={payment.id}>
            <div>
              <span className={`status-pill ${payment.status}`}>{payment.status}</span>
              <strong>{payment.fullName || "Delegate"}</strong>
              <p>{payment.email}</p>
            </div>
            <dl>
              <div><dt>Ticket</dt><dd>{payment.ticketName}</dd></div>
              <div><dt>Amount</dt><dd>{payment.currency} {payment.amount}</dd></div>
              <div><dt>Transaction</dt><dd>{payment.providerPaymentId || payment.providerOrderId}</dd></div>
              <div><dt>Provider</dt><dd>{payment.paymentProvider}</dd></div>
            </dl>
            <div className="payment-card-actions">
              {payment.invoiceUrl && <a href={`${api.defaults.baseURL}${payment.invoiceUrl}`} target="_blank" rel="noreferrer"><Download size={17} /> Invoice</a>}
              {payment.status === "paid" && <button onClick={() => refund(payment)}><RotateCcw size={17} /> Refund</button>}
            </div>
          </article>
        ))}
        {!payments.length && <div className="admin-empty-state">No payments found</div>}
      </section>
    </div>
  );
}

export default Payments;
